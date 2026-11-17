# API and browser integration (v0.3)

This is a development prototype. It stores account credentials and governance workflow metadata for a synthetic-only demonstration. It does not store or serve mental-health records.

## Requirements and local setup

- Node.js 20 or later.
- MongoDB instance for local development.
- Environment variables from \`.env.example\`.

1. Run \`npm install\`.
2. Copy \`.env.example\` to \`.env\`.
3. Set \`JWT_SECRET\` to a random secret of at least 32 characters.
4. Point \`MONGODB_URI\` to a development-only database.
5. Start the API with \`npm run dev\`.
6. Serve the repository root on port 5500 using \`python3 -m http.server 5500\`.
7. Open \`http://localhost:5500\`.

The frontend API URL is configured by the \`mindcommon-api-base\` meta tag in \`index.html\`; the local default is \`http://localhost:4000/api\`. \`CORS_ORIGINS\` must contain the exact browser origin, such as \`http://localhost:5500\`.

## Authentication and browser sessions

Public registration creates a \`member\` account only. A client cannot select or assign its own role. Reviewer/admin accounts require a trusted provisioning process.

- \`POST /api/auth/register\` — \`{ name, email, password }\`; password minimum 12 characters.
- \`POST /api/auth/login\` — \`{ email, password }\`.
- \`GET /api/auth/me\` — returns the current authenticated account.
- \`POST /api/auth/logout\` — clears the session cookie.

Successful registration and login set the \`mindcommon_session\` HttpOnly cookie. The JWT is not returned in JSON, \`localStorage\`, or \`sessionStorage\`. The browser uses \`credentials: include\` for API calls.

Cookie settings are configured using \`COOKIE_SAME_SITE\`, \`COOKIE_SECURE\`, and optional \`COOKIE_DOMAIN\`. The local defaults are intended for the documented localhost setup. Production requires HTTPS and a reviewed cookie/CORS configuration. If frontend and API are on genuinely cross-site domains, \`SameSite=None\` requires \`COOKIE_SECURE=true\`.

State-changing browser requests with an Origin header are accepted only from an origin listed in \`CORS_ORIGINS\`. Requests without an Origin header are retained for controlled CLI/server-to-server development. Do not interpret CORS as a replacement for authentication or authorisation.

## Governance endpoints

### Consent records

- \`GET /api/consents/me\` — returns the signed-in account's consent history.
- \`POST /api/consents\` — append a record: \`{ purpose, status, noticeVersion }\`.
- Purpose: \`programme | research | ai\`.
- Status: \`granted | withdrawn\`.

A new consent choice appends a record; it does not overwrite prior history. Approval checks the latest record for the requested purpose.

### Access requests

In this demonstration, a signed-in member may propose a synthetic demo use for a named recipient organisation and purpose. A reviewer/community steward then reviews the proposal.

- \`GET /api/access-requests\` — members see their own requests; reviewers/admins see the review queue.
- \`POST /api/access-requests\` — submit \`{ recipientName, recipientOrganisation, purpose, scope, rationale }\`. Scope must be \`synthetic-demo\`.
- \`POST /api/access-requests/:id/review\` — reviewer/admin only; body: \`{ status, reviewNote }\`.

Approval is blocked unless the latest purpose-specific consent record is granted. Self-review is blocked, and the decision update is conditional on the request still being pending. Approval is a workflow decision only: **there is no data retrieval or data export endpoint**.

### Audit events

- \`GET /api/audit-events/me\` — returns up to 100 events performed by or concerning the signed-in account.
- Audit events are created by backend workflows. No application update/delete routes are exposed.

This is append-only at the application layer, not cryptographically immutable. Database administrators and infrastructure operators can still alter stored data.

## Reviewer setup for local testing

Create a second fictional account through the browser. In the local development environment only, use:

\`\`\`bash
ALLOW_LOCAL_ROLE_PROMOTION=true npm run promote:local-role -- reviewer@example.test reviewer
\`\`\`

The account must already exist. The helper refuses to run when \`NODE_ENV=production\`. Do not use this helper as a production role-management process. Production reviewer provisioning needs an authorised, audited administrative procedure with identity verification and separation of duties.

## Security controls included

- Helmet security headers.
- Explicit CORS origin allow-list with credential support.
- Origin checks for state-changing browser requests.
- HttpOnly session cookie; JWT not exposed to browser JavaScript.
- JSON request size limit and strict Zod body validation.
- bcrypt password hashing.
- Short-lived JWT with issuer/audience verification.
- Authentication rate limiting.
- Member role by default; privileged roles are not selectable through public registration.
- No real-data or data-export endpoint.

## Not yet implemented

- Password reset, email verification, MFA, session revocation, and rate-limited account recovery.
- Formal reviewer provisioning and organisational tenancy.
- Dedicated CSRF token mechanism; current browser protection combines SameSite cookie settings with Origin allow-list checks.
- Field-level policy engine and real data-release enforcement.
- Cryptographically tamper-evident audit architecture and external monitoring.
- Automated integration tests using an isolated MongoDB test database.
- Production deployment hardening, backups, incident response, privacy/legal/ethics review, and independent penetration testing.

Do not connect this service to real participants or health datasets.
