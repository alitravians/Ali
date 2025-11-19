import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowRight, Lock } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

type Screen = 'home' | 'book' | 'status' | 'rules' | 'player' | 'admin' | 'code-login'

interface CodeLoginProps {
  navigateTo: (screen: Screen) => void
  onLoginSuccess: (data: any) => void
}

export default function CodeLogin({ navigateTo, onLoginSuccess }: CodeLoginProps) {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch(`${API_URL}/api/code-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.toUpperCase() })
      })

      if (response.ok) {
        const data = await response.json()
        onLoginSuccess(data)
      } else {
        const data = await response.json()
        setError(data.detail || 'كود غير صالح')
      }
    } catch (error) {
      setError('حدث خطأ في الاتصال')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <Button
          onClick={() => navigateTo('home')}
          variant="ghost"
          className="text-white mb-4"
        >
          <ArrowRight className="ml-2 h-5 w-5" />
          رجوع
        </Button>

        <Card dir="rtl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
              <Lock className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-3xl">دخول بالكود</CardTitle>
            <CardDescription className="text-lg">
              أدخل كود الدخول الخاص بك لمشاهدة الفيلم
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="code" className="text-lg">كود الدخول</Label>
                <Input
                  id="code"
                  required
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value.toUpperCase())
                    setError('')
                  }}
                  className="text-center text-2xl font-mono tracking-wider h-14"
                  placeholder="XXXXXXXX"
                  maxLength={8}
                />
                {error && (
                  <p className="text-red-500 text-center text-sm">{error}</p>
                )}
              </div>

              <Button
                type="submit"
                disabled={loading || code.length < 6}
                className="w-full h-12 text-lg"
              >
                {loading ? 'جاري التحقق...' : 'دخول'}
              </Button>

              <div className="text-center text-sm text-gray-600 space-y-2">
                <p>الكود مكون من 8 أحرف وأرقام</p>
                <p>يمكنك الحصول على الكود من صفحة مراجعة الحالة</p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
