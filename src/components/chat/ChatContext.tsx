import { createContext, useRef, useState } from 'react'
import { useToast } from '../ui/use-toast'
import { useMutation } from '@tanstack/react-query'
import { trpc } from '@/app/_trpc/client'
import { INFINITE_QUERY_LIMIT } from '@/config/infinit-query'

type StreamResponse = {
  addMessage: () => void
  message: string
  handleInputChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void
  isLoading: boolean
}

export const ChatContext = createContext<StreamResponse>({
  addMessage: () => {},
  message: '',
  handleInputChange: () => {},
  isLoading: false,
})

interface Props {
  fileId: string
  children: React.ReactNode
}

export const ChatContextProvider = ({ fileId, children }: Props) => {
  const [message, setMessage] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const backupMessage = useRef('')

  const utils = trpc.useUtils()

  const { toast } = useToast()

  const { mutate: sendMessage } = useMutation({
    mutationFn: async ({ message }: { message: string }) => {
      const response = await fetch('/api/message', {
        method: 'POST',
        body: JSON.stringify({
          fileId,
          message,
        }),
      })

      if (!response) throw new Error('Faild to send message')

      return response.body
    },
    onMutate: async ({ message }) => {
      backupMessage.current = message
      setMessage('')

      // step 1
      await utils.getFileMessages.cancel() // do not overwrite optimistic updates

      // step 2
      const previousMessages = utils.getFileMessages.getInfiniteData()

      // step 3 - insert new value
      utils.getFileMessages.setInfiniteData({ fileId, limit: INFINITE_QUERY_LIMIT }, (old) => {
        console.log(!old)
        console.log(old)
        console.log(message)

        if (!old) return { pages: [], pageParams: [] }

        let newPages = [...old.pages]

        let latestPage = newPages[0]! // this cause the order is desc in the trpc method
        console.log(newPages[0])
        console.log(latestPage.messages)

        latestPage.messages = [
          // insert the current message
          {
            createdAt: new Date().toISOString(),
            id: crypto.randomUUID(),
            text: message,
            isUserMessage: true,
          },
          ...latestPage.messages, // add the previous messages
        ]
        console.log(latestPage.messages)

        newPages[0] = latestPage // to put the new message
        console.log(newPages[0])

        return {
          ...old,
          pages: newPages,
        }
      })

      setIsLoading(true)

      return {
        previousMessages: previousMessages?.pages.flatMap((page) => page.messages) ?? [],
      }
    },
    onError: (_, __, context) => {
      setMessage(backupMessage.current)
      utils.getFileMessages.setData({ fileId }, { messages: context?.previousMessages ?? [] })
    },
    // after res ended
    onSettled: async () => {
      await utils.getFileMessages.invalidate({ fileId }) // refresh the entire data
    },
    onSuccess: async (stream) => {
      setIsLoading(false)

      if (!stream)
        return toast({
          title: 'There was a problem sending this message',
          description: 'Please refresh the page and try again',
          variant: 'destructive',
        })

      const reader = stream?.getReader()
      const decoder = new TextDecoder() // decode stram
      let done = false

      // accumulated response
      let accResponse = ''

      while (!done && reader) {
        const { value, done: doneReading } = await reader.read()
        done = doneReading
        const chunValue = decoder.decode(value)
        accResponse += chunValue

        // append chunk to the actual message
        utils.getFileMessages.setInfiniteData(
          {
            fileId,
            limit: INFINITE_QUERY_LIMIT,
          },
          (old) => {
            if (!old) return { pages: [], pageParams: [] }

            let isAiResponseCreated = old.pages.some((page) =>
              page.messages.some((message) => message.id === 'ai-response')
            )

            let updatedPages = old.pages.map((page) => {
              if (page === old.pages[0]) {
                let updatedMessages

                if (!isAiResponseCreated) {
                  updatedMessages = [
                    {
                      createdAt: new Date().toISOString(),
                      id: 'ai-response',
                      text: accResponse,
                      isUserMessage: false,
                    },
                    ...page.messages,
                  ]
                } else {
                  updatedMessages = page.messages.map((message) => {
                    if (message.id === 'ai-response') {
                      return {
                        ...message,
                        text: accResponse,
                      }
                    }
                    return message
                  })
                }

                return {
                  ...page,
                  messages: updatedMessages,
                }
              }
              return page
            })

            return {
              ...old,
              pages: updatedPages,
            }
          }
        )
      }
    },
  })

  const addMessage = () => sendMessage({ message })

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value)
  }

  return (
    <ChatContext.Provider value={{ addMessage, message, handleInputChange, isLoading }}>
      {children}
    </ChatContext.Provider>
  )
}
