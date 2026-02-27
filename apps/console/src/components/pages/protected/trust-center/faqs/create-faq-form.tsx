import { CircleHelp, Loader2 } from 'lucide-react'
import { Form, FormControl, FormField, FormItem, FormLabel } from '@repo/ui/form'
import { Button } from '@repo/ui/button'
import { Input } from '@repo/ui/input'
import { Textarea } from '@repo/ui/textarea'
import { Card, CardContent } from '@repo/ui/cardpanel'
import useFormSchema from './hooks/use-form-schema'
import type { FaqFormValues } from './hooks/use-form-schema'

interface CreateFaqFormProps {
  disabled: boolean
  isCreating: boolean
  onSubmit: (values: FaqFormValues) => Promise<boolean>
}

export function CreateFaqForm({ disabled, isCreating, onSubmit }: CreateFaqFormProps) {
  const { form } = useFormSchema()

  const handleSubmit = async (values: FaqFormValues) => {
    const success = await onSubmit(values)
    if (success) form.reset()
  }

  return (
    <Card className={disabled ? 'opacity-50 pointer-events-none' : ''}>
      <CardContent className="pt-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold">Add Frequently Asked Question</h2>
          <p className="text-sm text-muted-foreground">Proactively answer the security questions buyers ask most to speed up procurement and security reviews.</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-2">
            <FormField
              control={form.control}
              name="question"
              render={({ field }) => (
                <FormItem className="mt-6">
                  <FormLabel>Question</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter a frequently asked question" className="bg-background" {...field} />
                  </FormControl>
                  {form.formState.errors.question && <p className="text-red-500 text-sm">{form.formState.errors.question.message}</p>}
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="answer"
              render={({ field }) => (
                <FormItem className="mt-6">
                  <FormLabel>Answer</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Provide the answer..." className="min-h-[120px] bg-background" {...field} />
                  </FormControl>
                  {form.formState.errors.answer && <p className="text-red-500 text-sm">{form.formState.errors.answer.message}</p>}
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="referenceLink"
              render={({ field }) => (
                <FormItem className="mt-6">
                  <FormLabel>Reference Link</FormLabel>
                  <FormControl>
                    <Input placeholder="https://..." className="bg-background" {...field} />
                  </FormControl>
                  {form.formState.errors.referenceLink && <p className="text-red-500 text-sm">{form.formState.errors.referenceLink.message}</p>}
                </FormItem>
              )}
            />

            <div className="flex items-center justify-end pt-4">
              <Button type="submit" disabled={isCreating || disabled} icon={isCreating ? <Loader2 className="animate-spin" /> : <CircleHelp />} iconPosition="left">
                Publish FAQ
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
