'use client'

import { Banknote, Coins, Send } from 'lucide-react'
import { useContext, useRef } from 'react'
import { Button } from '../ui/button'
import { Textarea } from '../ui/textarea'
import { ChatContext } from './ChatContext'

const ChatInput = ({ isDisabled }: { isDisabled: boolean }) => {
  const { addMessage, handleInputChange, isLoading } = useContext(ChatContext)

  const textareaRef = useRef<HTMLTextAreaElement>(null)

  return (
    <div className='absolute bottom-0 left-0 w-full'>
      <div className='mx-2 flex flex-row gap-3 md:mx-4 md:last:mb-6 lg:mx-auto lg:max-w-2xl xl:max-w-3xl'>
        <div className='relative flex h-full flex-1 items-stretch md:flex-col'>
          <div className='relative flex flex-col w-full flex-grow p-4'>
            <div className='relative'>
              <Textarea
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    addMessage()
                    textareaRef.current?.value ? (textareaRef.current.value = '') : null
                    textareaRef.current?.focus()
                  }
                }}
                ref={textareaRef}
                onChange={(e) => handleInputChange(e)}
                placeholder='Eneter you question...'
                rows={1}
                maxRows={4}
                autoFocus
                className='resize-none pr-12 text-base py-3 scrollbar-thumb-blue scrollbar-thumb-round scrollbar-track-blue-lighter scrollbar-w-2 scrollbar-thumb-rounded'
              />
              <Button
                disabled={isLoading || isDisabled}
                aria-label='send message'
                className='absolute bottom-1.5 right-2 gap-1'
                onClick={() => {
                  addMessage()

                  textareaRef.current?.value ? (textareaRef.current.value = '') : null
                  textareaRef.current?.focus()
                }}
              >
                <div className='text-xs flex items-center font-mono bg-[#dbd9e04f] py-[1px] px-0.5 rounded-sm'>
                  <span>1</span>
                  <Banknote size={12} className='rotate-[233deg]' />
                </div>
                <Send className='h-4 w-4' />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
export default ChatInput
