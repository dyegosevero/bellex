import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSpecialists } from "@/hooks/useAppointmentData";
import { withTimezoneOffset, getDateTimePartsInTimezone } from "@/lib/date";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Trash2 } from "lucide-react";

interface BlockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaults?: {
    date?: string;
    startTime?: string;
    endTime?: string;
    specialistId?: string;
  };
  editBlock?: {
    id: string;
    specialist_id: string;
    start_datetime: string;
    end_datetime: string;
    reason: string | null;
  } | null;
}

export function BlockDialog({ open, onOpenChange, defaults, editBlock }: BlockDialogProps) {
  const queryClient = useQueryClient();
  const { data: specialists } = useSpecialists();
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [form, setForm] = useState({
    specialist_id: "",
    start_date: "",
    start_time: "",
    end_date: "",
    end_time: "",
    reason: "",
  });

  // Recurrence state
  const [isRecurring, setIsRecurring] = useState(false);
  const [repeatInterval, setRepeatInterval] = useState("1"); // weeks
  const [repeatUntil, setRepeatUntil] = useState("");

  const isEditMode = !!editBlock;

  useEffect(() => {
    if (!open) return;

    // Reset recurrence on open
    setIsRecurring(false);
    setRepeatInterval("1");
    setRepeatUntil("");

    if (editBlock) {
      const s = getDateTimePartsInTimezone(editBlock.start_datetime);
      const e = getDateTimePartsInTimezone(editBlock.end_datetime);
      setForm({
        specialist_id: editBlock.specialist_id,
        start_date: `${s.year}-${s.month}-${s.day}`,
        start_time: `${s.hour}:${s.minute}`,
        end_date: `${e.year}-${e.month}-${e.day}`,
        end_time: `${e.hour}:${e.minute}`,
        reason: editBlock.reason || "",
      });
    } else if (defaults) {
      const startTime = defaults.startTime || "";
      let endDate = defaults.date || "";
      let endTime = defaults.endTime || "";

      if (startTime && (!endTime || endTime === startTime)) {
        const [h, m] = startTime.split(":").map(Number);
        const endH = h + 1;
        if (endH >= 24) {
          endTime = `${String(endH - 24).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
          if (endDate) {
            const d = new Date(endDate + "T12:00:00");
            d.setDate(d.getDate() + 1);
            endDate = d.toISOString().split("T")[0];
          }
        } else {
          endTime = `${String(endH).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
        }
      }

      setForm({
        specialist_id: defaults.specialistId || "all",
        start_date: defaults.date || "",
        start_time: startTime,
        end_date: endDate,
        end_time: endTime,
        reason: "",
      });
    }
  }, [open, defaults, editBlock]);

  /** Generate all dates for recurring blocks */
  function generateRecurringDates(): { startDate: string; endDate: string }[] {
    const dates: { startDate: string; endDate: string }[] = [];
    const intervalWeeks = parseInt(repeatInterval, 10) || 1;
    const intervalMs = intervalWeeks * 7 * 24 * 60 * 60 * 1000;

    const baseStart = new Date(form.start_date + "T12:00:00");
    const baseEnd = new Date(form.end_date + "T12:00:00");
    const dayDiffMs = baseEnd.getTime() - baseStart.getTime();

    const untilDate = repeatUntil ? new Date(repeatUntil + "T23:59:59") : null;
    if (!untilDate) return [{ startDate: form.start_date, endDate: form.end_date }];

    let currentStart = baseStart.getTime();
    // Safety limit: max 52 occurrences
    for (let i = 0; i < 52; i++) {
      const sd = new Date(currentStart);
      const ed = new Date(currentStart + dayDiffMs);
      if (sd.getTime() > untilDate.getTime()) break;

      dates.push({
        startDate: sd.toISOString().split("T")[0],
        endDate: ed.toISOString().split("T")[0],
      });
      currentStart += intervalMs;
    }
    return dates;
  }

  const handleSave = async () => {
    if (!form.specialist_id || !form.start_date || !form.start_time || !form.end_date || !form.end_time) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }

    if (isRecurring && !repeatUntil) {
      toast.error("Selecione a data limite da recorrência.");
      return;
    }

    setSaving(true);
    try {
      if (isEditMode) {
        const startDt = withTimezoneOffset(`${form.start_date}T${form.start_time}:00`);
        const endDt = withTimezoneOffset(`${form.end_date}T${form.end_time}:00`);
        const reason = form.reason || null;

        const { error } = await supabase
          .from("calendar_blocks")
          .update({
            specialist_id: form.specialist_id,
            start_datetime: startDt,
            end_datetime: endDt,
            reason,
          })
          .eq("id", editBlock!.id);
        if (error) throw error;
        toast.success("Bloqueio atualizado!");
      } else {
        // Generate dates (single or recurring)
        const dates = isRecurring ? generateRecurringDates() : [{ startDate: form.start_date, endDate: form.end_date }];
        const reason = form.reason || null;

        // Determine target specialists
        const targetSpecialists = form.specialist_id === "all"
          ? (specialists ?? []).map((s) => s.user_id)
          : [form.specialist_id];

        if (targetSpecialists.length === 0) {
          toast.error("Nenhum colaborador encontrado.");
          return;
        }

        const inserts = dates.flatMap(({ startDate, endDate }) =>
          targetSpecialists.map((specId) => ({
            specialist_id: specId,
            start_datetime: withTimezoneOffset(`${startDate}T${form.start_time}:00`),
            end_datetime: withTimezoneOffset(`${endDate}T${form.end_time}:00`),
            reason,
          }))
        );

        const { error } = await supabase.from("calendar_blocks").insert(inserts as any);
        if (error) throw error;

        const count = inserts.length;
        toast.success(count > 1 ? `${count} bloqueios criados!` : "Bloqueio criado!");
      }
      queryClient.invalidateQueries({ queryKey: ["calendar-blocks"] });
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editBlock) return;
    setDeleting(true);
    try {
      const { error } = await supabase.from("calendar_blocks").delete().eq("id", editBlock.id);
      if (error) throw error;
      toast.success("Bloqueio eliminado!");
      queryClient.invalidateQueries({ queryKey: ["calendar-blocks"] });
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const specName = specialists?.find((s) => s.user_id === form.specialist_id)?.full_name;

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-center text-lg font-bold">
            {isEditMode ? "Editar Bloqueio" : "Bloquear Marcações"}
          </DialogTitle>
          {specName && (
            <p className="text-center text-sm text-muted-foreground">{specName}</p>
          )}
        </DialogHeader>
        <div className="space-y-4">
          {/* Início */}
          <div>
            <Label className="text-primary font-semibold">Início</Label>
            <div className="grid grid-cols-[1fr_80px_80px] gap-3 mt-1.5 items-end">
              <Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Horas</span>
                <Input
                  type="number"
                  min={0}
                  max={23}
                  value={form.start_time.split(":")[0] || ""}
                  onChange={(e) => {
                    const v = Math.max(0, Math.min(23, parseInt(e.target.value) || 0));
                    const h = String(v).padStart(2, "0");
                    const m = form.start_time.split(":")[1] || "00";
                    setForm({ ...form, start_time: `${h}:${m}` });
                  }}
                />
              </div>
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Minutos</span>
                <Input
                  type="number"
                  min={0}
                  max={59}
                  step={5}
                  value={form.start_time.split(":")[1] || ""}
                  onChange={(e) => {
                    const v = Math.max(0, Math.min(59, parseInt(e.target.value) || 0));
                    const h = form.start_time.split(":")[0] || "00";
                    const m = String(v).padStart(2, "0");
                    setForm({ ...form, start_time: `${h}:${m}` });
                  }}
                />
              </div>
            </div>
          </div>

          {/* Fim */}
          <div>
            <Label className="text-primary font-semibold">Fim</Label>
            <div className="grid grid-cols-[1fr_80px_80px] gap-3 mt-1.5 items-end">
              <Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Horas</span>
                <Input
                  type="number"
                  min={0}
                  max={23}
                  value={form.end_time.split(":")[0] || ""}
                  onChange={(e) => {
                    const v = Math.max(0, Math.min(23, parseInt(e.target.value) || 0));
                    const h = String(v).padStart(2, "0");
                    const m = form.end_time.split(":")[1] || "00";
                    setForm({ ...form, end_time: `${h}:${m}` });
                  }}
                />
              </div>
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Minutos</span>
                <Input
                  type="number"
                  min={0}
                  max={59}
                  step={5}
                  value={form.end_time.split(":")[1] || ""}
                  onChange={(e) => {
                    const v = Math.max(0, Math.min(59, parseInt(e.target.value) || 0));
                    const h = form.end_time.split(":")[0] || "00";
                    const m = String(v).padStart(2, "0");
                    setForm({ ...form, end_time: `${h}:${m}` });
                  }}
                />
              </div>
            </div>
          </div>

          {/* Colaborador */}
          <div className="space-y-1.5">
            <Label className="text-primary font-semibold">Colaborador</Label>
            <Select
              value={form.specialist_id}
              onValueChange={(v) => setForm({ ...form, specialist_id: v })}
              disabled={isEditMode}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos os colaboradores" />
              </SelectTrigger>
              <SelectContent>
                {!isEditMode && <SelectItem value="all">Todos os colaboradores</SelectItem>}
                {specialists?.map((s) => (
                  <SelectItem key={s.user_id} value={s.user_id}>{s.full_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Observações */}
          <div className="space-y-1.5">
            <Label className="text-primary font-semibold">Observações</Label>
            <Textarea
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              placeholder="Observações"
            />
          </div>

          {/* Evento recorrente - only for create mode */}
          {!isEditMode && (
            <>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <Checkbox
                  checked={isRecurring}
                  onCheckedChange={(v) => setIsRecurring(!!v)}
                />
                <span className="text-sm font-medium">Evento recorrente</span>
              </label>

              {isRecurring && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-primary font-semibold">Repetir</Label>
                    <Select value={repeatInterval} onValueChange={setRepeatInterval}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Todas as semanas</SelectItem>
                        <SelectItem value="2">De 2 em 2 semanas</SelectItem>
                        <SelectItem value="3">De 3 em 3 semanas</SelectItem>
                        <SelectItem value="4">De 4 em 4 semanas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-primary font-semibold">Até</Label>
                    <Input
                      type="date"
                      value={repeatUntil}
                      onChange={(e) => setRepeatUntil(e.target.value)}
                      min={form.start_date}
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        <DialogFooter className="flex !justify-between items-center gap-2">
          <Button onClick={handleSave} disabled={saving || deleting} className="bg-green-600 hover:bg-green-700 text-white">
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isEditMode ? "Salvar" : "Bloquear"}
          </Button>
          {isEditMode ? (
            <button
              type="button"
              className="text-sm text-destructive hover:underline inline-flex items-center gap-1.5 disabled:opacity-50"
              onClick={() => setConfirmDelete(true)}
              disabled={deleting || saving}
            >
              {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              Excluir Bloqueio
            </button>
          ) : (
            <div />
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir Bloqueio</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir este bloqueio? O horário ficará disponível novamente para agendamentos.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={deleting}
            onClick={(e) => { e.preventDefault(); handleDelete(); }}
          >
            {deleting && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
            Excluir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
