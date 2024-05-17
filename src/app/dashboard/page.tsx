import Dashboard from '@/components/Dashboard'
import { db } from '@/db'
import { getUserSubscriptionPlan } from '@/lib/stripe'
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server'
import { redirect } from 'next/navigation'

const Page = async () => {
  const { getUser } = getKindeServerSession()
  const user = await getUser()

  const susbscriptionPlan = await getUserSubscriptionPlan()

  if (!user || !user.id) redirect('/auth-callback?origin=dashboard')

  const dbUser = await db.user.findUnique({
    where: {
      id: user.id,
    },
  })

  if (!dbUser) return redirect('/auth-callback?origin=dashboard')

  return <Dashboard susbscriptionPlan={susbscriptionPlan} />
}

export default Page
