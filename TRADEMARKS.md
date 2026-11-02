# Openlane trademark guidelines

Effective date: October 30, 2026
Version: 1.1

"Openlane", "theopenlane", the Openlane logo, and related names, logos, and designs (the "Openlane Marks") are trademarks of theopenlane, Inc. The code in this repository is licensed under the [Apache License 2.0](LICENSE). That license covers the code only. As Section 6 of the license states, it does not grant permission to use the trade names, trademarks, service marks, or product names of the licensor, except as required for reasonable and customary use in describing the origin of the work.

These guidelines explain how you may and may not use the Openlane Marks when you use, modify, or redistribute this software. Their purpose is to make sure people can tell whether they are using software built and operated by theopenlane, Inc. or something built by someone else.

Nothing in these guidelines restricts uses that trademark law permits without a license, such as truthful, non-misleading references to Openlane. If you want to use the Openlane Marks in a way these guidelines do not cover, ask first. Contact [info@theopenlane.io](mailto:info@theopenlane.io) with questions or permission requests.

## Definitions

These terms are used throughout the guidelines:

- **Own-program deployment**: an instance of this software that you operate to run your own organization's security and compliance program. Inviting people outside your organization to interact with it for that purpose, such as auditors reviewing evidence, vendors answering questionnaires, or visitors to your trust center, does not change its status.
- **Third-party offering**: an instance of this software, or a modified version of it, that you make available to other organizations or the public as a product or service, whether free or paid.
- **Source fork**: a copy of this repository's source code hosted on a code hosting service, with or without modifications, that is not itself a running deployment.

## Use of the Openlane name

You may use the words "Openlane" and "theopenlane" without permission to:

- Refer truthfully to the Openlane project or to theopenlane, Inc.
- Describe that your software is based on, derived from, or compatible with Openlane, as described in [Acceptable attribution](#acceptable-attribution)
- Write articles, reviews, tutorials, and other commentary about Openlane, including criticism
- Name a source fork of this repository with the same name as the original, such as `openlane-ui`, so long as the fork's description makes clear it is not the original
- Name an integration, plugin, client, or other tool that works with Openlane in a way that describes that relationship, such as `terraform-provider-openlane` or `openlane-cli-wrapper`, so long as the name does not suggest the tool is made or endorsed by theopenlane, Inc.

When you use the name:

- Write it as "Openlane", with a capital O and a lowercase l, never "OpenLane" or "Open Lane"
- Use it as an adjective or to identify the project, not as a generic term
- Do not combine it with other words or marks to form the name of a product or service, such as "OpenlanePlus" or "Openlane Hub by Example Corp"
- Do not use it, or a confusingly similar name, as the name of a product, service, or company, or in a domain name, social media handle, or app store listing for a product or service

## Use of the Openlane logo and brand artwork

You may not use the Openlane logo, wordmark, icons, or other brand artwork without written permission, except as described in this section. This includes the logo component in [packages/ui/src/logo/](packages/ui/src/logo/) and the brand assets under [apps/console/public/](apps/console/public/).

You may reproduce the logo without permission when it appears incidentally in an unaltered screenshot or recording of the software used in an article, review, tutorial, or other commentary about Openlane. Do not crop, extract, or alter the logo from such material for separate use.

## Requirements for third-party offerings

You may fork this repository and deploy it. An own-program deployment does not need to be rebranded. If you operate a third-party offering, you must:

1. Rename the product. Remove "Openlane" from the product name, page titles, metadata, email templates, and any other place a user would read it as the name of the service.
2. Remove or replace the Openlane logo, favicon, wordmark, icons, and other brand artwork.
3. Leave customer testimonials, customer logos, and case studies disabled. The console hides them automatically on hosts that theopenlane, Inc. does not operate, including the testimonials in [apps/console/src/components/shared/auth-marketing-panel/](apps/console/src/components/shared/auth-marketing-panel/). Do not re-enable them. They belong to Openlane and its customers and are not licensed for reuse.
4. Replace Openlane legal documents and support links as described in [Replacing Openlane-specific legal documents and support links](#replacing-openlane-specific-legal-documents-and-support-links).
5. Use your own domain. Do not use a domain, subdomain, or URL path that contains "openlane" or a confusingly similar term.
6. Make sure the deployment does not connect to Openlane-operated backend services, status pages, analytics, or support tooling unless you have an agreement with theopenlane, Inc. to do so.

These requirements apply to the built and deployed product. They do not require you to rename a source fork or to remove "openlane" from repository names, package names, or import paths.

You must keep the Openlane name in places that describe where the code came from, such as copyright notices, license files, and the `NOTICE` file if one is present, as the Apache License 2.0 requires. You may keep it in source code comments and commit history.

Own-program deployments and source forks remain subject to [Restrictions on implying official affiliation](#restrictions-on-implying-official-affiliation).

## The unofficial deployment banner

When the console runs on a host that theopenlane, Inc. does not operate, it shows a banner stating that the deployment is not operated by or affiliated with Openlane, and it hides Openlane-specific content such as testimonials, legal links, and support channels. The check that controls this behavior is in [packages/ui/lib/official-deployment.ts](packages/ui/lib/official-deployment.ts).

The banner is the expected state for an own-program deployment. You may leave it in place. It does not by itself make a third-party offering compliant; a third-party offering must meet every requirement in [Requirements for third-party offerings](#requirements-for-third-party-offerings) whether or not the banner is shown.

If you remove the banner by changing `OFFICIAL_DOMAIN` to your own domain, you must also meet every requirement in that section. Changing the constant alone causes the console to present itself as Openlane, which violates these guidelines and is an unauthorized use of the Openlane Marks. The same change also turns on features that call Openlane-operated services, which requirement 6 prohibits without an agreement.

## Restrictions on implying official affiliation

Do not use the Openlane Marks in any way that suggests your product, service, deployment, or organization is:

- Made, operated, sponsored, endorsed, certified, or supported by theopenlane, Inc.
- An official, hosted, managed, or enterprise edition of Openlane
- A partner, reseller, or authorized provider of Openlane, unless you have a written agreement saying so

Do not present a modified version of this software as Openlane. A modified version is a different product, and users must be able to tell the difference.

Do not use the Openlane Marks in connection with false or misleading statements about Openlane or theopenlane, Inc., or in connection with illegal activity.

## Replacing Openlane-specific legal documents and support links

The Openlane Terms of Service, Privacy Policy, and support channels apply only to services operated by theopenlane, Inc. They do not apply to your deployment, and you may not present them as if they do.

The console hides the Openlane legal links and support channels automatically on hosts that theopenlane, Inc. does not operate. A third-party offering must not re-enable them and must provide its own:

| Openlane resource                                                               | Where it appears                                                                                                                                 | What to do                                                                  |
| ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------- |
| Terms of Service (`/legal/terms-of-service`)                                    | Login, signup, and SSO pages, through [apps/console/src/components/shared/legal-agreement/](apps/console/src/components/shared/legal-agreement/) | Link to your own terms                                                      |
| Privacy Policy (`/legal/privacy`)                                               | Login, signup, and SSO pages, through the same component                                                                                         | Link to your own privacy policy                                             |
| Website, support, info, status, and auditor URLs                                | [apps/console/src/constants/index.ts](apps/console/src/constants/index.ts)                                                                       | Point to your own website, support channel, and status page, or remove them |
| Support email (`support@theopenlane.io`) and info email (`info@theopenlane.io`) | [apps/console/src/constants/index.ts](apps/console/src/constants/index.ts)                                                                       | Replace with your own contact addresses                                     |

You are responsible for writing your own legal documents. Do not copy the text of Openlane's legal documents into your deployment.

## Acceptable attribution

You may state accurately that your software is built on Openlane, as long as the statement is not more prominent than your own product name and does not imply affiliation. Examples of acceptable attribution:

- "Built using Openlane"
- "Based on the open-source Openlane project"
- "Compatible with Openlane"

Examples that are not acceptable:

- "Openlane Cloud" or "Openlane for Teams" as the name of your product
- "The official Openlane hosting provider"
- Placing the Openlane logo next to your product name

Use plain text for attribution. Do not use the Openlane logo.

## Changes to these guidelines

theopenlane, Inc. may update these guidelines from time to time. The canonical version is the copy on the `main` branch of [github.com/theopenlane/openlane-ui](https://github.com/theopenlane/openlane-ui/blob/main/TRADEMARKS.md). Copies in forks may be out of date. Changes take effect when they are published there, and the effective date and version at the top of this file are updated with each change.
