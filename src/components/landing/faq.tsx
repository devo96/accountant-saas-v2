"use client";

import { useState } from "react";

const faqs = [
  { q: "هل البرنامج متوافق مع متطلبات الفوترة الإلكترونية (زاتكا)؟", a: "نعم، برنامج قيود متوافق تماماً مع متطلبات هيئة الزكاة والضريبة والجمارك للمرحلة الثانية من الفوترة الإلكترونية، ويدعم إصدار الفواتير الإلكترونية مع رمز QR والتوقيع الإلكتروني." },
  { q: "هل بياناتي المالية آمنة ومحفوظة؟", a: "جميع بياناتك مشفرة ومحفوظة على خوادم آمنة وفق أعلى معايير الأمان العالمية. نقوم بعمل نسخ احتياطية يومية لضمان عدم فقدان أي من بياناتك." },
  { q: "هل يمكنني نقل بياناتي من برنامج محاسبي آخر؟", a: "نعم، نوفر خدمة ترحيل البيانات من البرامج المحاسبية الأخرى مثل Excel و QuickBooks و Odoo. يمكنك التواصل مع فريق الدعم الفني لمساعدتك في عملية الترحيل." },
  { q: "هل توفرون دعماً فنياً وتدريباً مجانياً؟", a: "نعم، نوفر دعماً فنياً مجانياً عبر البريد الإلكتروني والواتساب خلال فترة التجربة. كما نوفر جلسات تدريبية عن بعد لمساعدتك على البدء." },
];

export function LandingFAQ() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section id="faq" className="py-20 bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">الأسئلة الأكثر شيوعاً</h2>
        </div>
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <button onClick={() => setOpen(open === i ? null : i)} className="w-full flex items-center justify-between p-5 text-right">
                <span className="text-sm font-bold text-gray-900">{faq.q}</span>
                <span className={`text-gray-400 transition-transform duration-300 ${open === i ? "rotate-180" : ""}`}>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </span>
              </button>
              <div className={`transition-all duration-300 overflow-hidden ${open === i ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}>
                <p className="px-5 pb-5 text-sm text-gray-600 leading-relaxed">{faq.a}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
