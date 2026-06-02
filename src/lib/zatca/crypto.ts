import { createHash, createSign, createVerify, generateKeyPairSync, randomUUID } from "crypto";

export function generateZatcaUuid(): string {
  return randomUUID();
}

export function generateInvoiceHash(xml: string): string {
  return createHash("sha256").update(xml, "utf-8").digest("base64");
}

export function generateEccKeyPair() {
  return generateKeyPairSync("ec", {
    namedCurve: "P-256",
    publicKeyEncoding: { type: "spki", format: "pem" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
  });
}

export function signXml(xml: string, privateKeyPem: string): string {
  const signer = createSign("sha256");
  signer.update(xml, "utf-8");
  return signer.sign(privateKeyPem, "base64");
}

export function verifySignature(xml: string, signature: string, publicKeyPem: string): boolean {
  const verifier = createVerify("sha256");
  verifier.update(xml, "utf-8");
  return verifier.verify(publicKeyPem, signature, "base64");
}
