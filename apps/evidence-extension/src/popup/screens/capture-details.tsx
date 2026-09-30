import { useMutation } from '@tanstack/react-query'
import { Camera } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { Input } from '@repo/ui/input'
import { Textarea } from '@repo/ui/textarea'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@repo/ui/form'
import { captureVisibleTab, type TCapture, type TCaptureTarget } from '../../lib/capture'
import type { TConnection } from '../../lib/connection'
import { ControlPicker } from '../components/control-picker'
import { PageCard } from '../components/page-card'
import { ScreenTitle } from '../components/popup-header'
import { useEvidenceDraftForm, type TEvidenceDraft } from '../hooks/use-evidence-draft-form-schema'
import { EVIDENCE_FLOW_MUTATION_KEY } from '../hooks/use-openlane-queries'
import { ErrorAlert, errorMessage } from '../components/error-alert'

type TCaptureDetailsProps = {
  connection: TConnection
  target: TCaptureTarget
  draft: TEvidenceDraft
  onCaptured: (capture: TCapture, draft: TEvidenceDraft) => void
}

export const CaptureDetails = ({ connection, target, draft, onCaptured }: TCaptureDetailsProps) => {
  const form = useEvidenceDraftForm(draft)
  const capture = useMutation({
    mutationKey: EVIDENCE_FLOW_MUTATION_KEY,
    mutationFn: () => captureVisibleTab(connection, target),
  })

  return (
    <Form {...form}>
      <form className="space-y-4 p-4" onSubmit={form.handleSubmit((values) => capture.mutate(undefined, { onSuccess: (result) => onCaptured(result, values) }))}>
        <ScreenTitle title="Capture evidence" description="Take a screenshot of this tab and upload it as evidence." />
        <PageCard url={target.url} />
        <FormField
          control={form.control}
          name="name"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel>Evidence name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              {fieldState.error && <FormMessage />}
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (optional)</FormLabel>
              <FormControl>
                <Textarea rows={3} {...field} value={field.value ?? ''} />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="controls"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Control reference code(s)</FormLabel>
              <ControlPicker connection={connection} value={field.value} onChange={field.onChange} />
            </FormItem>
          )}
        />
        {capture.isError && <ErrorAlert>{errorMessage(capture.error, 'The screenshot could not be captured.')}</ErrorAlert>}
        <Button type="submit" full icon={<Camera size={16} />} iconPosition="left" loading={capture.isPending} disabled={capture.isPending}>
          Capture screenshot
        </Button>
      </form>
    </Form>
  )
}
