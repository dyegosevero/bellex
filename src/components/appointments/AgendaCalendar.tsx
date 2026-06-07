import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useSpecialists } from "@/hooks/useAppointmentData";
import { fmtTime, getDayOfMonthInTimezone, getMonthRangeInTimezone } from "@/lib/date";

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const STATUS_COLORS: Record<string, string> = {
  agendado: "bg-blue-100 border-blue-300 text-blue-800",
  em_atendimento: "bg-orange-100 border-orange-300 text-orange-800",
  realizado: "bg-emerald-100 border-emerald-300 text-emerald-800",
  concluido: "bg-indigo-100 border-indigo-300 text-indigo-800",
  cancelado: "bg-red-100 border-red-300 text-red-800",
};

const SPECIALIST_RING_COLORS = [
  "ring-primary",
  "ring-accent",
  "ring-blue-500",
  "ring-emerald-500",
  "ring-orange-500",
  "ring-red-400",
  "ring-brand-sage",
  "ring-brand-deep",
];

interface AppointmentRow {
  id: string;
  start_time: string;
  status: string;
  specialist_id: string | null;
  client_name: string;
  specialist_name: string;
  specialist_avatar: string | null;
  service_name: string;
}

export const AgendaCalendar = () => {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [specialistFilter, setSpecialistFilter] = useState("all");
  const { data: specialists } = useSpecialists();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const { start: startOfMonth, end: endOfMonth } = useMemo(
    () => getMonthRangeInTimezone(currentDate),
    [currentDate],
  );

  const { data: appointments, isLoading } = useQuery({
    queryKey: ["agenda-calendar", year, month, specialistFilter],
    queryFn: async () => {
      let query = supabase
        .from("appointments")
        .select("id, start_time, status, specialist_id, service_id, client_id, clients(full_name)")
        .gte("start_time", startOfMonth)
        .lte("start_time", endOfMonth)
        .order("start_time");

      if (specialistFilter !== "all") query = query.eq("specialist_id", specialistFilter);

      const { data, error } = await query;
      if (error) throw error;

      const specialistIds = [...new Set((data ?? []).map((a: any) => a.specialist_id).filter(Boolean))];
      const serviceIds = [...new Set((data ?? []).map((a: any) => a.service_id).filter(Boolean))];

      let specialistMap: Record<string, { name: string; avatar: string | null }> = {};
      if (specialistIds.length > 0) {
        const { data: profiles } = await supabase.from("profiles").select("user_id, full_name, avatar_url").in("user_id", specialistIds);
        profiles?.forEach((p) => { specialistMap[p.user_id] = { name: p.full_name, avatar: p.avatar_url }; });
      }

      let serviceMap: Record<string, string> = {};
      if (serviceIds.length > 0) {
        const { data: services } = await supabase.from("services").select("id, name").in("id", serviceIds);
        services?.forEach((s) => { serviceMap[s.id] = s.name; });
      }

      return (data ?? []).map((a: any): AppointmentRow => ({
        id: a.id,
        start_time: a.start_time,
        status: a.status,
        specialist_id: a.specialist_id,
        client_name: a.clients?.full_name ?? "—",
        specialist_name: a.specialist_id ? specialistMap[a.specialist_id]?.name ?? "—" : "—",
        specialist_avatar: a.specialist_id ? specialistMap[a.specialist_id]?.avatar ?? null : null,
        service_name: a.service_id ? serviceMap[a.service_id] ?? "—" : "—",
      }));
    },
  });

  const specialistRingMap = useMemo(() => {
    const map: Record<string, string> = {};
    specialists?.forEach((s, i) => {
      map[s.user_id] = SPECIALIST_RING_COLORS[i % SPECIALIST_RING_COLORS.length];
    });
    return map;
  }, [specialists]);

  const specialistAvatarMap = useMemo(() => {
    const map: Record<string, string | null> = {};
    specialists?.forEach((s) => {
      map[s.user_id] = (s as any).avatar_url ?? null;
    });
    return map;
  }, [specialists]);

  const appointmentsByDay = useMemo(() => {
    const map: Record<number, AppointmentRow[]> = {};
    appointments?.forEach((a) => {
      const day = getDayOfMonthInTimezone(a.start_time);
      if (!map[day]) map[day] = [];
      map[day].push(a);
    });
    return map;
  }, [appointments]);

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  const isToday = (day: number) =>
    today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToToday = () => setCurrentDate(new Date());

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase();

  const totalCells = firstDayOfMonth + daysInMonth;
  const rows = Math.ceil(totalCells / 7);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={prevMonth}><ChevronLeft className="w-4 h-4" /></Button>
          <h2 className="text-lg font-heading font-light tracking-wider min-w-[200px] text-center">{MONTHS[month]} {year}</h2>
          <Button variant="outline" size="icon" onClick={nextMonth}><ChevronRight className="w-4 h-4" /></Button>
          <Button variant="ghost" size="sm" onClick={goToToday} className="text-xs">Hoje</Button>
        </div>
        <Select value={specialistFilter} onValueChange={setSpecialistFilter}>
          <SelectTrigger className="w-52"><SelectValue placeholder="Todos especialistas" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos especialistas</SelectItem>
            {specialists?.map((s) => <SelectItem key={s.user_id} value={s.user_id}>{s.full_name || "Sem nome"}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {specialists && specialists.length > 0 && (
        <div className="flex items-center gap-3 flex-wrap">
          {specialists.map((s, i) => (
            <div key={s.user_id} className="flex items-center gap-1.5">
              <Avatar className={`w-6 h-6 ring-2 ${SPECIALIST_RING_COLORS[i % SPECIALIST_RING_COLORS.length]}`}>
                {(s as any).avatar_url && <AvatarImage src={(s as any).avatar_url} alt={s.full_name || "Especialista"} />}
                <AvatarFallback className="text-[8px] bg-muted text-muted-foreground">{getInitials(s.full_name || "?")}</AvatarFallback>
              </Avatar>
              <span className="text-xs text-muted-foreground">{s.full_name || "Sem nome"}</span>
            </div>
          ))}
        </div>
      )}

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="grid grid-cols-7 border-b border-border">
          {WEEKDAYS.map((day) => (
            <div key={day} className="text-center py-2 text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{day}</div>
          ))}
        </div>

        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="grid grid-cols-7">
            {Array.from({ length: 7 }).map((_, colIndex) => {
              const cellIndex = rowIndex * 7 + colIndex;
              const day = cellIndex - firstDayOfMonth + 1;
              const isValid = day >= 1 && day <= daysInMonth;
              const dayAppointments = isValid ? appointmentsByDay[day] ?? [] : [];

              return (
                <div key={colIndex} className={`min-h-[100px] border-b border-r border-border p-1.5 transition-colors ${isValid ? "bg-card hover:bg-muted/30" : "bg-muted/20"} ${isToday(day) ? "ring-1 ring-inset ring-accent/50" : ""}`}>
                  {isValid && (
                    <>
                      <span className={`text-xs font-medium inline-flex items-center justify-center w-6 h-6 rounded-full ${isToday(day) ? "bg-accent text-accent-foreground" : "text-foreground"}`}>{day}</span>
                      <div className="mt-1 space-y-0.5">
                        {dayAppointments.slice(0, 3).map((apt) => (
                          <Tooltip key={apt.id}>
                            <TooltipTrigger asChild>
                              <button
                                onClick={() => navigate(`/atendimentos/${apt.id}`)}
                                className={`w-full flex items-center gap-1 px-1 py-0.5 rounded text-[10px] leading-tight border transition-all hover:scale-[1.02] cursor-pointer ${STATUS_COLORS[apt.status] ?? "bg-muted border-border text-foreground"}`}
                              >
                                <Avatar className={`w-4 h-4 flex-shrink-0 ring-1 ${apt.specialist_id ? specialistRingMap[apt.specialist_id] ?? "ring-muted" : "ring-muted"}`}>
                                  {apt.specialist_avatar && <AvatarImage src={apt.specialist_avatar} alt={apt.specialist_name} />}
                                  <AvatarFallback className="text-[6px] bg-muted text-muted-foreground">{getInitials(apt.specialist_name)}</AvatarFallback>
                                </Avatar>
                                <span className="truncate">{fmtTime(apt.start_time)} {apt.client_name}</span>
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="right" className="max-w-[220px]">
                              <p className="font-medium">{apt.client_name}</p>
                              <p className="text-xs text-muted-foreground">{fmtTime(apt.start_time)} · {apt.service_name}</p>
                              <p className="text-xs text-muted-foreground">Esp: {apt.specialist_name}</p>
                            </TooltipContent>
                          </Tooltip>
                        ))}
                        {dayAppointments.length > 3 && (
                          <span className="text-[9px] text-muted-foreground pl-1">+{dayAppointments.length - 3} mais</span>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {isLoading && (
        <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
          <Calendar className="w-6 h-6 animate-pulse text-muted-foreground" />
        </div>
      )}
    </div>
  );
};
