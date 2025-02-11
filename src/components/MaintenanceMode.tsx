import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import axios from 'axios'

interface MaintenanceStatus {
  is_enabled: boolean
  message: string | null
  start_time: string | null
  end_time: string | null
  allow_admin_access: boolean
}

export function MaintenanceMode() {
  const [isOpen, setIsOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    const checkMaintenance = async () => {
      try {
        const response = await axios.get<MaintenanceStatus>(
          `${import.meta.env.VITE_API_URL}/admin/maintenance/status`
        )
        if (response.data.is_enabled) {
          setMessage(response.data.message || 'النظام تحت الصيانة حالياً')
          setIsOpen(true)
          setError(null)
        } else {
          setIsOpen(false)
        }
      } catch (err) {
        console.error('Error checking maintenance status:', err)
        setError('فشل في التحقق من حالة الصيانة')
      }
    }
    
    checkMaintenance()
    const interval = setInterval(checkMaintenance, 30000)
    return () => clearInterval(interval)
  }, [])
  
  if (!isOpen && !error) return null
  
  return (
    <Dialog open={isOpen || !!error} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-center">
            {error ? 'خطأ في النظام' : 'تنبيه الصيانة'}
          </DialogTitle>
        </DialogHeader>
        <div className="p-6 text-center">
          <p className={`text-lg ${error ? 'text-red-500' : 'text-gray-600'}`}>
            {error || message}
          </p>
          {error && (
            <button
              onClick={() => setError(null)}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              إغلاق
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
