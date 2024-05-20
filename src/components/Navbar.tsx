import { db } from '@/db'
import { LoginLink, RegisterLink, getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import CreditsButton from './CreditsButton'
import MaxWidthWrapper from './MaxWidthWrapper'
import MobileNav from './MobileNav'
import UserAccountNav from './UserAccountNav'
import { buttonVariants } from './ui/button'
import { getUserSubscriptionPlan } from '@/lib/stripe'

const Navbar = async () => {
  const { getUser } = getKindeServerSession()
  const user = await getUser()
  let dbUser = null
  if (user) dbUser = await db.user.findUnique({ where: { id: user.id } })

  const subscriptionPlan = await getUserSubscriptionPlan()

  return (
    <nav className='sticky h-14 inset-x-0 top-0 z-30 w-full border-b border-gray-200 bg-white/75 backdrop-blur-lg transition-all'>
      <MaxWidthWrapper>
        <div className='flex h-14 items-center justify-between border-b border-zinc-200'>
          <Link href={'/'} className='flex z-40 font-semibold'>
            AiPDF.
          </Link>

          <MobileNav isAuth={!!user} />
          <div className='hidden items-center space-x-4 sm:flex'>
            {!user || !dbUser ? (
              <>
                <Link className={buttonVariants({ variant: 'ghost', size: 'sm' })} href={'/pricing'}>
                  Pricing
                </Link>
                <LoginLink className={buttonVariants({ variant: 'ghost', size: 'sm' })}>Sign in</LoginLink>
                <RegisterLink className={buttonVariants({ size: 'sm' })}>
                  Get started <ArrowRight className='ml-2 w-5 h-5' />
                </RegisterLink>
              </>
            ) : (
              <>
                <CreditsButton isPro={subscriptionPlan.isSubscribed} />
                <UserAccountNav
                  email={user.email ?? ''}
                  imageUrl={user.picture ?? ''}
                  name={
                    !user.given_name || !user.family_name ? 'Your account' : `${user.given_name} ${user.family_name}`
                  }
                />
              </>
            )}
          </div>
        </div>
      </MaxWidthWrapper>
    </nav>
  )
}

export default Navbar
