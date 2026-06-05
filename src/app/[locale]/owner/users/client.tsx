"use client"; import { useTranslations } from "next-intl"; import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; import { Button } from "@/components/ui/button"; import { Input } from "@/components/ui/input"; import { Search } from "lucide-react"; import { useState } from "react"; import { useToast } from "@/components/ui/toast";
type UserInfo = { id: string; name: string; email: string; role: string; active: boolean; phone: string | null; createdAt: Date; organizationId: string; organization: { name: string }; };
export function UsersClient({ users: initialUsers }: { users: UserInfo[] }) {
  const t = useTranslations("ownerPanel");
  const [users, setUsers] = useState(initialUsers);
  const [userSearch, setUserSearch] = useState("");
  const { toast } = useToast();
  async function toggleUserActive(userId: string, active: boolean) {
    const r = await fetch(`/api/owner/users/${userId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ active: !active }) });
    if (!r.ok) { toast({ title: t("errorTitle"), message: t("failedUpdateUser"), type: "error" }); return; }
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, active: !active } : u));
    toast({ title: t("successTitle"), message: `${!active ? t("userActivated") : t("userDeactivated")}`, type: "success" });
  }
  const filteredUsers = users.filter(u => u.name.toLowerCase().includes(userSearch.toLowerCase()) || u.email.toLowerCase().includes(userSearch.toLowerCase()) || u.organization.name.toLowerCase().includes(userSearch.toLowerCase()));
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">{t("usersTitle", { count: users.length })}</CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input className="pl-8 h-8 text-xs" placeholder={t("searchUsers")} value={userSearch} onChange={e => setUserSearch(e.target.value)} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead><tr className="border-b text-left"><th className="p-3 font-medium text-gray-500">{t("userName")}</th><th className="p-3 font-medium text-gray-500">{t("userEmail")}</th><th className="p-3 font-medium text-gray-500">{t("userOrg")}</th><th className="p-3 font-medium text-gray-500">{t("userRole")}</th><th className="p-3 font-medium text-gray-500">{t("userStatus")}</th><th className="p-3 font-medium text-gray-500">{t("userActions")}</th></tr></thead>
            <tbody>{filteredUsers.length === 0 ? <tr><td colSpan={6} className="p-6 text-center text-gray-400">{t("noUsers")}</td></tr> : filteredUsers.map((u) => (
              <tr key={u.id} className="border-b hover:bg-gray-50">
                <td className="p-3 font-medium">{u.name}</td>
                <td className="p-3 text-gray-500">{u.email}</td>
                <td className="p-3 text-gray-500">{u.organization.name}</td>
                <td className="p-3"><span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100">{u.role}</span></td>
                <td className="p-3"><span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${u.active ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50"}`}>{u.active ? t("activeLabel") : t("inactiveLabel")}</span></td>
                <td className="p-3"><Button size="sm" variant="ghost" onClick={() => toggleUserActive(u.id, u.active)}>{u.active ? t("deactivate") : t("activate")}</Button></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
