# API foundation (v0.2)

This backend is a development foundation, not a production service. It stores account credentials and governance workflow metadata for a synthetic-only demonstration. It does not store or serve mental-health records.

## Requirements

- Node.js 20 or later.
- MongoDB instance for local development.
- Environment variables from \`.env.example\`.

## Run locally

1. Install dependencies: \`npm install\`
2. Copy \`.env.example\` to \`.env\`.
3. Replace \`JWT_SECRET\` with a random value of at least 32 characters.
4. Set \`MONGODB_URI\` to a development MongoDB database.
5. Start the service: \`npm run dev\`
6. Run checks: \`npm run check\` and \`npm test\`

The default API port is 4000. Health check: \`GET /api/health\`.

## Authentication

Registration creates a \`member\` account only. A client cannot select or assign its own role. Reviewer/admin accounts must be provisioned through a trusted administrative process outside public registration.

- \`POST /api/auth/register\` — \`{ name, email, password }\`; password minimum 12 characters.
- \`POST /api/auth/login\` — \`{ email, password }\`.
- Authenticated routes require \`Authorization: Bearer <token>\`.

Access tokens are short-lived JWTs. This initial release does not implement refresh tokens, password reset, MFA, account recovery, or session revocation.

## Governance endpoints

### Consent records

- \`GET /api/consents/me\` — returns the signed-in account's consent history.
- \`POST /api/consents\` — append a record: \`{ purpose, status, noticeVersion }\`.
- Purpose: \`programme | research | ai\`.
- Status: \`granted | withdrawn\`.

A new consent choice appends a record. It does not overwrite prior history. Approval checks the latest record for the requested purpose.

### Access requests

In this demonstration, a signed-in member represents the participant and may propose sharing a synthetic demo record with a named recipient organisation for one defined purpose. A reviewer/community steward then reviews the proposal.

- \`GET /api/access-requests\` — members see their own requests; reviewers/admins see the review queue.
- \`POST /api/access-requests\` — submit \`{ recipientName, recipientOrganisation, purpose, scope, rationale }\`. Scope is restricted to \`synthetic-demo\`.
- \`POST /api/access-requests/:id/review\` — reviewer/admin only; body: \`{ status, reviewNote }\`.

Approval is blocked unless the latest consent record for that purpose is granted. Approval is a workflow decision only: **there is no data retrieval or data export endpoint**. A production implementation would need a separate policy-enforcement layer that checks current consent and approval on every protected operation. Review is separated from submission, and the decision update is conditional on the request still being pending.

### Audit events

- \`GET /api/audit-events/me\` — returns up to 100 events performed by or concerning the signed-in account.
- Audit events are created by backend workflows. No application update/delete routes are exposed.

This is append-only at the application layer, not cryptographically immutable. Database administrators and infrastructure operators can still alter stored data.

## Security controls included

- Helmet security headers.
- CORS origin allow-list.
- JSON request size limit.
- Zod request validation and strict body schemas.
- bcrypt password hashing.
- short-lived JWT access tokens with issuer/audience checks.
- authentication rate limiting.
- member role by default; privileged roles are not selectable through registration.
- no real-data or data-export endpoint.

## Not yet implemented

- Frontend sign-in and API integration.
- Password reset, email verification, MFA, refresh/session revocation.
- Formal reviewer provisioning and organisational tenancy.
- Field-level policy engine and data-release enforcement.
- Durable, tamper-evident audit architecture and external monitoring.
- Automated integration tests using an isolated test database.
- Production deployment, TLS/proxy configuration, backups, incident response, privacy and security assessment.

Do not connect this service to real participants or health datasets.
