# MINDCOMMON

**Community-owned mental health data and responsible AI governance infrastructure.**

MINDCOMMON is an early-stage, open-source public-interest technology project exploring how communities in Nigeria can exercise meaningful control over mental-health-related data: why it is collected, who can access it, how it may be shared, and whether it may be used in research or AI development.

> **Status: prototype / research and co-design stage.** This repository is not a clinical system, health-record platform, or production data service. Do not enter real personal, patient, or mental-health information. The demonstration uses synthetic data only.

## Why this project

Digital mental-health programmes and research can create value, but they also raise questions of consent, privacy, power, accountability, and who benefits from data use. MINDCOMMON aims to make those decisions visible and contestable, while ensuring affected communities have a meaningful role in setting the rules.

## Initial areas of work

- **Consent:** clear, purpose-specific permissions, versioning, and withdrawal.
- **Access governance:** records of who requests access, for what purpose, and the decision made.
- **Transparency:** reviewable audit events for governance decisions and consent changes.
- **Community oversight:** mechanisms for community participation in decisions about research, secondary use, and benefit-sharing.

These are design goals, not claims that the current prototype provides legally sufficient consent or production-grade security.

## Project principles

1. Human dignity and meaningful participation.
2. Data minimisation and purpose limitation.
3. Privacy and security by design.
4. Clear accountability and explainability.
5. Community oversight and fair benefit-sharing.
6. Open documentation and reusable public-interest infrastructure.
7. No automated diagnosis or clinical decision-making.

## Repository status

The first repository release establishes project documentation and a safe implementation baseline. The next engineering increments are planned in [docs/ROADMAP.md](docs/ROADMAP.md).

## Local prototype

The current browser demonstration is intentionally static and uses synthetic sample records only.

1. Open `index.html` in a modern browser.
2. Explore the consent, access-request, audit, and community-governance views.
3. Changes are local to the browser demonstration; they are not stored in a server database.

No build step is required for the static prototype.

## Planned backend direction

The planned API is Node.js/Express with MongoDB, schema validation, authenticated roles, consent versioning, and an auditable access-request workflow. Backend work must not be treated as production-ready until security testing, privacy review, data-protection/legal review, ethics review where applicable, and community/host approval have taken place.

## Safety and data handling

- Use synthetic data for development, screenshots, tests, and demos.
- Never commit personal data, patient data, credentials, API keys, private keys, or production database dumps.
- Do not connect this prototype to a real mental-health programme or dataset.
- A future pilot requires documented community participation, appropriate consent processes, safeguarding, an assessment of applicable Nigerian data-protection obligations, independent security review, and relevant ethics approvals.
- A consent withdrawal must stop future processing covered by that consent; it must not be represented as automatically erasing legally required records or historical audit evidence.

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) and [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md). Early contributions should focus on documentation, threat modelling, accessibility, synthetic-data tests, and governance design.

## License

The source code is released under the MIT License. See [LICENSE](LICENSE). Documentation is provided for public-interest reuse; check the individual file headers and repository license before redistributing third-party materials.

## Contact and collaboration

MINDCOMMON is being developed as an independent public-interest project. Any proposed institutional host, community partner, or pilot site remains subject to direct discussion and written agreement. No organisation should be understood as endorsing this repository unless it has explicitly said so.
