import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { AlertTriangle } from 'lucide-react'

interface MaintenancePageProps {
  message?: string
}

export default function MaintenancePage({ message }: MaintenancePageProps) {
  const defaultMessage = "الموقع تحت الصيانة حالياً. نعتذر عن الإزعاج وسنعود قريباً."

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <AlertTriangle className="h-16 w-16 text-yellow-500" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            صيانة الموقع
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <p className="text-gray-700 leading-relaxed" dir="rtl">
              {message || defaultMessage}
            </p>
          </div>
          <div className="text-sm text-gray-500">
            <p>شكراً لصبركم وتفهمكم</p>
            <p className="mt-2">فريق الإدارة</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
