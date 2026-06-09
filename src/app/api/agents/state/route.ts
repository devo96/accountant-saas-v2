import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getState } from "@/lib/agents/store";

export const dynamic = "force-dynamic";

// Snapshot of the whole control room (members + tasks + messages).
// Readable by any logged-in user; the page polls this.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const state = await getState();
  return NextResponse.json(state);
}
