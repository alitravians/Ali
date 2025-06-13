import React, { useState } from 'react'
import { Alert, AlertDescription } from './ui/alert'
import { Button } from './ui/button'
import { X, Megaphone } from 'lucide-react'
import { Badge } from './ui/badge'

interface Announcement {
  id: string
  title: string
  content: string
  created_by: string
  timestamp: string
}

interface AnnouncementBannerProps {
  announcements: Announcement[]
}

export default function AnnouncementBanner({ announcements }: AnnouncementBannerProps) {
  const [dismissedAnnouncements, setDismissedAnnouncements] = useState<Set<string>>(new Set())

  const dismissAnnouncement = (id: string) => {
    setDismissedAnnouncements(prev => new Set([...prev, id]))
  }

  const visibleAnnouncements = announcements.filter(
    announcement => !dismissedAnnouncements.has(announcement.id)
  )

  if (visibleAnnouncements.length === 0) {
    return null
  }

  return (
    <div className="space-y-2 mb-4">
      {visibleAnnouncements.map((announcement) => (
        <Alert key={announcement.id} className="border-blue-200 bg-blue-50">
          <div className="flex items-start justify-between">
            <div className="flex-1 text-right">
              <div className="flex items-center gap-2 mb-2 justify-end">
                <Megaphone className="w-4 h-4 text-blue-600" />
                <h4 className="font-semibold text-blue-800">{announcement.title}</h4>
              </div>
              
              <AlertDescription className="text-blue-700 mb-2">
                {announcement.content}
              </AlertDescription>
              
              <div className="flex items-center gap-2 justify-end">
                <Badge variant="secondary" className="text-xs">
                  بواسطة: {announcement.created_by}
                </Badge>
                <span className="text-xs text-blue-600">
                  {new Date(announcement.timestamp).toLocaleString('ar')}
                </span>
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => dismissAnnouncement(announcement.id)}
              className="text-blue-600 hover:text-blue-800"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </Alert>
      ))}
    </div>
  )
}
