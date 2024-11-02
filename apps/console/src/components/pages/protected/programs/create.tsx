'use client'

import { Survey } from 'survey-react-ui';
import { Model } from 'survey-core';

const surveyJson = 
    {
        "title": "Vendor Risk Assessment",
        "logoPosition": "right",
        "pages": [
          {
            "name": "page1",
            "title": "Information Security ",
            "elements": [
              {
                "type": "text",
                "name": "question1",
                "title": "Does your organization maintain a security program?\n"
              },
              {
                "type": "text",
                "name": "question2",
                "title": "Who is responsible for managing the security program?"
              },
              {
                "type": "text",
                "name": "question3",
                "title": "Does your organization have a public information security policy?"
              },
              {
                "type": "text",
                "name": "question4",
                "title": "What guidelines does your security program follow?"
              }
            ]
          },
          {
            "name": "page2",
            "title": "Data Center Security",
            "elements": [
              {
                "type": "text",
                "name": "question5",
                "title": "Do you work in a shared office space?"
              },
              {
                "type": "text",
                "name": "question6",
                "title": "Is there a protocol in place for operations when your office is inaccessible?"
              },
              {
                "type": "text",
                "name": "question7",
                "title": "Is there a policy in place for physical security requirements for your business?"
              },
              {
                "type": "text",
                "name": "question8",
                "title": "What are the geographic locations of your data centers?"
              }
            ]
          },
          {
            "name": "page3",
            "title": "Web Application Security",
            "elements": [
              {
                "type": "text",
                "name": "question10",
                "title": "What is the name of your web application? What is its function?"
              },
              {
                "type": "text",
                "name": "question11",
                "title": "How do you report application security vulnerabilities?"
              },
              {
                "type": "text",
                "name": "question12",
                "title": "Does your web application have an SSL certificate?"
              },
              {
                "type": "text",
                "name": "question13",
                "title": "Does your application offer single sign-on (SSO)?"
              }
            ]
          },
          {
            "name": "page4",
            "title": "Infrastructure Protection",
            "elements": [
              {
                "type": "text",
                "name": "question9",
                "title": "Do you use a VPN?"
              },
              {
                "type": "text",
                "name": "question14",
                "title": "What is the process for backing up your data?"
              },
              {
                "type": "text",
                "name": "question15",
                "title": "Do you keep a record of security events?"
              },
              {
                "type": "text",
                "name": "question16",
                "title": "How do you protect company devices from malware?"
              }
            ]
          },
          {
            "name": "page5",
            "title": "Security Controls and Technology",
            "elements": [
              {
                "type": "text",
                "name": "question17",
                "title": "Do you keep an inventory of authorized devices and software? "
              },
              {
                "type": "text",
                "name": "question18",
                "title": "How do you monitor the security of your wireless networks?"
              },
              {
                "type": "text",
                "name": "question19",
                "title": "How do you plan for and avert a cybersecurity incident?"
              },
              {
                "type": "text",
                "name": "question20",
                "title": "In the event of an incident, how do you plan to communicate it to us?"
              }
            ]
          },
          {
            "name": "page6",
            "title": "Other",
            "elements": [
              {
                "type": "text",
                "name": "question21",
                "title": "How do you prioritize critical assets for your organization?"
              },
              {
                "type": "text",
                "name": "question22",
                "title": "Do you outsource security functions to third-party providers?"
              },
              {
                "type": "text",
                "name": "question23",
                "title": "How frequently are employees trained on policies in your organization?"
              },
              {
                "type": "text",
                "name": "question24",
                "title": "When was the last time you had a risk assessment by a third party? Results?"
              }
            ]
          }
        ]
      };


      
export const CreateProgram = () => {
    const survey = new Model(surveyJson)
    survey.applyTheme({
"cssVariables": {
        "--sjs-corner-radius": "4px",
        "--sjs-base-unit": "8px",
        "--sjs-font-pagetitle-color": "rgba(8, 41, 48, 0.91)",
        "--sjs-font-pagedescription-color": "rgba(8, 41, 48, 0.45)",
        "--sjs-shadow-small": "0px 1px 2px 0px rgba(0, 0, 0, 0.15)",
        "--sjs-shadow-inner": "inset 0px 1px 2px 0px rgba(0, 0, 0, 0.15)",
        "--sjs-border-default": "rgba(0, 0, 0, 0.16)",
        "--sjs-border-light": "rgba(0, 0, 0, 0.09)",
        "--sjs-general-backcolor": "rgba(255, 255, 255, 1)",
        "--sjs-general-backcolor-dark": "rgba(248, 248, 248, 1)",
        "--sjs-general-backcolor-dim-light": "rgba(249, 249, 249, 1)",
        "--sjs-general-backcolor-dim-dark": "rgba(243, 243, 243, 1)",
        "--sjs-general-forecolor": "rgba(0, 0, 0, 0.91)",
        "--sjs-general-forecolor-light": "rgba(0, 0, 0, 0.45)",
        "--sjs-general-dim-forecolor": "rgba(0, 0, 0, 0.91)",
        "--sjs-general-dim-forecolor-light": "rgba(0, 0, 0, 0.45)",
        "--sjs-secondary-backcolor": "rgba(255, 152, 20, 1)",
        "--sjs-secondary-backcolor-light": "rgba(255, 152, 20, 0.1)",
        "--sjs-secondary-backcolor-semi-light": "rgba(255, 152, 20, 0.25)",
        "--sjs-secondary-forecolor": "rgba(255, 255, 255, 1)",
        "--sjs-secondary-forecolor-light": "rgba(255, 255, 255, 0.25)",
        "--sjs-shadow-small-reset": "0px 0px 0px 0px rgba(0, 0, 0, 0.15)",
        "--sjs-shadow-medium": "0px 2px 6px 0px rgba(0, 0, 0, 0.1)",
        "--sjs-shadow-large": "0px 8px 16px 0px rgba(0, 0, 0, 0.1)",
        "--sjs-shadow-inner-reset": "inset 0px 0px 0px 0px rgba(0, 0, 0, 0.15)",
        "--sjs-border-inside": "rgba(0, 0, 0, 0.16)",
        "--sjs-special-red-forecolor": "rgba(255, 255, 255, 1)",
        "--sjs-special-green": "rgba(25, 179, 148, 1)",
        "--sjs-special-green-light": "rgba(25, 179, 148, 0.1)",
        "--sjs-special-green-forecolor": "rgba(255, 255, 255, 1)",
        "--sjs-special-blue": "rgba(67, 127, 217, 1)",
        "--sjs-special-blue-light": "rgba(67, 127, 217, 0.1)",
        "--sjs-special-blue-forecolor": "rgba(255, 255, 255, 1)",
        "--sjs-special-yellow": "rgba(255, 152, 20, 1)",
        "--sjs-special-yellow-light": "rgba(255, 152, 20, 0.1)",
        "--sjs-special-yellow-forecolor": "rgba(255, 255, 255, 1)",
        "--sjs-article-font-xx-large-textDecoration": "none",
        "--sjs-article-font-xx-large-fontWeight": "400",
        "--sjs-article-font-xx-large-fontStyle": "normal",
        "--sjs-article-font-xx-large-fontStretch": "normal",
        "--sjs-article-font-xx-large-letterSpacing": "0",
        "--sjs-article-font-xx-large-lineHeight": "64px",
        "--sjs-article-font-xx-large-paragraphIndent": "0px",
        "--sjs-article-font-xx-large-textCase": "none",
        "--sjs-article-font-x-large-textDecoration": "none",
        "--sjs-article-font-x-large-fontWeight": "400",
        "--sjs-article-font-x-large-fontStyle": "normal",
        "--sjs-article-font-x-large-fontStretch": "normal",
        "--sjs-article-font-x-large-letterSpacing": "0",
        "--sjs-article-font-x-large-lineHeight": "56px",
        "--sjs-article-font-x-large-paragraphIndent": "0px",
        "--sjs-article-font-x-large-textCase": "none",
        "--sjs-article-font-large-textDecoration": "none",
        "--sjs-article-font-large-fontWeight": "400",
        "--sjs-article-font-large-fontStyle": "normal",
        "--sjs-article-font-large-fontStretch": "normal",
        "--sjs-article-font-large-letterSpacing": "0",
        "--sjs-article-font-large-lineHeight": "40px",
        "--sjs-article-font-large-paragraphIndent": "0px",
        "--sjs-article-font-large-textCase": "none",
        "--sjs-article-font-medium-textDecoration": "none",
        "--sjs-article-font-medium-fontWeight": "400",
        "--sjs-article-font-medium-fontStyle": "normal",
        "--sjs-article-font-medium-fontStretch": "normal",
        "--sjs-article-font-medium-letterSpacing": "0",
        "--sjs-article-font-medium-lineHeight": "32px",
        "--sjs-article-font-medium-paragraphIndent": "0px",
        "--sjs-article-font-medium-textCase": "none",
        "--sjs-article-font-default-textDecoration": "none",
        "--sjs-article-font-default-fontWeight": "400",
        "--sjs-article-font-default-fontStyle": "normal",
        "--sjs-article-font-default-fontStretch": "normal",
        "--sjs-article-font-default-letterSpacing": "0",
        "--sjs-article-font-default-lineHeight": "28px",
        "--sjs-article-font-default-paragraphIndent": "0px",
        "--sjs-article-font-default-textCase": "none",
        "--sjs-general-backcolor-dim": "#e9f1f5",
        "--sjs-primary-backcolor": "rgba(25, 179, 148, 1)",
        "--sjs-primary-backcolor-dark": "rgba(20, 164, 139, 1)",
        "--sjs-primary-backcolor-light": "rgba(25, 179, 148, 0.1)",
        "--sjs-primary-forecolor": "rgba(255, 255, 255, 1)",
        "--sjs-primary-forecolor-light": "rgba(255, 255, 255, 0.25)",
        "--sjs-special-red": "rgba(229, 10, 62, 1)",
        "--sjs-special-red-light": "rgba(229, 10, 62, 0.1)",
        "--sjs-font-surveytitle-family": "var(--font-mincho)",
        "--sjs-font-headertitle-family": "var(--font-mincho)",
        "--sjs-font-family": "var(--font-outfit)",
        "--sjs-font-headertitle-weight": "400",
        "--sjs-header-backcolor": "#09f1c7"
    },
        "themeName": "doubleborder",
        "colorPalette": "dark",
        "isPanelless": true
      });

    //   return (<PopupSurvey model={survey} isExpanded={true} closeOnCompleteTimeout={-1} allowClose={true}/>);

    return <Survey model={survey} />;
}