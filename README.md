# MINDCOMMON

**Community-owned mental health data and responsible AI governance infrastructure.**

MINDCOMMON is an early-stage, open-source public-interest technology project exploring how communities in Nigeria can exercise meaningful control over mental-health-related data: why it is collected, who can access it, how it may be shared, and whether it may be used in research or AI development.

> **Status: prototype / research and co-design stage.** This repository is not a clinical system, health-record platform, or production data service. Do not enter real personal, patient, or mental-health information. The application is restricted to synthetic/demo governance metadata.

## What is in the repository

- A responsive browser workspace with sign-in and registration.
- API-backed, purpose-specific consent records and withdrawal history.
- Participant-initiated synthetic-data access proposals.
- Reviewer/admin queue with rationale and recorded decisions.
- API-backed audit history visible to the person concerned.
- Architecture, data-governance, API, threat-model, and roadmap documentation.

These are prototype workflows, not legally sufficient consent or production-grade security guarantees.

## Local development

Requirements: Node.js 20+ and a local MongoDB instance.

1. Install dependencies: \`npm install\`
2. Copy \`.env.example\` to \`.env\`.
3. Set a unique random \`JWT_SECRET\` of at least 32 characters.
4. Confirm \`MONGODB_URI\` points only to a development database.
5. Keep \`CORS_ORIGINS\` set to the exact frontend origin used below.
6. Start the API: \`npm run dev\`
7. In a second terminal, serve the repository root: \`python3 -m http.server 5500\`
8. Open \`http://localhost:5500\` in your browser.

The frontend reads its API base URL from the \`mindcommon-api-base\` meta tag in \`index.html\`. The default is \`http://localhost:4000/api\`. Change this value for your own environment.

Run checks with \`npm run check\` and \`npm test\`.

## Test participant and reviewer workflows

1. Create a fictional demo account through the browser registration form.
2. Use the Consent page to grant the purpose you intend to propose.
3. Submit an access proposal. The scope is fixed to \`synthetic-demo\`.
4. To test the review queue locally, sign out and create or use a second fictional account.
5. Promote that second account in your isolated development database with the guarded local helper:

\`\`\`bash
ALLOW_LOCAL_ROLE_PROMOTION=true npm run promote:local-role -- reviewer@example.test reviewer
\`\`\`

The account must already exist. The helper refuses to run in \`NODE_ENV=production\` and requires an explicit local opt-in. Public registration cannot create reviewer or administrator accounts.

## Browser authentication

The browser uses an HttpOnly session cookie with credentialed requests. The JWT is not exposed to browser JavaScript or placed in Web Storage. Browser mutation requests must originate from an origin listed in \`CORS_ORIGINS\`. For deployments on genuinely cross-site frontend/API domains, configure HTTPS, \`COOKIE_SECURE=true\`, \`COOKIE_SAME_SITE=none\`, and the exact frontend origin; review the deployment threat model before doing so.

## Safety and data handling

- Use synthetic data for development, screenshots, tests, and demos.
- Never commit personal data, patient data, credentials, API keys, private keys, or production database dumps.
- Do not connect this prototype to a real mental-health programme or dataset.
- This API does not expose a participant health-record retrieval or export endpoint.
- A future pilot requires documented community participation, appropriate consent processes, safeguarding, an assessment of applicable Nigerian data-protection obligations, independent security review, and relevant ethics approvals.
- A consent withdrawal must be applied to future processing covered by that consent, subject to properly reviewed legal retention requirements. It does not automatically erase all historical audit evidence.

## Project principles

1. Human dignity and meaningful participation.
2. Data minimisation and purpose limitation.
3. Privacy and security by design.
4. Clear accountability and explainability.
5. Community oversight and fair benefit-sharing.
6. Open documentation and reusable public-interest infrastructure.
7. No automated diagnosis or clinical decision-making.

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) and [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md). Early contributions should focus on documentation, threat modelling, accessibility, synthetic-data tests, and governance design.

## License

The source code is released under the MIT License. See [LICENSE](LICENSE).

## Contact and collaboration

MINDCOMMON is being developed as an independent public-interest project. Any proposed institutional host, community partner, or pilot site remains subject to direct discussion and written agreement. No organisation should be understood as endorsing this repository unless it has explicitly said so.
