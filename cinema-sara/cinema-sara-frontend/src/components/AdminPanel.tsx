import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { LogOut, Film, Users, Settings, CheckCircle, XCircle } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

type Screen = 'home' | 'book' | 'status' | 'rules' | 'player' | 'admin' | 'code-login'

interface AdminPanelProps {
  navigateTo: (screen: Screen) => void
  onLogout: () => void
}

interface Movie {
  id: number
  title_ar: string
  description_ar: string
  video_url: string
  thumbnail_url: string
  duration: number
  genre: string
}

interface Booking {
  id: number
  user_name: string
  user_email: string
  movie_id: number
  requested_time: string
  status: string
  access_code: string | null
  created_at: string
}

export default function AdminPanel({ onLogout }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'movies' | 'bookings' | 'settings'>('movies')
  const [movies, setMovies] = useState<Movie[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [appSettings, setAppSettings] = useState({ is_app_open: true, closed_message_ar: '' })
  const [isAddMovieOpen, setIsAddMovieOpen] = useState(false)
  const [editingMovie, setEditingMovie] = useState<Movie | null>(null)
  
  const [movieForm, setMovieForm] = useState({
    title_ar: '',
    description_ar: '',
    video_url: '',
    thumbnail_url: '',
    duration: 0,
    genre: ''
  })

  useEffect(() => {
    fetchMovies()
    fetchBookings()
    fetchAppSettings()
  }, [])

  const fetchMovies = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/movies`)
      const data = await response.json()
      setMovies(data)
    } catch (error) {
      console.error('Error fetching movies:', error)
    }
  }

  const fetchBookings = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/bookings`)
      const data = await response.json()
      setBookings(data)
    } catch (error) {
      console.error('Error fetching bookings:', error)
    }
  }

  const fetchAppSettings = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/app-settings`)
      const data = await response.json()
      setAppSettings(data)
    } catch (error) {
      console.error('Error fetching app settings:', error)
    }
  }

  const handleAddMovie = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/movies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(movieForm)
      })
      if (response.ok) {
        fetchMovies()
        setIsAddMovieOpen(false)
        setMovieForm({ title_ar: '', description_ar: '', video_url: '', thumbnail_url: '', duration: 0, genre: '' })
      }
    } catch (error) {
      console.error('Error adding movie:', error)
    }
  }

  const handleUpdateMovie = async () => {
    if (!editingMovie) return
    try {
      const response = await fetch(`${API_URL}/api/admin/movies/${editingMovie.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(movieForm)
      })
      if (response.ok) {
        fetchMovies()
        setEditingMovie(null)
        setMovieForm({ title_ar: '', description_ar: '', video_url: '', thumbnail_url: '', duration: 0, genre: '' })
      }
    } catch (error) {
      console.error('Error updating movie:', error)
    }
  }

  const handleDeleteMovie = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا الفيلم؟')) return
    try {
      await fetch(`${API_URL}/api/admin/movies/${id}`, { method: 'DELETE' })
      fetchMovies()
    } catch (error) {
      console.error('Error deleting movie:', error)
    }
  }

  const handleApproveBooking = async (bookingId: number, approved: boolean) => {
    try {
      const response = await fetch(`${API_URL}/api/admin/bookings/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ booking_id: bookingId, approved })
      })
      if (response.ok) {
        fetchBookings()
      }
    } catch (error) {
      console.error('Error approving booking:', error)
    }
  }

  const handleUpdateAppSettings = async () => {
    try {
      await fetch(`${API_URL}/api/admin/app-settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(appSettings)
      })
      alert('تم تحديث الإعدادات بنجاح')
    } catch (error) {
      console.error('Error updating app settings:', error)
    }
  }

  const startEditMovie = (movie: Movie) => {
    setEditingMovie(movie)
    setMovieForm({
      title_ar: movie.title_ar,
      description_ar: movie.description_ar,
      video_url: movie.video_url,
      thumbnail_url: movie.thumbnail_url,
      duration: movie.duration,
      genre: movie.genre
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 p-4" dir="rtl">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-4xl font-bold text-white">لوحة التحكم - سينما سارة</h1>
          <Button onClick={onLogout} variant="ghost" className="text-white">
            <LogOut className="ml-2 h-5 w-5" />
            خروج
          </Button>
        </div>

        <div className="flex gap-4 mb-6">
          <Button
            onClick={() => setActiveTab('movies')}
            className={activeTab === 'movies' ? 'bg-purple-600' : 'bg-gray-700'}
          >
            <Film className="ml-2 h-5 w-5" />
            إدارة الأفلام
          </Button>
          <Button
            onClick={() => setActiveTab('bookings')}
            className={activeTab === 'bookings' ? 'bg-purple-600' : 'bg-gray-700'}
          >
            <Users className="ml-2 h-5 w-5" />
            طلبات الحجز
          </Button>
          <Button
            onClick={() => setActiveTab('settings')}
            className={activeTab === 'settings' ? 'bg-purple-600' : 'bg-gray-700'}
          >
            <Settings className="ml-2 h-5 w-5" />
            الإعدادات
          </Button>
        </div>

        {activeTab === 'movies' && (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-2xl">إدارة الأفلام</CardTitle>
                <Dialog open={isAddMovieOpen} onOpenChange={setIsAddMovieOpen}>
                  <DialogTrigger asChild>
                    <Button>إضافة فيلم جديد</Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl" dir="rtl">
                    <DialogHeader>
                      <DialogTitle>إضافة فيلم جديد</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>عنوان الفيلم</Label>
                        <Input
                          value={movieForm.title_ar}
                          onChange={(e) => setMovieForm({ ...movieForm, title_ar: e.target.value })}
                          className="text-right"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>الوصف</Label>
                        <Textarea
                          value={movieForm.description_ar}
                          onChange={(e) => setMovieForm({ ...movieForm, description_ar: e.target.value })}
                          className="text-right"
                          rows={3}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>رابط الفيديو (شاهد أو يوتيوب)</Label>
                        <Input
                          value={movieForm.video_url}
                          onChange={(e) => setMovieForm({ ...movieForm, video_url: e.target.value })}
                          className="text-right"
                          placeholder="https://..."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>رابط الصورة المصغرة</Label>
                        <Input
                          value={movieForm.thumbnail_url}
                          onChange={(e) => setMovieForm({ ...movieForm, thumbnail_url: e.target.value })}
                          className="text-right"
                          placeholder="https://..."
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>المدة (بالدقائق)</Label>
                          <Input
                            type="number"
                            value={movieForm.duration}
                            onChange={(e) => setMovieForm({ ...movieForm, duration: parseInt(e.target.value) })}
                            className="text-right"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>النوع</Label>
                          <Input
                            value={movieForm.genre}
                            onChange={(e) => setMovieForm({ ...movieForm, genre: e.target.value })}
                            className="text-right"
                            placeholder="أكشن، كوميديا، إلخ"
                          />
                        </div>
                      </div>
                      <Button onClick={handleAddMovie} className="w-full">
                        إضافة الفيلم
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {movies.map((movie) => (
                  <div key={movie.id} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-bold text-xl mb-2">{movie.title_ar}</h3>
                        <p className="text-gray-600 mb-2">{movie.description_ar}</p>
                        <div className="flex gap-4 text-sm text-gray-500">
                          <span>المدة: {movie.duration} دقيقة</span>
                          <span>النوع: {movie.genre}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => startEditMovie(movie)}>
                              تعديل
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl" dir="rtl">
                            <DialogHeader>
                              <DialogTitle>تعديل الفيلم</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="space-y-2">
                                <Label>عنوان الفيلم</Label>
                                <Input
                                  value={movieForm.title_ar}
                                  onChange={(e) => setMovieForm({ ...movieForm, title_ar: e.target.value })}
                                  className="text-right"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>الوصف</Label>
                                <Textarea
                                  value={movieForm.description_ar}
                                  onChange={(e) => setMovieForm({ ...movieForm, description_ar: e.target.value })}
                                  className="text-right"
                                  rows={3}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>رابط الفيديو</Label>
                                <Input
                                  value={movieForm.video_url}
                                  onChange={(e) => setMovieForm({ ...movieForm, video_url: e.target.value })}
                                  className="text-right"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>رابط الصورة المصغرة</Label>
                                <Input
                                  value={movieForm.thumbnail_url}
                                  onChange={(e) => setMovieForm({ ...movieForm, thumbnail_url: e.target.value })}
                                  className="text-right"
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label>المدة (بالدقائق)</Label>
                                  <Input
                                    type="number"
                                    value={movieForm.duration}
                                    onChange={(e) => setMovieForm({ ...movieForm, duration: parseInt(e.target.value) })}
                                    className="text-right"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>النوع</Label>
                                  <Input
                                    value={movieForm.genre}
                                    onChange={(e) => setMovieForm({ ...movieForm, genre: e.target.value })}
                                    className="text-right"
                                  />
                                </div>
                              </div>
                              <Button onClick={handleUpdateMovie} className="w-full">
                                حفظ التعديلات
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteMovie(movie.id)}
                        >
                          حذف
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'bookings' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">طلبات الحجز</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {bookings.map((booking) => (
                  <div
                    key={booking.id}
                    className={`border rounded-lg p-4 ${
                      booking.status === 'pending'
                        ? 'bg-yellow-50 border-yellow-200'
                        : booking.status === 'approved'
                        ? 'bg-green-50 border-green-200'
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-bold text-lg">{booking.user_name}</span>
                          <span
                            className={`px-2 py-1 rounded text-sm ${
                              booking.status === 'pending'
                                ? 'bg-yellow-200 text-yellow-800'
                                : booking.status === 'approved'
                                ? 'bg-green-200 text-green-800'
                                : 'bg-red-200 text-red-800'
                            }`}
                          >
                            {booking.status === 'pending'
                              ? 'قيد المراجعة'
                              : booking.status === 'approved'
                              ? 'تمت الموافقة'
                              : 'مرفوض'}
                          </span>
                        </div>
                        <div className="space-y-1 text-sm text-gray-700">
                          <p>البريد: {booking.user_email || 'غير متوفر'}</p>
                          <p>الوقت المطلوب: {new Date(booking.requested_time).toLocaleString('ar-SA')}</p>
                          <p>تاريخ الطلب: {new Date(booking.created_at).toLocaleString('ar-SA')}</p>
                          {booking.access_code && (
                            <p className="font-bold text-green-700">الكود: {booking.access_code}</p>
                          )}
                        </div>
                      </div>
                      {booking.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => handleApproveBooking(booking.id, true)}
                          >
                            <CheckCircle className="ml-1 h-4 w-4" />
                            موافقة
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleApproveBooking(booking.id, false)}
                          >
                            <XCircle className="ml-1 h-4 w-4" />
                            رفض
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {bookings.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    لا توجد طلبات حجز حالياً
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'settings' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">إعدادات التطبيق</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="font-bold text-lg mb-1">حالة التطبيق</h3>
                    <p className="text-sm text-gray-600">
                      {appSettings.is_app_open ? 'التطبيق مفتوح للمستخدمين' : 'التطبيق مغلق حالياً'}
                    </p>
                  </div>
                  <Button
                    onClick={() => setAppSettings({ ...appSettings, is_app_open: !appSettings.is_app_open })}
                    className={appSettings.is_app_open ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}
                  >
                    {appSettings.is_app_open ? 'إغلاق التطبيق' : 'فتح التطبيق'}
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label>رسالة الإغلاق</Label>
                  <Textarea
                    value={appSettings.closed_message_ar}
                    onChange={(e) => setAppSettings({ ...appSettings, closed_message_ar: e.target.value })}
                    className="text-right"
                    rows={4}
                    placeholder="الرسالة التي ستظهر للمستخدمين عند إغلاق التطبيق"
                  />
                </div>

                <Button onClick={handleUpdateAppSettings} className="w-full">
                  حفظ الإعدادات
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
