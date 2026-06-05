"use client";

import { useState } from "react";

const plans = [
  {
    name: "الباقة الأساسية",
    tier: "starter",
    monthly: 99,
    yearly: 949,
    desc: "للشركات الناشئة والمحاسبين المستقلين",
    popular: false,
    features: ["مستخدم واحد", "50 فاتورة/شهر", "فرع واحد", "تقارير أساسية", "دعم فني عبر البريد"],
  },
  {
    name: "الباقة المتقدمة",
    tier: "professional",
    monthly: 249,
    yearly: 2389,
    desc: "للشركات المتنامية",
    popular: true,
    features: ["5 مستخدمين", "فاتورة غير محدود", "3 فروع", "جميع التقارير", "دعم فني عبر البريد والواتساب"],
  },
  {
    name: "باقة الشركات",
    tier: "enterprise",
    monthly: 0,
    yearly: 0,
    desc: "للشركات الكبيرة والمجموعات",
    popular: false,
    features: ["مستخدمين غير محدود", "فواتير غير محدود", "فروع غير محدود", "تكاملات مخصصة", "مدير حساب مخصص"],
  },
];

export function LandingPricing() {
  const [yearly, setYearly] = useState(false);

  return (
    <section id="pricing" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">الباقات والأسعار</h2>
          <p className="text-lg text-gray-600">اختر الباقة المناسبة لشركتك</p>
          <div className="flex items-center justify-center gap-3 mt-6">
            <span className={`text-sm font-medium ${!yearly ? "text-gray-900" : "text-gray-400"}`}>شهري</span>
            <button onClick={() => setYearly(!yearly)} className={`relative w-14 h-7 rounded-full transition-colors ${yearly ? "bg-primary-600" : "bg-gray-300"}`}>
              <span className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-all ${yearly ? "translate-x-7" : "translate-x-0.5"} ${yearly ? "right-0.5" : "left-0.5"}`} />
            </button>
            <span className={`text-sm font-medium ${yearly ? "text-gray-900" : "text-gray-400"}`}>سنوي <span className="text-green-600 text-xs bg-green-50 px-2 py-0.5 rounded-full">وفر 20%</span></span>
          </div>
        </div>
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan, i) => (
            <div key={i} className={`relative p-6 rounded-2xl border-2 transition-all ${plan.popular ? "border-primary-500 shadow-xl shadow-primary-100" : "border-gray-200 hover:border-primary-200"}`}>
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary-600 text-white text-[10px] font-bold px-4 py-1 rounded-full">الأكثر طلباً</span>
              )}
              {plan.tier === "enterprise" ? (
                <>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">{plan.name}</h3>
                  <p className="text-sm text-gray-500 mb-4">{plan.desc}</p>
                  <p className="text-3xl font-bold text-gray-900 mb-4">مخصص</p>
                  <ul className="space-y-2 mb-6 text-sm">
                    {plan.features.map((f, j) => (
                      <li key={j} className="flex items-center gap-2 text-gray-700"><span className="text-green-500 text-lg">✓</span>{f}</li>
                    ))}
                  </ul>
                  <a href="/ar/register" className="block w-full py-2.5 text-center text-sm font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-xl transition-colors">تواصل معنا</a>
                </>
              ) : (
                <>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">{plan.name}</h3>
                  <p className="text-sm text-gray-500 mb-4">{plan.desc}</p>
                  <p className="text-3xl font-bold text-gray-900 mb-1">
                    ﷼ {yearly ? plan.yearly.toLocaleString() : plan.monthly}
                    <span className="text-sm font-normal text-gray-400">/{yearly ? "سنة" : "شهر"}</span>
                  </p>
                  {yearly && <p className="text-xs text-green-600 mb-4">﷼ {plan.monthly}/شهر عند الدفع السنوي</p>}
                  <ul className="space-y-2 mb-6 text-sm mt-4">
                    {plan.features.map((f, j) => (
                      <li key={j} className="flex items-center gap-2 text-gray-700"><span className="text-green-500 text-lg">✓</span>{f}</li>
                    ))}
                  </ul>
                  <a href="/ar/register" className={`block w-full py-2.5 text-center text-sm font-medium rounded-xl transition-colors ${plan.popular ? "text-white bg-primary-600 hover:bg-primary-700" : "text-primary-600 bg-primary-50 hover:bg-primary-100"}`}>اشترك الآن</a>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
