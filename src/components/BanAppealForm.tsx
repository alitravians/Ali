import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'
import { Label } from './ui/label'
import { Alert, AlertDescription } from './ui/alert'
import { LogOut, AlertTriangle } from 'lucide-react'
import { formatArabicDuration } from '../lib/arabic'

interface BanAppealFormProps {
  token: string
  banReason: string
  banDuration?: number
  banUntil?: string
  onLogout: () => void
}

export default function BanAppealForm({ token, banReason, banDuration, banUntil, onLogout }: BanAppealFormProps) {
  const [appealReason, setAppealReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [appealSubmitted, setAppealSubmitted] = useState(false)

  const submitAppeal = async () => {
    if (!appealReason.trim()) {
      setError('يرجى إدخال سبب الاستئناف')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const apiUrl = window.location.hostname === 'localhost' ? 'http://localhost:8000' : (import.meta.env.VITE_API_URL || 'http://localhost:8000')
      console.log('BanAppealForm: Submitting appeal to:', `${apiUrl}/ban-appeals`)
      console.log('BanAppealForm: Token:', token ? 'Present' : 'Missing')
      
      const response = await fetch(`${apiUrl}/ban-appeals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          reason: appealReason
        })
      })

      console.log('BanAppealForm: Response status:', response.status)
      
      if (response.ok) {
        const responseData = await response.json()
        console.log('BanAppealForm: Success response:', responseData)
        setSuccess('تم تقديم طلب الاستئناف بنجاح. سيتم مراجعته من قبل الإدارة.')
        setAppealSubmitted(true)
        setAppealReason('')
      } else {
        const errorData = await response.json()
        console.log('BanAppealForm: Error response:', errorData)
        setError(errorData.detail || 'فشل في تقديم طلب الاستئناف')
      }
    } catch (err) {
      console.error('BanAppealForm: Exception during appeal submission:', err)
      setError('فشل في تقديم طلب الاستئناف - خطأ في الاتصال')
    } finally {
      setLoading(false)
    }
  }

  const formatBanExpiry = (banUntil: string) => {
    const expiryDate = new Date(banUntil)
    const now = new Date()
    const diffMs = expiryDate.getTime() - now.getTime()
    const diffMinutes = Math.ceil(diffMs / (1000 * 60))
    
    if (diffMinutes <= 0) {
      return 'انتهى الحظر'
    }
    
    return `${diffMinutes} دقيقة متبقية`
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-lg mx-auto">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <AlertTriangle className="w-8 h-8 text-red-500" />
            <CardTitle className="text-xl text-red-600">تم حظرك من الدردشة</CardTitle>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="font-bold text-red-800 mb-3 text-center">تفاصيل الحظر</h3>
            <div className="space-y-2 text-right">
              <div className="flex justify-between">
                <span className="font-semibold text-red-700">السبب:</span>
                <span className="text-red-600">{banReason || 'لم يتم تحديد السبب'}</span>
              </div>
              {banDuration && banDuration > 0 && (
                <div className="flex justify-between">
                  <span className="font-semibold text-red-700">مدة الحظر:</span>
                  <span className="text-red-600">{formatArabicDuration(banDuration)}</span>
                </div>
              )}
              {banUntil && (
                <div className="flex justify-between">
                  <span className="font-semibold text-red-700">ينتهي في:</span>
                  <span className="text-red-600">{formatBanExpiry(banUntil)}</span>
                </div>
              )}
            </div>
          </div>

          {!appealSubmitted ? (
            <>
              <div className="text-center text-gray-600 text-sm bg-blue-50 p-3 rounded-lg">
                يمكنك تقديم طلب اعتراض إذا كنت تعتقد أن الحظر غير مبرر
              </div>

              <div className="space-y-2">
                <Label htmlFor="appealReason" className="text-right block">سبب الاعتراض</Label>
                <Textarea
                  id="appealReason"
                  value={appealReason}
                  onChange={(e) => setAppealReason(e.target.value)}
                  placeholder="اشرح لماذا تعتقد أن الحظر غير مبرر..."
                  className="text-right min-h-[120px] arabic-input"
                  dir="rtl"
                  maxLength={500}
                />
                <div className="text-xs text-gray-500 text-right">
                  {appealReason.length}/500 حرف
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription className="text-right">{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert>
                  <AlertDescription className="text-right">{success}</AlertDescription>
                </Alert>
              )}

              <Button 
                onClick={submitAppeal}
                disabled={loading}
                className="w-full"
              >
                {loading ? 'جاري التقديم...' : 'تقديم طلب الاعتراض'}
              </Button>
            </>
          ) : (
            <div className="space-y-4">
              <Alert>
                <AlertDescription className="text-right">
                  تم تقديم طلب الاعتراض بنجاح. سيتم مراجعته من قبل الإدارة.
                </AlertDescription>
              </Alert>
              

            </div>
          )}

          <div className="pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={onLogout}
              className="w-full"
            >
              <LogOut className="w-4 h-4 ml-2" />
              تسجيل الخروج
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
