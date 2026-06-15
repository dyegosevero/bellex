import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import {
  Wallet, Plus, TrendingUp, TrendingDown, Minus, Download, RefreshCw,
  ArrowUpCircle, ArrowDownCircle, BarChart3, Loader2, Search,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

const fmtCurrency = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const fmtDate = (d: string) =>
  new Date(d + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });

const CATEGORIAS_ENTRADA = ["Serviços", "Produtos", "Outros"];
const CATEGORIAS_SAIDA = ["Aluguel", "Salários", "Insumos", "Marketing", "Equipamentos", "Impostos", "Outros"];
const FORMAS = ["dinheiro", "pix", "cartao_credito", "cartao_debito", "transferencia", "boleto"];
const FORMA_LABEL: Record<string, string> = {
  dinheiro: "Dinheiro", pix: "PIX", cartao_credito: "Cartão Crédito",
  cartao_debito: "Cartão Débito", transferencia: "Transferência", boleto: "Boleto",
};

type Lancamento = {
  id: string; tipo: "entrada" | "saida"; valor: number; descricao: string;
  categoria: string | null; forma_pagamento: string | null; data: string;
  charge_id: string | null; created_at: string;
};

function currentMonth() {
  const now = new Date();
  return { from: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`, to: now.toISOString().slice(0, 10) };
}

export default function CaixaFinanceiro() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [tab, setTab] = useState("visao");
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filterTipo, setFilterTipo] = useState("all");
  const [dateFrom, setDateFrom] = useState(currentMonth().from);
  const [dateTo, setDateTo] = useState(currentMonth().to);
  const [importingCharges, setImportingCharges] = useState(false);

  // Form state
  const [fTipo, setFTipo] = useState<"entrada" | "saida">("entrada");
  const [fValor, setFValor] = useState("");
  const [fDescricao, setFDescricao] = useState("");
  const [fCategoria, setFCategoria] = useState("");
  const [fForma, setFForma] = useState("");
  const [fData, setFData] = useState(new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);

  const { data: lancamentos = [], isLoading } = useQuery<Lancamento[]>({
    queryKey: ["lancamentos", dateFrom, dateTo],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lancamentos")
        .select("*")
        .gte("data", dateFrom)
        .lte("data", dateTo)
        .order("data", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Lancamento[];
    },
    enabled: !!user,
  });

  // FIN-06: charges por serviço
  const { data: chargesByService = [] } = useQuery({
    queryKey: ["fin-por-servico", dateFrom, dateTo],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("charge_items")
        .select("description, unit_price, quantity, charges!inner(status, paid_at)")
        .gte("charges.paid_at", dateFrom)
        .lte("charges.paid_at", dateTo + "T23:59:59")
        .eq("charges.status", "pago");
      if (error) return [];
      const map: Record<string, number> = {};
      (data ?? []).forEach((item: any) => {
        const key = item.description;
        map[key] = (map[key] ?? 0) + (item.unit_price * item.quantity);
      });
      return Object.entries(map)
        .map(([name, total]) => ({ name, total }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 10);
    },
    enabled: !!user,
  });

  const stats = useMemo(() => {
    const entradas = lancamentos.filter(l => l.tipo === "entrada").reduce((s, l) => s + l.valor, 0);
    const saidas = lancamentos.filter(l => l.tipo === "saida").reduce((s, l) => s + l.valor, 0);
    return { entradas, saidas, lucro: entradas - saidas };
  }, [lancamentos]);

  const filtered = useMemo(() =>
    lancamentos.filter(l => {
      if (filterTipo !== "all" && l.tipo !== filterTipo) return false;
      if (search && !l.descricao.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    }), [lancamentos, filterTipo, search]);

  const createMutation = useMutation({
    mutationFn: async (payload: Omit<Lancamento, "id" | "created_at" | "charge_id"> & { charge_id?: null }) => {
      const { error } = await supabase.from("lancamentos").insert({ ...payload, created_by: user!.id });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["lancamentos"] }); toast({ title: "Lançamento salvo." }); },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const handleSave = async () => {
    if (!fValor || !fDescricao) { toast({ title: "Preencha valor e descrição", variant: "destructive" }); return; }
    setSaving(true);
    try {
      await createMutation.mutateAsync({
        tipo: fTipo, valor: parseFloat(fValor.replace(",", ".")), descricao: fDescricao,
        categoria: fCategoria || null, forma_pagamento: fForma || null, data: fData,
        charge_id: null,
      });
      setOpen(false); setFValor(""); setFDescricao(""); setFCategoria(""); setFForma("");
    } finally { setSaving(false); }
  };

  // FIN-03: importar cobranças pagas como entradas
  const handleImportCharges = async () => {
    setImportingCharges(true);
    try {
      const { data: charges, error } = await supabase
        .from("charges")
        .select("id, amount, paid_at, clients(full_name)")
        .eq("status", "pago")
        .gte("paid_at", dateFrom)
        .lte("paid_at", dateTo + "T23:59:59")
        .not("id", "in", `(${lancamentos.filter(l => l.charge_id).map(l => `'${l.charge_id}'`).join(",") || "'00000000-0000-0000-0000-000000000000'"})`);

      if (error) throw error;
      if (!charges || charges.length === 0) {
        toast({ title: "Nenhuma cobrança nova para importar." });
        return;
      }

      const inserts = charges.map((c: any) => ({
        tipo: "entrada" as const,
        valor: c.amount,
        descricao: `Cobrança — ${c.clients?.full_name ?? "Cliente"}`,
        categoria: "Serviços",
        data: (c.paid_at as string).slice(0, 10),
        charge_id: c.id,
        created_by: user!.id,
      }));

      const { error: insErr } = await supabase.from("lancamentos").insert(inserts);
      if (insErr) throw insErr;
      qc.invalidateQueries({ queryKey: ["lancamentos"] });
      toast({ title: `${charges.length} cobrança(s) importada(s) como entradas.` });
    } catch (e: any) {
      toast({ title: "Erro na importação", description: e.message, variant: "destructive" });
    } finally { setImportingCharges(false); }
  };

  // FIN-07: Export CSV
  const handleExportCSV = () => {
    const rows = [
      ["Data", "Tipo", "Descrição", "Categoria", "Forma Pgto", "Valor"],
      ...filtered.map(l => [
        l.data, l.tipo, l.descricao, l.categoria ?? "", l.forma_pagamento ? FORMA_LABEL[l.forma_pagamento] ?? l.forma_pagamento : "",
        l.valor.toFixed(2).replace(".", ","),
      ]),
    ];
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(";")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `financeiro-${dateFrom}-${dateTo}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <PageHeader icon={<Wallet className="w-5 h-5" />} title="Caixa & Financeiro" subtitle="Lançamentos, entradas, saídas e relatórios do período" />

      {/* Period picker */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Label className="text-xs text-muted-foreground whitespace-nowrap">De</Label>
          <Input type="date" className="h-8 text-xs w-36" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
          <Label className="text-xs text-muted-foreground">até</Label>
          <Input type="date" className="h-8 text-xs w-36" value={dateTo} onChange={e => setDateTo(e.target.value)} />
        </div>
        <div className="flex-1" />
        <Button size="sm" variant="outline" onClick={handleImportCharges} disabled={importingCharges} className="gap-1.5 text-xs">
          {importingCharges ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          Importar cobranças pagas
        </Button>
        <Button size="sm" variant="outline" onClick={handleExportCSV} className="gap-1.5 text-xs">
          <Download className="w-3.5 h-3.5" /> Exportar CSV
        </Button>
        <Button size="sm" onClick={() => setOpen(true)} className="gap-1.5 text-xs">
          <Plus className="w-3.5 h-3.5" /> Novo lançamento
        </Button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-2xl border border-border/40 bg-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <ArrowUpCircle className="w-4 h-4 text-green-500" />
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Receita</span>
          </div>
          <p className="text-2xl font-bold text-green-600">{fmtCurrency(stats.entradas)}</p>
        </div>
        <div className="rounded-2xl border border-border/40 bg-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <ArrowDownCircle className="w-4 h-4 text-red-500" />
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Despesas</span>
          </div>
          <p className="text-2xl font-bold text-red-500">{fmtCurrency(stats.saidas)}</p>
        </div>
        <div className="rounded-2xl border border-border/40 bg-card p-5">
          <div className="flex items-center gap-2 mb-3">
            {stats.lucro >= 0
              ? <TrendingUp className="w-4 h-4 text-primary" />
              : <TrendingDown className="w-4 h-4 text-destructive" />}
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Lucro líquido</span>
          </div>
          <p className={`text-2xl font-bold ${stats.lucro >= 0 ? "text-primary" : "text-destructive"}`}>{fmtCurrency(stats.lucro)}</p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="h-9">
          <TabsTrigger value="visao" className="text-xs">Visão Geral</TabsTrigger>
          <TabsTrigger value="extrato" className="text-xs">Extrato</TabsTrigger>
          <TabsTrigger value="servicos" className="text-xs">Por Serviço</TabsTrigger>
        </TabsList>

        {/* FIN-04: Visão Geral */}
        <TabsContent value="visao" className="space-y-4 pt-4">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Entradas por categoria */}
            {["entrada", "saida"].map(tipo => {
              const items = lancamentos.filter(l => l.tipo === tipo && l.categoria);
              const byCateg: Record<string, number> = {};
              items.forEach(l => { byCateg[l.categoria!] = (byCateg[l.categoria!] ?? 0) + l.valor; });
              const entries = Object.entries(byCateg).sort((a, b) => b[1] - a[1]);
              const total = entries.reduce((s, [, v]) => s + v, 0);
              const isEntrada = tipo === "entrada";
              return (
                <div key={tipo} className="rounded-2xl border border-border/40 bg-card p-5 space-y-3">
                  <p className="text-sm font-medium flex items-center gap-2">
                    {isEntrada ? <ArrowUpCircle className="w-4 h-4 text-green-500" /> : <ArrowDownCircle className="w-4 h-4 text-red-500" />}
                    {isEntrada ? "Entradas por categoria" : "Saídas por categoria"}
                  </p>
                  {entries.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-4 text-center">Nenhum lançamento no período.</p>
                  ) : entries.map(([cat, val]) => (
                    <div key={cat} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">{cat}</span>
                        <span className="font-medium">{fmtCurrency(val)}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className={`h-full rounded-full ${isEntrada ? "bg-green-500" : "bg-red-400"}`} style={{ width: `${total > 0 ? (val / total) * 100 : 0}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </TabsContent>

        {/* FIN-05: Extrato */}
        <TabsContent value="extrato" className="space-y-3 pt-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input placeholder="Buscar lançamento..." className="pl-9 h-8 text-xs" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <Select value={filterTipo} onValueChange={setFilterTipo}>
              <SelectTrigger className="h-8 text-xs w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="entrada">Entradas</SelectItem>
                <SelectItem value="saida">Saídas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-2xl border border-border/40 bg-card overflow-hidden">
            {isLoading ? (
              <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Carregando extrato…</span>
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16 space-y-2">
                <Wallet className="w-8 h-8 text-muted-foreground/30 mx-auto" />
                <p className="text-sm text-muted-foreground">Nenhum lançamento no período.</p>
                <Button size="sm" onClick={() => setOpen(true)} className="mt-2 gap-1.5">
                  <Plus className="w-4 h-4" /> Criar lançamento
                </Button>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/40 bg-muted/30">
                    <th className="text-left p-4 text-xs font-medium text-muted-foreground">Data</th>
                    <th className="text-left p-4 text-xs font-medium text-muted-foreground">Descrição</th>
                    <th className="text-left p-4 text-xs font-medium text-muted-foreground hidden md:table-cell">Categoria</th>
                    <th className="text-left p-4 text-xs font-medium text-muted-foreground hidden sm:table-cell">Forma</th>
                    <th className="text-right p-4 text-xs font-medium text-muted-foreground">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((l, i) => (
                    <tr key={l.id} className={`border-b border-border/20 hover:bg-muted/20 transition-colors ${i % 2 ? "bg-muted/10" : ""}`}>
                      <td className="p-4 text-xs text-muted-foreground whitespace-nowrap">{fmtDate(l.data)}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {l.tipo === "entrada"
                            ? <ArrowUpCircle className="w-3.5 h-3.5 text-green-500 shrink-0" />
                            : <ArrowDownCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />}
                          <span className="text-sm">{l.descricao}</span>
                          {l.charge_id && <Badge variant="outline" className="text-[10px] px-1 py-0">auto</Badge>}
                        </div>
                      </td>
                      <td className="p-4 hidden md:table-cell">
                        {l.categoria && <span className="text-xs text-muted-foreground">{l.categoria}</span>}
                      </td>
                      <td className="p-4 hidden sm:table-cell">
                        {l.forma_pagamento && <span className="text-xs text-muted-foreground">{FORMA_LABEL[l.forma_pagamento] ?? l.forma_pagamento}</span>}
                      </td>
                      <td className="p-4 text-right">
                        <span className={`text-sm font-semibold ${l.tipo === "entrada" ? "text-green-600" : "text-red-500"}`}>
                          {l.tipo === "saida" ? "−" : "+"}{fmtCurrency(l.valor)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-border/40 bg-muted/20">
                    <td colSpan={4} className="p-4 text-xs font-medium text-muted-foreground">Saldo do período</td>
                    <td className="p-4 text-right">
                      <span className={`text-sm font-bold ${stats.lucro >= 0 ? "text-green-600" : "text-red-500"}`}>
                        {fmtCurrency(stats.lucro)}
                      </span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            )}
          </div>
        </TabsContent>

        {/* FIN-06: Por Serviço */}
        <TabsContent value="servicos" className="pt-4 space-y-4">
          <p className="text-xs text-muted-foreground">Receita por descrição de cobrança paga no período (baseado em cobranças marcadas como pagas).</p>
          {chargesByService.length === 0 ? (
            <div className="rounded-2xl border border-border/40 bg-card p-12 text-center">
              <BarChart3 className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Nenhuma cobrança paga no período.</p>
            </div>
          ) : (
            <div className="rounded-2xl border border-border/40 bg-card p-5 space-y-4">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={chargesByService} layout="vertical" margin={{ left: 8, right: 24 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={120} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(v: number) => [fmtCurrency(v), "Receita"]} />
                  <Bar dataKey="total" radius={[0, 4, 4, 0]}>
                    {chargesByService.map((_, i) => (
                      <Cell key={i} fill={`hsl(${221 + i * 20} 83% ${53 + i * 3}%)`} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <table className="w-full">
                <tbody>
                  {chargesByService.map((s, i) => (
                    <tr key={s.name} className="border-b border-border/20">
                      <td className="py-2 text-xs text-muted-foreground w-6">{i + 1}.</td>
                      <td className="py-2 text-sm">{s.name}</td>
                      <td className="py-2 text-sm font-semibold text-right text-green-600">{fmtCurrency(s.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Modal novo lançamento */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Novo lançamento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFTipo("entrada")}
                className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 text-sm font-medium transition-colors ${fTipo === "entrada" ? "border-green-500 bg-green-50 text-green-700" : "border-border text-muted-foreground"}`}
              >
                <ArrowUpCircle className="w-4 h-4" /> Entrada
              </button>
              <button
                type="button"
                onClick={() => setFTipo("saida")}
                className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 text-sm font-medium transition-colors ${fTipo === "saida" ? "border-red-500 bg-red-50 text-red-600" : "border-border text-muted-foreground"}`}
              >
                <Minus className="w-4 h-4" /> Saída
              </button>
            </div>

            <div className="space-y-1.5">
              <Label>Valor (R$) *</Label>
              <Input placeholder="0,00" value={fValor} onChange={e => setFValor(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Descrição *</Label>
              <Input placeholder="Ex: Pagamento sessão, Aluguel sala..." value={fDescricao} onChange={e => setFDescricao(e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Categoria</Label>
                <Select value={fCategoria} onValueChange={setFCategoria}>
                  <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                  <SelectContent>
                    {(fTipo === "entrada" ? CATEGORIAS_ENTRADA : CATEGORIAS_SAIDA).map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Forma de pagamento</Label>
                <Select value={fForma} onValueChange={setFForma}>
                  <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                  <SelectContent>
                    {FORMAS.map(f => <SelectItem key={f} value={f}>{FORMA_LABEL[f]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Data</Label>
              <Input type="date" value={fData} onChange={e => setFData(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
              Salvar lançamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
