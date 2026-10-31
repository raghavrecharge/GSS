---
name: saas-product-rebuilder
description: Independently implement a SaaS/web application based on an approved feature matrix, UI evidence, design tokens, and proposed architecture. Use for complete frontend, backend, database, authentication, responsive UI, and workflow reconstruction.
---

# SaaS product rebuilder

## Preconditions
Before substantial coding, confirm:
- scope and authorization are documented;
- product discovery and critical flows are complete enough;
- feature matrix and acceptance criteria exist;
- design tokens and component inventory are available;
- target stack is known or a documented recommendation is approved.

If these are missing, request or perform the relevant discovery first. Do not invent a complete product from a landing-page screenshot.

## 1. Repository assessment
- Inspect source tree, package scripts, dependencies, environment files, tests, and git status.
- Preserve established framework and conventions where practical.
- Avoid destructive rewrites. Do not overwrite user work.
- Propose stack changes before making them.

## 2. Architecture
Separate concerns:
- presentation/components;
- application/domain logic;
- API/service layer;
- persistence;
- authentication and authorization;
- integrations and background jobs.

Use typed contracts where supported. Keep business rules out of UI components. Add migrations for schema changes. Provide `.env.example` with placeholder values only.

## 3. Frontend
Implement:
- shared application shell and navigation;
- design tokens and reusable components;
- page layouts and route structure;
- form validation and accessible labels;
- loading, empty, error, success, disabled, and permission states;
- responsive layouts for the agreed breakpoints;
- realistic interactions for all in-scope controls.

No dead buttons, fake links, inert forms, or misleading placeholder interactions. If a feature cannot be implemented, label it visibly and record it as a gap.

## 4. Backend
Implement:
- validated request/response contracts;
- authentication and server-side authorization;
- tenant/resource ownership checks;
- domain services and business rules;
- persistence and migrations;
- safe file handling where in scope;
- structured error handling;
- audit logging for sensitive operations;
- pagination/filtering where required.

Use least privilege. Never hardcode secrets. Never trust client-supplied role, tenant, price, or ownership claims.

## 5. Data and integrations
- Use synthetic fixtures and seed data.
- Use sandbox/test integrations for payments, email, SMS, and external services.
- Stub external services behind interfaces when credentials are unavailable.
- Do not send real messages, charge payment methods, or mutate real accounts without explicit authorization.
- Document integrations that remain mocked or unconfigured.

## 6. Implementation order
1. Build and verify project foundation.
2. Implement domain model and API contracts.
3. Implement shared design tokens and components.
4. Build the main application shell and navigation.
5. Implement P0 workflows end to end.
6. Implement P1/P2 features by priority.
7. Add error, empty, loading, and permission states.
8. Add tests and run the quality gate.

## 7. Coding standards
- Follow existing linting, formatting, naming, and type conventions.
- Keep components cohesive and avoid monoliths.
- Handle async errors and cancellation appropriately.
- Validate inputs at trust boundaries.
- Use parameterized queries or safe ORM methods.
- Avoid logging secrets or sensitive payloads.
- Add comments for non-obvious domain rules, not obvious code.
- Update docs when behaviour or configuration changes.

## 8. Completion report
List implemented features, routes, API operations, migrations, tests, environment variables, setup/run commands, integrations requiring credentials, and known gaps. Never claim deployment or production readiness if only local checks were run.
