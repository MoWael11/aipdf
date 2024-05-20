import { db } from '@/db'
import { openai } from '@/lib/openai'
import { pinecone } from '@/lib/pinecone'
import { getUserSubscriptionPlan } from '@/lib/stripe'
import { SendMessageValidator } from '@/lib/validators/sendMessageValidator'
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server'
import { OpenAIEmbeddings } from '@langchain/openai'
import { PineconeStore } from '@langchain/pinecone'
import { OpenAIStream, StreamingTextResponse } from 'ai'
import { NextRequest } from 'next/server'

export const POST = async (req: NextRequest) => {
  // endpoint for asking a wquestion to a pdf file
  const body = await req.json()

  const { getUser } = getKindeServerSession()
  const user = await getUser()

  if (!user || !user.id) return new Response('Unauthorized', { status: 401 })

  const susbscription = await getUserSubscriptionPlan()

  const { id: userId } = user

  const dbUser = await db.user.findUnique({ where: { id: userId } })

  if (!dbUser) return new Response('Unauthorized', { status: 401 })

  if (dbUser.credits < 1) return new Response('Insufficient credits', { status: 400 })

  const { fileId, message } = SendMessageValidator.parse(body)

  const file = await db.file.findUnique({ where: { id: fileId, userId, uploadStatus: 'SUCCESS' } })

  if (!file) return new Response('Not found', { status: 404 })

  await db.message.create({
    data: {
      text: message,
      isUserMessage: true,
      userId,
      fileId,
    },
  })

  // FIRST STEP "semantic query" index the pdf vector to find the part that is meaning closest to our message: [3, 1.4, 3, ...] and [3.1, 1.5, 3, ...]

  try {
    // 1: vectorize message
    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
    })

    const pineconeIndex = pinecone.index('aipdf')

    const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
      //@ts-ignore
      pineconeIndex,
      namespace: file.id,
    }) // retrive the existing vector from pinecone

    const results = await vectorStore.similaritySearch(message, susbscription.isSubscribed ? 8 : 4) // "semantic query" we get the closest results to our message

    const prevMessages = await db.message.findMany({
      where: {
        fileId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: susbscription.isSubscribed ? 6 : 4,
    }) // last 6 messages user typed

    const formattedPrevMessages = prevMessages.map((msg) => ({
      role: msg.isUserMessage ? ('user' as const) : ('assistant' as const),
      content: msg.text,
    }))

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      temperature: 0,
      stream: true,
      messages: [
        {
          role: 'system',
          content:
            'Use the following pieces of context (or previous conversaton if needed) to answer the users question in markdown format.',
        },
        {
          role: 'user',
          content: `Use the following pieces of context (or previous conversaton if needed) to answer the users question in markdown format. \nIf you don't know the answer, just say that you don't know, don't try to make up an answer.
          
    \n----------------\n
    
    PREVIOUS CONVERSATION:
    ${formattedPrevMessages.map((message) => {
      if (message.role === 'user') return `User: ${message.content}\n`
      return `Assistant: ${message.content}\n`
    })}
    
    \n----------------\n
    
    CONTEXT:
    ${results.map((r) => r.pageContent).join('\n\n')}
    
    USER INPUT: ${message}`,
        },
      ],
    })

    await db.user.update({
      where: { id: userId },
      data: {
        credits: { decrement: 1 },
      },
    })

    const stream = OpenAIStream(response, {
      async onCompletion(completion) {
        await db.message.create({
          data: {
            text: completion,
            isUserMessage: false,
            fileId,
            userId,
          },
        })
      },
    })

    return new StreamingTextResponse(stream)
  } catch (err) {
    console.log(err)

    // skipping ai part on 429 error state from openai
    const AIRes = 'Sorry, I am unable to answer at the moment.'
    await db.message.create({
      data: {
        text: AIRes,
        isUserMessage: false,
        fileId,
        userId,
      },
    })

    return new Response(AIRes)
  }
}
