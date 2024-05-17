import { INFINITE_QUERY_LIMIT } from '@/config/infinit-query'
import { PLANS } from '@/config/stripe'
import { db } from '@/db'
import { getUserSubscriptionPlan, stripe } from '@/lib/stripe'
import { absoluteUrl } from '@/lib/utils'
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server'
import { TRPCError } from '@trpc/server'
import z from 'zod'
import { privateProcedure, publicProcedure, router } from './trpc'

export const appRouter = router({
  authCallback: publicProcedure.query(async () => {
    const { getUser } = getKindeServerSession()
    const user = await getUser()

    if (!user?.id || !user?.email) throw new TRPCError({ code: 'UNAUTHORIZED' })

    // check if the user is in the db
    const dbUser = await db.user.findUnique({ where: { id: user.id } })

    if (!dbUser) {
      await db.user.create({ data: { id: user.id, email: user.email } })
    }

    return { success: true }
  }),
  getUserFiles: privateProcedure.query(async ({ ctx }) => {
    const { userId } = ctx
    return await db.file.findMany({ where: { userId } })
  }),
  getFileUploadStatus: privateProcedure.input(z.object({ fileId: z.string() })).query(async ({ input, ctx }) => {
    const file = await db.file.findFirst({
      where: {
        id: input.fileId,
        userId: ctx.userId,
      },
    })

    if (!file) return { status: 'PENDING' as const }

    return { status: file.uploadStatus }
  }),

  getFile: privateProcedure.input(z.object({ key: z.string() })).mutation(async ({ ctx, input }) => {
    const { userId } = ctx

    const file = await db.file.findFirst({ where: { key: input.key, userId } })

    if (!file) throw new TRPCError({ code: 'NOT_FOUND' })
    return file
  }),
  deleteFile: privateProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
    const { userId } = ctx
    const file = await db.file.findUnique({ where: { id: input.id, userId } })
    if (!file) throw new TRPCError({ code: 'NOT_FOUND' })

    await db.file.delete({ where: { id: file.id, userId } })

    return file
  }),
  getFileMessages: privateProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).nullish(),
        cursor: z.string().nullish(),
        fileId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { userId } = ctx
      const { cursor, fileId } = input
      const limit = input.limit ?? INFINITE_QUERY_LIMIT

      const file = await db.file.findUnique({ where: { id: fileId, userId } })
      if (!file) throw new TRPCError({ code: 'NOT_FOUND' })

      const messages = await db.message.findMany({
        where: { fileId },
        orderBy: { createdAt: 'desc' },
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        select: { id: true, text: true, createdAt: true, isUserMessage: true },
      })

      let nextCursor: typeof cursor | undefined = undefined

      if (messages.length > limit) {
        const nextItem = messages.pop()
        nextCursor = nextItem?.id
      }

      return {
        messages,
        nextCursor,
      }
    }),
  createStripeSession: privateProcedure.mutation(async ({ ctx }) => {
    const { userId } = ctx

    if (!userId) throw new TRPCError({ code: 'UNAUTHORIZED' })

    const dbUser = await db.user.findUnique({ where: { id: userId } })

    if (!dbUser) throw new TRPCError({ code: 'UNAUTHORIZED' })

    const billingUrl = absoluteUrl('/dashboard/billing')
    console.log(billingUrl)

    const subscriptionPlan = await getUserSubscriptionPlan()
    console.log(subscriptionPlan)

    if (subscriptionPlan.isSubscribed && dbUser.stripeCustomerId) {
      try {
        const stripSession = await stripe.billingPortal.sessions.create({
          customer: dbUser.stripeCustomerId,
          return_url: billingUrl,
        })
        console.log(1)

        return { url: stripSession.url }
      } catch (err) {
        console.log(2)
        console.log(err)

        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' })
      }
    }
    try {
      const stripeSession = await stripe.checkout.sessions.create({
        success_url: billingUrl,
        cancel_url: billingUrl,
        payment_method_types: ['card', 'bancontact', 'paypal'],
        mode: 'subscription',
        billing_address_collection: 'auto',
        line_items: [{ price: PLANS.find((p) => p.name === 'Pro')?.price.priceIds.test, quantity: 1 }],
        metadata: { userId },
      })
      return { url: stripeSession.url }
    } catch (err) {
      console.log(err)
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' })
    }
  }),
})

export type AppRouter = typeof appRouter
