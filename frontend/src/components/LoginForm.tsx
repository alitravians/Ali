import React, { useState } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Label } from './ui/label'
import { Alert, AlertDescription } from './ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { useAuth } from '../contexts/AuthContext'

const API_URL = import.meta.env?.VITE_API_URL || 'http://localhost:8000'

export default function LoginForm() {
  const { login } = useAuth()
  const [activeTab, setActiveTab] = useState('member')
  const [username, setUsername] = useState('')
  const [accessCode, setAccessCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showRegister, setShowRegister] = useState(false)

  const handleMemberLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim()) {
      setError('يرجى إدخال اسم المستخدم')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: username.trim() }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'فشل في تسجيل الدخول')
      }

      const data = await response.json()
      login(data.access_token, {
        user_id: data.user_id,
        username: data.username,
        role: data.role,
        status: data.status || 'active',
        ban_reason: data.ban_reason,
        banned_until: data.banned_until
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل في تسجيل الدخول')
    } finally {
      setLoading(false)
    }
  }

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim() || !accessCode.trim()) {
      setError('يرجى إدخال جميع البيانات المطلوبة')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch(`${API_URL}/auth/admin-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username.trim(),
          access_code: accessCode.trim()
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'فشل في تسجيل الدخول')
      }

      const data = await response.json()
      login(data.access_token, {
        user_id: data.user_id,
        username: data.username,
        role: data.role,
        status: data.status || 'active',
        ban_reason: data.ban_reason,
        banned_until: data.banned_until
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل في تسجيل الدخول')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
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
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: username.trim() }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'فشل في التسجيل')
      }

      const data = await response.json()
      login(data.access_token, {
        user_id: data.user_id,
        username: data.username,
        role: data.role,
        status: data.status || 'active',
        ban_reason: data.ban_reason,
        banned_until: data.banned_until
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل في التسجيل')
    } finally {
      setLoading(false)
    }
  }

  if (showRegister) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">تسجيل عضو جديد</CardTitle>
            <CardDescription>إنشاء حساب جديد في نظام الدردشة المتطور</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegister} className="space-y-4">
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

              <div className="flex space-x-2 space-x-reverse">
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? 'جاري التسجيل...' : 'تسجيل'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowRegister(false)}
                  disabled={loading}
                >
                  إلغاء
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">نظام الدردشة المتطور</CardTitle>
          <CardDescription>تسجيل الدخول إلى منصة التواصل الاحترافية</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="member">عضو</TabsTrigger>
              <TabsTrigger value="admin">إدارة</TabsTrigger>
            </TabsList>

            <TabsContent value="member" className="space-y-4">
              <form onSubmit={handleMemberLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="member-username">اسم المستخدم</Label>
                  <Input
                    id="member-username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="أدخل اسم المستخدم"
                    disabled={loading}
                    className="text-right"
                    dir="rtl"
                  />
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="flex space-x-2 space-x-reverse">
                  <Button type="submit" disabled={loading} className="flex-1">
                    {loading ? 'جاري تسجيل الدخول...' : 'دخول'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowRegister(true)}
                    disabled={loading}
                  >
                    تسجيل جديد
                  </Button>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="admin" className="space-y-4">
              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="admin-username">اسم المدير</Label>
                  <Input
                    id="admin-username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="أدخل اسم المدير"
                    disabled={loading}
                    className="text-right"
                    dir="rtl"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="access-code">كود الوصول</Label>
                  <Input
                    id="access-code"
                    type="password"
                    value={accessCode}
                    onChange={(e) => setAccessCode(e.target.value)}
                    placeholder="أدخل كود الوصول"
                    disabled={loading}
                    className="text-center"
                  />
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? 'جاري تسجيل الدخول...' : 'دخول الإدارة'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
