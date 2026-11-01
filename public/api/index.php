<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
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

try {
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
        respond(405, ['error' => 'Method not allowed.']);
    }
    $path = trim((string)parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH), '/');
    $parts = array_values(array_filter(explode('/', $path)));
    $apiIndex = array_search('api', $parts, true);
    $resource = $apiIndex === false ? [] : array_slice($parts, $apiIndex + 1);
    $pdo = database();

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
