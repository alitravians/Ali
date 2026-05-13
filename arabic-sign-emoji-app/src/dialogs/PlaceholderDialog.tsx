import type { ReactNode } from "react";
import Dialog from "../components/Dialog";

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  icon?: ReactNode;
  description: string;
  comingInPr: string;
}

export default function PlaceholderDialog({
  open,
  onClose,
  title,
  icon,
  description,
  comingInPr,
}: Props) {
  return (
    <Dialog open={open} onClose={onClose} title={title} icon={icon}>
      <div className="text-purple-100 space-y-3 text-sm leading-relaxed">
        <p>{description}</p>
        <div className="bg-yellow-500/20 border border-yellow-400/40 text-yellow-100 rounded-lg p-3">
          هذه الميزة قيد التطوير وسيتم إصدارها في <strong>{comingInPr}</strong>.
        </div>
      </div>
    </Dialog>
  );
}
