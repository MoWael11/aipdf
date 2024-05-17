'use client'

import { LogoutLink } from '@kinde-oss/kinde-auth-nextjs/components'
import { ArrowRight, MenuIcon } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

const MobileNav = ({ isAuth }: { isAuth: boolean }) => {
  const [isOpen, setOpen] = useState(false)

  const toggleOpen = () => setOpen((prev) => !prev)

  const pathname = usePathname()

  useEffect(() => {
    if (isOpen) toggleOpen()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  const closeOnCurrent = (href: string) => {
    if (pathname === href) toggleOpen()
  }
  return (
    <div className='sm:hidden '>
      <MenuIcon className='relative z-50 h-5 w-5 text-zinc-500' onClick={toggleOpen} />
      {isOpen ? (
        <div className='fixed animate-in slide-in-from-top-4 fade-in-20 inset-0 z-0 w-full'>
          <ul className='absolute bg-white border-b border-zinc-200 shadow-xl grid w-full gap-3 px-10 pt-20 pb-8'>
            {!isAuth ? (
              <>
                <li>
                  <Link
                    onClick={() => closeOnCurrent('/sign-up')}
                    className='flex items-center w-full font-semibold text-green-600'
                    href='/sign-up'
                  >
                    Get started <ArrowRight className='ml-2 h-5 w-5' />
                  </Link>
                </li>
                <hr className='my-3 h-px w-full bg-gray-300' />
                <li>
                  <Link
                    onClick={() => closeOnCurrent('/sign-in')}
                    className='flex items-center w-full font-semibold'
                    href='/sign-in'
                  >
                    Sign in
                  </Link>
                </li>
                <hr className='my-3 h-px w-full bg-gray-300' />
                <li>
                  <Link
                    onClick={() => closeOnCurrent('/pricing')}
                    className='flex items-center w-full font-semibold'
                    href='/pricing'
                  >
                    Pricing
                  </Link>
                </li>
              </>
            ) : (
              <>
                <li>
                  <Link
                    onClick={() => closeOnCurrent('/dashboard')}
                    className='flex items-center w-full font-semibold'
                    href='/dashboard'
                  >
                    Dashboard
                  </Link>
                </li>
                <hr className='my-3 h-px w-full bg-gray-300' />
                <li>
                  <LogoutLink className='flex items-center w-full font-semibold'>Sign out</LogoutLink>
                </li>
              </>
            )}
          </ul>
        </div>
      ) : null}
    </div>
  )
}

export default MobileNav
