import React, { useState } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Textarea } from './ui/textarea'
import { Alert, AlertDescription } from './ui/alert'
import { useAuth } from '../contexts/AuthContext'
import { ArrowLeft, Shield } from 'lucide-react'

const API_URL = import.meta.env?.VITE_API_URL || 'http://localhost:8000'

interface BanAppealFormProps {
  onBack: () => void
}

export default function BanAppealForm({ onBack }: BanAppealFormProps) {
  const { user, token } = useAuth()
  const [appealReason, setAppealReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmitAppeal = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!appealReason.trim()) {
      setError('يرجى كتابة سبب الاعتراض')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch(`${API_URL}/appeals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          reason: appealReason.trim()
        })
      })

      if (response.ok) {
        setSuccess(true)
        setAppealReason('')
      } else {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'فشل في إرسال الاعتراض')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل في إرسال الاعتراض')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <Shield className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-green-800">تم إرسال الاعتراض</CardTitle>
            <CardDescription>
              تم إرسال اعتراضك بنجاح وسيتم مراجعته من قبل الإدارة
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="space-y-4">
              <Alert>
                <AlertDescription>
                  سيتم إشعارك بنتيجة المراجعة عبر النظام. يرجى المتابعة لاحقاً.
                </AlertDescription>
              </Alert>
              
              <Button onClick={onBack} className="w-full">
                <ArrowLeft className="h-4 w-4 ml-2" />
                العودة لتسجيل الدخول
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <Shield className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-red-800">حساب محظور</CardTitle>
          <CardDescription>
            تم حظر حسابك من النظام. يمكنك تقديم اعتراض للمراجعة
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <Alert variant="destructive">
              <AlertDescription>
                <div className="space-y-2">
                  <div><strong>المستخدم:</strong> {user?.username}</div>
                  <div><strong>المعرف:</strong> {user?.user_id}</div>
                  <div><strong>الحالة:</strong> محظور</div>
                  {user?.ban_reason && (
                    <div><strong>سبب الحظر:</strong> {user.ban_reason}</div>
                  )}
                  {user?.banned_until && (
                    <div><strong>مدة الحظر:</strong> {(() => {
                      const banDate = new Date(user.banned_until);
                      const now = new Date();
                      const diffMs = banDate.getTime() - now.getTime();
                      
                      if (diffMs <= 0) {
                        return 'انتهت مدة الحظر';
                      }
                      
                      const diffMinutes = Math.ceil(diffMs / (1000 * 60));
                      const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));
                      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
                      
                      if (diffDays >= 1) {
                        return `${diffDays} ${diffDays === 1 ? 'يوم' : diffDays <= 10 ? 'أيام' : 'يوماً'} متبقية`;
                      } else if (diffHours >= 1) {
                        return `${diffHours} ${diffHours === 1 ? 'ساعة' : diffHours <= 10 ? 'ساعات' : 'ساعة'} متبقية`;
                      } else {
                        return `${diffMinutes} ${diffMinutes === 1 ? 'دقيقة' : diffMinutes <= 10 ? 'دقائق' : 'دقيقة'} متبقية`;
                      }
                    })()}</div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          </div>

          <form onSubmit={handleSubmitAppeal} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">سبب الاعتراض</label>
              <Textarea
                value={appealReason}
                onChange={(e) => setAppealReason(e.target.value)}
                placeholder="اكتب سبب اعتراضك على الحظر وأي معلومات إضافية تريد توضيحها للإدارة..."
                className="text-right"
                dir="rtl"
                rows={5}
                disabled={loading}
              />
              <p className="text-xs text-gray-500">
                يرجى كتابة سبب واضح ومفصل لاعتراضك
              </p>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex space-x-2 space-x-reverse">
              <Button type="submit" disabled={loading || !appealReason.trim()} className="flex-1">
                {loading ? 'جاري الإرسال...' : 'إرسال الاعتراض'}
              </Button>
              <Button type="button" variant="outline" onClick={onBack} disabled={loading}>
                <ArrowLeft className="h-4 w-4 ml-2" />
                عودة
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
