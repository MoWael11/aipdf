'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { trpc } from '../_trpc/client'
import { Loader2 } from 'lucide-react'
import { useEffect } from 'react'

const Page = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const origin = searchParams.get('origin')

  const { data } = trpc.authCallback.useQuery()

  useEffect(() => {
    if (data?.success) {
      router.push(origin ? origin : 'dashboard')
    } else {
      router.push('/api/auth/login')
    }
  }, [data?.success, origin, router])

  return (
    <div className='w-full mt-24 flex justify-center'>
      <div className='flex flex-col items-center gap-2'>
        <Loader2 className='h-8 w-8 animate-spin text-zinc-800' />
        <h3 className='font-semibold text-xl'>Checking your account...</h3>
        <p>You will be redirected automatically.</p>
      </div>
    </div>
  )
}

export default Page
