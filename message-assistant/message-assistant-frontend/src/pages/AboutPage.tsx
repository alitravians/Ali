import {
  MessageSquare,
  Brain,
  Target,
  Globe,
  Sparkles,
  Shield,
  Zap,
  Heart,
} from "lucide-react";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-10">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10">
          <div className="w-14 h-14 mx-auto bg-indigo-100 rounded-2xl flex items-center justify-center mb-4">
            <MessageSquare className="w-7 h-7 text-indigo-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">About AI Message Assistant</h1>
          <p className="text-gray-600">Intelligent communication made simple</p>
        </div>

        <div className="space-y-6">
          {/* Mission */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Target className="w-5 h-5 text-indigo-600" />
              Our Mission
            </h2>
            <p className="text-gray-700 text-sm leading-relaxed">
              AI Message Assistant was created to help users who communicate frequently in English,
              especially through platforms like Discord. Our goal is to bridge the language gap and
              provide intelligent assistance in understanding, analyzing, and responding to messages
              with confidence and professionalism.
            </p>
          </div>

          {/* What We Do */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-600" />
              What We Do
            </h2>
            <p className="text-gray-700 text-sm leading-relaxed mb-4">
              We use advanced AI technology to analyze incoming messages and provide:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { icon: Sparkles, text: "Smart message classification" },
                { icon: Shield, text: "Sensitivity detection" },
                { icon: Globe, text: "EN/AR translation" },
                { icon: Zap, text: "Priority assessment" },
                { icon: Heart, text: "Tone-matched replies" },
                { icon: Brain, text: "Context understanding" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-lg p-3">
                  <item.icon className="w-4 h-4 text-indigo-500" />
                  <span className="text-sm text-gray-700">{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Technology */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Zap className="w-5 h-5 text-cyan-600" />
              Technology
            </h2>
            <p className="text-gray-700 text-sm leading-relaxed mb-3">
              AI Message Assistant is built with modern web technologies and powered by OpenAI's GPT models:
            </p>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-2 flex-shrink-0" />
                <strong>Frontend:</strong> React with TypeScript and Tailwind CSS for a fast, responsive UI
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-2 flex-shrink-0" />
                <strong>Backend:</strong> FastAPI (Python) for reliable API processing
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-2 flex-shrink-0" />
                <strong>AI Engine:</strong> OpenAI GPT-4o-mini for intelligent analysis and response generation
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-2 flex-shrink-0" />
                <strong>Privacy:</strong> Your API key stays in your browser. Messages are processed via OpenAI and not stored on our servers.
              </li>
            </ul>
          </div>

          {/* Who Is It For */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Globe className="w-5 h-5 text-indigo-600" />
              Who Is It For?
            </h2>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-2 flex-shrink-0" />
                People who communicate frequently in English and want to respond more confidently
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-2 flex-shrink-0" />
                Discord users who receive many messages and need help prioritizing
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-2 flex-shrink-0" />
                Anyone who wants AI help in crafting professional, appropriate responses
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-2 flex-shrink-0" />
                Non-native English speakers looking to improve their communication
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
