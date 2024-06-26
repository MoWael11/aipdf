import { cn } from '@/lib/utils'
import { FC, ReactNode } from 'react'

interface MaxWidthWrapperProps {
  className?: string
  children: ReactNode
}

const MaxWidthWrapper: FC<MaxWidthWrapperProps> = ({ children, className }) => {
  return <div className={cn('w-full max-w-screen-xl px-2.5 md:px-20 mx-auto', className)}>{children}</div>
}

export default MaxWidthWrapper
