'use client'

import { trpc } from '@/app/_trpc/client'
import { GemIcon, Loader2 } from 'lucide-react'
import { useEffect } from 'react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip'
import { useCredits } from './useCredits'
import Link from 'next/link'

const CreditsButton = ({ isPro }: { isPro: boolean }) => {
  const { data } = trpc.getCredits.useQuery()
  const { credits, setCredits } = useCredits()
  useEffect(() => {
    if (data) setCredits(data.credits)
  }, [data, setCredits])

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button className='flex gap-2 bg-gradient-to-r from-[#ff900014] to-[#ffd60014] border rounded-lg px-3 py-1 border-[#f8eac6]'>
            <span className='text-sm font-medium'>Credits</span>
            <div className='w-[1px] h-6 bg-[#2328331a]' />
            {credits !== undefined ? (
              <span className='text-sm font-medium'>{credits}</span>
            ) : (
              <Loader2 className='mt-0.5 h-4 w-4 animate-spin' />
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <div className='flex gap-4 items-center'>
            <div className='flex flex-col items-start text-xs font-medium'>
              <p>1 credit = 1 message</p>
              <p>2 credits = 1 file upload</p>
            </div>
            {!isPro && (
              <Link href='/pricing' className='flex bg-[#ffaa00] py-1 px-2 rounded-md items-center text-white'>
                <GemIcon className='size-4 text-white mr-1' />
                Upgrade
              </Link>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export default CreditsButton
