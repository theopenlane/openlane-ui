'use client'

import { SurveyCreatorComponent, SurveyCreator } from "survey-creator-react";
import { ITheme } from "survey-core";
import { editorLocalization } from "survey-creator-core";
import { useTheme } from 'next-themes'

import "survey-core/defaultV2.min.css";
import "survey-creator-core/survey-creator-core.min.css";

import { lightTheme, darkTheme } from "./themes";
import { Button } from "@repo/ui/button";
import { TemplateDocumentType, useCreateTemplateMutation, useGetTemplateQuery, useUpdateTemplateMutation } from "@repo/codegen/src/schema";
import { useToast } from "@repo/ui/use-toast";
import { Panel } from "@repo/ui/panel";
import { CreateDropdown } from "./create";
import { pageStyles } from "./page.styles";

const enLocale = editorLocalization.getLocale("en");

const customThemeName = "Openlane";

const creatorOptions = {
  showLogicTab: true,
  isAutoSave: false, // force users to hit the save button
  showThemeTab: true,
};

export default function CreateQuestionnaire(input: { templateId: string, existingId: string }) {
  const {
    buttonRow,
  } = pageStyles()

  const { toast } = useToast()

  const creator = new SurveyCreator(creatorOptions);

  if (input.existingId) {
    const variables = { getTemplateId: input.existingId }
    const [templateResult] = useGetTemplateQuery({ variables });
    
    if (templateResult.data) {
      creator.JSON = templateResult.data.template.jsonconfig;
    }

    if (templateResult.error) {
      toast({
        title: 'There was a problem loading the questionnaire, please try again',
        variant: 'destructive',
      })
    }
  } else if (input.templateId) {
    const variables = { getTemplateId: input.templateId }
    const [templateResult] = useGetTemplateQuery({ variables });

    if (templateResult.data) {
      creator.JSON = templateResult.data.template.jsonconfig;
    }

    if (templateResult.error) {
      toast({
        title: 'There was a problem loading the questionnaire template, please try again',
        variant: 'destructive',
      })
    }
  }

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

  creator.toolbox.forceCompact = true;

  // setup save function
  const [_, createTemplateData] = useCreateTemplateMutation(); 
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
      })
    }

    // otherwise create a new template
    return createTemplateData(variables).then((response) => {
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
    <>
      <Panel className='bg-ziggurat-100 dark:bg-oxford-blue-900 border-ziggurat-100 dark:border-oxford-blue-900 p-0'>
        <SurveyCreatorComponent creator={creator} />
      </Panel>
      <div className={buttonRow()}>
        <Button onClick={() => creator.saveSurvey()}>Save</Button>
      </div>
    </>
  )
}