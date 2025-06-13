import React, { useState } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Label } from './ui/label'
import { Alert, AlertDescription } from './ui/alert'

interface RegistrationFormProps {
  onRegistrationSuccess: (token: string, username: string, role: string, userId: string) => void
  onBackToLogin: () => void
}

export default function RegistrationForm({ onRegistrationSuccess, onBackToLogin }: RegistrationFormProps) {
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [generatedUserId, setGeneratedUserId] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim()) {
      setError('يرجى إدخال اسم المستخدم')
      return
    }

    if (username.trim().length < 3) {
      setError('اسم المستخدم يجب أن يكون 3 أحرف على الأقل')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch(`http://localhost:8000/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          username: username.trim()
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'فشل في التسجيل')
      }

      const data = await response.json()
      setGeneratedUserId(data.user_id)
      setSuccess(true)
      
      setTimeout(() => {
        onRegistrationSuccess(data.access_token, data.username, data.role, data.user_id)
      }, 2000)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل في التسجيل')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-green-600">تم التسجيل بنجاح!</CardTitle>
            <CardDescription>تم إنشاء حسابك وتعيين معرف فريد لك</CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <p className="text-sm text-gray-600 mb-2">معرفك الفريد:</p>
              <p className="text-2xl font-bold text-green-700 font-mono">{generatedUserId}</p>
              <p className="text-xs text-gray-500 mt-2">احفظ هذا المعرف - يمكنك تغييره مرة واحدة فقط</p>
            </div>
            <Alert>
              <AlertDescription>
                سيتم توجيهك إلى الدردشة خلال ثوانٍ قليلة...
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">تسجيل عضو جديد</CardTitle>
          <CardDescription>إنشاء حساب جديد في نظام الدردشة</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">اسم المستخدم</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="أدخل اسم المستخدم (3 أحرف على الأقل)"
                disabled={loading}
                className="text-right"
                dir="rtl"
              />
              <p className="text-xs text-gray-500">
                سيتم تعيين معرف فريد مكون من 10 أرقام لك تلقائياً
              </p>
            </div>
            
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading}
              >
                {loading ? 'جاري التسجيل...' : 'تسجيل'}
              </Button>
              
              <Button 
                type="button" 
                variant="outline"
                className="w-full" 
                onClick={onBackToLogin}
                disabled={loading}
              >
                العودة لتسجيل الدخول
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
