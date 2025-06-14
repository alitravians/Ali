import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Button } from './ui/button'
import { Card, CardContent } from './ui/card'
import { Alert, AlertDescription } from './ui/alert'

interface MessageReportModalProps {
  messageId: string
  isOpen: boolean
  onClose: () => void
}

export default function MessageReportModal({ messageId, isOpen, onClose }: MessageReportModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const submitReport = async (violationType: string, violationLabel: string) => {
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const apiUrl = window.location.hostname === 'localhost' ? 'http://localhost:8000' : (import.meta.env.VITE_API_URL || 'http://localhost:8000')
      const response = await fetch(`${apiUrl}/reports/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message_id: messageId,
          violation_type: violationType,
          reason: violationLabel
        })
      })

      if (response.ok) {
        setSuccess('تم إرسال البلاغ بنجاح')
        setTimeout(() => {
          onClose()
        }, 1500)
      } else {
        const errorData = await response.json()
        setError(errorData.detail || 'فشل في إرسال البلاغ')
      }
    } catch (error) {
      setError('فشل في إرسال البلاغ')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md rtl-text" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-right">الإبلاغ عن رسالة</DialogTitle>
        </DialogHeader>
        
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

        <div className="grid gap-4 py-4">
          <Card 
            className="cursor-pointer hover:bg-red-50 border-red-200 transition-colors" 
            onClick={() => submitReport('offensive', 'رسالة مسيئة')}
          >
            <CardContent className="p-4 text-red-700 text-right">
              <div className="flex items-center justify-between">
                <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                <span className="font-medium">رسالة مسيئة</span>
              </div>
            </CardContent>
          </Card>
          
          <Card 
            className="cursor-pointer hover:bg-orange-50 border-orange-200 transition-colors" 
            onClick={() => submitReport('inappropriate', 'محتوى يحتوي على عبارات غير مناسبة')}
          >
            <CardContent className="p-4 text-orange-700 text-right">
              <div className="flex items-center justify-between">
                <div className="w-4 h-4 bg-orange-500 rounded-full"></div>
                <span className="font-medium">محتوى يحتوي على عبارات غير مناسبة</span>
              </div>
            </CardContent>
          </Card>
          
          <Card 
            className="cursor-pointer hover:bg-yellow-50 border-yellow-200 transition-colors" 
            onClick={() => submitReport('religion_politics', 'دين/سياسة')}
          >
            <CardContent className="p-4 text-yellow-700 text-right">
              <div className="flex items-center justify-between">
                <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                <span className="font-medium">دين/سياسة</span>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            إلغاء
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
