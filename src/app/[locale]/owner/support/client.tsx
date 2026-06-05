"use client"; import { useTranslations } from "next-intl"; import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; import { Button } from "@/components/ui/button"; import { Select } from "@/components/ui/select"; import { Dialog } from "@/components/ui/dialog"; import { Plus, Ticket } from "lucide-react"; import { useState, useCallback } from "react"; import { NewTicketForm } from "../_forms";
type TicketInfo = { id: string; organizationId: string; subject: string; message: string; status: string; priority: string; createdBy: string; assignedTo: string | null; createdAt: string; organization: { name: string }; user: { name: string; email: string } | null };
const statusColor: Record<string, string> = { OPEN: "text-blue-600 bg-blue-50", IN_PROGRESS: "text-amber-600 bg-amber-50", RESOLVED: "text-green-600 bg-green-50", CLOSED: "text-gray-400 bg-gray-100" };
const priorityColor: Record<string, string> = { LOW: "text-gray-400", NORMAL: "text-blue-500", HIGH: "text-amber-500", URGENT: "text-red-500" };
export function SupportClient({ tickets: initialTickets }: { tickets: TicketInfo[] }) {
  const t = useTranslations("ownerPanel");
  const [tickets, setTickets] = useState(initialTickets);
  const [ticketDialog, setTicketDialog] = useState(false);
  const refresh = useCallback(async () => { const r = await fetch("/api/owner/tickets"); if (r.ok) setTickets(await r.json()); }, []);
  async function updateStatus(id: string, status: string) { await fetch(`/api/owner/tickets/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) }); refresh(); }
  return (
    <div>
      <div className="flex justify-end mb-3"><Button size="sm" onClick={() => setTicketDialog(true)}><Plus className="h-4 w-4 mr-1" />{t("newTicket")}</Button></div>
      <Card>
        <CardHeader><CardTitle className="text-sm"><Ticket className="h-4 w-4 inline-block mr-1" />{t("ticketsTitle", { count: tickets.length })}</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="border-b text-left"><th className="p-3 font-medium text-gray-500">{t("ticketSubject")}</th><th className="p-3 font-medium text-gray-500">{t("ticketOrg")}</th><th className="p-3 font-medium text-gray-500">{t("ticketPriority")}</th><th className="p-3 font-medium text-gray-500">{t("ticketStatus")}</th><th className="p-3 font-medium text-gray-500">{t("ticketCreated")}</th></tr></thead>
              <tbody>{tickets.length === 0 ? <tr><td colSpan={5} className="p-6 text-center text-gray-400">{t("noTickets")}</td></tr> : tickets.map((ticket) => (
                <tr key={ticket.id} className="border-b hover:bg-gray-50">
                  <td className="p-3 font-medium">{ticket.subject}</td>
                  <td className="p-3 text-gray-500">{ticket.organization.name}</td>
                  <td className="p-3"><span className={`font-medium ${priorityColor[ticket.priority] ?? ""}`}>{t(`priority${ticket.priority.charAt(0) + ticket.priority.slice(1).toLowerCase()}`)}</span></td>
                  <td className="p-3">
                    <Select options={[{ value: "OPEN", label: t("statusOPEN") }, { value: "IN_PROGRESS", label: t("statusIN_PROGRESS") }, { value: "RESOLVED", label: t("statusRESOLVED") }, { value: "CLOSED", label: t("statusCLOSED") }]} value={ticket.status} onChange={(e) => updateStatus(ticket.id, e.target.value)} />
                  </td>
                  <td className="p-3 text-gray-500">{new Date(ticket.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      {ticketDialog && (
        <Dialog open onClose={() => setTicketDialog(false)} title={t("newTicketDialog")}>
          <NewTicketForm onClose={() => { setTicketDialog(false); refresh(); }} />
        </Dialog>
      )}
    </div>
  );
}
