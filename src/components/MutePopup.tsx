import { Dialog, DialogContent } from './ui/dialog'

interface MutePopupProps {
  isOpen: boolean
  onClose: () => void
  reason: string
  duration: number
}

export default function MutePopup({ isOpen, onClose, reason, duration }: MutePopupProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[200px] h-[100px] p-2 text-xs rtl-text" dir="rtl">
        <div className="text-red-500 font-bold text-center">
          <div className="mb-1">تم كتمك!</div>
          <div className="mb-1">السبب: {reason}</div>
          <div>المدة: {duration} دقيقة</div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
