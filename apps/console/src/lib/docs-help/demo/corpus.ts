import { DOCS_URL } from '@/constants/docs'

export type DemoDocsPage = {
  title: string
  path: string
  keywords?: string[]
  body: string
}

export const demoPageSource = (page: DemoDocsPage): string => `${DOCS_URL}${page.path}`

export const PLATFORM_PAGES: DemoDocsPage[] = [
  {
    title: 'Platform Overview',
    path: '/docs/platform/overview',
    keywords: ['dashboard', 'home', 'compliance home', 'getting started'],
    body: `Openlane brings your controls, policies, evidence and programs into one place so a compliance program can be run as ordinary work rather than a spreadsheet exercise.

## The Compliance Home dashboard

The dashboard is the landing page for every member of an organization. It summarizes where the program stands and links straight into the work that needs attention:

- **Program readiness** - how far each active program has progressed toward its audit window.
- **Control coverage** - controls with no owner, no implementation, or no evidence attached.
- **Tasks assigned to you** - everything waiting on you across programs, controls and policies.
- **Recent activity** - what changed in the organization in the last week.

Cards can be collapsed and reordered, and the layout is remembered per user.

## Where to go next

- [Controls](/docs/platform/compliance-management/controls/overview) are the requirements your organization commits to.
- [Programs](/docs/platform/compliance-management/programs/overview) group that work into an audit or certification effort.
- [Evidence](/docs/platform/compliance-management/evidence/overview) is the proof a control is operating.

## Frequently Asked Questions

Why is my dashboard empty?

A new organization has no programs or controls yet, so the cards have nothing to summarize. Create a program from a standard and the dashboard fills in as controls are adopted.

Can each member see a different dashboard?

The cards are the same for everyone, but the content respects permissions. You only see programs, controls and tasks you have access to.`,
  },
  {
    title: 'Controls Overview',
    path: '/docs/platform/compliance-management/controls/overview',
    keywords: ['control', 'requirement', 'subcontrol', 'catalog'],
    body: `Controls are the foundation of a compliance program. Each control states one security, privacy or operational requirement the organization commits to, and carries the owner, implementation notes and evidence that show it is being met.

## Where controls come from

- **Framework controls** are adopted from a standard such as SOC 2 or ISO 27001. Their text belongs to the framework and is read-only, but everything you attach to them is yours.
- **Custom controls** are written by your organization for requirements no framework covers.
- **Subcontrols** break a broad control into the specific things that have to be true for it to hold.

## Working with a control

A control page collects the material an auditor asks for:

- **Implementation** - how the organization actually satisfies the requirement.
- **Objectives** - the outcomes that prove the control works.
- **Policies and procedures** - the documents that mandate the behaviour.
- **Evidence** - artifacts collected on a schedule, manually or through an integration.
- **Tasks** - the remaining work, assigned to a person with a due date.

Controls can be mapped to one another, so a single implementation can answer the equivalent requirement in several frameworks at once.

## Ref codes

Every control carries a ref code that is unique within the organization. Adopting a framework control re-prefixes its code to your organization, so SOC 2 CC6.1 becomes something like AC-6.01 in your catalog while keeping the mapping back to the framework.

## Frequently Asked Questions

Can I edit a control that came from a framework?

The requirement text is owned by the framework and stays read-only, so your catalog keeps matching the standard. Implementation, objectives, owners, evidence and mappings are all yours to edit.

What is the difference between a control and a subcontrol?

A control states the requirement; a subcontrol states one specific, testable part of it. Use subcontrols when a single requirement is satisfied by several distinct practices that you want to track and evidence separately.

Do I have to adopt every control in a standard?

No. Scope is yours to set. Controls you exclude can be marked not applicable with a justification, which auditors generally expect to see recorded rather than silently omitted.`,
  },
  {
    title: 'Writing Controls',
    path: '/docs/platform/compliance-management/controls/writing-controls',
    keywords: ['create a control', 'create a subcontrol', 'new control', 'author'],
    body: `A control is worth writing when your organization does something that a framework does not describe, or describes in language nobody on your team would recognize.

## Creating a control

1. Open **Controls** and choose **Create control**.
2. Give it a **ref code**. Use the prefix your organization already uses so the catalog sorts together.
3. Write the **description** as a requirement, in the present tense: what must be true, not what someone should try to do.
4. Pick a **category** and **subcategory** so the control lands in the right part of the catalog.
5. Assign an **owner**. A control with no owner has nobody to answer for it at audit time.
6. Save, then add the implementation and at least one objective.

## Creating a subcontrol

Open the parent control and choose **Create subcontrol**. A subcontrol inherits the parent's category and framework, and extends the parent's ref code, so CC6.1 gains CC6.1.1, CC6.1.2 and so on. Everything else - owner, implementation, evidence - is set on the subcontrol itself.

## Writing a description that holds up

- State one requirement per control. Two requirements in one control means one of them gets evidence and the other does not.
- Name the thing being protected, not the tool that protects it. Tools change; the requirement should not.
- Avoid "regularly" and "periodically". Say quarterly, or say on change.
- Write it so someone outside the security team can tell whether it is being met.

Once the control exists, describe how you meet it on the [Control Implementation](/docs/platform/compliance-management/controls/implementation) tab.

## Frequently Asked Questions

Should I write a custom control or adopt a framework one?

If a framework already states the requirement, adopt it - you inherit the mapping and the auditor recognizes the language. Write a custom control when the requirement is specific to your product or your obligations.

What ref code should I use?

Keep the prefix consistent across your own controls. Openlane re-prefixes framework controls to your organization automatically, so following that prefix keeps everything sorted together.`,
  },
  {
    title: 'Control Implementation',
    path: '/docs/platform/compliance-management/controls/implementation',
    keywords: ['implementation', 'how we meet this', 'implementation details'],
    body: `An implementation records how the organization actually satisfies a control. It is the answer to an auditor asking "show me how this works here", written once and reused everywhere the control is referenced.

## Creating an implementation

Open a control, go to **Implementation** and choose **Create implementation**. Fill in:

- **Details** - what the organization does, in plain prose. Name the systems involved and who operates them.
- **Status** - draft while it is being written, published once it is accurate.
- **Implementation date** - when the practice actually started, which is often earlier than the record.
- **Verification** - who confirmed it, and when it was last checked.

## Reusing an implementation

One implementation can be attached to several controls. When two frameworks state the same requirement in different words, map the controls to each other and attach the same implementation to both, rather than describing the practice twice and letting the two copies drift apart.

## What good implementation text looks like

- Describes the current state, not a plan.
- Names the system of record, so evidence has somewhere to come from.
- Says who performs the work and how often.
- Stops short of internal detail an outside reader cannot verify.`,
  },
  {
    title: 'Programs Overview',
    path: '/docs/platform/compliance-management/programs/overview',
    keywords: ['program', 'audit', 'certification', 'readiness'],
    body: `A program is a large, high-level grouping of compliance work - an audit, a certification, or a regulatory obligation - that spans months and cuts across teams.

## What a program holds

- The **standard** it is being run against, and the controls in scope.
- The **audit window** the evidence has to cover.
- The **people** responsible: a program owner, control owners, and reviewers.
- The **tasks** that close the gap between where the program is and where it needs to be.

## Program readiness

Readiness scores a program on what is actually in place: controls with an owner, an implementation, an objective, and current evidence. A control missing any of those shows up as a gap, and gaps are what the readiness view lists first.

## Running a program

1. Create the program from a standard, or start from an existing one to carry your work forward.
2. Set the audit window and invite the people who own the work.
3. Work the gap list until readiness holds steady.
4. Freeze the evidence set when the audit opens.

## Frequently Asked Questions

Can one control belong to more than one program?

Yes, and it usually should. A control mapped into several programs is evidenced once and counts everywhere, which is the main reason to map controls across frameworks.

What happens to a program after the audit?

Close it and start the next cycle from it. The controls, implementations and mappings carry over; the evidence stays attached to the closed window so the audited period remains intact.`,
  },
  {
    title: 'Creating a Program',
    path: '/docs/platform/compliance-management/programs/create',
    keywords: ['create a program', 'new program', 'start a program'],
    body: `Programs are created from the **Programs** page with **Create program**. The wizard walks through four steps.

## 1. Choose a starting point

- **From a standard** - pick SOC 2, ISO 27001 or another catalog standard and its controls are adopted into the program.
- **From an existing program** - carries forward the controls, implementations and mappings of a program you already run, which is how most second-year audits start.
- **Empty** - for an obligation with no published standard behind it.

## 2. Name it and set the window

Give the program a name your whole company will recognize, and set the audit period. The window decides which evidence counts as current.

## 3. Assign people

Set a program owner, and optionally invite control owners and auditors now. Invitations can be sent later from the program's members tab.

## 4. Review and create

The last step lists what will be created. Adopting a full standard can bring in a few hundred controls, so this is where to trim scope before the catalog fills up.`,
  },
  {
    title: 'Policy and Procedure Management',
    path: '/docs/platform/compliance-management/policy-and-procedure-management',
    keywords: ['policy', 'policies', 'internal policy', 'procedure', 'approval'],
    body: `Policies set the rules for how the organization operates. Procedures say how those rules are carried out day to day. Both live in Openlane with their own review cycle, approvers and version history.

## The document lifecycle

- **Draft** - being written, visible only to its editors.
- **In review** - circulated to the approver group.
- **Published** - the version everyone is held to.
- **Archived** - superseded, but kept because audits look backwards.

Every transition is recorded, which is what an auditor asks for when they ask who approved a policy and when.

## Common policies

- **Information Security Policy** - defines how data is protected.
- **Access Control Policy** - governs who can reach which systems and data.
- **Incident Response Policy** - outlines how the organization responds to security events.
- **Acceptable Use Policy** - sets expectations for using company systems.
- **Business Continuity Plan** - keeps the organization running through a disruption.

## Linking documents to controls

A policy answers a control only once it is linked to it. Link from either side; the control then shows the policy as part of its implementation, and the policy shows every control that depends on it - which is how you tell what breaks if a policy is retired.

See [Policy to Framework Mapping](/docs/platform/compliance-management/policy-framework-mapping) for which policies each framework expects.

## Frequently Asked Questions

How often do policies need to be reviewed?

Most frameworks expect an annual review at minimum, and a review after any material change. Openlane tracks the review date and raises a task when one comes due.

Who should approve a policy?

Whoever is accountable for the area it covers, plus whoever your framework names. What matters for the audit is that the approver is recorded and consistent.

Can I import a policy I already have?

Yes. Upload the document or paste its text, then set the owner, approvers and review cadence. Existing version history can be recorded as archived versions.`,
  },
  {
    title: 'Writing a Policy',
    path: '/docs/platform/compliance-management/policies/create',
    keywords: ['create a policy', 'new policy', 'internal policy'],
    body: `Create a policy from **Policies** with **Create policy**. You can start from a Policy Hub template, from AI-assisted drafting, or from an empty document.

## Steps

1. **Name** the policy the way your organization refers to it. Auditors match on names.
2. Write a one-paragraph **summary**. It is what shows in lists and what control coverage matches against.
3. Set the **owner** and the **approver group**.
4. Set the **review cadence** - annual is the common default.
5. Write the body, then send it for review.

## Structure that works

- **Purpose** - why the policy exists.
- **Scope** - who and what it applies to.
- **Policy statements** - the rules themselves, numbered so controls can cite them.
- **Roles and responsibilities** - who does what.
- **Exceptions** - how one is requested and who grants it.
- **Review** - how often, and by whom.

## Linking to controls

Before publishing, link the policy to the controls it satisfies. A published policy that no control references is invisible to your programs.`,
  },
  {
    title: 'Writing a Procedure',
    path: '/docs/platform/compliance-management/procedures/create',
    keywords: ['create a procedure', 'new procedure', 'runbook'],
    body: `A procedure turns a policy statement into steps someone can follow. Create one from **Procedures** with **Create procedure**.

## Steps

1. Name the procedure for the task it performs, not the policy it serves - "Offboard an employee", not "Access Control Procedure".
2. Link it to the policy it carries out and to the controls it evidences.
3. Set the owner - the person who runs the procedure, not the person who wrote it.
4. Write the steps in order, each one an action with an actor.

## What to include

- The trigger that starts the procedure.
- Each step, with who performs it and in which system.
- What is recorded as it runs, since that record is usually the evidence.
- Where it ends, and who confirms it completed.

A procedure whose steps produce a dated record is a procedure you can evidence without extra work.`,
  },
  {
    title: 'Policy to Framework Mapping',
    path: '/docs/platform/compliance-management/policy-framework-mapping',
    keywords: ['policy framework mapping', 'which policies do I need', 'required policies'],
    body: `Frameworks expect a recognizable set of documents. This table lists the policies Openlane suggests for each framework, so you can tell at a glance what is missing before an auditor does.

| Policy | Frameworks |
| --- | --- |
| Information Security Policy | all |
| Access Control Policy | SOC 2, ISO 27001, NIST CSF |
| Acceptable Use Policy | SOC 2, ISO 27001 |
| Incident Response Policy | all |
| Business Continuity Plan | SOC 2, ISO 27001 |
| Disaster Recovery Plan | SOC 2, ISO 27001 |
| Risk Management Policy | all |
| Vendor Management Policy | SOC 2, ISO 27001 |
| Change Management Policy | SOC 2, ISO 27001 |
| Data Classification Policy | ISO 27001, NIST CSF |
| Data Retention and Disposal Policy | ISO 27001, GDPR |
| Vulnerability Management Policy | SOC 2, ISO 27001, PCI DSS |
| Secure Development Policy | SOC 2, ISO 27001 |
| Physical Security Policy | SOC 2, ISO 27001 |
| Human Resources Security Policy | ISO 27001 |
| Cryptography and Key Management Policy | ISO 27001, PCI DSS |
| Logging and Monitoring Policy | SOC 2, PCI DSS |
| Privacy Policy | GDPR, CCPA |

A policy marked "all" is expected by every framework in the catalog. The mapping is a starting point, not a scope decision - your obligations may add to it.`,
  },
  {
    title: 'Evidence Collection',
    path: '/docs/platform/compliance-management/evidence/overview',
    keywords: ['evidence', 'artifact', 'proof', 'evidence center', 'collection'],
    body: `Evidence is the proof that a control is operating, not just written down. The Evidence Center is where it is collected, reviewed and tied back to the controls it supports.

## How evidence arrives

- **Manual upload** - a screenshot, export or signed document attached to a control.
- **Recurring requests** - a task raised on a schedule, assigned to whoever holds the artifact.
- **Integrations** - pulled automatically from a connected system, so nobody has to remember.

## What makes evidence usable

- It is **dated**, and the date falls inside the audit window.
- It shows the **population**, not one example - a full user list rather than one user's settings.
- It names the **system** it came from.
- It is **reproducible**: someone else could collect the same artifact the same way.

## Renewal

Evidence expires. Each piece carries a renewal interval, and Openlane raises the next request before the current artifact goes stale, so a control does not quietly fall out of coverage mid-year.

## Frequently Asked Questions

How long should evidence be kept?

Keep it at least as long as the audit periods it covers, which in practice means several years. Archived evidence stays attached to the window it was collected for.

Can one artifact evidence several controls?

Yes. Attach it to each control it supports rather than uploading copies - one artifact with several links keeps the review in one place.

What if a control cannot be evidenced automatically?

Set a recurring evidence request with an owner and an interval. A dated, manually collected artifact is perfectly acceptable; an undated one is not.`,
  },
  {
    title: 'Standards and Frameworks',
    path: '/docs/platform/standards/overview',
    keywords: ['standard', 'framework', 'catalog', 'soc 2', 'iso 27001', 'nist'],
    body: `The standards catalog holds the frameworks Openlane can run a program against, along with the OL Baseline - a starting set of controls for organizations with no framework obligation yet.

## Catalog standards

- **SOC 2** - trust services criteria for security, availability, confidentiality, processing integrity and privacy.
- **ISO/IEC 27001** - an information security management system and its Annex A controls.
- **NIST CSF** - identify, protect, detect, respond and recover.
- **PCI DSS** - requirements for handling cardholder data.
- **OL Baseline** - Openlane's own starting set, mapped onward to the frameworks above.

## Adopting a standard

Opening a standard shows its controls with their ref codes and requirement text. Adopting brings them into your catalog, re-prefixed to your organization, with the mapping back to the framework preserved.

## Mapping between standards

Most requirements repeat across frameworks in different words. Mapping two controls together means one implementation and one set of evidence answers both, which is what keeps a second framework from doubling the work.`,
  },
  {
    title: 'Reviews',
    path: '/docs/platform/exposure/reviews/overview',
    keywords: ['review', 'risk review', 'exposure', 'assessment'],
    body: `A review is a scheduled look at a slice of your exposure - a risk, a vendor, a system - recorded so the decision and its reasoning survive the person who made it.

## What a review records

- The **subject** under review and its current rating.
- The **reviewer** and the date.
- The **decision**: accept, mitigate, transfer or avoid.
- The **rationale**, which is the part auditors read.
- Any **follow-up tasks** the decision creates.

## Cadence

Reviews are scheduled per subject. High-rated risks are usually reviewed quarterly, everything else annually, and any subject can be reviewed on demand after an incident or a material change.

## Reading the queue

The review queue sorts by what is overdue first, then by rating. A subject with no review on record shows as never reviewed rather than as current, so gaps do not hide.`,
  },
  {
    title: 'Vulnerabilities',
    path: '/docs/platform/exposure/vulnerabilities/overview',
    keywords: ['vulnerability', 'triage', 'cve', 'scanner', 'exposure', 'patch'],
    body: `Vulnerabilities arrive from connected scanners and from manual reports, and land in the triage queue until someone decides what happens to them.

## The triage queue

Each finding carries its severity, the affected asset, where it came from and how long it has been open. Triage assigns it an owner and one of four outcomes:

- **Remediate** - fix it, with a due date driven by severity.
- **Mitigate** - reduce the exposure without removing the cause.
- **Accept** - record the acceptance and who signed it.
- **False positive** - dismiss it with a reason, so the same finding does not return unexplained.

## Remediation windows

Windows come from your vulnerability management policy. A common set is critical within 7 days, high within 30, medium within 90 and low at the next planned change. Openlane counts against those and surfaces anything past due.

## Evidence

The queue itself is evidence: the record of findings, decisions and closure dates is what demonstrates the control operates. Scanner output alone shows the scan ran, not that anything was done about it.`,
  },
  {
    title: 'Frameworks',
    path: '/docs/platform/trust-center/frameworks',
    keywords: ['trust center', 'public', 'frameworks', 'badge', 'customer facing'],
    body: `The trust center is the public face of your compliance program. The frameworks section lists the standards you want visitors to see, along with the current status of each.

## Publishing a framework

1. Pick the framework from the ones your programs run against.
2. Set its status: in progress, certified, or report available.
3. Add the certification date and, if you have one, the report.
4. Publish. Nothing appears publicly until it is published.

## What visitors see

- The framework name and status badge.
- The certification or report date.
- Optionally, the public representation of individual controls - your own wording for how you meet a requirement, written for an outside reader.

## Public representations

Control text and implementation notes are internal. A public representation is the version you are willing to publish: what the organization does, in plain prose, with no internal system names, ticket numbers or staff names. Each control keeps its own, and only published ones are visible.`,
  },
  {
    title: 'Authentication',
    path: '/docs/platform/settings/authentication',
    keywords: ['authentication', 'single sign-on', 'sso', 'saml', 'oidc', 'passkey', 'mfa', 'login'],
    body: `Organization authentication settings decide how members prove who they are.

## Sign-in methods

- **Email and password** with a required second factor.
- **Google** and **GitHub** OAuth.
- **Passkeys**, which satisfy multi-factor on their own.
- **SAML or OIDC single sign-on** against your identity provider.

## Enforcing single sign-on

Once SSO is verified for a domain, enforcing it turns off every other method for members with an address on that domain. Keep one break-glass owner account outside the enforced domain; if the identity provider is unreachable and every account depends on it, nobody can get in to fix it.

## Multi-factor authentication

MFA can be required for the whole organization. Members without a second factor are prompted to enrol at their next sign-in and cannot reach organization data until they do.

## Sessions

Session lifetime and idle timeout are set per organization. Shortening either takes effect at the next sign-in rather than ending sessions already open.

## Frequently Asked Questions

What happens to members who are not in my identity provider when I enforce SSO?

They lose access at their next sign-in. Provision them in the identity provider first, or leave their domain out of the enforcement.

Does a passkey count as multi-factor?

Yes. A passkey binds the credential to the device and its unlock, so a member signing in with one is not prompted for a second factor.`,
  },
  {
    title: 'Members, Groups and Roles',
    path: '/docs/platform/basics/groups/overview',
    keywords: ['user management', 'members', 'groups', 'roles', 'permissions', 'invite', 'access'],
    body: `Access in Openlane is granted to groups, and members inherit it by belonging to them. Managing access one person at a time is possible but does not survive a growing team.

## Roles

- **Owner** - full control of the organization, including billing and deletion.
- **Admin** - manages members, groups and settings.
- **Member** - works with the objects their groups grant access to.
- **View only** - reads what they are granted, changes nothing.

## Groups

A group collects members and holds permissions on objects: programs, controls, policies, procedures and evidence. Permissions are grants, not denials - a member's access is the union of every group they belong to.

Groups are usually built around how the work is actually divided: one per program, one for the security team, one for auditors with view-only access to a single program.

## Inviting members

Invite by email from **User management**. The invitation carries the role and any groups you pick, so a new member has the right access on their first sign-in rather than waiting on a follow-up request.

## Frequently Asked Questions

Why can a member not see a program I added them to?

Access comes from groups, not from the program's member list alone. Check the member belongs to a group that holds permissions on that program.

Can auditors be given access without seeing everything?

Yes. Create a view-only group scoped to the one program under audit and invite them into it.`,
  },
  {
    title: 'Integrations Overview',
    path: '/docs/platform/integrations/overview',
    keywords: ['integration', 'connect', 'github', 'slack', 'aws', 'okta', 'automated evidence'],
    body: `Integrations connect the systems that already hold your evidence, so artifacts arrive on a schedule instead of being collected by hand.

## Connecting a provider

1. Open **Integrations** and pick the provider.
2. Authorize it. Openlane requests the narrowest scope that satisfies the evidence it collects.
3. Choose which controls the collected evidence attaches to.
4. Set the collection interval.

## What a connected provider does

- Collects its artifacts on the interval you set.
- Attaches each one to the controls you mapped, dated at collection time.
- Raises a task if collection fails, rather than leaving a silent gap.

## Disconnecting

Disconnecting stops collection and leaves the evidence already gathered in place. Evidence stays attached to the audit window it was collected for, so removing an integration does not remove history.`,
  },
  {
    title: 'Tasks',
    path: '/docs/platform/automation/tasks',
    keywords: ['task', 'assignment', 'due date', 'work'],
    body: `Tasks are the unit of remaining work. Every gap Openlane finds - a control with no owner, an overdue policy review, an evidence request coming due - can be turned into a task with an assignee and a date.

## Creating tasks

Create a task from any object it belongs to, so it carries that context. A task raised from a control shows on the control; a task raised from a policy review shows on the policy.

## Recurring tasks

Evidence requests and policy reviews create their tasks on a schedule. The next one is raised before the current artifact or approval goes stale, which is what keeps coverage continuous rather than annual.

## Assignment

A task with no assignee is not work, it is a note. Assign to a person rather than a group, and let the group own the object instead.`,
  },
]

export const DEVELOPER_PAGES: DemoDocsPage[] = [
  {
    title: 'API Overview',
    path: '/docs/developers/api/overview',
    keywords: ['api', 'graphql', 'developers', 'query', 'mutation', 'endpoint'],
    body: `The Openlane API is GraphQL. One endpoint serves every object in the platform, and the schema is introspectable, so the schema itself is the reference.

## Endpoint

All operations go to a single /query endpoint over HTTPS with an Authorization header. There is no separate REST surface for platform objects.

## Conventions

- **Connections** - list queries return edges and nodes with cursor pagination.
- **Where inputs** - filters are structured objects rather than query strings.
- **History** - most objects carry a history connection recording who changed what and when.
- **Organization scope** - every request runs in the context of one organization, taken from the token.

## Rate limits

Requests are limited per token. Exceeding the limit returns an error naming when the window resets; back off rather than retrying immediately.`,
  },
  {
    title: 'API Authentication',
    path: '/docs/developers/api/authentication',
    keywords: ['api token', 'personal access token', 'pat', 'bearer', 'developers auth'],
    body: `The API accepts two kinds of credential, and the difference matters for what they can reach.

## Personal access tokens

A personal access token acts as you, across the organizations you belong to. Use one for scripts you run yourself. It carries your permissions, so it inherits your access and loses it when yours changes.

## API tokens

An API token belongs to an organization rather than a person, and holds only the scopes granted when it was created. Use one for anything that has to keep running when a person leaves.

## Using a token

Send it as a bearer token in the Authorization header on every request. Tokens are shown once at creation and stored hashed; a lost token is replaced, not recovered.

## Rotation

Give every token an expiry. Create the replacement, move traffic to it, then revoke the old one - revoking first means an outage while the new token is deployed.`,
  },
]
