import type { DemoDocsPage } from '@/lib/docs-help/demo/corpus'

export const FRAMEWORK_CONTROL_PAGES: DemoDocsPage[] = [
  {
    title: 'SOC 2 CC1.1 - Commitment to Integrity and Ethical Values',
    path: '/docs/platform/standards/soc-2/cc1-1',
    keywords: ['soc 2 cc1.1', 'code of conduct', 'ethics', 'control environment'],
    body: `CC1.1 sits in the control environment criteria: the organization demonstrates a commitment to integrity and ethical values.

## Requirement

The entity sets a standard of conduct, communicates it to everyone who acts on its behalf, and evaluates adherence to it. Departures are identified and addressed in a timely manner.

## Policies

- **Code of Conduct** - States the behaviour expected of employees and contractors, and what happens when it is not met.
- **Human Resources Security Policy** - Covers background screening, onboarding acknowledgements and disciplinary process.
- **Acceptable Use Policy** - Sets expectations for how company systems and data may be used.
- **Whistleblower Policy** - Gives people a way to report concerns without going through their own management chain.

## Example Control Objectives

- **Every employee acknowledges the code of conduct** - New hires acknowledge on joining and all staff re-acknowledge annually, with the acknowledgement dated and retained.
- **Conduct concerns are recorded and resolved** - Reports raised through the reporting channel are tracked to a documented outcome within the committed timeframe.
- **Background screening completes before access is granted** - No production access is provisioned for a new hire until screening has returned.

## Evidence Requests

- The current code of conduct, showing its approval date and approver.
- The acknowledgement register for the audit period, covering the full population of employees and contractors.
- Evidence that the reporting channel exists and is communicated - a screenshot of the intranet page or the onboarding material.
- A sample of conduct reports with their outcomes, redacted as needed.
- Background screening records for a sample of hires in the period.

## Example Evidence

- An export of the HR system showing acknowledgement status and date for every active employee.
- The signed board or executive approval of the current code of conduct.
- A dated screenshot of the ethics reporting page as an employee sees it.
- The onboarding checklist template with the acknowledgement and screening steps on it.

## Frequently Asked Questions

Do contractors need to acknowledge the code of conduct?

Anyone acting on the organization's behalf is in scope. Contractors usually acknowledge through their contract or a separate acknowledgement, and auditors will expect that population to be covered too.

What if there were no conduct reports in the period?

That is a normal outcome. Evidence that the channel exists, works and was communicated is what the criterion needs; a nil return is fine as long as it is stated.`,
  },
  {
    title: 'SOC 2 CC6.1 - Logical Access Provisioning',
    path: '/docs/platform/standards/soc-2/cc6-1',
    keywords: ['soc 2 cc6.1', 'logical access', 'provisioning', 'least privilege', 'access control'],
    body: `CC6.1 covers logical access security: the organization restricts access to systems and data to those who need it.

## Requirement

The entity implements logical access security software, infrastructure and architectures over protected information assets to protect them from security events. Access is granted on approval, is limited to what the role requires, and is removed when it is no longer needed.

## Policies

- **Access Control Policy** - Defines how access is requested, approved, provisioned and revoked, and who may approve.
- **Information Security Policy** - Establishes least privilege and separation of duties as organization-wide requirements.
- **Human Resources Security Policy** - Ties provisioning and deprovisioning to the joiner, mover and leaver process.
- **Cryptography and Key Management Policy** - Covers access to keys and secrets, which is access to the data behind them.

## Example Control Objectives

- **Access is approved before it is granted** - Every production access grant in the period has a recorded approval from the system owner, dated on or before the grant.
- **Access matches the role** - Reviews find no account holding permissions beyond what its role requires.
- **Access is removed on departure** - Access for leavers is revoked within one business day of their end date.
- **Privileged access is separately controlled** - Administrative access is held by named accounts, approved separately, and reviewed quarterly.

## Evidence Requests

- The current access control policy with its approval date.
- The complete list of users with access to production systems at a point inside the audit period.
- Approval records for a sample of access grants made during the period.
- The joiner, mover and leaver register for the period, with dates.
- Evidence that access was revoked for a sample of leavers, showing the revocation date against the end date.
- The most recent user access review, showing who performed it, when, and what it changed.

## Example Evidence

- A user export from the identity provider showing every account, its groups and its status, dated inside the window.
- Ticket records for a sample of access requests, each showing the request, the approver and the provisioning step.
- The completed access review spreadsheet with reviewer sign-off and the remediation of anything flagged.
- A screenshot of the group membership behind a production role, showing that it is the group and not individuals that grants access.
- An export of terminated employees with their revocation timestamps alongside their termination dates.

## Frequently Asked Questions

How often does access need to be reviewed?

Quarterly is the common expectation for privileged access and annually for standard access, but what matters is that the cadence is stated in your policy and actually followed. A review you skipped is worse than a cadence you set honestly.

Does a screenshot of one user's permissions satisfy this?

No. The auditor is testing a population, so the evidence needs to be the full user list at a point in time, not one example from it.

What counts as timely revocation?

Whatever your policy commits to. One business day is common for standard access and immediate for privileged access; the evidence has to show you met your own commitment.`,
  },
  {
    title: 'SOC 2 CC6.6 - Boundary Protection',
    path: '/docs/platform/standards/soc-2/cc6-6',
    keywords: ['soc 2 cc6.6', 'network', 'firewall', 'boundary', 'external access', 'encryption in transit'],
    body: `CC6.6 covers the boundary between the organization's systems and everything outside them.

## Requirement

The entity implements logical access security measures to protect against threats from sources outside its system boundaries. External connections are restricted, authenticated and encrypted.

## Policies

- **Information Security Policy** - Sets the requirement for network segmentation and boundary defence.
- **Access Control Policy** - Governs remote access and what authentication it requires.
- **Cryptography and Key Management Policy** - Requires encryption in transit and defines acceptable protocols.
- **Vulnerability Management Policy** - Covers scanning of externally reachable surfaces.

## Example Control Objectives

- **Only intended services are reachable from the internet** - External scans find no listening service that is not on the approved list.
- **All external traffic is encrypted** - Public endpoints accept only current TLS versions and reject plaintext.
- **Remote access requires multi-factor authentication** - No remote session in the period authenticated with a single factor.

## Evidence Requests

- The current firewall or security group configuration for the production environment.
- The list of approved externally reachable services.
- An external vulnerability or port scan run inside the audit period.
- Configuration showing enforced TLS versions and ciphers on public endpoints.
- Evidence that remote access enforces multi-factor authentication.

## Example Evidence

- An export of production security group rules with their sources and ports.
- A dated external scan report and the tickets for anything it found.
- A TLS configuration report for the public endpoints, showing protocol versions accepted.
- A screenshot of the identity provider policy requiring a second factor for remote access.

## Frequently Asked Questions

Do internal-only services need to be in scope?

The criterion is about the external boundary, so internal services matter here only where they are reachable from outside. Segmentation evidence is what shows they are not.`,
  },
  {
    title: 'SOC 2 CC7.2 - Security Monitoring',
    path: '/docs/platform/standards/soc-2/cc7-2',
    keywords: ['soc 2 cc7.2', 'monitoring', 'logging', 'detection', 'alerts', 'anomalies'],
    body: `CC7.2 covers detection: the organization monitors its systems and identifies anomalies that could indicate a security event.

## Requirement

The entity monitors system components and the operation of those components for anomalies indicative of malicious acts, natural disasters and errors affecting its ability to meet its objectives. Anomalies are analysed to determine whether they represent security events.

## Policies

- **Logging and Monitoring Policy** - Defines what is logged, where logs go, how long they are retained and who watches them.
- **Incident Response Policy** - Says what happens once an anomaly is judged to be an event.
- **Information Security Policy** - Establishes monitoring as a standing requirement.

## Example Control Objectives

- **Security-relevant events are logged centrally** - Production systems ship logs to the central platform, and gaps in ingestion raise an alert.
- **Alerts are triaged within the committed time** - Every alert in the period has a recorded triage outcome inside the target window.
- **Logs are retained for the required period** - Retention configuration matches what the policy commits to.

## Evidence Requests

- The current logging and monitoring policy.
- The list of alert rules in force during the period.
- A sample of alerts with their triage records and outcomes.
- Configuration showing log retention and which systems are shipping logs.
- Evidence that failed log ingestion is itself detected.

## Example Evidence

- A screenshot of the alert rule configuration in the monitoring platform.
- An export of alerts for a month in the period, with timestamps and dispositions.
- The log source inventory showing which production systems report in.
- A retention setting screenshot from the log platform, dated inside the window.

## Frequently Asked Questions

Does every alert need a written investigation?

Every alert needs a recorded disposition. A one-line "known scanner, no action" is a disposition; an alert that closed with nothing recorded is the gap auditors look for.`,
  },
  {
    title: 'SOC 2 CC8.1 - Change Management',
    path: '/docs/platform/standards/soc-2/cc8-1',
    keywords: ['soc 2 cc8.1', 'change management', 'deployment', 'code review', 'release'],
    body: `CC8.1 covers change: the organization authorizes, designs, tests and approves changes before putting them into production.

## Requirement

The entity authorizes, designs, develops or acquires, configures, documents, tests, approves and implements changes to infrastructure, data, software and procedures to meet its objectives.

## Policies

- **Change Management Policy** - Defines what counts as a change, who approves it and what testing is required.
- **Secure Development Policy** - Covers code review, dependency handling and security testing in the pipeline.
- **Access Control Policy** - Restricts who can deploy to production.

## Example Control Objectives

- **Changes are reviewed before merge** - No change reached production in the period without an approval from someone other than its author.
- **Automated tests pass before deployment** - The pipeline blocks deployment on a failing test run.
- **Emergency changes are documented after the fact** - Every emergency change has a retrospective approval recorded within the committed window.

## Evidence Requests

- The current change management policy.
- The complete list of production deployments in the audit period.
- Approval records for a sample of changes, showing reviewer and date.
- Pipeline configuration showing the gates that must pass before deployment.
- The emergency change register, with its retrospective approvals.

## Example Evidence

- A pull request export showing author, reviewer and merge date for a sample of changes.
- A screenshot of branch protection settings requiring review and passing checks.
- A deployment log for the period from the CI system.
- The emergency change tickets with their after-the-fact approvals.

## Frequently Asked Questions

Do infrastructure changes count?

Yes. Anything that changes production is a change, including infrastructure as code, configuration and database migrations. Keeping infrastructure in the same review pipeline as application code is the simplest way to evidence it.`,
  },
  {
    title: 'ISO 27001 A.5.15 - Access Control',
    path: '/docs/platform/standards/iso-27001/a-5-15',
    keywords: ['iso 27001 a.5.15', 'annex a', 'access control', 'authorization'],
    body: `A.5.15 is the Annex A control for access control: rules for physical and logical access are established and implemented based on business and information security requirements.

## Requirement

Rules to control physical and logical access to information and other associated assets are established and implemented on the basis of business and information security requirements. Access rights are provisioned according to a defined topic-specific policy.

## Policies

- **Access Control Policy** - The topic-specific policy this control expects, covering both physical and logical access.
- **Information Classification Policy** - Sets the sensitivity levels that access decisions are made against.
- **Physical Security Policy** - Covers access to offices, racks and other physical assets.

## Example Control Objectives

- **Access rules are documented and current** - The access control policy has been reviewed within the last twelve months.
- **Access is granted against classification** - Access to assets classified confidential or above requires the asset owner's approval.
- **Physical access is controlled and logged** - Entry to areas holding information assets is restricted and recorded.

## Evidence Requests

- The topic-specific access control policy with its review date.
- The asset inventory with classifications and owners.
- Approval records for access to classified assets.
- Physical access records for a sample period.
- The most recent access rights review covering both logical and physical access.

## Example Evidence

- The access control policy document with the version history showing its last review.
- An asset register export showing classification and named owner per asset.
- Badge system logs for a sample month, plus the current access list for restricted areas.
- The completed access review with owner sign-offs.

## Frequently Asked Questions

Does this control duplicate SOC 2 CC6.1?

They overlap substantially. Map the two controls together and one implementation with one evidence set answers both - A.5.15 additionally expects physical access to be in scope, so make sure that part is covered.`,
  },
  {
    title: 'ISO 27001 A.8.16 - Monitoring Activities',
    path: '/docs/platform/standards/iso-27001/a-8-16',
    keywords: ['iso 27001 a.8.16', 'annex a', 'monitoring', 'anomalous behaviour'],
    body: `A.8.16 requires networks, systems and applications to be monitored for anomalous behaviour, with appropriate action taken to evaluate potential incidents.

## Requirement

Networks, systems and applications are monitored for anomalous behaviour and appropriate actions taken to evaluate potential information security incidents. The scope and frequency of monitoring are set according to business requirements and a risk assessment.

## Policies

- **Logging and Monitoring Policy** - Defines monitoring scope, baselines and who responds.
- **Incident Response Policy** - Covers evaluation and escalation once behaviour is judged anomalous.
- **Risk Management Policy** - Drives the scope and frequency decisions monitoring is set from.

## Example Control Objectives

- **Monitoring scope follows the risk assessment** - Every system rated high in the risk assessment is covered by monitoring.
- **Anomalies are evaluated, not just recorded** - Detected anomalies have a documented evaluation of whether they constitute an incident.
- **Baselines are maintained** - Detection rules are reviewed at least annually against current normal behaviour.

## Evidence Requests

- The monitoring policy and the risk assessment that sets its scope.
- The inventory of monitored systems, mapped against the risk assessment.
- A sample of detected anomalies with their evaluations.
- Records of the last review of detection rules and baselines.

## Example Evidence

- The risk assessment output alongside the monitored systems list, showing the mapping.
- Exported anomaly records with their evaluation notes and outcomes.
- The detection rule change history showing the annual review.

## Frequently Asked Questions

How is this different from A.8.15 logging?

A.8.15 is about producing and protecting logs; A.8.16 is about watching them and acting. Evidence for logging is configuration and retention; evidence for monitoring is detections and what was done about them.`,
  },
]
