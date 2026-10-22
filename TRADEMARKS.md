# Openlane trademark guidelines

"Openlane", the Openlane logo, and related names, logos, and designs (the "Openlane Marks") are trademarks of theopenlane, Inc. The code in this repository is licensed under the [Apache License 2.0](LICENSE). That license covers the code only. As Section 6 of the license states, it does not grant permission to use the trade names, trademarks, service marks, or product names of the licensor.

These guidelines explain how you may and may not use the Openlane Marks when you use, modify, or redistribute this software. Their purpose is to make sure people can tell whether they are using software built and operated by theopenlane, Inc. or something built by someone else.

Anything not expressly permitted here requires written permission. Contact [info@theopenlane.io](mailto:info@theopenlane.io) with questions or permission requests.

## Use of the Openlane name and logo

You may use the word "Openlane" without permission to:

- Refer truthfully to the Openlane project or to theopenlane, Inc.
- Describe that your software is based on, derived from, or compatible with Openlane, as described in [Acceptable attribution](#acceptable-attribution)
- Write articles, reviews, tutorials, and other commentary about Openlane

When you use the name:

- Write it as "Openlane", with a capital O and a lowercase l, never "OpenLane" or "Open Lane"
- Use it as an adjective or to identify the project, not as a generic term
- Do not combine it with other words or marks to form a new name, such as "OpenlanePlus" or "Openlane Hub by Example Corp"
- Do not use it, or a confusingly similar name, in a product name, company name, domain name, social media handle, or app store listing

You may not use the Openlane logo, wordmark, icons, or other brand artwork without written permission. This includes the logo component in [packages/ui/src/logo/](packages/ui/src/logo/) and the brand assets under [apps/console/public/](apps/console/public/).

## Requirements for publicly hosted forks

You may fork this repository and host it for your own use. If your deployment can be reached by anyone outside your own organization, or you distribute a modified version, you must:

1. Rename the product. Remove "Openlane" from the product name, page titles, metadata, email templates, and any other place a user would read it as the name of the service.
2. Remove or replace the Openlane logo, favicon, wordmark, icons, and other brand artwork.
3. Remove customer testimonials, customer logos, and case studies, including the testimonials on the login and signup pages in [apps/console/src/components/shared/auth-marketing-panel/](apps/console/src/components/shared/auth-marketing-panel/). These belong to Openlane and its customers and are not licensed for reuse.
4. Replace Openlane legal documents and support links as described in [Replacing Openlane-specific legal documents and support links](#replacing-openlane-specific-legal-documents-and-support-links).
5. Use your own domain. Do not use a domain, subdomain, or URL path that contains "openlane" or a confusingly similar term.
6. Make sure the deployment does not connect to Openlane-operated backend services, status pages, analytics, or support tooling unless you have an agreement with theopenlane, Inc. to do so.

You may keep the Openlane name in places that describe where the code came from, such as copyright notices, license files, source code comments, and commit history. Do not remove copyright or license notices required by the Apache License 2.0.

Internal deployments used only within your organization do not need to be rebranded, but they are still subject to the restrictions on implying affiliation below.

## The unofficial deployment banner

When the console runs on a domain that theopenlane, Inc. does not operate, it shows a banner stating that the deployment is not operated by or affiliated with Openlane. The check that controls the banner is in [packages/ui/lib/official-deployment.ts](packages/ui/lib/official-deployment.ts).

To remove the banner, you must maintain your own fork and meet every requirement in [Requirements for publicly hosted forks](#requirements-for-publicly-hosted-forks). Changing `OFFICIAL_DOMAIN` to your own domain is not enough on its own. If you change it without also removing the Openlane branding and replacing every Openlane link, legal document, and support channel, your deployment presents itself as Openlane. That violates these guidelines and is an unauthorized use of the Openlane Marks. The same change also turns on features that call Openlane-operated services, which requirement 6 prohibits without an agreement.

## Restrictions on implying official affiliation

Do not use the Openlane Marks in any way that suggests your product, service, deployment, or organization is:

- Made, operated, sponsored, endorsed, certified, or supported by theopenlane, Inc.
- An official, hosted, managed, or enterprise edition of Openlane
- A partner, reseller, or authorized provider of Openlane, unless you have a written agreement saying so

Do not present a modified version of this software as Openlane. A modified version is a different product, and users must be able to tell the difference.

Do not use the Openlane Marks in a way that is misleading, disparaging, or associated with illegal activity.

## Replacing Openlane-specific legal documents and support links

The Openlane Terms of Service, Privacy Policy, and support channels apply only to services operated by theopenlane, Inc. They do not apply to your deployment, and you may not present them as if they do.

A publicly hosted fork must replace them with your own:

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

theopenlane, Inc. may update these guidelines from time to time. The current version is always in this file.
