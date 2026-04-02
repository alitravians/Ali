import { MessageSquare, Heart } from "lucide-react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-white" />
              </div>
              <span className="text-white font-bold">AI Message Assistant</span>
            </div>
            <p className="text-sm text-gray-400">
              Smart AI-powered message analysis and response generation.
              Understand messages better and reply with confidence.
            </p>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Quick Links</h3>
            <div className="space-y-2">
              <Link to="/analyze" className="block text-sm hover:text-indigo-400 transition-colors">
                Analyze Messages
              </Link>
              <Link to="/history" className="block text-sm hover:text-indigo-400 transition-colors">
                Analysis History
              </Link>
              <Link to="/how-to-use" className="block text-sm hover:text-indigo-400 transition-colors">
                How to Use
              </Link>
              <Link to="/rules" className="block text-sm hover:text-indigo-400 transition-colors">
                Rules & Terms
              </Link>
            </div>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">About</h3>
            <div className="space-y-2">
              <Link to="/about" className="block text-sm hover:text-indigo-400 transition-colors">
                About Us
              </Link>
              <Link to="/contact" className="block text-sm hover:text-indigo-400 transition-colors">
                Contact Us
              </Link>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-500">
          <p className="flex items-center justify-center gap-1">
            Made with <Heart className="w-3 h-3 text-red-400" /> AI Message Assistant
          </p>
          <p className="mt-1">&copy; {new Date().getFullYear()} All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
