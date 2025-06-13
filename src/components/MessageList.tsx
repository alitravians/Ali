import { useEffect, useRef } from 'react'
import { ScrollArea } from './ui/scroll-area'
import { Avatar, AvatarFallback } from './ui/avatar'
import { Badge } from './ui/badge'
import { formatArabicTime, arabicTranslations } from '../lib/arabic'

interface Message {
  id?: string
  type: string
  username: string
  message: string
  timestamp: string
  is_bold?: boolean
}

interface MessageListProps {
  messages: Message[]
  currentUser: string
}

export default function MessageList({ messages, currentUser }: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const formatTime = (timestamp: string) => {
    return formatArabicTime(timestamp)
  }

  const getRoleColor = (username: string) => {
    if (username === 'admin') return 'bg-red-500'
    if (username.includes('mod')) return 'bg-blue-500'
    return 'bg-gray-500'
  }

  const getRoleText = (username: string) => {
    if (username === 'admin') return arabicTranslations.admin
    if (username.includes('mod')) return arabicTranslations.moderator
    return arabicTranslations.user
  }

  return (
    <ScrollArea className="h-full p-4" ref={scrollRef}>
      <div className="space-y-4">
        {messages.map((message, index) => (
          <div
            key={message.id || index}
            className={message.username === currentUser ? 'chat-message-rtl' : 'chat-message-ltr'}
          >
            <Avatar className="w-8 h-8">
              <AvatarFallback className={getRoleColor(message.username)}>
                {message.username.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className={`flex-1 ${message.username === currentUser ? 'text-right' : 'text-left'}`}>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-sm">{message.username}</span>
                <Badge variant="secondary" className="text-xs">
                  {getRoleText(message.username)}
                </Badge>
                <span className="text-xs text-gray-500">
                  {formatTime(message.timestamp)}
                </span>
              </div>
              
              <div
                className={`rounded-lg p-3 max-w-xs break-words ${
                  message.username === currentUser
                    ? 'bg-blue-500 text-white ml-auto'
                    : 'bg-gray-100 text-gray-900'
                } ${message.is_bold ? 'font-bold text-black' : ''}`}
              >
                {message.message}
              </div>
            </div>
          </div>
        ))}
        
        {messages.length === 0 && (
          <div className="text-center text-gray-500 py-8 rtl-text">
            {arabicTranslations.noMessages}
          </div>
        )}
      </div>
    </ScrollArea>
  )
}
