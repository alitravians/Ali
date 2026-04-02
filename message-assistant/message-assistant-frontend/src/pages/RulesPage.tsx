import {
  BookOpen,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Shield,
} from "lucide-react";

export default function RulesPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-10">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10">
          <div className="w-14 h-14 mx-auto bg-indigo-100 rounded-2xl flex items-center justify-center mb-4">
            <BookOpen className="w-7 h-7 text-indigo-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Rules & Terms of Use</h1>
          <p className="text-gray-600">Please read these guidelines before using the service</p>
        </div>

        <div className="space-y-6">
          {/* How It Works */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-indigo-600" />
              How the Service Works
            </h2>
            <ul className="space-y-3 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-2 flex-shrink-0" />
                This service uses AI (OpenAI GPT) to analyze messages and suggest replies.
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-2 flex-shrink-0" />
                Messages are sent to OpenAI's API for processing. They are not stored on our servers.
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-2 flex-shrink-0" />
                Your API key is stored locally in your browser and is only used to communicate with OpenAI.
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-2 flex-shrink-0" />
                Analysis history is saved in your browser's local storage.
              </li>
            </ul>
          </div>

          {/* Allowed Usage */}
          <div className="bg-white rounded-2xl border border-green-200 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-green-800 mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Allowed Usage
            </h2>
            <ul className="space-y-3 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                Analyzing messages to understand their meaning and context.
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                Getting help with English message replies for personal or professional use.
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                Translating messages between English and Arabic.
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                Improving the quality and clarity of your text.
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                Using the tool to learn and improve your English communication skills.
              </li>
            </ul>
          </div>

          {/* Not Allowed */}
          <div className="bg-white rounded-2xl border border-red-200 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-red-800 mb-4 flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-600" />
              Prohibited Usage
            </h2>
            <ul className="space-y-3 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                Using the service to generate spam, harassment, or abusive content.
              </li>
              <li className="flex items-start gap-2">
                <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                Entering sensitive personal information (passwords, credit card numbers, etc.).
              </li>
              <li className="flex items-start gap-2">
                <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                Using AI-generated replies to deceive or manipulate others.
              </li>
              <li className="flex items-start gap-2">
                <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                Attempting to bypass AI safety measures or generate harmful content.
              </li>
              <li className="flex items-start gap-2">
                <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                Sharing your API key with others or using stolen API keys.
              </li>
            </ul>
          </div>

          {/* User Responsibility */}
          <div className="bg-white rounded-2xl border border-amber-200 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-amber-800 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              User Responsibility
            </h2>
            <ul className="space-y-3 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-2 flex-shrink-0" />
                You are fully responsible for the messages you input and the replies you send.
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-2 flex-shrink-0" />
                Always review AI-suggested replies before sending them, especially for sensitive topics.
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-2 flex-shrink-0" />
                AI suggestions are not guaranteed to be perfect. Use your judgment.
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-2 flex-shrink-0" />
                You are responsible for your own OpenAI API key and any charges incurred.
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-2 flex-shrink-0" />
                The service is provided as-is without warranties of any kind.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
