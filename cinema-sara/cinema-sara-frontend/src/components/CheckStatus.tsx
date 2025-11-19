import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowRight, Search, CheckCircle, XCircle, Clock } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

type Screen = 'home' | 'book' | 'status' | 'rules' | 'player' | 'admin' | 'code-login'

interface CheckStatusProps {
  navigateTo: (screen: Screen) => void
}

interface Booking {
  id: number
  user_name: string
  movie_id: number
  requested_time: string
  status: string
  access_code: string | null
  created_at: string
}

export default function CheckStatus({ navigateTo }: CheckStatusProps) {
  const [email, setEmail] = useState('')
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch(`${API_URL}/api/bookings/check/${encodeURIComponent(email)}`)
      const data = await response.json()
      setBookings(data)
      setSearched(true)
    } catch (error) {
      console.error('Error fetching bookings:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-6 w-6 text-green-500" />
      case 'rejected':
        return <XCircle className="h-6 w-6 text-red-500" />
      default:
        return <Clock className="h-6 w-6 text-yellow-500" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved':
        return 'تمت الموافقة'
      case 'rejected':
        return 'مرفوض'
      default:
        return 'قيد المراجعة'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-50 border-green-200'
      case 'rejected':
        return 'bg-red-50 border-red-200'
      default:
        return 'bg-yellow-50 border-yellow-200'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-4xl mx-auto">
        <Button
          onClick={() => navigateTo('home')}
          variant="ghost"
          className="text-white mb-4"
        >
          <ArrowRight className="ml-2 h-5 w-5" />
          رجوع
        </Button>

        <Card dir="rtl">
          <CardHeader>
            <CardTitle className="text-3xl">مراجعة حالة قبول الفيلم</CardTitle>
            <CardDescription className="text-lg">
              أدخل بريدك الإلكتروني للتحقق من حالة طلبات الحجز
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="space-y-4 mb-6">
              <div className="space-y-2">
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <div className="flex gap-2">
                  <Input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="text-right flex-1"
                    placeholder="example@email.com"
                  />
                  <Button type="submit" disabled={loading}>
                    <Search className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </form>

            {loading && (
              <div className="text-center py-8">
                <p className="text-gray-600">جاري البحث...</p>
              </div>
            )}

            {searched && !loading && bookings.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-600 text-lg">لا توجد حجوزات لهذا البريد الإلكتروني</p>
              </div>
            )}

            {bookings.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold">حجوزاتك:</h3>
                {bookings.map((booking) => (
                  <div
                    key={booking.id}
                    className={`border-2 rounded-lg p-4 ${getStatusColor(booking.status)}`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(booking.status)}
                        <span className="font-bold text-lg">{getStatusText(booking.status)}</span>
                      </div>
                      <span className="text-sm text-gray-600">
                        {new Date(booking.created_at).toLocaleDateString('ar-SA')}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <p className="text-gray-700">
                        <span className="font-semibold">الاسم:</span> {booking.user_name}
                      </p>
                      <p className="text-gray-700">
                        <span className="font-semibold">الوقت المطلوب:</span>{' '}
                        {new Date(booking.requested_time).toLocaleString('ar-SA')}
                      </p>

                      {booking.status === 'approved' && booking.access_code && (
                        <div className="mt-4 p-4 bg-white rounded-lg border-2 border-green-500">
                          <p className="font-bold text-lg mb-2 text-green-700">كود الدخول الخاص بك:</p>
                          <p className="text-3xl font-mono text-center text-green-600 tracking-wider">
                            {booking.access_code}
                          </p>
                          <p className="text-sm text-gray-600 mt-2 text-center">
                            استخدم هذا الكود للدخول ومشاهدة الفيلم
                          </p>
                          <Button
                            onClick={() => navigateTo('code-login')}
                            className="w-full mt-3"
                          >
                            دخول الآن
                          </Button>
                        </div>
                      )}

                      {booking.status === 'rejected' && (
                        <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-200">
                          <p className="text-red-700">
                            عذراً، تم رفض طلبك. يمكنك تقديم طلب جديد.
                          </p>
                        </div>
                      )}

                      {booking.status === 'pending' && (
                        <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                          <p className="text-yellow-700">
                            طلبك قيد المراجعة. سيتم إرسال الكود عند الموافقة.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
