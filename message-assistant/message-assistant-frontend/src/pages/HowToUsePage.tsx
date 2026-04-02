import {
  ClipboardPaste,
  Send,
  Eye,
  Copy,
  Settings,
  MessageSquare,
  Sparkles,
  AlertTriangle,
  Languages,
  Wand2,
  CheckCircle,
} from "lucide-react";

const steps = [
  {
    icon: Settings,
    title: "Step 1: Set Up Your API Key",
    description:
      'Click the "Settings" (key icon) in the navigation bar and enter your OpenAI API key. You only need to do this once - the key is saved in your browser.',
    tip: "Get your API key from platform.openai.com/api-keys",
    color: "from-gray-500 to-gray-600",
  },
  {
    icon: ClipboardPaste,
    title: "Step 2: Paste Your Message",
    description:
      'Go to the "Analyze" page and paste the message or conversation you received. Choose "Single Message" for one message or "Full Conversation" for a multi-message thread.',
    tip: "You can paste messages from Discord, email, or any text source",
    color: "from-blue-500 to-indigo-500",
  },
  {
    icon: Send,
    title: 'Step 3: Click "Analyze"',
    description:
      "Press the Analyze button and wait a few seconds. The AI will process the message and provide a detailed analysis.",
    tip: 'Use "Clean Up Text" first if the message has formatting issues',
    color: "from-indigo-500 to-purple-500",
  },
  {
    icon: Eye,
    title: "Step 4: Read the Analysis",
    description:
      "Review the classification results: message type, priority, sentiment, whether it needs a reply, and a plain-language explanation of what the message means.",
    tip: "Pay attention to research and sensitivity warnings",
    color: "from-purple-500 to-pink-500",
  },
  {
    icon: Copy,
    title: "Step 5: Use the Suggested Reply",
    description:
      'If the message needs a reply, you\'ll see a suggested response. Click "Copy Reply" to copy it, or use the style buttons to generate different versions (formal, friendly, brief, etc.).',
    tip: "You can also edit the reply directly before copying",
    color: "from-pink-500 to-red-500",
  },
];

export default function HowToUsePage() {
  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-10">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10">
          <div className="w-14 h-14 mx-auto bg-indigo-100 rounded-2xl flex items-center justify-center mb-4">
            <MessageSquare className="w-7 h-7 text-indigo-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">How to Use</h1>
          <p className="text-gray-600">A simple guide to get the most out of AI Message Assistant</p>
        </div>

        {/* Steps */}
        <div className="space-y-6 mb-12">
          {steps.map((step, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 bg-gradient-to-br ${step.color} rounded-xl flex items-center justify-center flex-shrink-0 shadow-md`}>
                  <step.icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-gray-700 text-sm leading-relaxed mb-3">{step.description}</p>
                  <div className="bg-indigo-50 rounded-lg px-3 py-2 border border-indigo-100">
                    <p className="text-xs text-indigo-600 font-medium">
                      <Sparkles className="w-3 h-3 inline mr-1" />
                      Tip: {step.tip}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Additional Features */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Features</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <Languages className="w-5 h-5 text-emerald-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-800">Translation</p>
                <p className="text-xs text-gray-600">Translate messages or replies between English and Arabic</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Wand2 className="w-5 h-5 text-purple-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-800">Text Cleanup</p>
                <p className="text-xs text-gray-600">Clean up messy or poorly formatted text before analysis</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-indigo-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-800">8 Reply Styles</p>
                <p className="text-xs text-gray-600">Brief, Professional, Formal, Friendly, Technical, Polite, Direct, Firm</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-800">Sensitivity Alerts</p>
                <p className="text-xs text-gray-600">Get warned when a message needs careful handling</p>
              </div>
            </div>
          </div>
        </div>

        {/* When to Trust */}
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">When to Trust vs. Review Manually</h2>
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-gray-700">
                <strong>Trust the reply</strong> for casual conversations, simple inquiries, and general greetings.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-gray-700">
                <strong>Review manually</strong> when the system flags the message as sensitive, when the confidence is low, or for important professional communications.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-gray-700">
                <strong>Always review</strong> replies to complaints, technical questions requiring expertise, and messages where research was recommended.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
