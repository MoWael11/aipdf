'use client'

import { ArrowRight } from 'lucide-react'
import { Button } from './ui/button'
import { trpc } from '@/app/_trpc/client'
import { useRouter } from 'next/navigation'

const UpgradeButton = ({ proPlan }: { proPlan: boolean }) => {
  const { mutate: createStripeSession } = trpc.createStripeSession.useMutation({
    onSuccess: ({ url }) => {
      window.location.href = url ?? '/dashboard/billing'
    },
  })
  const { push } = useRouter()
  return (
    <Button onClick={() => (proPlan ? push('/dashboard') : createStripeSession())} className='w-full'>
      {proPlan ? (
        'Current Plan'
      ) : (
        <>
          Upgrade now <ArrowRight className='h-5 w-5 ml-1.5' />
        </>
      )}
    </Button>
  )
}

export default UpgradeButton
