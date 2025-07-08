import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Textarea } from './ui/textarea'
import { Label } from './ui/label'
import { useAuth } from '../contexts/AuthContext'
import { 
  Users, 
  MessageSquare, 
  Flag, 
  Shield, 
  LogOut, 
  Ban, 
  Volume2, 
  Megaphone,
  ArrowRight,
  UserPlus,
  Award,
  Settings,
  Upload,
} from 'lucide-react'

interface AdminPanelProps {
  onBackToChat?: () => void
}

const API_URL = import.meta.env?.VITE_API_URL || 'http://localhost:8000'

interface Statistics {
  total_users: number
  online_users: number
  total_messages: number
  pending_reports: number
  pending_appeals: number
  active_bans: number
}

interface UserInfo {
  user_id: string
  username: string
  role: string
  status: string
  last_seen: string
  is_online: boolean
}

interface Report {
  report_id: string
  reporter_id: string
  reported_message_id: string
  reported_user_id: string
  category: string
  reason: string
  status: string
  created_at: string
}

interface Appeal {
  appeal_id: string
  user_id: string
  ban_id: string
  reason: string
  status: string
  created_at: string
  admin_response?: string
}

interface Announcement {
  announcement_id: string
  title: string
  content: string
  created_by: string
  created_at: string
  is_active: boolean
}

export default function AdminPanel({ onBackToChat }: AdminPanelProps) {
  const { user, token, logout } = useAuth()
  const [activeTab, setActiveTab] = useState('statistics')
  const [statistics, setStatistics] = useState<Statistics | null>(null)
  const [users, setUsers] = useState<UserInfo[]>([])
  const [reports, setReports] = useState<Report[]>([])
  const [appeals, setAppeals] = useState<Appeal[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [, setLoading] = useState(false)
  
  const [showBanDialog, setShowBanDialog] = useState(false)
  const [showMuteDialog, setShowMuteDialog] = useState(false)
  const [showAppealDialog, setShowAppealDialog] = useState(false)
  const [showAnnouncementDialog, setShowAnnouncementDialog] = useState(false)
  const [showReportDialog, setShowReportDialog] = useState(false)
  
  const [selectedUser, setSelectedUser] = useState<UserInfo | null>(null)
  const [selectedAppeal, setSelectedAppeal] = useState<Appeal | null>(null)
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [banReason, setBanReason] = useState('')
  const [banDuration, setBanDuration] = useState('')
  const [muteDuration, setMuteDuration] = useState('30')
  const [muteReason, setMuteReason] = useState('')
  const [appealResponse, setAppealResponse] = useState('')
  const [appealAction, setAppealAction] = useState('')
  const [reportResponse, setReportResponse] = useState('')
  const [reportAction, setReportAction] = useState('resolved')
  const [announcementTitle, setAnnouncementTitle] = useState('')
  const [announcementContent, setAnnouncementContent] = useState('')
  const [announcementDuration, setAnnouncementDuration] = useState('')
  const [announcementColor, setAnnouncementColor] = useState('#000000')
  const [showBadgeDialog, setShowBadgeDialog] = useState(false)
  const [selectedUserForBadge, setSelectedUserForBadge] = useState<any>(null)
  const [badgeImage, setBadgeImage] = useState<File | null>(null)
  const [showMaintenanceDialog, setShowMaintenanceDialog] = useState(false)
  const [maintenanceMode, setMaintenanceMode] = useState(false)
  const [maintenanceReason, setMaintenanceReason] = useState('')
  const [showChangeIdDialog, setShowChangeIdDialog] = useState(false)
  const [selectedUserForId, setSelectedUserForId] = useState<UserInfo | null>(null)
  const [newUserId, setNewUserId] = useState('')
  const [showModeratorBanDialog, setShowModeratorBanDialog] = useState(false)
  const [moderatorBanDuration, setModeratorBanDuration] = useState('60')
  const [moderatorBanReason, setModeratorBanReason] = useState('')

  useEffect(() => {
    fetchData()
  }, [activeTab])

  const fetchData = async () => {
    setLoading(true)
    try {
      switch (activeTab) {
        case 'statistics':
          await fetchStatistics()
          break
        case 'users':
          await fetchUsers()
          break
        case 'reports':
          await fetchReports()
          break
        case 'appeals':
          await fetchAppeals()
          break
        case 'announcements':
          await fetchAnnouncements()
          break
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStatistics = async () => {
    const response = await fetch(`${API_URL}/admin/statistics`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    if (response.ok) {
      const data = await response.json()
      setStatistics(data)
    }
  }

  const fetchUsers = async () => {
    try {
      console.log('Fetching users with token:', token ? 'Token exists' : 'No token')
      const response = await fetch(`${API_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      console.log('Users response status:', response.status)
      if (response.ok) {
        const data = await response.json()
        console.log('Users data received:', data)
        setUsers(data || [])
      } else {
        console.error('Failed to fetch users:', response.status, response.statusText)
        const errorData = await response.json().catch(() => ({}))
        console.error('Error details:', errorData)
        setUsers([])
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      setUsers([])
    }
  }

  const fetchReports = async () => {
    try {
      console.log('Fetching reports with token:', token ? 'Token exists' : 'No token')
      const response = await fetch(`${API_URL}/admin/reports`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      console.log('Reports response status:', response.status)
      if (response.ok) {
        const data = await response.json()
        console.log('Reports data received:', data)
        setReports(data || [])
      } else {
        console.error('Failed to fetch reports:', response.status, response.statusText)
        const errorData = await response.json().catch(() => ({}))
        console.error('Error details:', errorData)
        setReports([])
      }
    } catch (error) {
      console.error('Error fetching reports:', error)
      setReports([])
    }
  }

  const fetchAppeals = async () => {
    const response = await fetch(`${API_URL}/admin/appeals`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    if (response.ok) {
      const data = await response.json()
      setAppeals(data)
    }
  }

  const fetchAnnouncements = async () => {
    const response = await fetch(`${API_URL}/admin/announcements`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    if (response.ok) {
      const data = await response.json()
      setAnnouncements(data)
    }
  }

  const handleBanUser = async () => {
    if (!selectedUser || !banReason.trim()) return

    try {
      console.log('Attempting to ban user:', selectedUser.user_id, 'Reason:', banReason)
      const response = await fetch(`${API_URL}/admin/users/ban`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          user_id: selectedUser?.user_id,
          reason: banReason.trim(),
          duration_hours: banDuration ? parseInt(banDuration) : null
        })
      })

      console.log('Ban response status:', response.status)
      const responseData = await response.json()
      console.log('Ban response data:', responseData)

      if (response.ok) {
        alert('تم حظر المستخدم بنجاح')
        setShowBanDialog(false)
        setBanReason('')
        setBanDuration('')
        fetchUsers()
      } else {
        alert(responseData.detail || 'فشل في حظر المستخدم')
      }
    } catch (error) {
      console.error('Ban error:', error)
      alert('حدث خطأ في حظر المستخدم')
    }
  }

  const handleMuteUser = async () => {
    console.log('handleMuteUser called with:', { selectedUser: selectedUser?.username, muteReason, muteDuration })
    if (!selectedUser || !muteReason.trim()) {
      console.log('handleMuteUser validation failed:', { selectedUser: !!selectedUser, muteReason: muteReason.trim() })
      return
    }
    
    try {
      const response = await fetch(`${API_URL}/admin/users/mute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          user_id: String(selectedUser?.user_id),
          duration_minutes: parseInt(muteDuration),
          reason: muteReason
        })
      })
      
      if (response.ok) {
        const result = await response.json()
        console.log('Mute response:', result)
        const message = typeof result === 'string' ? result : (result?.message || result?.detail || 'تم كتم المستخدم بنجاح')
        alert(message)
        setShowMuteDialog(false)
        setMuteDuration('30')
        setMuteReason('')
        fetchUsers()
      } else {
        const error = await response.json().catch(() => ({ detail: 'فشل في كتم المستخدم' }))
        console.error('Mute error:', error)
        alert(error.detail || error.message || 'فشل في كتم المستخدم')
      }
    } catch (error) {
      console.error('Error muting user:', error)
      alert('حدث خطأ في كتم المستخدم')
    }
  }
  
  const handleReportResponse = async () => {
    if (!selectedReport || !reportResponse.trim()) return
    
    try {
      const response = await fetch(`${API_URL}/admin/reports/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          report_id: selectedReport.report_id,
          action: reportAction,
          response: reportResponse.trim()
        })
      })
      
      if (response.ok) {
        const result = await response.json()
        alert(result.message || 'تم الرد على البلاغ بنجاح')
        setShowReportDialog(false)
        setReportResponse('')
        setReportAction('resolve')
        fetchReports()
      } else {
        const error = await response.json()
        alert(error.detail || 'فشل في الرد على البلاغ')
      }
    } catch (error) {
      console.error('Error responding to report:', error)
      alert('حدث خطأ في الرد على البلاغ')
    }
  }
  
  const handleChangeUserId = async () => {
    if (!selectedUserForId || !newUserId.trim()) return
    
    if (!/^\d{10}$/.test(newUserId.trim())) {
      alert('المعرف الجديد يجب أن يكون 10 أرقام فقط')
      return
    }
    
    try {
      const response = await fetch(`${API_URL}/admin/users/change-id`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          old_user_id: selectedUserForId.user_id,
          new_user_id: newUserId.trim()
        })
      })
      
      if (response.ok) {
        const result = await response.json()
        alert(result.message || 'تم تغيير معرف المستخدم بنجاح')
        setShowChangeIdDialog(false)
        setNewUserId('')
        setSelectedUserForId(null)
        fetchUsers()
      } else {
        const error = await response.json()
        alert(error.detail || 'فشل في تغيير المعرف')
      }
    } catch (error) {
      console.error('Error changing user ID:', error)
      alert('حدث خطأ في تغيير معرف المستخدم')
    }
  }

  const handleUnbanUser = async (userId: string) => {
    try {
      const response = await fetch(`${API_URL}/admin/users/unban`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ user_id: userId })
      })

      if (response.ok) {
        alert('تم إلغاء حظر المستخدم بنجاح')
        fetchUsers()
      } else {
        const error = await response.json()
        alert(error.detail || 'فشل في إلغاء الحظر')
      }
    } catch (error) {
      alert('حدث خطأ في إلغاء الحظر')
    }
  }

  const handleAppealResponse = async () => {
    if (!selectedAppeal || !appealAction || !appealResponse.trim()) return

    try {
      const response = await fetch(`${API_URL}/admin/appeals/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          appeal_id: selectedAppeal.appeal_id,
          action: appealAction,
          response: appealResponse.trim()
        })
      })

      if (response.ok) {
        alert('تم الرد على الاعتراض بنجاح')
        setShowAppealDialog(false)
        setAppealResponse('')
        setAppealAction('')
        fetchAppeals()
      } else {
        const error = await response.json()
        alert(error.detail || 'فشل في الرد على الاعتراض')
      }
    } catch (error) {
      alert('حدث خطأ في الرد على الاعتراض')
    }
  }

  const handleCreateAnnouncement = async () => {
    if (!announcementTitle.trim() || !announcementContent.trim()) return

    try {
      const response = await fetch(`${API_URL}/admin/announcements`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: announcementTitle.trim(),
          content: announcementContent.trim(),
          duration_hours: announcementDuration ? parseInt(announcementDuration) : null,
          font_color: announcementColor
        })
      })

      if (response.ok) {
        alert('تم إنشاء الإعلان بنجاح')
        setShowAnnouncementDialog(false)
        setAnnouncementTitle('')
        setAnnouncementContent('')
        setAnnouncementDuration('')
        setAnnouncementColor('#000000')
        fetchAnnouncements()
      } else {
        const error = await response.json()
        alert(error.detail || 'فشل في إنشاء الإعلان')
      }
    } catch (error) {
      alert('حدث خطأ في إنشاء الإعلان')
    }
  }

  const handleDeleteAnnouncement = async (announcementId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الإعلان؟')) return

    try {
      const response = await fetch(`${API_URL}/admin/announcements/${announcementId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (response.ok) {
        alert('تم حذف الإعلان بنجاح')
        fetchAnnouncements()
      } else {
        const error = await response.json()
        alert(error.detail || 'فشل في حذف الإعلان')
      }
    } catch (error) {
      alert('حدث خطأ في حذف الإعلان')
    }
  }

  const handleAssignBadge = async () => {
    if (!selectedUserForBadge || !badgeImage) return

    try {
      const formData = new FormData()
      formData.append('user_id', selectedUserForBadge.user_id)
      formData.append('badge_image', badgeImage)

      const response = await fetch(`${API_URL}/admin/users/badge`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      })

      if (response.ok) {
        alert('تم تعيين الشارة بنجاح')
        setShowBadgeDialog(false)
        setBadgeImage(null)
        setSelectedUserForBadge(null)
        fetchUsers()
      } else {
        const error = await response.json()
        alert(error.detail || 'فشل في تعيين الشارة')
      }
    } catch (error) {
      alert('حدث خطأ في تعيين الشارة')
    }
  }

  const handleToggleMaintenanceMode = async () => {
    try {
      const response = await fetch(`${API_URL}/admin/maintenance/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          is_maintenance: !maintenanceMode,
          reason: maintenanceReason.trim() || 'صيانة النظام'
        })
      })

      if (response.ok) {
        setMaintenanceMode(!maintenanceMode)
        alert(`تم ${!maintenanceMode ? 'تفعيل' : 'إلغاء'} وضع الصيانة بنجاح`)
        setShowMaintenanceDialog(false)
        setMaintenanceReason('')
      } else {
        const error = await response.json()
        alert(error.detail || 'فشل في تحديث وضع الصيانة')
      }
    } catch (error) {
      alert('حدث خطأ في تحديث وضع الصيانة')
    }
  }

  const handlePromoteToModerator = async (user: any) => {
    try {
      const response = await fetch(`${API_URL}/admin/users/promote-moderator`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          user_id: user.user_id
        })
      })
      
      if (response.ok) {
        const result = await response.json()
        alert(result.message || 'تم ترقية المستخدم إلى مشرف بنجاح')
        fetchUsers()
      } else {
        const error = await response.json()
        alert(error.detail || 'فشل في ترقية المستخدم')
      }
    } catch (error) {
      console.error('Error promoting user to moderator:', error)
      alert('حدث خطأ في ترقية المستخدم')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'banned': return 'bg-red-100 text-red-800'
      case 'muted': return 'bg-yellow-100 text-yellow-800'
      case 'pending': return 'bg-orange-100 text-orange-800'
      case 'approved': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'نشط'
      case 'banned': return 'محظور'
      case 'muted': return 'مكتوم'
      case 'pending': return 'قيد المراجعة'
      case 'approved': return 'مقبول'
      case 'rejected': return 'مرفوض'
      default: return status
    }
  }

  const getCategoryText = (category: string) => {
    switch (category) {
      case 'offensive_message': return 'رسالة مسيئة'
      case 'inappropriate_phrases': return 'عبارات غير لائقة'
      case 'religion_politics': return 'دين/سياسة'
      default: return category
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleModeratorBan = async (userId: string, durationMinutes: number, reason: string) => {
    try {
      const response = await fetch(`${API_URL}/moderator/users/ban`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          user_id: userId,
          duration_minutes: durationMinutes,
          reason: reason
        })
      })
      
      if (response.ok) {
        const result = await response.json()
        alert(result.message || 'تم حظر المستخدم بنجاح')
        fetchUsers()
      } else {
        const error = await response.json()
        alert(error.detail || 'فشل في حظر المستخدم')
      }
    } catch (error) {
      console.error('Error banning user:', error)
      alert('حدث خطأ في حظر المستخدم')
    }
  }


  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4 space-x-reverse">
          <Shield className="h-6 w-6 text-red-600" />
          <div>
            <h1 className="text-xl font-bold">لوحة الإدارة المتطورة</h1>
            <p className="text-sm text-gray-500">مرحباً {user?.username} - المدير العام</p>
          </div>
        </div>
        <div className="flex items-center space-x-2 space-x-reverse">
          {onBackToChat && (
            <Button variant="outline" size="sm" onClick={onBackToChat}>
              <ArrowRight className="h-4 w-4 ml-2" />
              العودة للدردشة
            </Button>
          )}
          <div className="flex items-center space-x-2 space-x-reverse">
            {onBackToChat && (
              <Button variant="outline" size="sm" onClick={onBackToChat}>
                <ArrowRight className="h-4 w-4 ml-2" />
                العودة للدردشة
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={logout}>
              <LogOut className="h-4 w-4 ml-2" />
              خروج
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="statistics">الإحصائيات</TabsTrigger>
            <TabsTrigger value="announcements">الإعلانات</TabsTrigger>
            <TabsTrigger value="users">المستخدمون</TabsTrigger>
            <TabsTrigger value="reports">البلاغات</TabsTrigger>
            <TabsTrigger value="appeals">الاعتراضات</TabsTrigger>
          </TabsList>

          <TabsContent value="statistics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">إجمالي المستخدمين</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{statistics?.total_users || 0}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">المتصلون الآن</CardTitle>
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{statistics?.online_users || 0}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">إجمالي الرسائل</CardTitle>
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{statistics?.total_messages || 0}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">البلاغات المعلقة</CardTitle>
                  <Flag className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{statistics?.pending_reports || 0}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">الاعتراضات المعلقة</CardTitle>
                  <Shield className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{statistics?.pending_appeals || 0}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">الحظر النشط</CardTitle>
                  <Ban className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{statistics?.active_bans || 0}</div>
                </CardContent>
          <Button onClick={() => setShowAnnouncementDialog(true)}>
            <Megaphone className="h-4 w-4 ml-2" />
            إضافة إعلان
          </Button>
          <Button 
            onClick={() => setShowMaintenanceDialog(true)}
            variant={maintenanceMode ? "destructive" : "outline"}
          >
            <Settings className="h-4 w-4 ml-2" />
            {maintenanceMode ? 'إلغاء الصيانة' : 'وضع الصيانة'}
          </Button>

              </Card>
            </div>
          </TabsContent>

          <TabsContent value="announcements" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">إدارة الإعلانات</h2>
              <Button onClick={() => setShowAnnouncementDialog(true)}>
                <Megaphone className="h-4 w-4 ml-2" />
                إعلان جديد
              </Button>
            </div>

            <div className="grid gap-4">
              {announcements.map((announcement) => (
                <Card key={announcement.announcement_id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{announcement.title}</CardTitle>
                        <CardDescription>
                          تم الإنشاء في {formatDate(announcement.created_at)}
                        </CardDescription>
                      </div>
                      <Badge className={announcement.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                        {announcement.is_active ? 'نشط' : 'غير نشط'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700">{announcement.content}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">إدارة المستخدمين</h2>
            </div>

            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">المعرف</TableHead>
                    <TableHead className="text-right">اسم المستخدم</TableHead>
                    <TableHead className="text-right">الدور</TableHead>
                    <TableHead className="text-right">الحالة</TableHead>
                    <TableHead className="text-right">آخر ظهور</TableHead>
                    <TableHead className="text-right">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((userInfo) => (
                    <TableRow key={userInfo.user_id}>
                      <TableCell className="font-mono">{userInfo.user_id}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <span>{userInfo.username}</span>
                          {userInfo.is_online && (
                            <div className="w-2 h-2 bg-green-500 rounded-full" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={userInfo.role === 'admin' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}>
                          {userInfo.role === 'admin' ? 'مدير' : 'عضو'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(userInfo.status)}>
                          {getStatusText(userInfo.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {formatDate(userInfo.last_seen)}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2 space-x-reverse">
                          {userInfo.status === 'banned' ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUnbanUser(userInfo.user_id)}
                            >
                              إلغاء الحظر
                            </Button>
                          ) : (
                            <>
                              {user?.role === 'admin' && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setSelectedUser(userInfo)
                                      setShowBanDialog(true)
                                      console.log('Ban button clicked for:', userInfo.username)
                                    }}
                                  >
                                    <Ban className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setSelectedUser(userInfo)
                                      setShowMuteDialog(true)
                                      console.log('Mute button clicked for:', userInfo.username)
                                    }}
                                  >
                                    <Volume2 className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setSelectedUserForId(userInfo)
                                      setShowChangeIdDialog(true)
                                      console.log('Change ID button clicked for:', userInfo.username)
                                    }}
                                  >
                                    تغيير المعرف
                                  </Button>
                                  {userInfo.role === 'user' && (
                                    <>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                          setSelectedUserForBadge(userInfo)
                                          setShowBadgeDialog(true)
                                        }}
                                      >
                                        <Award className="h-4 w-4 ml-1" />
                                        إضافة شارة
                                      </Button>
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => handlePromoteToModerator(userInfo)}
                                      >
                                        <UserPlus className="h-3 w-3 ml-1" />
                                        ترقية لمشرف
                                      </Button>
                                    </>
                                  )}
                                </>
                              )}
                              {user?.role === 'moderator' && userInfo.role === 'user' && (
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => {
                                    setSelectedUser(userInfo)
                                    setShowModeratorBanDialog(true)
                                  }}
                                >
                                  حظر مؤقت
                                </Button>
                              )}
                              {userInfo.role === 'moderator' && (
                                <Badge variant="secondary" className="text-xs">
                                  مشرف
                                </Badge>
                              )}
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">إدارة البلاغات</h2>
            </div>

            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">المبلغ</TableHead>
                    <TableHead className="text-right">المستخدم المبلغ عنه</TableHead>
                    <TableHead className="text-right">الفئة</TableHead>
                    <TableHead className="text-right">السبب</TableHead>
                    <TableHead className="text-right">الحالة</TableHead>
                    <TableHead className="text-right">التاريخ</TableHead>
                    <TableHead className="text-right">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((report) => (
                    <TableRow key={report.report_id}>
                      <TableCell className="font-mono">{report.reporter_id}</TableCell>
                      <TableCell className="font-mono">{report.reported_user_id}</TableCell>
                      <TableCell>
                        <Badge className="bg-blue-100 text-blue-800">
                          {getCategoryText(report.category)}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{report.reason}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(report.status)}>
                          {getStatusText(report.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {formatDate(report.created_at)}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2 space-x-reverse">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedReport(report)
                              setReportResponse('')
                              setReportAction('resolved')
                              setShowReportDialog(true)
                            }}
                          >
                            مراجعة
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="appeals" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">إدارة الاعتراضات</h2>
            </div>

            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">المستخدم</TableHead>
                    <TableHead className="text-right">سبب الاعتراض</TableHead>
                    <TableHead className="text-right">الحالة</TableHead>
                    <TableHead className="text-right">التاريخ</TableHead>
                    <TableHead className="text-right">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {appeals.map((appeal) => (
                    <TableRow key={appeal.appeal_id}>
                      <TableCell className="font-mono">{appeal.user_id}</TableCell>
                      <TableCell className="max-w-xs truncate">{appeal.reason}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(appeal.status)}>
                          {getStatusText(appeal.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {formatDate(appeal.created_at)}
                      </TableCell>
                      <TableCell>
                        {appeal.status === 'pending' && (
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedAppeal(appeal)
                              setShowAppealDialog(true)
                            }}
                          >
                            مراجعة
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={showBanDialog} onOpenChange={setShowBanDialog}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>حظر المستخدم</DialogTitle>
            <DialogDescription>
              حظر المستخدم {selectedUser?.username} ({selectedUser?.user_id})
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">سبب الحظر</label>
              <Textarea
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                placeholder="اكتب سبب الحظر..."
                className="text-right"
                dir="rtl"
                rows={3}
              />
            </div>

            <div>
              <label className="text-sm font-medium">مدة الحظر (بالساعات)</label>
              <Input
                type="number"
                value={banDuration}
                onChange={(e) => setBanDuration(e.target.value)}
                placeholder="اتركه فارغاً للحظر الدائم"
                className="text-right"
                dir="rtl"
              />
            </div>
          </div>

          <DialogFooter className="flex-row-reverse">
            <Button onClick={handleBanUser} disabled={!banReason.trim()} variant="destructive">
              حظر المستخدم
            </Button>
            <Button variant="outline" onClick={() => setShowBanDialog(false)}>
              إلغاء
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showMuteDialog} onOpenChange={setShowMuteDialog}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>كتم المستخدم</DialogTitle>
            <DialogDescription>
              كتم المستخدم {selectedUser?.username} ({selectedUser?.user_id})
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">مدة الكتم (بالدقائق)</label>
              <Select value={muteDuration} onValueChange={setMuteDuration}>
                <SelectTrigger className="text-right" dir="rtl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 دقيقة</SelectItem>
                  <SelectItem value="60">ساعة واحدة</SelectItem>
                  <SelectItem value="180">3 ساعات</SelectItem>
                  <SelectItem value="360">6 ساعات</SelectItem>
                  <SelectItem value="720">12 ساعة</SelectItem>
                  <SelectItem value="1440">24 ساعة</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium">سبب الكتم</label>
              <Textarea
                value={muteReason}
                onChange={(e) => setMuteReason(e.target.value)}
                placeholder="اكتب سبب الكتم..."
                className="text-right"
                dir="rtl"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="flex-row-reverse">
            <Button onClick={handleMuteUser} variant="outline" disabled={!muteReason.trim()}>
              كتم المستخدم
            </Button>
            <Button variant="outline" onClick={() => setShowMuteDialog(false)}>
              إلغاء
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showAppealDialog} onOpenChange={setShowAppealDialog}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>مراجعة الاعتراض</DialogTitle>
            <DialogDescription>
              اعتراض من المستخدم {selectedAppeal?.user_id}
            </DialogDescription>
          </DialogHeader>
          
          {selectedAppeal && (
            <div className="bg-gray-50 p-3 rounded border-r-4 border-blue-500 mb-4">
              <div className="text-sm font-medium">سبب الاعتراض:</div>
              <div className="text-sm text-gray-700 mt-1">{selectedAppeal.reason}</div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">الإجراء</label>
              <Select value={appealAction} onValueChange={setAppealAction}>
                <SelectTrigger className="text-right" dir="rtl">
                  <SelectValue placeholder="اختر الإجراء" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="approve">قبول الاعتراض</SelectItem>
                  <SelectItem value="reject">رفض الاعتراض</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">رد الإدارة</label>
              <Textarea
                value={appealResponse}
                onChange={(e) => setAppealResponse(e.target.value)}
                placeholder="اكتب رد الإدارة..."
                className="text-right"
                dir="rtl"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="flex-row-reverse">
            <Button onClick={handleAppealResponse} disabled={!appealAction || !appealResponse.trim()}>
              إرسال الرد
            </Button>
            <Button variant="outline" onClick={() => setShowAppealDialog(false)}>
              إلغاء
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showAnnouncementDialog} onOpenChange={setShowAnnouncementDialog}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>إنشاء إعلان جديد</DialogTitle>
            <DialogDescription>
              إنشاء إعلان جديد سيظهر لجميع المستخدمين
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">عنوان الإعلان</label>
              <Input
                value={announcementTitle}
                onChange={(e) => setAnnouncementTitle(e.target.value)}
                placeholder="أدخل عنوان الإعلان"
                className="text-right"
                dir="rtl"
              />
            </div>

            <div>
              <label className="text-sm font-medium">محتوى الإعلان</label>
              <Textarea
                value={announcementContent}
                onChange={(e) => setAnnouncementContent(e.target.value)}
                placeholder="اكتب محتوى الإعلان..."
                className="text-right"
                dir="rtl"
                rows={4}
              />
            </div>

            <div>
              <label className="text-sm font-medium">مدة الإعلان (بالساعات)</label>
              <Input
                type="number"
                value={announcementDuration}
                onChange={(e) => setAnnouncementDuration(e.target.value)}
                placeholder="اتركه فارغاً للإعلان الدائم"
                className="text-right"
                dir="rtl"
              />
            </div>

            <div>
              <label className="text-sm font-medium">لون الخط</label>
              <Input
                type="color"
                value={announcementColor}
                onChange={(e) => setAnnouncementColor(e.target.value)}
                className="h-10"
              />
            </div>

            <div>
              <label className="text-sm font-medium">مدة الإعلان (بالساعات)</label>
              <Input
                type="number"
                value={announcementDuration}
                onChange={(e) => setAnnouncementDuration(e.target.value)}
                placeholder="اتركه فارغاً للإعلان الدائم"
                className="text-right"
                dir="rtl"
              />
            </div>

            <div>
              <label className="text-sm font-medium">لون الخط</label>
              <Input
                type="color"
                value={announcementColor}
                onChange={(e) => setAnnouncementColor(e.target.value)}
                className="h-10"
              />
            </div>
          </div>

          <DialogFooter className="flex-row-reverse">
            <Button onClick={handleCreateAnnouncement} disabled={!announcementTitle.trim() || !announcementContent.trim()}>
              إنشاء الإعلان
            </Button>
            <Button variant="outline" onClick={() => setShowAnnouncementDialog(false)}>
              إلغاء
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showChangeIdDialog} onOpenChange={setShowChangeIdDialog}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>تغيير معرف المستخدم</DialogTitle>
            <DialogDescription>
              تغيير معرف المستخدم: {selectedUserForId?.username}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>المعرف الحالي</Label>
              <Input value={selectedUserForId?.user_id || ''} disabled className="text-right" dir="rtl" />
            </div>
            <div>
              <Label>المعرف الجديد</Label>
              <Input
                value={newUserId}
                onChange={(e) => setNewUserId(e.target.value.replace(/\D/g, ''))}
                placeholder="أدخل المعرف الجديد (10 أرقام)"
                maxLength={10}
                className="text-right"
                dir="rtl"
              />
              <p className="text-xs text-gray-500 mt-1">يجب أن يكون المعرف 10 أرقام فقط</p>
            </div>
          </div>
          <DialogFooter className="flex-row-reverse">
            <Button onClick={handleChangeUserId} disabled={!newUserId.trim() || newUserId.length !== 10}>
              تغيير المعرف
            </Button>
            <Button variant="outline" onClick={() => {
              setShowChangeIdDialog(false)
              setNewUserId('')
              setSelectedUserForId(null)
            }}>
              إلغاء
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Promote to Moderator Dialog removed - using direct promotion */}

      {/* Report Response Dialog */}
      {showReportDialog && selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96 rtl">
            <h3 className="text-xl font-bold mb-4">الرد على البلاغ</h3>
            <p className="mb-4">
              المستخدم المبلغ: {selectedReport.reporter_id}<br />
              نوع البلاغ: {getCategoryText(selectedReport.category)}<br />
              سبب البلاغ: {selectedReport.reason}
            </p>
            <div className="mb-4">
              <label className="block mb-2">إجراء:</label>
              <select
                value={reportAction}
                onChange={(e) => setReportAction(e.target.value)}
                className="w-full p-2 border rounded"
              >
                <option value="resolved">تم التعامل مع البلاغ بنجاح</option>
                <option value="reviewed">لم يتم العثور على انتهاكات</option>
              </select>
            </div>
            <div className="mb-4">
              <label className="block mb-2">الرد:</label>
              <textarea
                value={reportResponse}
                onChange={(e) => setReportResponse(e.target.value)}
                className="w-full p-2 border rounded"
                rows={4}
                placeholder="أدخل الرد على البلاغ"
              ></textarea>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowReportDialog(false)
                  setReportResponse('')
                  setReportAction('resolved')
                }}
                className="px-4 py-2 bg-gray-300 rounded"
              >
                إلغاء
              </button>
              <button
                onClick={handleReportResponse}
                className="px-4 py-2 bg-blue-500 text-white rounded"
                disabled={!reportResponse.trim()}
              >
                إرسال
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Moderator Ban Dialog */}
      {showModeratorBanDialog && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96 rtl">
            <h3 className="text-xl font-bold mb-4">حظر مؤقت (مشرف)</h3>
            <p className="mb-4">
              حظر المستخدم: {selectedUser.username} ({selectedUser.user_id})
            </p>
            <div className="mb-4">
              <label className="block mb-2">مدة الحظر (بالدقائق):</label>
              <select
                value={moderatorBanDuration}
                onChange={(e) => setModeratorBanDuration(e.target.value)}
                className="w-full p-2 border rounded"
              >
                <option value="30">30 دقيقة</option>
                <option value="60">ساعة واحدة</option>
                <option value="120">ساعتان</option>
                <option value="180">3 ساعات</option>
                <option value="360">6 ساعات</option>
                <option value="720">12 ساعة</option>
                <option value="1440">24 ساعة</option>
              </select>
            </div>
            <div className="mb-4">
              <label className="block mb-2">سبب الحظر:</label>
              <textarea
                value={moderatorBanReason}
                onChange={(e) => setModeratorBanReason(e.target.value)}
                className="w-full p-2 border rounded"
                rows={3}
                placeholder="أدخل سبب الحظر"
              ></textarea>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowModeratorBanDialog(false)
                  setModeratorBanReason('')
                  setModeratorBanDuration('60')
                }}
                className="px-4 py-2 bg-gray-300 rounded"
              >
                إلغاء
              </button>
              <button
                onClick={() => {
                  if (selectedUser) {
                    handleModeratorBan(selectedUser.user_id, parseInt(moderatorBanDuration), moderatorBanReason)
                    setShowModeratorBanDialog(false)
                    setModeratorBanReason('')
                    setModeratorBanDuration('60')
                  }
                }}
                className="px-4 py-2 bg-red-500 text-white rounded"
                disabled={!moderatorBanReason.trim()}
              >
                حظر
              </button>
            </div>
          </div>
        </div>
      )}

      <Dialog open={showBadgeDialog} onOpenChange={setShowBadgeDialog}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>إضافة شارة للمستخدم</DialogTitle>
            <DialogDescription>
              إضافة شارة للمستخدم {selectedUserForBadge?.username} ({selectedUserForBadge?.user_id})
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">رفع صورة الشارة (50x50 بكسل)</label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => setBadgeImage(e.target.files?.[0] || null)}
                className="text-right"
                dir="rtl"
              />
              {badgeImage && (
                <div className="mt-2">
                  <img 
                    src={URL.createObjectURL(badgeImage)} 
                    alt="معاينة الشارة" 
                    className="w-12 h-12 object-cover border rounded"
                  />
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="flex-row-reverse">
            <Button onClick={handleAssignBadge} disabled={!badgeImage}>
              <Upload className="h-4 w-4 ml-2" />
              تعيين الشارة
            </Button>
            <Button variant="outline" onClick={() => setShowBadgeDialog(false)}>
              إلغاء
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showMaintenanceDialog} onOpenChange={setShowMaintenanceDialog}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>إدارة وضع الصيانة</DialogTitle>
            <DialogDescription>
              {maintenanceMode ? 'إلغاء وضع الصيانة' : 'تفعيل وضع الصيانة للدردشة'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">سبب الصيانة</label>
              <Textarea
                value={maintenanceReason}
                onChange={(e) => setMaintenanceReason(e.target.value)}
                placeholder="اكتب سبب الصيانة..."
                className="text-right"
                dir="rtl"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="flex-row-reverse">
            <Button 
              onClick={handleToggleMaintenanceMode}
              variant={maintenanceMode ? "outline" : "destructive"}
            >
              <Settings className="h-4 w-4 ml-2" />
              {maintenanceMode ? 'إلغاء الصيانة' : 'تفعيل الصيانة'}
            </Button>
            <Button variant="outline" onClick={() => setShowMaintenanceDialog(false)}>
              إلغاء
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  )
}
