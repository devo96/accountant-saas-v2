import { prisma } from "@/lib/prisma";
import type { FieldMapping } from "./import-shared";

async function createCustomer(row: Record<string, string>, mapping: FieldMapping[], orgId: string) {
  const data: Record<string, any> = { organizationId: orgId };
  for (const m of mapping) {
    const val = row[m.sourceColumn]?.trim();
    if (!val) continue;
    if (m.targetField === "creditLimit") data[m.targetField] = Number(val);
    else data[m.targetField] = val;
  }
  if (!data.name) throw new Error("Name is required");
  return prisma.customer.create({ data: data as any });
}

async function createVendor(row: Record<string, string>, mapping: FieldMapping[], orgId: string) {
  const data: Record<string, any> = { organizationId: orgId };
  for (const m of mapping) {
    const val = row[m.sourceColumn]?.trim();
    if (!val) continue;
    data[m.targetField] = val;
  }
  if (!data.name) throw new Error("Name is required");
  return prisma.vendor.create({ data: data as any });
}

async function createItem(row: Record<string, string>, mapping: FieldMapping[], orgId: string) {
  const data: Record<string, any> = { organizationId: orgId };
  for (const m of mapping) {
    const val = row[m.sourceColumn]?.trim();
    if (!val) continue;
    if (["sellingPrice", "costPrice", "minStock"].includes(m.targetField)) data[m.targetField] = Number(val);
    else data[m.targetField] = val;
  }
  if (!data.name) throw new Error("Name is required");
  if (!data.type) throw new Error("Type is required");
  return prisma.item.create({ data: data as any });
}

async function createTaxCode(row: Record<string, string>, mapping: FieldMapping[], orgId: string) {
  const data: Record<string, any> = { organizationId: orgId };
  for (const m of mapping) {
    const val = row[m.sourceColumn]?.trim();
    if (!val) continue;
    if (m.targetField === "rate") data[m.targetField] = Number(val);
    else data[m.targetField] = val;
  }
  if (!data.name) throw new Error("Name is required");
  if (data.rate === undefined) throw new Error("Rate is required");
  return prisma.taxCode.create({ data: data as any });
}

async function createAccount(row: Record<string, string>, mapping: FieldMapping[], orgId: string) {
  const data: Record<string, any> = { organizationId: orgId };
  for (const m of mapping) {
    const val = row[m.sourceColumn]?.trim();
    if (!val) continue;
    data[m.targetField] = val;
  }
  if (!data.code) throw new Error("Code is required");
  if (!data.name) throw new Error("Name is required");
  if (!data.type) throw new Error("Type is required");
  return prisma.account.create({ data: data as any });
}

async function createWarehouse(row: Record<string, string>, mapping: FieldMapping[], orgId: string) {
  const data: Record<string, any> = { organizationId: orgId };
  for (const m of mapping) {
    const val = row[m.sourceColumn]?.trim();
    if (!val) continue;
    data[m.targetField] = val;
  }
  if (!data.name) throw new Error("Name is required");
  return prisma.warehouse.create({ data: data as any });
}

const CREATORS: Record<string, (row: Record<string, string>, mapping: FieldMapping[], orgId: string) => Promise<any>> = {
  Customer: createCustomer,
  Vendor: createVendor,
  Item: createItem,
  TaxCode: createTaxCode,
  Account: createAccount,
  Warehouse: createWarehouse,
};

export async function importRows(
  entity: string,
  rows: Record<string, string>[],
  mapping: FieldMapping[],
  orgId: string,
  onProgress?: (imported: number, total: number) => void
): Promise<{ imported: number; errors: { row: number; message: string }[] }> {
  const creator = CREATORS[entity];
  if (!creator) throw new Error(`Unsupported entity: ${entity}`);

  const errors: { row: number; message: string }[] = [];
  let imported = 0;

  for (let i = 0; i < rows.length; i++) {
    try {
      await creator(rows[i], mapping, orgId);
      imported++;
    } catch (e: any) {
      errors.push({ row: i + 2, message: e.message });
    }
    onProgress?.(imported, rows.length);
  }

  return { imported, errors };
}
