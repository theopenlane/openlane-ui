import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@repo/ui/form';
import { Input } from '@repo/ui/input';
import { useForm, SubmitHandler, Control, FormProvider, Form, useFormContext } from 'react-hook-form'
import { z, infer as zInfer } from 'zod'

export const initProgramSchema = z.object({
    name: z.string().min(1, { message: 'Name is required' }),
})

type InitProgramValues = z.infer<typeof initProgramSchema>;

export function ProgramInitComponent() {
    const {
        register,
        formState: { errors },
    } = useFormContext<InitProgramValues>();

    return (
        <div>
            <FormField
                name="name"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                            <Input variant="medium" type="string" {...field} />
                        </FormControl>
                        {errors.name && (
                            <FormMessage>{errors.name.message}</FormMessage>
                        )}
                    </FormItem>
                )}
            />
            <FormField
                name="description"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                            <Input variant="medium" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
        </div>
    );
}