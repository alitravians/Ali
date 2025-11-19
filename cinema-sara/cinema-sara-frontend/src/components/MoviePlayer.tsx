import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LogOut, Users, Clock, Play } from 'lucide-react'

type Screen = 'home' | 'book' | 'status' | 'rules' | 'player' | 'admin' | 'code-login'

interface MoviePlayerProps {
  sessionData: any
  navigateTo: (screen: Screen) => void
  onLogout: () => void
}

export default function MoviePlayer({ sessionData, onLogout }: MoviePlayerProps) {
  const [countdown, setCountdown] = useState(60)
  const [isPlaying, setIsPlaying] = useState(false)

  useEffect(() => {
    if (countdown > 0 && !isPlaying) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1)
      }, 1000)
      return () => clearTimeout(timer)
    } else if (countdown === 0 && !isPlaying) {
      setIsPlaying(true)
    }
  }, [countdown, isPlaying])

  const { movie, code_info } = sessionData

  const getVideoEmbedUrl = (url: string) => {
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      const videoId = url.includes('youtu.be') 
        ? url.split('youtu.be/')[1]?.split('?')[0]
        : url.split('v=')[1]?.split('&')[0]
      return `https://www.youtube.com/embed/${videoId}?autoplay=1&controls=1`
    }
    return url
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4" dir="rtl">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <Button
            onClick={onLogout}
            variant="ghost"
            className="text-white"
          >
            <LogOut className="ml-2 h-5 w-5" />
            خروج
          </Button>
          <div className="flex items-center gap-4 text-white">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              <span>{code_info.current_users} / {code_info.max_users}</span>
            </div>
          </div>
        </div>

        {!isPlaying ? (
          <Card className="max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl mb-4">{movie.title_ar}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <div className="mb-6">
                  <Clock className="h-16 w-16 mx-auto text-purple-600 mb-4" />
                  <p className="text-xl text-gray-700 mb-2">سيبدأ الفيلم خلال</p>
                  <div className="text-6xl font-bold text-purple-600">
                    {countdown}
                  </div>
                  <p className="text-lg text-gray-600 mt-2">ثانية</p>
                </div>

                <div className="bg-blue-50 rounded-lg p-6 space-y-3">
                  <h3 className="font-bold text-lg">معلومات الجلسة</h3>
                  <div className="text-right space-y-2">
                    <p className="text-gray-700">
                      <span className="font-semibold">الفيلم:</span> {movie.title_ar}
                    </p>
                    <p className="text-gray-700">
                      <span className="font-semibold">المدة:</span> {movie.duration} دقيقة
                    </p>
                    <p className="text-gray-700">
                      <span className="font-semibold">النوع:</span> {movie.genre}
                    </p>
                    <p className="text-gray-700">
                      <span className="font-semibold">المشاهدون الحاليون:</span> {code_info.current_users} / {code_info.max_users}
                    </p>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <p className="text-yellow-800">
                    تأكد من أن جميع أصدقائك قد دخلوا قبل بدء الفيلم
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Play className="h-6 w-6" />
                  {movie.title_ar}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-video w-full bg-black rounded-lg overflow-hidden">
                  <iframe
                    src={getVideoEmbedUrl(movie.video_url)}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-bold mb-2">عن الفيلم</h3>
                  <p className="text-gray-700">{movie.description_ar}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
