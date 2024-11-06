'use client'

import { SurveyCreatorComponent, SurveyCreator } from "survey-creator-react";
import { ITheme } from "survey-core";
import { editorLocalization } from "survey-creator-core";
import { useTheme } from 'next-themes'

import "survey-core/defaultV2.min.css";
import "survey-creator-core/survey-creator-core.min.css";

import { lightTheme } from "./theme-light";
import { darkTheme } from "./theme-dark";
import { Button } from "@repo/ui/button";
import { TemplateDocumentType, useCreateTemplateMutation, useGetTemplateQuery, useUpdateTemplateMutation } from "@repo/codegen/src/schema";
import { useToast } from "@repo/ui/use-toast";
import { Panel } from "@repo/ui/panel";
import { pageStyles } from "./page.styles";
import { useRouter } from "next/navigation";

import "./custom.css";

const enLocale = editorLocalization.getLocale("en");

const customThemeName = "Openlane";

const creatorOptions = {
  showLogicTab: true,
  isAutoSave: false,
  showThemeTab: true,
};

export default function CreateQuestionnaire(input: { templateId: string, existingId: string }) {
  const router = useRouter()
  const { toast } = useToast()
  const {
    buttonRow,
  } = pageStyles()


  const creator = new SurveyCreator(creatorOptions);
  const themeTabPlugin = creator.themeEditor;
  
  function addCustomTheme(theme: ITheme, userFriendlyThemeName : string) {
    // Add a localized user-friendly theme name
    if (theme.themeName) {
      enLocale.theme.names[theme.themeName] = userFriendlyThemeName;
    }
    // Add the theme to the theme list as the default theme
    themeTabPlugin.addTheme(theme, true);
  }
    
  // Register a custom theme with Dark and Light variations
  addCustomTheme(lightTheme, customThemeName);
  addCustomTheme(darkTheme, customThemeName);

  // apply theme to the creator
  const themeContext = useTheme()
  const theme = themeContext.resolvedTheme as  "light" | "dark" | "white" | undefined

  if (theme === "dark") {
    creator.applyTheme(darkTheme);
  } else {
    creator.applyTheme(lightTheme);
  }

  // creator.toolbox.forceCompact = true;

  // get the json if if it exists
  const variables = { getTemplateId: input.existingId || input.templateId }

  const [templateResult] = useGetTemplateQuery({ variables });
    
  if (templateResult.data) {
    creator.JSON = templateResult.data.template.jsonconfig;
  }

  // setup save function
  const [template, createTemplateData] = useCreateTemplateMutation(); 
  const [, updateTemplateData] = useUpdateTemplateMutation()

  const saveTemplate = async (data: any, saveNo : string, callback : any) => {
    const variables = {
      input: {
        name: data.title,
        jsonconfig: data,
        templateType: TemplateDocumentType.DOCUMENT,
        description: data.description,
        // version: saveNo, // TODO: add versioning
      },
    }

    if (input.existingId) {
      return updateTemplateData({
        updateTemplateId: input.existingId,
        input: { ...variables.input },
      }).then((response) => {
        if (!response.error) {
          toast({
            title: 'Questionnaire saved successfully',
            variant: 'success',
          })
        } else {
          toast({
            title: 'There was a problem saving the questionnaire, please try again',
            variant: 'destructive',
          })
        }
      }).catch(error => {
        console.log(error)
        toast({
          title: 'There was a problem saving the questionnaire, please try again',
          variant: 'destructive',
        })
      });
    }

    // otherwise create a new template
    return createTemplateData(variables).then((response) => {
      if (!response.error) {
        toast({
          title: 'Questionnaire saved successfully',
          variant: 'success',
        })

        router.push(`/documents/questionnaire-editor?id=${response.data?.createTemplate.template.id}`)
      } else {
        if (response.error.graphQLErrors[0].message   == 'template already exists') {
          toast({
            title: 'A questionnaire with this name already exists, please choose a different name',
            variant: 'destructive',
          })
        } else if (response.error.graphQLErrors[0].message == 'must be defined') { 

          const missingField = response.error.graphQLErrors[0].path?.slice(-1)[0]
          toast({
            title: `Please provide a ${missingField} for the questionnaire`,
            variant: 'destructive',
          })
        } else {
          toast({
            title: 'There was a problem saving the questionnaire: ' + response.error.graphQLErrors[0].message,
            variant: 'destructive',
          })
        }
      }
    })
    .catch(error => {
      console.log(error)
      toast({
        title: 'There was a problem saving the questionnaire, please try again',
        variant: 'destructive',
      })
    });
  }

  creator.saveSurveyFunc = (saveNo :string, callback:any) => {
    saveTemplate(creator.JSON, saveNo, callback);
  }

  return (
    <Panel className='flex h-full bg-ziggurat-100 dark:bg-oxford-blue-900 border-ziggurat-100 dark:border-oxford-blue-900 p-0'>
      <SurveyCreatorComponent creator={creator} />
    </Panel>
  )
}