import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { parseCsv, validateMapping } from "@/lib/import-shared";
import { importRows } from "@/lib/import";
import { createAuditLog } from "@/lib/audit";

const SUPPORTED_ENTITIES = ["Customer", "Vendor", "Item", "TaxCode", "Account", "Warehouse"];

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { entity, csv, mapping } = await req.json();

  if (!entity || !csv || !mapping) {
    return NextResponse.json({ error: "entity, csv, and mapping required" }, { status: 400 });
  }

  if (!SUPPORTED_ENTITIES.includes(entity)) {
    return NextResponse.json({ error: `Unsupported entity: ${entity}` }, { status: 400 });
  }

  const missing = validateMapping(entity, mapping);
  if (missing.length > 0) {
    return NextResponse.json({ error: `Missing required fields: ${missing.join(", ")}` }, { status: 400 });
  }

  const { headers, rows, errors: parseErrors } = parseCsv(csv);

  if (rows.length === 0) {
    return NextResponse.json({ error: "No data rows found in CSV" }, { status: 400 });
  }

  const result = await importRows(entity, rows, mapping, session.user.organizationId);

  await createAuditLog({
    organizationId: session.user.organizationId,
    userId: session.user.id,
    action: "IMPORT",
    entity,
    entityId: `${result.imported} records`,
    newValue: { imported: result.imported, errors: result.errors.length },
  });

  return NextResponse.json({
    total: rows.length,
    imported: result.imported,
    parseErrors,
    errors: result.errors,
  });
}
