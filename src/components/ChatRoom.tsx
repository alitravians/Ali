import { useState, useEffect, useRef } from 'react'
import { Card } from './ui/card'
import { Button } from './ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import MessageList from './MessageList'
import MessageInput from './MessageInput'
import UserList from './UserList'
import AdminPanel from './AdminPanel'
import ModeratorTools from './ModeratorTools'
import AnnouncementBanner from './AnnouncementBanner'
import BanAppealForm from './BanAppealForm'
import { LogOut, Settings, Shield } from 'lucide-react'

interface ChatRoomProps {
  token: string
  username: string
  userRole: string
  onLogout: () => void
}

interface Message {
  id?: string
  type: string
  username: string
  message: string
  timestamp: string
}

interface User {
  username: string
  role: string
  status: string
}

interface Announcement {
  id: string
  title: string
  content: string
  created_by: string
  timestamp: string
}

export default function ChatRoom({ token, username, userRole, onLogout }: ChatRoomProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [users] = useState<User[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [connected, setConnected] = useState(false)
  const [isBanned, setIsBanned] = useState(false)
  const [banReason, setBanReason] = useState('')
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    loadMessages()
    connectWebSocket()
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [])

  const loadMessages = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/messages`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages || [])
      }
    } catch (error) {
      console.error('Failed to load messages:', error)
    }
  }

  const connectWebSocket = () => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'
    const protocol = apiUrl.startsWith('https') ? 'wss:' : 'ws:'
    const wsUrl = `${protocol}//${apiUrl.replace(/^https?:\/\//, '')}/ws/${username}`
    
    wsRef.current = new WebSocket(wsUrl)
    
    wsRef.current.onopen = () => {
      setConnected(true)
      console.log('WebSocket connected')
    }
    
    wsRef.current.onmessage = (event) => {
      const message = JSON.parse(event.data)
      
      if (message.type === 'chat_message') {
        setMessages(prev => [message, ...prev])
      } else if (message.type === 'user_joined' || message.type === 'user_left') {
        console.log(message.message)
      } else if (message.type === 'message_deleted') {
        setMessages(prev => prev.filter(msg => msg.id !== message.message_id))
      } else if (message.type === 'user_banned' && message.username === username) {
        setIsBanned(true)
        setBanReason(message.reason)
      } else if (message.type === 'announcement') {
        setAnnouncements(prev => [message, ...prev])
      }
    }
    
    wsRef.current.onclose = () => {
      setConnected(false)
      console.log('WebSocket disconnected')
      setTimeout(connectWebSocket, 3000)
    }
    
    wsRef.current.onerror = (error) => {
      console.error('WebSocket error:', error)
    }
  }

  const sendMessage = async (content: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ content }),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to send message')
      }
    } catch (error) {
      console.error('Failed to send message:', error)
      throw error
    }
  }

  if (isBanned) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <BanAppealForm 
          token={token}
          banReason={banReason}
          onLogout={onLogout}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <div className="container mx-auto p-4">
        <div className="mb-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">نظام الدردشة</h1>
            <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm text-gray-600">
              {connected ? 'متصل' : 'غير متصل'}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              مرحباً، {username} ({userRole === 'admin' ? 'مدير' : userRole === 'moderator' ? 'مشرف' : 'مستخدم'})
            </span>
            <Button variant="outline" size="sm" onClick={onLogout}>
              <LogOut className="w-4 h-4 ml-2" />
              خروج
            </Button>
          </div>
        </div>

        {announcements.length > 0 && (
          <AnnouncementBanner announcements={announcements} />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-3">
            <Card className="h-[600px] flex flex-col">
              <div className="flex-1 overflow-hidden">
                <MessageList messages={messages} currentUser={username} />
              </div>
              <div className="border-t p-4">
                <MessageInput onSendMessage={sendMessage} />
              </div>
            </Card>
          </div>
          
          <div className="space-y-4">
            <UserList users={users} />
            
            {(userRole === 'admin' || userRole === 'moderator') && (
              <Tabs defaultValue="moderation" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="moderation">
                    <Shield className="w-4 h-4 ml-2" />
                    إشراف
                  </TabsTrigger>
                  {userRole === 'admin' && (
                    <TabsTrigger value="admin">
                      <Settings className="w-4 h-4 ml-2" />
                      إدارة
                    </TabsTrigger>
                  )}
                </TabsList>
                
                <TabsContent value="moderation">
                  <ModeratorTools token={token} />
                </TabsContent>
                
                {userRole === 'admin' && (
                  <TabsContent value="admin">
                    <AdminPanel token={token} />
                  </TabsContent>
                )}
              </Tabs>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
