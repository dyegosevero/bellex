import { useState } from "react";
import { useInactiveClients, useInactivityDays } from "@/hooks/useDashboardData";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { invokeEdgeFunction } from "@/lib/edge-functions";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { RichEditor } from "@/components/ui/rich-editor";
import { ArrowLeft, Download, Mail, UserX, MessageCircle, MessageSquare, Loader2, Send, Trash2, AlertTriangle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { fmtDate } from "@/lib/date";
import { toast } from "sonner";

function exportCSV(clients: Array<{ client_id: string; client_name: string; phone: string | null; email: string | null; last_visit: string | null; days_inactive: number | null; appointment_count?: number }>) {
  const header = "Nome,Telefone,Email,Atendimentos,Última Visita,Dias Inativo\n";
  const rows = clients.map((c) =>
    [
      `"${c.client_name}"`,
      c.phone || "",
      c.email || "",
      c.appointment_count ?? 0,
      c.last_visit ? fmtDate(c.last_visit) : "Nunca",
      c.days_inactive ?? "",
    ].join(",")
  ).join("\n");

  const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `clientes-inativos-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

const InactiveClients = () => {
  const navigate = useNavigate();
  const { canDelete } = useAuth();
  const queryClient = useQueryClient();
  const { data: clients, isLoading } = useInactiveClients();
  const { data: inactivityDays } = useInactivityDays();
  const [deleteId, setDeleteId] = useState<{ id: string; name: string } | null>(null);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await invokeEdgeFunction("delete-client", { body: { client_id: id } });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Cliente removido com sucesso");
      queryClient.invalidateQueries({ queryKey: ["inactive-clients"] });
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      setDeleteId(null);
    },
    onError: () => toast.error("Erro ao remover cliente"),
  });

  // SMS state
  const [smsDialog, setSmsDialog] = useState<{ phone: string; name: string } | null>(null);
  const [smsMessage, setSmsMessage] = useState("");
  const [sendingSms, setSendingSms] = useState(false);

  // Email state
  const [emailDialog, setEmailDialog] = useState<{ email: string; name: string } | null>(null);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);

  const { data: reactivationMsg } = useQuery({
    queryKey: ["message-template-reactivation"],
    queryFn: async () => {
      const { data } = await supabase
        .from("message_templates")
        .select("content")
        .eq("slug", "reactivation")
        .maybeSingle();
      return data?.content ?? "Olá {nome}! Sentimos a sua falta. Que tal agendar uma visita?";
    },
  });

  const { data: smsTemplate } = useQuery({
    queryKey: ["message-template-inactive-sms"],
    queryFn: async () => {
      const { data } = await supabase
        .from("message_templates")
        .select("content")
        .eq("slug", "inactive_sms")
        .maybeSingle();
      return data?.content ?? "Olá {nome}! Sentimos a sua falta. Que tal agendar uma nova visita? Responda a esta mensagem para agendarmos.";
    },
  });

  const { data: smsSettings } = useQuery({
    queryKey: ["sms-integration-settings"],
    queryFn: async () => {
      const { data } = await supabase
        .from("integration_settings")
        .select("setting_key, setting_value")
        .in("setting_key", ["sms_request_url", "sms_api_token", "whatsapp_api_key"]);
      const map: Record<string, string> = {};
      (data ?? []).forEach((s) => { if (s.setting_value) map[s.setting_key] = s.setting_value; });
      return map;
    },
  });

  const { data: emailSender } = useQuery({
    queryKey: ["email-sender-info"],
    queryFn: async () => {
      const { data } = await supabase
        .from("integration_settings")
        .select("setting_key, setting_value")
        .in("setting_key", ["email_from_name", "email_from_address"]);
      const map: Record<string, string> = {};
      (data ?? []).forEach((s) => { if (s.setting_value) map[s.setting_key] = s.setting_value; });
      return map.email_from_address ? { from_name: map.email_from_name || "", from_email: map.email_from_address } : null;
    },
  });

  const buildWhatsAppUrl = (phone: string, clientName: string) => {
    const message = (reactivationMsg ?? "").replace(/\{nome\}/g, clientName.split(" ")[0]);
    const cleanPhone = phone.replace(/\D/g, "");
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  };

  const openSmsDialog = (phone: string, name: string) => {
    const msg = (smsTemplate ?? "").replace(/\{nome\}/g, name.split(" ")[0]);
    setSmsMessage(msg);
    setSmsDialog({ phone, name });
  };

  const openEmailDialog = (email: string, name: string) => {
    setEmailSubject("");
    setEmailBody("");
    setEmailDialog({ email, name });
  };

  const sendSms = async () => {
    if (!smsDialog || !smsMessage.trim()) return;
    if (!smsSettings?.sms_request_url) {
      toast.error("Configuração de SMS incompleta. Acesse Configurações > Integrações para configurar a URL de Request.");
      return;
    }
    if (!smsSettings?.sms_api_token) {
      toast.error("Configuração de SMS incompleta. Defina também o API Token em Configurações > Integrações.");
      return;
    }
    setSendingSms(true);
    try {
      const cleanPhone = smsDialog.phone.replace(/\D/g, "");

      const payload: Record<string, unknown> = {
        token: smsSettings.sms_api_token || "",
        callback: "",
        mensagem: smsMessage,
        remetente: "",
        destinatario: `+${cleanPhone}`,
      };

      const res = await fetch(smsSettings.sms_request_url.trim(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || err.error || `Erro ${res.status}`);
      }

      toast.success(`SMS enviado para ${smsDialog.name}`);
      setSmsDialog(null);
    } catch (err: any) {
      toast.error(err.message || "Erro ao enviar SMS");
    } finally {
      setSendingSms(false);
    }
  };

  const sendEmail = async () => {
    if (!emailDialog || !emailSubject.trim() || !emailBody.trim()) return;
    setSendingEmail(true);
    try {
      const { data, error } = await invokeEdgeFunction("send-email", {
        body: {
          to: emailDialog.email,
          subject: emailSubject,
          html: emailBody,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success(`E-mail enviado para ${emailDialog.name}`);
      setEmailDialog(null);
    } catch (err: any) {
      toast.error(err.message || "Erro ao enviar e-mail");
    } finally {
      setSendingEmail(false);
    }
  };

  const senderDisplay = emailSender
    ? `${emailSender.from_name} <${emailSender.from_email}>`
    : "E-mail não configurado";

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}><ArrowLeft className="w-4 h-4" /></Button>
          <div>
            <h1 className="text-2xl font-light tracking-wider">Clientes Inativos</h1>
            <p className="text-sm text-muted-foreground mt-1">Clientes sem atendimento há mais de {inactivityDays ?? 90} dias</p>
          </div>
        </div>
        <Button variant="outline" disabled={!clients?.length} onClick={() => clients && exportCSV(clients)} className="self-end sm:self-auto">
          <Download className="w-4 h-4 mr-2" /> Exportar CSV
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
      ) : clients && clients.length > 0 ? (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs uppercase tracking-wider">Nome</TableHead>
                <TableHead className="text-xs uppercase tracking-wider">Telefone</TableHead>
                <TableHead className="text-xs uppercase tracking-wider">Email</TableHead>
                <TableHead className="text-xs uppercase tracking-wider text-center">Atendimentos</TableHead>
                <TableHead className="text-xs uppercase tracking-wider">Última Visita</TableHead>
                <TableHead className="text-xs uppercase tracking-wider">Dias Inativo</TableHead>
                <TableHead className="text-xs uppercase tracking-wider">Contato</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((c) => (
                <TableRow key={c.client_id} className="cursor-pointer" onClick={() => navigate(`/clientes/${c.client_id}`)}>
                  <TableCell className="font-medium">{c.client_name}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{c.phone || "—"}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{c.email || "—"}</TableCell>
                  <TableCell className="text-center text-sm">{(c as any).appointment_count ?? 0}</TableCell>
                  <TableCell className="text-sm">{c.last_visit ? fmtDate(c.last_visit) : "Nunca"}</TableCell>
                  <TableCell>
                    <Badge variant={(c.days_inactive ?? 0) > 180 ? "destructive" : "secondary"} className="text-[10px]">{c.days_inactive ?? "∞"} dias</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      {c.phone && (
                        <>
                          <a
                            href={buildWhatsAppUrl(c.phone, c.client_name)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:text-primary/80 transition-colors"
                            title="Enviar WhatsApp"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </a>
                          <button
                            onClick={() => openSmsDialog(c.phone!, c.client_name)}
                            className="text-accent-foreground hover:text-foreground transition-colors"
                            title="Enviar SMS"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      {c.email && (
                        <button
                          onClick={() => openEmailDialog(c.email!, c.client_name)}
                          className="text-muted-foreground hover:text-foreground transition-colors"
                          title="Enviar E-mail"
                        >
                          <Mail className="w-4 h-4" />
                        </button>
                      )}
                      {canDelete && (
                        <button
                          onClick={() => setDeleteId({ id: c.client_id, name: c.client_name })}
                          className="text-destructive hover:text-destructive/80 transition-colors"
                          title="Remover cliente"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-lg p-12 text-center">
          <UserX className="w-10 h-10 text-muted-foreground/40 mx-auto mb-4" />
          <p className="text-muted-foreground text-sm">Nenhum cliente inativo encontrado. Todos os clientes têm atividade recente!</p>
        </div>
      )}

      {/* SMS Dialog */}
      <Dialog open={!!smsDialog} onOpenChange={(open) => !open && setSmsDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Enviar SMS para {smsDialog?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Destinatário: <span className="font-medium text-foreground">{smsDialog?.phone}</span>
            </p>
            <Textarea
              value={smsMessage}
              onChange={(e) => setSmsMessage(e.target.value)}
              rows={4}
              placeholder="Mensagem..."
              className="resize-none"
            />
            <p className="text-[10px] text-muted-foreground">{smsMessage.length} caracteres</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSmsDialog(null)}>Cancelar</Button>
            <Button onClick={sendSms} disabled={sendingSms || !smsMessage.trim()}>
              {sendingSms ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <MessageSquare className="w-4 h-4 mr-2" />}
              Enviar SMS
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Remover cliente
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover <strong>{deleteId?.name}</strong>? Essa ação é irreversível e todos os dados associados serão perdidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className={buttonVariants({ variant: "destructive" })}
              onClick={() => deleteId && deleteMutation.mutate(deleteId.id)}
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Email Dialog */}
      <Dialog open={!!emailDialog} onOpenChange={(open) => !open && setEmailDialog(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Enviar E-mail
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Remetente</Label>
              <Input value={senderDisplay} readOnly className="bg-muted text-muted-foreground text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Destinatário</Label>
              <Input value={emailDialog?.email ?? ""} readOnly className="bg-muted text-muted-foreground text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Assunto</Label>
              <Input
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="Assunto do e-mail..."
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Corpo</Label>
              <RichEditor
                value={emailBody}
                onChange={(html) => setEmailBody(html)}
                placeholder="Escreva a sua mensagem..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmailDialog(null)}>Cancelar</Button>
            <Button
              onClick={sendEmail}
              disabled={sendingEmail || !emailSubject.trim() || !emailBody.trim() || !emailSender}
            >
              {sendingEmail ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
              Enviar E-mail
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InactiveClients;
