import { type OnboardingQuestionsResponse } from './types'

export const mockOnboardingQuestionsResponse: OnboardingQuestionsResponse = {
  success: true,
  version: '2026-07-16',
  steps: [
    {
      key: 'company_info',
      title: 'Company Info',
      description: 'We will use this information to configure your workspace',
      order: 1,
      hidden: false,
      questions: [
        {
          key: 'company_name',
          label: 'Company Name',
          inputType: 'string',
          required: true,
          hidden: false,
        },
        {
          key: 'company_domains',
          label: 'Company Domains',
          description: 'Used to automatically discover your technology and allow teammates to join your organization',
          inputType: 'multi-input',
          required: true,
          hidden: false,
        },
        {
          key: 'company_size',
          label: 'Company Size',
          inputType: 'select',
          required: false,
          hidden: false,
          options: [
            { value: '1-10', label: '1-10', hidden: false },
            { value: '11-50', label: '11-50', hidden: false },
            { value: '51-200', label: '51-200', hidden: false },
            { value: '201-500', label: '201-500', hidden: false },
            { value: '501-1000', label: '501-1000', hidden: false },
            { value: '1001+', label: '1001+', hidden: false },
          ],
        },
        {
          key: 'company_sector',
          label: 'Company Sector',
          inputType: 'select',
          required: false,
          hidden: false,
          options: [
            { value: 'technology', label: 'Technology', hidden: false },
            { value: 'healthcare', label: 'Healthcare', hidden: false },
            { value: 'financial_services', label: 'Financial Services', hidden: false },
            { value: 'retail', label: 'Retail', hidden: false },
            { value: 'education', label: 'Education', hidden: false },
            { value: 'other', label: 'Other', hidden: false },
          ],
        },
        {
          key: 'company_sector_other',
          label: 'Please specify',
          inputType: 'string',
          required: false,
          hidden: false,
          dependsOn: { key: 'company_sector', equals: 'other' },
        },
      ],
    },
    {
      key: 'user_info',
      title: 'User Info',
      description: 'Help us personalize recommendations and templates',
      order: 2,
      hidden: false,
      questions: [
        {
          key: 'user_department',
          label: 'Department',
          inputType: 'select',
          required: false,
          hidden: false,
          options: [
            { value: 'security', label: 'Security', hidden: false },
            { value: 'engineering', label: 'Engineering', hidden: false },
            { value: 'compliance', label: 'Compliance', hidden: false },
            { value: 'legal', label: 'Legal', hidden: false },
            { value: 'operations', label: 'Operations', hidden: false },
            { value: 'other', label: 'Other', hidden: false },
          ],
        },
        {
          key: 'user_role',
          label: 'Role',
          inputType: 'select',
          required: false,
          hidden: false,
          options: [
            { value: 'founder', label: 'Founder / Executive', hidden: false },
            { value: 'security', label: 'Security', hidden: false },
            { value: 'engineering', label: 'Engineering', hidden: false },
            { value: 'compliance', label: 'Compliance', hidden: false },
            { value: 'operations', label: 'Operations', hidden: false },
            { value: 'other', label: 'Other', hidden: false },
          ],
        },
        {
          key: 'user_role_other',
          label: 'Please specify',
          inputType: 'string',
          required: false,
          hidden: false,
          dependsOn: { key: 'user_role', equals: 'other' },
        },
      ],
    },
    {
      key: 'compliance_setup',
      title: 'Compliance Setup',
      order: 3,
      hidden: false,
      questions: [
        {
          key: 'frameworks',
          label: 'Which frameworks are you working toward?',
          description: 'Select all that apply',
          inputType: 'multiselect',
          required: false,
          hidden: false,
          options: [
            {
              value: 'soc2',
              label: 'SOC 2',
              description:
                'The 2017 Trust Services Criteria for Security, Availability, Processing Integrity, Confidentiality, and Privacy presents control criteria established by the Assurance Services Executive Committee (ASEC) of the AICPA for use in attestation or consulting engagements to evaluate and report on controls over the security, availability, processing integrity, confidentiality, or privacy of information and systems (a) across an entire entity; (b) at a subsidiary, division, or operating unit level; (c) within a function relevant to the entities operational, reporting, or compliance objectives; or (d) for a particular type of information used by the entity',
              hidden: false,
              order: 1,
            },
            {
              value: 'iso42001',
              label: 'ISO 42001',
              description:
                'Reference control objectives and controls (Annex A) for establishing and operating an AI Management System (AIMS). Derived from public summaries of ISO/IEC 42001:2023 Annex A for interoperability; obtain the standard for authoritative text.',
              hidden: false,
              order: 2,
            },
            {
              value: 'iso27001:2022',
              label: 'ISO 27001',
              description:
                'ISO/IEC 27001:2022 is the international standard for information security management systems (ISMS). It provides a systematic approach to managing sensitive company information, ensuring its confidentiality, integrity, and availability. The standard outlines a risk-based approach to establishing, implementing, maintaining, and continually improving an ISMS.',
              hidden: false,
              order: 3,
            },
            {
              value: 'hipaa-security-rule',
              label: 'HIPAA',
              description:
                "HIPAA establishes national standards to protect individuals' medical records and other personal health information and applies to health plans, health care clearinghouses, and healthcare providers",
              hidden: false,
              order: 4,
            },
            {
              value: 'pci-dss-v4',
              label: 'PCI DSS',
              description: 'PCI DSS is a set of security standards designed to ensure that all companies that accept, process, store or transmit credit card information maintain a secure environment',
              hidden: false,
              order: 5,
            },
            {
              value: 'fedramp-rev5-moderate',
              label: 'FedRAMP Moderate',
              description:
                'FedRAMP is a U.S. government program that provides a standardized approach to security assessment, authorization, and continuous monitoring for cloud products and services',
              hidden: false,
              order: 6,
            },
            {
              value: 'gdpr-2016',
              label: 'GDPR',
              description:
                'The GDPR is a regulation in EU law on data protection and privacy in the European Union and the European Economic Area. It also addresses the transfer of personal data outside the EU and EEA areas.',
              hidden: false,
              order: 7,
            },
            {
              value: 'iso-27002-2022',
              label: 'ISO 27002',
              description:
                'ISO/IEC 27002:2022 provides guidance on information security controls intended for use by organizations for selecting, implementing and managing information security controls',
              hidden: false,
              order: 8,
            },
            {
              value: 'nist-800-171-r3',
              label: 'NIST 800-171',
              description: 'NIST SP 800-171 provides recommended security requirements for protecting the confidentiality of CUI in nonfederal systems and organizations',
              hidden: false,
              order: 9,
            },
            {
              value: 'nist-800-53-rev5',
              label: 'NIST 800-53',
              description:
                'This publication provides a catalog of security and privacy controls for information systems and organizations to protect organizational operations and assets, individuals, other organizations, and the Nation from a diverse set of threats and risks, including hostile attacks, human errors, natural disasters, structural failures, foreign intelligence entities, and privacy risks. The controls are flexible and customizable and implemented as part of an organization-wide process to manage risk. The controls address diverse requirements derived from mission and business needs, laws, executive orders, directives, regulations, policies, standards, and guidelines. Finally, the consolidated control catalog addresses security and privacy from a functionality perspective (i.e., the strength of functions and mechanisms provided by the controls) and from an assurance perspective (i.e., the measure of confidence in the security or privacy capability provided by the controls). Addressing functionality and assurance helps to ensure that information technology products and the systems that rely on those products are sufficiently trustworthy.',
              hidden: false,
              order: 10,
            },
            {
              value: 'nist-csf-2',
              label: 'NIST CSF',
              description:
                'The Framework provides a common language for understanding, managing, and expressing cybersecurity risk to internal and external stakeholders. It can be used to help identify and prioritize actions for reducing cybersecurity risk, and it is a tool for aligning policy, business, and technological approaches to managing that risk. It can be used to manage cybersecurity risk across entire organizations or it can be focused on the delivery of critical services within an organization.',
              hidden: false,
              order: 11,
            },
            { value: 'other', label: 'Other', hidden: false, order: 12 },
          ],
        },
        {
          key: 'other_framework_description',
          label: 'Which other framework(s)?',
          inputType: 'string',
          required: false,
          hidden: false,
          dependsOn: { key: 'frameworks', equals: 'other' },
        },
      ],
    },
    {
      key: 'current_state',
      title: 'Current State',
      description: 'Help us understand what you already have so we can personalize your workspace',
      order: 4,
      hidden: false,
      sections: [
        {
          key: 'controls',
          title: 'Controls',
          description: 'Security practices your team already has in place such as:',
          helpText: 'Controls are the day-to-day security and operational practices your organization follows to reduce risk and meet compliance requirements.',
          examples: ['MFA', 'Access reviews', 'Backups'],
          questions: [
            {
              key: 'has_existing_controls',
              label: 'Do you already have these documented?',
              inputType: 'boolean',
              options: [
                { value: 'true', label: 'Yes', hidden: false },
                { value: 'false', label: 'Not Yet', hidden: false },
              ],
              required: false,
              hidden: false,
            },
          ],
        },
        {
          key: 'policies',
          title: 'Policies',
          description: 'Written documents that explain how your organization operates such as:',
          examples: ['Access Control', 'Incident Response', 'Acceptable Use'],
          helpText: 'Policies are the written documents that define how your organization operates to reduce risk and meet compliance requirements.',
          questions: [
            {
              key: 'has_existing_policies',
              label: 'Do you already have these documented?',
              inputType: 'boolean',
              options: [
                { value: 'true', label: 'Yes', hidden: false },
                { value: 'false', label: 'Not Yet', hidden: false },
              ],
              required: false,
              hidden: false,
            },
          ],
        },
      ],
    },
    {
      key: 'support_preferences',
      title: 'Support Preferences',
      description: "Optional. Choose any support that's helpful to you.",
      order: 5,
      hidden: false,
      sections: [
        {
          key: 'compliance_support',
          questions: [
            {
              key: 'auditor_status',
              label: 'Are you currently working with an auditor?',
              description: "We'll tailor our recommendations based on where you are in the audit process",
              inputType: 'select',
              required: false,
              hidden: false,
              options: [
                { value: 'yes', label: "Yes, we're working with one", hidden: false },
                { value: 'recommendations', label: "No, I'd like recommendations", hidden: false },
                { value: 'not_yet', label: 'Not yet', hidden: false },
              ],
            },
            {
              key: 'auditor_name',
              label: 'Auditor name',
              inputType: 'string',
              required: false,
              hidden: false,
              dependsOn: { key: 'auditor_status', equals: 'yes' },
            },
            {
              key: 'auditor_email',
              label: 'Auditor email',
              inputType: 'string',
              format: 'email',
              required: false,
              hidden: false,
              dependsOn: { key: 'auditor_status', equals: 'yes' },
            },
            {
              key: 'vciso_preference',
              label: 'Would you like us to recommend a compliance partner?',
              description: 'We can connect you with trusted partners to help you build your compliance program or prepare for your audit',
              inputType: 'select',
              required: false,
              hidden: false,
              options: [
                { value: 'connect_vciso_partner', label: "Yes, I'd like an introduction", hidden: false },
                { value: 'no', label: 'No thanks', hidden: false },
                { value: 'maybe_later', label: 'Maybe later', hidden: false },
              ],
            },
          ],
        },
        {
          key: 'get_started',
          questions: [
            {
              key: 'demo_requested',
              label: 'Would you like help getting started?',
              description: 'Our team can help with onboarding, product questions, and best practices',
              inputType: 'checkbox',
              checkboxLabel: "I'd like an Openlane team member to reach out",
              required: false,
              hidden: false,
            },
          ],
        },
      ],
    },
    {
      key: 'trial',
      title: "We're detecting your setup",
      description: "We're scanning {{domain}} to identify systems, vendors, assets, and security findings. This can take a few minutes, but you do not need to stay on this page.",
      order: 6,
      hidden: false,
      cards: [
        {
          key: 'compliance',
          title: 'Compliance',
          description: 'Build your compliance program with frameworks, controls, policies, and audit-ready evidence',
        },
        {
          key: 'trust_center',
          title: 'Trust Center',
          description: 'Share your security posture with customers through a public-facing trust center',
        },
      ],
    },
  ],
}
