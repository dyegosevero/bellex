import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  Plus,
  Trash2,
  Edit,
  Check,
  X,
  Clock,
  ChevronDown,
  MoreHorizontal,
  Filter,
  SlidersHorizontal,
  Eye,
  Download,
  Copy,
  Archive,
  AlertTriangle,
  Loader2,
  Mail,
  Phone,
  User,
} from "lucide-react";

const DEMO_TABLE_DATA = [
  { name: "Maria Silva", service: "Harmonização Facial", specialist: "Dra. Camila", date: "15/03/2026", value: "€ 2.500", status: "Confirmado" },
  { name: "Ana Costa", service: "Peeling Químico", specialist: "Dr. Rafael", date: "16/03/2026", value: "€ 800", status: "Pendente" },
  { name: "Carla Mendes", service: "Botox", specialist: "Dra. Camila", date: "17/03/2026", value: "€ 1.200", status: "Cancelado" },
  { name: "Juliana Rocha", service: "Preenchimento Labial", specialist: "Dra. Camila", date: "18/03/2026", value: "€ 1.800", status: "Confirmado" },
  { name: "Patricia Lima", service: "Limpeza de Pele", specialist: "Dr. Rafael", date: "19/03/2026", value: "€ 350", status: "Em andamento" },
];

export const DSComponents = () => {
  const [searchValue, setSearchValue] = useState("");
  const [tableFilter, setTableFilter] = useState("all");
  const [tableSearch, setTableSearch] = useState("");
  const [checkboxValues, setCheckboxValues] = useState({ terms: false, newsletter: true, notifications: true });
  const [switchValues, setSwitchValues] = useState({ darkMode: false, notifications: true, emails: false });

  const filteredData = DEMO_TABLE_DATA.filter((row) => {
    const matchesSearch = !tableSearch || row.name.toLowerCase().includes(tableSearch.toLowerCase()) || row.service.toLowerCase().includes(tableSearch.toLowerCase());
    const matchesFilter = tableFilter === "all" || row.status.toLowerCase().replace(" ", "_") === tableFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <section className="ds-section border-t border-border">
      <span className="text-xs text-primary tracking-widest uppercase font-medium">05</span>
      <h2 className="ds-section-title mt-2">Componentes Base</h2>
      <p className="ds-section-subtitle">Biblioteca de componentes com variantes, estados e exemplos de uso.</p>

      {/* Buttons */}
      <h3 className="font-heading text-xl font-medium mb-6">Botões</h3>
      <div className="ds-card mb-8">
        <div className="space-y-6">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Variantes</p>
            <div className="flex flex-wrap gap-3">
              <Button>Primário</Button>
              <Button variant="secondary">Secundário</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="destructive">Destrutivo</Button>
              <Button variant="link">Link</Button>
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Tamanhos</p>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="sm">Pequeno</Button>
              <Button size="default">Padrão</Button>
              <Button size="lg">Grande</Button>
              <Button size="icon"><Plus className="h-4 w-4" /></Button>
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Estados</p>
            <div className="flex flex-wrap items-center gap-3">
              <Button>Normal</Button>
              <Button disabled>Desabilitado</Button>
              <Button disabled><Loader2 className="mr-2 h-4 w-4 animate-spin" />Carregando</Button>
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Com Ícones</p>
            <div className="flex flex-wrap items-center gap-3">
              <Button><Plus className="mr-2 h-4 w-4" />Novo Paciente</Button>
              <Button variant="outline"><Edit className="mr-2 h-4 w-4" />Editar</Button>
              <Button variant="destructive"><Trash2 className="mr-2 h-4 w-4" />Excluir</Button>
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Nested / Button Group</p>
            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex rounded-md border border-border overflow-hidden">
                <Button variant="ghost" size="sm" className="rounded-none border-r border-border">Dia</Button>
                <Button variant="secondary" size="sm" className="rounded-none border-r border-border">Semana</Button>
                <Button variant="ghost" size="sm" className="rounded-none">Mês</Button>
              </div>
              <div className="inline-flex rounded-md border border-border overflow-hidden">
                <Button variant="ghost" size="sm" className="rounded-none border-r border-border">
                  <Eye className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="sm" className="rounded-none border-r border-border">
                  <Edit className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="sm" className="rounded-none">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Inputs & Input Groups */}
      <h3 className="font-heading text-xl font-medium mb-6">Inputs & Grupos</h3>
      <div className="ds-card mb-8">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>Nome Completo</Label>
            <Input placeholder="Maria da Silva Santos" />
          </div>
          <div className="space-y-2">
            <Label>E-mail</Label>
            <Input type="email" placeholder="maria@email.com" />
          </div>
          <div className="space-y-2">
            <Label>Busca com ícone (Input Group)</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar pacientes..." className="pl-10" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Input com botão (Input Group)</Label>
            <div className="flex">
              <Input placeholder="Código de referência" className="rounded-r-none" />
              <Button className="rounded-l-none">Aplicar</Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Input com prefixo</Label>
            <div className="flex">
              <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-sm text-muted-foreground">
                €
              </span>
              <Input placeholder="0,00" className="rounded-l-none" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Input com sufixo e ícone</Label>
            <div className="flex">
              <div className="relative flex-1">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="(11) 99999-0000" className="pl-10 rounded-r-none" />
              </div>
              <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-input bg-muted text-xs text-muted-foreground">
                WhatsApp
              </span>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-destructive">Campo com Erro</Label>
            <Input className="border-destructive focus-visible:ring-destructive" value="email-invalido" readOnly />
            <p className="text-xs text-destructive">E-mail inválido. Insira um endereço válido.</p>
          </div>
          <div className="space-y-2">
            <Label>Campo Desabilitado</Label>
            <Input disabled value="Valor fixo" />
          </div>
        </div>
        <div className="mt-6 space-y-2">
          <Label>Observações (Textarea)</Label>
          <Textarea placeholder="Anotações sobre o paciente..." rows={3} />
        </div>
      </div>

      {/* Checkbox, Switch, Form Elements */}
      <h3 className="font-heading text-xl font-medium mb-6">Checkbox, Switch & Formulário</h3>
      <div className="ds-card mb-8">
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-4">Checkboxes</p>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="terms"
                  checked={checkboxValues.terms}
                  onCheckedChange={(v) => setCheckboxValues((p) => ({ ...p, terms: !!v }))}
                />
                <div>
                  <Label htmlFor="terms" className="cursor-pointer">Aceito os termos de consentimento</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">Leia os termos antes de prosseguir.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Checkbox
                  id="newsletter"
                  checked={checkboxValues.newsletter}
                  onCheckedChange={(v) => setCheckboxValues((p) => ({ ...p, newsletter: !!v }))}
                />
                <div>
                  <Label htmlFor="newsletter" className="cursor-pointer">Receber novidades por e-mail</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">Promoções e lembretes de retorno.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Checkbox id="disabled" disabled />
                <Label htmlFor="disabled" className="text-muted-foreground">Opção desabilitada</Label>
              </div>
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-4">Switches</p>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="darkMode">Modo escuro</Label>
                  <p className="text-xs text-muted-foreground">Alterar tema da interface.</p>
                </div>
                <Switch
                  id="darkMode"
                  checked={switchValues.darkMode}
                  onCheckedChange={(v) => setSwitchValues((p) => ({ ...p, darkMode: v }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="notif">Notificações push</Label>
                  <p className="text-xs text-muted-foreground">Lembretes de agendamento.</p>
                </div>
                <Switch
                  id="notif"
                  checked={switchValues.notifications}
                  onCheckedChange={(v) => setSwitchValues((p) => ({ ...p, notifications: v }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="emails">E-mails automáticos</Label>
                  <p className="text-xs text-muted-foreground">Confirmação de agendamento.</p>
                </div>
                <Switch
                  id="emails"
                  checked={switchValues.emails}
                  onCheckedChange={(v) => setSwitchValues((p) => ({ ...p, emails: v }))}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Select & Searchable Select */}
      <h3 className="font-heading text-xl font-medium mb-6">Seletores</h3>
      <div className="ds-card mb-8">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>Select padrão</Label>
            <Select>
              <SelectTrigger><SelectValue placeholder="Selecione o serviço..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="harmonizacao">Harmonização Facial</SelectItem>
                <SelectItem value="peeling">Peeling Químico</SelectItem>
                <SelectItem value="botox">Botox</SelectItem>
                <SelectItem value="preenchimento">Preenchimento Labial</SelectItem>
                <SelectItem value="limpeza">Limpeza de Pele</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Select com busca (Search + Filter)</Label>
            <SearchableSelectDemo />
          </div>
          <div className="space-y-2">
            <Label>Select desabilitado</Label>
            <Select disabled>
              <SelectTrigger><SelectValue placeholder="Indisponível" /></SelectTrigger>
              <SelectContent><SelectItem value="x">—</SelectItem></SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Multi-filtro (chips)</Label>
            <div className="flex flex-wrap gap-2">
              {["Harmonização", "Botox", "Peeling"].map((tag) => (
                <Badge key={tag} variant="secondary" className="cursor-pointer gap-1 hover:bg-destructive/10 hover:text-destructive transition-colors">
                  {tag}
                  <X className="h-3 w-3" />
                </Badge>
              ))}
              <Button variant="ghost" size="sm" className="h-6 text-xs text-muted-foreground">
                <Plus className="h-3 w-3 mr-1" /> Filtro
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Dropdown Menu */}
      <h3 className="font-heading text-xl font-medium mb-6">Dropdown Menu</h3>
      <div className="ds-card mb-8">
        <div className="flex flex-wrap gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                Ações <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuLabel>Ações do paciente</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem><Eye className="mr-2 h-4 w-4" /> Ver detalhes</DropdownMenuItem>
              <DropdownMenuItem><Edit className="mr-2 h-4 w-4" /> Editar</DropdownMenuItem>
              <DropdownMenuItem><Copy className="mr-2 h-4 w-4" /> Duplicar</DropdownMenuItem>
              <DropdownMenuItem><Download className="mr-2 h-4 w-4" /> Exportar PDF</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem><Archive className="mr-2 h-4 w-4" /> Arquivar</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive focus:text-destructive">
                <Trash2 className="mr-2 h-4 w-4" /> Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem><Mail className="mr-2 h-4 w-4" /> Enviar e-mail</DropdownMenuItem>
              <DropdownMenuItem><Phone className="mr-2 h-4 w-4" /> WhatsApp</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem><Download className="mr-2 h-4 w-4" /> Baixar ficha</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-3.5 w-3.5" /> Filtrar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-44">
              <DropdownMenuLabel>Status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem><Check className="mr-2 h-4 w-4 text-success" /> Confirmado</DropdownMenuItem>
              <DropdownMenuItem><Clock className="mr-2 h-4 w-4 text-warning" /> Pendente</DropdownMenuItem>
              <DropdownMenuItem><X className="mr-2 h-4 w-4 text-destructive" /> Cancelado</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <p className="text-xs text-muted-foreground mt-4">
          Dropdown com separadores, ícones e variante destrutiva. Animação: <code className="ds-code">animate-enter</code> (fade-in + scale-in 0.2s).
        </p>
      </div>

      {/* Table with search & filter */}
      <h3 className="font-heading text-xl font-medium mb-6">Tabela com Busca & Filtros</h3>
      <div className="ds-card mb-8 p-0 overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center justify-between gap-3 p-4 border-b border-border">
          <div className="flex items-center gap-3 flex-1">
            <div className="relative max-w-xs flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou serviço..."
                className="pl-10 h-9"
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
              />
            </div>
            <Select value={tableFilter} onValueChange={setTableFilter}>
              <SelectTrigger className="w-40 h-9">
                <Filter className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="confirmado">Confirmado</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="em_atendimento">Em atendimento</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-9">
              <Download className="mr-2 h-3.5 w-3.5" /> Exportar
            </Button>
            <Button size="sm" className="h-9">
              <Plus className="mr-2 h-3.5 w-3.5" /> Novo
            </Button>
          </div>
        </div>

        {/* Table */}
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="text-xs uppercase tracking-wider">Paciente</TableHead>
              <TableHead className="text-xs uppercase tracking-wider">Serviço</TableHead>
              <TableHead className="text-xs uppercase tracking-wider">Especialista</TableHead>
              <TableHead className="text-xs uppercase tracking-wider">Data</TableHead>
              <TableHead className="text-xs uppercase tracking-wider text-right">Valor</TableHead>
              <TableHead className="text-xs uppercase tracking-wider">Status</TableHead>
              <TableHead className="text-xs uppercase tracking-wider w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length > 0 ? (
              filteredData.map((row, i) => (
                <TableRow key={i} className="cursor-pointer hover:bg-muted/30 transition-colors">
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <User className="h-3.5 w-3.5 text-primary" />
                      </div>
                      {row.name}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{row.service}</TableCell>
                  <TableCell className="text-muted-foreground">{row.specialist}</TableCell>
                  <TableCell className="text-muted-foreground">{row.date}</TableCell>
                  <TableCell className="text-right font-medium">{row.value}</TableCell>
                  <TableCell>
                    <span className={`ds-badge text-[10px] ${
                      row.status === "Confirmado" ? "bg-success/10 text-success" :
                      row.status === "Pendente" ? "bg-warning/10 text-warning" :
                      row.status === "Em andamento" ? "bg-info/10 text-info" :
                      "bg-destructive/10 text-destructive"
                    }`}>
                      {row.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem><Eye className="mr-2 h-4 w-4" /> Ver</DropdownMenuItem>
                        <DropdownMenuItem><Edit className="mr-2 h-4 w-4" /> Editar</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Excluir</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                  Nenhum resultado encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* Footer */}
        <div className="flex items-center justify-between p-3 border-t border-border text-xs text-muted-foreground">
          <span>{filteredData.length} de {DEMO_TABLE_DATA.length} registros</span>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" className="h-7 w-7 p-0" disabled>«</Button>
            <Button variant="secondary" size="sm" className="h-7 w-7 p-0">1</Button>
            <Button variant="outline" size="sm" className="h-7 w-7 p-0" disabled>»</Button>
          </div>
        </div>
      </div>

      {/* Badges */}
      <h3 className="font-heading text-xl font-medium mb-6">Badges de Status</h3>
      <div className="ds-card mb-8">
        <div className="flex flex-wrap gap-3">
          <span className="ds-badge bg-success/10 text-success"><Check className="h-3 w-3 mr-1" />Pago</span>
          <span className="ds-badge bg-warning/10 text-warning"><Clock className="h-3 w-3 mr-1" />Pendente</span>
          <span className="ds-badge bg-muted text-muted-foreground">Inativo</span>
          <span className="ds-badge bg-primary/10 text-primary">Ativo</span>
          <span className="ds-badge bg-destructive/10 text-destructive"><X className="h-3 w-3 mr-1" />Cancelado</span>
          <span className="ds-badge bg-info/10 text-info">Em análise</span>
        </div>
      </div>

      {/* Cards */}
      <h3 className="font-heading text-xl font-medium mb-6">Cards</h3>
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="ds-card">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Card Padrão</p>
          <h4 className="font-heading text-lg font-medium">Maria Silva</h4>
          <p className="text-sm text-muted-foreground mt-1">Paciente desde Jan/2024</p>
        </div>
        <div className="ds-card">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Card Métrica</p>
          <p className="font-heading font-light text-foreground">€ 48.500</p>
          <p className="text-sm text-muted-foreground mt-1">Faturamento mensal</p>
          <p className="text-xs text-success mt-2 flex items-center gap-1"><Check className="h-3 w-3" /> +12% vs mês anterior</p>
        </div>
        <div className="ds-card border-warning/30 bg-warning/5">
          <p className="text-xs text-warning uppercase tracking-wider mb-2 flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Card Alerta</p>
          <h4 className="font-heading text-lg font-medium">3 pagamentos pendentes</h4>
          <p className="text-sm text-muted-foreground mt-1">Total: € 2.400,00</p>
          <Button size="sm" variant="outline" className="mt-3">Ver detalhes</Button>
        </div>
      </div>

      {/* Modal */}
      <h3 className="font-heading text-xl font-medium mb-6">Modal — Estrutura</h3>
      <div className="ds-card mb-8">
        <div className="relative border border-border rounded-lg overflow-hidden bg-background">
          <div className="absolute inset-0 bg-foreground/5 backdrop-blur-[1px]" />
          <div className="relative mx-auto my-8 max-w-md bg-card rounded-lg border border-border shadow-lg p-6">
            <h4 className="font-heading text-xl font-medium mb-2">Novo Agendamento</h4>
            <p className="text-sm text-muted-foreground mb-4">Preencha os dados para agendar o procedimento.</p>
            <div className="space-y-3 mb-6">
              <Input placeholder="Nome do paciente" />
              <Input placeholder="Procedimento" />
              <Input type="date" />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline">Cancelar</Button>
              <Button>Confirmar</Button>
            </div>
          </div>
        </div>
      </div>

      {/* Toast */}
      <h3 className="font-heading text-xl font-medium mb-6">Toast / Notificações</h3>
      <div className="space-y-3">
        {[
          { type: "success", icon: <Check className="h-4 w-4" />, msg: "Agendamento confirmado com sucesso.", cls: "border-success/30 bg-success/5" },
          { type: "warning", icon: <AlertTriangle className="h-4 w-4" />, msg: "Pagamento pendente há 7 dias.", cls: "border-warning/30 bg-warning/5" },
          { type: "error", icon: <X className="h-4 w-4" />, msg: "Erro ao salvar dados do paciente.", cls: "border-destructive/30 bg-destructive/5" },
        ].map((t) => (
          <div key={t.type} className={`flex items-center gap-3 p-4 rounded-lg border ${t.cls}`}>
            <span className={`${t.type === "success" ? "text-success" : t.type === "warning" ? "text-warning" : "text-destructive"}`}>{t.icon}</span>
            <p className="text-sm flex-1">{t.msg}</p>
            <button className="text-muted-foreground hover:text-foreground transition-colors"><X className="h-4 w-4" /></button>
          </div>
        ))}
      </div>
    </section>
  );
};

/* ── Searchable Select Demo ── */
const SERVICES_LIST = [
  "Harmonização Facial",
  "Peeling Químico",
  "Botox",
  "Preenchimento Labial",
  "Limpeza de Pele",
  "Microagulhamento",
  "Laser CO2",
  "Radiofrequência",
  "Criolipólise",
  "Drenagem Linfática",
];

const SearchableSelectDemo = () => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState("");

  const filtered = SERVICES_LIST.filter((s) =>
    s.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      >
        <span className={selected ? "text-foreground" : "text-muted-foreground"}>
          {selected || "Buscar serviço..."}
        </span>
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      </button>
      {open && (
        <div className="absolute z-50 top-full mt-1 w-full bg-popover border border-border rounded-md shadow-lg animate-fade-in">
          <div className="p-2 border-b border-border">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-8 pl-8 pr-3 text-sm bg-transparent border-none outline-none placeholder:text-muted-foreground"
                autoFocus
              />
            </div>
          </div>
          <div className="max-h-48 overflow-y-auto p-1">
            {filtered.length > 0 ? (
              filtered.map((item) => (
                <button
                  key={item}
                  type="button"
                  className={`w-full text-left px-3 py-2 text-sm rounded-sm transition-colors ${
                    selected === item
                      ? "bg-primary/10 text-primary font-medium"
                      : "hover:bg-muted"
                  }`}
                  onClick={() => { setSelected(item); setOpen(false); setSearch(""); }}
                >
                  <div className="flex items-center justify-between">
                    {item}
                    {selected === item && <Check className="h-3.5 w-3.5" />}
                  </div>
                </button>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhum resultado</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
