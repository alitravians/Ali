import * as React from "react"
import { useTranslation } from 'react-i18next'
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Link } from "react-router-dom"
import { LanguageSwitcher } from "@/components/LanguageSwitcher"

interface Trend {
  id: string
  first_name: string
  middle_name?: string
  last_name: string
  reason: string
  status: string
}

export default function AcceptedRejectedTrends() {
  const { t } = useTranslation()
  const [trends, setTrends] = React.useState<Trend[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState("")

  React.useEffect(() => {
    const fetchTrends = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/trend-requests`)
        if (response.ok) {
          const data = await response.json()
          const filteredTrends = data.requests.filter((trend: Trend) => 
            trend.status === "approved" || trend.status === "rejected"
          )
          setTrends(filteredTrends)
        } else {
          setError(t('fetchError'))
        }
      } catch (err) {
        setError(t('networkError'))
      } finally {
        setLoading(false)
      }
    }

    fetchTrends()
    const interval = setInterval(fetchTrends, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold">{t('acceptedRejectedTrendsTitle')}</h1>
              <div className="flex gap-2 items-center">
                <Link to="/">
                  <Button variant="outline">{t('submitNewRequestButton')}</Button>
                </Link>
                <LanguageSwitcher />
              </div>
            </div>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              </div>
            ) : error ? (
              <div className="text-red-500 text-center py-4">{error}</div>
            ) : trends.length === 0 ? (
              <div className="text-gray-500 text-center py-4">{t('noTrendsMessage')}</div>
            ) : (
              <div className="space-y-4">
                {trends.map((trend) => (
                  <div key={trend.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">
                          {trend.first_name} {trend.middle_name ? `${trend.middle_name} ` : ''}{trend.last_name}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">{trend.reason}</p>
                      </div>
                      <Badge className={
                        trend.status === "approved" 
                          ? "bg-green-100 text-green-800" 
                          : trend.status === "rejected"
                          ? "bg-orange-100 text-orange-800"
                          : "bg-red-100 text-red-800"
                      }>
                        {trend.status === "under_review" 
                          ? t('underReviewStatus')
                          : trend.status === "approved" 
                            ? t('approvedStatus')
                            : t('rejectedStatus')}
                      </Badge>
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
