import { useState, useEffect } from 'react'
import { Send, Loader2, CheckCircle, AlertCircle, BarChart3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import './App.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

interface BotMessage {
  bot_username: string
  bot_id: number
  message: string
  timestamp: string
  bot_number: number
}

interface TaskStatus {
  task_id: string
  status: string
  bots_sent: number
  total_bots: number
  messages_sent: BotMessage[]
}

interface Stats {
  total_accounts: number
  active_accounts: number
  total_messages_sent: number
  active_tasks: number
}

function App() {
  const [streamUrl, setStreamUrl] = useState('https://www.bigo.tv/ar/1076744959')
  const [botCount, setBotCount] = useState(50)
  const [delaySeconds, setDelaySeconds] = useState(4)
  const [messages, setMessages] = useState(['نهايتك قربت', 'الغلطه بألف'])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [taskId, setTaskId] = useState<string | null>(null)
  const [taskStatus, setTaskStatus] = useState<TaskStatus | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [showStats, setShowStats] = useState(false)

  useEffect(() => {
    fetchStats()
  }, [])

  useEffect(() => {
    if (taskId && taskStatus?.status === 'running') {
      const interval = setInterval(async () => {
        try {
          const response = await fetch(`${API_URL}/api/task-status/${taskId}`)
          
          if (!response.ok) {
            console.error('Failed to fetch task status', response.status)
            setError('حدث خطأ أثناء متابعة حالة البوتات')
            setLoading(false)
            clearInterval(interval)
            return
          }

          const raw = await response.json()
          const normalized: TaskStatus = {
            task_id: raw.task_id,
            status: raw.status,
            bots_sent: raw.bots_sent ?? 0,
            total_bots: raw.total_bots ?? botCount,
            messages_sent: raw.messages_sent ?? []
          }

          setTaskStatus(normalized)
          
          if (normalized.status === 'completed') {
            setLoading(false)
            fetchStats()
          }
        } catch (err) {
          console.error('Error fetching task status:', err)
          setError('حدث خطأ أثناء متابعة حالة البوتات')
          setLoading(false)
        }
      }, 2000)

      return () => clearInterval(interval)
    }
  }, [taskId, taskStatus?.status, botCount])

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_URL}/api/stats`)
      const data = await response.json()
      setStats(data)
    } catch (err) {
      console.error('Error fetching stats:', err)
    }
  }

  const handleAddMessage = () => {
    if (newMessage.trim() && !messages.includes(newMessage.trim())) {
      setMessages([...messages, newMessage.trim()])
      setNewMessage('')
    }
  }

  const handleRemoveMessage = (index: number) => {
    setMessages(messages.filter((_, i) => i !== index))
  }

  const handleSendBots = async () => {
    if (!streamUrl.trim()) {
      setError('يرجى إدخال رابط البث')
      return
    }

    if (messages.length === 0) {
      setError('يرجى إضافة رسالة واحدة على الأقل')
      return
    }

    setError(null)
    setLoading(true)
    setTaskStatus(null)

    try {
      const response = await fetch(`${API_URL}/api/send-bots`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stream_url: streamUrl,
          bot_count: botCount,
          messages: messages,
          delay_seconds: delaySeconds
        })
      })

      const data = await response.json()

      if (response.ok) {
        setTaskId(data.task_id)
        setTaskStatus({
          task_id: data.task_id,
          status: 'running',
          bots_sent: 0,
          total_bots: botCount,
          messages_sent: []
        })
      } else {
        setError(data.detail || 'حدث خطأ أثناء إرسال البوتات')
        setLoading(false)
      }
    } catch (err) {
      setError('فشل الاتصال بالخادم')
      setLoading(false)
    }
  }

  const progress = taskStatus ? (taskStatus.bots_sent / taskStatus.total_bots) * 100 : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4" dir="rtl">
      <div className="max-w-4xl mx-auto space-y-6 py-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-white">إرسال بوتات BIGO LIVE</h1>
          <p className="text-slate-300">أرسل بوتات وهمية إلى البثوث المباشرة بشكل تلقائي</p>
        </div>

        {stats && (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="cursor-pointer" onClick={() => setShowStats(!showStats)}>
              <CardTitle className="flex items-center gap-2 text-white">
                <BarChart3 className="w-5 h-5" />
                الإحصائيات
              </CardTitle>
            </CardHeader>
            {showStats && (
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-400">{stats.total_accounts}</div>
                    <div className="text-sm text-slate-400">إجمالي الحسابات</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400">{stats.active_accounts}</div>
                    <div className="text-sm text-slate-400">حسابات نشطة</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-400">{stats.total_messages_sent}</div>
                    <div className="text-sm text-slate-400">رسائل مرسلة</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-400">{stats.active_tasks}</div>
                    <div className="text-sm text-slate-400">مهام نشطة</div>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        )}

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">إعدادات البث</CardTitle>
            <CardDescription className="text-slate-400">أدخل رابط البث وعدد البوتات</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">رابط البث المباشر</label>
              <Input
                type="text"
                value={streamUrl}
                onChange={(e) => setStreamUrl(e.target.value)}
                placeholder="https://www.bigo.tv/ar/1076744959"
                className="bg-slate-700 border-slate-600 text-white"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">عدد البوتات</label>
              <Input
                type="number"
                value={botCount}
                onChange={(e) => setBotCount(parseInt(e.target.value) || 0)}
                min="1"
                max="200"
                className="bg-slate-700 border-slate-600 text-white"
                disabled={loading}
              />
              <p className="text-xs text-slate-400">الحد الأقصى: 200 بوت</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">الوقت بين كل بوت والثاني (بالثواني)</label>
              <Input
                type="number"
                value={delaySeconds}
                onChange={(e) => setDelaySeconds(parseInt(e.target.value) || 1)}
                min="1"
                max="60"
                className="bg-slate-700 border-slate-600 text-white"
                disabled={loading}
              />
              <p className="text-xs text-slate-400">الحد الأدنى: 1 ثانية | الحد الأقصى: 60 ثانية</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">الرسائل</CardTitle>
            <CardDescription className="text-slate-400">أضف الرسائل التي سيرسلها البوتات</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddMessage()}
                placeholder="أدخل رسالة جديدة"
                className="bg-slate-700 border-slate-600 text-white"
                disabled={loading}
              />
              <Button onClick={handleAddMessage} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                إضافة
              </Button>
            </div>

            <div className="space-y-2">
              {messages.map((msg, index) => (
                <div key={index} className="flex items-center justify-between bg-slate-700 p-3 rounded-lg">
                  <span className="text-white">{msg}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveMessage(index)}
                    disabled={loading}
                    className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                  >
                    حذف
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {error && (
          <Alert className="bg-red-900/50 border-red-700">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-white">{error}</AlertDescription>
          </Alert>
        )}

        {taskStatus && (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                {taskStatus.status === 'completed' ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    اكتمل الإرسال
                  </>
                ) : (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
                    جاري الإرسال...
                  </>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-slate-300">
                  <span>التقدم</span>
                  <span>{taskStatus.bots_sent} / {taskStatus.total_bots}</span>
                </div>
                <Progress value={progress} className="h-2" />
                <div className="text-center text-2xl font-bold text-white">{Math.round(progress)}%</div>
              </div>

              {taskStatus.messages_sent?.length > 0 && (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  <h4 className="text-sm font-medium text-slate-300">آخر الرسائل المرسلة:</h4>
                  {taskStatus.messages_sent.slice(-5).reverse().map((msg, index) => (
                    <div key={index} className="bg-slate-700 p-2 rounded text-sm">
                      <div className="flex justify-between text-slate-300">
                        <span className="font-medium">{msg.bot_username}</span>
                        <span className="text-xs">#{msg.bot_number}</span>
                      </div>
                      <div className="text-white">{msg.message}</div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Button
          onClick={handleSendBots}
          disabled={loading}
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-6 text-lg"
        >
          {loading ? (
            <>
              <Loader2 className="ml-2 h-5 w-5 animate-spin" />
              جاري الإرسال...
            </>
          ) : (
            <>
              <Send className="ml-2 h-5 w-5" />
              إرسال البوتات
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

export default App
