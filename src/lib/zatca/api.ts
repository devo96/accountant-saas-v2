export type ZatcaEnvironment = "sandbox" | "production";

export interface ZatcaCredentials {
  environment: ZatcaEnvironment;
  csidId: string;
  csidSecret: string;
  certificate: string;
  privateKey: string;
  publicKey: string;
}

const SANDBOX_BASE = "https://gw-fatoora.zatca.gov.sa/e-invoicing/developer-portal";
const PRODUCTION_BASE = "https://gw-fatoora.zatca.gov.sa/e-invoicing";

function baseUrl(env: ZatcaEnvironment): string {
  return env === "sandbox" ? SANDBOX_BASE : PRODUCTION_BASE;
}

interface ZatcaSubmitResponse {
  status: "SUBMITTED" | "ACCEPTED" | "REJECTED";
  submissionUuid?: string;
  rejectionReason?: string;
  clearedInvoice?: string;
  reportedInvoice?: string;
}

export async function submitInvoice(
  creds: ZatcaCredentials,
  invoiceXml: string,
  invoiceHash: string,
  uuid: string,
  type: "reporting" | "clearance"
): Promise<ZatcaSubmitResponse> {
  const url = `${baseUrl(creds.environment)}/invoices/${type}/single`;
  const encoded = Buffer.from(invoiceXml, "utf-8").toString("base64");
  const auth = Buffer.from(`${creds.csidId}:${creds.csidSecret}`).toString("base64");

  const body = {
    invoiceHash,
    invoice: encoded,
    uuid,
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${auth}`,
      "Accept-Version": "V2",
      "Accept-Language": "en",
    },
    body: JSON.stringify(body),
  });

  const json = await res.json();

  if (!res.ok) {
    return {
      status: "REJECTED",
      rejectionReason: json?.message ?? json?.error ?? `HTTP ${res.status}`,
    };
  }

  return {
    status: "ACCEPTED",
    submissionUuid: json?.submissionUuid ?? json?.clearedInvoice?.submissionUuid,
    clearedInvoice: json?.clearedInvoice,
    reportedInvoice: json?.reportedInvoice,
  };
}

export async function complianceCheck(
  creds: ZatcaCredentials,
  invoiceXml: string,
  invoiceHash: string,
  uuid: string
): Promise<{ accepted: boolean; clearanceStatus?: string; errors?: string[] }> {
  const url = `${baseUrl(creds.environment)}/compliance/invoices`;
  const encoded = Buffer.from(invoiceXml, "utf-8").toString("base64");
  const auth = Buffer.from(`${creds.csidId}:${creds.csidSecret}`).toString("base64");

  const body = {
    invoiceHash,
    invoice: encoded,
    uuid,
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${auth}`,
      "Accept-Version": "V2",
      "Accept-Language": "en",
    },
    body: JSON.stringify(body),
  });

  const json = await res.json();

  if (!res.ok) {
    return {
      accepted: false,
      errors: [json?.message ?? json?.error ?? `HTTP ${res.status}`],
    };
  }

  return {
    accepted: true,
    clearanceStatus: json?.clearanceStatus,
  };
}
