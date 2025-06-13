import React, { useState } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Send } from 'lucide-react'
import { Alert, AlertDescription } from './ui/alert'
import { arabicTranslations } from '../lib/arabic'
import MutePopup from './MutePopup'

interface MessageInputProps {
  onSendMessage: (message: string) => Promise<void>
}

export default function MessageInput({ onSendMessage }: MessageInputProps) {
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [isMutePopupOpen, setIsMutePopupOpen] = useState(false)
  const [muteInfo, setMuteInfo] = useState({ reason: '', duration: 0 })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!message.trim()) return
    
    setSending(true)
    setError('')
    
    try {
      await onSendMessage(message.trim())
      setMessage('')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'فشل في إرسال الرسالة'
      
      try {
        const muteData = JSON.parse(errorMessage)
        if (muteData.type === 'muted') {
          setMuteInfo({
            reason: muteData.reason || 'مخالفة قواعد الدردشة',
            duration: muteData.duration_minutes || 0
          })
          setIsMutePopupOpen(true)
          return
        }
      } catch {
      }
      
      setError(errorMessage)
    } finally {
      setSending(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <div className="space-y-2">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={arabicTranslations.typeMessage}
          disabled={sending}
          className="flex-1 arabic-input"
          maxLength={500}
        />
        <Button type="submit" disabled={sending || !message.trim()}>
          <Send className="w-4 h-4" />
          {sending ? arabicTranslations.sending : arabicTranslations.send}
        </Button>
      </form>
      
      <div className="text-xs text-gray-500 rtl-text">
        {message.length}/500 {arabicTranslations.charactersRemaining}
      </div>
      
      <MutePopup
        isOpen={isMutePopupOpen}
        onClose={() => setIsMutePopupOpen(false)}
        reason={muteInfo.reason}
        duration={muteInfo.duration}
      />
    </div>
  )
}
