import Papa from "papaparse";

const ENTITY_FIELDS: Record<string, { label: string; required: boolean; field: string }[]> = {
  Customer: [
    { label: "Name", required: true, field: "name" },
    { label: "Email", required: false, field: "email" },
    { label: "Phone", required: false, field: "phone" },
    { label: "Mobile", required: false, field: "mobile" },
    { label: "Address", required: false, field: "address" },
    { label: "Tax Number", required: false, field: "taxNumber" },
    { label: "Credit Limit", required: false, field: "creditLimit" },
  ],
  Vendor: [
    { label: "Name", required: true, field: "name" },
    { label: "Email", required: false, field: "email" },
    { label: "Phone", required: false, field: "phone" },
    { label: "Mobile", required: false, field: "mobile" },
    { label: "Address", required: false, field: "address" },
    { label: "Tax Number", required: false, field: "taxNumber" },
  ],
  Item: [
    { label: "Name", required: true, field: "name" },
    { label: "SKU", required: false, field: "sku" },
    { label: "Barcode", required: false, field: "barcode" },
    { label: "Type (PRODUCT/SERVICE)", required: true, field: "type" },
    { label: "Unit", required: false, field: "unit" },
    { label: "Selling Price", required: false, field: "sellingPrice" },
    { label: "Cost Price", required: false, field: "costPrice" },
    { label: "Min Stock", required: false, field: "minStock" },
    { label: "Description", required: false, field: "description" },
  ],
  TaxCode: [
    { label: "Name", required: true, field: "name" },
    { label: "Rate (%)", required: true, field: "rate" },
  ],
  Account: [
    { label: "Code", required: true, field: "code" },
    { label: "Name", required: true, field: "name" },
    { label: "Type (ASSET/LIABILITY/EQUITY/INCOME/EXPENSE)", required: true, field: "type" },
    { label: "Nature (DEBIT/CREDIT)", required: false, field: "nature" },
  ],
  Warehouse: [
    { label: "Name", required: true, field: "name" },
    { label: "Address", required: false, field: "address" },
  ],
};

export function getEntityFields(entity: string) {
  return ENTITY_FIELDS[entity] ?? [];
}

export function parseCsv(text: string): { headers: string[]; rows: Record<string, string>[]; errors: string[] } {
  const result = Papa.parse(text, { header: true, skipEmptyLines: true });
  const errors: string[] = [];
  if (result.errors.length > 0) {
    for (const e of result.errors.slice(0, 5)) {
      errors.push(`Row ${e.row ?? "?"}: ${e.message}`);
    }
  }
  const rows = (result.data as Record<string, string>[]).filter((r) => Object.values(r).some((v) => v.trim()));
  return { headers: result.meta.fields ?? [], rows, errors };
}

export type FieldMapping = { targetField: string; sourceColumn: string };

export function validateMapping(entity: string, mapping: FieldMapping[]): string[] {
  const fields = ENTITY_FIELDS[entity] ?? [];
  const requiredFields = fields.filter((f) => f.required).map((f) => f.field);
  const mappedFields = mapping.map((m) => m.targetField);
  return requiredFields.filter((f) => !mappedFields.includes(f));
}
