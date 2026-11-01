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
    } else {
        throw new RuntimeException('Unsupported database driver.');
    }

    $count = (int)$pdo->query('SELECT COUNT(*) FROM courses')->fetchColumn();
    if ($count === 0) seed($pdo);
    return $pdo;
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

function validSlug(string $value): bool {
    return (bool)preg_match('/^[a-z0-9]+(?:-[a-z0-9]+)*$/', $value);
}

function jsonBody(): array {
    $length = (int)($_SERVER['CONTENT_LENGTH'] ?? 0);
    if ($length > 16384) respond(413, ['error' => 'Request is too large.']);
    $body = json_decode((string)file_get_contents('php://input'), true);
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
    $email = 'raghavsanoriya2012@gmail.com';
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
    $id = filter_var($_SESSION['admin_user_id'] ?? null, FILTER_VALIDATE_INT);
    if (!$id) return null;
    $statement = $pdo->prepare('SELECT id, email, role FROM admin_users WHERE id = :id LIMIT 1');
    $statement->execute([':id' => $id]);
    return $statement->fetch() ?: null;
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
            $host = preg_replace('/[^a-z0-9.-]/i', '', (string)($_SERVER['HTTP_HOST'] ?? 'gss.geic.in'));
            $link = 'https://' . $host . '/admin/login?setup=' . rawurlencode($token);
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
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') respond(405, ['error' => 'Method not allowed.']);

    if (($resource[0] ?? '') === 'health') {
        respond(200, ['status' => 'ok', 'database' => 'connected', 'driver' => $pdo->getAttribute(PDO::ATTR_DRIVER_NAME), 'courses' => (int)$pdo->query('SELECT COUNT(*) FROM courses')->fetchColumn()]);
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
