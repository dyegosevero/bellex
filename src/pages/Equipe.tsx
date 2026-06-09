import { Users, Plus } from "lucide-react";
import { UsersTab } from "./Admin";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function Equipe() {
  const navigate = useNavigate();
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          icon={<Users className="w-5 h-5" />}
          title="Equipe"
          subtitle="Gerencie usuários e permissões do sistema."
          className="mb-0"
        />
        <Button onClick={() => navigate("/admin/usuarios/novo")}>
          <Plus className="w-4 h-4 mr-2" /> Novo Usuário
        </Button>
      </div>
      <UsersTab />
    </div>
  );
}
