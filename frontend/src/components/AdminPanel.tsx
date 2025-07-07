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
import { useAuth } from '../contexts/AuthContext'
import { 
  Users, 
  MessageSquare, 
  Flag, 
  Shield, 
  LogOut, 
  Ban, 
  Volume2, 
  Megaphone
} from 'lucide-react'

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

export default function AdminPanel() {
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
  
  const [selectedUser, setSelectedUser] = useState<UserInfo | null>(null)
  const [selectedAppeal, setSelectedAppeal] = useState<Appeal | null>(null)
  const [banReason, setBanReason] = useState('')
  const [banDuration, setBanDuration] = useState('')
  const [muteDuration, setMuteDuration] = useState('30')
  const [appealResponse, setAppealResponse] = useState('')
  const [appealAction, setAppealAction] = useState('')
  const [announcementTitle, setAnnouncementTitle] = useState('')
  const [announcementContent, setAnnouncementContent] = useState('')

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
    const response = await fetch(`${API_URL}/admin/users`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    if (response.ok) {
      const data = await response.json()
      setUsers(data)
    }
  }

  const fetchReports = async () => {
    const response = await fetch(`${API_URL}/admin/reports`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    if (response.ok) {
      const data = await response.json()
      setReports(data)
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
      const response = await fetch(`${API_URL}/admin/users/ban`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          user_id: selectedUser.user_id,
          reason: banReason.trim(),
          duration_hours: banDuration ? parseInt(banDuration) : null
        })
      })

      if (response.ok) {
        alert('تم حظر المستخدم بنجاح')
        setShowBanDialog(false)
        setBanReason('')
        setBanDuration('')
        fetchUsers()
      } else {
        const error = await response.json()
        alert(error.detail || 'فشل في حظر المستخدم')
      }
    } catch (error) {
      alert('حدث خطأ في حظر المستخدم')
    }
  }

  const handleMuteUser = async () => {
    if (!selectedUser) return

    try {
      const response = await fetch(`${API_URL}/admin/users/mute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          user_id: selectedUser.user_id,
          duration_minutes: parseInt(muteDuration)
        })
      })

      if (response.ok) {
        alert('تم كتم المستخدم بنجاح')
        setShowMuteDialog(false)
        setMuteDuration('30')
        fetchUsers()
      } else {
        const error = await response.json()
        alert(error.detail || 'فشل في كتم المستخدم')
      }
    } catch (error) {
      alert('حدث خطأ في كتم المستخدم')
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
          content: announcementContent.trim()
        })
      })

      if (response.ok) {
        alert('تم إنشاء الإعلان بنجاح')
        setShowAnnouncementDialog(false)
        setAnnouncementTitle('')
        setAnnouncementContent('')
        fetchAnnouncements()
      } else {
        const error = await response.json()
        alert(error.detail || 'فشل في إنشاء الإعلان')
      }
    } catch (error) {
      alert('حدث خطأ في إنشاء الإعلان')
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
        <Button variant="outline" size="sm" onClick={logout}>
          <LogOut className="h-4 w-4 ml-2" />
          خروج
        </Button>
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
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => {
                                  setSelectedUser(userInfo)
                                  setShowBanDialog(true)
                                }}
                              >
                                <Ban className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedUser(userInfo)
                                  setShowMuteDialog(true)
                                }}
                              >
                                <Volume2 className="h-3 w-3" />
                              </Button>
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
          </div>

          <DialogFooter className="flex-row-reverse">
            <Button onClick={handleMuteUser} variant="outline">
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
    </div>
  )
}
