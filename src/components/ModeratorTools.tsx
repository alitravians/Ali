import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { Label } from './ui/label'
import { Alert, AlertDescription } from './ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Ban, Volume2, Trash2 } from 'lucide-react'
import { arabicTranslations } from '../lib/arabic'

interface ModeratorToolsProps {
  token: string
}

export default function ModeratorTools({ token }: ModeratorToolsProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [messageId, setMessageId] = useState('')
  const [userId, setUserId] = useState('')
  const [muteDuration, setMuteDuration] = useState('60')
  const [banDuration, setBanDuration] = useState('1440')
  const [banReason, setBanReason] = useState('')

  const deleteMessage = async () => {
    if (!messageId.trim()) {
      setError('يرجى إدخال ' + arabicTranslations.messageId)
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch(`/messages/${messageId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        setSuccess('تم حذف الرسالة بنجاح')
        setMessageId('')
      } else {
        const errorData = await response.json()
        setError(errorData.detail || 'فشل في حذف الرسالة')
      }
    } catch (err) {
      setError('فشل في حذف الرسالة')
    } finally {
      setLoading(false)
    }
  }

  const muteUser = async () => {
    if (!userId.trim()) {
      setError('يرجى إدخال معرف المستخدم')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch(`/users/${userId}/mute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          duration_minutes: parseInt(muteDuration)
        })
      })

      if (response.ok) {
        setSuccess(`تم كتم المستخدم لمدة ${muteDuration} دقيقة`)
        setUserId('')
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

  const banUser = async () => {
    if (!userId.trim() || !banReason.trim()) {
      setError('يرجى إدخال معرف المستخدم وسبب الحظر')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch(`/users/${userId}/ban`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          reason: banReason,
          duration_minutes: parseInt(banDuration)
        })
      })

      if (response.ok) {
        setSuccess(`تم حظر المستخدم لمدة ${banDuration} دقيقة`)
        setUserId('')
        setBanReason('')
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

      <Tabs defaultValue="delete" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="delete">
            <Trash2 className="w-4 h-4 ml-2" />
            {arabicTranslations.delete}
          </TabsTrigger>
          <TabsTrigger value="mute">
            <Volume2 className="w-4 h-4 ml-2" />
            كتم
          </TabsTrigger>
          <TabsTrigger value="ban">
            <Ban className="w-4 h-4 ml-2" />
            حظر
          </TabsTrigger>
        </TabsList>

        <TabsContent value="delete">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trash2 className="w-4 h-4" />
                حذف رسالة
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="messageId">معرف الرسالة</Label>
                <Input
                  id="messageId"
                  value={messageId}
                  onChange={(e) => setMessageId(e.target.value)}
                  placeholder="أدخل معرف الرسالة"
                  className="text-right"
                  dir="rtl"
                />
              </div>
              
              <Button 
                onClick={deleteMessage}
                disabled={loading}
                variant="destructive"
                className="w-full"
              >
                {loading ? 'جاري الحذف...' : 'حذف الرسالة'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mute">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Volume2 className="w-4 h-4" />
                كتم مستخدم
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="muteUserId">معرف المستخدم</Label>
                <Input
                  id="muteUserId"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="أدخل معرف المستخدم"
                  className="text-right"
                  dir="rtl"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="muteDuration">مدة الكتم (بالدقائق)</Label>
                <Input
                  id="muteDuration"
                  type="number"
                  value={muteDuration}
                  onChange={(e) => setMuteDuration(e.target.value)}
                  placeholder="60"
                  min="1"
                  max="10080"
                />
              </div>
              
              <Button 
                onClick={muteUser}
                disabled={loading}
                variant="secondary"
                className="w-full"
              >
                {loading ? 'جاري الكتم...' : 'كتم المستخدم'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ban">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ban className="w-4 h-4" />
                حظر مستخدم
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="banUserId">معرف المستخدم</Label>
                <Input
                  id="banUserId"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="أدخل معرف المستخدم"
                  className="text-right"
                  dir="rtl"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="banDuration">مدة الحظر (بالدقائق)</Label>
                <Input
                  id="banDuration"
                  type="number"
                  value={banDuration}
                  onChange={(e) => setBanDuration(e.target.value)}
                  placeholder="1440"
                  min="1"
                  max="525600"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="banReason">سبب الحظر</Label>
                <Textarea
                  id="banReason"
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  placeholder="أدخل سبب الحظر"
                  className="text-right"
                  dir="rtl"
                />
              </div>
              
              <Button 
                onClick={banUser}
                disabled={loading}
                variant="destructive"
                className="w-full"
              >
                {loading ? 'جاري الحظر...' : 'حظر المستخدم'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
