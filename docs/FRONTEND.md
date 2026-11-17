# Browser setup and testing

The MINDCOMMON browser workspace is a plain HTML/CSS/JavaScript client. It talks to the Express API and does not keep consent/request state as local browser mock data.

## Local run

1. Start MongoDB using a development-only database.
2. Configure the API using \`.env.example\`.
3. Run \`npm install\` and \`npm run dev\`.
4. Serve the repository root from the same machine:

   \`\`\`bash
   python3 -m http.server 5500
   \`\`\`

5. Visit \`http://localhost:5500\`.

The default API base is configured in the \`mindcommon-api-base\` meta tag in \`index.html\`. The default value is \`http://localhost:4000/api\`.

## Browser origin and cookies

The local \`.env\` example allows \`http://localhost:5500\`. Use the same hostname consistently in the browser and API URL; do not open the app as \`127.0.0.1\` while the API URL is configured as \`localhost\`.

The client uses \`credentials: include\`. The API sets a JWT in an HttpOnly cookie and never returns the token to frontend JavaScript. Local cookies are not marked Secure because the local development server uses HTTP. Production must use HTTPS and \`COOKIE_SECURE=true\`.

For a frontend and API on the same site but different subdomains, review the cookie domain and SameSite configuration. For genuinely cross-site domains, use \`COOKIE_SAME_SITE=none\`, \`COOKIE_SECURE=true\`, HTTPS, exact \`CORS_ORIGINS\`, and a security review before launch.

## Participant workflow

1. Register with a fictional name and test email address.
2. Open My consent and grant one purpose.
3. Open Access requests and submit a synthetic-demo proposal.
4. Review the proposal status and reviewer note.
5. Open Audit trail to see API-recorded actions.

## Reviewer workflow

1. Register a second fictional account.
2. Sign in once to create that account in the development database.
3. Stop the API or use a separate terminal while retaining the development database.
4. Promote the second account using the explicitly guarded local-only command:

   \`\`\`bash
   ALLOW_LOCAL_ROLE_PROMOTION=true npm run promote:local-role -- reviewer@example.test reviewer
   \`\`\`

5. Restart the API, sign in as the reviewer account, and open Access requests.
6. Record an approve/reject decision with a reason of at least 10 characters.

The local helper refuses to run when \`NODE_ENV=production\`. It must not be used as a production role-management process.

## Limitations

- This is a demo of governance metadata, not a secure health-data platform.
- No health record is stored or returned through the API.
- A successful approval is a workflow record only and does not grant technical access to a dataset.
- There is no password reset, email verification, MFA, refresh/session revocation, or dedicated CSRF token mechanism yet.
- The browser still requires accessibility testing and security review.
