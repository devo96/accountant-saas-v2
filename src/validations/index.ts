import { z } from "zod";

export const CustomerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  taxNumber: z.string().optional().or(z.literal("")),
  crNumber: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  city: z.string().optional().or(z.literal("")),
  country: z.string().optional().or(z.literal("")),
  postalCode: z.string().optional().or(z.literal("")),
  creditLimit: z.number().nonnegative().optional(),
  active: z.boolean().optional(),
});

export const VendorSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  taxNumber: z.string().optional().or(z.literal("")),
  crNumber: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  city: z.string().optional().or(z.literal("")),
  country: z.string().optional().or(z.literal("")),
  postalCode: z.string().optional().or(z.literal("")),
  active: z.boolean().optional(),
});

export const ItemSchema = z.object({
  name: z.string().min(1, "Name is required"),
  sku: z.string().optional().or(z.literal("")),
  barcode: z.string().optional().or(z.literal("")),
  type: z.enum(["PRODUCT", "SERVICE"]).optional(),
  unit: z.string().optional(),
  sellingPrice: z.number().nonnegative().optional(),
  costPrice: z.number().nonnegative().optional(),
  minStock: z.number().nonnegative().optional(),
  description: z.string().optional().or(z.literal("")),
  categoryId: z.string().uuid().optional().or(z.literal("")),
});

export const InvoiceLineSchema = z.object({
  itemId: z.string().uuid().optional().or(z.literal("")),
  description: z.string().min(1, "Line description is required"),
  quantity: z.number().int().positive("Quantity must be positive"),
  unitPrice: z.number().nonnegative(),
  discountPercent: z.number().min(0).max(100).optional(),
  taxCodeId: z.string().uuid().optional().or(z.literal("")),
  taxRate: z.number().min(0).optional(),
  lineTotal: z.number().nonnegative(),
});

export const SalesInvoiceSchema = z.object({
  customerId: z.string().uuid("Customer is required"),
  invoiceDate: z.string().min(1, "Invoice date is required"),
  dueDate: z.string().optional().or(z.literal("")),
  status: z.enum(["DRAFT", "CONFIRMED"]).optional(),
  referenceNumber: z.string().optional().or(z.literal("")),
  description: z.string().optional().or(z.literal("")),
  paymentTermId: z.string().uuid().optional().or(z.literal("")),
  branchId: z.string().uuid().optional().or(z.literal("")),
  projectId: z.string().uuid().optional().or(z.literal("")),
  subtotal: z.number().nonnegative(),
  discountAmount: z.number().min(0).optional(),
  taxAmount: z.number().min(0),
  total: z.number().positive("Total must be positive"),
  notes: z.string().optional().or(z.literal("")),
  lines: z.array(InvoiceLineSchema).min(1, "At least one line is required"),
});

export const PurchaseInvoiceSchema = z.object({
  vendorId: z.string().uuid("Vendor is required"),
  invoiceDate: z.string().min(1, "Invoice date is required"),
  dueDate: z.string().optional().or(z.literal("")),
  status: z.enum(["DRAFT", "CONFIRMED"]).optional(),
  referenceNumber: z.string().optional().or(z.literal("")),
  description: z.string().optional().or(z.literal("")),
  paymentTermId: z.string().uuid().optional().or(z.literal("")),
  branchId: z.string().uuid().optional().or(z.literal("")),
  projectId: z.string().uuid().optional().or(z.literal("")),
  subtotal: z.number().nonnegative(),
  discountAmount: z.number().min(0).optional(),
  taxAmount: z.number().min(0),
  total: z.number().positive("Total must be positive"),
  notes: z.string().optional().or(z.literal("")),
  lines: z.array(InvoiceLineSchema).min(1, "At least one line is required"),
});

export const ExpenseLineSchema = z.object({
  accountId: z.string().uuid("Account is required"),
  amount: z.number().positive("Amount must be positive"),
  taxCodeId: z.string().uuid().optional().or(z.literal("")),
  taxRate: z.number().min(0).optional(),
  taxAmount: z.number().min(0).optional(),
});

export const ExpenseSchema = z.object({
  date: z.string().min(1, "Date is required"),
  description: z.string().min(1, "Description is required"),
  amount: z.number().positive(),
  taxAmount: z.number().min(0).optional(),
  vendorId: z.string().uuid().optional().or(z.literal("")),
  paymentMethod: z.enum(["CASH", "BANK", "CREDIT"]).optional(),
  receipt: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
  accountId: z.string().uuid().optional(),
  lines: z.array(ExpenseLineSchema).optional(),
});

export const EmployeeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  position: z.string().optional().or(z.literal("")),
  basicSalary: z.number().nonnegative().optional(),
  allowances: z.number().nonnegative().optional(),
  gosiContribution: z.number().nonnegative().optional(),
  iqamaNumber: z.string().optional().or(z.literal("")),
  bankAccountNumber: z.string().optional().or(z.literal("")),
  userId: z.string().uuid().optional().or(z.literal("")),
  active: z.boolean().optional(),
});

export const BankAccountSchema = z.object({
  name: z.string().min(1, "Name is required"),
  accountNumber: z.string().optional().or(z.literal("")),
  iban: z.string().optional().or(z.literal("")),
  bankName: z.string().min(1, "Bank name is required"),
  currencyId: z.string().uuid().optional().or(z.literal("")),
  openingBalance: z.number().optional(),
  active: z.boolean().optional(),
});

export const UserSchema = z.object({
  email: z.string().email("Valid email is required"),
  name: z.string().min(1, "Name is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["ADMIN", "ACCOUNTANT", "VIEWER"]).optional(),
  phone: z.string().optional().or(z.literal("")),
  active: z.boolean().optional(),
});

export const FiscalYearSchema = z.object({
  name: z.string().min(1, "Name is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  isClosed: z.boolean().optional(),
});

export const CurrencySchema = z.object({
  name: z.string().min(1, "Name is required"),
  code: z.string().min(1, "Code is required"),
  symbol: z.string().optional().or(z.literal("")),
  exchangeRate: z.number().positive().optional(),
  isBase: z.boolean().optional(),
});

export const TaxCodeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  rate: z.coerce.number().min(0).max(100),
  description: z.string().optional().or(z.literal("")),
  active: z.boolean().optional(),
});

export const WarehouseSchema = z.object({
  name: z.string().min(1, "Name is required"),
  code: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  active: z.boolean().optional(),
});

export const ProjectSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional().or(z.literal("")),
  startDate: z.string().optional().or(z.literal("")),
  endDate: z.string().optional().or(z.literal("")),
  status: z.enum(["PLANNING", "ACTIVE", "COMPLETED", "CANCELLED"]).optional(),
  budget: z.number().nonnegative().optional(),
  customerId: z.string().uuid().optional().or(z.literal("")),
  managerId: z.string().uuid().optional().or(z.literal("")),
});

export const TaskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional().or(z.literal("")),
  projectId: z.string().uuid().optional().or(z.literal("")),
  assigneeId: z.string().uuid().optional().or(z.literal("")),
  dueDate: z.string().optional().or(z.literal("")),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "REVIEW", "DONE"]).optional(),
  estimatedHours: z.number().nonnegative().optional(),
});
