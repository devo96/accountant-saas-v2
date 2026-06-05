const integrations = [
  { name: "سلة", desc: "ربط الفواتير مع متجر سلة الإلكتروني" },
  { name: "زيد", desc: "مزامنة المخزون مع منصة زيد" },
  { name: "مدفوعات", desc: "بوابة دفع إلكترونية متكاملة" },
  { name: "نقاط البيع", desc: "ربط مع أنظمة نقاط البيع" },
];

export function LandingIntegrations() {
  return (
    <section id="integrations" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">تكاملات وربط</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">اربط برنامج المحاسبة مع أدواتك المفضلة</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {integrations.map((item, i) => (
            <div key={i} className="p-6 bg-white rounded-xl border border-gray-200 hover:border-primary-200 hover:shadow-md transition-all text-center">
              <div className="w-14 h-14 bg-primary-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                <span className="text-primary-600 font-bold text-lg">{item.name[0]}</span>
              </div>
              <h4 className="text-sm font-bold text-gray-800 mb-1">{item.name}</h4>
              <p className="text-xs text-gray-500">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
