import { useState, useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import {
  Search, CheckCheck, SlidersHorizontal, Send, Paperclip,
  Smile, ChevronRight, ChevronLeft, Phone, Archive, ArchiveRestore,
  Calendar, Tag, MapPin, Mail, Hash, UserPlus, ExternalLink,
  Star, Trash2, Loader2, Plus, X,
} from "lucide-react";
import {
  fetchConversations, fetchMessages, sendMessage, createConversation, createLead,
  type Conversation as DBConversation, type Message as DBMessage, type Lead,
} from "@/lib/crm";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";

const EMOJI_LIST = ["😀","😂","😍","🥰","😎","🤔","😊","🙏","👍","❤️","🔥","✅","🎉","😢","😅","🤩","💪","👏","😴","🫡"];

/* ─── Channel icons ─────────────────────────────────────── */
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  );
}

/* ─── UI Types ───────────────────────────────────────────── */
type Channel = "whatsapp" | "instagram";

interface UIConversation {
  id: string;
  contactName: string;
  channel: Channel;
  lastMessage: string;
  lastTime: string;
  unread: number;
  // lead data
  leadId?: string;
  phone?: string;
  email?: string;
  city?: string;
  tag?: string;
  lastAppointment?: string;
  source?: string;
}

// Map DB → UI
function dbToUI(conv: DBConversation): UIConversation {
  const lead = conv.lead as Lead | undefined;
  const msgs = (conv.messages ?? []) as DBMessage[];
  const lastMsg = msgs[msgs.length - 1];
  return {
    id: conv.id,
    contactName: lead?.name ?? "Desconhecido",
    channel: conv.channel as Channel,
    lastMessage: lastMsg?.text ?? lead?.last_message ?? "",
    lastTime: new Date(conv.last_message_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
    unread: 0,
    leadId: lead?.id,
    phone: lead?.phone ?? undefined,
    email: lead?.email ?? undefined,
    source: lead?.source,
  };
}

// Placeholder used only while loading
const EMPTY: UIConversation[] = [];

// ─── REMOVED MOCK DATA ─── (was large mock array, now using Supabase)
const _UNUSED = [
  {
    id: "1", contactName: "Ana Paula", channel: "whatsapp",
    lastMessage: "Oi! Quero agendar uma sessão para amanhã.", lastTime: "09:41", unread: 2,
    phone: "+55 11 99999-0001", email: "ana@email.com", city: "São Paulo", tag: "VIP",
    lastAppointment: "02/06/2026", source: "WhatsApp",
    messages: [
      { id: "m1", text: "Oi, tudo bem?", fromMe: false, time: "09:38" },
      { id: "m2", text: "Tudo ótimo! Como posso ajudar?", fromMe: true, time: "09:39" },
      { id: "m3", text: "Quero agendar uma sessão de limpeza de pele para amanhã.", fromMe: false, time: "09:40" },
      { id: "m4", text: "Claro! Tenho horário às 14h ou às 16h, qual prefere?", fromMe: true, time: "09:41" },
      { id: "m5", text: "Oi! Quero agendar uma sessão para amanhã.", fromMe: false, time: "09:41" },
    ],
  },
  {
    id: "2", contactName: "Carlos Mendes", channel: "instagram",
    lastMessage: "Vi o post sobre promoção, ainda está válido?", lastTime: "08:15", unread: 1,
    phone: "+55 21 98888-0002", email: "carlos@email.com", city: "Rio de Janeiro", tag: "Novo",
    lastAppointment: "—", source: "Instagram",
    messages: [
      { id: "m1", text: "Olá! Vi o post sobre a promoção de peeling, ainda está válido?", fromMe: false, time: "08:10" },
      { id: "m2", text: "Sim! A promoção vai até o fim do mês 😊 Quer saber mais detalhes?", fromMe: true, time: "08:13" },
      { id: "m3", text: "Vi o post sobre promoção, ainda está válido?", fromMe: false, time: "08:15" },
    ],
  },
  {
    id: "3", contactName: "Fernanda Lima", channel: "whatsapp",
    lastMessage: "Confirmado! Até amanhã 😊", lastTime: "Ontem", unread: 0,
    phone: "+55 31 97777-0003", email: "fernanda@email.com", city: "Belo Horizonte", tag: "Regular",
    lastAppointment: "05/06/2026", source: "WhatsApp",
    messages: [
      { id: "m1", text: "Boa tarde! Posso remarcar minha consulta de quinta para sexta?", fromMe: false, time: "14:20" },
      { id: "m2", text: "Claro, sem problemas! Às 15h está bom?", fromMe: true, time: "14:22" },
      { id: "m3", text: "Perfeito! Confirmado! Até amanhã 😊", fromMe: false, time: "14:23" },
    ],
  },
  {
    id: "4", contactName: "Roberto Alves", channel: "instagram",
    lastMessage: "Quanto custa a avaliação?", lastTime: "Ter", unread: 0,
    phone: "+55 41 96666-0004", email: "roberto@email.com", city: "Curitiba", tag: "Lead",
    lastAppointment: "—", source: "Instagram",
    messages: [
      { id: "m1", text: "Oi! Quanto custa a avaliação facial?", fromMe: false, time: "10:00" },
      { id: "m2", text: "A avaliação inicial é totalmente gratuita! Posso te atender essa semana.", fromMe: true, time: "10:05" },
      { id: "m3", text: "Que ótimo! Tem horário na quinta de tarde?", fromMe: false, time: "10:07" },
      { id: "m4", text: "Tenho às 15h ou 17h na quinta, qual prefere?", fromMe: true, time: "10:09" },
    ],
  },
  {
    id: "5", contactName: "Mariana Costa", channel: "whatsapp",
    lastMessage: "Obrigada pela atenção!", lastTime: "Seg", unread: 0,
    phone: "+55 51 95555-0005", email: "mariana@email.com", city: "Porto Alegre", tag: "VIP",
    lastAppointment: "01/06/2026", source: "WhatsApp",
    messages: [
      { id: "m1", text: "Recebi o resultado do tratamento e fiquei muito feliz!", fromMe: false, time: "16:28" },
      { id: "m2", text: "Que maravilha! Fico muito feliz em saber 😊", fromMe: true, time: "16:29" },
      { id: "m3", text: "Obrigada pela atenção!", fromMe: false, time: "16:30" },
    ],
  },
  {
    id: "6", contactName: "Juliana Pires", channel: "whatsapp",
    lastMessage: "Quanto fica o pacote completo?", lastTime: "10:02", unread: 3,
    phone: "+55 11 94444-0006", email: "juliana@email.com", city: "São Paulo", tag: "Lead quente",
    lastAppointment: "—", source: "WhatsApp",
    messages: [
      { id: "m1", text: "Olá! Vi no Instagram sobre os pacotes de tratamento facial.", fromMe: false, time: "09:50" },
      { id: "m2", text: "Oi Juliana! Temos vários pacotes. O que te interessa mais?", fromMe: true, time: "09:52" },
      { id: "m3", text: "Principalmente peeling e microagulhamento juntos.", fromMe: false, time: "09:55" },
      { id: "m4", text: "Temos um pacote combo com 4 sessões de cada. Quer que eu te mande os detalhes?", fromMe: true, time: "09:58" },
      { id: "m5", text: "Sim! Quanto fica o pacote completo?", fromMe: false, time: "10:02" },
    ],
  },
  {
    id: "7", contactName: "Patricia Souza", channel: "instagram",
    lastMessage: "Pode mandar o endereço?", lastTime: "09:30", unread: 1,
    phone: "+55 21 93333-0007", email: "patricia@email.com", city: "Rio de Janeiro",
    lastAppointment: "28/05/2026", source: "Instagram",
    messages: [
      { id: "m1", text: "Oi! Quero agendar uma sessão de botox para semana que vem.", fromMe: false, time: "09:20" },
      { id: "m2", text: "Olá Patricia! Temos horários na terça e quinta. Qual prefere?", fromMe: true, time: "09:22" },
      { id: "m3", text: "Terça às 11h está ótimo!", fromMe: false, time: "09:25" },
      { id: "m4", text: "Perfeito! Confirmado para terça às 11h 🎉", fromMe: true, time: "09:28" },
      { id: "m5", text: "Pode mandar o endereço?", fromMe: false, time: "09:30" },
    ],
  },
  {
    id: "8", contactName: "Tatiane Rocha", channel: "whatsapp",
    lastMessage: "Vou pensar e te aviso 😊", lastTime: "Ontem", unread: 0,
    phone: "+55 41 92222-0008", email: "tatiane@email.com", city: "Curitiba", tag: "Morno",
    lastAppointment: "—", source: "WhatsApp",
    messages: [
      { id: "m1", text: "Oi! Tenho interesse em harmonização facial mas é minha primeira vez.", fromMe: false, time: "15:00" },
      { id: "m2", text: "Oi Tatiane! Oferecemos avaliação gratuita justamente para isso 😊 Sem compromisso!", fromMe: true, time: "15:03" },
      { id: "m3", text: "Que bom! Qual o valor médio dos procedimentos?", fromMe: false, time: "15:10" },
      { id: "m4", text: "Depende muito da avaliação, mas posso te dar uma ideia geral. Posso ligar?", fromMe: true, time: "15:12" },
      { id: "m5", text: "Vou pensar e te aviso 😊", fromMe: false, time: "15:20" },
    ],
  },
  {
    id: "9", contactName: "Sandra Oliveira", channel: "whatsapp",
    lastMessage: "Amei o resultado! ❤️", lastTime: "Ter", unread: 0,
    phone: "+55 51 91111-0009", email: "sandra@email.com", city: "Porto Alegre", tag: "VIP",
    lastAppointment: "03/06/2026", source: "WhatsApp",
    messages: [
      { id: "m1", text: "Boa noite! Acabei de chegar em casa depois da sessão.", fromMe: false, time: "19:00" },
      { id: "m2", text: "Boa noite Sandra! Espero que tenha gostado 😊", fromMe: true, time: "19:02" },
      { id: "m3", text: "Gostei demais! Já dá pra ver diferença.", fromMe: false, time: "19:05" },
      { id: "m4", text: "Que bom! Nos próximos dias vai melhorar ainda mais. Qualquer dúvida, estou aqui!", fromMe: true, time: "19:07" },
      { id: "m5", text: "Amei o resultado! ❤️", fromMe: false, time: "19:10" },
    ],
  },
  {
    id: "10", contactName: "Claudia Ribeiro", channel: "instagram",
    lastMessage: "Ok! Até lá 👋", lastTime: "Seg", unread: 0,
    phone: "+55 11 90000-0010", email: "claudia@email.com", city: "São Paulo",
    lastAppointment: "30/05/2026", source: "Instagram",
    messages: [
      { id: "m1", text: "Olá! Preciso cancelar minha sessão de amanhã.", fromMe: false, time: "11:00" },
      { id: "m2", text: "Tudo bem! Podemos remarcar para quando quiser.", fromMe: true, time: "11:02" },
      { id: "m3", text: "Pode ser na próxima sexta no mesmo horário?", fromMe: false, time: "11:05" },
      { id: "m4", text: "Pode sim! Ficou remarcado para sexta às 14h ✅", fromMe: true, time: "11:07" },
      { id: "m5", text: "Ok! Até lá 👋", fromMe: false, time: "11:08" },
    ],
  },
]; // _UNUSED

type FilterChannel = "all" | "whatsapp" | "instagram";
type FilterRead = "all" | "unread" | "read";
type FilterOrder = "recent" | "oldest";

export default function Mensagens() {
  const [convs, setConvs] = useState<UIConversation[]>(EMPTY);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [messages, setMessages] = useState<DBMessage[]>([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [search, setSearch] = useState("");
  const [filterChannel, setFilterChannel] = useState<FilterChannel>("all");
  const [filterRead, setFilterRead] = useState<FilterRead>("all");
  const [filterOrder, setFilterOrder] = useState<FilterOrder>("recent");
  const [selected, setSelected] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [leadPanelOpen, setLeadPanelOpen] = useState(true);
  const [tagInput, setTagInput] = useState("");
  const [tagPopoverOpen, setTagPopoverOpen] = useState(false);
  const [starred, setStarred] = useState<Set<string>>(new Set());
  const [archived, setArchived] = useState<Set<string>>(new Set());
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [newConvOpen, setNewConvOpen] = useState(false);
  const [newConvForm, setNewConvForm] = useState({ name: "", phone: "" });
  const [newConvSaving, setNewConvSaving] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Load conversations
  useEffect(() => {
    async function load() {
      try {
        const data = await fetchConversations("open");
        const ui = data.map(dbToUI);
        setConvs(ui);
        if (ui.length > 0) setSelected(ui[0].id);
      } catch (e) {
        console.error("Mensagens load error", e);
      } finally {
        setLoadingConvs(false);
      }
    }
    load();
  }, []);

  // Load messages when selected changes
  useEffect(() => {
    if (!selected) return;
    setLoadingMsgs(true);
    fetchMessages(selected).then(msgs => {
      setMessages(msgs);
      setLoadingMsgs(false);
    }).catch(() => setLoadingMsgs(false));
  }, [selected]);

  // Realtime subscription for new messages
  useEffect(() => {
    if (!selected) return;
    const sub = supabase
      .channel(`messages:conv:${selected}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `conversation_id=eq.${selected}`,
      }, (payload) => {
        setMessages(prev => [...prev, payload.new as DBMessage]);
      })
      .subscribe();
    return () => { supabase.removeChannel(sub); };
  }, [selected]);

  // Auto scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    if (!input.trim() || !selected) return;
    const text = input.trim();
    setInput("");
    setSending(true);
    try {
      await sendMessage(selected, text, true);
      // Message appears via realtime subscription
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  }

  async function handleNewConv() {
    if (!newConvForm.name.trim() || !newConvForm.phone.trim()) return;
    setNewConvSaving(true);
    try {
      const { supabase: sb } = await import("@/integrations/supabase/client").then(m => ({ supabase: m.supabase }));
      const { data: stages } = await sb.from("pipeline_stages").select("id").order("position").limit(1);
      const stageId = stages?.[0]?.id ?? null;

      const lead = await createLead({
        name: newConvForm.name.trim(),
        phone: newConvForm.phone || null,
        email: null,
        source: "whatsapp",
        stage_id: stageId,
        last_message: null,
        notes: null,
      });
      const conv = await createConversation(lead.id, "whatsapp");

      const uiConv: UIConversation = {
        id: conv.id,
        contactName: lead.name,
        channel: "whatsapp",
        lastMessage: "",
        lastTime: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
        unread: 0,
        leadId: lead.id,
        phone: lead.phone ?? undefined,
      };
      setConvs(prev => [uiConv, ...prev]);
      setSelected(conv.id);
      setNewConvOpen(false);
      setNewConvForm({ name: "", phone: "" });
    } catch (e) {
      console.error(e);
    } finally {
      setNewConvSaving(false);
    }
  }

  const filtered = convs
    .filter((c) => {
      if (archived.has(c.id)) return false;
      if (filterChannel !== "all" && c.channel !== filterChannel) return false;
      if (filterRead === "unread" && c.unread === 0) return false;
      if (filterRead === "read" && c.unread > 0) return false;
      if (search && !c.contactName.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) =>
      filterOrder === "recent"
        ? new Date(b.lastTime).getTime() - new Date(a.lastTime).getTime()
        : new Date(a.lastTime).getTime() - new Date(b.lastTime).getTime()
    );

  const activeConv = convs.find((c) => c.id === selected) ?? null;

  return (
    <div className="flex flex-1 h-full overflow-hidden bg-background">

      {/* ── Col 1: Lista de conversas ─────────────────────── */}
      <aside className="w-72 shrink-0 border-x flex flex-col">
        <div className="px-3 pt-4 pb-3 border-b space-y-2.5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">Conversas</p>
            <button
              onClick={() => setNewConvOpen(true)}
              className="w-6 h-6 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Nova conversa"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Search + filter inline */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            <Input
              className="pl-8 pr-8 h-8 text-sm"
              placeholder="Buscar conversa..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {/* Filter button inside input */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={cn(
                    "absolute right-1.5 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded transition-colors",
                    filterChannel !== "all" || filterRead !== "all"
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  title="Filtros"
                >
                  <SlidersHorizontal className="w-3 h-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuLabel className="text-xs text-muted-foreground">Canal</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setFilterChannel("all")} className={cn(filterChannel === "all" && "font-semibold")}>
                  Todos
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterChannel("whatsapp")} className={cn("gap-2", filterChannel === "whatsapp" && "font-semibold")}>
                  <WhatsAppIcon className="w-3.5 h-3.5 text-green-500" /> WhatsApp
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterChannel("instagram")} className={cn("gap-2", filterChannel === "instagram" && "font-semibold")}>
                  <InstagramIcon className="w-3.5 h-3.5 text-pink-500" /> Instagram
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs text-muted-foreground">Leitura</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setFilterRead("all")} className={cn(filterRead === "all" && "font-semibold")}>Todas</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterRead("unread")} className={cn(filterRead === "unread" && "font-semibold")}>Não lidas</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterRead("read")} className={cn(filterRead === "read" && "font-semibold")}>Lidas</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loadingConvs ? (
            <div className="flex justify-center p-8"><Loader2 size={20} className="animate-spin text-muted-foreground" /></div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-xs text-muted-foreground p-6">Nenhuma conversa.</p>
          ) : (
            filtered.map((conv) => (
              <ConvItem
                key={conv.id}
                conv={conv}
                active={conv.id === selected}
                onClick={() => setSelected(conv.id)}
              />
            ))
          )}
        </div>

        {/* Arquivadas */}
        <button className="flex items-center gap-2 px-4 py-3 border-t border-border/50 text-muted-foreground/50 hover:text-muted-foreground/70 transition-colors text-xs w-full">
          <Archive className="w-3.5 h-3.5" />
          <span>Arquivadas</span>
        </button>
      </aside>

      {/* ── Col 2: Chat ───────────────────────────────────── */}
      {activeConv ? (
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div className="h-14 border-b flex items-center px-4 gap-3 shrink-0">
            <div className="relative">
              <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center font-medium text-sm">
                {activeConv.contactName[0]}
              </div>
              <span className={cn(
                "absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-background flex items-center justify-center",
                activeConv.channel === "whatsapp" ? "text-green-500" : "text-pink-500"
              )}>
                {activeConv.channel === "whatsapp"
                  ? <WhatsAppIcon className="w-3.5 h-3.5" />
                  : <InstagramIcon className="w-3.5 h-3.5" />}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm leading-none">{activeConv.contactName}</p>
              <p className="text-xs text-muted-foreground mt-0.5 capitalize">{activeConv.channel}</p>
            </div>
            <div className="flex items-center gap-0.5">
              {/* Favoritar */}
              <Button
                variant="ghost" size="icon" className="h-8 w-8"
                title={starred.has(activeConv.id) ? "Remover dos favoritos" : "Favoritar"}
                onClick={() => setStarred(prev => {
                  const next = new Set(prev);
                  next.has(activeConv.id) ? next.delete(activeConv.id) : next.add(activeConv.id);
                  return next;
                })}
              >
                <Star className={cn("w-4 h-4 transition-colors", starred.has(activeConv.id) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground")} />
              </Button>

              {/* Arquivar / Desarquivar */}
              <Button
                variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground"
                title={archived.has(activeConv.id) ? "Desarquivar conversa" : "Arquivar conversa"}
                onClick={() => setArchived(prev => {
                  const next = new Set(prev);
                  next.has(activeConv.id) ? next.delete(activeConv.id) : next.add(activeConv.id);
                  return next;
                })}
              >
                {archived.has(activeConv.id)
                  ? <ArchiveRestore className="w-4 h-4" />
                  : <Archive className="w-4 h-4" />}
              </Button>

              {/* Ver cliente */}
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" title="Ver cliente">
                <UserPlus className="w-4 h-4" />
              </Button>

              {/* Agendar */}
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" title="Agendar sessão">
                <Calendar className="w-4 h-4" />
              </Button>

              {/* Tag */}
              <Popover open={tagPopoverOpen} onOpenChange={setTagPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" title="Adicionar tag">
                    <Tag className="w-4 h-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent side="bottom" align="end" className="w-56 p-3 space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Adicionar tag</p>
                  <Input
                    placeholder="Ex: VIP, Lead quente..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    className="h-8 text-sm"
                    autoFocus
                    onKeyDown={(e) => { if (e.key === "Enter" && tagInput.trim()) { setTagInput(""); setTagPopoverOpen(false); } }}
                  />
                  <Button size="sm" className="w-full h-8" disabled={!tagInput.trim()} onClick={() => { setTagInput(""); setTagPopoverOpen(false); }}>
                    Salvar
                  </Button>
                </PopoverContent>
              </Popover>

              {/* Excluir */}
              <Button
                variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive"
                title="Excluir conversa"
                onClick={() => setDeleteConfirmOpen(true)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>

              {/* Toggle lead panel */}
              <Button
                variant="ghost" size="icon" className="h-8 w-8"
                onClick={() => setLeadPanelOpen((v) => !v)}
                title={leadPanelOpen ? "Recolher painel" : "Expandir painel"}
              >
                {leadPanelOpen ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </Button>
            </div>

            {/* Delete confirmation */}
            <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Excluir conversa</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tem certeza que deseja excluir a conversa com <strong>{activeConv.contactName}</strong>? Esta ação não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={() => { setSelected(null); setDeleteConfirmOpen(false); }}
                  >
                    Excluir
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {loadingMsgs ? (
              <div className="flex justify-center pt-10"><Loader2 size={20} className="animate-spin text-muted-foreground" /></div>
            ) : messages.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground pt-10">Nenhuma mensagem ainda.</p>
            ) : messages.map((msg) => (
              <div key={msg.id} className={cn("flex", msg.from_me ? "justify-end" : "justify-start")}>
                <div className={cn(
                  "max-w-[72%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed",
                  msg.from_me
                    ? "bg-primary text-primary-foreground rounded-br-sm"
                    : "bg-muted rounded-bl-sm"
                )}>
                  <p>{msg.text}</p>
                  <p className={cn(
                    "text-[10px] mt-1 text-right",
                    msg.from_me ? "text-primary-foreground/60" : "text-muted-foreground"
                  )}>{new Date(msg.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</p>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="border-t p-3 flex items-end gap-2">
            <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0">
              <Paperclip className="w-4 h-4" />
            </Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0">
                  <Smile className="w-4 h-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent side="top" align="start" className="w-64 p-2">
                <div className="grid grid-cols-10 gap-1">
                  {EMOJI_LIST.map((e) => (
                    <button
                      key={e}
                      className="text-lg hover:bg-muted rounded p-0.5 transition-colors"
                      onClick={() => setInput((v) => v + e)}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
            <Input
              className="flex-1"
              placeholder="Escreva uma mensagem..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            />
            <Button size="icon" className="h-9 w-9 shrink-0" disabled={!input.trim() || sending} onClick={handleSend}>
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
          Selecione uma conversa
        </div>
      )}

      {/* ── Col 3: Painel do lead (recolhível) ───────────── */}
      <aside className={cn(
        "border-l flex flex-col bg-muted/20 transition-all duration-200 overflow-hidden shrink-0",
        leadPanelOpen ? "w-64" : "w-0"
      )}>
        {activeConv && leadPanelOpen && (
          <div className="flex flex-col h-full overflow-y-auto">
            {/* Lead header */}
            <div className="p-4 border-b flex flex-col items-center gap-2 text-center">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-xl font-semibold text-primary">
                {activeConv.contactName[0]}
              </div>
              <div>
                <p className="font-medium text-sm">{activeConv.contactName}</p>
                {activeConv.tag && (
                  <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium mt-1">
                    <Tag className="w-2.5 h-2.5" /> {activeConv.tag}
                  </span>
                )}
              </div>
            </div>

            {/* Lead info */}
            <div className="p-4 space-y-3 text-sm">
              <LeadRow icon={<Phone className="w-3.5 h-3.5" />} label="Telefone" value={activeConv.phone} />
              <LeadRow icon={<Mail className="w-3.5 h-3.5" />} label="E-mail" value={activeConv.email} />
              <LeadRow icon={<MapPin className="w-3.5 h-3.5" />} label="Cidade" value={activeConv.city} />
              <LeadRow icon={<Calendar className="w-3.5 h-3.5" />} label="Último agend." value={activeConv.lastAppointment} />
              <LeadRow icon={<Hash className="w-3.5 h-3.5" />} label="Canal origem" value={activeConv.source} />
            </div>

          </div>
        )}
      </aside>

      {/* ── Modal: Nova Conversa ─────────────────────────── */}
      {newConvOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setNewConvOpen(false)}>
          <div
            className="bg-background rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-sm p-6 space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold">Nova conversa</h3>
              <button onClick={() => setNewConvOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Nome do contato</label>
                <Input
                  placeholder="Ex: Maria Silva"
                  value={newConvForm.name}
                  onChange={e => setNewConvForm(f => ({ ...f, name: e.target.value }))}
                  autoFocus
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">WhatsApp</label>
                <Input
                  placeholder="(11) 99999-0000"
                  inputMode="numeric"
                  value={newConvForm.phone}
                  onChange={e => {
                    const digits = e.target.value.replace(/\D/g, "").slice(0, 11);
                    let fmt = digits;
                    if (digits.length > 10) fmt = `(${digits.slice(0,2)}) ${digits.slice(2,7)}-${digits.slice(7)}`;
                    else if (digits.length > 6) fmt = `(${digits.slice(0,2)}) ${digits.slice(2,6)}-${digits.slice(6)}`;
                    else if (digits.length > 2) fmt = `(${digits.slice(0,2)}) ${digits.slice(2)}`;
                    else if (digits.length > 0) fmt = `(${digits}`;
                    setNewConvForm(f => ({ ...f, phone: fmt }));
                  }}
                />
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1" onClick={() => setNewConvOpen(false)}>Cancelar</Button>
              <Button
                className="flex-1"
                disabled={!newConvForm.name.trim() || !newConvForm.phone.trim() || newConvSaving}
                onClick={handleNewConv}
              >
                {newConvSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Iniciar conversa"}
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

/* ─── Sub-components ─────────────────────────────────────── */

function ConvItem({ conv, active, onClick }: { conv: UIConversation; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left px-3 py-3 border-b last:border-0 flex items-start gap-3 transition-colors",
        active ? "bg-muted/60" : "hover:bg-muted/30"
      )}
    >
      <div className="relative shrink-0">
        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center font-medium text-sm">
          {conv.contactName[0]}
        </div>
        <span className={cn(
          "absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-background flex items-center justify-center",
          conv.channel === "whatsapp" ? "text-green-500/70" : "text-pink-500/70"
        )}>
          {conv.channel === "whatsapp"
            ? <WhatsAppIcon className="w-3.5 h-3.5" />
            : <InstagramIcon className="w-3.5 h-3.5" />}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className={cn("text-sm truncate", conv.unread > 0 ? "font-semibold" : "font-medium")}>
            {conv.contactName}
          </span>
          <span className="text-[10px] text-muted-foreground shrink-0">{conv.lastTime}</span>
        </div>
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <span className="text-xs text-muted-foreground truncate">{conv.lastMessage}</span>
          {conv.unread > 0
            ? <Badge className="h-4 min-w-4 px-1 text-[10px] shrink-0 rounded-full">{conv.unread}</Badge>
            : <CheckCheck className="w-3.5 h-3.5 text-primary/50 shrink-0" />}
        </div>
      </div>
    </button>
  );
}

function LeadRow({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2">
      <span className="text-muted-foreground mt-0.5 shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wide leading-none mb-0.5">{label}</p>
        <p className="text-xs text-foreground break-all">{value}</p>
      </div>
    </div>
  );
}
