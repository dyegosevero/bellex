import { useState, useMemo } from "react";
import { Calendar } from "@/components/ui/calendar";
import { useMonthAppointments, type MonthAppointment } from "@/hooks/useDashboardData";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { format, isSameDay } from "date-fns";
import { pt } from "date-fns/locale";
import { CalendarDays } from "lucide-react";
import { fmtTime, getDateKeyInTimezone, toCalendarDate } from "@/lib/date";

const STATUS_COLORS: Record<string, string> = {
  realizado: "bg-emerald-500",
  agendado: "bg-amber-400",
  cancelado: "bg-destructive",
};

function getInitials(name: string) {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

export function DashboardCalendar() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [month, setMonth] = useState<Date>(new Date());
  const { data: appointments, isLoading } = useMonthAppointments(month);

  const dayAppointments = useMemo(() => {
    if (!appointments) return [];
    const selectedDayKey = getDateKeyInTimezone(selectedDate);
    return appointments.filter((a) => getDateKeyInTimezone(a.start_time) === selectedDayKey);
  }, [appointments, selectedDate]);

  const appointmentDays = useMemo(() => {
    if (!appointments) return [];
    return [...new Set(appointments.map((a) => getDateKeyInTimezone(a.start_time)))];
  }, [appointments]);

  return (
    <div className="bg-card border border-border rounded-lg p-5">
      <div className="flex items-center gap-2 mb-4">
        <CalendarDays className="w-4 h-4 text-muted-foreground" />
        <h2 className="text-sm uppercase tracking-wider text-muted-foreground">Agenda do Mês</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-6">
        <div>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(d) => d && setSelectedDate(d)}
            month={month}
            onMonthChange={setMonth}
            locale={pt}
            className="pointer-events-auto"
            modifiers={{ hasAppointment: appointmentDays.map(toCalendarDate) }}
            modifiersClassNames={{ hasAppointment: "font-bold" }}
          />
        </div>

        <div className="min-h-[260px]">
          <p className="text-xs text-muted-foreground mb-3">
            {format(selectedDate, "EEEE, d 'de' MMMM", { locale: pt })}
          </p>

          {isLoading ? (
            <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
          ) : dayAppointments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-10">Nenhum agendamento neste dia</p>
          ) : (
            <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
              {dayAppointments.map((appt) => <AppointmentRow key={appt.id} appt={appt} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AppointmentRow({ appt }: { appt: MonthAppointment }) {
  const time = fmtTime(appt.start_time);
  const statusColor = STATUS_COLORS[appt.status] ?? "bg-muted-foreground";

  return (
    <div className="flex items-center gap-3 rounded-md border border-border bg-muted/30 p-3 transition-colors hover:bg-muted/50">
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarFallback className="text-[10px] bg-primary/10 text-primary">{getInitials(appt.specialist_name)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate">{appt.client_name}</p>
        <p className="text-xs text-muted-foreground truncate">{time} · {appt.service_name ?? appt.specialist_name}</p>
      </div>
      <span className={`inline-block h-2.5 w-2.5 rounded-full shrink-0 ${statusColor}`} title={appt.status} />
    </div>
  );
}
