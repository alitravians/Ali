import Link from "next/link";

const faqs = [
  {
    q: "هل المنصة مجانية بالكامل؟",
    a: "نعم، استخدام تفوّقي مجاني للطالبات. تسجيل الحساب وحلّ كل الاختبارات بدون أي رسوم.",
  },
  {
    q: "هل المحتوى متوافق مع منهاج سوريا؟",
    a: "نعم، أُعدّت الأسئلة لتغطّي مواضيع الرياضيات للصف العاشر بحسب المنهاج الرسمي السوري: الجبر، الهندسة، المعادلات، الكسور، الإحصاء، الاحتمالات، والاقترانات.",
  },
  {
    q: "كم يستغرق كل اختبار؟",
    a: "معظم الاختبارات قصيرة من ٥ إلى ١٠ أسئلة، وتستغرق بين دقيقتين و٤ دقائق. يمكنكِ التدرّب يومياً بسهولة.",
  },
  {
    q: "هل أحصل على شرح للأخطاء؟",
    a: "نعم! بعد كل اختبار ستظهر لكِ الإجابة الصحيحة وشرح مبسّط لكل سؤال أخطأتِ فيه، إضافة إلى اقتراحات للأقسام التي تحتاج مزيداً من التدريب.",
  },
  {
    q: "كيف أحصل على شهادة؟",
    a: "بعد إتمام ٣ اختبارات في قسم واحد بمعدل ٧٠٪ تحصلين على شهادة إتمام للقسم. وبإتمام ٥ اختبارات في فصل كامل بمعدل ٧٥٪ تحصلين على شهادة الفصل.",
  },
  {
    q: "هل يمكنني استخدام المنصة على الجوال؟",
    a: "نعم، تصميم تفوّقي متجاوب بالكامل ويعمل على الجوال والكمبيوتر اللوحي والحاسوب.",
  },
  {
    q: "هل ستُضاف مواد أخرى مستقبلاً؟",
    a: "نعم، نخطط لإضافة الصف ١١ والبكالوريا، إضافة لمواد أخرى مثل الفيزياء والكيمياء، وكذلك تطبيق جوال خاص.",
  },
];

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-4xl font-black text-violet-900 dark:text-violet-100 mb-2">عن تفوّقي</h1>
      <p className="text-violet-600/85 dark:text-violet-300/80 leading-relaxed">
        تفوّقي منصة عربية ذكية ومجانية لاختبارات الرياضيات القصيرة، مخصّصة لطالبات الصف العاشر في الجمهورية العربية السورية.
        فكرتنا بسيطة: بدل ساعات الدراسة الطويلة، نقدّم اختبارات قصيرة (٢-٤ دقائق) تساعدكِ على فهم المادة عبر التدرّب المستمر وتلقّي تقييم فوري مع شرح الأخطاء.
      </p>

      <section className="mt-8 grid sm:grid-cols-3 gap-3">
        {[
          { icon: "🎯", title: "أسلوب ذكي", text: "نرصد نقاط ضعفكِ ونقترح تدريبات إضافية" },
          { icon: "📚", title: "بنك أسئلة", text: "أسئلة متنوّعة لا تتكرر بنفس الترتيب" },
          { icon: "💯", title: "تحفيز", text: "نقاط، شارات، مستويات، وشهادات إنجاز" },
        ].map((f, i) => (
          <div key={i} className="card p-5">
            <div className="text-3xl mb-2">{f.icon}</div>
            <div className="font-bold text-violet-900 dark:text-violet-100">{f.title}</div>
            <div className="text-sm text-violet-600/80 dark:text-violet-300/70 mt-1">{f.text}</div>
          </div>
        ))}
      </section>

      <section id="faq" className="mt-12">
        <h2 className="text-2xl font-extrabold text-violet-900 dark:text-violet-100 mb-3">الأسئلة الشائعة</h2>
        <div className="space-y-2">
          {faqs.map((f, i) => (
            <details key={i} className="card p-4 group">
              <summary className="font-bold text-violet-900 dark:text-violet-100 cursor-pointer list-none flex justify-between items-center">
                <span>{f.q}</span>
                <span className="text-violet-400 group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="mt-3 text-violet-700 dark:text-violet-200 leading-relaxed">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section id="contact" className="mt-12">
        <h2 className="text-2xl font-extrabold text-violet-900 dark:text-violet-100 mb-3">الدعم والتواصل</h2>
        <div className="card p-5">
          <p className="text-violet-700 dark:text-violet-200">
            هل لديكِ استفسار، اقتراح، أو ملاحظة على سؤال معين؟ تواصلي معنا — نحن نقرأ كل رسالة!
          </p>
          <div className="mt-3 text-sm text-violet-600 dark:text-violet-300/80">
            البريد الإلكتروني: <a href="mailto:hello@tafawqi.app" className="font-bold hover:underline" dir="ltr">hello@tafawqi.app</a>
          </div>
          <div className="mt-1 text-sm text-violet-600 dark:text-violet-300/80">
            للمشرفات والمدارس: <Link href="/admin" className="font-bold hover:underline">لوحة إدارة المحتوى</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
