import { type ClassValue, clsx } from 'clsx'
import { Metadata } from 'next'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function absoluteUrl(path: string) {
  if (typeof window !== 'undefined') return path
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}${path}`
  return `${process.env.BASE_URL}${path}`
}

export function constructMetadate({
  title = 'AiPDF - the SaaS for students',
  description = 'AiPDF is an open-source sofware to make chatting to your PDF files easy.',
  image = '/thumbnail.png',
  icons = '/favicon.ico',
  noIndex = false,
}: {
  title?: string
  description?: string
  image?: string
  icons?: string
  noIndex?: boolean
} = {}): Metadata {
  return {
    title,
    description,
    verification: {
      google: 'qy9XIF09M46fU-VZvEXeaichv6mQjdhJ2UMypKoDi5M',
    },
    openGraph: {
      title,
      description,
      images: [{ url: image }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
      creator: '@mowael11',
    },
    icons,
    metadataBase: new URL(process.env.BASE_URL),
    // themeColor: '#ffffff', deprecated
    ...(noIndex && {
      robots: {
        index: false,
        follow: false,
      },
    }),
  }
}
