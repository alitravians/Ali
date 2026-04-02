import { useState, useEffect } from "react";
import { MessageSquare } from "lucide-react";

interface Props {
  onComplete: () => void;
}

export default function LoadingScreen({ onComplete }: Props) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(onComplete, 300);
          return 100;
        }
        return prev + 2;
      });
    }, 30);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-800 flex items-center justify-center z-50">
      <div className="text-center space-y-8">
        {/* Logo */}
        <div className="relative">
          <div className="w-20 h-20 mx-auto bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center animate-pulse">
            <MessageSquare className="w-10 h-10 text-white" />
          </div>
          <div className="absolute -inset-4 bg-indigo-500/20 rounded-3xl blur-xl animate-pulse" />
        </div>

        {/* Title */}
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">AI Message Assistant</h1>
          <p className="text-indigo-200 text-sm">Intelligent message analysis & response generation</p>
        </div>

        {/* Progress Bar */}
        <div className="w-64 mx-auto">
          <div className="bg-white/10 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full transition-all duration-100 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-indigo-300 text-xs mt-2">{progress}%</p>
        </div>
      </div>
    </div>
  );
}
