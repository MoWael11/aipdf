import Navbar from '@/components/Navbar'
import Providers from '@/components/Providers'
import { cn } from '@/lib/utils'
import { Inter } from 'next/font/google'
import './globals.css'

import { Toaster } from '@/components/ui/toaster'
import { constructMetadate } from '@/lib/utils'
import 'react-loading-skeleton/dist/skeleton.css'
import 'simplebar-react/dist/simplebar.min.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata = constructMetadate()

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='en' className='light'>
      <Providers>
        <body className={cn('min-h-screen font-sans antialiased grainy text-black', inter.className)}>
          <Toaster />
          <Navbar />
          {children}
        </body>
      </Providers>
    </html>
  )
}
