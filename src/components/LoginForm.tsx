import { useState } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Label } from './ui/label'
import { Alert, AlertDescription } from './ui/alert'
import { Tabs, TabsList, TabsTrigger } from './ui/tabs'

interface LoginFormProps {
  onLogin: (token: string, username: string, role: string) => void
  onShowRegistration: () => void
}

export default function LoginForm({ onLogin, onShowRegistration }: LoginFormProps) {
  const [username, setUsername] = useState('')
  const [adminCode, setAdminCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [loginType, setLoginType] = useState<'member' | 'admin'>('member')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim()) {
      setError('يرجى إدخال اسم المستخدم')
      return
    }

    if (loginType === 'admin' && adminCode !== '3131') {
      setError('كود الإدارة غير صحيح')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          username: username.trim(),
          login_type: loginType,
          admin_code: loginType === 'admin' ? adminCode : undefined
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'فشل في تسجيل الدخول')
      }

      const data = await response.json()
      onLogin(data.access_token, data.username, data.role)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل في تسجيل الدخول')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">نظام الدردشة</CardTitle>
          <CardDescription>اختر نوع الدخول</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={loginType} onValueChange={(value) => setLoginType(value as 'member' | 'admin')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="member">عضو</TabsTrigger>
              <TabsTrigger value="admin">إدارة</TabsTrigger>
            </TabsList>
            
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="username">اسم المستخدم</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="أدخل اسم المستخدم"
                  disabled={loading}
                  className="text-right"
                  dir="rtl"
                />
              </div>
              
              {loginType === 'admin' && (
                <div className="space-y-2">
                  <Label htmlFor="adminCode">كود الإدارة</Label>
                  <Input
                    id="adminCode"
                    type="password"
                    value={adminCode}
                    onChange={(e) => setAdminCode(e.target.value)}
                    placeholder="أدخل كود الإدارة"
                    disabled={loading}
                    className="text-center"
                  />
                </div>
              )}
              
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading}
              >
                {loading ? 'جاري الدخول...' : 'دخول'}
              </Button>
              
              {loginType === 'member' && (
                <Button 
                  type="button" 
                  variant="outline"
                  className="w-full" 
                  onClick={onShowRegistration}
                  disabled={loading}
                >
                  تسجيل عضو جديد
                </Button>
              )}
            </form>
          </Tabs>
          
          {loginType === 'member' && (
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600">
                ليس لديك حساب؟ 
                <button 
                  onClick={onShowRegistration}
                  className="text-blue-600 hover:text-blue-800 mr-1"
                  disabled={loading}
                >
                  سجل الآن
                </button>
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
