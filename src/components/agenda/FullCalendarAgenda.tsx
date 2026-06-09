import { useState, useMemo, useRef, useCallback } from "react";
import { getDateKeyInTimezone, getTimezone, toCalendarDate } from "@/lib/date";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSpecialists } from "@/hooks/useAppointmentData";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import luxonPlugin from "@fullcalendar/luxon3";
import type { EventClickArg, DatesSetArg } from "@fullcalendar/core";
import type { DateClickArg } from "@fullcalendar/interaction";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { QuickAppointmentDialog } from "./QuickAppointmentDialog";
import { BlockDialog } from "./BlockDialog";
import { SelectionPopover } from "./SelectionPopover";
import AppointmentDetailDialog from "./AppointmentDetailDialog";
import { ChevronLeft, ChevronRight, Users, User, Check, Plus, CalendarDays, MessageSquare, List } from "lucide-react";
import { LogoDraw } from "@/components/ui/logo-draw";
import { format, addDays, isSameDay } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { AppointmentsListView } from "./AppointmentsListView";
import { pt } from "date-fns/locale";
import { usePendingBillings } from "@/hooks/usePendingBillings";
import { toast } from "sonner";

type AgendaView = "calendar" | "list";
type ViewType = "timeGridWeek" | "timeGridDay" | "dayGridMonth";

const STATUS_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  agendado:        { bg: "#6366F1", border: "#4F46E5", text: "#fff" },
  em_atendimento:  { bg: "#F59E0B", border: "#D97706", text: "#fff" },
  realizado:       { bg: "#10B981", border: "#059669", text: "#fff" },
  concluido:       { bg: "#6366F1", border: "#4F46E5", text: "#fff" },
  cancelado:       { bg: "#EF4444", border: "#DC2626", text: "#fff" },
};

const WEEKDAY_LABELS = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];

export function FullCalendarAgenda() {
  const { isAdmin, isReceptionist, isSpecialist, user } = useAuth();
  const canSeeList = isAdmin || isReceptionist;
  const canSeeAllSpecialists = isAdmin || isReceptionist;
  const [agendaView, setAgendaView] = useState<AgendaView>("calendar");
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState<ViewType>("timeGridDay");
  // Specialists can only see their own calendar
  const [selectedSpecialist, setSelectedSpecialist] = useState<string>(
    isSpecialist && !isAdmin && !isReceptionist && user?.id ? user.id : "all"
  );
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [editBlock, setEditBlock] = useState<{
    id: string; specialist_id: string; start_datetime: string; end_datetime: string; reason: string | null;
  } | null>(null);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [popoverPos, setPopoverPos] = useState({ x: 0, y: 0 });
  const [dialogDefaults, setDialogDefaults] = useState<{
    date?: string; startTime?: string; endTime?: string; specialistId?: string;
  }>({});
  
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
  const [appointmentDialogOpen, setAppointmentDialogOpen] = useState(false);
  const isSyncingRef = useRef(false);
  const lastSyncedDateRef = useRef<number>(0);

  const calendarRefs = useRef<Map<string, FullCalendar>>(new Map());

  const { data: specialists, isLoading: specLoading } = useSpecialists();

  const { data: clinicSettings } = useQuery({
    queryKey: ["clinic-settings-calendar"],
    queryFn: async () => {
      const { data, error } = await supabase.from("clinic_settings").select("timezone").limit(1).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const clinicTimezone = clinicSettings?.timezone || getTimezone();

  const { data: rawEvents, isLoading: eventsLoading } = useQuery({
    queryKey: ["calendar-events", dateRange.start, dateRange.end, clinicTimezone],
    queryFn: async () => {
      if (!dateRange.start) return [];
      const { data, error } = await supabase
        .from("appointments")
        .select("id, start_time, end_time, status, specialist_id, service_id, client_id, notes, clients!appointments_client_id_fkey(full_name), services!appointments_service_id_fkey(name, color, duration_minutes)")
        .gte("start_time", dateRange.start)
        .lte("start_time", dateRange.end)
        .neq("status", "cancelado");
      if (error) throw error;
      // Paleta de fallback para serviços sem cor — varia por service_id
      const FALLBACK_COLORS = ["#e11d48","#ea580c","#d97706","#16a34a","#0d9488","#2563eb","#7c3aed","#9333ea","#db2777"];
      const serviceColorMap = new Map<string, string>();
      let fallbackIdx = 0;

      return (data ?? []).map((a: any) => {
        const colors = STATUS_COLORS[a.status] ?? STATUS_COLORS.agendado;
        let serviceColor = a.services?.color;

        // Se não tem cor ou é a cor padrão azul genérica, atribui paleta variada por serviço
        const isDefaultBlue = !serviceColor || serviceColor === "#3B82F6" || serviceColor === "#3b82f6";
        if (isDefaultBlue) {
          const sid = a.service_id ?? "unknown";
          if (!serviceColorMap.has(sid)) {
            serviceColorMap.set(sid, FALLBACK_COLORS[fallbackIdx % FALLBACK_COLORS.length]);
            fallbackIdx++;
          }
          serviceColor = serviceColorMap.get(sid)!;
        }

        const eventEnd = a.end_time ?? new Date(new Date(a.start_time).getTime() + (a.services?.duration_minutes ?? 30) * 60000).toISOString();
        return {
          id: a.id,
          title: `${a.clients?.full_name ?? "—"} · ${a.services?.name ?? ""}`,
          start: a.start_time,
          end: eventEnd,
          specialistId: a.specialist_id,
          backgroundColor: serviceColor || colors.bg,
          borderColor: serviceColor || colors.border,
          textColor: serviceColor || colors.bg,
          extendedProps: { status: a.status, clientName: a.clients?.full_name, serviceName: a.services?.name, notes: a.notes },
        };
      });
    },
    enabled: !!dateRange.start,
  });

  const { data: rawBlocks } = useQuery({
    queryKey: ["calendar-blocks", dateRange.start, dateRange.end, clinicTimezone],
    queryFn: async () => {
      if (!dateRange.start) return [];
      const { data, error } = await supabase
        .from("calendar_blocks")
        .select("*")
        .gte("start_datetime", dateRange.start)
        .lte("start_datetime", dateRange.end);
      if (error) throw error;
      return (data ?? []).map((b: any) => ({
        id: `block-${b.id}`,
        title: b.reason ? `BLOQUEADO · ${b.reason}` : "BLOQUEADO",
        start: b.start_datetime,
        end: b.end_datetime,
        specialistId: b.specialist_id,
        display: "auto" as const,
        classNames: ["fc-block-event"],
        editable: false,
        extendedProps: {
          blockReason: b.reason || null,
          blockId: b.id,
          blockSpecialistId: b.specialist_id,
          blockStart: b.start_datetime,
          blockEnd: b.end_datetime,
        },
      }));
    },
    enabled: !!dateRange.start,
  });

  const { data: businessHours } = useQuery({
    queryKey: ["business-hours-calendar"],
    queryFn: async () => {
      const { data, error } = await supabase.from("business_hours").select("*").eq("active", true);
      if (error) throw error;
      return data ?? [];
    },
  });

  const slotMin = "07:00:00";
  const slotMax = "22:30:00";

  // Transform business_hours into FullCalendar businessHours format
  const fcBusinessHours = useMemo(() => {
    if (!businessHours || businessHours.length === 0) return undefined;
    return businessHours.map((h) => ({
      daysOfWeek: [h.weekday],
      startTime: h.start_time,
      endTime: h.end_time,
    }));
  }, [businessHours]);

  // Store the current visible date as YYYY-MM-DD string to avoid timezone comparison issues
  const [currentDateStr, setCurrentDateStr] = useState(() => format(new Date(), "yyyy-MM-dd"));

  const handleDatesSet = useCallback((arg: DatesSetArg) => {
    const newStart = arg.startStr;
    const newEnd = arg.endStr;
    setDateRange((prev) => {
      if (prev.start === newStart && prev.end === newEnd) return prev;
      return { start: newStart, end: newEnd };
    });
    // Resolve the visible date in the clinic timezone instead of UTC to avoid day shifts
    const dateStr = getDateKeyInTimezone(arg.view.currentStart, clinicTimezone);
    setCurrentDateStr((prev) => prev === dateStr ? prev : dateStr);
    const localDate = toCalendarDate(dateStr);
    setCurrentDate((prev) => {
      if (prev.getTime() === localDate.getTime()) return prev;
      return localDate;
    });
  }, [clinicTimezone]);

  const { count: pendingBillingsCount } = usePendingBillings();
  const lastPendingWarnRef = useRef<number>(0);

  const warnIfPending = useCallback(() => {
    if (pendingBillingsCount === 0) return false;
    // Only nag receptionists/admin — specialists already see the banner
    if (!(isReceptionist || isAdmin)) return false;
    const now = Date.now();
    if (now - lastPendingWarnRef.current < 60_000) return false;
    lastPendingWarnRef.current = now;
    toast.warning(
      `${pendingBillingsCount} ${pendingBillingsCount === 1 ? "cobrança pendente" : "cobranças pendentes"} — resolva antes de continuar.`,
      { duration: 5000 }
    );
    return true;
  }, [pendingBillingsCount, isReceptionist, isAdmin]);

  const handleDateClick = useCallback((specialistId: string | undefined) => (arg: DateClickArg) => {
    warnIfPending();
    const clickedDate = arg.date;
    const fmtOpts = { timeZone: clinicTimezone };
    const date = clickedDate.toLocaleDateString("sv-SE", fmtOpts);
    const startTime = clickedDate.toLocaleTimeString("pt-PT", { ...fmtOpts, hour: "2-digit", minute: "2-digit", hour12: false });
    setDialogDefaults({ date, startTime, endTime: startTime, specialistId });
    const jsEvent = arg.jsEvent;
    if (jsEvent) {
      let x = 0, y = 0;
      if ("touches" in jsEvent || "changedTouches" in jsEvent) {
        const te = jsEvent as unknown as TouchEvent;
        const touch = te.changedTouches?.[0] ?? te.touches?.[0];
        if (touch) { x = touch.clientX; y = touch.clientY; }
      } else {
        x = (jsEvent as MouseEvent).clientX;
        y = (jsEvent as MouseEvent).clientY;
      }
      if (x || y) setPopoverPos({ x, y });
    }
    setPopoverOpen(true);
  }, [clinicTimezone, warnIfPending]);

  const handleEventClick = useCallback((arg: EventClickArg) => {
    const id = arg.event.id;
    if (id.startsWith("block-")) {
      const ep = arg.event.extendedProps;
      setEditBlock({
        id: ep.blockId,
        specialist_id: ep.blockSpecialistId,
        start_datetime: ep.blockStart,
        end_datetime: ep.blockEnd,
        reason: ep.blockReason || null,
      });
      setBlockDialogOpen(true);
      return;
    }
    setSelectedAppointmentId(id);
    setAppointmentDialogOpen(true);
  }, []);

  const syncCalendars = useCallback((sourceId: string, arg: DatesSetArg) => {
    // Prevent infinite loop: skip if we already synced to this exact date
    const dateTs = arg.start.getTime();
    if (isSyncingRef.current || dateTs === lastSyncedDateRef.current) {
      // Still update our state if needed
      handleDatesSet(arg);
      return;
    }
    isSyncingRef.current = true;
    lastSyncedDateRef.current = dateTs;
    handleDatesSet(arg);
    calendarRefs.current.forEach((cal, id) => {
      if (id !== sourceId) {
        const api = cal.getApi();
        if (api.getDate().getTime() !== dateTs) {
          api.gotoDate(arg.start);
        }
      }
    });
    // Reset syncing flag asynchronously after React finishes processing
    requestAnimationFrame(() => {
      isSyncingRef.current = false;
    });
  }, [handleDatesSet]);

  const changeView = (v: ViewType) => {
    setCurrentView(v);
    // Only reset specialist filter for users who can see all specialists
    if (canSeeAllSpecialists) {
      setSelectedSpecialist("all");
    }
    calendarRefs.current.forEach((cal) => {
      cal.getApi().changeView(v);
    });
  };

  const navigateCalendars = (action: "prev" | "next" | "today") => {
    // Get a valid (mounted) calendar ref
    let api: any = null;
    for (const cal of calendarRefs.current.values()) {
      try {
        const a = cal.getApi();
        // Verify the calendar is actually mounted by checking its view is valid
        if (a && (a as any).el && document.contains((a as any).el)) {
          api = a;
          break;
        }
      } catch {
        // stale ref, skip
      }
    }
    if (api) {
      if (action === "prev") api.prev();
      else if (action === "next") api.next();
      else api.today();
    } else {
      // No calendar mounted (list view) — step based on current view
      const d = new Date(currentDateStr + "T12:00:00");
      const step = currentView === "timeGridWeek" ? 7 : currentView === "dayGridMonth" ? 30 : 1;
      let next: Date;
      if (action === "today") next = new Date();
      else if (action === "prev") next = addDays(d, -step);
      else next = addDays(d, step);
      setCurrentDate(next);
      setCurrentDateStr(format(next, "yyyy-MM-dd"));
    }
  };

  const goToDate = (date: Date) => {
    if (calendarRefs.current.size > 0) {
      calendarRefs.current.forEach((cal) => {
        cal.getApi().gotoDate(date);
      });
    } else {
      // No calendar mounted (list view) — update state directly
      setCurrentDate(date);
      setCurrentDateStr(format(date, "yyyy-MM-dd"));
    }
  };

  const getEventsForSpecialist = useCallback((specialistId: string) => {
    const events = (rawEvents ?? []).filter((e) => e.specialistId === specialistId);
    const blocks = (rawBlocks ?? []).filter((b) => b.specialistId === specialistId);
    return [...events, ...blocks];
  }, [rawEvents, rawBlocks]);

  const allEvents = useMemo(() => [...(rawEvents ?? []), ...(rawBlocks ?? [])], [rawEvents, rawBlocks]);

  const filteredEvents = useMemo(() => {
    if (selectedSpecialist === "all") return allEvents;
    return allEvents.filter((e) => e.specialistId === selectedSpecialist);
  }, [allEvents, selectedSpecialist]);

  const isLoading = specLoading || (!!dateRange.start && eventsLoading);

  // Date label
  const dateLabel = useMemo(() => {
    if (!currentDateStr) return "";
    const s = new Date(`${currentDateStr}T12:00:00`);
    if (currentView === "dayGridMonth") return format(s, "MMMM yyyy", { locale: pt }).replace(/^\w/, c => c.toUpperCase());
    if (currentView === "timeGridWeek") return format(s, "MMM yyyy", { locale: pt }).toUpperCase();
    return format(s, "dd MMM.", { locale: pt }).toUpperCase();
  }, [currentDateStr, currentView]);

  // Full week (Mon–Sun) containing the selected date
  const weekdayShortcuts = useMemo(() => {
    const selected = new Date(currentDateStr + "T12:00:00");
    const dayOfWeek = selected.getDay(); // 0=Sun, 1=Mon...
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = addDays(selected, mondayOffset);
    const today = new Date();

    return Array.from({ length: 7 }, (_, i) => {
      const d = addDays(monday, i);
      const dStr = format(d, "yyyy-MM-dd");
      const isToday = isSameDay(d, today);
      return {
        date: d,
        label: isToday ? "HOJE" : WEEKDAY_LABELS[d.getDay()],
        isToday,
        isActive: dStr === currentDateStr,
      };
    });
  }, [currentDateStr]);

  const selectedSpecName = useMemo(() => {
    if (selectedSpecialist === "all") return "Visão Geral";
    return specialists?.find((s) => s.user_id === selectedSpecialist)?.full_name ?? "—";
  }, [selectedSpecialist, specialists]);

  const calendarProps = {
    plugins: [luxonPlugin, timeGridPlugin, dayGridPlugin, interactionPlugin],
    initialView: currentView,
    selectable: false,
    eventClick: handleEventClick,
    timeZone: clinicTimezone,
    slotMinTime: slotMin,
    slotMaxTime: slotMax,
    slotDuration: "00:30:00" as const,
    slotLabelInterval: "00:30:00" as const,
    allDaySlot: false,
    firstDay: 1,
    locale: {
      code: "pt",
      direction: "ltr" as const,
      week: { dow: 1 },
      buttonText: { today: "Hoje", month: "Mês", week: "Semana", day: "Dia", list: "Lista" },
      weekText: "Sem",
      allDayText: "dia inteiro",
      moreLinkText: (n: number) => `mais +${n}`,
      noEventsText: "Sem eventos",
    },
    height: "auto" as const,
    expandRows: true,
    stickyHeaderDates: true,
    nowIndicator: true,
    businessHours: fcBusinessHours,
    eventTimeFormat: { hour: "2-digit" as const, minute: "2-digit" as const, hour12: false },
    slotLabelFormat: { hour: "2-digit" as const, minute: "2-digit" as const, hour12: false },
    buttonText: { today: "Hoje", week: "Semana", day: "Dia" },
    eventContent: (arg: any) => {
      const hasNotes = arg.event.extendedProps?.notes;
      const isBlock = arg.event.id?.startsWith("block-");
      const clientName = arg.event.extendedProps?.clientName ?? "";
      const serviceName = arg.event.extendedProps?.serviceName ?? "";
      const blockReason = arg.event.extendedProps?.blockReason ?? "";

      if (isBlock) {
        return (
          <div className="flex-1 min-w-0 overflow-hidden px-1.5 py-1">
            <div className="text-xs font-semibold leading-tight truncate">{arg.timeText}</div>
            <div className="text-xs leading-tight truncate">
              <span className="font-bold">BLOQUEADO</span>
              {blockReason && <span className="opacity-70 font-medium"> · {blockReason}</span>}
            </div>
          </div>
        );
      }

      return (
        <div className="flex items-start justify-between w-full h-full overflow-hidden px-1.5 py-1">
          <div className="flex-1 min-w-0 overflow-hidden">
            <div className="text-xs font-semibold leading-tight truncate">{arg.timeText}</div>
            <div className="text-xs leading-tight truncate">
              <span className="font-bold">{clientName}</span>
              {serviceName && <span className="opacity-50"> · {serviceName}</span>}
            </div>
          </div>
          {hasNotes && (
            <MessageSquare className="w-3 h-3 mt-0.5 flex-shrink-0 opacity-70" />
          )}
        </div>
      );
    },
    eventDidMount: (arg: any) => {
      const color = arg.event.backgroundColor;
      const isBlock = arg.event.id?.startsWith("block-");

      if (color && !isBlock) {
        // Extrai hue do hex
        const hex = color.replace("#", "");
        const r = parseInt(hex.slice(0, 2), 16) / 255;
        const g = parseInt(hex.slice(2, 4), 16) / 255;
        const b = parseInt(hex.slice(4, 6), 16) / 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h = 0;
        if (max !== min) {
          const d = max - min;
          if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
          else if (max === g) h = ((b - r) / d + 2) / 6;
          else h = ((r - g) / d + 4) / 6;
        }
        const hue = Math.round(h * 360);

        // Mapeia hue → paleta exata da LP (bg-X-50 / border-X-200 / text-X-600)
        // rose:   0-15    → #fff1f2 / #fecdd3 / #e11d48
        // orange: 16-45   → #fff7ed / #fed7aa / #ea580c
        // amber:  46-65   → #fffbeb / #fde68a / #d97706
        // yellow: 66-80   → #fefce8 / #fef08a / #ca8a04
        // green:  81-155  → #f0fdf4 / #bbf7d0 / #16a34a
        // teal:   156-185 → #f0fdfa / #99f6e4 / #0d9488
        // blue:   186-240 → #eff6ff / #bfdbfe / #2563eb
        // indigo: 241-270 → #eef2ff / #c7d2fe / #4338ca
        // violet: 271-290 → #f5f3ff / #ddd6fe / #7c3aed
        // purple: 291-320 → #faf5ff / #e9d5ff / #9333ea
        // pink:   321-359 → #fdf2f8 / #fbcfe8 / #db2777

        type Palette = [string, string, string]; // [bg, border, text]
        const palettes: Array<[number, number, Palette]> = [
          [0,   15,  ["#fff1f2", "#fecdd3", "#e11d48"]],  // rose
          [16,  45,  ["#fff7ed", "#fed7aa", "#ea580c"]],  // orange
          [46,  65,  ["#fffbeb", "#fde68a", "#d97706"]],  // amber
          [66,  80,  ["#fefce8", "#fef08a", "#ca8a04"]],  // yellow
          [81,  155, ["#f0fdf4", "#bbf7d0", "#16a34a"]],  // green
          [156, 185, ["#f0fdfa", "#99f6e4", "#0d9488"]],  // teal
          [186, 240, ["#eff6ff", "#bfdbfe", "#2563eb"]],  // blue
          [241, 270, ["#eef2ff", "#c7d2fe", "#4338ca"]],  // indigo
          [271, 290, ["#f5f3ff", "#ddd6fe", "#7c3aed"]],  // violet
          [291, 320, ["#faf5ff", "#e9d5ff", "#9333ea"]],  // purple
          [321, 359, ["#fdf2f8", "#fbcfe8", "#db2777"]],  // pink
        ];

        const match = palettes.find(([lo, hi]) => hue >= lo && hue <= hi);
        const [bg, border, text] = match ? match[2] : ["#f1f5f9", "#cbd5e1", "#475569"];

        // Sobrescreve as CSS variables que o FullCalendar usa internamente (daygrid/month)
        arg.el.style.setProperty("--fc-event-bg-color", bg);
        arg.el.style.setProperty("--fc-event-border-color", border);
        arg.el.style.setProperty("--fc-event-text-color", text);

        // Aplica inline direto também (timegrid/day/week)
        arg.el.style.backgroundColor = bg;
        arg.el.style.borderColor = border;
        arg.el.style.borderWidth = "1px";
        arg.el.style.borderStyle = "solid";
        arg.el.style.borderRadius = "4px";
        arg.el.style.boxShadow = "none";
        arg.el.style.color = text;

        // Força cor nos filhos (fc-event-main, fc-event-title, etc.)
        arg.el.querySelectorAll("*").forEach((child: HTMLElement) => {
          child.style.color = text;
        });
      }

      if (isBlock) {
        const reason = arg.event.extendedProps?.blockReason;
        arg.el.title = reason ? `Bloqueado · ${reason}` : "Horário bloqueado";
      } else if (arg.event.extendedProps?.notes) {
        arg.el.title = arg.event.extendedProps.notes;
      }
    },
    dayHeaderContent: (arg: any) => {
      return null;
    },
  };

  const showMultiCalendar = canSeeAllSpecialists && selectedSpecialist === "all" && specialists && specialists.length > 0;

  // Clear stale refs when switching between single/multi calendar modes
  const prevMultiRef = useRef(showMultiCalendar);
  if (prevMultiRef.current !== showMultiCalendar) {
    calendarRefs.current.clear();
    prevMultiRef.current = showMultiCalendar;
  }

  return (
    <div className="rounded-lg border border-border overflow-hidden bg-white">
      {/* Toolbar */}
      <div className="bg-card px-3 py-2 sticky top-0 z-20 border-b border-border">
        {/* ── DESKTOP (md+): single compact row ── */}
        <div className="hidden md:flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <button className="flex items-center gap-1 hover:bg-accent rounded px-1.5 py-1 transition-colors">
                <CalendarDays className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs font-semibold tracking-wide text-foreground">
                  {dateLabel}
                </span>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={currentDate}
                onSelect={(date) => {
                  if (date) {
                    if (currentView !== "timeGridDay") changeView("timeGridDay");
                    goToDate(date);
                  }
                }}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigateCalendars("prev")}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigateCalendars("next")}>
            <ChevronRight className="w-4 h-4" />
          </Button>

          {weekdayShortcuts.map((ws, i) => (
            <button
              key={i}
              onClick={() => {
                if (currentView !== "timeGridDay") changeView("timeGridDay");
                goToDate(ws.date);
              }}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded transition-all ${
                ws.isActive
                  ? "text-primary border-b-2 border-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {ws.label}
            </button>
          ))}

          <div className="flex-1" />

          <div className="flex items-center gap-0 bg-muted rounded-full p-0.5">
            <button
              className={`px-3.5 py-1 text-xs font-semibold rounded-full transition-all ${
                agendaView === "calendar" && currentView === "timeGridDay"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => { setAgendaView("calendar"); changeView("timeGridDay"); }}
            >
              Dia
            </button>
            <button
              className={`px-3.5 py-1 text-xs font-semibold rounded-full transition-all ${
                agendaView === "calendar" && currentView === "timeGridWeek"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => { setAgendaView("calendar"); changeView("timeGridWeek"); }}
            >
              Semana
            </button>
            <button
              className={`px-3.5 py-1 text-xs font-semibold rounded-full transition-all ${
                agendaView === "calendar" && currentView === "dayGridMonth"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => { setAgendaView("calendar"); changeView("dayGridMonth"); }}
            >
              Mês
            </button>
            {canSeeList && (
              <button
                className={`px-3.5 py-1 text-xs font-semibold rounded-full transition-all flex items-center gap-1 ${
                  agendaView === "list"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setAgendaView("list")}
              >
                <List className="w-3 h-3" />
                Lista
              </button>
            )}
          </div>

          {canSeeAllSpecialists && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs font-medium">
                  {selectedSpecialist === "all" ? (
                    <Users className="w-4 h-4 text-primary" />
                  ) : (
                    <User className="w-4 h-4 text-primary" />
                  )}
                  <span>{selectedSpecName}</span>
                  <ChevronRight className="w-3 h-3 text-muted-foreground rotate-90" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-1" align="end">
                <button
                  className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm rounded-md hover:bg-accent transition-colors"
                  onClick={() => setSelectedSpecialist("all")}
                >
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span className="flex-1 text-left">Todos</span>
                  {selectedSpecialist === "all" && <Check className="w-4 h-4 text-primary" />}
                </button>
                {(specialists ?? []).map((spec) => (
                  <button
                    key={spec.user_id}
                    className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm rounded-md hover:bg-accent transition-colors"
                    onClick={() => setSelectedSpecialist(spec.user_id)}
                  >
                    <Avatar className="w-5 h-5">
                      <AvatarImage src={spec.avatar_url || undefined} />
                      <AvatarFallback className="text-[9px] bg-primary/10 text-primary">
                        {(spec.full_name || "?").split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="flex-1 text-left truncate">{spec.full_name}</span>
                    {selectedSpecialist === spec.user_id && <Check className="w-4 h-4 text-primary" />}
                  </button>
                ))}
              </PopoverContent>
            </Popover>
          )}

          <Button size="sm" className="h-8 gap-1.5" onClick={() => { setDialogDefaults({}); setDialogOpen(true); }}>
            <Plus className="w-3.5 h-3.5" />
            Adicionar
          </Button>
        </div>

        {/* ── MOBILE (<md): 3-row stacked layout ── */}
        <div className="md:hidden space-y-1.5">
          {/* Row 1: Calendar picker, Date label, spacer, < > */}
          <div className="flex items-center gap-1">
            <Popover>
              <PopoverTrigger asChild>
                <button className="flex items-center gap-1 hover:bg-accent rounded px-1.5 py-1 transition-colors">
                  <CalendarDays className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs font-semibold tracking-wide text-foreground">
                    {dateLabel}
                  </span>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={currentDate}
                  onSelect={(date) => {
                    if (date) {
                      if (currentView !== "timeGridDay") changeView("timeGridDay");
                      goToDate(date);
                    }
                  }}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
            <div className="flex-1" />
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigateCalendars("prev")}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigateCalendars("next")}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Row 2: Weekday shortcuts */}
          <div className="flex items-center gap-0.5 overflow-x-auto scrollbar-none">
            {weekdayShortcuts.map((ws, i) => (
              <button
                key={i}
                onClick={() => {
                  if (currentView !== "timeGridDay") changeView("timeGridDay");
                  goToDate(ws.date);
                }}
                className={`px-2 py-1 text-[11px] font-semibold rounded transition-all shrink-0 ${
                  ws.isActive
                    ? "text-primary border-b-2 border-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {ws.label}
              </button>
            ))}
          </div>

          {/* Row 3: View toggle + Specialist + Add */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-0 bg-muted rounded-full p-0.5">
              <button
                className={`px-3 py-1 text-xs font-semibold rounded-full transition-all ${
                  agendaView === "calendar" && currentView === "timeGridDay"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => { setAgendaView("calendar"); changeView("timeGridDay"); }}
              >
                Dia
              </button>
              <button
                className={`px-3 py-1 text-xs font-semibold rounded-full transition-all ${
                  agendaView === "calendar" && currentView === "timeGridWeek"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => { setAgendaView("calendar"); changeView("timeGridWeek"); }}
              >
                Semana
              </button>
              {canSeeList && (
                <button
                  className={`px-3 py-1 text-xs font-semibold rounded-full transition-all flex items-center gap-1 ${
                    agendaView === "list"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={() => setAgendaView("list")}
                >
                  <List className="w-3 h-3" />
                  Lista
                </button>
              )}
            </div>

            {canSeeAllSpecialists && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs font-medium">
                    {selectedSpecialist === "all" ? (
                      <Users className="w-4 h-4 text-primary" />
                    ) : (
                      <User className="w-4 h-4 text-primary" />
                    )}
                    <ChevronRight className="w-3 h-3 text-muted-foreground rotate-90" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-1" align="start">
                  <button
                    className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm rounded-md hover:bg-accent transition-colors"
                    onClick={() => setSelectedSpecialist("all")}
                  >
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span className="flex-1 text-left">Todos</span>
                    {selectedSpecialist === "all" && <Check className="w-4 h-4 text-primary" />}
                  </button>
                  {(specialists ?? []).map((spec) => (
                    <button
                      key={spec.user_id}
                      className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm rounded-md hover:bg-accent transition-colors"
                      onClick={() => setSelectedSpecialist(spec.user_id)}
                    >
                      <Avatar className="w-5 h-5">
                        <AvatarImage src={spec.avatar_url || undefined} />
                        <AvatarFallback className="text-[9px] bg-primary/10 text-primary">
                          {(spec.full_name || "?").split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="flex-1 text-left truncate">{spec.full_name}</span>
                      {selectedSpecialist === spec.user_id && <Check className="w-4 h-4 text-primary" />}
                    </button>
                  ))}
                </PopoverContent>
              </Popover>
            )}

            <div className="flex-1" />
            <Button size="sm" className="h-8 gap-1.5" onClick={() => { setDialogDefaults({}); setDialogOpen(true); }}>
              <Plus className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {agendaView === "list" ? (
        <AppointmentsListView specialistId={selectedSpecialist} selectedDate={currentDateStr} />
      ) : (
        <>
          {/* Calendar(s) */}
          <div className="relative">
            {isLoading && (
              <div className="absolute inset-0 bg-background flex items-center justify-center z-20 rounded-b-lg">
                <LogoDraw size={32} loopCount={2} drawDuration={1200} fillDuration={400} fillDelay={150} />
              </div>
            )}
            <div className={cn("transition-opacity duration-300", isLoading ? "opacity-0" : "opacity-100")}>

            {showMultiCalendar && currentView === "timeGridDay" ? (
              <div className="overflow-x-auto w-full">
                <div
                  className="grid"
                  style={{
                    gridTemplateColumns: `repeat(${specialists?.length || 1}, minmax(min(400px, 100%), 1fr))`,
                  }}
                >
                  {(specialists ?? []).map((spec, idx) => (
                    <div key={spec.user_id} className="bg-card [&:not(:last-child)]:border-r border-border">
                      <div className="flex items-center gap-2.5 px-3 py-3 border-b border-border">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={spec.avatar_url || undefined} alt={spec.full_name} />
                          <AvatarFallback className="text-xs bg-primary/10 text-primary">
                            {(spec.full_name || "?").split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-semibold text-foreground">{spec.full_name || "Sem nome"}</span>
                      </div>
                      <FullCalendar
                        {...calendarProps}
                        ref={(ref) => { if (ref) calendarRefs.current.set(spec.user_id, ref); }}
                        events={getEventsForSpecialist(spec.user_id)}
                        datesSet={(arg) => syncCalendars(spec.user_id, arg)}
                        dateClick={handleDateClick(spec.user_id)}
                        headerToolbar={false}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-card">
                <FullCalendar
                  {...{
                    ...calendarProps,
                    dayHeaderContent: currentView === "timeGridWeek" ? (arg: any) => {
                      const d = arg.date;
                      const isToday = new Date().toDateString() === d.toDateString();
                      const dayName = d.toLocaleDateString("pt-PT", { weekday: "long" });
                      const dayNum = d.getDate();
                      const month = d.toLocaleDateString("pt-PT", { month: "short" }).replace(".", "");
                      return (
                        <div className={`flex flex-col items-center py-1 ${isToday ? "text-primary" : "text-muted-foreground"}`}>
                          <span className="text-[11px] font-normal tracking-wide">{dayName}</span>
                          <span className={`text-xl font-bold leading-tight ${isToday ? "text-primary" : "text-foreground"}`}>{dayNum} {month}.</span>
                        </div>
                      );
                    } : () => null,
                  }}
                  ref={(ref) => { if (ref) calendarRefs.current.set("single", ref); }}
                  events={filteredEvents}
                  datesSet={handleDatesSet}
                  dateClick={handleDateClick(selectedSpecialist === "all" ? undefined : selectedSpecialist)}
                  headerToolbar={false}
                />
              </div>
            )}
            </div>
          </div>
        </>
      )}
      <SelectionPopover
        open={popoverOpen}
        onOpenChange={setPopoverOpen}
        position={popoverPos}
        onNewAppointment={() => setDialogOpen(true)}
        onBlockTime={() => { setEditBlock(null); setBlockDialogOpen(true); }}
      />

      <QuickAppointmentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        defaults={dialogDefaults}
      />

      <BlockDialog
        open={blockDialogOpen}
        onOpenChange={(v) => { setBlockDialogOpen(v); if (!v) setEditBlock(null); }}
        defaults={dialogDefaults}
        editBlock={editBlock}
      />

      <AppointmentDetailDialog
        appointmentId={selectedAppointmentId}
        open={appointmentDialogOpen}
        onOpenChange={setAppointmentDialogOpen}
      />
    </div>
  );
}
