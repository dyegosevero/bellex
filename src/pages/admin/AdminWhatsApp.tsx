import { useState, useEffect, useCallback } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter as ADF, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { ChevronLeft, Plus, QrCode, Trash2, RefreshCw, Loader2, Smartphone, CheckCircle2, AlertCircle, Wifi } from "lucide-react";
import { BlurFade } from "@/components/ui/blur-fade";
import { cn } from "@/lib/utils";

export interface WaInstance {
  instanceName: string;
  instanceId: string;
  status: "open" | "connecting" | "close";
}

function statusInfo(status: string) {
  if (status === "open")       return { label: "Conectado",    cls: "text-green-600",  bg: "bg-green-500/10",  icon: <CheckCircle2 className="w-4 h-4 text-green-500" /> };
  if (status === "connecting") return { label: "Conectando",   cls: "text-yellow-600", bg: "bg-yellow-500/10", icon: <Loader2 className="w-4 h-4 text-yellow-500 animate-spin" /> };
  return                              { label: "Desconectado", cls: "text-red-500",    bg: "bg-red-500/10",    icon: <AlertCircle className="w-4 h-4 text-red-400" /> };
}

export default function AdminWhatsApp() {
  const { role }   = useAuth();
  const navigate   = useNavigate();

  if (role !== "admin") return <Navigate to="/dashboard" replace />;

  const [evoUrl, setEvoUrl]           = useState("");
  const [evoKey, setEvoKey]           = useState("");
  const [instances, setInstances]     = useState<WaInstance[]>([]);
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState("");

  const [newOpen, setNewOpen]         = useState(false);
  const [newName, setNewName]         = useState("");
  const [creating, setCreating]       = useState(false);

  const [qrOpen, setQrOpen]           = useState(false);
  const [qrInstance, setQrInstance]   = useState("");
  const [qrImg, setQrImg]             = useState("");
  const [qrState, setQrState]         = useState<"loading"|"qr"|"open"|"error">("loading");

  const [deleting, setDeleting]       = useState("");

  // ── Load EvoAPI config ──────────────────────────────────────────────────────
  useEffect(() => {
    supabase
      .from("clinic_settings")
      .select("setting_key, setting_value")
      .in("setting_key", ["whatsapp_request_url", "whatsapp_api_key"])
      .then(({ data }) => {
        if (data) {
          const m = Object.fromEntries(data.map(s => [s.setting_key, s.setting_value ?? ""]));
          setEvoUrl((m.whatsapp_request_url as string) || "");
          setEvoKey((m.whatsapp_api_key as string) || "");
        }
        setLoading(false);
      });
  }, []);

  // ── Fetch instances ─────────────────────────────────────────────────────────
  const fetchInstances = useCallback(async (url = evoUrl, key = evoKey) => {
    if (!url || !key) return;
    try {
      const res  = await fetch(`${url.replace(/\/$/, "")}/instance/fetchInstances`, { headers: { apikey: key } });
      const data = await res.json();
      const raw  = Array.isArray(data) ? data : (data.instances || []);
      setInstances(raw.map((item: any) => {
        const inst = item.instance || item;
        return {
          instanceName: inst.instanceName || inst.name || "",
          instanceId:   inst.instanceId   || inst.id   || "",
          status:       inst.connectionStatus || inst.state || inst.status || "close",
        } as WaInstance;
      }).filter((i: WaInstance) => i.instanceName));
    } catch {
      toast.error("Erro ao carregar instâncias.");
    }
  }, [evoUrl, evoKey]);

  useEffect(() => { if (evoUrl && evoKey) fetchInstances(); }, [evoUrl, evoKey, fetchInstances]);

  // ── Check single status ─────────────────────────────────────────────────────
  const checkStatus = async (name: string) => {
    setRefreshing(name);
    try {
      const res  = await fetch(`${evoUrl.replace(/\/$/, "")}/instance/connectionState/${name}`, { headers: { apikey: evoKey } });
      const data = await res.json();
      const st   = data?.instance?.state || data?.state || "close";
      setInstances(prev => prev.map(i => i.instanceName === name ? { ...i, status: st } : i));
    } catch {} finally { setRefreshing(""); }
  };

  // ── Create instance ─────────────────────────────────────────────────────────
  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const res  = await fetch(`${evoUrl.replace(/\/$/, "")}/instance/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: evoKey },
        body: JSON.stringify({ instanceName: newName.trim(), integration: "WHATSAPP-BAILEYS" }),
      });
      const data = await res.json();
      if (data.status === 403 || data.error) throw new Error(data.message || "Erro ao criar instância");
      await fetchInstances();
      setNewOpen(false);
      setNewName("");
      toast.success("Instância criada! Escaneie o QR Code.");
      openQr(newName.trim());
    } catch (e: any) {
      toast.error(e.message);
    } finally { setCreating(false); }
  };

  // ── QR Code ─────────────────────────────────────────────────────────────────
  const openQr = async (name: string) => {
    setQrInstance(name);
    setQrImg("");
    setQrState("loading");
    setQrOpen(true);

    try {
      const stRes  = await fetch(`${evoUrl.replace(/\/$/, "")}/instance/connectionState/${name}`, { headers: { apikey: evoKey } });
      const stData = await stRes.json();
      const st     = stData?.instance?.state || stData?.state || "close";

      if (st === "open") { setQrState("open"); await fetchInstances(); return; }

      const qRes  = await fetch(`${evoUrl.replace(/\/$/, "")}/instance/connect/${name}`, { headers: { apikey: evoKey } });
      const qData = await qRes.json();

      const b64 = qData?.base64 || qData?.qrcode?.base64 || qData?.code || "";
      if (b64) {
        setQrImg(b64.startsWith("data:") ? b64 : `data:image/png;base64,${b64}`);
        setQrState("qr");
      } else if (qData?.instance?.status === "open") {
        setQrState("open");
      } else {
        setQrState("error");
      }
    } catch { setQrState("error"); }
  };

  // ── Delete ──────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    try {
      await fetch(`${evoUrl.replace(/\/$/, "")}/instance/delete/${deleting}`, {
        method: "DELETE", headers: { apikey: evoKey },
      });
      await fetchInstances();
      toast.success("Instância removida.");
    } catch { toast.error("Erro ao remover instância."); }
    finally { setDeleting(""); }
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;

  if (!evoUrl || !evoKey) return (
    <div>
      <Button variant="outline" size="sm" className="mb-6 gap-1 text-muted-foreground hover:bg-muted" onClick={() => navigate("/admin")}>
        <ChevronLeft className="w-4 h-4" /> Configurações
      </Button>
      <div className="rounded-2xl border border-dashed border-border p-12 text-center">
        <Wifi className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground mb-1">Evolution API não configurada.</p>
        <p className="text-xs text-muted-foreground mb-4">Configure a URL e chave da API em Integrações.</p>
        <Button variant="outline" size="sm" onClick={() => navigate("/admin/integracoes")}>Ir para Integrações</Button>
      </div>
    </div>
  );

  return (
    <div>
      <Button variant="outline" size="sm" className="mb-6 gap-1 text-muted-foreground hover:bg-muted" onClick={() => navigate("/admin")}>
        <ChevronLeft className="w-4 h-4" /> Configurações
      </Button>

      <BlurFade delay={0.05}>
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-light tracking-wider">WhatsApp</h1>
            <p className="text-sm text-muted-foreground mt-1">Gerencie instâncias WhatsApp conectadas via Evolution API.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => fetchInstances()}>
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button size="sm" className="gap-1.5" onClick={() => setNewOpen(true)}>
              <Plus className="w-4 h-4" /> Nova Instância
            </Button>
          </div>
        </div>
      </BlurFade>

      {instances.length === 0 ? (
        <BlurFade delay={0.1}>
          <div className="rounded-2xl border border-dashed border-border p-12 text-center">
            <Smartphone className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Nenhuma instância criada.</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={() => setNewOpen(true)}>
              <Plus className="w-4 h-4 mr-1" /> Criar instância
            </Button>
          </div>
        </BlurFade>
      ) : (
        <BlurFade delay={0.1}>
          <div className="space-y-3">
            {instances.map(inst => {
              const { label, cls, bg, icon } = statusInfo(inst.status);
              return (
                <div key={inst.instanceName} className="rounded-2xl border border-border bg-card p-5 flex items-center gap-4">
                  <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center shrink-0", bg)}>
                    <Smartphone className={cn("w-5 h-5", cls)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 mb-1">
                      <span className="font-medium text-sm">{inst.instanceName}</span>
                      <div className="flex items-center gap-1">
                        {icon}
                        <span className={cn("text-xs", cls)}>{label}</span>
                      </div>
                    </div>
                    <p className="text-[11px] text-muted-foreground font-mono truncate">{inst.instanceId || "—"}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8" onClick={() => openQr(inst.instanceName)}>
                      <QrCode className="w-3.5 h-3.5" />
                      {inst.status === "open" ? "Status" : "QR Code"}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" disabled={refreshing === inst.instanceName} onClick={() => checkStatus(inst.instanceName)}>
                      <RefreshCw className={cn("w-3.5 h-3.5", refreshing === inst.instanceName && "animate-spin")} />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => setDeleting(inst.instanceName)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </BlurFade>
      )}

      {/* ── Nova instância ── */}
      <Dialog open={newOpen} onOpenChange={v => { setNewOpen(v); if (!v) setNewName(""); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-light">Nova Instância WhatsApp</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Nome da instância</Label>
              <Input
                placeholder="Ex: clinica-principal"
                value={newName}
                onChange={e => setNewName(e.target.value.replace(/\s+/g, "-").toLowerCase())}
                onKeyDown={e => e.key === "Enter" && handleCreate()}
              />
              <p className="text-[11px] text-muted-foreground">Somente letras minúsculas, números e hífens.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={creating || !newName.trim()}>
              {creating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Criar e Conectar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── QR Code ── */}
      <Dialog open={qrOpen} onOpenChange={setQrOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-light">
              {qrState === "open" ? "Conectado" : `Conectar • ${qrInstance}`}
            </DialogTitle>
          </DialogHeader>
          <div className="py-6 flex flex-col items-center gap-4 min-h-[220px] justify-center">
            {qrState === "loading" && <><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /><p className="text-sm text-muted-foreground">Aguarde...</p></>}
            {qrState === "qr" && qrImg && (
              <>
                <img src={qrImg} alt="QR Code" className="w-52 h-52 rounded-xl border border-border shadow-sm" />
                <p className="text-xs text-center text-muted-foreground max-w-xs">
                  Abra o WhatsApp → Dispositivos conectados → Conectar dispositivo
                </p>
                <Button variant="outline" size="sm" className="gap-1.5" onClick={() => openQr(qrInstance)}>
                  <RefreshCw className="w-3.5 h-3.5" /> Atualizar QR
                </Button>
              </>
            )}
            {qrState === "open" && (
              <>
                <div className="w-16 h-16 rounded-2xl bg-green-500/10 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-green-500" />
                </div>
                <p className="text-sm text-muted-foreground text-center">WhatsApp conectado com sucesso!</p>
              </>
            )}
            {qrState === "error" && (
              <>
                <AlertCircle className="w-8 h-8 text-destructive" />
                <p className="text-sm text-muted-foreground text-center">Não foi possível gerar o QR Code.</p>
                <Button variant="outline" size="sm" onClick={() => openQr(qrInstance)}>Tentar novamente</Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Confirmar exclusão ── */}
      <AlertDialog open={!!deleting} onOpenChange={v => !v && setDeleting("")}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover instância?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{deleting}</strong> será desconectada e removida permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <ADF>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Remover</AlertDialogAction>
          </ADF>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
