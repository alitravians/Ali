import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { Label } from './ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Alert, AlertDescription } from './ui/alert'
import { Badge } from './ui/badge'
import { Trash2, MessageSquare, Users, AlertTriangle, Settings, BarChart3, UserX } from 'lucide-react'
import { arabicTranslations } from '../lib/arabic'

interface AdminPanelProps {
  token: string
}

interface User {
  id: string
  username: string
  role: string
  status: string
  created_at: string
}

interface Report {
  id: string
  reporter_id: string
  target_user_id: string
  reason: string
  status: string
  created_at: string
}

interface BanAppeal {
  id: string
  user_id: string
  reason: string
  status: string
  admin_response?: string
  created_at: string
}

export default function AdminPanel({ token }: AdminPanelProps) {
  const [users, setUsers] = useState<User[]>([])
  const [reports, setReports] = useState<Report[]>([])
  const [banAppeals, setBanAppeals] = useState<BanAppeal[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [announcementTitle, setAnnouncementTitle] = useState('')
  const [announcementContent, setAnnouncementContent] = useState('')
  
  const [newAdminUsername, setNewAdminUsername] = useState('')
  const [newAdminCode, setNewAdminCode] = useState('')
  
  const [siteSettings, setSiteSettings] = useState({
    maintenanceMode: false,
    maintenanceMessage: '',
    profanityFilter: true,
    maxMessageLength: 500,
    allowGuestUsers: false
  })
  
  const [analytics, setAnalytics] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalMessages: 0,
    todayMessages: 0,
    bannedUsers: 0,
    mutedUsers: 0
  })
  
  const [banUserId, setBanUserId] = useState('')
  const [banReason, setBanReason] = useState('')
  const [banDuration, setBanDuration] = useState(60)
  const [muteUserId, setMuteUserId] = useState('')
  const [muteDuration, setMuteDuration] = useState(30)
  const [bannedUsers, setBannedUsers] = useState<any[]>([])
  const [unbanUserId, setUnbanUserId] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const apiUrl = window.location.hostname === 'localhost' ? 'http://localhost:8000' : (import.meta.env.VITE_API_URL || 'http://localhost:8000')
      console.log('AdminPanel: Loading data from API:', apiUrl)
      console.log('AdminPanel: Token:', token ? 'Present' : 'Missing')
      
      const [usersRes, reportsRes, appealsRes, settingsRes, analyticsRes, bannedUsersRes] = await Promise.all([
        fetch(`${apiUrl}/admin/users`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${apiUrl}/admin/reports`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${apiUrl}/admin/ban-appeals`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${apiUrl}/admin/settings`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${apiUrl}/admin/analytics`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${apiUrl}/admin/banned-users`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ])
      
      console.log('AdminPanel: API responses status:', {
        users: usersRes.status,
        reports: reportsRes.status,
        appeals: appealsRes.status,
        settings: settingsRes.status,
        analytics: analyticsRes.status,
        bannedUsers: bannedUsersRes.status
      })

      if (usersRes.ok) {
        const usersData = await usersRes.json()
        setUsers(usersData.users || [])
      }

      if (reportsRes.ok) {
        const reportsData = await reportsRes.json()
        setReports(reportsData.reports || [])
      }

      if (appealsRes.ok) {
        const appealsData = await appealsRes.json()
        setBanAppeals(appealsData.appeals || [])
      }

      if (settingsRes.ok) {
        const settingsData = await settingsRes.json()
        setSiteSettings(settingsData.settings || siteSettings)
      }

      if (analyticsRes.ok) {
        const analyticsData = await analyticsRes.json()
        setAnalytics(analyticsData.analytics || analytics)
      }

      if (bannedUsersRes.ok) {
        const bannedUsersData = await bannedUsersRes.json()
        setBannedUsers(bannedUsersData.banned_users || [])
      }
    } catch (err) {
      setError('فشل في تحميل البيانات')
    } finally {
      setLoading(false)
    }
  }

  const createAnnouncement = async () => {
    if (!announcementTitle.trim() || !announcementContent.trim()) {
      setError('يرجى ملء جميع حقول الإعلان')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const apiUrl = window.location.hostname === 'localhost' ? 'http://localhost:8000' : (import.meta.env.VITE_API_URL || 'http://localhost:8000')
      const response = await fetch(`${apiUrl}/admin/announcements`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: announcementTitle,
          content: announcementContent
        })
      })

      if (response.ok) {
        setSuccess('تم إنشاء الإعلان بنجاح')
        setAnnouncementTitle('')
        setAnnouncementContent('')
      } else {
        const errorData = await response.json()
        setError(errorData.detail || 'فشل في إنشاء الإعلان')
      }
    } catch (err) {
      setError('فشل في إنشاء الإعلان')
    } finally {
      setLoading(false)
    }
  }

  const updateUserRole = async (userId: string, newRole: string) => {
    setLoading(true)
    try {
      const apiUrl = window.location.hostname === 'localhost' ? 'http://localhost:8000' : (import.meta.env.VITE_API_URL || 'http://localhost:8000')
      const response = await fetch(`${apiUrl}/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ role: newRole })
      })

      if (response.ok) {
        setSuccess('تم تحديث دور المستخدم بنجاح')
        loadData()
      } else {
        const errorData = await response.json()
        setError(errorData.detail || 'فشل في تحديث دور المستخدم')
      }
    } catch (err) {
      setError('فشل في تحديث دور المستخدم')
    } finally {
      setLoading(false)
    }
  }

  const updateSiteSettings = async () => {
    setLoading(true)
    try {
      const apiUrl = window.location.hostname === 'localhost' ? 'http://localhost:8000' : (import.meta.env.VITE_API_URL || 'http://localhost:8000')
      const response = await fetch(`${apiUrl}/admin/settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(siteSettings)
      })

      if (response.ok) {
        setSuccess('تم تحديث إعدادات الموقع بنجاح')
      } else {
        const errorData = await response.json()
        setError(errorData.detail || 'فشل في تحديث الإعدادات')
      }
    } catch (err) {
      setError('فشل في تحديث الإعدادات')
    } finally {
      setLoading(false)
    }
  }

  const respondToAppeal = async (appealId: string, response: string, approved: boolean) => {
    setLoading(true)
    try {
      const apiUrl = window.location.hostname === 'localhost' ? 'http://localhost:8000' : (import.meta.env.VITE_API_URL || 'http://localhost:8000')
      console.log('AdminPanel: Responding to appeal:', appealId, 'approved:', approved)
      console.log('AdminPanel: API URL:', `${apiUrl}/admin/ban-appeals/${appealId}/respond`)
      console.log('AdminPanel: Token:', token ? 'Present' : 'Missing')
      
      const res = await fetch(`${apiUrl}/admin/ban-appeals/${appealId}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          response: response,
          approved: approved 
        })
      })

      console.log('AdminPanel: Response status:', res.status)

      if (res.ok) {
        const responseData = await res.json()
        console.log('AdminPanel: Success response:', responseData)
        setSuccess('تم الرد على طلب الاستئناف بنجاح')
        loadData()
      } else {
        const errorData = await res.json()
        console.log('AdminPanel: Error response:', errorData)
        setError(errorData.detail || 'فشل في الرد على الطلب')
      }
    } catch (err) {
      console.error('AdminPanel: Exception during appeal response:', err)
      setError('فشل في الرد على الطلب - خطأ في الاتصال')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500'
      case 'muted': return 'bg-yellow-500'
      case 'banned': return 'bg-red-500'
      case 'pending': return 'bg-blue-500'
      case 'resolved': return 'bg-green-500'
      case 'rejected': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return arabicTranslations.active
      case 'muted': return arabicTranslations.muted
      case 'banned': return arabicTranslations.banned
      case 'pending': return arabicTranslations.pending
      case 'resolved': return arabicTranslations.resolved
      case 'rejected': return arabicTranslations.rejected
      default: return status
    }
  }

  const getRoleText = (role: string) => {
    switch (role) {
      case 'admin': return arabicTranslations.admin
      case 'moderator': return arabicTranslations.moderator
      default: return arabicTranslations.user
    }
  }

  const createAdminUser = async () => {
    if (!newAdminUsername.trim() || !newAdminCode.trim()) {
      setError('يرجى ملء جميع حقول إنشاء المسؤول')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const apiUrl = window.location.hostname === 'localhost' ? 'http://localhost:8000' : (import.meta.env.VITE_API_URL || 'http://localhost:8000')
      const response = await fetch(`${apiUrl}/admin/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          username: newAdminUsername.trim(),
          admin_code: newAdminCode.trim()
        })
      })

      if (response.ok) {
        const data = await response.json()
        setSuccess(`تم إنشاء حساب المسؤول بنجاح: ${data.username} (ID: ${data.user_id})`)
        setNewAdminUsername('')
        setNewAdminCode('')
        loadData()
      } else {
        const errorData = await response.json()
        setError(errorData.detail || 'فشل في إنشاء حساب المسؤول')
      }
    } catch (err) {
      setError('فشل في إنشاء حساب المسؤول')
    } finally {
      setLoading(false)
    }
  }

  const banUser = async () => {
    if (!banUserId.trim() || !banReason.trim()) {
      setError('يرجى ملء جميع حقول الحظر')
      return
    }

    if (banUserId.length !== 10 || !banUserId.match(/^\d{10}$/)) {
      setError('معرف المستخدم يجب أن يكون مكون من 10 أرقام')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const apiUrl = window.location.hostname === 'localhost' ? 'http://localhost:8000' : (import.meta.env.VITE_API_URL || 'http://localhost:8000')
      console.log('Ban API URL:', apiUrl)
      console.log('Full ban URL:', `${apiUrl}/users/${banUserId}/ban`)
      const response = await fetch(`${apiUrl}/users/${banUserId}/ban`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          reason: banReason,
          duration_minutes: banDuration
        })
      })

      if (response.ok) {
        setSuccess('تم حظر المستخدم بنجاح')
        setBanUserId('')
        setBanReason('')
        setBanDuration(60)
        loadData()
      } else {
        const errorData = await response.json()
        setError(errorData.detail || 'فشل في حظر المستخدم')
      }
    } catch (err) {
      setError('فشل في حظر المستخدم')
    } finally {
      setLoading(false)
    }
  }

  const muteUser = async () => {
    if (!muteUserId.trim()) {
      setError('يرجى إدخال معرف المستخدم')
      return
    }

    if (muteUserId.length !== 10 || !muteUserId.match(/^\d{10}$/)) {
      setError('معرف المستخدم يجب أن يكون مكون من 10 أرقام')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const apiUrl = window.location.hostname === 'localhost' ? 'http://localhost:8000' : (import.meta.env.VITE_API_URL || 'http://localhost:8000')
      const response = await fetch(`${apiUrl}/users/${muteUserId}/mute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          duration_minutes: muteDuration
        })
      })

      if (response.ok) {
        setSuccess('تم كتم المستخدم بنجاح')
        setMuteUserId('')
        setMuteDuration(30)
        loadData()
      } else {
        const errorData = await response.json()
        setError(errorData.detail || 'فشل في كتم المستخدم')
      }
    } catch (err) {
      setError('فشل في كتم المستخدم')
    } finally {
      setLoading(false)
    }
  }

  const unbanUser = async () => {
    if (!unbanUserId.trim()) {
      setError('يرجى إدخال معرف المستخدم')
      return
    }

    if (unbanUserId.length !== 10 || !unbanUserId.match(/^\d{10}$/)) {
      setError('معرف المستخدم يجب أن يكون مكون من 10 أرقام')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const apiUrl = window.location.hostname === 'localhost' ? 'http://localhost:8000' : (import.meta.env.VITE_API_URL || 'http://localhost:8000')
      const response = await fetch(`${apiUrl}/users/${unbanUserId}/unban`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        setSuccess('تم فك الحظر عن المستخدم بنجاح')
        setUnbanUserId('')
        loadData()
      } else {
        const errorData = await response.json()
        setError(errorData.detail || 'فشل في فك الحظر عن المستخدم')
      }
    } catch (err) {
      setError('فشل في فك الحظر عن المستخدم')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="analytics" className="w-full">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="analytics">
            <BarChart3 className="w-4 h-4 ml-2" />
            {arabicTranslations.analytics}
          </TabsTrigger>
          <TabsTrigger value="announcements">
            <MessageSquare className="w-4 h-4 ml-2" />
            {arabicTranslations.announcements}
          </TabsTrigger>
          <TabsTrigger value="users">
            <Users className="w-4 h-4 ml-2" />
            {arabicTranslations.users}
          </TabsTrigger>
          <TabsTrigger value="reports">
            <AlertTriangle className="w-4 h-4 ml-2" />
            {arabicTranslations.reports}
          </TabsTrigger>
          <TabsTrigger value="appeals">
            <Trash2 className="w-4 h-4 ml-2" />
            {arabicTranslations.appeals}
          </TabsTrigger>
          <TabsTrigger value="banned">
            <UserX className="w-4 h-4 ml-2" />
            المحظورون
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="w-4 h-4 ml-2" />
            {arabicTranslations.settings}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analytics">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">إجمالي المستخدمين</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.totalUsers}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">المستخدمون النشطون</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{analytics.activeUsers}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">إجمالي الرسائل</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.totalMessages}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">رسائل اليوم</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{analytics.todayMessages}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">المستخدمون المحظورون</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{analytics.bannedUsers}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">المستخدمون المكتومون</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{analytics.mutedUsers}</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="announcements">
          <Card>
            <CardHeader>
              <CardTitle>{arabicTranslations.createAnnouncement}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">{arabicTranslations.announcementTitle}</Label>
                <Input
                  id="title"
                  value={announcementTitle}
                  onChange={(e) => setAnnouncementTitle(e.target.value)}
                  placeholder="أدخل عنوان الإعلان"
                  className="arabic-input"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="content">{arabicTranslations.announcementContent}</Label>
                <Textarea
                  id="content"
                  value={announcementContent}
                  onChange={(e) => setAnnouncementContent(e.target.value)}
                  placeholder="أدخل محتوى الإعلان"
                  className="arabic-input min-h-[100px]"
                />
              </div>
              
              <Button 
                onClick={createAnnouncement}
                disabled={loading}
                className="w-full"
              >
                {loading ? arabicTranslations.creating : arabicTranslations.createAnnouncement}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>إضافة مسؤول جديد</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newAdminUsername">اسم المستخدم</Label>
                  <Input
                    id="newAdminUsername"
                    value={newAdminUsername}
                    onChange={(e) => setNewAdminUsername(e.target.value)}
                    placeholder="أدخل اسم المستخدم للمسؤول الجديد"
                    className="arabic-input"
                    dir="rtl"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="newAdminCode">كود الدخول</Label>
                  <Input
                    id="newAdminCode"
                    value={newAdminCode}
                    onChange={(e) => setNewAdminCode(e.target.value)}
                    placeholder="أدخل كود الدخول للمسؤول الجديد"
                    className="arabic-input"
                    dir="rtl"
                  />
                </div>
                
                <Button 
                  onClick={createAdminUser}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? 'جاري الإنشاء...' : 'إنشاء مسؤول جديد'}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>حظر مستخدم بالمعرف</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="banUserId">معرف المستخدم (10 أرقام)</Label>
                  <Input
                    id="banUserId"
                    value={banUserId}
                    onChange={(e) => setBanUserId(e.target.value)}
                    placeholder="أدخل معرف المستخدم المكون من 10 أرقام"
                    className="arabic-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="banReason">سبب الحظر</Label>
                  <Input
                    id="banReason"
                    value={banReason}
                    onChange={(e) => setBanReason(e.target.value)}
                    placeholder="أدخل سبب الحظر"
                    className="arabic-input"
                    dir="rtl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="banDuration">مدة الحظر (بالدقائق)</Label>
                  <Input
                    id="banDuration"
                    type="number"
                    value={banDuration}
                    onChange={(e) => setBanDuration(parseInt(e.target.value))}
                    min="1"
                    max="43200"
                  />
                </div>
                <Button onClick={banUser} disabled={loading} className="w-full">
                  {loading ? 'جاري الحظر...' : 'حظر المستخدم'}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>كتم مستخدم بالمعرف</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="muteUserId">معرف المستخدم (10 أرقام)</Label>
                  <Input
                    id="muteUserId"
                    value={muteUserId}
                    onChange={(e) => setMuteUserId(e.target.value)}
                    placeholder="أدخل معرف المستخدم المكون من 10 أرقام"
                    className="arabic-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="muteDuration">مدة الكتم (بالدقائق)</Label>
                  <Input
                    id="muteDuration"
                    type="number"
                    value={muteDuration}
                    onChange={(e) => setMuteDuration(parseInt(e.target.value))}
                    min="1"
                    max="1440"
                  />
                </div>
                <Button onClick={muteUser} disabled={loading} className="w-full">
                  {loading ? 'جاري الكتم...' : 'كتم المستخدم'}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>إدارة المستخدمين ({users.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {users.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="text-right">
                        <div className="font-semibold">{user.username}</div>
                        <div className="text-sm text-gray-500">
                          تاريخ التسجيل: {new Date(user.created_at).toLocaleDateString('ar')}
                        </div>
                      </div>
                      <div className="flex gap-2 items-center">
                        <Badge className={getStatusColor(user.status)}>
                          {getStatusText(user.status)}
                        </Badge>
                        <Badge variant="outline">
                          {getRoleText(user.role)}
                        </Badge>
                        <div className="flex gap-2 flex-wrap">
                          <Button
                            size="sm"
                            variant="outline"
                            className="min-w-[100px]"
                            onClick={() => updateUserRole(user.id, user.role === 'admin' ? 'user' : 'admin')}
                            disabled={loading}
                          >
                            {user.role === 'admin' ? 'إلغاء الإدارة' : 'جعل مدير'}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="min-w-[100px]"
                            onClick={() => updateUserRole(user.id, user.role === 'moderator' ? 'user' : 'moderator')}
                            disabled={loading}
                          >
                            {user.role === 'moderator' ? 'إلغاء الإشراف' : 'جعل مشرف'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {users.length === 0 && (
                    <div className="text-center text-gray-500 py-4">
                      لا يوجد مستخدمون
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle>البلاغات ({reports.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {reports.map((report) => (
                  <div key={report.id} className="p-3 border rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <Badge className={getStatusColor(report.status)}>
                        {getStatusText(report.status)}
                      </Badge>
                      <div className="text-sm text-gray-500">
                        {new Date(report.created_at).toLocaleDateString('ar')}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold mb-1">السبب:</div>
                      <div className="text-sm">{report.reason}</div>
                    </div>
                  </div>
                ))}
                
                {reports.length === 0 && (
                  <div className="text-center text-gray-500 py-4">
                    لا توجد بلاغات
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appeals">
          <Card>
            <CardHeader>
              <CardTitle>طلبات الاستئناف ({banAppeals.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {banAppeals.map((appeal) => (
                  <div key={appeal.id} className="p-3 border rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <Badge className={getStatusColor(appeal.status)}>
                        {getStatusText(appeal.status)}
                      </Badge>
                      <div className="text-sm text-gray-500">
                        {new Date(appeal.created_at).toLocaleDateString('ar')}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold mb-1">سبب الاستئناف:</div>
                      <div className="text-sm mb-2">{appeal.reason}</div>
                      {appeal.admin_response && (
                        <>
                          <div className="font-semibold mb-1">رد الإدارة:</div>
                          <div className="text-sm mb-2">{appeal.admin_response}</div>
                        </>
                      )}
                      {appeal.status === 'pending' && (
                        <div className="flex gap-3 mt-3 justify-end">
                          <Button
                            size="sm"
                            className="min-w-[80px]"
                            onClick={() => respondToAppeal(appeal.id, 'تم قبول طلب الاستئناف', true)}
                            disabled={loading}
                          >
                            قبول
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="min-w-[80px]"
                            onClick={() => respondToAppeal(appeal.id, 'تم رفض طلب الاستئناف', false)}
                            disabled={loading}
                          >
                            رفض
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {banAppeals.length === 0 && (
                  <div className="text-center text-gray-500 py-4">
                    لا توجد طلبات استئناف
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>إعدادات الموقع</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="maintenance">وضع الصيانة</Label>
                <input
                  id="maintenance"
                  type="checkbox"
                  checked={siteSettings.maintenanceMode}
                  onChange={(e) => setSiteSettings({...siteSettings, maintenanceMode: e.target.checked})}
                  className="rounded"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="maintenanceMsg">رسالة الصيانة</Label>
                <Textarea
                  id="maintenanceMsg"
                  value={siteSettings.maintenanceMessage}
                  onChange={(e) => setSiteSettings({...siteSettings, maintenanceMessage: e.target.value})}
                  placeholder="أدخل رسالة الصيانة"
                  className="arabic-input"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="profanity">مرشح الكلمات البذيئة</Label>
                <input
                  id="profanity"
                  type="checkbox"
                  checked={siteSettings.profanityFilter}
                  onChange={(e) => setSiteSettings({...siteSettings, profanityFilter: e.target.checked})}
                  className="rounded"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="maxLength">الحد الأقصى لطول الرسالة</Label>
                <Input
                  id="maxLength"
                  type="number"
                  value={siteSettings.maxMessageLength}
                  onChange={(e) => setSiteSettings({...siteSettings, maxMessageLength: parseInt(e.target.value)})}
                  min="50"
                  max="2000"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="guests">السماح للضيوف</Label>
                <input
                  id="guests"
                  type="checkbox"
                  checked={siteSettings.allowGuestUsers}
                  onChange={(e) => setSiteSettings({...siteSettings, allowGuestUsers: e.target.checked})}
                  className="rounded"
                />
              </div>
              
              <Button 
                onClick={updateSiteSettings}
                disabled={loading}
                className="w-full"
              >
                {loading ? arabicTranslations.loading : arabicTranslations.save}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="banned">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>فك الحظر عن مستخدم</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="unbanUserId">معرف المستخدم (10 أرقام)</Label>
                  <Input
                    id="unbanUserId"
                    type="text"
                    value={unbanUserId}
                    onChange={(e) => setUnbanUserId(e.target.value)}
                    placeholder="أدخل معرف المستخدم المحظور"
                    className="text-right"
                    dir="rtl"
                    maxLength={10}
                  />
                </div>
                <Button 
                  onClick={unbanUser}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? 'جاري فك الحظر...' : 'فك الحظر'}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>قائمة المستخدمين المحظورين</CardTitle>
              </CardHeader>
              <CardContent>
                {bannedUsers.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    لا يوجد مستخدمون محظورون حالياً
                  </div>
                ) : (
                  <div className="space-y-4">
                    {bannedUsers.map((user) => (
                      <div key={user.user_id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex justify-between items-start">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2">
                              <Badge variant="destructive">محظور</Badge>
                              <span className="font-medium">{user.username}</span>
                            </div>
                            <div className="text-sm text-gray-600">
                              <div>معرف المستخدم: <span className="font-mono">{user.user_id}</span></div>
                              <div>سبب الحظر: <span className="text-red-600">{user.ban_reason || 'غير محدد'}</span></div>
                              <div>مدة الحظر: <span className="text-orange-600">{user.ban_duration_minutes || 'غير محدد'} دقيقة</span></div>
                              {user.ban_until && (
                                <div>ينتهي الحظر: <span className="text-blue-600">{new Date(user.ban_until).toLocaleString('ar-SA')}</span></div>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setUnbanUserId(user.user_id)
                              unbanUser()
                            }}
                            disabled={loading}
                            className="text-green-600 hover:text-green-700"
                          >
                            فك الحظر
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
