import { prisma } from "@/lib/prisma";

/**
 * Union of the default Prisma client and a transaction client.
 * Inside a `prisma.$transaction(async (tx) => { ... })` callback,
 * `tx` provides every model accessor that `prisma` does.
 */
export type TxOrPrisma =
  | typeof prisma
  | Omit<typeof prisma, "$transaction" | "$disconnect" | "$connect" | "$on" | "$use" | "$extends">;
