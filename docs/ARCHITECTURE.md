# Architecture overview

## Current prototype

The first demonstration is a static browser application:

- `index.html`: page structure and navigation.
- `src/styles.css`: responsive presentation.
- `src/app.js`: synthetic in-memory state and demo interactions.

There is no API, authentication, server, database, or server-enforced access control in this version. Browser-local state is not a source of truth.

## Proposed service boundaries

The backend may be developed as a modular Node.js service once requirements and governance rules have been co-designed.

| Module | Responsibility | Required controls |
| --- | --- | --- |
| Identity and roles | Authenticate staff and participant-facing identities | Strong password hashing, session/token lifecycle, MFA for privileged roles |
| Consent registry | Store purpose-specific, versioned consent records | Actor, timestamp, notice version, scope, status, withdrawal |
| Access workflow | Submit, review, approve, deny, and expire access requests | Separation of duties, purpose checks, least privilege |
| Policy enforcement | Check authorisation at every protected operation | Server-side checks, deny by default, no UI-only controls |
| Audit service | Record security- and governance-relevant events | Restricted write path, monitoring, integrity strategy |
| Community governance | Record policies, membership, decisions, and appeals | Transparent process, representation, conflict declarations |

## Illustrative request flow

1. A requester submits a purpose, requested fields, duration, and protocol reference.
2. The service validates the request and records it as pending.
3. An authorised reviewer checks policy, consent, scope, and conflicts.
4. The decision and rationale are recorded.
5. A separate access-enforcement layer checks the approved scope at retrieval time.
6. Expiry, withdrawal, policy change, or revocation blocks future access as applicable.

An approved request record must not itself be treated as an access token. Do not return participant data from a demo endpoint.

## Data separation

A future design should assess whether identity information can be kept separately from programme or research records, using scoped identifiers and carefully controlled linkage. Re-identification risk must be considered even for data described as de-identified.

## Design constraints

- No real health or mental-health data during prototype development.
- No AI diagnosis, triage, treatment recommendation, or clinical decision support.
- No production deployment before governance, legal, ethics, privacy, and security review.
- Community and host approval are prerequisites to any proposed field pilot.
