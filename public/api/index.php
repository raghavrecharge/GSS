<?php
declare(strict_types=1);

ini_set('session.use_strict_mode', '1');
ini_set('session.use_only_cookies', '1');
session_name('gss_admin');
session_set_cookie_params([
    'lifetime' => 60 * 60 * 8,
    'path' => '/',
    'secure' => true,
    'httponly' => true,
    'samesite' => 'Strict',
]);
session_start();

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('Referrer-Policy: no-referrer');
header('Cache-Control: no-store');
header("Content-Security-Policy: default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'");
header('Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()');
if (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') header('Strict-Transport-Security: max-age=31536000; includeSubDomains');

function respond(int $status, array $payload): never {
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

function database(): PDO {
    static $pdo = null;
    if ($pdo instanceof PDO) return $pdo;

    $dsn = getenv('GSS_DATABASE_DSN');
    $user = getenv('GSS_DATABASE_USER') ?: null;
    $password = getenv('GSS_DATABASE_PASSWORD') ?: null;
    if (!$dsn) {
        $storage = getenv('GSS_DATA_DIR') ?: dirname((string)($_SERVER['DOCUMENT_ROOT'] ?? __DIR__), 1) . DIRECTORY_SEPARATOR . 'gss-data';
        if (!is_dir($storage) && !mkdir($storage, 0750, true) && !is_dir($storage)) {
            throw new RuntimeException('Unable to create private data directory.');
        }
        $dsn = 'sqlite:' . $storage . DIRECTORY_SEPARATOR . 'catalog.sqlite';
    }
    $pdo = new PDO($dsn, $user, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
    $driver = $pdo->getAttribute(PDO::ATTR_DRIVER_NAME);
    if ($driver === 'sqlite') {
        $pdo->exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;');
        $pdo->exec('CREATE TABLE IF NOT EXISTS courses (
            id INTEGER PRIMARY KEY AUTOINCREMENT, slug TEXT NOT NULL UNIQUE, title TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT "published" CHECK(status IN ("draft", "review", "published")),
            payload_json TEXT NOT NULL, version INTEGER NOT NULL DEFAULT 1,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )');
        $pdo->exec('CREATE TABLE IF NOT EXISTS audit_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT, event TEXT NOT NULL, course_slug TEXT,
            actor TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )');
        $pdo->exec('CREATE TABLE IF NOT EXISTS datasets (
            dataset_key TEXT NOT NULL, record_key TEXT NOT NULL, payload_json TEXT NOT NULL,
            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY(dataset_key, record_key)
        )');
        $pdo->exec('CREATE TABLE IF NOT EXISTS applications (
            id INTEGER PRIMARY KEY AUTOINCREMENT, reference TEXT NOT NULL UNIQUE, course_slug TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT "submitted" CHECK(status IN ("submitted", "review", "accepted", "declined", "withdrawn")),
            pii_ciphertext TEXT NOT NULL, pii_nonce TEXT NOT NULL, access_token_hash TEXT NOT NULL,
            ip_hash TEXT NOT NULL, consent_at TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(course_slug) REFERENCES courses(slug)
        )');
    } elseif ($driver === 'mysql') {
        $pdo->exec('CREATE TABLE IF NOT EXISTS courses (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY, slug VARCHAR(190) NOT NULL UNIQUE,
            title VARCHAR(500) NOT NULL, status ENUM("draft", "review", "published") NOT NULL DEFAULT "published",
            payload_json LONGTEXT NOT NULL, version INT UNSIGNED NOT NULL DEFAULT 1,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci');
        $pdo->exec('CREATE TABLE IF NOT EXISTS audit_log (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY, event VARCHAR(100) NOT NULL,
            course_slug VARCHAR(190) NULL, actor VARCHAR(190) NOT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, INDEX(course_slug)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci');
        $pdo->exec('CREATE TABLE IF NOT EXISTS datasets (
            dataset_key VARCHAR(40) NOT NULL, record_key VARCHAR(190) NOT NULL, payload_json LONGTEXT NOT NULL,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY(dataset_key, record_key)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci');
        $pdo->exec('CREATE TABLE IF NOT EXISTS applications (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY, reference VARCHAR(32) NOT NULL UNIQUE,
            course_slug VARCHAR(190) NOT NULL, status ENUM("submitted", "review", "accepted", "declined", "withdrawn") NOT NULL DEFAULT "submitted",
            pii_ciphertext LONGTEXT NOT NULL, pii_nonce VARCHAR(64) NOT NULL, access_token_hash VARCHAR(64) NOT NULL,
            ip_hash VARCHAR(64) NOT NULL, consent_at VARCHAR(40) NOT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX(course_slug), CONSTRAINT fk_application_course FOREIGN KEY(course_slug) REFERENCES courses(slug)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci');
    } else {
        throw new RuntimeException('Unsupported database driver.');
    }

    $count = (int)$pdo->query('SELECT COUNT(*) FROM courses')->fetchColumn();
    if ($count === 0) seed($pdo);
    syncVersionedSeedRecords($pdo);
    seedDatasets($pdo);
    purgeExpiredApplications($pdo);
    return $pdo;
}

function seedDatasets(PDO $pdo): void {
    $sources = ['content' => 'content.seed.json', 'countries' => 'countries.seed.json', 'regions' => 'regions.seed.json'];
    $driver = $pdo->getAttribute(PDO::ATTR_DRIVER_NAME);
    $insert = $driver === 'mysql'
        ? $pdo->prepare('INSERT IGNORE INTO datasets (dataset_key, record_key, payload_json) VALUES (:dataset, :key, :payload)')
        : $pdo->prepare('INSERT OR IGNORE INTO datasets (dataset_key, record_key, payload_json) VALUES (:dataset, :key, :payload)');
    foreach ($sources as $dataset => $file) {
        $records = json_decode((string)file_get_contents(__DIR__ . DIRECTORY_SEPARATOR . $file), true, 512, JSON_THROW_ON_ERROR);
        $count = $pdo->prepare('SELECT COUNT(*) FROM datasets WHERE dataset_key = :dataset');
        $count->execute([':dataset' => $dataset]);
        if ((int)$count->fetchColumn() === count($records)) continue;
        $pdo->beginTransaction();
        try {
            $pdo->prepare('DELETE FROM datasets WHERE dataset_key = :dataset')->execute([':dataset' => $dataset]);
            foreach ($records as $index => $record) {
                if (!is_array($record)) continue;
                $key = (string)($record['slug'] ?? $record['path'] ?? $index);
                $insert->execute([':dataset' => $dataset, ':key' => $key, ':payload' => json_encode($record, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR)]);
            }
            $pdo->commit();
        } catch (Throwable $error) {
            $pdo->rollBack();
            throw $error;
        }
    }
}

function purgeExpiredApplications(PDO $pdo): void {
    if ($pdo->getAttribute(PDO::ATTR_DRIVER_NAME) === 'mysql') {
        $pdo->exec('DELETE FROM applications WHERE created_at < DATE_SUB(NOW(), INTERVAL 365 DAY)');
    } else {
        $pdo->exec("DELETE FROM applications WHERE created_at < datetime('now', '-365 days')");
    }
}

function seed(PDO $pdo): void {
    $seedFile = __DIR__ . DIRECTORY_SEPARATOR . 'courses.seed.json';
    $records = json_decode((string)file_get_contents($seedFile), true, 512, JSON_THROW_ON_ERROR);
    $insert = $pdo->prepare('INSERT INTO courses (slug, title, status, payload_json) VALUES (:slug, :title, "published", :payload)');
    $pdo->beginTransaction();
    try {
        foreach ($records as $record) {
            if (!is_array($record) || empty($record['slug']) || empty($record['title'])) continue;
            $insert->execute([
                ':slug' => (string)$record['slug'],
                ':title' => (string)$record['title'],
                ':payload' => json_encode($record, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR),
            ]);
        }
        $pdo->prepare('INSERT INTO audit_log (event, actor) VALUES ("catalogue_seeded", "deployment")')->execute();
        $pdo->commit();
    } catch (Throwable $error) {
        $pdo->rollBack();
        throw $error;
    }
}

function syncVersionedSeedRecords(PDO $pdo): void {
    $seedFile = __DIR__ . DIRECTORY_SEPARATOR . 'courses.seed.json';
    $records = json_decode((string)file_get_contents($seedFile), true, 512, JSON_THROW_ON_ERROR);
    $find = $pdo->prepare('SELECT payload_json FROM courses WHERE slug = :slug LIMIT 1');
    $insert = $pdo->prepare('INSERT INTO courses (slug, title, status, payload_json) VALUES (:slug, :title, "published", :payload)');
    $update = $pdo->prepare('UPDATE courses SET title = :title, status = "published", payload_json = :payload, version = version + 1, updated_at = CURRENT_TIMESTAMP WHERE slug = :slug');
    $audit = $pdo->prepare('INSERT INTO audit_log (event, course_slug, actor) VALUES ("catalogue_seed_synced", :slug, "deployment")');

    foreach ($records as $record) {
        if (!is_array($record) || empty($record['slug']) || empty($record['title']) || empty($record['seedRevision'])) continue;

        $slug = (string)$record['slug'];
        $find->execute([':slug' => $slug]);
        $currentJson = $find->fetchColumn();
        $current = is_string($currentJson) ? json_decode($currentJson, true) : null;

        if (is_array($current) && ($current['managedByAdmin'] ?? false) === true) continue;
        if (is_array($current) && ($current['seedRevision'] ?? null) === $record['seedRevision']) continue;

        $payload = json_encode($record, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
        $pdo->beginTransaction();
        try {
            if ($currentJson === false) {
                $insert->execute([':slug' => $slug, ':title' => (string)$record['title'], ':payload' => $payload]);
            } else {
                $update->execute([':slug' => $slug, ':title' => (string)$record['title'], ':payload' => $payload]);
            }
            $audit->execute([':slug' => $slug]);
            $pdo->commit();
        } catch (Throwable $error) {
            $pdo->rollBack();
            throw $error;
        }
    }
}

function validSlug(string $value): bool {
    return (bool)preg_match('/^[a-z0-9]+(?:-[a-z0-9]+)*$/', $value);
}

function jsonBody(): array {
    $length = (int)($_SERVER['CONTENT_LENGTH'] ?? 0);
    if ($length > 16384) respond(413, ['error' => 'Request is too large.']);
    $raw = (string)file_get_contents('php://input', false, null, 0, 16385);
    if (strlen($raw) > 16384) respond(413, ['error' => 'Request is too large.']);
    $body = json_decode($raw, true);
    if (!is_array($body)) respond(422, ['error' => 'A valid JSON request is required.']);
    return $body;
}

function ensureAuthTables(PDO $pdo): void {
    $driver = $pdo->getAttribute(PDO::ATTR_DRIVER_NAME);
    $id = $driver === 'mysql' ? 'BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT';
    $timestamp = $driver === 'mysql' ? 'TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP' : 'TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP';
    $pdo->exec("CREATE TABLE IF NOT EXISTS admin_users (
        id $id, email VARCHAR(254) NOT NULL UNIQUE, role VARCHAR(30) NOT NULL DEFAULT 'administrator',
        password_hash VARCHAR(255) NULL, reset_token_hash VARCHAR(64) NULL, reset_expires_at VARCHAR(40) NULL,
        last_login_at VARCHAR(40) NULL, created_at $timestamp
    )");
    $pdo->exec("CREATE TABLE IF NOT EXISTS auth_attempts (
        id $id, identity_hash VARCHAR(64) NOT NULL, attempted_at $timestamp
    )");
    $email = strtolower(trim((string)getenv('GSS_ADMIN_EMAIL')));
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) return;
    $statement = $driver === 'mysql'
        ? $pdo->prepare('INSERT IGNORE INTO admin_users (email, role) VALUES (:email, "administrator")')
        : $pdo->prepare('INSERT OR IGNORE INTO admin_users (email, role) VALUES (:email, "administrator")');
    $statement->execute([':email' => $email]);
}

function authRateLimit(PDO $pdo, string $identity): void {
    $hash = hash('sha256', strtolower($identity) . '|' . ($_SERVER['REMOTE_ADDR'] ?? 'unknown'));
    if ($pdo->getAttribute(PDO::ATTR_DRIVER_NAME) === 'mysql') {
        $pdo->prepare('DELETE FROM auth_attempts WHERE attempted_at < DATE_SUB(NOW(), INTERVAL 15 MINUTE)')->execute();
    } else {
        $pdo->prepare("DELETE FROM auth_attempts WHERE attempted_at < datetime('now', '-15 minutes')")->execute();
    }
    $count = $pdo->prepare('SELECT COUNT(*) FROM auth_attempts WHERE identity_hash = :hash');
    $count->execute([':hash' => $hash]);
    if ((int)$count->fetchColumn() >= 10) respond(429, ['error' => 'Too many attempts. Try again later.']);
    $pdo->prepare('INSERT INTO auth_attempts (identity_hash) VALUES (:hash)')->execute([':hash' => $hash]);
}

function authenticatedUser(PDO $pdo): ?array {
    if ((int)($_SESSION['expires_at'] ?? 0) < time()) {
        $_SESSION = [];
        return null;
    }
    $id = filter_var($_SESSION['admin_user_id'] ?? null, FILTER_VALIDATE_INT);
    if (!$id) return null;
    $statement = $pdo->prepare('SELECT id, email, role FROM admin_users WHERE id = :id LIMIT 1');
    $statement->execute([':id' => $id]);
    return $statement->fetch() ?: null;
}

function requireAdministrator(PDO $pdo): array {
    ensureAuthTables($pdo);
    $user = authenticatedUser($pdo);
    if (!$user || !in_array($user['role'], ['administrator', 'editor'], true)) respond(401, ['error' => 'Authentication required.']);
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    if (!in_array($method, ['GET', 'HEAD'], true) && !hash_equals((string)($_SESSION['csrf'] ?? ''), (string)($_SERVER['HTTP_X_CSRF_TOKEN'] ?? ''))) {
        respond(403, ['error' => 'Invalid security token.']);
    }
    return $user;
}

function piiKey(): string {
    $encoded = (string)getenv('GSS_PII_KEY');
    $key = base64_decode($encoded, true);
    if (!is_string($key) || strlen($key) !== 32) respond(503, ['error' => 'Application service is not configured.']);
    return $key;
}

function encryptPii(array $data): array {
    $plain = json_encode($data, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
    if (extension_loaded('sodium')) {
        $nonce = random_bytes(SODIUM_CRYPTO_SECRETBOX_NONCEBYTES);
        return [base64_encode(sodium_crypto_secretbox($plain, $nonce, piiKey())), 'sodium:' . base64_encode($nonce)];
    }
    if (extension_loaded('openssl')) {
        $iv = random_bytes(12);
        $tag = '';
        $ciphertext = openssl_encrypt($plain, 'aes-256-gcm', piiKey(), OPENSSL_RAW_DATA, $iv, $tag);
        if ($ciphertext === false) throw new RuntimeException('Unable to encrypt application record.');
        return [base64_encode($ciphertext), 'aesgcm:' . base64_encode($iv . $tag)];
    }
    respond(503, ['error' => 'Application encryption is not available.']);
}

function decryptPii(string $ciphertext, string $nonce): array {
    if (str_starts_with($nonce, 'sodium:') && extension_loaded('sodium')) {
        $plain = sodium_crypto_secretbox_open(base64_decode($ciphertext, true), base64_decode(substr($nonce, 7), true), piiKey());
    } elseif (str_starts_with($nonce, 'aesgcm:') && extension_loaded('openssl')) {
        $combined = base64_decode(substr($nonce, 7), true);
        $plain = openssl_decrypt(base64_decode($ciphertext, true), 'aes-256-gcm', piiKey(), OPENSSL_RAW_DATA, substr($combined, 0, 12), substr($combined, 12, 16));
    } else {
        throw new RuntimeException('Application encryption method is unavailable.');
    }
    if ($plain === false) throw new RuntimeException('Unable to decrypt application record.');
    return json_decode($plain, true, 32, JSON_THROW_ON_ERROR);
}

function validateCoursePayload(array $body): array {
    $slug = trim((string)($body['slug'] ?? ''));
    $title = trim((string)($body['title'] ?? ''));
    $description = trim((string)($body['description'] ?? ''));
    if (!validSlug($slug) || strlen($title) < 3 || strlen($title) > 500 || strlen($description) > 5000) {
        respond(422, ['error' => 'Course slug, title, or description is invalid.']);
    }
    $status = (string)($body['status'] ?? 'draft');
    if (!in_array($status, ['draft', 'review', 'published'], true)) respond(422, ['error' => 'Course status is invalid.']);
    return ['slug' => $slug, 'title' => $title, 'description' => $description, 'status' => $status] + $body;
}

function handleApplications(PDO $pdo, array $resource): never {
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    if ($method === 'POST' && !isset($resource[1])) {
        $body = jsonBody();
        $firstName = trim((string)($body['firstName'] ?? ''));
        $lastName = trim((string)($body['lastName'] ?? ''));
        $email = strtolower(trim((string)($body['email'] ?? '')));
        $country = trim((string)($body['country'] ?? ''));
        $courseSlug = trim((string)($body['courseSlug'] ?? ''));
        if (strlen($firstName) < 2 || strlen($firstName) > 100 || strlen($lastName) < 2 || strlen($lastName) > 100 || !filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($country) > 100 || !validSlug($courseSlug) || ($body['consent'] ?? false) !== true) {
            respond(422, ['error' => 'Required application details or consent are invalid.']);
        }
        $course = $pdo->prepare('SELECT slug FROM courses WHERE slug = :slug AND status = "published" LIMIT 1');
        $course->execute([':slug' => $courseSlug]);
        if (!$course->fetch()) respond(422, ['error' => 'The selected programme is unavailable.']);
        $ipHash = hash('sha256', (string)($_SERVER['REMOTE_ADDR'] ?? 'unknown'));
        $window = $pdo->getAttribute(PDO::ATTR_DRIVER_NAME) === 'mysql' ? 'created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)' : "created_at > datetime('now', '-1 hour')";
        $count = $pdo->prepare("SELECT COUNT(*) FROM applications WHERE ip_hash = :ip AND $window");
        $count->execute([':ip' => $ipHash]);
        if ((int)$count->fetchColumn() >= 5) respond(429, ['error' => 'Too many applications. Try again later.']);
        [$ciphertext, $nonce] = encryptPii(['firstName' => $firstName, 'lastName' => $lastName, 'email' => $email, 'country' => $country]);
        $reference = 'GSS-' . strtoupper(bin2hex(random_bytes(6)));
        $accessToken = bin2hex(random_bytes(32));
        $statement = $pdo->prepare('INSERT INTO applications (reference, course_slug, pii_ciphertext, pii_nonce, access_token_hash, ip_hash, consent_at) VALUES (:reference, :course, :ciphertext, :nonce, :token, :ip, :consent)');
        $statement->execute([':reference' => $reference, ':course' => $courseSlug, ':ciphertext' => $ciphertext, ':nonce' => $nonce, ':token' => hash('sha256', $accessToken), ':ip' => $ipHash, ':consent' => gmdate('c')]);
        $pdo->prepare('INSERT INTO audit_log (event, course_slug, actor) VALUES ("application_submitted", :slug, "public")')->execute([':slug' => $courseSlug]);
        respond(201, ['data' => ['reference' => $reference, 'accessToken' => $accessToken, 'status' => 'submitted', 'retentionDays' => 365]]);
    }
    $reference = (string)($resource[1] ?? '');
    if (($resource[2] ?? '') === 'access' && in_array($method, ['GET', 'DELETE'], true)) {
        if (!preg_match('/^GSS-[A-F0-9]{12}$/', $reference)) respond(400, ['error' => 'Invalid application reference.']);
        $token = (string)($_SERVER['HTTP_X_APPLICATION_TOKEN'] ?? '');
        if (!preg_match('/^[a-f0-9]{64}$/', $token)) respond(401, ['error' => 'Application access denied.']);
        $statement = $pdo->prepare('SELECT reference, course_slug, status, pii_ciphertext, pii_nonce, access_token_hash, consent_at, created_at, updated_at FROM applications WHERE reference = :reference LIMIT 1');
        $statement->execute([':reference' => $reference]);
        $record = $statement->fetch();
        if (!$record || !hash_equals($record['access_token_hash'], hash('sha256', $token))) respond(401, ['error' => 'Application access denied.']);
        if ($method === 'DELETE') {
            $pdo->prepare('DELETE FROM applications WHERE reference = :reference')->execute([':reference' => $reference]);
            $pdo->prepare('INSERT INTO audit_log (event, course_slug, actor) VALUES ("application_withdrawn_and_deleted", :slug, "applicant")')->execute([':slug' => $record['course_slug']]);
            respond(200, ['deleted' => true]);
        }
        $pii = decryptPii($record['pii_ciphertext'], $record['pii_nonce']);
        unset($record['pii_ciphertext'], $record['pii_nonce'], $record['access_token_hash']);
        respond(200, ['data' => $record + ['applicant' => $pii]]);
    }
    $user = requireAdministrator($pdo);
    if ($method === 'GET' && !isset($resource[1])) {
        $rows = $pdo->query('SELECT reference, course_slug, status, pii_ciphertext, pii_nonce, consent_at, created_at, updated_at FROM applications ORDER BY created_at DESC LIMIT 500')->fetchAll();
        $data = array_map(static function(array $row): array { $pii = decryptPii($row['pii_ciphertext'], $row['pii_nonce']); unset($row['pii_ciphertext'], $row['pii_nonce']); return $row + ['applicant' => $pii]; }, $rows);
        respond(200, ['data' => $data]);
    }
    $reference = (string)($resource[1] ?? '');
    if (!preg_match('/^GSS-[A-F0-9]{12}$/', $reference)) respond(400, ['error' => 'Invalid application reference.']);
    if ($method === 'PATCH') {
        $status = (string)(jsonBody()['status'] ?? '');
        if (!in_array($status, ['submitted', 'review', 'accepted', 'declined', 'withdrawn'], true)) respond(422, ['error' => 'Invalid application status.']);
        $pdo->prepare('UPDATE applications SET status = :status, updated_at = CURRENT_TIMESTAMP WHERE reference = :reference')->execute([':status' => $status, ':reference' => $reference]);
        $pdo->prepare('INSERT INTO audit_log (event, actor) VALUES ("application_status_updated", :actor)')->execute([':actor' => $user['email']]);
        respond(200, ['data' => ['reference' => $reference, 'status' => $status]]);
    }
    if ($method === 'DELETE') {
        $pdo->prepare('DELETE FROM applications WHERE reference = :reference')->execute([':reference' => $reference]);
        $pdo->prepare('INSERT INTO audit_log (event, actor) VALUES ("application_deleted", :actor)')->execute([':actor' => $user['email']]);
        respond(200, ['deleted' => true]);
    }
    respond(405, ['error' => 'Method not allowed.']);
}

function handleAuth(PDO $pdo, array $resource): never {
    ensureAuthTables($pdo);
    $action = $resource[1] ?? 'session';
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    if ($action === 'session' && $method === 'GET') {
        $user = authenticatedUser($pdo);
        if (!$user) respond(401, ['authenticated' => false]);
        $_SESSION['csrf'] ??= bin2hex(random_bytes(24));
        respond(200, ['authenticated' => true, 'user' => $user, 'csrfToken' => $_SESSION['csrf']]);
    }
    if ($action === 'request-setup' && $method === 'POST') {
        $body = jsonBody();
        $email = strtolower(trim((string)($body['email'] ?? '')));
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) respond(422, ['error' => 'Enter a valid email address.']);
        authRateLimit($pdo, $email);
        $user = $pdo->prepare('SELECT id, password_hash FROM admin_users WHERE email = :email LIMIT 1');
        $user->execute([':email' => $email]);
        $record = $user->fetch();
        if ($record && !$record['password_hash']) {
            $token = bin2hex(random_bytes(32));
            $pdo->prepare('UPDATE admin_users SET reset_token_hash = :hash, reset_expires_at = :expires WHERE id = :id')->execute([
                ':hash' => hash('sha256', $token), ':expires' => gmdate('c', time() + 1800), ':id' => $record['id'],
            ]);
            $origin = rtrim((string)getenv('GSS_PUBLIC_ORIGIN'), '/');
            if (!preg_match('#^https://[a-z0-9.-]+(?::[0-9]+)?$#i', $origin)) respond(503, ['error' => 'Administrator setup is not configured.']);
            $link = $origin . '/dashboard/login?setup=' . rawurlencode($token);
            @mail($email, 'Set your GSS administrator password', "Use this one-time link within 30 minutes:\n\n$link\n\nIf you did not request this, ignore this email.", "From: no-reply@$host\r\nContent-Type: text/plain; charset=UTF-8");
        }
        respond(200, ['message' => 'If this administrator is awaiting setup, a one-time link has been sent.']);
    }
    if ($action === 'set-password' && $method === 'POST') {
        $body = jsonBody();
        $token = (string)($body['token'] ?? '');
        $password = (string)($body['password'] ?? '');
        if (!preg_match('/^[a-f0-9]{64}$/', $token)) respond(422, ['error' => 'The setup link is invalid.']);
        if (strlen($password) < 12 || !preg_match('/[A-Z]/', $password) || !preg_match('/[a-z]/', $password) || !preg_match('/\d/', $password) || !preg_match('/[^A-Za-z0-9]/', $password)) {
            respond(422, ['error' => 'Use at least 12 characters with upper- and lowercase letters, a number, and a symbol.']);
        }
        $statement = $pdo->prepare('SELECT id, email, role, reset_expires_at FROM admin_users WHERE reset_token_hash = :hash LIMIT 1');
        $statement->execute([':hash' => hash('sha256', $token)]);
        $user = $statement->fetch();
        if (!$user || strtotime((string)$user['reset_expires_at']) < time()) respond(422, ['error' => 'The setup link is invalid or expired.']);
        $hash = password_hash($password, defined('PASSWORD_ARGON2ID') ? PASSWORD_ARGON2ID : PASSWORD_BCRYPT);
        $pdo->prepare('UPDATE admin_users SET password_hash = :password, reset_token_hash = NULL, reset_expires_at = NULL WHERE id = :id')->execute([':password' => $hash, ':id' => $user['id']]);
        session_regenerate_id(true);
        $_SESSION['admin_user_id'] = (int)$user['id'];
        $_SESSION['csrf'] = bin2hex(random_bytes(24));
        $_SESSION['expires_at'] = time() + 28800;
        respond(200, ['authenticated' => true, 'user' => ['id' => $user['id'], 'email' => $user['email'], 'role' => $user['role']], 'csrfToken' => $_SESSION['csrf']]);
    }
    if ($action === 'login' && $method === 'POST') {
        $body = jsonBody();
        $email = strtolower(trim((string)($body['email'] ?? '')));
        $password = (string)($body['password'] ?? '');
        authRateLimit($pdo, $email);
        $statement = $pdo->prepare('SELECT id, email, role, password_hash FROM admin_users WHERE email = :email LIMIT 1');
        $statement->execute([':email' => $email]);
        $user = $statement->fetch();
        if (!$user || !$user['password_hash'] || !password_verify($password, $user['password_hash'])) respond(401, ['error' => 'Email or password is incorrect.']);
        if (password_needs_rehash($user['password_hash'], defined('PASSWORD_ARGON2ID') ? PASSWORD_ARGON2ID : PASSWORD_BCRYPT)) {
            $pdo->prepare('UPDATE admin_users SET password_hash = :password WHERE id = :id')->execute([':password' => password_hash($password, defined('PASSWORD_ARGON2ID') ? PASSWORD_ARGON2ID : PASSWORD_BCRYPT), ':id' => $user['id']]);
        }
        session_regenerate_id(true);
        $_SESSION['admin_user_id'] = (int)$user['id'];
        $_SESSION['csrf'] = bin2hex(random_bytes(24));
        $_SESSION['expires_at'] = time() + 28800;
        $pdo->prepare('UPDATE admin_users SET last_login_at = :time WHERE id = :id')->execute([':time' => gmdate('c'), ':id' => $user['id']]);
        respond(200, ['authenticated' => true, 'user' => ['id' => $user['id'], 'email' => $user['email'], 'role' => $user['role']], 'csrfToken' => $_SESSION['csrf']]);
    }
    if ($action === 'logout' && $method === 'POST') {
        if (!hash_equals((string)($_SESSION['csrf'] ?? ''), (string)($_SERVER['HTTP_X_CSRF_TOKEN'] ?? ''))) respond(403, ['error' => 'Invalid security token.']);
        $_SESSION = [];
        session_destroy();
        respond(200, ['authenticated' => false]);
    }
    respond(404, ['error' => 'Authentication action not found.']);
}

try {
    $path = trim((string)parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH), '/');
    $parts = array_values(array_filter(explode('/', $path)));
    $apiIndex = array_search('api', $parts, true);
    $resource = $apiIndex === false ? [] : array_slice($parts, $apiIndex + 1);
    $pdo = database();

    if (($resource[0] ?? '') === 'auth') handleAuth($pdo, $resource);
    if (($resource[0] ?? '') === 'applications') handleApplications($pdo, $resource);

    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    if (($resource[0] ?? '') === 'admin' && ($resource[1] ?? '') === 'courses') {
        $user = requireAdministrator($pdo);
        if ($method === 'GET') {
            $rows = $pdo->query('SELECT slug, title, status, payload_json, version, updated_at FROM courses ORDER BY title')->fetchAll();
            respond(200, ['data' => array_map(static function(array $row): array { $payload = json_decode($row['payload_json'], true, 512, JSON_THROW_ON_ERROR); unset($row['payload_json']); return $row + ['payload' => $payload]; }, $rows)]);
        }
        if ($method === 'POST') {
            $body = validateCoursePayload(jsonBody());
            $body['managedByAdmin'] = true;
            $payload = json_encode($body, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
            $statement = $pdo->prepare('INSERT INTO courses (slug, title, status, payload_json) VALUES (:slug, :title, :status, :payload)');
            try { $statement->execute([':slug' => $body['slug'], ':title' => $body['title'], ':status' => $body['status'], ':payload' => $payload]); }
            catch (PDOException) { respond(409, ['error' => 'A course with this slug already exists.']); }
            $event = 'course_created';
        } elseif ($method === 'PATCH') {
            $patch = validateCoursePayload(jsonBody());
            $slug = (string)($resource[2] ?? '');
            if (!validSlug($slug) || $slug !== $patch['slug']) respond(422, ['error' => 'Course slug cannot be changed.']);
            $existingStatement = $pdo->prepare('SELECT payload_json FROM courses WHERE slug = :slug LIMIT 1');
            $existingStatement->execute([':slug' => $slug]);
            $existingJson = $existingStatement->fetchColumn();
            if (!is_string($existingJson)) respond(404, ['error' => 'Course not found.']);
            $existing = json_decode($existingJson, true, 512, JSON_THROW_ON_ERROR);
            $body = array_replace($existing, $patch, ['managedByAdmin' => true]);
            $payload = json_encode($body, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
            $statement = $pdo->prepare('UPDATE courses SET title = :title, status = :status, payload_json = :payload, version = version + 1, updated_at = CURRENT_TIMESTAMP WHERE slug = :slug');
            $statement->execute([':slug' => $slug, ':title' => $body['title'], ':status' => $body['status'], ':payload' => $payload]);
            if (!$statement->rowCount()) respond(404, ['error' => 'Course not found.']);
            $event = 'course_updated';
        } elseif ($method === 'DELETE') {
            $slug = (string)($resource[2] ?? '');
            if (!validSlug($slug)) respond(400, ['error' => 'Invalid course slug.']);
            $existingStatement = $pdo->prepare('SELECT payload_json FROM courses WHERE slug = :slug LIMIT 1');
            $existingStatement->execute([':slug' => $slug]);
            $existingJson = $existingStatement->fetchColumn();
            if (!is_string($existingJson)) respond(404, ['error' => 'Course not found.']);
            $existing = json_decode($existingJson, true, 512, JSON_THROW_ON_ERROR);
            $existing['managedByAdmin'] = true;
            $payload = json_encode($existing, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
            $pdo->prepare('UPDATE courses SET status = "draft", payload_json = :payload, version = version + 1, updated_at = CURRENT_TIMESTAMP WHERE slug = :slug')->execute([':slug' => $slug, ':payload' => $payload]);
            $event = 'course_unpublished';
            $body = ['slug' => $slug, 'status' => 'draft'];
        } else respond(405, ['error' => 'Method not allowed.']);
        $pdo->prepare('INSERT INTO audit_log (event, course_slug, actor) VALUES (:event, :slug, :actor)')->execute([':event' => $event, ':slug' => $body['slug'] ?? $resource[2], ':actor' => $user['email']]);
        respond(200, ['data' => $body]);
    }
    if ($method !== 'GET') respond(405, ['error' => 'Method not allowed.']);

    if (($resource[0] ?? '') === 'health') {
        $datasetCounts = [];
        foreach (['content', 'countries', 'regions'] as $dataset) {
            $statement = $pdo->prepare('SELECT COUNT(*) FROM datasets WHERE dataset_key = :dataset');
            $statement->execute([':dataset' => $dataset]);
            $datasetCounts[$dataset] = (int)$statement->fetchColumn();
        }
        respond(200, ['status' => 'ok', 'database' => 'connected', 'driver' => $pdo->getAttribute(PDO::ATTR_DRIVER_NAME), 'courses' => (int)$pdo->query('SELECT COUNT(*) FROM courses')->fetchColumn(), 'datasets' => $datasetCounts]);
    }
    if (in_array(($resource[0] ?? ''), ['content', 'countries', 'regions'], true)) {
        $statement = $pdo->prepare('SELECT payload_json FROM datasets WHERE dataset_key = :dataset ORDER BY record_key');
        $statement->execute([':dataset' => $resource[0]]);
        $rows = $statement->fetchAll();
        respond(200, ['data' => array_map(static fn(array $row): array => json_decode($row['payload_json'], true, 512, JSON_THROW_ON_ERROR), $rows)]);
    }
    if (($resource[0] ?? '') !== 'courses') {
        respond(404, ['error' => 'Resource not found.']);
    }
    if (!isset($resource[1])) {
        $rows = $pdo->query('SELECT payload_json FROM courses WHERE status = "published" ORDER BY title')->fetchAll();
        respond(200, ['data' => array_map(static fn(array $row): array => json_decode($row['payload_json'], true, 512, JSON_THROW_ON_ERROR), $rows)]);
    }
    $slug = (string)$resource[1];
    if (!validSlug($slug)) respond(400, ['error' => 'Invalid course slug.']);
    $statement = $pdo->prepare('SELECT payload_json FROM courses WHERE slug = :slug AND status = "published" LIMIT 1');
    $statement->execute([':slug' => $slug]);
    $row = $statement->fetch();
    if (!$row) respond(404, ['error' => 'Course not found.']);
    respond(200, ['data' => json_decode($row['payload_json'], true, 512, JSON_THROW_ON_ERROR)]);
} catch (Throwable $error) {
    error_log('GSS API failure: ' . $error->getMessage());
    respond(500, ['error' => 'The catalogue service is temporarily unavailable.']);
}
