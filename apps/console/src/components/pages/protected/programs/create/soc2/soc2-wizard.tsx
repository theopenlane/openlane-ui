'use client'
import { defineStepper } from '@stepperize/react'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@repo/ui/button'
import { Card } from '@repo/ui/cardpanel'
import { ArrowLeft, ArrowRight } from 'lucide-react'

import React, { useState } from 'react'
import Step1 from './soc2-steps/step1'
import Step2 from './soc2-steps/step2'
import Step3 from './soc2-steps/step3'
import { z } from 'zod'
import { useRouter } from 'next/navigation'

export default function Soc2Wizard() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const step1Schema = z.object({
    // ovdje dodaj polja iz Step1
  })
  const step2Schema = z.object({
    // polja iz Step2
  })
  const step3Schema = z.object({
    // polja iz Step3
  })

  const { useStepper, steps } = defineStepper(
    { id: '0', label: 'Pick Categories', schema: step1Schema },
    { id: '1', label: 'Team Setup', schema: step2Schema },
    { id: '2', label: 'Access Control', schema: step3Schema },
  )
  const stepper = useStepper()

  const methods = useForm({
    resolver: zodResolver(stepper.current.schema),
    mode: 'onChange',
  })

  const handleNext = async () => {
    const isValid = await methods.trigger()
    if (!isValid) return
    if (!stepper.isLast) {
      stepper.next()
    } else {
      setIsLoading(true)
      // TODO: handle submit
    }
  }

  const handleBack = () => {
    if (stepper.isFirst) {
      return router.push('/programs/create')
    }
    stepper.prev()
  }

  const currentIndex = stepper.all.findIndex((item) => item.id === stepper.current.id)

  return (
    <div className="max-w-2xl mx-auto py-10">
      <FormProvider {...methods}>
        <div className="p-6">
          {stepper.switch({
            0: () => <Step1 />,
            1: () => <Step2 />,
            2: () => <Step3 />,
          })}
          <div className="flex justify-between mt-8">
            <Button variant="outline" onClick={handleBack} iconPosition="left">
              Back
            </Button>
            <Button onClick={handleNext}>{stepper.isLast ? 'Create' : 'Continue'}</Button>
          </div>
        </div>
      </FormProvider>
    </div>
  )
}
