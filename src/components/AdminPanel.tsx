import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { Label } from './ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Alert, AlertDescription } from './ui/alert'
import { Badge } from './ui/badge'
import { Trash2, MessageSquare, Users, AlertTriangle } from 'lucide-react'
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

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [usersRes, reportsRes, appealsRes] = await Promise.all([
        fetch('/admin/users', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/admin/reports', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/admin/ban-appeals', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ])

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
      const response = await fetch('/admin/announcements', {
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

      <Tabs defaultValue="announcements" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
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
        </TabsList>

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
                    <div className="flex gap-2">
                      <Badge className={getStatusColor(user.status)}>
                        {getStatusText(user.status)}
                      </Badge>
                      <Badge variant="outline">
                        {getRoleText(user.role)}
                      </Badge>
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
                          <div className="text-sm">{appeal.admin_response}</div>
                        </>
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
      </Tabs>
    </div>
  )
}
