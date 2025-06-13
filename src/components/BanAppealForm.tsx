import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'
import { Label } from './ui/label'
import { Alert, AlertDescription } from './ui/alert'
import { LogOut, AlertTriangle } from 'lucide-react'

interface BanAppealFormProps {
  token: string
  banReason: string
  onLogout: () => void
}

export default function BanAppealForm({ token, banReason, onLogout }: BanAppealFormProps) {
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
      const response = await fetch('/ban-appeals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          reason: appealReason
        })
      })

      if (response.ok) {
        setSuccess('تم تقديم طلب الاستئناف بنجاح. سيتم مراجعته من قبل الإدارة.')
        setAppealSubmitted(true)
        setAppealReason('')
      } else {
        const errorData = await response.json()
        setError(errorData.detail || 'فشل في تقديم طلب الاستئناف')
      }
    } catch (err) {
      setError('فشل في تقديم طلب الاستئناف')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <AlertTriangle className="w-6 h-6 text-red-500" />
          <CardTitle className="text-red-600">تم حظرك من الدردشة</CardTitle>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <Alert variant="destructive">
          <AlertDescription>
            <strong>سبب الحظر:</strong> {banReason}
          </AlertDescription>
        </Alert>

        {!appealSubmitted ? (
          <>
            <div className="text-center text-gray-600 text-sm">
              يمكنك تقديم طلب استئناف إذا كنت تعتقد أن الحظر غير مبرر
            </div>

            <div className="space-y-2">
              <Label htmlFor="appealReason">سبب الاستئناف</Label>
              <Textarea
                id="appealReason"
                value={appealReason}
                onChange={(e) => setAppealReason(e.target.value)}
                placeholder="اشرح لماذا تعتقد أن الحظر غير مبرر..."
                className="text-right min-h-[100px]"
                dir="rtl"
                maxLength={500}
              />
              <div className="text-xs text-gray-500 text-right">
                {appealReason.length}/500 حرف
              </div>
            </div>

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

            <Button 
              onClick={submitAppeal}
              disabled={loading}
              className="w-full"
            >
              {loading ? 'جاري التقديم...' : 'تقديم طلب الاستئناف'}
            </Button>
          </>
        ) : (
          <Alert>
            <AlertDescription>
              تم تقديم طلب الاستئناف بنجاح. سيتم مراجعته من قبل الإدارة وستحصل على رد قريباً.
            </AlertDescription>
          </Alert>
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
  )
}
