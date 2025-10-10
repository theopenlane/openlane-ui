import React from 'react'
import { useFormContext } from 'react-hook-form'
import StandardSelect from '../form-fields/standard-select'

const SelectFrameworkStep = ({ required = false }: { required?: boolean }) => {
  const {
    formState: { errors },
  } = useFormContext()

  return (
    <div>
      <div>
        {required ? (
          <>
            <h2 className="text-lg font-medium">Select a Framework</h2>

            <p className="text-sm text-muted-foreground">Choose the compliance framework this program will follow. This determines the controls, policies, and structure inside your program.</p>
          </>
        ) : (
          <>
            <h2 className="text-lg font-medium">Select an Optional Framework</h2>
            <p className="text-sm text-muted-foreground">
              You can optionally base this risk assessment on an existing framework. Doing so helps you structure your program and evaluate risks according to established criteria.
            </p>
          </>
        )}
      </div>

      {/* Select Framework */}
      <div className="flex flex-col gap-1.5 mt-8">
        <div>
          <label className="text-sm">Select Framework</label>
          {required && <span className="text-destructive">*</span>}
        </div>
        <div className="flex flex-col gap-1.5">
          <StandardSelect />
        </div>
        {errors.framework && <span className="text-xs text-destructive">{String(errors.framework.message)}</span>}
      </div>
    </div>
  )
}

export default SelectFrameworkStep
