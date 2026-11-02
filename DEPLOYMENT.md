# GSS Mindu deployment

## Required runtime

- PHP 8.2+ with PDO and either `pdo_mysql` or `pdo_sqlite`.
- `sodium` or `openssl` for encrypted application records.
- HTTPS; administrator session cookies are intentionally Secure and will not authenticate over plain HTTP.
- A writable private database directory outside the public document root when using SQLite.

## Configuration

Copy the keys from `.env.example` into the hosting environment. Generate `GSS_PII_KEY` from 32 cryptographically random bytes and base64-encode it. Keep this key and database credentials outside the repository and web root.

The initial `GSS_ADMIN_EMAIL` can request a one-time password setup link. `GSS_PUBLIC_ORIGIN` must be the canonical HTTPS website origin used in that link. Programme writes and application administration require an authenticated administrator session and an `X-CSRF-Token` header.

## Privacy behaviour

Applications collect only first name, last name, email, country, selected programme, and explicit consent. Applicant details are encrypted at rest. Records expire after 365 days. The one-time application access token returned after submission supports applicant export and deletion through `/api/applications/{reference}/access`; administrators can review, change status, or delete through the dashboard.

## Release checks

Run `npm run build`, `npm run qa`, `npm run verify:images`, and `php -l public/api/index.php`. After deployment, verify `/api/health`, sign-in, course create/update/unpublish, application submit/export/delete, security headers, and HTTPS cookies against the production PHP runtime.
