"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Calendar, Users, CreditCard, Megaphone, BarChart3, Globe,
  Bell, Search, ChevronLeft, ChevronRight, Clock,
  TrendingUp, TrendingDown, Send, Check, Star,
  ArrowUpRight, ArrowDownRight, FileText, Phone,
} from "lucide-react";
import logoColor from "@/assets/logo-color.png";

/* ─── shared chrome wrapper ─────────────────────────────────── */
function MockWindow({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="w-full rounded-2xl overflow-hidden border border-border shadow-[0_32px_80px_hsl(20_15%_12%/0.12)]"
      style={{ background: "hsl(30 25% 99%)" }}
    >
      {/* title bar */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border" style={{ background: "hsl(30 20% 97%)" }}>
        <div className="w-2.5 h-2.5 rounded-full bg-red-400/70" />
        <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/70" />
        <div className="w-2.5 h-2.5 rounded-full bg-green-400/70" />
        <div className="flex-1 mx-4">
          <div className="w-44 h-4 mx-auto rounded bg-border/60 flex items-center justify-center">
            <span className="text-[9px] text-muted-foreground">app.bellex.com.br</span>
          </div>
        </div>
      </div>
      {children}
    </div>
  );
}

function Sidebar({ active }: { active: number }) {
  const icons = [Calendar, Users, CreditCard, Megaphone, BarChart3, Globe];
  return (
    <div className="w-12 border-r border-border flex flex-col items-center py-4 gap-4 flex-shrink-0" style={{ background: "hsl(30 20% 97%)" }}>
      <img src={logoColor} alt="Bellex" className="w-7 h-auto opacity-90 mb-1" />
      {icons.map((Icon, i) => (
        <div key={i} className={`w-8 h-8 rounded-xl flex items-center justify-center cursor-pointer transition-colors ${i === active ? "bg-primary/15" : "hover:bg-border/60"}`}>
          <Icon size={14} className={i === active ? "text-primary" : "text-muted-foreground"} />
        </div>
      ))}
    </div>
  );
}

/* ─── 0. AGENDA ──────────────────────────────────────────────── */
const appts = [
  { time: "09:00", client: "Camila F.", service: "Limpeza de Pele", color: "bg-primary/10 border-primary/25 text-primary" },
  { time: "10:30", client: "Juliana M.", service: "Design de Sobrancelha", color: "bg-blue-50 border-blue-200 text-blue-600" },
  { time: "11:30", client: "Fernanda R.", service: "Tratamento Facial Profundo", color: "bg-emerald-50 border-emerald-200 text-emerald-600" },
  { time: "14:00", client: "Patricia L.", service: "Massagem Relaxante", color: "bg-violet-50 border-violet-200 text-violet-600" },
  { time: "15:30", client: "Andrea C.", service: "Peeling Químico", color: "bg-amber-50 border-amber-200 text-amber-600" },
  { time: "16:30", client: "Renata B.", service: "Botox Preventivo", color: "bg-rose-50 border-rose-200 text-rose-600" },
];
const days = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const dates = [2, 3, 4, 5, 6, 7];

function MockAgenda() {
  return (
    <MockWindow>
      <div className="flex h-[520px]">
        <Sidebar active={0} />
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex items-center justify-between px-5 py-3 border-b border-border">
            <div>
              <h3 className="text-foreground text-sm font-medium">Agenda</h3>
              <p className="text-muted-foreground text-[11px]">Junho 2026 · 6 atendimentos hoje</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-muted-foreground">
                <Search size={11} /><span className="text-[11px]">Buscar cliente...</span>
              </div>
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                <Bell size={12} className="text-primary" />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 px-5 py-2.5 border-b border-border">
            <button className="p-1 rounded-lg hover:bg-muted text-muted-foreground"><ChevronLeft size={13} /></button>
            <div className="flex gap-1 flex-1">
              {days.map((d, i) => (
                <div key={d} className={`flex-1 flex flex-col items-center py-1.5 rounded-xl cursor-pointer text-xs transition-colors ${i === 2 ? "bg-primary/10" : "hover:bg-muted"}`}>
                  <span className={i === 2 ? "text-primary font-medium" : "text-muted-foreground"}>{d}</span>
                  <span className={`text-sm font-light mt-0.5 ${i === 2 ? "text-primary font-medium" : "text-foreground"}`}>{dates[i]}</span>
                </div>
              ))}
            </div>
            <button className="p-1 rounded-lg hover:bg-muted text-muted-foreground"><ChevronRight size={13} /></button>
          </div>
          <div className="flex-1 overflow-hidden px-5 py-3 space-y-2">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              <span className="text-[10px] text-primary font-medium">Agora · 11:45</span>
              <div className="flex-1 border-t border-primary/20" />
            </div>
            {appts.map((a, i) => (
              <div key={i} className={`flex items-center gap-3 px-3 py-2 rounded-xl border ${a.color}`}>
                <div className="text-[10px] font-semibold w-10 flex-shrink-0">{a.time}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-medium truncate">{a.service}</div>
                  <div className="text-[10px] opacity-70 truncate">{a.client}</div>
                </div>
                <div className="w-5 h-5 rounded-full bg-white/60 flex items-center justify-center text-[9px] font-medium flex-shrink-0">
                  {a.client.split(" ").map(w => w[0]).join("")}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="w-44 border-l border-border flex flex-col p-4 gap-4 flex-shrink-0" style={{ background: "hsl(30 20% 97%)" }}>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Hoje</p>
            <div className="text-3xl font-light text-foreground">6</div>
            <div className="text-muted-foreground text-[11px]">atendimentos</div>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Faturamento</p>
            <div className="text-lg font-light text-foreground">R$ 1.840</div>
            <div className="text-muted-foreground text-[11px]">+12% esta semana</div>
          </div>
          <div className="space-y-1.5 mt-auto">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Especialistas</p>
            {["Dra. Ana", "Bianca S.", "Dr. Felipe"].map((name) => (
              <div key={name} className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-primary/15 flex items-center justify-center text-[9px] font-medium text-primary">
                  {name.split(" ").map(w => w[0]).join("")}
                </div>
                <span className="text-[10px] text-muted-foreground truncate">{name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </MockWindow>
  );
}

/* ─── 1. PRONTUÁRIO ─────────────────────────────────────────── */
const clients = [
  { name: "Camila Ferreira", last: "há 3 dias", visits: 12, tag: "Frequente" },
  { name: "Juliana Martins", last: "há 10 dias", visits: 5, tag: "Ativa" },
  { name: "Fernanda Rocha", last: "há 1 mês", visits: 3, tag: "Ativa" },
  { name: "Patricia Lima", last: "há 3 meses", visits: 8, tag: "Inativa" },
  { name: "Andrea Costa", last: "há 7 dias", visits: 20, tag: "VIP" },
];
const tagColor: Record<string, string> = {
  Frequente: "bg-primary/10 text-primary",
  Ativa: "bg-emerald-50 text-emerald-600",
  Inativa: "bg-amber-50 text-amber-600",
  VIP: "bg-violet-50 text-violet-600",
};

function MockProntuario() {
  return (
    <MockWindow>
      <div className="flex h-[520px]">
        <Sidebar active={1} />
        {/* client list */}
        <div className="w-52 border-r border-border flex flex-col min-w-0 flex-shrink-0" style={{ background: "hsl(30 20% 97%)" }}>
          <div className="px-3 py-3 border-b border-border">
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border bg-white text-muted-foreground">
              <Search size={11} /><span className="text-[11px]">Buscar cliente...</span>
            </div>
          </div>
          <div className="flex-1 overflow-hidden py-2">
            {clients.map((c, i) => (
              <div key={c.name} className={`px-3 py-2.5 cursor-pointer border-l-2 transition-all ${i === 0 ? "border-primary bg-primary/5" : "border-transparent hover:bg-muted/60"}`}>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-foreground truncate">{c.name}</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${tagColor[c.tag]}`}>{c.tag}</span>
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5">{c.visits} visitas · {c.last}</div>
              </div>
            ))}
          </div>
        </div>
        {/* detail */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <div className="px-5 py-3 border-b border-border flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-foreground">Camila Ferreira</h3>
              <p className="text-[11px] text-muted-foreground">12 visitas · última há 3 dias</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg border border-border bg-white flex items-center justify-center"><Phone size={11} className="text-muted-foreground" /></div>
              <button className="text-[11px] bg-primary text-white px-3 py-1.5 rounded-lg font-medium">Novo atendimento</button>
            </div>
          </div>
          <div className="flex-1 overflow-hidden px-5 py-4 grid grid-cols-2 gap-4">
            {/* anamnese */}
            <div className="space-y-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Anamnese</p>
              {[["Tipo de pele", "Mista/oleosa"], ["Alergias", "Nenhuma"], ["Objetivo", "Anti-aging"], ["Última avaliação", "02/06/2026"]].map(([k, v]) => (
                <div key={k} className="flex justify-between border-b border-border/40 pb-1.5">
                  <span className="text-[10px] text-muted-foreground">{k}</span>
                  <span className="text-[10px] font-medium text-foreground">{v}</span>
                </div>
              ))}
            </div>
            {/* history */}
            <div className="space-y-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Histórico</p>
              {[
                { date: "02/06", proc: "Limpeza de Pele", prof: "Bianca S." },
                { date: "15/05", proc: "Peeling Químico", prof: "Dra. Ana" },
                { date: "28/04", proc: "Botox Preventivo", prof: "Dra. Ana" },
                { date: "10/04", proc: "Limpeza de Pele", prof: "Bianca S." },
              ].map((h, i) => (
                <div key={i} className="flex items-start gap-2 pb-1.5 border-b border-border/40">
                  <div className="text-[9px] text-muted-foreground w-12 pt-0.5 flex-shrink-0">{h.date}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-medium text-foreground truncate">{h.proc}</div>
                    <div className="text-[10px] text-muted-foreground">{h.prof}</div>
                  </div>
                  <FileText size={10} className="text-muted-foreground/50 mt-0.5 flex-shrink-0" />
                </div>
              ))}
            </div>
          </div>
          {/* observation box */}
          <div className="px-5 pb-4">
            <div className="rounded-xl border border-border/60 bg-muted/30 p-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">Observações do último atendimento</p>
              <p className="text-[11px] text-foreground/80 leading-relaxed">Pele com discreta descamação na zona T. Recomendado hidratante FPS50 diário. Retorno em 30 dias para avaliação.</p>
            </div>
          </div>
        </div>
      </div>
    </MockWindow>
  );
}

/* ─── 2. FINANCEIRO ─────────────────────────────────────────── */
const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun"];
const barHeights = [55, 65, 48, 72, 68, 88];

function MockFinanceiro() {
  return (
    <MockWindow>
      <div className="flex h-[520px]">
        <Sidebar active={2} />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-border">
            <div>
              <h3 className="text-sm font-medium text-foreground">Financeiro</h3>
              <p className="text-[11px] text-muted-foreground">Junho 2026</p>
            </div>
            <button className="text-[11px] border border-border px-3 py-1.5 rounded-lg text-muted-foreground hover:bg-muted transition-colors">Exportar</button>
          </div>
          {/* KPI row */}
          <div className="grid grid-cols-3 border-b border-border">
            {[
              { label: "Faturamento", value: "R$ 18.420", delta: "+23%", up: true },
              { label: "Recebido", value: "R$ 16.750", delta: "+18%", up: true },
              { label: "Inadimplência", value: "R$ 1.670", delta: "-4%", up: false },
            ].map((k) => (
              <div key={k.label} className="px-5 py-3.5 border-r border-border last:border-r-0">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{k.label}</p>
                <div className="text-lg font-light text-foreground">{k.value}</div>
                <div className={`flex items-center gap-1 mt-0.5 text-[10px] font-medium ${k.up ? "text-emerald-600" : "text-rose-500"}`}>
                  {k.up ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}{k.delta}
                </div>
              </div>
            ))}
          </div>
          {/* chart + transactions */}
          <div className="flex-1 flex overflow-hidden">
            {/* bar chart */}
            <div className="flex-1 px-5 py-4 border-r border-border min-w-0">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-3">Faturamento mensal</p>
              <div className="flex items-end gap-2 h-32">
                {months.map((m, i) => (
                  <div key={m} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className={`w-full rounded-t-md transition-all ${i === 5 ? "bg-primary" : "bg-primary/25"}`}
                      style={{ height: `${barHeights[i]}%` }}
                    />
                    <span className="text-[9px] text-muted-foreground">{m}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* transactions */}
            <div className="w-52 flex-shrink-0 flex flex-col">
              <div className="px-4 py-3 border-b border-border">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Últimas transações</p>
              </div>
              <div className="flex-1 overflow-hidden py-1">
                {[
                  { name: "Limpeza de Pele", client: "Camila F.", val: "+ R$ 180", color: "text-emerald-600" },
                  { name: "Botox Preventivo", client: "Renata B.", val: "+ R$ 650", color: "text-emerald-600" },
                  { name: "Massagem", client: "Patricia L.", val: "+ R$ 120", color: "text-emerald-600" },
                  { name: "Reembolso", client: "Juliana M.", val: "- R$ 80", color: "text-rose-500" },
                  { name: "Peeling Químico", client: "Andrea C.", val: "+ R$ 350", color: "text-emerald-600" },
                ].map((t, i) => (
                  <div key={i} className="flex items-center gap-2 px-4 py-2 hover:bg-muted/40 transition-colors">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <CreditCard size={10} className="text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] font-medium text-foreground truncate">{t.name}</div>
                      <div className="text-[9px] text-muted-foreground">{t.client}</div>
                    </div>
                    <span className={`text-[10px] font-medium flex-shrink-0 ${t.color}`}>{t.val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </MockWindow>
  );
}

/* ─── 3. MARKETING ──────────────────────────────────────────── */
function MockMarketing() {
  return (
    <MockWindow>
      <div className="flex h-[520px]">
        <Sidebar active={3} />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-border">
            <div>
              <h3 className="text-sm font-medium text-foreground">Marketing Automatizado</h3>
              <p className="text-[11px] text-muted-foreground">4 campanhas ativas</p>
            </div>
            <button className="text-[11px] bg-primary text-white px-3 py-1.5 rounded-lg font-medium">+ Nova campanha</button>
          </div>
          {/* stats row */}
          <div className="grid grid-cols-4 border-b border-border">
            {[
              { label: "Mensagens enviadas", val: "1.240" },
              { label: "Taxa de abertura", val: "68%" },
              { label: "Reativados", val: "47" },
              { label: "Avaliações Google", val: "4.8 ★" },
            ].map((s) => (
              <div key={s.label} className="px-4 py-3 border-r border-border last:border-r-0 text-center">
                <div className="text-base font-light text-foreground">{s.val}</div>
                <p className="text-[9px] text-muted-foreground mt-0.5 leading-tight">{s.label}</p>
              </div>
            ))}
          </div>
          {/* campaign list */}
          <div className="flex-1 overflow-hidden px-5 py-3 space-y-2.5">
            {[
              {
                name: "Reativação 90 dias",
                desc: "Clientes sem visita há 90+ dias",
                status: "Ativo",
                sent: "312 enviados",
                rate: "72% abertura",
                channel: "WhatsApp",
                color: "bg-emerald-50 text-emerald-700 border-emerald-200",
              },
              {
                name: "Lembrete de retorno",
                desc: "30 dias após último procedimento",
                status: "Ativo",
                sent: "548 enviados",
                rate: "81% abertura",
                channel: "WhatsApp",
                color: "bg-emerald-50 text-emerald-700 border-emerald-200",
              },
              {
                name: "Aniversariantes do mês",
                desc: "Desconto especial no mês do aniversário",
                status: "Ativo",
                sent: "89 enviados",
                rate: "91% abertura",
                channel: "E-mail + WhatsApp",
                color: "bg-emerald-50 text-emerald-700 border-emerald-200",
              },
              {
                name: "Pós-atendimento",
                desc: "Solicita avaliação no Google 2h após visita",
                status: "Rascunho",
                sent: "—",
                rate: "—",
                channel: "WhatsApp",
                color: "bg-muted text-muted-foreground border-border",
              },
            ].map((c, i) => (
              <div key={i} className="flex items-center gap-3 p-3.5 rounded-xl border border-border bg-white hover:shadow-sm transition-all">
                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Send size={13} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-medium text-foreground">{c.name}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full border font-medium ${c.color}`}>{c.status}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{c.desc}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-[10px] font-medium text-foreground">{c.sent}</div>
                  <div className="text-[9px] text-muted-foreground">{c.rate}</div>
                </div>
                <div className="w-1 h-6 rounded-full bg-border/40 mx-1 flex-shrink-0" />
                <div className="text-[9px] text-muted-foreground flex-shrink-0">{c.channel}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </MockWindow>
  );
}

/* ─── 4. RELATÓRIOS ─────────────────────────────────────────── */
const specialists = [
  { name: "Dra. Ana", revenue: "R$ 7.420", sessions: 42, bar: 88 },
  { name: "Bianca S.", revenue: "R$ 5.810", sessions: 38, bar: 69 },
  { name: "Dr. Felipe", revenue: "R$ 3.190", sessions: 21, bar: 38 },
];

function MockRelatorios() {
  return (
    <MockWindow>
      <div className="flex h-[520px]">
        <Sidebar active={4} />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-border">
            <div>
              <h3 className="text-sm font-medium text-foreground">Relatórios</h3>
              <p className="text-[11px] text-muted-foreground">Junho 2026</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-[11px] border border-border px-3 py-1.5 rounded-lg text-muted-foreground">Últimos 30 dias</div>
            </div>
          </div>
          <div className="flex-1 overflow-hidden px-5 py-4 grid grid-cols-2 gap-4">
            {/* left col */}
            <div className="space-y-4">
              {/* KPIs */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Taxa de retorno", val: "68%", sub: "+5pp vs mês anterior", up: true },
                  { label: "Ticket médio", val: "R$ 215", sub: "+12% vs mês anterior", up: true },
                  { label: "Novos clientes", val: "34", sub: "+8 vs mês anterior", up: true },
                  { label: "Cancelamentos", val: "4%", sub: "-2pp vs mês anterior", up: false },
                ].map((k) => (
                  <div key={k.label} className="p-3 rounded-xl border border-border bg-white">
                    <p className="text-[9px] text-muted-foreground uppercase tracking-wider">{k.label}</p>
                    <div className="text-base font-light text-foreground mt-1">{k.val}</div>
                    <div className={`flex items-center gap-0.5 text-[9px] mt-0.5 font-medium ${k.up ? "text-emerald-600" : "text-rose-500"}`}>
                      {k.up ? <TrendingUp size={9} /> : <TrendingDown size={9} />}{k.sub}
                    </div>
                  </div>
                ))}
              </div>
              {/* top services */}
              <div className="p-3 rounded-xl border border-border bg-white">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Top serviços</p>
                {[
                  { name: "Limpeza de Pele", pct: 82 },
                  { name: "Botox Preventivo", pct: 64 },
                  { name: "Design de Sobrancelha", pct: 51 },
                ].map((s) => (
                  <div key={s.name} className="mb-2 last:mb-0">
                    <div className="flex justify-between mb-0.5">
                      <span className="text-[10px] text-foreground">{s.name}</span>
                      <span className="text-[10px] text-muted-foreground">{s.pct}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary/60" style={{ width: `${s.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* right col — specialists */}
            <div className="space-y-4">
              <div className="p-3 rounded-xl border border-border bg-white h-full">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-3">Desempenho por especialista</p>
                {specialists.map((s) => (
                  <div key={s.name} className="mb-4 last:mb-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center text-[9px] font-medium text-primary">
                          {s.name.split(" ").map(w => w[0]).join("")}
                        </div>
                        <span className="text-[11px] font-medium text-foreground">{s.name}</span>
                      </div>
                      <span className="text-[10px] font-medium text-foreground">{s.revenue}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary/50" style={{ width: `${s.bar}%` }} />
                    </div>
                    <span className="text-[9px] text-muted-foreground">{s.sessions} atendimentos</span>
                  </div>
                ))}
                {/* star ratings */}
                <div className="mt-4 pt-3 border-t border-border/60">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Avaliações recebidas</p>
                  {[5, 5, 4, 5, 4].map((r, i) => (
                    <div key={i} className="flex items-center gap-1 mb-1">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <Star key={j} size={9} className={j < r ? "text-amber-400 fill-amber-400" : "text-border"} />
                      ))}
                      <span className="text-[9px] text-muted-foreground ml-1">{["Dra. Ana", "Bianca S.", "Dr. Felipe", "Dra. Ana", "Bianca S."][i]}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MockWindow>
  );
}

/* ─── 5. AGENDAMENTO ONLINE ──────────────────────────────────── */
function MockAgendamentoOnline() {
  return (
    <MockWindow>
      <div className="flex h-[520px]">
        <Sidebar active={5} />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-border">
            <div>
              <h3 className="text-sm font-medium text-foreground">Agendamento Online</h3>
              <p className="text-[11px] text-muted-foreground">Link público · studio.bellex.com.br</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-[11px] border border-border px-3 py-1.5 rounded-lg text-muted-foreground">
                <Globe size={11} />bellex.com.br/agenda
              </div>
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
          </div>
          <div className="flex-1 flex overflow-hidden">
            {/* mock public page */}
            <div className="flex-1 p-4 flex flex-col gap-3 border-r border-border min-w-0 overflow-hidden" style={{ background: "hsl(30 20% 97%)" }}>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Visualização pública</p>
              <div className="rounded-xl border border-border bg-white p-4 shadow-sm flex-1 overflow-hidden flex flex-col">
                {/* clinic header */}
                <div className="flex items-center gap-3 mb-3 pb-3 border-b border-border/60">
                  <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                    <img src={logoColor} className="w-6 h-auto" alt="" />
                  </div>
                  <div>
                    <div className="text-[12px] font-medium text-foreground">Studio Bellex</div>
                    <div className="text-[10px] text-muted-foreground">São Paulo · Pinheiros</div>
                  </div>
                  <div className="ml-auto flex items-center gap-1">
                    {[1,2,3,4,5].map(i => <Star key={i} size={9} className="text-amber-400 fill-amber-400" />)}
                    <span className="text-[10px] text-muted-foreground ml-1">4.9</span>
                  </div>
                </div>
                {/* service list */}
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Escolha o serviço</p>
                <div className="space-y-1.5 flex-1 overflow-hidden">
                  {[
                    { name: "Limpeza de Pele", dur: "60 min", price: "R$ 180", selected: true },
                    { name: "Design de Sobrancelha", dur: "30 min", price: "R$ 90", selected: false },
                    { name: "Tratamento Facial", dur: "90 min", price: "R$ 320", selected: false },
                    { name: "Massagem Relaxante", dur: "60 min", price: "R$ 120", selected: false },
                  ].map((s) => (
                    <div key={s.name} className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-all ${s.selected ? "border-primary/40 bg-primary/5" : "border-border hover:border-primary/20"}`}>
                      <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${s.selected ? "border-primary bg-primary" : "border-border"}`}>
                        {s.selected && <Check size={8} className="text-white" />}
                      </div>
                      <span className="text-[11px] font-medium text-foreground flex-1">{s.name}</span>
                      <span className="text-[10px] text-muted-foreground">{s.dur}</span>
                      <span className="text-[11px] font-medium text-primary">{s.price}</span>
                    </div>
                  ))}
                </div>
                {/* CTA */}
                <button className="mt-3 w-full bg-primary text-white text-[11px] font-medium py-2 rounded-lg">
                  Escolher horário →
                </button>
              </div>
            </div>
            {/* stats sidebar */}
            <div className="w-44 flex-shrink-0 flex flex-col p-4 gap-4" style={{ background: "hsl(30 25% 99%)" }}>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Este mês</p>
              {[
                { label: "Agendamentos online", val: "89" },
                { label: "Sem intervenção", val: "100%" },
                { label: "Fora do horário comercial", val: "34%" },
                { label: "Conversão do link", val: "42%" },
              ].map((s) => (
                <div key={s.label}>
                  <div className="text-base font-light text-foreground">{s.val}</div>
                  <div className="text-[10px] text-muted-foreground leading-tight">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </MockWindow>
  );
}

/* ─── TABS COMPONENT ─────────────────────────────────────────── */
const tabs = [
  { icon: Calendar, label: "Agenda", mock: <MockAgenda /> },
  { icon: Users, label: "Prontuário", mock: <MockProntuario /> },
  { icon: CreditCard, label: "Financeiro", mock: <MockFinanceiro /> },
  { icon: Megaphone, label: "Marketing", mock: <MockMarketing /> },
  { icon: BarChart3, label: "Relatórios", mock: <MockRelatorios /> },
  { icon: Globe, label: "Online", mock: <MockAgendamentoOnline /> },
];

export function FeatureMockupTabs() {
  const [active, setActive] = useState(0);
  const [direction, setDirection] = useState(1);

  function go(idx: number) {
    setDirection(idx > active ? 1 : -1);
    setActive(idx);
  }

  return (
    <div className="space-y-4">
      {/* tab bar */}
      <div className="flex items-center gap-1 p-1 rounded-2xl border border-border/60 bg-muted/40 backdrop-blur-sm overflow-x-auto">
        {tabs.map((t, i) => {
          const isActive = i === active;
          return (
            <button
              key={t.label}
              onClick={() => go(i)}
              className="relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors flex-shrink-0 focus-visible:outline-none"
            >
              {isActive && (
                <motion.span
                  layoutId="tab-bg"
                  className="absolute inset-0 rounded-xl bg-white shadow-sm border border-border/60"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <t.icon size={14} className={`relative z-10 transition-colors ${isActive ? "text-primary" : "text-muted-foreground"}`} />
              <span className={`relative z-10 transition-colors ${isActive ? "text-foreground" : "text-muted-foreground"}`}>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* mockup panel */}
      <div className="relative overflow-hidden rounded-2xl border border-border/40 border-dotted p-3 bg-background/60">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={active}
            custom={direction}
            initial={{ opacity: 0, x: direction * 32 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -32 }}
            transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
          >
            {tabs[active].mock}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
