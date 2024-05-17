'use client'

import { cn } from '@/lib/utils'
import { zodResolver } from '@hookform/resolvers/zod'
import { ChevronDown, ChevronUp, Loader2, RotateCw, SearchIcon } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'
import { useResizeDetector } from 'react-resize-detector'
import { z } from 'zod'
import { Button } from './ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu'
import { Input } from './ui/input'
import { useToast } from './ui/use-toast'
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`

import SimpleBar from 'simplebar-react'
import PDFFullscreen from './PDFFullscreen'

const PdefRenderer = ({ url }: { url: string }) => {
  const { toast } = useToast()
  const [numPages, setNumPages] = useState<number>()
  const [currPage, setCurrPage] = useState<number>(1)
  const [scale, setScale] = useState<number>(1)
  const [rotation, setRotation] = useState<number>(0)
  const [renderedScale, setRenderedScale] = useState<number | null>(null)
  const isLoading = renderedScale !== scale

  const CustumPageValidator = z.object({
    page: z.string().refine((num) => +num > 0 && +num <= numPages!),
  })

  type CustumPageType = z.infer<typeof CustumPageValidator>

  const {
    register,
    setValue,
    formState: { errors },
    handleSubmit,
  } = useForm<CustumPageType>({
    defaultValues: {
      page: '1',
    },
    resolver: zodResolver(CustumPageValidator),
  })

  const { width, ref } = useResizeDetector()

  const handlePageSubmit = ({ page }: CustumPageType) => {
    setCurrPage(+page)
    setValue('page', page)
  }

  return (
    <div className='w-full bg-white rounded-md shadow flex flex-col items-center'>
      {/* toolbar */}
      <div className='h-14 w-full border-b border-zinc-200 flex items-center justify-between px-2'>
        <div className='flex items-center gap-1.5'>
          <Button
            disabled={currPage === 1}
            onClick={() => {
              setCurrPage((prev) => (prev - 1 >= 1 ? prev - 1 : prev))
              setValue('page', String(currPage - 1))
            }}
            variant={'ghost'}
            aria-label='previous page'
          >
            <ChevronDown className='h-4 w-4' />
          </Button>
          <div className='flex items-center gap-1.5'>
            <Input
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSubmit(handlePageSubmit)()
                }
              }}
              {...register('page')}
              className={cn('w-12 h-8', errors.page && 'focus-visible:ring-red-500')}
            />
            <p className='text-zinc-700 text-sm space-x-1'>
              <span>/</span>
              <span>{numPages ?? 'x'}</span>
            </p>
          </div>
          <Button
            disabled={currPage === numPages || numPages === undefined}
            onClick={() => {
              setCurrPage((prev) => (prev + 1 > numPages! ? prev! : prev + 1))
              setValue('page', String(currPage + 1))
            }}
            variant={'ghost'}
            aria-label='next page'
          >
            <ChevronUp className='h-4 w-4' />
          </Button>
        </div>

        <div className='space-x-2'>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant={'ghost'} aria-label='zoom' className='gap-1.5'>
                <SearchIcon className='h-4 w-4' />
                {scale * 100}%<ChevronDown className='w-3 h-3 opacity-50' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onSelect={() => setScale(1)}>100%</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setScale(1.5)}>150%</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setScale(2)}>200%</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setScale(2.5)}>250%</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button aria-label='rotate 90 degrees' variant={'ghost'} onClick={() => setRotation((prev) => prev + 90)}>
            <RotateCw className='h-4 w-4' />
          </Button>

          <PDFFullscreen fileUrl={url} />
        </div>
      </div>
      <div className='flex-1 w-full max-h-screen'>
        {/* to be able to scroll in pdf and to contain it in specified size */}
        <SimpleBar autoHide={false} className='max-h-[calc(100vh-10rem)]'>
          <div ref={ref}>
            <Document
              loading={
                <div className='flex justify-center'>
                  <Loader2 className='my-24 h-6 w-6 animate-spin' />
                </div>
              }
              onLoadError={() => {
                toast({
                  title: 'Error during PDF',
                  description: 'Please try again later',
                  variant: 'destructive',
                })
              }}
              onLoadSuccess={({ numPages }) => {
                setNumPages(numPages)
              }}
              file={url}
              className='max-h-full'
            >
              {isLoading && renderedScale ? (
                <Page
                  width={width ? width : 1}
                  pageNumber={currPage}
                  scale={renderedScale}
                  rotate={rotation}
                  key={'@' + renderedScale}
                />
              ) : null}

              <Page
                className={cn(isLoading ? 'hidden' : '')}
                width={width ? width : 1}
                pageNumber={currPage}
                scale={scale}
                rotate={rotation}
                key={'@' + scale}
                loading={
                  <div className='flex justify-center'>
                    <Loader2 className='my-24 h-6 w-6 animate-spin' />
                  </div>
                }
                onRenderSuccess={() => {
                  setRenderedScale(scale)
                }}
              />
            </Document>
          </div>
        </SimpleBar>
      </div>
    </div>
  )
}

export default PdefRenderer
