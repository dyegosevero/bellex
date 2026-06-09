"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Calendar, Users, CreditCard, Megaphone, BarChart3, Globe,
  Search, ChevronLeft, ChevronRight, Plus, Filter,
  TrendingUp, Send, Check, Star,
  ArrowUpRight, ArrowDownRight, FileText, Phone,
  DollarSign, LayoutDashboard, Clock, Eye,
  Sparkles, UserCog, MessageCircle, Kanban,
} from "lucide-react";
import logoColor from "@/assets/logo-color.png";

/* ─── shared chrome ────────────────────────────────────────────── */
function MockWindow({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="w-full rounded-2xl overflow-hidden border border-border shadow-[0_32px_80px_hsl(20_15%_12%/0.12)]"
      style={{ background: "hsl(30 25% 99%)" }}
    >
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

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: "Dashboard" },
  { icon: Calendar, label: "Agenda" },
  { icon: Users, label: "Clientes" },
  { icon: CreditCard, label: "Cobranças" },
  { icon: DollarSign, label: "Faturamento" },
  { icon: Sparkles, label: "Serviços" },
  { icon: UserCog, label: "Equipe" },
  { icon: Megaphone, label: "Marketing" },
  { icon: Kanban, label: "Pipeline" },
  { icon: MessageCircle, label: "Mensagens" },
  { icon: BarChart3, label: "Relatórios" },
];

function Sidebar({ active }: { active: number }) {
  return (
    <div className="w-12 border-r border-border flex flex-col items-center py-3 gap-1 flex-shrink-0 overflow-hidden" style={{ background: "hsl(30 20% 97%)" }}>
      <img src={logoColor} alt="Bellex" className="w-7 h-auto opacity-90 mb-2" />
      {NAV_ITEMS.map(({ icon: Icon, label }, i) => (
        <div
          key={label}
          title={label}
          className={`w-8 h-7 rounded-lg flex items-center justify-center cursor-pointer transition-colors ${i === active ? "bg-primary/15" : "hover:bg-border/60"}`}
        >
          <Icon size={13} className={i === active ? "text-primary" : "text-muted-foreground"} />
        </div>
      ))}
    </div>
  );
}

function PageHeader({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-border">
      <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-primary/10 flex-shrink-0">
        {icon}
      </div>
      <div>
        <h3 className="text-sm font-semibold text-foreground leading-none">{title}</h3>
        <p className="text-[10px] text-muted-foreground mt-0.5">{subtitle}</p>
      </div>
    </div>
  );
}

/* ─── 0. AGENDA ── real layout: time-grid calendar ──────────────── */
const HOURS = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"];
const DAYS_SHORT = ["Seg 02", "Ter 03", "Qua 04", "Qui 05", "Sex 06", "Sáb 07"];

const EVENTS: Array<{ day: number; row: number; span: number; label: string; color: string; border: string; text: string }> = [
  { day: 0, row: 1, span: 1, label: "Camila F. · Limpeza de Pele", color: "#fff1f2", border: "#fecdd3", text: "#e11d48" },
  { day: 1, row: 2, span: 1, label: "Juliana M. · Design de Sobrancelha", color: "#eff6ff", border: "#bfdbfe", text: "#1d4ed8" },
  { day: 1, row: 5, span: 2, label: "Fernanda R. · Tratamento Facial", color: "#f0fdf4", border: "#bbf7d0", text: "#15803d" },
  { day: 2, row: 0, span: 1, label: "Patricia L. · Massagem", color: "#f5f3ff", border: "#ddd6fe", text: "#7c3aed" },
  { day: 2, row: 3, span: 2, label: "Andrea C. · Peeling Químico", color: "#fffbeb", border: "#fde68a", text: "#b45309" },
  { day: 3, row: 1, span: 1, label: "Renata B. · Botox Preventivo", color: "#fff1f2", border: "#fecdd3", text: "#e11d48" },
  { day: 3, row: 4, span: 1, label: "Marcos V. · Avaliação", color: "#eff6ff", border: "#bfdbfe", text: "#1d4ed8" },
  { day: 4, row: 2, span: 2, label: "Claudia S. · Bioestimulador", color: "#f0fdf4", border: "#bbf7d0", text: "#15803d" },
  { day: 5, row: 1, span: 1, label: "Tânia M. · Drenagem", color: "#f5f3ff", border: "#ddd6fe", text: "#7c3aed" },
];

const ROW_H = 28;

function MockAgenda() {
  return (
    <MockWindow>
      <div className="flex h-[520px]">
        <Sidebar active={1} />
        <div className="flex-1 flex flex-col min-w-0">
          <PageHeader icon={<Calendar size={14} className="text-primary" />} title="Agenda" subtitle="Junho 2026 · visão semanal" />

          {/* Toolbar */}
          <div className="flex items-center justify-between px-5 py-2 border-b border-border">
            <div className="flex items-center gap-1">
              <button className="p-1 rounded hover:bg-muted text-muted-foreground"><ChevronLeft size={12} /></button>
              <span className="text-[11px] font-medium text-foreground mx-1">02 – 07 Jun 2026</span>
              <button className="p-1 rounded hover:bg-muted text-muted-foreground"><ChevronRight size={12} /></button>
            </div>
            <div className="flex items-center gap-1">
              {["Dia", "Semana", "Mês"].map((v, i) => (
                <button key={v} className={`text-[10px] px-2.5 py-1 rounded-lg transition-colors ${i === 1 ? "bg-primary text-white" : "text-muted-foreground hover:bg-muted border border-border"}`}>{v}</button>
              ))}
              <button className="ml-2 flex items-center gap-1 text-[10px] bg-primary/10 text-primary px-2.5 py-1 rounded-lg">
                <Plus size={9} />Novo
              </button>
            </div>
          </div>

          {/* Calendar grid */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {/* Day headers */}
            <div className="flex border-b border-border" style={{ paddingLeft: 44 }}>
              {DAYS_SHORT.map((d, i) => (
                <div key={d} className={`flex-1 text-center py-1.5 text-[10px] font-medium border-r border-border last:border-r-0 ${i === 2 ? "text-primary bg-primary/5" : "text-muted-foreground"}`}>{d}</div>
              ))}
            </div>

            {/* Scrollable time grid */}
            <div className="flex-1 overflow-hidden relative" style={{ display: "flex" }}>
              {/* Hour labels */}
              <div className="flex flex-col flex-shrink-0" style={{ width: 44 }}>
                {HOURS.map((h) => (
                  <div key={h} className="flex items-start justify-end pr-2 text-[8px] text-muted-foreground/60 border-b border-border/40" style={{ height: ROW_H }}>
                    {h}
                  </div>
                ))}
              </div>

              {/* Day columns */}
              <div className="flex flex-1 relative">
                {DAYS_SHORT.map((d, di) => {
                  const dayEvents = EVENTS.filter(e => e.day === di);
                  return (
                    <div key={d} className={`flex-1 relative border-r border-border/40 last:border-r-0 ${di === 2 ? "bg-primary/[0.02]" : ""}`}>
                      {/* horizontal hour lines */}
                      {HOURS.map((h) => (
                        <div key={h} className="absolute w-full border-b border-border/25" style={{ top: HOURS.indexOf(h) * ROW_H, height: ROW_H }} />
                      ))}
                      {/* events */}
                      {dayEvents.map((ev, ei) => (
                        <div
                          key={ei}
                          className="absolute left-0.5 right-0.5 rounded overflow-hidden"
                          style={{
                            top: ev.row * ROW_H + 2,
                            height: ev.span * ROW_H - 4,
                            background: ev.color,
                            borderLeft: `2px solid ${ev.border}`,
                          }}
                        >
                          <span className="block text-[8px] font-medium px-1 pt-0.5 leading-tight truncate" style={{ color: ev.text }}>
                            {ev.label}
                          </span>
                        </div>
                      ))}
                      {/* "now" indicator on Wed */}
                      {di === 2 && (
                        <div className="absolute left-0 right-0 flex items-center" style={{ top: 3.5 * ROW_H }}>
                          <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                          <div className="flex-1 border-t border-primary" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </MockWindow>
  );
}

/* ─── 1. CLIENTES ── real layout: search + filter + table ────────── */
const CLIENT_ROWS = [
  { name: "Camila Ferreira", email: "camila@gmail.com", phone: "(11) 9 8765-4321", visits: 12, since: "8 meses", tag: "VIP", tagColor: "bg-violet-50 text-violet-600" },
  { name: "Juliana Martins", email: "ju.martins@email.com", phone: "(11) 9 9123-0012", visits: 5, since: "3 meses", tag: "Ativa", tagColor: "bg-emerald-50 text-emerald-600" },
  { name: "Fernanda Rocha", email: "fernanda.r@me.com", phone: "(21) 9 8888-7766", visits: 3, since: "2 meses", tag: "Ativa", tagColor: "bg-emerald-50 text-emerald-600" },
  { name: "Patricia Lima", email: "patricia_lima@email.com", phone: "(11) 9 7654-3210", visits: 8, since: "1 ano", tag: "Inativa", tagColor: "bg-amber-50 text-amber-600" },
  { name: "Andrea Costa", email: "andrea.c@gmail.com", phone: "(11) 9 9001-2233", visits: 20, since: "2 anos", tag: "VIP", tagColor: "bg-violet-50 text-violet-600" },
  { name: "Renata Batista", email: "renata.b@icloud.com", phone: "(21) 9 8000-4455", visits: 1, since: "1 mês", tag: "Nova", tagColor: "bg-primary/10 text-primary" },
];

function MockClientes() {
  return (
    <MockWindow>
      <div className="flex h-[520px]">
        <Sidebar active={2} />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-primary/10 flex-shrink-0">
                <Users size={14} className="text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground leading-none">Clientes</h3>
                <p className="text-[10px] text-muted-foreground mt-0.5">312 clientes cadastrados</p>
              </div>
            </div>
            <button className="flex items-center gap-1.5 text-[11px] bg-primary text-white px-3 py-1.5 rounded-lg font-medium">
              <Plus size={11} />Novo cliente
            </button>
          </div>

          {/* Search + filter row */}
          <div className="flex items-center gap-2 px-5 py-2.5 border-b border-border">
            <div className="flex-1 relative">
              <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <div className="w-full pl-7 pr-3 py-1.5 text-[11px] rounded-lg border border-border bg-white text-muted-foreground">
                Buscar por nome, e-mail ou telefone...
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border bg-white text-[11px] text-muted-foreground">
              <Filter size={10} />Todos
            </div>
            <div className="text-[11px] border border-border px-2.5 py-1.5 rounded-lg text-muted-foreground bg-white">
              Exportar
            </div>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-hidden">
            {/* thead */}
            <div className="grid border-b border-border bg-muted/30 px-5" style={{ gridTemplateColumns: "2fr 2fr 1.2fr 0.7fr 0.9fr 0.8fr" }}>
              {["Nome", "E-mail", "Telefone", "Visitas", "Cliente há", "Status"].map(h => (
                <div key={h} className="py-2 text-[9px] font-medium uppercase tracking-wider text-muted-foreground">{h}</div>
              ))}
            </div>
            {/* rows */}
            {CLIENT_ROWS.map((r, i) => (
              <div
                key={r.name}
                className={`grid items-center px-5 border-b border-border/60 hover:bg-muted/20 cursor-pointer transition-colors ${i === 0 ? "bg-primary/[0.03]" : ""}`}
                style={{ gridTemplateColumns: "2fr 2fr 1.2fr 0.7fr 0.9fr 0.8fr" }}
              >
                <div className="py-2 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center text-[9px] font-medium text-primary flex-shrink-0">
                    {r.name.split(" ").map(w => w[0]).join("").slice(0, 2)}
                  </div>
                  <span className="text-[11px] font-medium text-foreground truncate">{r.name}</span>
                </div>
                <div className="py-2 text-[10px] text-muted-foreground truncate">{r.email}</div>
                <div className="py-2 text-[10px] text-muted-foreground">{r.phone}</div>
                <div className="py-2 text-[10px] text-foreground font-medium">{r.visits}</div>
                <div className="py-2 text-[10px] text-muted-foreground">{r.since}</div>
                <div className="py-2">
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${r.tagColor}`}>{r.tag}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-5 py-2 border-t border-border">
            <span className="text-[10px] text-muted-foreground">Mostrando 1–20 de 312</span>
            <div className="flex items-center gap-1">
              <button className="w-6 h-6 rounded border border-border flex items-center justify-center text-muted-foreground"><ChevronLeft size={11} /></button>
              {[1,2,3].map(n => (
                <button key={n} className={`w-6 h-6 rounded text-[10px] ${n === 1 ? "bg-primary text-white" : "border border-border text-muted-foreground"}`}>{n}</button>
              ))}
              <button className="w-6 h-6 rounded border border-border flex items-center justify-center text-muted-foreground"><ChevronRight size={11} /></button>
            </div>
          </div>
        </div>
      </div>
    </MockWindow>
  );
}

/* ─── 2. FATURAMENTO ── real layout: KPIs + table ────────────────── */
const FAT_ROWS = [
  { client: "Camila Ferreira", proc: "Limpeza de Pele", specialist: "Bianca S.", date: "09/06", value: "R$ 180", pay: "Cartão", status: "Pago", sc: "bg-emerald-50 text-emerald-700" },
  { client: "Renata Batista", proc: "Botox Preventivo", specialist: "Dra. Ana", date: "09/06", value: "R$ 650", pay: "Pix", status: "Pago", sc: "bg-emerald-50 text-emerald-700" },
  { client: "Patricia Lima", proc: "Massagem Relaxante", specialist: "Bianca S.", date: "08/06", value: "R$ 120", pay: "Dinheiro", status: "Pago", sc: "bg-emerald-50 text-emerald-700" },
  { client: "Juliana Martins", proc: "Design de Sobrancelha", specialist: "Bianca S.", date: "08/06", value: "R$ 90", pay: "Cartão", status: "Pendente", sc: "bg-amber-50 text-amber-700" },
  { client: "Andrea Costa", proc: "Peeling Químico", specialist: "Dra. Ana", date: "07/06", value: "R$ 350", pay: "Pix", status: "Pago", sc: "bg-emerald-50 text-emerald-700" },
  { client: "Fernanda Rocha", proc: "Tratamento Facial", specialist: "Dr. Felipe", date: "07/06", value: "R$ 320", pay: "Cartão", status: "Pago", sc: "bg-emerald-50 text-emerald-700" },
];

/* mini SVG area sparkline */
function AreaSparkline() {
  const pts = [38, 52, 44, 68, 58, 80, 70, 88, 76, 96];
  const h = 52; const w = 260;
  const step = w / (pts.length - 1);
  const max = Math.max(...pts);
  const coords = pts.map((v, i) => [i * step, h - (v / max) * (h - 4)]);
  const line = coords.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${line} L${w},${h} L0,${h} Z`;
  const PRIMARY = "hsl(10 75% 65%)";
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height: 52 }} preserveAspectRatio="none">
      <defs>
        <linearGradient id="fat-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={PRIMARY} stopOpacity="0.15" />
          <stop offset="100%" stopColor={PRIMARY} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.3, 0.6, 1].map(f => (
        <line key={f} x1="0" y1={h * f} x2={w} y2={h * f} stroke="hsl(var(--border))" strokeWidth="0.5" strokeOpacity="0.6" />
      ))}
      <path d={area} fill="url(#fat-grad)" />
      <path d={line} fill="none" stroke={PRIMARY} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

function MockFaturamento() {
  return (
    <MockWindow>
      <div className="flex h-[520px]">
        <Sidebar active={4} />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-primary/10 flex-shrink-0">
                <DollarSign size={14} className="text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground leading-none">Faturamento</h3>
                <p className="text-[10px] text-muted-foreground mt-0.5">Visão financeira dos atendimentos realizados</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-[10px] border border-border px-2.5 py-1.5 rounded-lg text-muted-foreground">Junho 2026</div>
              <div className="text-[10px] border border-border px-2.5 py-1.5 rounded-lg text-muted-foreground">Exportar</div>
            </div>
          </div>

          {/* KPI strip */}
          <div className="grid grid-cols-4 border-b border-border">
            {[
              { label: "Faturamento", val: "R$ 18.420", delta: "+23%", up: true },
              { label: "Recebido", val: "R$ 16.750", delta: "+18%", up: true },
              { label: "Pendente", val: "R$ 1.670", delta: "4 cobranças", up: null },
              { label: "Ticket médio", val: "R$ 214", delta: "+7%", up: true },
            ].map((k) => (
              <div key={k.label} className="px-4 py-3 border-r border-border last:border-r-0">
                <p className="text-[9px] text-muted-foreground uppercase tracking-wider mb-0.5">{k.label}</p>
                <div className="text-base font-light text-foreground leading-none">{k.val}</div>
                <div className={`flex items-center gap-0.5 mt-1 text-[9px] font-medium ${k.up === true ? "text-emerald-600" : k.up === false ? "text-rose-500" : "text-muted-foreground"}`}>
                  {k.up === true && <ArrowUpRight size={9} />}
                  {k.up === false && <ArrowDownRight size={9} />}
                  {k.delta}
                </div>
              </div>
            ))}
          </div>

          {/* Chart */}
          <div className="px-5 pt-3 pb-1 border-b border-border">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Faturamento no período</p>
              <p className="text-[9px] text-muted-foreground">01/06 — 09/06</p>
            </div>
            <AreaSparkline />
          </div>

          {/* Table */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="grid border-b border-border bg-muted/30 px-5" style={{ gridTemplateColumns: "1.8fr 1.6fr 1fr 0.7fr 0.8fr 0.8fr 0.75fr" }}>
              {["Paciente", "Procedimento", "Especialista", "Data", "Valor", "Pagamento", "Status"].map(h => (
                <div key={h} className="py-1.5 text-[9px] font-medium uppercase tracking-wider text-muted-foreground">{h}</div>
              ))}
            </div>
            <div className="flex-1 overflow-hidden">
              {FAT_ROWS.map((r, i) => (
                <div
                  key={i}
                  className="grid items-center px-5 border-b border-border/60 hover:bg-muted/20 cursor-pointer transition-colors"
                  style={{ gridTemplateColumns: "1.8fr 1.6fr 1fr 0.7fr 0.8fr 0.8fr 0.75fr" }}
                >
                  <div className="py-1.5 flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-full bg-primary/15 flex items-center justify-center text-[8px] font-medium text-primary flex-shrink-0">
                      {r.client.split(" ").map(w => w[0]).join("").slice(0,2)}
                    </div>
                    <span className="text-[10px] font-medium text-foreground truncate">{r.client}</span>
                  </div>
                  <div className="py-1.5 text-[10px] text-muted-foreground truncate">{r.proc}</div>
                  <div className="py-1.5 text-[10px] text-muted-foreground truncate">{r.specialist}</div>
                  <div className="py-1.5 text-[10px] text-muted-foreground">{r.date}</div>
                  <div className="py-1.5 text-[10px] font-medium text-foreground">{r.value}</div>
                  <div className="py-1.5 text-[10px] text-muted-foreground">{r.pay}</div>
                  <div className="py-1.5">
                    <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-medium ${r.sc}`}>{r.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </MockWindow>
  );
}

/* ─── 3. MARKETING ── real layout: list of campaigns ─────────────── */
function MockMarketing() {
  return (
    <MockWindow>
      <div className="flex h-[520px]">
        <Sidebar active={7} />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-primary/10 flex-shrink-0">
                <Megaphone size={14} className="text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground leading-none">Marketing Automatizado</h3>
                <p className="text-[10px] text-muted-foreground mt-0.5">4 campanhas ativas</p>
              </div>
            </div>
            <button className="flex items-center gap-1.5 text-[11px] bg-primary text-white px-3 py-1.5 rounded-lg font-medium">
              <Plus size={11} />Nova campanha
            </button>
          </div>

          {/* stats row */}
          <div className="grid grid-cols-4 border-b border-border">
            {[
              { label: "Mensagens enviadas", val: "1.240" },
              { label: "Taxa de abertura", val: "68%" },
              { label: "Clientes reativados", val: "47" },
              { label: "Avaliações Google", val: "4.8 ★" },
            ].map((s) => (
              <div key={s.label} className="px-4 py-3 border-r border-border last:border-r-0 text-center">
                <div className="text-base font-light text-foreground">{s.val}</div>
                <p className="text-[9px] text-muted-foreground mt-0.5 leading-tight">{s.label}</p>
              </div>
            ))}
          </div>

          {/* campaign list */}
          <div className="flex-1 overflow-hidden px-5 py-3 space-y-2">
            {[
              { name: "Reativação 90 dias", desc: "Clientes sem visita há 90+ dias", status: "Ativo", sent: "312 enviados", rate: "72% abertura", channel: "WhatsApp", active: true },
              { name: "Lembrete de retorno", desc: "30 dias após último procedimento", status: "Ativo", sent: "548 enviados", rate: "81% abertura", channel: "WhatsApp", active: true },
              { name: "Aniversariantes do mês", desc: "Desconto especial no aniversário", status: "Ativo", sent: "89 enviados", rate: "91% abertura", channel: "E-mail + WhatsApp", active: true },
              { name: "Avaliação pós-atendimento", desc: "Solicita avaliação no Google 2h após visita", status: "Rascunho", sent: "—", rate: "—", channel: "WhatsApp", active: false },
            ].map((c, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-white hover:shadow-sm transition-all cursor-pointer">
                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Send size={13} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-medium text-foreground">{c.name}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full border font-medium ${c.active ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-muted text-muted-foreground border-border"}`}>
                      {c.status}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{c.desc}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-[10px] font-medium text-foreground">{c.sent}</div>
                  <div className="text-[9px] text-muted-foreground">{c.rate}</div>
                </div>
                <div className="text-[9px] text-muted-foreground border-l border-border pl-3 flex-shrink-0">{c.channel}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </MockWindow>
  );
}

/* ─── 4. RELATÓRIOS ── real layout: KPI cards + chart + table ─────── */
function MockRelatorios() {
  const pts = [22, 35, 28, 55, 42, 68, 58, 72, 65, 80, 70, 88];
  const h = 60; const w = 380;
  const step = w / (pts.length - 1);
  const max = Math.max(...pts);
  const coords = pts.map((v, i) => [i * step, h - (v / max) * (h - 4)]);
  const line = coords.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${line} L${w},${h} L0,${h} Z`;

  return (
    <MockWindow>
      <div className="flex h-[520px]">
        <Sidebar active={10} />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-primary/10 flex-shrink-0">
                <BarChart3 size={14} className="text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground leading-none">Relatórios</h3>
                <p className="text-[10px] text-muted-foreground mt-0.5">Visão gerencial da clínica</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-[10px] border border-border px-2.5 py-1.5 rounded-lg text-muted-foreground">Últimos 30 dias</div>
            </div>
          </div>

          <div className="flex-1 overflow-hidden px-5 py-3 space-y-3">
            {/* KPI row 1 */}
            <div className="grid grid-cols-4 gap-2.5">
              {[
                { label: "Faturamento total", val: "R$ 18.420", color: "text-emerald-700", icon: DollarSign, iconBg: "bg-emerald-50" },
                { label: "Atendimentos", val: "86", color: "text-primary", icon: Calendar, iconBg: "bg-primary/10" },
                { label: "Clientes ativos", val: "312", color: "text-blue-700", icon: Users, iconBg: "bg-blue-50" },
                { label: "Ticket médio", val: "R$ 214", color: "text-violet-700", icon: TrendingUp, iconBg: "bg-violet-50" },
              ].map((k) => (
                <div key={k.label} className="rounded-xl border border-border bg-white p-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[9px] text-muted-foreground uppercase tracking-wider leading-tight">{k.label}</p>
                    <div className={`w-5 h-5 rounded-lg flex items-center justify-center ${k.iconBg}`}>
                      <k.icon size={10} className={k.color} />
                    </div>
                  </div>
                  <div className={`text-lg font-semibold ${k.color} leading-none`}>{k.val}</div>
                </div>
              ))}
            </div>

            {/* Chart */}
            <div className="rounded-xl border border-border bg-white p-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Faturamento no período</p>
                <p className="text-[9px] text-muted-foreground">10/05 — 09/06</p>
              </div>
              <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height: 60 }} preserveAspectRatio="none">
                <defs>
                  <linearGradient id="rel-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(30 12% 65%)" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="hsl(30 12% 65%)" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {[0.33, 0.66, 1].map(f => (
                  <line key={f} x1="0" y1={h * f} x2={w} y2={h * f} stroke="hsl(var(--border))" strokeWidth="0.5" strokeOpacity="0.6" />
                ))}
                <path d={area} fill="url(#rel-grad)" />
                <path d={line} fill="none" stroke="hsl(30 12% 65%)" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
              </svg>
            </div>

            {/* Last visits table */}
            <div className="rounded-xl border border-border bg-white overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2 border-b border-border">
                <Clock size={11} className="text-muted-foreground" />
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Últimas visitas</p>
              </div>
              <div className="grid border-b border-border bg-muted/30 px-4" style={{ gridTemplateColumns: "2fr 1.5fr 1fr 1fr" }}>
                {["Cliente", "Especialista", "Última Visita", "Valor"].map(h => (
                  <div key={h} className="py-1.5 text-[9px] font-medium uppercase tracking-wider text-muted-foreground">{h}</div>
                ))}
              </div>
              {[
                { client: "Camila Ferreira", specialist: "Bianca S.", date: "09/06/2026", val: "R$ 180" },
                { client: "Renata Batista", specialist: "Dra. Ana", date: "09/06/2026", val: "R$ 650" },
                { client: "Fernanda Rocha", specialist: "Dr. Felipe", date: "07/06/2026", val: "R$ 320" },
                { client: "Andrea Costa", specialist: "Dra. Ana", date: "07/06/2026", val: "R$ 350" },
              ].map((r, i) => (
                <div key={i} className="grid items-center px-4 border-b border-border/50 last:border-b-0 hover:bg-muted/20 cursor-pointer" style={{ gridTemplateColumns: "2fr 1.5fr 1fr 1fr" }}>
                  <div className="py-1.5 text-[10px] font-medium text-foreground">{r.client}</div>
                  <div className="py-1.5 text-[10px] text-muted-foreground">{r.specialist}</div>
                  <div className="py-1.5 text-[10px] text-muted-foreground">{r.date}</div>
                  <div className="py-1.5 text-[10px] font-medium text-foreground text-right">{r.val}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </MockWindow>
  );
}

/* ─── 5. AGENDAMENTO ONLINE ── real layout: public booking page ──── */
const BOOKING_SERVICES = [
  { name: "Botox Preventivo",        dur: "45min", price: "650,00 R$" },
  { name: "Design de Sobrancelha",   dur: "30min", price:  "90,00 R$" },
  { name: "Limpeza de Pele",         dur: "1h",    price: "180,00 R$" },
  { name: "Massagem Relaxante",      dur: "1h",    price: "120,00 R$" },
  { name: "Microagulhamento",        dur: "1h15",  price: "380,00 R$" },
];

function MockAgendamentoOnline() {
  return (
    <MockWindow>
      <div className="h-[520px] flex flex-col overflow-hidden" style={{ background: "hsl(30 20% 96%)" }}>

        {/* ── Salmon header ── */}
        <div className="flex-shrink-0 bg-primary/80 flex items-center justify-center py-6" style={{ background: "hsl(10 68% 72%)" }}>
          <img src={logoColor} alt="bellex" className="h-7 object-contain brightness-0 invert drop-shadow" />
        </div>

        {/* ── Card ── */}
        <div className="flex-1 flex items-start justify-center px-8 py-5 overflow-hidden">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm overflow-hidden border border-border/40">

            {/* Card header */}
            <div className="px-5 py-3 border-b border-border/60 text-center">
              <p className="text-[11px] font-semibold tracking-widest text-foreground uppercase">AGENDAR</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Escolha um serviço</p>
            </div>

            {/* Accordion — expanded */}
            <div className="border-b border-border/60">
              <div className="flex items-center justify-between px-4 py-2.5 bg-muted/20">
                <div className="flex items-center gap-1.5">
                  <Sparkles size={11} className="text-primary" />
                  <span className="text-[11px] font-medium text-foreground">Estética e Beleza</span>
                  <span className="text-[10px] text-muted-foreground ml-0.5">(8)</span>
                </div>
                <ChevronRight size={12} className="text-muted-foreground rotate-90" />
              </div>

              {BOOKING_SERVICES.map((s, i) => (
                <div key={s.name} className={`flex items-center justify-between px-4 py-2.5 border-t border-border/40 ${i === 0 ? "bg-primary/5" : ""}`}>
                  <div>
                    <p className={`text-[11px] font-medium ${i === 0 ? "text-primary" : "text-foreground"}`}>{s.name}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Clock size={8} className="text-muted-foreground" />
                      <span className="text-[9px] text-muted-foreground">{s.dur}</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-muted-foreground">{s.price}</span>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="px-4 py-2 text-center">
              <span className="text-[9px] text-muted-foreground">Powered by Clínica</span>
            </div>
          </div>
        </div>

      </div>
    </MockWindow>
  );
}

/* ─── TABS ───────────────────────────────────────────────────────── */
const tabs = [
  { icon: Calendar, label: "Agenda Inteligente", mock: <MockAgenda /> },
  { icon: Users, label: "Gestão de Clientes", mock: <MockClientes /> },
  { icon: DollarSign, label: "Cobranças & Faturamento", mock: <MockFaturamento /> },
  { icon: Megaphone, label: "Marketing Automatizado", mock: <MockMarketing /> },
  { icon: BarChart3, label: "Relatórios Gerenciais", mock: <MockRelatorios /> },
  { icon: Globe, label: "Agendamento Online", mock: <MockAgendamentoOnline /> },
];

export function FeatureMockupTabs() {
  const [active, setActive] = useState(0);
  const [direction, setDirection] = useState(1);
  const [paused, setPaused] = useState(false);

  function go(idx: number) {
    setDirection(idx > active ? 1 : -1);
    setActive(idx);
  }

  // Auto-advance every 2s, pause on hover
  const activeRef = React.useRef(active);
  activeRef.current = active;

  React.useEffect(() => {
    if (paused) return;
    const id = setInterval(() => {
      const next = (activeRef.current + 1) % tabs.length;
      setDirection(1);
      setActive(next);
    }, 2000);
    return () => clearInterval(id);
  }, [paused]);

  return (
    <div
      className="space-y-4"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Tab bar — icon only when inactive, label on active */}
      <div className="flex items-center gap-1 p-1 rounded-2xl border border-border/60 bg-muted/40 backdrop-blur-sm">
        {tabs.map((t, i) => {
          const isActive = i === active;
          return (
            <button
              key={t.label}
              onClick={() => { setPaused(true); go(i); }}
              className={`relative flex items-center gap-2 rounded-xl font-medium transition-all focus-visible:outline-none ${
                isActive ? "px-4 py-2.5 flex-shrink-0" : "px-3 py-2.5 flex-1 justify-center"
              }`}
              title={!isActive ? t.label : undefined}
            >
              {isActive && (
                <motion.span
                  layoutId="tab-bg"
                  className="absolute inset-0 rounded-xl bg-white shadow-sm border border-border/60"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <t.icon size={14} className={`relative z-10 transition-colors flex-shrink-0 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
              {isActive && (
                <span className="relative z-10 text-sm text-foreground whitespace-nowrap">{t.label}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Progress bar */}
      <div className="h-0.5 rounded-full bg-border/40 overflow-hidden -mt-2">
        {!paused && (
          <motion.div
            key={active}
            className="h-full bg-primary/40 rounded-full"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 2, ease: "linear" }}
          />
        )}
      </div>

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
