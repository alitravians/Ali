import React, { useState, useEffect, useRef } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Badge } from './ui/badge'
import { ScrollArea } from './ui/scroll-area'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Textarea } from './ui/textarea'
import { useAuth } from '../contexts/AuthContext'
import { MessageCircle, Users, Send, LogOut, Megaphone, Settings, Bell } from 'lucide-react'
import NotificationSystem from './NotificationSystem'

interface ChatRoomProps {
  onShowAdminPanel?: () => void
}

const API_URL = import.meta.env?.VITE_API_URL || 'http://localhost:8000'
const WS_URL = API_URL.replace('http', 'ws')

interface Message {
  message_id: string
  user_id: string
  username: string
  content: string
  timestamp: string
}

interface UserInfo {
  user_id: string
  username: string
  role: string
  status: string
  is_online: boolean
}

interface Announcement {
  announcement_id: string
  title: string
  content: string
  created_at: string
}

export default function ChatRoom({ onShowAdminPanel }: ChatRoomProps) {
  const { user, token, logout } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [onlineUsers, setOnlineUsers] = useState<UserInfo[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [messageInput, setMessageInput] = useState('')
  const [ws, setWs] = useState<WebSocket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [showReportDialog, setShowReportDialog] = useState(false)
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null)
  const [reportCategory, setReportCategory] = useState('')
  const [reportReason, setReportReason] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [notifications, setNotifications] = useState<any[]>([])
  const [showNotifications, setShowNotifications] = useState(false)
  const [unreadNotifications, setUnreadNotifications] = useState(0)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (user?.status === 'banned') {
      window.location.href = '/appeal';
    }
  }, [user]);
  
  useEffect(() => {
    if (!user || !token) return

    const connectWebSocket = () => {
      const websocket = new WebSocket(`${WS_URL}/ws/${user.user_id}`)
      
      websocket.onopen = () => {
        setIsConnected(true)
        setWs(websocket)
      }

      websocket.onmessage = (event) => {
        const data = JSON.parse(event.data)
        
        if (data.type === 'message') {
          setMessages(prev => [...prev, data.data])
        } else if (data.type === 'user_list') {
          setOnlineUsers(data.data)
        } else if (data.type === 'announcement') {
          setAnnouncements(prev => [data.data, ...prev])
        } else if (data.type === 'message_deleted') {
          setMessages(prev => prev.filter(msg => msg.message_id !== data.data.message_id))
        } else if (data.type === 'status_change') {
          window.location.reload()
        } else if (data.type === 'appeal_response') {
          alert(`رد الإدارة: ${data.data.admin_response}`)
          if (data.data.action === 'approve') {
            window.location.reload()
          }
        } else if (data.type === 'ban_status') {
          if (data.data.is_banned) {
            window.location.href = '/appeal'
          }
        } else if (data.type === 'ban_notification') {
          if (data.data.banned) {
            alert(`تم حظرك من الدردشة. السبب: ${data.data.reason}. المدة: ${data.data.duration}`)
            window.location.reload()
          } else {
            alert('تم رفع الحظر عنك. يمكنك الآن المشاركة في الدردشة.')
            window.location.reload()
          }
        } else if (data.type === 'notification') {
          setNotifications(prev => [...prev, data.data])
        }
      }

      websocket.onclose = () => {
        setIsConnected(false)
        setTimeout(connectWebSocket, 3000)
      }

      websocket.onerror = () => {
        setIsConnected(false)
      }
    }

    connectWebSocket()

    const pingInterval = setInterval(() => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'ping' }))
      }
    }, 30000)

    return () => {
      clearInterval(pingInterval)
      if (ws) {
        ws.close()
      }
    }
  }, [user, token])

  useEffect(() => {
    fetchInitialData()
  }, [])
  
  useEffect(() => {
    if (!token || !user) return;
    
    const fetchNotifications = async () => {
      try {
        const response = await fetch(`${API_URL}/notifications/${user.user_id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setNotifications(data);
          setUnreadNotifications(data.filter((n: any) => !n.is_read).length);
        }
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };
    
    fetchNotifications();
  }, [token, user]);
  const fetchInitialData = async () => {
    try {
      const [messagesRes, announcementsRes] = await Promise.all([
        fetch(`${API_URL}/messages`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${API_URL}/announcements`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ])

      if (messagesRes.ok) {
        const messagesData = await messagesRes.json()
        setMessages(messagesData)
      }

      if (announcementsRes.ok) {
        const announcementsData = await announcementsRes.json()
        setAnnouncements(announcementsData)
      }
    } catch (error) {
      console.error('Error fetching initial data:', error)
    }
  }

  const sendMessage = () => {
    if (!messageInput.trim() || !ws || ws.readyState !== WebSocket.OPEN) return

    if (messageInput.length > 500) {
      alert('الرسالة طويلة جداً. الحد الأقصى 500 حرف.')
      return
    }

    ws.send(JSON.stringify({
      type: 'message',
      content: messageInput.trim()
    }))

    setMessageInput('')
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }
  
  const handleMarkNotificationRead = async (notificationId: string) => {
    if (!token) return;
    
    try {
      const response = await fetch(`${API_URL}/notifications/${notificationId}/read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => 
            n.notification_id === notificationId 
              ? { ...n, is_read: true } 
              : n
          )
        );
        setUnreadNotifications(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleReportMessage = (message: Message) => {
    setSelectedMessage(message)
    setShowReportDialog(true)
  }

  const submitReport = async () => {
    if (!selectedMessage || !reportCategory || !reportReason.trim()) return

    try {
      const response = await fetch(`${API_URL}/reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          message_id: selectedMessage.message_id,
          category: reportCategory,
          reason: reportReason.trim()
        })
      })

      if (response.ok) {
        alert('تم إرسال البلاغ بنجاح')
        setShowReportDialog(false)
        setSelectedMessage(null)
        setReportCategory('')
        setReportReason('')
      } else {
        const error = await response.json()
        alert(error.detail || 'فشل في إرسال البلاغ')
      }
    } catch (error) {
      alert('حدث خطأ في إرسال البلاغ')
    }
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('ar-SA', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800'
      case 'moderator': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getRoleText = (role: string) => {
    switch (role) {
      case 'admin': return 'مدير'
      case 'moderator': return 'مشرف'
      default: return 'عضو'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <div className="flex-1 flex flex-col">
        <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4 space-x-reverse">
            <MessageCircle className="h-6 w-6 text-blue-600" />
            <div>
              <h1 className="text-xl font-bold">نظام الدردشة المتطور</h1>
              <p className="text-sm text-gray-500">
                مرحباً {user?.username} - معرفك: {user?.user_id}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 space-x-reverse">
            <div className={`flex items-center space-x-1 space-x-reverse px-2 py-1 rounded-full text-xs ${
              isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span>{isConnected ? 'متصل' : 'غير متصل'}</span>
            </div>
            {/* Notification Icon */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 rounded-full hover:bg-gray-200"
              >
                <Bell className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" />
                {unreadNotifications > 0 && (
                  <span className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                    {unreadNotifications}
                  </span>
                )}
              </button>
              
              {/* Notification Panel */}
              {showNotifications && (
                <div className="absolute left-0 mt-2 w-80 bg-white rounded-md shadow-lg z-10 rtl">
                  <div className="p-2 border-b">
                    <h3 className="font-bold">الإشعارات</h3>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">لا توجد إشعارات</div>
                    ) : (
                      notifications.map((notification: any) => (
                        <div 
                          key={notification.notification_id} 
                          className={`p-3 border-b hover:bg-gray-100 ${!notification.is_read ? 'bg-blue-50' : ''}`}
                          onClick={() => handleMarkNotificationRead(notification.notification_id)}
                        >
                          <div className="font-bold">{notification.title}</div>
                          <div>{notification.content}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {new Date(notification.created_at).toLocaleString('ar-SA')}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            <NotificationSystem />
            {onShowAdminPanel && (
              <Button variant="outline" size="sm" onClick={onShowAdminPanel}>
                <Settings className="h-4 w-4 ml-2" />
                لوحة الإدارة
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={logout}>
              <LogOut className="h-4 w-4 ml-2" />
              خروج
            </Button>
          </div>
        </div>

        {announcements.length > 0 && (
          <div className="bg-blue-50 border-b px-6 py-3">
            <div className="flex items-center space-x-2 space-x-reverse mb-2">
              <Megaphone className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">الإعلانات</span>
            </div>
            <div className="space-y-2">
              {announcements.slice(0, 3).map((announcement) => (
                <div key={announcement.announcement_id} className="bg-white rounded p-3 border-r-4 border-blue-500">
                  <h4 className="font-medium text-blue-900">{announcement.title}</h4>
                  <p className="text-sm text-gray-700 mt-1">{announcement.content}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    {new Date(announcement.created_at).toLocaleDateString('ar-SA')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex-1 flex">
          <div className="flex-1 flex flex-col">
            <ScrollArea className="flex-1 p-6">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.message_id}
                    className={`flex ${message.user_id === user?.user_id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg cursor-pointer hover:shadow-md transition-shadow ${
                        message.user_id === user?.user_id
                          ? 'bg-blue-500 text-white'
                          : 'bg-white border'
                      }`}
                      onClick={() => message.user_id !== user?.user_id && handleReportMessage(message)}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium">
                          {message.username} ({message.user_id})
                        </span>
                        <span className="text-xs opacity-75">
                          {formatTime(message.timestamp)}
                        </span>
                      </div>
                      <div 
                        className="message-text" 
                        onClick={() => message.user_id !== user?.user_id && handleReportMessage(message)}
                        dangerouslySetInnerHTML={{ __html: message.content }}
                      ></div>
                      {message.user_id !== user?.user_id && (
                        <div className="mt-1 text-xs opacity-60">
                          اضغط للإبلاغ
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            <div className="border-t bg-white p-4">
              <div className="flex space-x-2 space-x-reverse">
                <Input
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="اكتب رسالتك هنا... (الحد الأقصى 500 حرف)"
                  disabled={!isConnected}
                  className="text-right"
                  dir="rtl"
                  maxLength={500}
                />
                <Button onClick={sendMessage} disabled={!isConnected || !messageInput.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <div className="text-xs text-gray-500 mt-1 text-right">
                {messageInput.length}/500 حرف
              </div>
            </div>
          </div>

          <div className="w-80 border-l bg-white">
            <div className="p-4 border-b">
              <div className="flex items-center space-x-2 space-x-reverse">
                <Users className="h-5 w-5 text-gray-600" />
                <h3 className="font-medium">المتصلون الآن ({onlineUsers.length})</h3>
              </div>
            </div>
            <ScrollArea className="h-96">
              <div className="p-4 space-y-3">
                {onlineUsers.map((onlineUser) => (
                  <div key={onlineUser.user_id} className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-sm">{onlineUser.username}</div>
                      <div className="text-xs text-gray-500">معرف: {onlineUser.user_id}</div>
                    </div>
                    <div className="flex items-center space-x-1 space-x-reverse">
                      <Badge className={getRoleColor(onlineUser.role)}>
                        {getRoleText(onlineUser.role)}
                      </Badge>
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>

      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>الإبلاغ عن رسالة</DialogTitle>
            <DialogDescription>
              يرجى اختيار سبب الإبلاغ عن هذه الرسالة
            </DialogDescription>
          </DialogHeader>
          
          {selectedMessage && (
            <div className="bg-gray-50 p-3 rounded border-r-4 border-red-500 mb-4">
              <div className="text-sm font-medium">{selectedMessage.username}</div>
              <div className="text-sm text-gray-700 mt-1">{selectedMessage.content}</div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">فئة البلاغ</label>
              <Select value={reportCategory} onValueChange={setReportCategory}>
                <SelectTrigger className="text-right" dir="rtl">
                  <SelectValue placeholder="اختر فئة البلاغ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="offensive_message">رسالة مسيئة</SelectItem>
                  <SelectItem value="inappropriate_phrases">عبارات غير لائقة</SelectItem>
                  <SelectItem value="religion_politics">دين/سياسة</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">تفاصيل البلاغ</label>
              <Textarea
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                placeholder="اكتب تفاصيل البلاغ..."
                className="text-right"
                dir="rtl"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="flex-row-reverse">
            <Button onClick={submitReport} disabled={!reportCategory || !reportReason.trim()}>
              إرسال البلاغ
            </Button>
            <Button variant="outline" onClick={() => setShowReportDialog(false)}>
              إلغاء
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
