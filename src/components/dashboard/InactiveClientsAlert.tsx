import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useInactiveClients, useInactivityDays } from "@/hooks/useDashboardData";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { AlertTriangle, X, ArrowRight } from "lucide-react";

const ALERT_DISMISSED_KEY = "inactive_clients_alert_dismissed";

export const InactiveClientsAlert = () => {
  const navigate = useNavigate();
  const { isAdmin, isReceptionist } = useAuth();
  const [visible, setVisible] = useState(false);
  const { data: inactiveClients } = useInactiveClients();
  const { data: inactivityDays } = useInactivityDays();

  useEffect(() => {
    if (!inactiveClients || inactiveClients.length === 0) return;
    const dismissed = sessionStorage.getItem(ALERT_DISMISSED_KEY);
    if (!dismissed) setVisible(true);
  }, [inactiveClients]);

  const handleDismiss = () => {
    sessionStorage.setItem(ALERT_DISMISSED_KEY, "true");
    setVisible(false);
  };

  // Only show to admins and receptionists
  if (!isAdmin && !isReceptionist) return null;
  if (!visible || !inactiveClients || inactiveClients.length === 0) return null;

  return (
    <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 min-w-0">
        <AlertTriangle className="w-5 h-5 text-destructive shrink-0" />
        <div className="min-w-0">
          <p className="font-medium text-sm">
            {inactiveClients.length} cliente{inactiveClients.length > 1 ? "s" : ""} inativo{inactiveClients.length > 1 ? "s" : ""}
          </p>
          <p className="text-xs text-muted-foreground">
            Sem atendimento há mais de {inactivityDays ?? 90} dias. Considere entrar em contato.
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate("/clientes-inativos")}
          className="text-xs"
        >
          Ver lista <ArrowRight className="w-3 h-3 ml-1" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleDismiss}>
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
