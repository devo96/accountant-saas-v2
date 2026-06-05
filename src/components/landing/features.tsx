const features = [
  { title: "الفوترة الإلكترونية", desc: "إصدار فواتير إلكترونية متوافقة مع متطلبات ZATCA (المرحلة الثانية) مع رمز QR وتوقيع إلكتروني.", icon: "📋" },
  { title: "إدارة المخزون والمستودعات", desc: "تتبع المنتجات، تنبيهات نفاد المخزون، جرد آلي للمستودعات وتقارير حركة المخزون.", icon: "📦" },
  { title: "قيود اليومية والمحاسبة العامة", desc: "شجرة حسابات متكاملة، قيود سهلة، مراكز تكلفة، وأستاذ عام لجميع الحركات المالية.", icon: "📊" },
  { title: "التقارير المالية والقرارات", desc: "الميزانية العمومية، قائمة الأرباح والخسائر، التدفقات النقدية، تقارير ذكية لاتخاذ القرارات.", icon: "📈" },
  { title: "إدارة العملاء والموردين", desc: "سجل متكامل للعملاء والموردين، إدارة حساباتهم، ومتابعة الذمم المدينة والدائنة.", icon: "🤝" },
];

export function LandingFeatures() {
  return (
    <section id="features" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">منتجات ومميزات متكاملة</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">كل ما تحتاجه لإدارة محاسبة شركتك في مكان واحد</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <div key={i} className="group p-6 bg-gray-50 hover:bg-primary-50 rounded-2xl transition-all duration-300 hover:shadow-lg hover:shadow-primary-100/50">
              <span className="text-3xl mb-4 block">{f.icon}</span>
              <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-primary-700 transition-colors">{f.title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
