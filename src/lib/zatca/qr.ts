import { createHash } from "crypto";
import * as qrcode from "qrcode";

export interface ZatcaQrInput {
  sellerName: string;
  vatNumber: string;
  timestamp: Date;
  totalWithVat: number;
  vatTotal: number;
}

function toTlv(tag: number, value: string): Buffer {
  const valueBuf = Buffer.from(value, "utf-8");
  const tagBuf = Buffer.from([tag]);
  const lenBuf = Buffer.alloc(1);
  lenBuf.writeUInt8(valueBuf.length);
  return Buffer.concat([tagBuf, lenBuf, valueBuf]);
}

export function generateZatcaQrBase64(input: ZatcaQrInput): string {
  const timestamp = input.timestamp.toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
  const tlv = Buffer.concat([
    toTlv(1, input.sellerName),
    toTlv(2, input.vatNumber),
    toTlv(3, timestamp),
    toTlv(4, input.totalWithVat.toFixed(2)),
    toTlv(5, input.vatTotal.toFixed(2)),
  ]);
  return tlv.toString("base64");
}

export function generateInvoiceHash(xml: string): string {
  return createHash("sha256").update(xml, "utf-8").digest("base64");
}

export async function generateQrDataUrl(base64Tlv: string): Promise<string> {
  const binary = Buffer.from(base64Tlv, "base64");
  const tags: Record<number, string> = {};
  let offset = 0;
  while (offset < binary.length) {
    const tag = binary[offset];
    const len = binary[offset + 1];
    const val = binary.slice(offset + 2, offset + 2 + len).toString("utf-8");
    tags[tag] = val;
    offset += 2 + len;
  }

  const qrContent = [
    tags[1] || "",
    tags[2] || "",
    tags[3] || "",
    tags[4] || "",
    tags[5] || "",
  ].join("\n");

  return qrcode.toDataURL(qrContent, { width: 150, margin: 2, color: { dark: "#000000", light: "#ffffff" } });
}
