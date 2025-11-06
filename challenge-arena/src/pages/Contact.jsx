import { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Mail, Phone, MessageCircle } from 'lucide-react';

export default function Contact() {
  const { language } = useLanguage();
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) return;
    
    console.log('Contact form submitted:', form);
    setSubmitted(true);
    setForm({ name: '', email: '', message: '' });
    
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <section className="container mx-auto px-4 mt-10">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border border-slate-200 dark:border-slate-700">
          <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">
            {language === 'ar' ? 'تواصل معنا' : 'Contact Us'}
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-slate-50 dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600">
                <Mail className="text-blue-600 dark:text-cyan-400 mt-1" size={20} />
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
                    {language === 'ar' ? 'البريد الإلكتروني' : 'Email'}
                  </h3>
                  <a 
                    href="mailto:admin@challenger.example" 
                    className="text-blue-600 dark:text-cyan-400 hover:underline"
                  >
                    admin@challenger.example
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-slate-50 dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600">
                <Phone className="text-blue-600 dark:text-cyan-400 mt-1" size={20} />
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
                    {language === 'ar' ? 'الهاتف' : 'Phone'}
                  </h3>
                  <a 
                    href="tel:+97300000000" 
                    className="text-blue-600 dark:text-cyan-400 hover:underline"
                  >
                    +973 0000 0000
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-slate-50 dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600">
                <MessageCircle className="text-blue-600 dark:text-cyan-400 mt-1" size={20} />
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
                    {language === 'ar' ? 'واتساب' : 'WhatsApp'}
                  </h3>
                  <a 
                    href="https://wa.me/97300000000" 
                    className="text-blue-600 dark:text-cyan-400 hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {language === 'ar' ? 'تواصل عبر واتساب' : 'Contact via WhatsApp'}
                  </a>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  {language === 'ar' ? 'الاسم' : 'Name'}
                </label>
                <input 
                  type="text"
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-cyan-500 outline-none"
                  value={form.name}
                  onChange={e => setForm({...form, name: e.target.value})}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  {language === 'ar' ? 'البريد الإلكتروني' : 'Email'}
                </label>
                <input 
                  type="email"
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-cyan-500 outline-none"
                  value={form.email}
                  onChange={e => setForm({...form, email: e.target.value})}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  {language === 'ar' ? 'الرسالة' : 'Message'}
                </label>
                <textarea 
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-cyan-500 outline-none resize-none"
                  rows="4"
                  value={form.message}
                  onChange={e => setForm({...form, message: e.target.value})}
                  required
                />
              </div>

              <button 
                type="submit"
                className="w-full px-4 py-2 rounded-lg bg-blue-600 dark:bg-purple-600 hover:bg-blue-700 dark:hover:bg-purple-700 text-white font-medium transition-colors"
              >
                {language === 'ar' ? 'إرسال' : 'Send'}
              </button>

              {submitted && (
                <div className="p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-300 text-center">
                  {language === 'ar' ? 'تم إرسال رسالتك بنجاح!' : 'Your message has been sent successfully!'}
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
