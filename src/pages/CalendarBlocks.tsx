import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSpecialists } from "@/hooks/useAppointmentData";
import { BlurFade } from "@/components/ui/blur-fade";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { fmtDateTime, withTimezoneOffset } from "@/lib/date";

const CalendarBlocks = () => {
  const queryClient = useQueryClient();
  const { data: specialists } = useSpecialists();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ specialist_id: "", start_date: "", start_time: "", end_date: "", end_time: "", reason: "" });

  const { data: blocks, isLoading } = useQuery({
    queryKey: ["calendar-blocks-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("calendar_blocks")
        .select("*")
        .order("start_datetime", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const handleCreate = async () => {
    if (!form.specialist_id || !form.start_date || !form.start_time || !form.end_date || !form.end_time) {
      toast.error("Preencha todos os campos.");
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from("calendar_blocks").insert({
        specialist_id: form.specialist_id,
        start_datetime: withTimezoneOffset(`${form.start_date}T${form.start_time}:00`),
        end_datetime: withTimezoneOffset(`${form.end_date}T${form.end_time}:00`),
        reason: form.reason || null,
      } as any);
      if (error) throw error;
      toast.success("Bloqueio criado!");
      queryClient.invalidateQueries({ queryKey: ["calendar-blocks"] });
      setDialogOpen(false);
      setForm({ specialist_id: "", start_date: "", start_time: "", end_date: "", end_time: "", reason: "" });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("calendar_blocks").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Bloqueio removido.");
      queryClient.invalidateQueries({ queryKey: ["calendar-blocks"] });
    }
  };

  const getSpecName = (id: string) => specialists?.find((s) => s.user_id === id)?.full_name ?? "—";

  return (
    <div>
      <BlurFade delay={0.05}>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-light tracking-wider">Bloqueios de Agenda</h1>
            <p className="text-sm text-muted-foreground mt-1">Gerencie períodos bloqueados na agenda</p>
          </div>
          <Button onClick={() => setDialogOpen(true)}><Plus className="w-4 h-4 mr-2" />Novo Bloqueio</Button>
        </div>
      </BlurFade>

      <BlurFade delay={0.1}>
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          {isLoading ? (
            <div className="p-6 space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Especialista</TableHead>
                  <TableHead>Início</TableHead>
                  <TableHead>Fim</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {blocks && blocks.length > 0 ? blocks.map((b: any) => (
                  <TableRow key={b.id}>
                    <TableCell className="font-medium">{getSpecName(b.specialist_id)}</TableCell>
                    <TableCell>{fmtDateTime(b.start_datetime)}</TableCell>
                    <TableCell>{fmtDateTime(b.end_datetime)}</TableCell>
                    <TableCell className="text-muted-foreground">{b.reason || "—"}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(b.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nenhum bloqueio cadastrado</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </div>
      </BlurFade>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo Bloqueio</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Especialista</Label>
              <Select value={form.specialist_id} onValueChange={(v) => setForm({ ...form, specialist_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {specialists?.map((s) => <SelectItem key={s.user_id} value={s.user_id}>{s.full_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Data início</Label>
                <Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Hora início</Label>
                <Input type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Data fim</Label>
                <Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Hora fim</Label>
                <Input type="time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Motivo</Label>
              <Textarea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Opcional" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Criar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CalendarBlocks;
