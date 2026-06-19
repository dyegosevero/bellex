import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { invokeEdgeFunction } from "@/lib/edge-functions";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BlurFade } from "@/components/ui/blur-fade";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
  ChevronLeft,
  Upload,
  Loader2,
  CheckCircle,
  AlertCircle,
  FileJson,
  Trash2,
  AlertTriangle,
  Download,
  Database,
  Bell,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

function DumpButton() {
  const [loading, setLoading] = useState(false);

  const handleDump = async () => {
    setLoading(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("Sessão expirada");

      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/dump-data`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "",
        },
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error || "Erro ao gerar dump");
      }

      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `dump_${new Date().toISOString().slice(0, 10)}.sql`;
      a.click();
      URL.revokeObjectURL(a.href);
      toast.success("Dump gerado com sucesso!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button variant="outline" onClick={handleDump} disabled={loading}>
      {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
      {loading ? "Gerando dump..." : "Exportar SQL"}
    </Button>
  );
}

function BulkRemindersButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleBulkReminders = async () => {
    setLoading(true);
    setResult(null);
    try {
      const { data, error } = await invokeEdgeFunction("bulk-reminders");
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      setResult(data);
      toast.success(`${data.dispatched} lembrete(s) criado(s)!`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="outline" disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Bell className="w-4 h-4 mr-2" />}
            {loading ? "Criando..." : "Criar Lembretes"}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" />
              Criar lembretes em massa?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Isto irá buscar todos os agendamentos ativos com mais de 24h de agora e criar um{" "}
              <strong>lembrete automático</strong> (24h antes) para cada um. Nenhuma notificação imediata será enviada
              ao cliente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkReminders}>Sim, criar lembretes</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {result && (
        <div className="mt-3 p-3 rounded bg-muted text-xs space-y-1">
          <p>
            <span className="text-muted-foreground">Total elegíveis:</span> <strong>{result.total}</strong>
          </p>
          <p>
            <span className="text-muted-foreground">Criados:</span> <strong>{result.dispatched}</strong>
          </p>
          {result.skipped > 0 && (
            <p>
              <span className="text-muted-foreground">Ignorados (send_at já passou):</span>{" "}
              <strong>{result.skipped}</strong>
            </p>
          )}
          {result.errors?.length > 0 && (
            <div className="mt-1">
              <p className="text-destructive font-medium">{result.errors.length} erro(s):</p>
              {result.errors.map((e: string, i: number) => (
                <p key={i} className="text-muted-foreground">
                  {e}
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ClearRemindersButton() {
  const [loading, setLoading] = useState(false);

  const handleClear = async () => {
    setLoading(true);
    try {
      const { error, count } = await supabase
        .from("reminder_history")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");
      if (error) throw error;
      toast.success("Registros de lembretes limpos com sucesso!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao limpar registros");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          disabled={loading}
          className="text-destructive border-destructive/30 hover:bg-destructive/10"
        >
          {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
          {loading ? "Limpando..." : "Limpar Registros"}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            Limpar todos os registros de lembretes?
          </AlertDialogTitle>
          <AlertDialogDescription>
            Esta ação irá <strong>remover permanentemente</strong> todos os registros de lembretes. Esta ação não pode
            ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleClear}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Sim, limpar tudo
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

const ImportData = () => {
  const { loading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [servicesFile, setServicesFile] = useState<any>(null);
  const [specialistsFile, setSpecialistsFile] = useState<any>(null);
  const [clientsFile, setClientsFile] = useState<any>(null);
  const [agendaFile, setAgendaFile] = useState<any>(null);
  const [generateCharges, setGenerateCharges] = useState(false);
  const [loadingImport, setLoadingImport] = useState(false);
  const [loadingClear, setLoadingClear] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [clearResults, setClearResults] = useState<any>(null);
  const [clearConfirmText, setClearConfirmText] = useState("");
  const [backupDone, setBackupDone] = useState(false);
  const [loadingBackup, setLoadingBackup] = useState(false);
  const [userMappings, setUserMappings] = useState<{ email: string; uid: string }[]>([{ email: "", uid: "" }]);

  const addMapping = () => setUserMappings((prev) => [...prev, { email: "", uid: "" }]);
  const removeMapping = (idx: number) => setUserMappings((prev) => prev.filter((_, i) => i !== idx));
  const updateMapping = (idx: number, field: "email" | "uid", value: string) =>
    setUserMappings((prev) => prev.map((m, i) => (i === idx ? { ...m, [field]: value } : m)));

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  const readFile = (file: File): Promise<any> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          resolve(JSON.parse(e.target?.result as string));
        } catch {
          reject(new Error("Ficheiro JSON inválido"));
        }
      };
      reader.onerror = () => reject(new Error("Erro ao ler ficheiro"));
      reader.readAsText(file);
    });
  };

  const handleBackupBeforeClear = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setLoadingBackup(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("Sessão expirada");

      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/dump-data`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "",
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        const text = await res.text();
        let msg = "Erro ao gerar backup";
        try {
          msg = JSON.parse(text).error || msg;
        } catch {
          msg = text || msg;
        }
        throw new Error(msg);
      }

      const blob = await res.blob();
      const a = document.createElement("a");
      const blobUrl = URL.createObjectURL(blob);
      a.href = blobUrl;
      a.download = `backup_antes_exclusao_${new Date().toISOString().slice(0, 10)}.sql`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        URL.revokeObjectURL(blobUrl);
        document.body.removeChild(a);
      }, 1000);
      setBackupDone(true);
      toast.success("Backup realizado com sucesso!");
    } catch (err: any) {
      console.error("Backup error:", err);
      toast.error(err.message);
    } finally {
      setLoadingBackup(false);
    }
  };

  const handleClear = async () => {
    setLoadingClear(true);
    setClearResults(null);
    try {
      const { data, error } = await invokeEdgeFunction("clear-data");
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      setClearResults(data.deleted);
      setClearConfirmText("");
      setBackupDone(false);
      toast.success("Dados limpos com sucesso!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoadingClear(false);
    }
  };

  const handleImport = async () => {
    if (!servicesFile && !specialistsFile && !clientsFile && !agendaFile) {
      toast.error("Selecione pelo menos um ficheiro JSON");
      return;
    }

    setLoadingImport(true);
    setResults(null);

    try {
      const body: any = {};
      if (servicesFile) body.services = await readFile(servicesFile);
      if (specialistsFile) body.specialists = await readFile(specialistsFile);
      if (clientsFile) body.clients = await readFile(clientsFile);
      if (agendaFile) body.agenda = await readFile(agendaFile);
      body.generate_charges = generateCharges;

      // Build email→UID map from user input
      const emailUidMap: Record<string, string> = {};
      for (const m of userMappings) {
        if (m.email.trim() && m.uid.trim()) {
          emailUidMap[m.email.trim().toLowerCase()] = m.uid.trim();
        }
      }
      if (Object.keys(emailUidMap).length > 0) {
        body.email_uid_map = emailUidMap;
      }

      const { data, error } = await invokeEdgeFunction("import-data", { body: body as Record<string, unknown> });

      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);

      setResults(data);
      toast.success("Importação concluída!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoadingImport(false);
    }
  };

  const FileInput = ({
    label,
    file,
    setFile,
  }: {
    label: string;
    file: File | null;
    setFile: (f: File | null) => void;
  }) => (
    <div className="p-4 rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileJson className="w-5 h-5 text-primary" />
          <div>
            <p className="text-sm font-medium">{label}</p>
            <p className="text-xs text-muted-foreground">{file ? file.name : "Nenhum ficheiro selecionado"}</p>
          </div>
        </div>
        <label className="cursor-pointer">
          <input type="file" accept=".json" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          <span className="text-xs font-medium text-primary hover:underline">{file ? "Trocar" : "Selecionar"}</span>
        </label>
      </div>
    </div>
  );

  return (
    <div>
      <BlurFade delay={0.05}>
        <Button
          variant="ghost"
          size="sm"
          className="mb-4 -ml-2 text-muted-foreground"
          onClick={() => navigate("/admin")}
        >
          <ChevronLeft className="w-4 h-4" /> Voltar
        </Button>
        <h1 className="text-2xl font-light tracking-wider mb-1">Importar / Exportar Dados</h1>
        <p className="text-sm text-muted-foreground mb-8">
          Importe serviços, especialistas e clientes a partir de ficheiros JSON do Buk.pt, ou exporte a base de dados.
        </p>
      </BlurFade>

      <BlurFade delay={0.07}>
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,480px)_1fr] gap-6">
          {/* Coluna 1: Importação */}
          <div>
            <div className="space-y-3 mb-4">
              <FileInput label="Serviços" file={servicesFile} setFile={setServicesFile} />
              <FileInput label="Especialistas" file={specialistsFile} setFile={setSpecialistsFile} />
              <FileInput label="Clientes" file={clientsFile} setFile={setClientsFile} />
              <FileInput label="Agenda" file={agendaFile} setFile={setAgendaFile} />
            </div>

            {/* Email → UID Mapping */}
            <div className="mb-6 p-4 rounded-lg border border-border bg-card space-y-3">
              <div>
                <p className="text-sm font-medium">Mapeamento de Especialistas (Email → UID)</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Informe o e-mail do especialista no sistema antigo e o UID correspondente no novo sistema para
                  vincular corretamente os agendamentos.
                </p>
              </div>
              {userMappings.map((m, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="email"
                    value={m.email}
                    onChange={(e) => updateMapping(idx, "email", e.target.value)}
                    placeholder="email@exemplo.com"
                    className="flex-1 px-3 py-2 text-sm rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  <input
                    type="text"
                    value={m.uid}
                    onChange={(e) => updateMapping(idx, "uid", e.target.value)}
                    placeholder="UID (uuid)"
                    className="flex-1 px-3 py-2 text-sm rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono text-xs"
                  />
                  {userMappings.length > 1 && (
                    <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={() => removeMapping(idx)}>
                      <Trash2 className="w-4 h-4 text-muted-foreground" />
                    </Button>
                  )}
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addMapping}>
                + Adicionar mapeamento
              </Button>
            </div>

            {/* Generate charges option */}
            <div className="mb-6 p-4 rounded-lg border border-border bg-card">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="generate-charges"
                  checked={generateCharges}
                  onCheckedChange={(checked) => setGenerateCharges(checked === true)}
                  className="mt-0.5"
                />
                <label htmlFor="generate-charges" className="cursor-pointer">
                  <p className="text-sm font-medium">Gerar cobranças para agendamentos realizados</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Cria automaticamente uma cobrança (status "pago") para cada agendamento com sucesso anterior à data
                    atual, no valor do serviço associado.
                  </p>
                </label>
              </div>
            </div>

            <Button onClick={handleImport} disabled={loadingImport} className="w-full" size="lg">
              {loadingImport ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Importando...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Importar Tudo
                </>
              )}
            </Button>
          </div>

          {/* Coluna 2: Exportar, Limpar, Lembretes */}
          <div className="space-y-4">
            {/* Export Data */}
            <div className="p-4 rounded-lg border border-border bg-card flex flex-col">
              <div className="flex items-center gap-3 mb-3">
                <Database className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">Exportar Base de Dados (SQL Dump)</p>
                  <p className="text-xs text-muted-foreground">
                    Gera um ficheiro .sql com todos os dados, compatível com psql / pg_restore
                  </p>
                </div>
              </div>
              <div className="mt-auto">
                <DumpButton />
              </div>
            </div>

            {/* Clear Data */}
            <div className="p-4 rounded-lg border border-destructive/30 bg-destructive/5 flex flex-col">
              <div className="flex items-start gap-3 mb-3">
                <AlertTriangle className="w-5 h-5 text-destructive mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Limpar Dados</p>
                  <p className="text-xs text-muted-foreground">
                    Remove todos os serviços, clientes, agendamentos e cobranças. Usuários e configurações são
                    preservados.
                  </p>
                </div>
              </div>
              <div className="mt-auto">
                <AlertDialog
                  onOpenChange={(open) => {
                    if (!open) {
                      setClearConfirmText("");
                      setBackupDone(false);
                    }
                  }}
                >
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" disabled={loadingClear}>
                      {loadingClear ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Limpando...
                        </>
                      ) : (
                        <>
                          <Trash2 className="w-4 h-4 mr-2" /> Limpar Todos os Dados
                        </>
                      )}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-destructive" />
                        Tem certeza?
                      </AlertDialogTitle>
                      <AlertDialogDescription asChild>
                        <div className="space-y-4">
                          <p>
                            Esta ação é irreversível. Todos os serviços, clientes, agendamentos, cobranças e dados
                            relacionados serão permanentemente eliminados.
                          </p>
                          <div className="p-3 rounded-lg border border-border bg-muted/50 space-y-2">
                            <p className="text-xs font-medium text-foreground flex items-center gap-2">
                              <Download className="w-4 h-4" />
                              Passo 1 — Fazer backup antes de excluir
                            </p>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => handleBackupBeforeClear(e)}
                              disabled={loadingBackup || backupDone}
                              type="button"
                            >
                              {loadingBackup ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Gerando backup...
                                </>
                              ) : backupDone ? (
                                <>
                                  <CheckCircle className="w-4 h-4 mr-2 text-green-600" /> Backup realizado
                                </>
                              ) : (
                                <>
                                  <Download className="w-4 h-4 mr-2" /> Descarregar Backup
                                </>
                              )}
                            </Button>
                          </div>
                          <div className="p-3 rounded-lg border border-border bg-muted/50 space-y-2">
                            <p className="text-xs font-medium text-foreground">
                              Passo 2 — Digite <strong className="text-destructive">EXCLUIR</strong> para confirmar
                            </p>
                            <input
                              type="text"
                              value={clearConfirmText}
                              onChange={(e) => setClearConfirmText(e.target.value)}
                              placeholder="Digite EXCLUIR"
                              className="w-full px-3 py-2 text-sm rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-destructive/50"
                              autoComplete="off"
                              disabled={!backupDone}
                            />
                          </div>
                        </div>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleClear}
                        disabled={!backupDone || clearConfirmText !== "EXCLUIR"}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
                      >
                        Sim, limpar tudo
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                {clearResults && (
                  <div className="mt-4 p-3 rounded bg-muted text-xs space-y-1">
                    <p className="font-medium mb-2">Registos eliminados:</p>
                    <div className="grid grid-cols-2 gap-1">
                      {Object.entries(clearResults).map(([table, count]) => (
                        <div key={table}>
                          <span className="text-muted-foreground">{table}:</span> <strong>{count as number}</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Bulk Reminders */}
            <div className="p-4 rounded-lg border border-border bg-card flex flex-col">
              <div className="flex items-center gap-3 mb-3">
                <Bell className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">Criar Lembretes em Massa</p>
                  <p className="text-xs text-muted-foreground">
                    Cria lembretes automáticos (24h antes) para todos os agendamentos ativos futuros que ainda não
                    tenham lembrete. Útil após importação de dados.
                  </p>
                </div>
              </div>
              <div className="mt-auto flex items-center gap-2 flex-wrap">
                <BulkRemindersButton />
                <ClearRemindersButton />
              </div>
            </div>
          </div>
        </div>
      </BlurFade>

      {results && (
        <BlurFade delay={0.15}>
          <div className="mt-8 p-5 rounded-lg border border-border bg-card space-y-3">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" /> Resultado da Importação
            </h2>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="p-2 rounded bg-muted">
                <span className="text-muted-foreground">Serviços:</span> <strong>{results.services || 0}</strong>
              </div>
              <div className="p-2 rounded bg-muted">
                <span className="text-muted-foreground">Especialistas:</span>{" "}
                <strong>{results.specialists || 0}</strong>
              </div>
              <div className="p-2 rounded bg-muted">
                <span className="text-muted-foreground">Horários:</span>{" "}
                <strong>{results.specialist_hours || 0}</strong>
              </div>
              <div className="p-2 rounded bg-muted">
                <span className="text-muted-foreground">Serviços/Espec.:</span>{" "}
                <strong>{results.specialist_services || 0}</strong>
              </div>
              <div className="p-2 rounded bg-muted">
                <span className="text-muted-foreground">Clientes:</span> <strong>{results.clients || 0}</strong>
              </div>
              <div className="p-2 rounded bg-muted">
                <span className="text-muted-foreground">Agendamentos:</span>{" "}
                <strong>{results.appointments || 0}</strong>
              </div>
              {(results.charges > 0 || generateCharges) && (
                <div className="p-2 rounded bg-muted col-span-2">
                  <span className="text-muted-foreground">Cobranças geradas:</span>{" "}
                  <strong>{results.charges || 0}</strong>
                </div>
              )}
              {results.skipped_duplicates > 0 && (
                <div className="p-2 rounded bg-muted col-span-2">
                  <span className="text-muted-foreground">Duplicados ignorados:</span>{" "}
                  <strong>{results.skipped_duplicates}</strong>
                </div>
              )}
            </div>
            {results.errors?.length > 0 && (
              <div className="mt-3">
                <p className="text-xs font-medium text-destructive flex items-center gap-1 mb-1">
                  <AlertCircle className="w-3.5 h-3.5" /> {results.errors.length} erro(s)
                </p>
                <div className="max-h-40 overflow-y-auto text-[10px] text-muted-foreground space-y-0.5">
                  {results.errors.map((e: string, i: number) => (
                    <p key={i}>{e}</p>
                  ))}
                </div>
              </div>
            )}
          </div>
        </BlurFade>
      )}
    </div>
  );
};

export default ImportData;
