import { prisma } from "@/lib/prisma";

type EmployeePayroll = {
  employeeId: string;
  employeeName: string;
  basicSalary: number;
  allowances: number;
  gross: number;
  advanceDeduction: number;
  otherDeductions: number;
  gosiEmployeeShare: number;
  netPay: number;
};

type PayrollResult = {
  employees: EmployeePayroll[];
  totalSalaries: number;
  totalGosi: number;
  netTotal: number;
};

export async function calculatePayroll(organizationId: string, month: number, year: number): Promise<PayrollResult> {
  const employees = await prisma.employee.findMany({
    where: { organizationId, active: true },
    include: {
      advances: {
        where: { status: { in: ["PENDING", "PARTIALLY_PAID"] } },
      },
      deductions: {
        where: {
          OR: [
            { recurring: true },
            { date: { gte: new Date(year, month - 1, 1), lte: new Date(year, month, 0) } },
          ],
        },
      },
      socialInsuranceRecords: {
        where: { period: `${year}-${String(month).padStart(2, "0")}` },
      },
    },
  });

  const period = `${year}-${String(month).padStart(2, "0")}`;

  const employeeRows: EmployeePayroll[] = [];
  let totalSalaries = 0;
  let totalGosi = 0;

  for (const emp of employees) {
    const basicSalary = Number(emp.basicSalary);
    const allowances = Number(emp.allowances);
    const gross = basicSalary + allowances;

    // Monthly advance repayment = remaining balance / remaining installments
    const advanceDeduction = emp.advances.reduce((sum, a) => {
      const remaining = Number(a.amount) - Number(a.repaidAmount);
      const remainingInstallments = a.installments;
      return sum + (remainingInstallments > 0 ? remaining / remainingInstallments : 0);
    }, 0);

    // Other deductions (non-advance)
    const otherDeductions = emp.deductions.reduce((sum, d) => sum + Number(d.amount), 0);

    // GOSI employee share
    const gosiRecord = emp.socialInsuranceRecords.find((r) => r.period === period);
    const gosiEmployeeShare = gosiRecord ? Number(gosiRecord.employeeShare) : 0;

    const netPay = gross - advanceDeduction - otherDeductions - gosiEmployeeShare;

    employeeRows.push({
      employeeId: emp.id,
      employeeName: emp.name,
      basicSalary,
      allowances,
      gross,
      advanceDeduction,
      otherDeductions,
      gosiEmployeeShare,
      netPay: Math.max(0, netPay),
    });

    totalSalaries += gross;
    totalGosi += gosiEmployeeShare;
  }

  const netTotal = employeeRows.reduce((sum, e) => sum + e.netPay, 0);

  return {
    employees: employeeRows,
    totalSalaries,
    totalGosi,
    netTotal,
  };
}
