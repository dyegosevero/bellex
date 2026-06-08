import { Users } from "lucide-react";
import { UsersTab } from "./Admin";

export default function Equipe() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-light tracking-wider flex items-center gap-2">
          <Users className="w-6 h-6" /> EQUIPE
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Gerencie usuários e permissões do sistema.</p>
      </div>
      <UsersTab />
    </div>
  );
}
