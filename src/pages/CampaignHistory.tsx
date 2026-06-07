import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Mail, MessageCircle, ArrowLeft, Clock, History,
  CheckCircle2, XCircle, AlertCircle,
} from "lucide-react";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

const channelIcons: Record<string, React.ReactNode> = {
  email: <Mail className="w-4 h-4" />,
  sms: <MessageCircle className="w-4 h-4" />,
  whatsapp: <WhatsAppIcon className="w-4 h-4" />,
};

const channelLabels: Record<string, string> = {
  email: "E-mail",
  sms: "SMS",
  whatsapp: "WhatsApp",
};

const recipientStatusIcon: Record<string, React.ReactNode> = {
  sent: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />,
  failed: <XCircle className="w-3.5 h-3.5 text-destructive" />,
  pending: <Clock className="w-3.5 h-3.5 text-muted-foreground" />,
  opened: <Mail className="w-3.5 h-3.5 text-blue-500" />,
};

const recipientStatusLabel: Record<string, string> = {
  sent: "Enviado",
  failed: "Falhou",
  pending: "Pendente",
  opened: "Aberto",
};

export default function CampaignHistory() {
  const navigate = useNavigate();

  const { data: history, isLoading } = useQuery({
    queryKey: ["campaign-history"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("campaign_recipients")
        .select("*, campaigns(name, channel), clients(full_name, email, phone)")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/marketing")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-light tracking-wider flex items-center gap-2">
            <History className="w-6 h-6" /> HISTÓRICO DE ENVIOS
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Últimos envios de campanhas.</p>
        </div>
      </div>

      <Card>
        <div className="p-4 border-b flex items-center gap-2">
          <History className="w-4 h-4 text-muted-foreground" />
          <h2 className="font-medium text-sm">Últimos envios</h2>
          <span className="text-xs text-muted-foreground ml-auto">
            {history?.length ?? 0} registos
          </span>
        </div>
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : !history?.length ? (
          <div className="p-12 text-center">
            <AlertCircle className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">Nenhum envio registado.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Campanha</TableHead>
                <TableHead>Canal</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((r: any) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">
                    {r.clients?.full_name ?? "—"}
                  </TableCell>
                  <TableCell className="text-sm">
                    {r.campaigns?.name ?? "—"}
                  </TableCell>
                  <TableCell>
                    <span className="flex items-center gap-1.5 text-xs">
                      {channelIcons[r.campaigns?.channel] ?? null}
                      {channelLabels[r.campaigns?.channel] ?? "—"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="flex items-center gap-1.5 text-xs">
                      {recipientStatusIcon[r.status] ?? recipientStatusIcon.pending}
                      {recipientStatusLabel[r.status] ?? r.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {r.sent_at
                      ? format(new Date(r.sent_at), "dd/MM/yyyy HH:mm", { locale: pt })
                      : r.created_at
                      ? format(new Date(r.created_at), "dd/MM/yyyy HH:mm", { locale: pt })
                      : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
