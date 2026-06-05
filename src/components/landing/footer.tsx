export function LandingFooter() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <span className="text-lg font-bold text-white mb-4 block">قيود</span>
            <p className="text-sm text-gray-400 leading-relaxed">برنامج محاسبي سحابي متكامل يساعدك على إدارة حسابات شركتك بكل سهولة وأمان.</p>
          </div>
          <div>
            <h4 className="text-sm font-bold text-white mb-4">روابط سريعة</h4>
            <ul className="space-y-2 text-sm">
              {["الرئيسية", "المميزات", "الباقات", "التكاملات", "الأسئلة الشائعة"].map((item) => (
                <li key={item}><a href={`#${item}`} className="text-gray-400 hover:text-white transition-colors">{item}</a></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-bold text-white mb-4">قانوني</h4>
            <ul className="space-y-2 text-sm">
              {["الشروط والأحكام", "سياسة الخصوصية", "سياسة الاسترجاع"].map((item) => (
                <li key={item}><a href="#" className="text-gray-400 hover:text-white transition-colors">{item}</a></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-bold text-white mb-4">تواصل معنا</h4>
            <ul className="space-y-2 text-sm">
              <li className="text-gray-400">info@qoyod.com</li>
              <li className="text-gray-400">+966 55 123 4567</li>
              <li className="text-gray-400">الرياض، المملكة العربية السعودية</li>
            </ul>
          </div>
        </div>
        <div className="mt-10 pt-8 border-t border-gray-800 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-500">© {new Date().getFullYear()} قيود. جميع الحقوق محفوظة.</p>
          <div className="flex items-center gap-3">
            <span className="text-[10px] bg-gray-800 text-gray-400 px-3 py-1 rounded-full">متوافق مع ZATCA</span>
            <span className="text-[10px] bg-gray-800 text-gray-400 px-3 py-1 rounded-full">سحابي 100%</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
