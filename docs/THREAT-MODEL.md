# Initial threat model

This is an early design checklist, not a completed security assessment.

## Assets to protect

- Participant identity and contact information.
- Mental-health-related information and programme records.
- Consent choices and withdrawal history.
- Access requests, reviewer decisions, and audit records.
- Credentials, signing keys, and service configuration.
- Community governance records where disclosure could expose individuals.

## Threat actors and failure modes

| Threat | Possible impact | Initial mitigation direction |
| --- | --- | --- |
| Unauthorised staff access | Exposure or misuse of sensitive information | Least privilege, role separation, access reviews |
| Stolen account/session | Unauthorised access or decisions | MFA for privileged roles, session expiry, rotation, monitoring |
| Over-broad research request | Use outside agreed purpose | Purpose and scope review, policy enforcement, expiry |
| Consent state not propagated | Processing continues after withdrawal | Central consent check at each protected operation |
| Insider alters event history | Loss of accountability | Restricted append path, integrity monitoring, external review |
| Re-identification of de-identified records | Participant exposure | Data minimisation, disclosure review, small-cell suppression where appropriate |
| Misleading interface | Participant misunderstands a choice | Plain language, accessibility testing, comprehension checks |
| Data breach or misconfiguration | Exposure at rest or in transit | Secure configuration, encryption, patching, incident response |

## Prototype limitations

The static demonstration has no identity verification, access control, server-side data protection, secure audit trail, or durable storage. Anyone able to use browser developer tools can alter local state. It is unsuitable for real data.

## Before any real-data pilot

- Complete a documented data-flow map and threat assessment.
- Conduct a data protection impact assessment and legal review for applicable requirements.
- Obtain appropriate ethics review and host/community approval.
- Define a safeguarding and incident-response plan.
- Commission independent application and infrastructure security testing.
- Verify backups, recovery, key management, access review, and retention/deletion procedures.
- Test with synthetic data before considering any controlled pilot.
