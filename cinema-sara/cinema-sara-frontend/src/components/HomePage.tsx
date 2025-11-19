import { Film, CheckCircle, FileText, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useState } from 'react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

type Screen = 'home' | 'book' | 'status' | 'rules' | 'player' | 'admin' | 'code-login'

interface HomePageProps {
  navigateTo: (screen: Screen) => void
}

export default function HomePage({ navigateTo }: HomePageProps) {
  const [adminCode, setAdminCode] = useState('')
  const [adminError, setAdminError] = useState('')
  const [isAdminDialogOpen, setIsAdminDialogOpen] = useState(false)

  const handleAdminLogin = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: adminCode })
      })

      if (response.ok) {
        localStorage.setItem('cinema-sara-admin', 'true')
        navigateTo('admin')
        setIsAdminDialogOpen(false)
      } else {
        const data = await response.json()
        setAdminError(data.detail || 'كود الإدارة غير صحيح')
      }
    } catch (error) {
      setAdminError('حدث خطأ في الاتصال')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-white mb-2">سينما سارة</h1>
          <p className="text-xl text-purple-200">منصة مشاهدة الأفلام الحصرية</p>
        </div>

        <div className="space-y-4">
          <Button
            onClick={() => navigateTo('book')}
            className="w-full h-20 text-2xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white rounded-xl shadow-lg transform transition hover:scale-105"
          >
            <Film className="ml-3 h-8 w-8" />
            احجز فلمك
          </Button>

          <Button
            onClick={() => navigateTo('code-login')}
            className="w-full h-20 text-2xl bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white rounded-xl shadow-lg transform transition hover:scale-105"
          >
            <Lock className="ml-3 h-8 w-8" />
            دخول بالكود
          </Button>

          <Button
            onClick={() => navigateTo('status')}
            className="w-full h-20 text-2xl bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white rounded-xl shadow-lg transform transition hover:scale-105"
          >
            <CheckCircle className="ml-3 h-8 w-8" />
            مراجعة حالة قبول الفيلم
          </Button>

          <Button
            onClick={() => navigateTo('rules')}
            className="w-full h-20 text-2xl bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white rounded-xl shadow-lg transform transition hover:scale-105"
          >
            <FileText className="ml-3 h-8 w-8" />
            قوانين المنصة
          </Button>
        </div>

        <div className="text-center pt-4">
          <Dialog open={isAdminDialogOpen} onOpenChange={setIsAdminDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" className="text-white hover:text-purple-200">
                لوحة التحكم
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md" dir="rtl">
              <DialogHeader>
                <DialogTitle className="text-right">دخول لوحة التحكم</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="admin-code" className="text-right block">
                    كود الإدارة
                  </Label>
                  <Input
                    id="admin-code"
                    type="password"
                    value={adminCode}
                    onChange={(e) => {
                      setAdminCode(e.target.value)
                      setAdminError('')
                    }}
                    onKeyPress={(e) => e.key === 'Enter' && handleAdminLogin()}
                    className="text-right"
                    placeholder="أدخل كود الإدارة"
                  />
                  {adminError && (
                    <p className="text-sm text-red-500 text-right">{adminError}</p>
                  )}
                </div>
                <Button onClick={handleAdminLogin} className="w-full">
                  دخول
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  )
}
