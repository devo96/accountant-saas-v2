import { PrismaClient, AccountType, AccountNature, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const url = process.env.DATABASE_URL ?? "file:./dev.db";

function createSeedClient() {
  if (url.startsWith("file:")) {
    const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3");
    return new PrismaClient({ adapter: new PrismaBetterSqlite3({ url }) });
  }
  const { PrismaPg } = require("@prisma/adapter-pg");
  const { Pool } = require("pg");
  return new PrismaClient({ adapter: new PrismaPg(new Pool({ connectionString: url })) });
}

const prisma = createSeedClient();

async function main() {
  const org = await prisma.organization.upsert({
    where: { id: "demo-org" },
    update: {},
    create: {
      id: "demo-org",
      name: "الشركة التجارية",
      nameAr: "الشركة التجارية",
      email: "info@example.com",
      taxNumber: "300000000000003",
      commercialReg: "1010000000",
    },
  });

  const hashed = await bcrypt.hash("Speed@5186751867", 12);

  await prisma.user.upsert({
    where: { email: "admin@demo.com" },
    update: {},
    create: {
      email: "admin@demo.com",
      name: "مدير النظام",
      passwordHash: hashed,
      role: UserRole.ADMIN,
      organizationId: org.id,
    },
  });

  const currencies = [
    { code: "SAR", name: "Saudi Riyal", nameAr: "ريال سعودي", symbol: "﷼", isBase: true },
    { code: "USD", name: "US Dollar", nameAr: "دولار أمريكي", symbol: "$" },
    { code: "EUR", name: "Euro", nameAr: "يورو", symbol: "€" },
  ];

  for (const c of currencies) {
    await prisma.currency.upsert({
      where: { organizationId_code: { organizationId: org.id, code: c.code } },
      update: {},
      create: { ...c, organizationId: org.id },
    });
  }

  const accounts = [
    { code: "1", name: "Assets", nameAr: "الأصول", type: AccountType.ASSET, nature: AccountNature.DEBIT },
    { code: "1.1", name: "Current Assets", nameAr: "الأصول المتداولة", type: AccountType.ASSET, nature: AccountNature.DEBIT, parentCode: "1" },
    { code: "1.1.1", name: "Cash", nameAr: "النقدية", type: AccountType.ASSET, nature: AccountNature.DEBIT, parentCode: "1.1" },
    { code: "1.1.2", name: "Accounts Receivable", nameAr: "حسابات مدينة", type: AccountType.ASSET, nature: AccountNature.DEBIT, parentCode: "1.1" },
    { code: "1.1.3", name: "Inventory", nameAr: "المخزون", type: AccountType.ASSET, nature: AccountNature.DEBIT, parentCode: "1.1" },
    { code: "1.2", name: "Fixed Assets", nameAr: "الأصول الثابتة", type: AccountType.ASSET, nature: AccountNature.DEBIT, parentCode: "1" },
    { code: "2", name: "Liabilities", nameAr: "الخصوم", type: AccountType.LIABILITY, nature: AccountNature.CREDIT },
    { code: "2.1", name: "Current Liabilities", nameAr: "الخصوم المتداولة", type: AccountType.LIABILITY, nature: AccountNature.CREDIT, parentCode: "2" },
    { code: "2.1.1", name: "Accounts Payable", nameAr: "حسابات دائنة", type: AccountType.LIABILITY, nature: AccountNature.CREDIT, parentCode: "2.1" },
    { code: "2.1.2", name: "VAT Payable", nameAr: "ضريبة القيمة المضافة", type: AccountType.LIABILITY, nature: AccountNature.CREDIT, parentCode: "2.1" },
    { code: "3", name: "Equity", nameAr: "حقوق الملكية", type: AccountType.EQUITY, nature: AccountNature.CREDIT },
    { code: "3.1", name: "Capital", nameAr: "رأس المال", type: AccountType.EQUITY, nature: AccountNature.CREDIT, parentCode: "3" },
    { code: "3.2", name: "Retained Earnings", nameAr: "الأرباح المبقاة", type: AccountType.EQUITY, nature: AccountNature.CREDIT, parentCode: "3" },
    { code: "4", name: "Income", nameAr: "الإيرادات", type: AccountType.INCOME, nature: AccountNature.CREDIT },
    { code: "4.1", name: "Sales Revenue", nameAr: "إيرادات المبيعات", type: AccountType.INCOME, nature: AccountNature.CREDIT, parentCode: "4" },
    { code: "5", name: "Expenses", nameAr: "المصروفات", type: AccountType.EXPENSE, nature: AccountNature.DEBIT },
    { code: "5.1", name: "Cost of Goods Sold", nameAr: "تكلفة البضاعة المباعة", type: AccountType.EXPENSE, nature: AccountNature.DEBIT, parentCode: "5" },
    { code: "5.2", name: "Operating Expenses", nameAr: "مصروفات تشغيلية", type: AccountType.EXPENSE, nature: AccountNature.DEBIT, parentCode: "5" },
  ];

  for (const a of accounts) {
    const parent = a.parentCode
      ? await prisma.account.findUnique({ where: { organizationId_code: { organizationId: org.id, code: a.parentCode } } })
      : null;

    await prisma.account.upsert({
      where: { organizationId_code: { organizationId: org.id, code: a.code } },
      update: {},
      create: {
        code: a.code,
        name: a.name,
        nameAr: a.nameAr,
        type: a.type,
        nature: a.nature,
        parentId: parent?.id ?? null,
        organizationId: org.id,
        isMaster: true,
      },
    });
  }

  const tax = await prisma.taxCode.upsert({
    where: { organizationId_name: { organizationId: org.id, name: "VAT 15%" } },
    update: {},
    create: {
      name: "VAT 15%",
      nameAr: "ضريبة القيمة المضافة ١٥٪",
      rate: 15,
      isDefault: true,
      organizationId: org.id,
    },
  });

  console.log("Seed complete");
  console.log("Login: admin@demo.com / Speed@5186751867");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
