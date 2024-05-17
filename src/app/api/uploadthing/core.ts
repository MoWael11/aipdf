import { db } from '@/db'
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server'
import { createUploadthing, type FileRouter } from 'uploadthing/next'
import { PDFLoader } from 'langchain/document_loaders/fs/pdf'
import { pinecone } from '@/lib/pinecone'
import { OpenAIEmbeddings } from '@langchain/openai'
import { PineconeStore } from '@langchain/pinecone'
import { getUserSubscriptionPlan } from '@/lib/stripe'
import { PLANS } from '@/config/stripe'

const f = createUploadthing()

const middleware = async () => {
  const { getUser } = getKindeServerSession()
  const user = await getUser()

  if (!user || !user.id) throw new Error('Unauthorized')

  const subscriptionPlan = await getUserSubscriptionPlan()

  return { userId: user.id, subscriptionPlan }
}

const onUploadComplete = async ({
  metadata,
  file,
}: {
  metadata: Awaited<ReturnType<typeof middleware>>
  file: { key: string; name: string; url: string }
}) => {
  const fileExists = await db.file.findFirst({ where: { key: file.key } })

  if (fileExists) return

  const createdFile = await db.file.create({
    data: {
      key: file.key,
      name: file.name,
      userId: metadata.userId,
      url: file.url,
      uploadStatus: 'PROCESSING',
    },
  })

  try {
    // NOTE you would need to install pdf parse for langchain

    const res = await fetch(file.url) // get pdf file from uploadthing

    const blob = await res.blob() // making pdf as a blob to be able to index it

    const loader = new PDFLoader(blob) // load the pdf into the memory

    const pageLevelDocs = await loader.load() // extracting the page level text of the pdf

    const pagesAmt = pageLevelDocs.length // pages of pdf

    const {
      subscriptionPlan: { isSubscribed },
    } = metadata

    const isProExceeded = pagesAmt > PLANS.find((p) => p.name === 'Pro')!.pagePerPdf
    const isFreeExceeded = pagesAmt > PLANS.find((p) => p.name === 'Free')!.pagePerPdf

    if ((isSubscribed && isProExceeded) || (!isSubscribed && isFreeExceeded)) {
      await db.file.update({
        data: { uploadStatus: 'FAILED' },
        where: { id: createdFile.id },
      })
    }

    // vectorize and index entire document
    const pineconeIndex = pinecone.Index('aipdf')

    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
    }) // to generate the vector from the text

    await PineconeStore.fromDocuments(pageLevelDocs, embeddings, {
      //@ts-ignore
      pineconeIndex,
      namespace: createdFile.id,
    }) // the "embidings" to tell langchain to generate the voctors from the text using ai model

    await db.file.update({
      where: { id: createdFile.id },
      data: { uploadStatus: 'SUCCESS' },
    })
  } catch (err) {
    await db.file.update({
      where: { id: createdFile.id },
      data: { uploadStatus: 'FAILED' },
    })
  }
}

export const ourFileRouter = {
  freePlanUploader: f({ pdf: { maxFileSize: '4MB' } })
    .middleware(middleware)
    .onUploadComplete(onUploadComplete),
  ProPlanUploader: f({ pdf: { maxFileSize: '16MB' } })
    .middleware(middleware)
    .onUploadComplete(onUploadComplete),
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter
