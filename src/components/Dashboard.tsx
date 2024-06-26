'use client'

import { trpc } from '@/app/_trpc/client'
import { Ghost, Loader2, MessageSquare, Plus, TrashIcon } from 'lucide-react'
import UpdloadButton from './UploadButton'
import Skeleton from 'react-loading-skeleton'
import Link from 'next/link'
import moment from 'moment'
import { Button } from './ui/button'
import { useState } from 'react'
import { getUserSubscriptionPlan } from '@/lib/stripe'

interface PageProps {
  susbscriptionPlan: Awaited<ReturnType<typeof getUserSubscriptionPlan>>
}

const Dashboard = ({ susbscriptionPlan }: PageProps) => {
  const [currentlyDeletingFile, setCurrentlyDeletingFile] = useState<string | null>(null)

  const utils = trpc.useUtils()

  const { data: files, isLoading } = trpc.getUserFiles.useQuery()

  const { mutate: delteFile } = trpc.deleteFile.useMutation({
    onSuccess: () => {
      utils.getUserFiles.invalidate()
    },
    onMutate({ id }) {
      setCurrentlyDeletingFile(id)
    },
    onSettled() {
      // finally in try/catch
      setCurrentlyDeletingFile(null)
    },
  })

  return (
    <main className='mx-auto max-w-7xl px-4 md:p-10'>
      <div className='mt-8 flex flex-col items-start justify-between gap-4 border-b border-gray-200 pb-5 sm:flex-row sm:items-center sm:gap-0'>
        <h1 className='mb-3 font-bold text-5xl text-gray-900'>My Files</h1>
        <UpdloadButton isSubscribed={susbscriptionPlan.isSubscribed} />
      </div>

      {/* display all users files */}

      {files && files.length !== 0 ? (
        <ul className='mt-8 grid grid-cols-1 gap-6 divide-y divide-zinc-200 md:grid-cols-2 lg:grid-cols-3'>
          {files
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .map((file) => (
              <li
                className='col-span-1 divide-y divide-gray-200 rounded-lg bg-white shadow transition-shadow hover:shadow-lg'
                key={file.id}
              >
                <Link href={`/dashboard/${file.id}`} className='flex flex-col gap-2'>
                  <div className='pt-6 px-6 flex w-full items-center justify-between space-x-6'>
                    <div className='h-10 w-10 flex-shrink-0 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500' />
                    <div className='flex-1 truncate'>
                      <div className='flex items-center space-x-3 '>
                        <h3 className='truncate text-lg font-medium to-zinc-900'>{file.name}</h3>
                      </div>
                    </div>
                  </div>
                </Link>
                <div className='px-6 mt-4 grid grid-cols-3 place-items-center py-2 gap6 text-xs text-zinc-500'>
                  <div className='flex items-center gap-2'>
                    <Plus className='h-4 w-4' />
                    {moment(file.createdAt).format('MMM YYYY')}
                  </div>
                  <div className='flex items-center gap-2'>
                    <MessageSquare className='h-4 w-4' />
                    mocked
                  </div>
                  <Button
                    onClick={() => delteFile({ id: file.id })}
                    size={'sm'}
                    className='w-full'
                    variant={'destructive'}
                  >
                    {currentlyDeletingFile === file.id ? (
                      <Loader2 className='h-4 w-4 animate-spin' />
                    ) : (
                      <TrashIcon className='h-4 w-4' />
                    )}
                  </Button>
                </div>
              </li>
            ))}
        </ul>
      ) : isLoading ? (
        <Skeleton height={100} className='my-2' count={3} />
      ) : (
        <div className='mt-16 flex flex-col items-center gap-2'>
          <Ghost className='h-8 w-8 text-zinc-800' />
          <h3 className='font-semibold text-xl'>Pretty empty around here</h3>
          <p>Lets&apos;s upload your first PDF.</p>
        </div>
      )}
    </main>
  )
}

export default Dashboard
