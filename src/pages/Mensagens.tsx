import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Search, CheckCheck, SlidersHorizontal, ArrowDownUp, Send, Paperclip,
  Smile, Phone, MoreVertical, ChevronRight, ChevronLeft,
  Calendar, Tag, MapPin, Mail, Hash, UserPlus, ExternalLink,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

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

/* ─── Mock data ──────────────────────────────────────────── */
type Channel = "whatsapp" | "instagram";

interface Msg { id: string; text: string; fromMe: boolean; time: string; }
interface Conversation {
  id: string;
  contactName: string;
  channel: Channel;
  lastMessage: string;
  lastTime: string;
  unread: number;
  messages: Msg[];
  // lead data
  phone?: string;
  email?: string;
  city?: string;
  tag?: string;
  lastAppointment?: string;
  source?: string;
}

const MOCK: Conversation[] = [
  {
    id: "1", contactName: "Ana Paula", channel: "whatsapp",
    lastMessage: "Oi! Quero agendar uma sessão para amanhã.", lastTime: "09:41", unread: 2,
    phone: "+55 11 99999-0001", email: "ana@email.com", city: "São Paulo", tag: "VIP",
    lastAppointment: "02/06/2026", source: "WhatsApp",
    messages: [
      { id: "m1", text: "Oi, tudo bem?", fromMe: false, time: "09:38" },
      { id: "m2", text: "Tudo! Como posso ajudar?", fromMe: true, time: "09:39" },
      { id: "m3", text: "Quero agendar uma sessão para amanhã.", fromMe: false, time: "09:41" },
    ],
  },
  {
    id: "2", contactName: "Carlos Mendes", channel: "instagram",
    lastMessage: "Vi o post sobre promoção, ainda está válido?", lastTime: "08:15", unread: 1,
    phone: "+55 21 98888-0002", email: "carlos@email.com", city: "Rio de Janeiro", tag: "Novo",
    lastAppointment: "—", source: "Instagram",
    messages: [
      { id: "m1", text: "Vi o post sobre promoção, ainda está válido?", fromMe: false, time: "08:15" },
    ],
  },
  {
    id: "3", contactName: "Fernanda Lima", channel: "whatsapp",
    lastMessage: "Confirmado! Até amanhã 😊", lastTime: "Ontem", unread: 0,
    phone: "+55 31 97777-0003", email: "fernanda@email.com", city: "Belo Horizonte", tag: "Regular",
    lastAppointment: "05/06/2026", source: "WhatsApp",
    messages: [
      { id: "m1", text: "Posso remarcar para quinta?", fromMe: false, time: "14:20" },
      { id: "m2", text: "Claro! Às 15h está bom?", fromMe: true, time: "14:22" },
      { id: "m3", text: "Confirmado! Até amanhã 😊", fromMe: false, time: "14:23" },
    ],
  },
  {
    id: "4", contactName: "Roberto Alves", channel: "instagram",
    lastMessage: "Quanto custa a avaliação?", lastTime: "Ter", unread: 0,
    phone: "+55 41 96666-0004", email: "roberto@email.com", city: "Curitiba", tag: "Lead",
    lastAppointment: "—", source: "Instagram",
    messages: [
      { id: "m1", text: "Quanto custa a avaliação?", fromMe: false, time: "10:00" },
      { id: "m2", text: "A avaliação inicial é gratuita! Quando posso te atender?", fromMe: true, time: "10:05" },
    ],
  },
  {
    id: "5", contactName: "Mariana Costa", channel: "whatsapp",
    lastMessage: "Obrigada pela atenção!", lastTime: "Seg", unread: 0,
    phone: "+55 51 95555-0005", email: "mariana@email.com", city: "Porto Alegre", tag: "VIP",
    lastAppointment: "01/06/2026", source: "WhatsApp",
    messages: [
      { id: "m1", text: "Obrigada pela atenção!", fromMe: false, time: "16:30" },
    ],
  },
];

type FilterChannel = "all" | "whatsapp" | "instagram";
type FilterRead = "all" | "unread" | "read";
type FilterOrder = "recent" | "oldest";

export default function Mensagens() {
  const [search, setSearch] = useState("");
  const [filterChannel, setFilterChannel] = useState<FilterChannel>("all");
  const [filterRead, setFilterRead] = useState<FilterRead>("all");
  const [filterOrder, setFilterOrder] = useState<FilterOrder>("recent");
  const [selected, setSelected] = useState<string | null>(MOCK[0].id);
  const [input, setInput] = useState("");
  const [leadPanelOpen, setLeadPanelOpen] = useState(true);

  const filtered = MOCK
    .filter((c) => {
      if (filterChannel !== "all" && c.channel !== filterChannel) return false;
      if (filterRead === "unread" && c.unread === 0) return false;
      if (filterRead === "read" && c.unread > 0) return false;
      if (search && !c.contactName.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) =>
      filterOrder === "recent"
        ? MOCK.indexOf(a) - MOCK.indexOf(b)
        : MOCK.indexOf(b) - MOCK.indexOf(a)
    );

  const activeConv = MOCK.find((c) => c.id === selected) ?? null;

  return (
    <div className="flex flex-1 h-full overflow-hidden bg-background">

      {/* ── Col 1: Lista de conversas ─────────────────────── */}
      <aside className="w-72 shrink-0 border-r flex flex-col">
        <div className="p-3 border-b space-y-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              className="pl-8 h-8 text-sm"
              placeholder="Buscar conversa..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-1.5">
            {/* Filters dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant={filterChannel !== "all" || filterRead !== "all" ? "default" : "outline"}
                  size="icon" className="h-7 w-7"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-44">
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

            {/* Sort */}
            <Button
              variant="outline" size="icon" className="h-7 w-7"
              onClick={() => setFilterOrder((o) => o === "recent" ? "oldest" : "recent")}
              title={filterOrder === "recent" ? "Mais recentes primeiro" : "Mais antigas primeiro"}
            >
              <ArrowDownUp className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
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
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Phone className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="w-4 h-4" />
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
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {activeConv.messages.map((msg) => (
              <div key={msg.id} className={cn("flex", msg.fromMe ? "justify-end" : "justify-start")}>
                <div className={cn(
                  "max-w-[72%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed",
                  msg.fromMe
                    ? "bg-primary text-primary-foreground rounded-br-sm"
                    : "bg-muted rounded-bl-sm"
                )}>
                  <p>{msg.text}</p>
                  <p className={cn(
                    "text-[10px] mt-1 text-right",
                    msg.fromMe ? "text-primary-foreground/60" : "text-muted-foreground"
                  )}>{msg.time}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="border-t p-3 flex items-end gap-2">
            <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0">
              <Paperclip className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0">
              <Smile className="w-4 h-4" />
            </Button>
            <Input
              className="flex-1"
              placeholder="Escreva uma mensagem..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); setInput(""); } }}
            />
            <Button size="icon" className="h-9 w-9 shrink-0" disabled={!input.trim()}>
              <Send className="w-4 h-4" />
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

            {/* Quick actions */}
            <div className="p-3 border-t mt-auto space-y-1.5">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide px-1 mb-2">Ações rápidas</p>
              {activeConv.email ? (
                <Button variant="outline" size="sm" className="w-full text-xs justify-start gap-2 h-8">
                  <ExternalLink className="w-3.5 h-3.5" /> Ver cliente
                </Button>
              ) : (
                <Button variant="outline" size="sm" className="w-full text-xs justify-start gap-2 h-8">
                  <UserPlus className="w-3.5 h-3.5" /> Criar cliente
                </Button>
              )}
              <Button variant="outline" size="sm" className="w-full text-xs justify-start gap-2 h-8">
                <Calendar className="w-3.5 h-3.5" /> Agendar sessão
              </Button>
              <Button variant="outline" size="sm" className="w-full text-xs justify-start gap-2 h-8">
                <Tag className="w-3.5 h-3.5" /> Adicionar tag
              </Button>
            </div>
          </div>
        )}
      </aside>

    </div>
  );
}

/* ─── Sub-components ─────────────────────────────────────── */

function ConvItem({ conv, active, onClick }: { conv: Conversation; active: boolean; onClick: () => void }) {
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
