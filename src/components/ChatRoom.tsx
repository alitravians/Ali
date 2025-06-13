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
  onMaintenanceUpdate?: (mode: boolean, message: string) => void
}

interface Message {
  id?: string
  type: string
  username: string
  message: string
  timestamp: string
  is_bold?: boolean
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

export default function ChatRoom({ token, username, userRole, onLogout, onMaintenanceUpdate }: ChatRoomProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [users] = useState<User[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [connected, setConnected] = useState(false)
  const [isBanned, setIsBanned] = useState(false)
  const [banReason, setBanReason] = useState('')
  const [banDuration, setBanDuration] = useState<number>(0)
  const [banUntil, setBanUntil] = useState<string>('')
  const [userId, setUserId] = useState<string>('')
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    loadMessages()
    loadUserInfo()
    connectWebSocket()
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [])

  const loadMessages = async () => {
    try {
      const apiUrl = window.location.hostname === 'localhost' ? 'http://localhost:8000' : (import.meta.env.VITE_API_URL || 'http://localhost:8000')
      const response = await fetch(`${apiUrl}/messages`, {
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

  const loadUserInfo = async () => {
    try {
      const apiUrl = window.location.hostname === 'localhost' ? 'http://localhost:8000' : (import.meta.env.VITE_API_URL || 'http://localhost:8000')
      const response = await fetch(`${apiUrl}/user/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        setUserId(data.user_id || '')
        
        if (data.status === 'banned' && data.ban_until) {
          const banUntil = new Date(data.ban_until)
          const now = new Date()
          
          if (banUntil > now) {
            setIsBanned(true)
            setBanReason(data.ban_reason || 'لم يتم تحديد السبب')
            setBanDuration(data.ban_duration_minutes || 0)
            setBanUntil(data.ban_until)
          }
        }
      } else if (response.status === 401 || response.status === 403) {
        try {
          const errorData = await response.json()
          if (errorData.detail && errorData.detail.includes('banned')) {
            setIsBanned(true)
            setBanReason('تم حظرك من النظام')
            setBanDuration(0)
            setBanUntil('')
          } else {
            onLogout()
          }
        } catch {
          onLogout()
        }
      }
    } catch (error) {
      console.error('Failed to load user info:', error)
    }
  }

  const connectWebSocket = () => {
    const apiUrl = window.location.hostname === 'localhost' ? 'http://localhost:8000' : (import.meta.env.VITE_API_URL || 'http://localhost:8000')
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
        setBanReason(message.reason || 'لم يتم تحديد السبب')
        setBanDuration(message.duration_minutes || 0)
        setBanUntil(message.ban_until || '')
      } else if (message.type === 'announcement') {
        setAnnouncements(prev => [message, ...prev])
      } else if (message.type === 'site_status_update') {
        if (onMaintenanceUpdate) {
          onMaintenanceUpdate(message.maintenance_mode, message.maintenance_message)
        }
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
      const apiUrl = window.location.hostname === 'localhost' ? 'http://localhost:8000' : (import.meta.env.VITE_API_URL || 'http://localhost:8000')
      const response = await fetch(`${apiUrl}/messages`, {
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
          banDuration={banDuration}
          banUntil={banUntil}
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
              {userId && <span className="text-xs text-gray-500">#{userId}</span>}
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
