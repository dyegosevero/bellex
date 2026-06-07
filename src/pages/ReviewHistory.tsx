import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ArrowLeft, Star, CheckCircle2, Clock, Send, Users, Loader2, AlertTriangle,
} from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

const STATUS_META: Record<
  string,
  { label: string; icon: any; variant: "default" | "secondary" | "outline" | "destructive" }
> = {
  queued: { label: "Na fila", icon: Send, variant: "secondary" },
  reserved: { label: "Em envio", icon: Loader2, variant: "outline" },
  delivered: { label: "Entregue", icon: CheckCircle2, variant: "default" },
  confirmed: { label: "Avaliou", icon: Star, variant: "default" },
  failed: { label: "Falhou", icon: AlertTriangle, variant: "destructive" },
};

export default function ReviewHistory() {
  const navigate = useNavigate();

  const { data: requests, isLoading } = useQuery({
    queryKey: ["review-history"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("review_requests")
        .select("id, client_id, send_count, last_sent_at, next_send_at, confirmed_at, created_at, delivery_status, last_error, delivered_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      if (!data || data.length === 0) return [];

      const clientIds = [...new Set(data.map((r: any) => r.client_id))];
      const { data: clients } = await supabase
        .from("clients")
        .select("id, full_name, phone, email")
        .in("id", clientIds);

      const clientMap: Record<string, any> = {};
      (clients || []).forEach((c: any) => { clientMap[c.id] = c; });

      return data.map((r: any) => ({
        ...r,
        client: clientMap[r.client_id] || { full_name: "—", phone: "", email: "" },
      }));
    },
  });

  const counts = {
    queued: requests?.filter((r: any) => r.delivery_status === "queued").length || 0,
    reserved: requests?.filter((r: any) => r.delivery_status === "reserved").length || 0,
    delivered: requests?.filter((r: any) => r.delivery_status === "delivered").length || 0,
    confirmed: requests?.filter((r: any) => r.delivery_status === "confirmed").length || 0,
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/marketing")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-light tracking-wider flex items-center gap-2">
              <Star className="w-6 h-6" /> HISTÓRICO DE AVALIAÇÕES
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Todos os pedidos de avaliação Google enviados.
            </p>
          </div>
        </div>

        {/* KPIs — 4 estados reais */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Na fila", value: counts.queued, icon: Send },
            { label: "Em envio", value: counts.reserved, icon: Loader2 },
            { label: "Entregues", value: counts.delivered, icon: CheckCircle2 },
            { label: "Avaliaram", value: counts.confirmed, icon: Star },
          ].map((kpi) => (
            <Card key={kpi.label} className="p-3 text-center">
              <kpi.icon className="w-4 h-4 mx-auto text-muted-foreground mb-1" />
              <p className="text-2xl font-semibold">{kpi.value}</p>
              <p className="text-xs text-muted-foreground">{kpi.label}</p>
            </Card>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : !requests?.length ? (
          <Card className="p-12 text-center">
            <Star className="w-12 h-12 mx-auto text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground">Nenhum pedido de avaliação registado.</p>
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead className="text-center">Envios</TableHead>
                  <TableHead>Último envio</TableHead>
                  <TableHead>Próximo envio</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Criado em</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((r: any) => {
                  const meta = STATUS_META[r.delivery_status] || STATUS_META.queued;
                  const Icon = meta.icon;
                  const badge = (
                    <Badge variant={meta.variant} className="text-[10px] gap-1">
                      <Icon className={`w-3 h-3 ${r.delivery_status === "reserved" ? "animate-spin" : ""}`} />
                      {meta.label}
                    </Badge>
                  );
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.client.full_name}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {r.client.phone || r.client.email || "—"}
                      </TableCell>
                      <TableCell className="text-center">{r.send_count}</TableCell>
                      <TableCell className="text-xs">
                        {r.last_sent_at
                          ? format(new Date(r.last_sent_at), "dd MMM yyyy HH:mm", { locale: pt })
                          : "—"}
                      </TableCell>
                      <TableCell className="text-xs">
                        {r.confirmed_at
                          ? "—"
                          : r.next_send_at
                            ? format(new Date(r.next_send_at), "dd MMM yyyy", { locale: pt })
                            : "—"}
                      </TableCell>
                      <TableCell>
                        {r.delivery_status === "failed" && r.last_error ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span>{badge}</span>
                            </TooltipTrigger>
                            <TooltipContent>{r.last_error}</TooltipContent>
                          </Tooltip>
                        ) : r.delivery_status === "reserved" ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span>{badge}</span>
                            </TooltipTrigger>
                            <TooltipContent>Aguarda confirmação do n8n</TooltipContent>
                          </Tooltip>
                        ) : badge}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {format(new Date(r.created_at), "dd MMM yyyy", { locale: pt })}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>
    </TooltipProvider>
  );
}
