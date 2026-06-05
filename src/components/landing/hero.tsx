export function LandingHero() {
  return (
    <section className="pt-32 pb-20 md:pt-40 md:pb-28 bg-gradient-to-b from-primary-50/50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
            أدر حركاتك المالية ومحاسبة شركتك<br />
            <span className="text-primary-600">بكل سهولة وأمان</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto mb-10 leading-relaxed">
            برنامج محاسبي سحابي متكامل يغنيك عن الدفاتر المعقدة، متوافق تماماً مع متطلبات هيئة الزكاة والضريبة والجمارك &quot;زاتكا&quot;
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="/ar/register" className="inline-flex items-center px-8 py-3.5 text-base font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-xl shadow-lg shadow-primary-600/25 transition-all hover:shadow-xl hover:shadow-primary-600/30">
              ابدأ تجربتك المجانية الآن
              <span className="mr-2 text-primary-200 text-sm">(بدون بطاقة ائتمانية)</span>
            </a>
            <a href="#demo" className="inline-flex items-center px-8 py-3.5 text-base font-medium text-primary-600 bg-white border-2 border-primary-200 hover:border-primary-300 rounded-xl transition-all">
              احجز عرض توضيحي
            </a>
          </div>
        </div>
        <div className="mt-16 relative">
          <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent z-10 pointer-events-none" />
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3 bg-gray-50 border-b border-gray-200">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <div className="w-3 h-3 rounded-full bg-green-400" />
              <span className="mr-3 text-xs text-gray-400">accountant.qoyod.com</span>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="col-span-2 bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-700">الفواتير الصادرة</h3>
                    <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">+12.5%</span>
                  </div>
                  <div className="space-y-2">
                    {[
                      { label: "فاتورة # INV-00123", amount: "12,500 ريال", status: "مدفوعة" },
                      { label: "فاتورة # INV-00124", amount: "8,750 ريال", status: "مدفوعة" },
                      { label: "فاتورة # INV-00125", amount: "15,200 ريال", status: "معلقة" },
                    ].map((inv, i) => (
                      <div key={i} className="flex items-center justify-between py-1.5">
                        <span className="text-xs text-gray-600">{inv.label}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-medium text-gray-800">{inv.amount}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded ${inv.status === "مدفوعة" ? "text-green-700 bg-green-50" : "text-amber-700 bg-amber-50"}`}>{inv.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">الأرباح / الخسائر</h3>
                  <div className="flex items-end justify-between h-24 gap-1">
                    {[65, 45, 80, 55, 70, 90].map((h, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <div className="w-full rounded-t" style={{ height: `${h}%`, backgroundColor: i === 5 ? "#7259ff" : "#c7bdff" }} />
                        <span className="text-[9px] text-gray-400">شهر{i + 1}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">آخر المعاملات</span>
                  <span className="text-xs text-primary-600 font-medium">عرض الكل</span>
                </div>
                <div className="mt-2 space-y-1.5">
                  {["حركة بنكية", "فاتورة مشتريات", "قيد يومية", "مردود مبيعات"].map((tx, i) => (
                    <div key={i} className="flex items-center justify-between py-1">
                      <span className="text-xs text-gray-600">{tx}</span>
                      <span className="text-xs text-gray-400">منذ {["ساعة", "ساعتين", "5 ساعات", "يوم"][i]}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
