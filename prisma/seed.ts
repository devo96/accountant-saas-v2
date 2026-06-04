import { PrismaClient, AccountType, AccountNature, UserRole, PlanTier, OrgPlanStatus } from "@prisma/client";
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

  const plans: { id: string; name: string; nameAr: string; tier: PlanTier; monthlyPrice: number; maxUsers: number; maxInvoices: number; maxItems: number; sortOrder: number }[] = [
    { id: "plan-free", name: "Free", nameAr: "مجاني", tier: PlanTier.FREE, monthlyPrice: 0, maxUsers: 1, maxInvoices: 50, maxItems: 50, sortOrder: 1 },
    { id: "plan-starter", name: "Starter", nameAr: "مبتدئ", tier: PlanTier.STARTER, monthlyPrice: 99, maxUsers: 3, maxInvoices: 500, maxItems: 200, sortOrder: 2 },
    { id: "plan-professional", name: "Professional", nameAr: "احترافي", tier: PlanTier.PROFESSIONAL, monthlyPrice: 249, maxUsers: 10, maxInvoices: 5000, maxItems: 1000, sortOrder: 3 },
    { id: "plan-enterprise", name: "Enterprise", nameAr: "مؤسسات", tier: PlanTier.ENTERPRISE, monthlyPrice: 999, maxUsers: 999, maxInvoices: 99999, maxItems: 99999, sortOrder: 4 },
  ];

  for (const p of plans) {
    await prisma.plan.upsert({
      where: { id: p.id },
      update: {},
      create: p,
    });
  }

  await prisma.organizationPlan.upsert({
    where: { organizationId: org.id },
    update: {},
    create: {
      organizationId: org.id,
      planId: "plan-professional",
      status: OrgPlanStatus.ACTIVE,
    },
  });

  const ownerOrg = await prisma.organization.upsert({
    where: { id: "owner-org" },
    update: {},
    create: {
      id: "owner-org",
      name: "SaaS Admin",
      email: "owner@saas.com",
    },
  });

  const ownerHashed = await bcrypt.hash("Speed@5186751867", 12);

  await prisma.user.upsert({
    where: { email: "owner@saas.com" },
    update: {},
    create: {
      email: "owner@saas.com",
      name: "مالك النظام",
      passwordHash: ownerHashed,
      role: UserRole.OWNER,
      organizationId: ownerOrg.id,
    },
  });

  // ── Seed data for new sidebar pages ──

  async function seedIfEmpty(model: string, data: any[]) {
    const count = await (prisma as any)[model].count({ where: { organizationId: org.id } });
    if (count > 0) return;
    for (const item of data) {
      await (prisma as any)[model].create({ data: { ...item, organizationId: org.id } });
    }
  }

  let employee = await prisma.employee.findFirst({ where: { organizationId: org.id } });
  if (!employee) {
    employee = await prisma.employee.create({
      data: { name: "أحمد محمد", nameAr: "أحمد محمد", email: "ahmed@demo.com", phone: "0501234567", position: "محاسب", basicSalary: 5000, organizationId: org.id },
    });
  }

  let customer = await prisma.customer.findFirst({ where: { organizationId: org.id } });
  if (!customer) {
    customer = await prisma.customer.create({
      data: { name: "شركة الأمل", nameAr: "شركة الأمل", email: "client@demo.com", phone: "0555000001", organizationId: org.id },
    });
  }

  let vendor = await prisma.vendor.findFirst({ where: { organizationId: org.id } });
  if (!vendor) {
    vendor = await prisma.vendor.create({
      data: { name: "مؤسسة التوريدات", nameAr: "مؤسسة التوريدات", email: "supplier@demo.com", phone: "0555000002", organizationId: org.id },
    });
  }

  await seedIfEmpty("category", [
    { name: "Electronics", nameAr: "إلكترونيات", type: "PRODUCT" },
    { name: "Office Supplies", nameAr: "لوازم مكتبية", type: "EXPENSE" },
    { name: "Furniture", nameAr: "أثاث", type: "ASSET" },
  ]);
  await seedIfEmpty("unitOfMeasure", [
    { name: "Piece", nameAr: "قطعة", symbol: "pc", precision: 0 },
    { name: "Kilogram", nameAr: "كيلو جرام", symbol: "kg", precision: 2 },
    { name: "Hour", nameAr: "ساعة", symbol: "hr", precision: 1 },
  ]);
  await seedIfEmpty("paymentTerm", [
    { name: "Net 30", nameAr: "30 يوم", dueDays: 30 },
    { name: "Net 60", nameAr: "60 يوم", dueDays: 60 },
    { name: "Cash on Delivery", nameAr: "الدفع عند التسليم", dueDays: 0 },
  ]);
  await seedIfEmpty("branch", [
    { name: "Main Branch", nameAr: "الفرع الرئيسي", code: "HQ", address: "Riyadh", phone: "0112223333" },
    { name: "Branch 2", nameAr: "الفرع الثاني", code: "BR2", address: "Jeddah", phone: "0124445555" },
  ]);
  await seedIfEmpty("fixedAsset", [
    { code: "FIX-001", category: "ASSET", name: "Office Building", nameAr: "مبنى مكتبي", purchaseCost: 500000, salvageValue: 50000, usefulLifeYears: 25, bookValue: 450000, accumulatedDepreciation: 50000, purchaseDate: new Date("2020-01-01"), status: "ACTIVE" },
    { code: "FIX-002", category: "ASSET", name: "Delivery Van", nameAr: "سيارة توصيل", purchaseCost: 120000, salvageValue: 20000, usefulLifeYears: 5, bookValue: 40000, accumulatedDepreciation: 80000, purchaseDate: new Date("2021-06-15"), status: "ACTIVE" },
    { code: "FIX-003", category: "ASSET", name: "Old Server", nameAr: "خادم قديم", purchaseCost: 30000, salvageValue: 0, usefulLifeYears: 3, bookValue: 0, accumulatedDepreciation: 30000, purchaseDate: new Date("2019-03-01"), status: "DISPOSED" },
    { code: "FIX-004", category: "ASSET", name: "Printer (Transferred)", nameAr: "طابعة (منقولة)", purchaseCost: 8000, salvageValue: 500, usefulLifeYears: 4, bookValue: 4500, accumulatedDepreciation: 3500, purchaseDate: new Date("2022-01-01"), status: "TRANSFERRED" },
  ]);

  if (await prisma.warehouse.count({ where: { organizationId: org.id } }) === 0) {
    await prisma.warehouse.create({ data: { name: "Main Warehouse", nameAr: "المستودع الرئيسي", organizationId: org.id } });
  }
  await seedIfEmpty("item", [
    { name: "Laptop Dell XPS", nameAr: "لابتوب ديل XPS", sku: "LAP-001", sellingPrice: 4500, costPrice: 3800, currentStock: 10, minStock: 3, active: true },
    { name: "Office Chair", nameAr: "كرسي مكتب", sku: "CHR-001", sellingPrice: 850, costPrice: 600, currentStock: 25, minStock: 5, active: true },
    { name: "USB Cable", nameAr: "كابل USB", sku: "USB-001", sellingPrice: 25, costPrice: 15, currentStock: 100, minStock: 20, active: true },
  ]);

  // Sales Invoice + PaymentReceipt (customer receipt)
  const arAccount = await prisma.account.findUnique({ where: { organizationId_code: { organizationId: org.id, code: "1.1.2" } } });
  const salesAccount = await prisma.account.findUnique({ where: { organizationId_code: { organizationId: org.id, code: "4.1" } } });
  const adminUser = await prisma.user.findFirst({ where: { organizationId: org.id } });
  const sarCurrency = await prisma.currency.findFirst({ where: { organizationId: org.id, code: "SAR" } });

  if (arAccount && salesAccount && adminUser && sarCurrency && await prisma.paymentReceipt.count({ where: { organizationId: org.id } }) === 0) {
    const inv = await prisma.salesInvoice.create({
      data: {
        number: 1, invoiceDate: new Date("2026-01-15"), dueDate: new Date("2026-02-14"),
        status: "CONFIRMED", customerId: customer.id, currencyId: sarCurrency.id,
        subtotal: 4500, taxAmount: 675, total: 5175, discountAmount: 0, paidAmount: 5175,
        organizationId: org.id, createdById: adminUser.id,
      },
    });
    await prisma.paymentReceipt.create({
      data: {
        number: 1, amount: 5175, method: "BANK_TRANSFER", date: new Date("2026-01-20"),
        reference: "TRX-001", organizationId: org.id, createdById: adminUser.id,
        salesInvoiceId: inv.id,
      },
    });

    const apAccount = await prisma.account.findUnique({ where: { organizationId_code: { organizationId: org.id, code: "2.1.1" } } });
    if (apAccount) {
      const pInv = await prisma.purchaseInvoice.create({
        data: {
          number: 1, invoiceDate: new Date("2026-02-01"), dueDate: new Date("2026-03-01"),
          status: "CONFIRMED", vendorId: vendor.id, currencyId: sarCurrency.id,
          subtotal: 2000, taxAmount: 300, total: 2300, discountAmount: 0, paidAmount: 2300,
          organizationId: org.id, createdById: adminUser.id,
        },
      });
      await prisma.paymentReceipt.create({
        data: {
          number: 2, amount: 2300, method: "CASH", date: new Date("2026-02-05"),
          reference: "PMT-001", organizationId: org.id, createdById: adminUser.id,
          purchaseInvoiceId: pInv.id,
        },
      });
    }
  }

  // Journal Entries
  const cashAccount = await prisma.account.findUnique({ where: { organizationId_code: { organizationId: org.id, code: "1.1.1" } } });

  if (arAccount && salesAccount && cashAccount && adminUser && await prisma.journalEntry.count({ where: { organizationId: org.id } }) === 0) {
    await prisma.journalEntry.create({
      data: { number: 1, organizationId: org.id, date: new Date("2026-01-15"), description: "Sales revenue recognition", status: "POSTED", createdById: adminUser.id,
        lines: { create: [
          { accountId: arAccount.id, debit: 5175, credit: 0, description: "AR from sales" },
          { accountId: salesAccount.id, debit: 0, credit: 4500, description: "Sales revenue" },
        ]},
      },
    });
    await prisma.journalEntry.create({
      data: { number: 2, organizationId: org.id, date: new Date("2026-01-20"), description: "Cash collection from customer", status: "POSTED", createdById: adminUser.id,
        lines: { create: [
          { accountId: cashAccount.id, debit: 5175, credit: 0, description: "Cash received" },
          { accountId: arAccount.id, debit: 0, credit: 5175, description: "AR settled" },
        ]},
      },
    });
  }

  // Project + Tasks
  if (await prisma.project.count({ where: { organizationId: org.id } }) === 0) {
    const proj1 = await prisma.project.create({
      data: { name: "ERP Implementation", nameAr: "تنفيذ نظام ERP", description: "Full ERP system rollout for Q4", startDate: new Date("2026-01-01"), endDate: new Date("2026-06-30"), status: "ACTIVE", budget: 50000, progress: 40, organizationId: org.id },
    });
    await prisma.project.create({
      data: { name: "Office Relocation", nameAr: "نقل المكتب", description: "Moving to new headquarters", status: "PLANNING", budget: 15000, progress: 0, organizationId: org.id },
    });
    await prisma.task.create({ data: { title: "Requirements gathering", description: "Collect requirements from all departments", projectId: proj1.id, priority: "HIGH", status: "DONE", estimatedHours: 40, actualHours: 38, organizationId: org.id } });
    await prisma.task.create({ data: { title: "System configuration", description: "Configure ERP modules", projectId: proj1.id, assigneeId: adminUser?.id, priority: "HIGH", status: "IN_PROGRESS", estimatedHours: 80, actualHours: 30, dueDate: new Date("2026-04-01"), organizationId: org.id } });
    await prisma.task.create({ data: { title: "User training", description: "Train end users on new system", projectId: proj1.id, priority: "MEDIUM", status: "TODO", estimatedHours: 24, organizationId: org.id } });
  }

  // Advances
  if (await prisma.advance.count({ where: { organizationId: org.id } }) === 0) {
    await prisma.advance.create({ data: { employeeId: employee.id, amount: 2000, date: new Date("2026-02-01"), description: "Travel advance", status: "APPROVED", repaidAmount: 500, installments: 4, organizationId: org.id } });
    await prisma.advance.create({ data: { employeeId: employee.id, amount: 1000, date: new Date("2026-03-01"), description: "Medical advance", status: "PENDING", organizationId: org.id } });
  }

  // Deductions
  if (await prisma.deduction.count({ where: { organizationId: org.id } }) === 0) {
    await prisma.deduction.create({ data: { employeeId: employee.id, amount: 500, date: new Date("2026-01-31"), type: "GOSI", description: "Monthly GOSI contribution", recurring: true, organizationId: org.id } });
    await prisma.deduction.create({ data: { employeeId: employee.id, amount: 200, date: new Date("2026-01-31"), type: "LOAN", description: "Monthly loan installment", recurring: true, organizationId: org.id } });
  }

  // Social Insurance
  if (await prisma.socialInsuranceRecord.count({ where: { organizationId: org.id } }) === 0) {
    await prisma.socialInsuranceRecord.create({ data: { employeeId: employee.id, period: "2026-01", employeeShare: 450, employerShare: 900, totalContribution: 1350, salary: 5000, status: "PAID", paidAt: new Date("2026-02-05"), organizationId: org.id } });
    await prisma.socialInsuranceRecord.create({ data: { employeeId: employee.id, period: "2026-02", employeeShare: 450, employerShare: 900, totalContribution: 1350, salary: 5000, status: "PENDING", organizationId: org.id } });
  }

  console.log("Seed complete");
  console.log("Admin: admin@demo.com / Speed@5186751867");
  console.log("Owner: owner@saas.com / Speed@5186751867");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
