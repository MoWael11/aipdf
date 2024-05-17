'use client'

import { trpc } from '@/app/_trpc/client'
import { QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { httpBatchLink } from '@trpc/client'
import { TRPCError } from '@trpc/server'
import { useRouter } from 'next/navigation'
import { PropsWithChildren, useState } from 'react'

const Providers = ({ children }: PropsWithChildren) => {
  const { push } = useRouter()
  const [queryClient] = useState(
    () =>
      new QueryClient({
        queryCache: new QueryCache({
          onError: (err) => {
            if (err instanceof TRPCError) {
              if (err.code === 'UNAUTHORIZED') push('/sign-in')
            }
          },
        }),
      })
  )

  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: '/api/trpc',
        }),
      ],
    })
  )

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  )
}

export default Providers
