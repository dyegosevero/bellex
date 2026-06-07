import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertTriangle, Camera, Eye, FileSignature, Trash2, X, ShieldOff, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import ConsentDialog from "./ConsentDialog";
import ConsentViewDialog from "./ConsentViewDialog";

interface Props {
  appointmentId: string;
  clientId: string;
  clientName: string;
  serviceId: string | null;
  requiresConsent?: boolean;
}

const SignedImageSlot = ({ image, label, onDelete }: { image: any; label: string; onDelete: (id: string) => void }) => {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    supabase.storage.from("client-images").createSignedUrl(image.file_url, 3600).then(({ data }) => {
      if (data?.signedUrl) setUrl(data.signedUrl);
    });
  }, [image.file_url]);

  return (
    <div className="space-y-1.5">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground text-center">{label}</p>
      <div className="relative group aspect-[4/3] rounded-md border border-border overflow-hidden bg-muted">
        {url ? <img src={url} alt={label} className="w-full h-full object-cover" /> : <div className="w-full h-full animate-pulse bg-muted" />}
        <button
          type="button"
          aria-label="Remover imagem"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDelete(image.id);
          }}
          className="absolute top-1.5 right-1.5 bg-destructive text-destructive-foreground rounded-full p-1 shadow-md md:opacity-0 md:group-hover:opacity-100 transition-opacity touch-manipulation"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export default function SessionBeforeAfterTab({ appointmentId, clientId, clientName, serviceId, requiresConsent = true }: Props) {
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingCaption, setPendingCaption] = useState<string | null>(null);
  const [consentOpen, setConsentOpen] = useState(false);
  const [viewConsentOpen, setViewConsentOpen] = useState(false);
  const [revokeConsent, setRevokeConsent] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [deleteConsent, setDeleteConsent] = useState(false);
  const [deletingConsent, setDeletingConsent] = useState(false);

  // Fetch service config for multi-session
  const { data: serviceConfigBA } = useQuery({
    queryKey: ["service-multi-session", serviceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("name, multi_session, session_count")
        .eq("id", serviceId!)
        .single();
      if (error) throw error;
      return data as { name: string; multi_session: boolean; session_count: number | null };
    },
    enabled: !!serviceId,
  });

  // Check for direct consent on this client for the SAME service
  const { data: consent, isLoading: consentLoading } = useQuery({
    queryKey: ["client-consent", clientId, serviceId],
    queryFn: async () => {
      if (!serviceId) {
        // No service — fallback to any valid consent
        const { data, error } = await supabase
          .from("client_consents")
          .select("*")
          .eq("client_id", clientId)
          .eq("is_valid", true)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (error) throw error;
        return data;
      }

      // Find all appointments of the same service for this client
      const { data: sameServiceAppts, error: apptErr } = await supabase
        .from("appointments")
        .select("id")
        .eq("client_id", clientId)
        .eq("service_id", serviceId);
      if (apptErr) throw apptErr;

      if (!sameServiceAppts || sameServiceAppts.length === 0) return null;

      const apptIds = sameServiceAppts.map((a) => a.id);
      const { data, error } = await supabase
        .from("client_consents")
        .select("*")
        .eq("client_id", clientId)
        .eq("is_valid", true)
        .in("appointment_id", apptIds)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  // Check for inherited consent from previous sessions of the same multi-session service
  const { data: inheritedConsent, isLoading: inheritedLoading } = useQuery({
    queryKey: ["inherited-consent", clientId, serviceId, appointmentId],
    queryFn: async () => {
      if (!serviceId || !serviceConfigBA?.multi_session || !serviceConfigBA?.session_count) return null;

      // Count completed appointments of this service for this client (excluding current)
      const { data: completedAppts, error: apptErr } = await supabase
        .from("appointments")
        .select("id")
        .eq("client_id", clientId)
        .eq("service_id", serviceId)
        .in("status", ["realizado", "concluido"])
        .neq("id", appointmentId)
        .order("start_time", { ascending: true });
      if (apptErr) throw apptErr;

      if (!completedAppts || completedAppts.length === 0) return null;

      // session_count includes the first session, so remaining allowed = session_count - 1
      const maxInherited = serviceConfigBA.session_count - 1;
      
      // Current appointment would be the Nth session (completedAppts.length + 1)
      // It can inherit if completedAppts.length < session_count (i.e. within the package)
      if (completedAppts.length >= serviceConfigBA.session_count) return null;

      // Find consent from any of these completed appointments
      const completedIds = completedAppts.map((a) => a.id);
      const { data: consentData, error: consentErr } = await supabase
        .from("client_consents")
        .select("*")
        .eq("client_id", clientId)
        .eq("is_valid", true)
        .in("appointment_id", completedIds)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (consentErr) throw consentErr;

      if (consentData) {
        // Find the session number where consent was signed
        const consentApptIdx = completedIds.indexOf(consentData.appointment_id!) + 1;
        return { ...consentData, _sessionNumber: consentApptIdx, _currentSession: completedAppts.length + 1 };
      }
      return null;
    },
    enabled: !!serviceId && !!serviceConfigBA?.multi_session && !consent,
  });

  const { data: images, isLoading: imagesLoading } = useQuery({
    queryKey: ["appointment-images", appointmentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_images")
        .select("*")
        .eq("appointment_id", appointmentId)
        .eq("image_type", "before_after")
        .order("created_at");
      if (error) throw error;
      return data ?? [];
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async ({ file, caption }: { file: File; caption: string }) => {
      const ext = file.name.split(".").pop();
      const path = `${clientId}/${appointmentId}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("client-images")
        .upload(path, file, { contentType: file.type });
      if (uploadError) throw uploadError;

      const { error: insertError } = await supabase.from("client_images").insert({
        client_id: clientId,
        appointment_id: appointmentId,
        file_url: path,
        image_type: "before_after",
        caption,
        uploaded_by: user?.id,
      });
      if (insertError) throw insertError;
    },
    onSuccess: () => {
      toast.success("Imagem adicionada!");
      queryClient.invalidateQueries({ queryKey: ["appointment-images", appointmentId] });
    },
    onError: (err: Error) => toast.error(err.message || "Erro ao carregar imagem."),
  });

  const deleteMutation = useMutation({
    mutationFn: async (imageId: string) => {
      // Get file_url before deleting the record
      const { data: img } = await supabase
        .from("client_images")
        .select("file_url")
        .eq("id", imageId)
        .maybeSingle();

      const { error } = await supabase.from("client_images").delete().eq("id", imageId);
      if (error) throw error;

      // Remove file from storage bucket
      if (img?.file_url) {
        await supabase.storage.from("client-images").remove([img.file_url]);
      }
    },
    onSuccess: () => {
      toast.success("Imagem removida.");
      queryClient.invalidateQueries({ queryKey: ["appointment-images", appointmentId] });
    },
    onError: () => toast.error("Erro ao remover imagem."),
  });

  const handleFileForCaption = (caption: string, file: File | undefined) => {
    if (!file) return;
    uploadMutation.mutate({ file, caption });
  };


  // Group images into sets. Captions: "before", "after" (legacy set 0) or "before_N", "after_N"
  const getSetIndex = (caption: string | null): number => {
    if (!caption) return 0;
    if (caption === "before" || caption === "after") return 0;
    const match = caption.match(/^(?:before|after)_(\d+)$/);
    return match ? parseInt(match[1], 10) : 0;
  };

  const getSide = (caption: string | null): "before" | "after" | null => {
    if (!caption) return null;
    if (caption.startsWith("before")) return "before";
    if (caption.startsWith("after")) return "after";
    return null;
  };

  // Build sets from images
  const sets = new Map<number, { before?: typeof images extends (infer T)[] ? T : never; after?: typeof images extends (infer T)[] ? T : never }>();
  images?.forEach((img) => {
    const idx = getSetIndex(img.caption);
    const side = getSide(img.caption);
    if (!side) return;
    const existing = sets.get(idx) || {};
    (existing as any)[side] = img;
    sets.set(idx, existing);
  });

  // Ensure at least one empty set
  const maxSetIdx = sets.size > 0 ? Math.max(...sets.keys()) : -1;
  const setCount = Math.max(maxSetIdx + 1, 1);
  // Build ordered array
  const setsArray: { index: number; before?: any; after?: any }[] = [];
  for (let i = 0; i < setCount; i++) {
    const s = sets.get(i) || {};
    setsArray.push({ index: i, ...s });
  }

  const addNewSet = () => {
    // Just add an empty set by forcing re-render with a new index
    const nextIdx = setCount;
    sets.set(nextIdx, {});
    // Force re-render by invalidating
    queryClient.invalidateQueries({ queryKey: ["appointment-images", appointmentId] });
  };

  // For new sets we need a local state to track empty sets beyond what images provide
  const [extraSets, setExtraSets] = useState(0);
  const totalSets = Math.max(setCount, setCount + extraSets - (extraSets > 0 && setCount > maxSetIdx + 1 ? 1 : 0));
  const displaySets: { index: number; before?: any; after?: any }[] = [];
  for (let i = 0; i < setCount + extraSets; i++) {
    const s = sets.get(i) || {};
    displaySets.push({ index: i, ...s });
  }

  const captionForSet = (setIdx: number, side: "before" | "after") => {
    if (setIdx === 0) return side; // legacy compat
    return `${side}_${setIdx}`;
  };

  const handleRevokeConsent = async () => {
    if (!consent) return;
    setRevoking(true);
    try {
      const { error } = await supabase.from("client_consents").update({ is_valid: false }).eq("id", consent.id);
      if (error) { toast.error("Erro ao revogar consentimento."); return; }
      toast.success("Consentimento revogado.");
      queryClient.invalidateQueries({ queryKey: ["client-consent", clientId] });
      queryClient.invalidateQueries({ queryKey: ["client-consents", clientId] });
    } finally {
      setRevoking(false);
      setRevokeConsent(false);
    }
  };

  const handleDeleteConsent = async () => {
    if (!consent) return;
    setDeletingConsent(true);
    try {
      if (consent.signature_url) {
        await supabase.storage.from("consent-signatures").remove([consent.signature_url]);
      }
      const { error } = await supabase.from("client_consents").delete().eq("id", consent.id);
      if (error) { toast.error("Erro ao excluir consentimento."); return; }
      toast.success("Consentimento excluído.");
      queryClient.invalidateQueries({ queryKey: ["client-consent", clientId] });
      queryClient.invalidateQueries({ queryKey: ["client-consents", clientId] });
    } finally {
      setDeletingConsent(false);
      setDeleteConsent(false);
    }
  };

  if (consentLoading || imagesLoading || inheritedLoading) return <Skeleton className="h-64 w-full" />;

  const activeConsent = consent || inheritedConsent;
  const isInherited = !consent && !!inheritedConsent;
  const hasConsent = !requiresConsent || !!activeConsent;
  const consentTypeLabel = activeConsent?.consent_type === "treatment_social"
    ? "Tratamento + Redes Sociais"
    : activeConsent?.consent_type === "treatment_internal"
      ? "Tratamento + Análise Interna"
      : "";

  const renderImageSlot = (image: any | undefined, label: string, caption: string) => {
    if (image) {
      return <SignedImageSlot image={image} label={label} onDelete={(id) => deleteMutation.mutate(id)} />;
    }
    return (
      <div className="space-y-1.5">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground text-center">{label}</p>
        <label
          className="aspect-[4/3] w-full rounded-md border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors cursor-pointer touch-manipulation"
        >
          <Camera className="w-5 h-5" />
          <span className="text-[10px]">Adicionar</span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              handleFileForCaption(caption, file);
              e.target.value = "";
            }}
          />
        </label>
      </div>
    );
  };


  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold uppercase tracking-wider">Antes e Depois</h2>
      <ConsentDialog
        open={consentOpen}
        onOpenChange={setConsentOpen}
        clientId={clientId}
        clientName={clientName}
        appointmentId={appointmentId}
        onConsentSaved={() => {
          queryClient.invalidateQueries({ queryKey: ["client-consent", clientId, serviceId] });
        }}
      />

      {!hasConsent ? (
        <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-6 text-center space-y-4">
          <AlertTriangle className="w-10 h-10 text-destructive mx-auto" />
          <p className="text-sm text-foreground font-medium">
            É necessário registrar o consentimento do cliente antes de adicionar fotos.
          </p>
          <Button onClick={() => setConsentOpen(true)} className="gap-2">
            <FileSignature className="w-4 h-4" /> Registrar Consentimento
          </Button>
        </div>
      ) : (
        <>
          {/* Consent info */}
          <div className="bg-card border border-border rounded-lg p-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {isInherited ? "Consentimento Herdado" : "Consentimento Ativo"}
              </p>
              <p className="text-sm font-medium mt-0.5">
                {serviceConfigBA?.name ? `${serviceConfigBA.name} · ` : ""}{consentTypeLabel}
              </p>
              {activeConsent?.signed_at && (
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Assinado em {new Date(activeConsent.signed_at).toLocaleDateString("pt-PT")}
                  {isInherited && (inheritedConsent as any)?._sessionNumber && (
                    <> · Consentimento da sessão #{(inheritedConsent as any)._sessionNumber} (sessão atual: #{(inheritedConsent as any)._currentSession})</>
                  )}
                </p>
              )}
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <Button variant="outline" size="sm" className="gap-1.5 text-xs h-7" onClick={() => setViewConsentOpen(true)}>
                <Eye className="w-3 h-3" /> Ver
              </Button>
              {!isInherited && (
                <>
                  <Button variant="outline" size="sm" className="text-xs gap-1 h-7 text-amber-600 border-amber-200 hover:bg-amber-50" onClick={() => setRevokeConsent(true)}>
                    <ShieldOff className="w-3 h-3" /> Revogar
                  </Button>
                  {isAdmin && (
                    <Button variant="outline" size="sm" className="text-xs gap-1 h-7 text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => setDeleteConsent(true)}>
                      <Trash2 className="w-3 h-3" /> Excluir
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>

          {viewConsentOpen && activeConsent && (
            <ConsentViewDialog open={viewConsentOpen} onOpenChange={setViewConsentOpen} consent={activeConsent} />
          )}

          {/* Revoke confirmation */}
          <Dialog open={revokeConsent} onOpenChange={setRevokeConsent}>
            <DialogContent className="max-w-sm">
              <DialogHeader><DialogTitle>Revogar consentimento</DialogTitle></DialogHeader>
              <p className="text-sm text-muted-foreground">
                Tem certeza que deseja revogar o consentimento <strong>{consentTypeLabel}</strong>? O documento será mantido mas marcado como inválido.
              </p>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" size="sm" onClick={() => setRevokeConsent(false)}>Cancelar</Button>
                <Button variant="outline" size="sm" className="text-amber-600 border-amber-200 hover:bg-amber-50" onClick={handleRevokeConsent} disabled={revoking}>
                  {revoking ? <><Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> Revogando…</> : "Revogar"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Delete confirmation */}
          <Dialog open={deleteConsent} onOpenChange={setDeleteConsent}>
            <DialogContent className="max-w-sm">
              <DialogHeader><DialogTitle>Excluir consentimento</DialogTitle></DialogHeader>
              <p className="text-sm text-muted-foreground">
                Tem certeza que deseja excluir permanentemente o consentimento? Esta ação não pode ser desfeita.
              </p>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" size="sm" onClick={() => setDeleteConsent(false)}>Cancelar</Button>
                <Button variant="destructive" size="sm" onClick={handleDeleteConsent} disabled={deletingConsent}>
                  {deletingConsent ? <><Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> Excluindo…</> : "Excluir"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Photo sets */}
          <div className="space-y-3">
            {displaySets.map((set, idx) => (
              <div key={set.index} className="bg-card border border-border rounded-lg p-3">
                {displaySets.length > 1 && (
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Conjunto {set.index + 1}</p>
                )}
                <div className="grid grid-cols-2 gap-3">
                  {renderImageSlot(set.before, "Antes", captionForSet(set.index, "before"))}
                  {renderImageSlot(set.after, "Depois", captionForSet(set.index, "after"))}
                </div>
              </div>
            ))}
          </div>

          {/* Add more button */}
          <Button
            variant="outline"
            className="w-full h-9 gap-2 text-xs border-dashed"
            onClick={() => setExtraSets((p) => p + 1)}
          >
            <Plus className="w-3.5 h-3.5" /> Adicionar mais
          </Button>

          
        </>
      )}
    </div>
  );
}
