import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowRight, Calendar, Mail, MessageCircle, Instagram } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

type Screen = 'home' | 'book' | 'status' | 'rules' | 'player' | 'admin' | 'code-login'

interface BookMovieProps {
  navigateTo: (screen: Screen) => void
}

interface Movie {
  id: number
  title_ar: string
  description_ar: string
  thumbnail_url: string
  duration: number
  genre: string
}

export default function BookMovie({ navigateTo }: BookMovieProps) {
  const [movies, setMovies] = useState<Movie[]>([])
  const [selectedMovie, setSelectedMovie] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    user_name: '',
    user_email: '',
    user_discord: '',
    user_instagram: '',
    requested_time: ''
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchMovies()
  }, [])

  const fetchMovies = async () => {
    try {
      const response = await fetch(`${API_URL}/api/movies`)
      const data = await response.json()
      setMovies(data)
    } catch (error) {
      console.error('Error fetching movies:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedMovie) {
      setError('الرجاء اختيار فيلم')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch(`${API_URL}/api/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          movie_id: selectedMovie
        })
      })

      if (response.ok) {
        setSuccess(true)
        setTimeout(() => {
          navigateTo('home')
        }, 3000)
      } else {
        const data = await response.json()
        setError(data.detail || 'حدث خطأ في الحجز')
      }
    } catch (error) {
      setError('حدث خطأ في الاتصال')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <Card className="max-w-md w-full" dir="rtl">
          <CardHeader>
            <CardTitle className="text-center text-2xl text-green-600">تم إرسال طلبك بنجاح!</CardTitle>
            <CardDescription className="text-center text-lg">
              سيتم مراجعة طلبك وإرسال كود الدخول إليك عند الموافقة
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
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
            <CardTitle className="text-3xl">احجز فلمك</CardTitle>
            <CardDescription className="text-lg">
              اختر الفيلم الذي تريد مشاهدته وأدخل بياناتك
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <Label className="text-lg">اختر الفيلم</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {movies.map((movie) => (
                    <div
                      key={movie.id}
                      onClick={() => setSelectedMovie(movie.id)}
                      className={`cursor-pointer rounded-lg border-2 p-4 transition ${
                        selectedMovie === movie.id
                          ? 'border-purple-600 bg-purple-50'
                          : 'border-gray-200 hover:border-purple-300'
                      }`}
                    >
                      <h3 className="font-bold text-lg mb-2">{movie.title_ar}</h3>
                      <p className="text-sm text-gray-600 mb-2">{movie.description_ar}</p>
                      <div className="flex justify-between text-sm text-gray-500">
                        <span>{movie.duration} دقيقة</span>
                        <span>{movie.genre}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="user_name">الاسم *</Label>
                <Input
                  id="user_name"
                  required
                  value={formData.user_name}
                  onChange={(e) => setFormData({ ...formData, user_name: e.target.value })}
                  className="text-right"
                  placeholder="أدخل اسمك"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="requested_time">الوقت المفضل *</Label>
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-gray-500" />
                  <Input
                    id="requested_time"
                    type="datetime-local"
                    required
                    value={formData.requested_time}
                    onChange={(e) => setFormData({ ...formData, requested_time: e.target.value })}
                    className="text-right"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-lg">معلومات التواصل (لإرسال الكود ودعوة الأصدقاء)</Label>
                
                <div className="space-y-2">
                  <Label htmlFor="user_email">البريد الإلكتروني</Label>
                  <div className="flex items-center gap-2">
                    <Mail className="h-5 w-5 text-gray-500" />
                    <Input
                      id="user_email"
                      type="email"
                      value={formData.user_email}
                      onChange={(e) => setFormData({ ...formData, user_email: e.target.value })}
                      className="text-right"
                      placeholder="example@email.com"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="user_discord">ديسكورد</Label>
                  <div className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5 text-gray-500" />
                    <Input
                      id="user_discord"
                      value={formData.user_discord}
                      onChange={(e) => setFormData({ ...formData, user_discord: e.target.value })}
                      className="text-right"
                      placeholder="username#1234"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="user_instagram">انستغرام</Label>
                  <div className="flex items-center gap-2">
                    <Instagram className="h-5 w-5 text-gray-500" />
                    <Input
                      id="user_instagram"
                      value={formData.user_instagram}
                      onChange={(e) => setFormData({ ...formData, user_instagram: e.target.value })}
                      className="text-right"
                      placeholder="@username"
                    />
                  </div>
                </div>
              </div>

              {error && (
                <p className="text-red-500 text-center">{error}</p>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 text-lg"
              >
                {loading ? 'جاري الإرسال...' : 'إرسال الطلب'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
