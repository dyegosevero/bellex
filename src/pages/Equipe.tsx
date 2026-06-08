import { Users } from "lucide-react";
import { UsersTab } from "./Admin";
import { PageHeader } from "@/components/ui/PageHeader";

export default function Equipe() {
  return (
    <div className="space-y-6">
      <PageHeader icon={<Users className="w-5 h-5" />} title="Equipe" subtitle="Gerencie usuários e permissões do sistema." />
      <UsersTab />
    </div>
  );
}
