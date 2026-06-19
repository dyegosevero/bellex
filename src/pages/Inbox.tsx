import { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Search, Send, UserCircle, Bot, User, ArrowLeft } from "lucide-react";
import { BlurFade } from "@/components/ui/blur-fade";
import { PageHeader } from "@/components/ui/PageHeader";
import { cn } from "@/lib/utils";

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface Conversation {
  id: string;
  channel: "whatsapp" | "instagram";
  instagram_username: string | null;
  instance_name: string | null;
  updated_at: string;
  leads: {
    id: string;
    name: string;
    source: string;
    agent_stopped: boolean;
  } | null;
  last_message: string | null;
  last_message_at: string | null;
}

interface Message {
  id: string;
  conversation_id: string;
  text: string;
  from_me: boolean;
  created_at: string;
}

// ── Ícones de canal ───────────────────────────────────────────────────────────

function WhatsAppDot() {
  return (
    <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-emerald-500/20 shrink-0">
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-2.5 h-2.5 text-emerald-600">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
        <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.534 5.857L.057 23.944l6.29-1.652C8.05 23.368 9.982 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.861 0-3.632-.5-5.166-1.376l-.371-.22-3.733.979 1.001-3.63-.242-.384C2.498 15.694 2 13.904 2 12 2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
      </svg>
    </span>
  );
}

function InstagramDot() {
  return (
    <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-purple-500/20 shrink-0">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-2.5 h-2.5 text-purple-600">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
      </svg>
    </span>
  );
}

// ── Hook: lista de conversas ──────────────────────────────────────────────────

function useConversations(search: string) {
  return useQuery({
    queryKey: ["inbox-conversations", search],
    queryFn: async () => {
      let q = supabase
        .from("conversations")
        .select(`
          id, channel, instagram_username, instance_name, updated_at,
          leads (id, name, source, agent_stopped)
        `)
        .order("updated_at", { ascending: false })
        .limit(100);

      const { data, error } = await q;
      if (error) throw error;

      // Buscar última mensagem de cada conversa
      const convIds = (data ?? []).map((c: any) => c.id);
      let lastMessages: Record<string, { text: string; created_at: string }> = {};
      if (convIds.length > 0) {
        const { data: msgs } = await supabase
          .from("messages")
          .select("conversation_id, text, created_at")
          .in("conversation_id", convIds)
          .order("created_at", { ascending: false });

        // Keep only first (latest) per conversation
        (msgs ?? []).forEach((m: any) => {
          if (!lastMessages[m.conversation_id]) {
            lastMessages[m.conversation_id] = { text: m.text, created_at: m.created_at };
          }
        });
      }

      return (data ?? []).map((c: any) => ({
        ...c,
        last_message: lastMessages[c.id]?.text ?? null,
        last_message_at: lastMessages[c.id]?.created_at ?? c.updated_at,
      })) as Conversation[];
    },
    refetchInterval: 30_000,
  });
}

// ── Hook: mensagens da conversa ───────────────────────────────────────────────

function useMessages(conversationId: string | null) {
  return useQuery({
    queryKey: ["inbox-messages", conversationId],
    queryFn: async () => {
      if (!conversationId) return [];
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Message[];
    },
    enabled: !!conversationId,
  });
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function Inbox() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: conversations, isLoading: convLoading } = useConversations(search);
  const { data: messages, isLoading: msgsLoading } = useMessages(selectedId);

  const selectedConv = conversations?.find((c) => c.id === selectedId) ?? null;

  // Auto-scroll para última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Realtime: novas mensagens
  useEffect(() => {
    if (!selectedId) return;
    const channel = supabase
      .channel(`inbox-messages-${selectedId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${selectedId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["inbox-messages", selectedId] });
          queryClient.invalidateQueries({ queryKey: ["inbox-conversations"] });
        },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [selectedId, queryClient]);

  // Filtro de busca (client-side após fetch)
  const filtered = (conversations ?? []).filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (c.leads?.name ?? "").toLowerCase().includes(q) ||
      (c.instagram_username ?? "").toLowerCase().includes(q)
    );
  });

  // Toggle agent_stopped
  const toggleAgent = async () => {
    if (!selectedConv?.leads) return;
    const next = !selectedConv.leads.agent_stopped;
    await supabase
      .from("leads")
      .update({ agent_stopped: next })
      .eq("id", selectedConv.leads.id);
    queryClient.invalidateQueries({ queryKey: ["inbox-conversations"] });
    toast(next ? "Você assumiu o controle" : "Agente IA retomado");
  };

  // Enviar mensagem manual
  const sendMessage = async () => {
    if (!replyText.trim() || !selectedId || !selectedConv) return;
    setSending(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Sessão expirada");

      const fnName = selectedConv.channel === "instagram" ? "send-instagram-dm" : "send-whatsapp-dm";
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${fnName}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ conversation_id: selectedId, text: replyText.trim() }),
        },
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Erro ${res.status}`);
      }
      setReplyText("");
      queryClient.invalidateQueries({ queryKey: ["inbox-messages", selectedId] });
      queryClient.invalidateQueries({ queryKey: ["inbox-conversations"] });
    } catch (err: any) {
      toast.error(err.message || "Erro ao enviar mensagem");
    } finally {
      setSending(false);
    }
  };

  const canReply = selectedConv?.leads?.agent_stopped === true;

  return (
    <div>
      <BlurFade delay={0.05}>
        <PageHeader
          icon={<Search className="w-5 h-5" />}
          title="Inbox"
          subtitle="Conversas de WhatsApp e Instagram"
          className="mb-6"
        />
      </BlurFade>

      <div className="flex h-[calc(100vh-180px)] border border-border rounded-xl overflow-hidden bg-card">

        {/* ── Lista de conversas ── */}
        <div className={cn(
          "flex flex-col border-r border-border",
          selectedId ? "hidden md:flex w-72 shrink-0" : "flex flex-1 md:flex-none md:w-72 md:shrink-0",
        )}>
          <div className="p-3 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-8 text-xs"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {convLoading ? (
              <div className="p-3 space-y-2">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-lg" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-6 text-muted-foreground">
                <Search className="w-8 h-8 mb-2 opacity-40" />
                <p className="text-sm">Nenhuma conversa</p>
                <p className="text-xs mt-1 opacity-60">DMs do Instagram e WhatsApp aparecerão aqui</p>
              </div>
            ) : (
              filtered.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setSelectedId(conv.id)}
                  className={cn(
                    "w-full text-left px-3 py-3 flex items-start gap-3 border-b border-border/50 hover:bg-muted/50 transition-colors",
                    selectedId === conv.id && "bg-muted",
                  )}
                >
                  <div className="mt-0.5">
                    {conv.channel === "instagram" ? <InstagramDot /> : <WhatsAppDot />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-sm font-medium truncate">
                        {conv.leads?.name ?? conv.instagram_username ?? "Sem nome"}
                      </span>
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {conv.last_message_at
                          ? formatDistanceToNow(new Date(conv.last_message_at), { locale: ptBR, addSuffix: false })
                          : ""}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {conv.last_message ?? "Sem mensagens"}
                    </p>
                    {conv.leads?.agent_stopped && (
                      <span className="inline-flex items-center gap-0.5 mt-1 text-[9px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-full px-1.5 py-0.5">
                        <User className="w-2.5 h-2.5" /> Manual
                      </span>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* ── Thread de mensagens ── */}
        <div className={cn(
          "flex-1 flex flex-col",
          !selectedId && "hidden md:flex",
        )}>
          {!selectedConv ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <Search className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm">Selecione uma conversa</p>
            </div>
          ) : (
            <>
              {/* Header da thread */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card/50">
                <button
                  onClick={() => setSelectedId(null)}
                  className="md:hidden p-1 rounded hover:bg-muted"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {selectedConv.channel === "instagram" ? <InstagramDot /> : <WhatsAppDot />}
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {selectedConv.leads?.name ?? selectedConv.instagram_username ?? "Sem nome"}
                    </p>
                    {selectedConv.instagram_username && (
                      <p className="text-[11px] text-muted-foreground">@{selectedConv.instagram_username}</p>
                    )}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant={selectedConv.leads?.agent_stopped ? "default" : "outline"}
                  className={cn(
                    "h-7 text-xs gap-1.5 shrink-0",
                    selectedConv.leads?.agent_stopped
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                      : "border-amber-500/40 text-amber-700 hover:bg-amber-500/10",
                  )}
                  onClick={toggleAgent}
                >
                  {selectedConv.leads?.agent_stopped ? (
                    <><Bot className="w-3 h-3" /> Voltar ao agente</>
                  ) : (
                    <><User className="w-3 h-3" /> Assumir controle</>
                  )}
                </Button>
              </div>

              {/* Mensagens */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                {msgsLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-3/4 rounded-2xl" />)}
                  </div>
                ) : (messages ?? []).length === 0 ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                    Nenhuma mensagem
                  </div>
                ) : (
                  (messages ?? []).map((msg) => (
                    <div
                      key={msg.id}
                      className={cn(
                        "flex",
                        msg.from_me ? "justify-end" : "justify-start",
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[75%] px-3 py-2 rounded-2xl text-sm leading-relaxed",
                          msg.from_me
                            ? "bg-primary text-primary-foreground rounded-br-sm"
                            : "bg-muted text-foreground rounded-bl-sm",
                        )}
                      >
                        <p>{msg.text}</p>
                        <p className={cn(
                          "text-[10px] mt-1 text-right",
                          msg.from_me ? "text-primary-foreground/60" : "text-muted-foreground",
                        )}>
                          {new Date(msg.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input de resposta */}
              <div className="px-4 py-3 border-t border-border bg-card/50">
                {canReply ? (
                  <div className="flex gap-2 items-end">
                    <Textarea
                      placeholder="Digite uma mensagem..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      rows={1}
                      className="resize-none flex-1 text-sm min-h-[36px] max-h-[120px]"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                    />
                    <Button
                      size="icon"
                      onClick={sendMessage}
                      disabled={!replyText.trim() || sending}
                      className="shrink-0 h-9 w-9"
                    >
                      {sending ? (
                        <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 py-1 text-xs text-muted-foreground">
                    <Bot className="w-4 h-4 shrink-0" />
                    <span>Agente IA está respondendo — clique em <strong>Assumir controle</strong> para responder manualmente</span>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
