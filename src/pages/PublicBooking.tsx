import { useState, useMemo, useEffect, useCallback } from "react";
import { getTimezone } from "@/lib/date";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

import { toast } from "sonner";
import {
  Loader2,
  Check,
  Clock,
  ArrowLeft,
  ChevronRight,
  Sparkles,
  Pencil,
  Instagram,
  Facebook,
  Globe,
  CalendarDays,
} from "lucide-react";

import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isAfter,
  isBefore,
  startOfDay,
  addMonths,
  subMonths,
  getDay,
} from "date-fns";
import { pt } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { BookingEditSidebar, type BookingPageSettings } from "@/components/booking/BookingEditSidebar";
import { useNavigate } from "react-router-dom";

type Step = "services" | "specialist" | "datetime" | "confirm" | "done";

interface ServiceItem {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number | null;
  price: number | null;
  color: string | null;
  show_on_booking_page: boolean;
  show_price_on_booking_page: boolean;
  category_id: string | null;
}

interface CategoryItem {
  id: string;
  name: string;
  color: string | null;
  display_order: number;
}

interface Specialist {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
}

const publicBookingClient = createClient<Database>(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      storageKey: "public-booking-anon",
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
    },
  },
);

const PublicBooking = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const isEmbed = new URLSearchParams(window.location.search).get("embed") === "true";
  const [editOpen, setEditOpen] = useState(false);
  const [step, setStep] = useState<Step>("services");
  const [serviceId, setServiceId] = useState("");
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [specialistId, setSpecialistId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [calMonth, setCalMonth] = useState(new Date());
  const [selectedSlot, setSelectedSlot] = useState<{
    start: string;
    end: string;
    specialist_id: string;
    specialist_name?: string;
  } | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [gender, setGender] = useState("");
  const [nif, setNif] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptMarketing, setAcceptMarketing] = useState(false);
  const [notifyChannels, setNotifyChannels] = useState({ whatsapp: true, email: true, sms: true });
  const [loading, setLoading] = useState(false);
  const [appointmentId, setAppointmentId] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, boolean>>({});

  // Fetch booking page settings
  const { data: pageSettings } = useQuery({
    queryKey: ["booking-page-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("booking_page_settings").select("*").limit(1).maybeSingle();
      if (error) throw error;
      return data as BookingPageSettings | null;
    },
  });

  // Inject tracking code (e.g. Google Analytics, Meta Pixel) into the page
  // Skip when embedded via iframe to avoid cookie widgets overlaying the embed
  useEffect(() => {
    if (!pageSettings?.tracking_code || isEmbed) return;
    const container = document.createElement("div");
    container.innerHTML = pageSettings.tracking_code;
    const scripts = container.querySelectorAll("script");
    const injected: HTMLScriptElement[] = [];
    scripts.forEach((orig) => {
      const s = document.createElement("script");
      // Copy attributes
      Array.from(orig.attributes).forEach((attr) => s.setAttribute(attr.name, attr.value));
      if (orig.textContent) s.textContent = orig.textContent;
      document.body.appendChild(s);
      injected.push(s);
    });
    // Also inject non-script elements (e.g. <noscript>, <img> pixels)
    const nonScripts = container.querySelectorAll(":not(script)");
    const injectedEls: Element[] = [];
    nonScripts.forEach((el) => {
      if (el.parentElement === container) {
        document.body.appendChild(el);
        injectedEls.push(el);
      }
    });
    return () => {
      injected.forEach((s) => s.remove());
      injectedEls.forEach((el) => el.remove());
    };
  }, [pageSettings?.tracking_code]);

  // Fetch all services
  const { data: allServices, isLoading: servicesLoading } = useQuery({
    queryKey: ["public-services-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select(
          "id, name, description, duration_minutes, price, color, show_on_booking_page, show_price_on_booking_page, category_id",
        )
        .eq("active", true)
        .order("display_order")
        .order("name");
      if (error) throw error;
      return (data ?? []) as ServiceItem[];
    },
  });

  // Fetch service categories
  const { data: serviceCategories } = useQuery({
    queryKey: ["public-service-categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("service_categories").select("*").order("display_order");
      if (error) throw error;
      return (data ?? []) as CategoryItem[];
    },
  });

  // Fetch ALL service↔specialist mappings to filter services by specialist
  const { data: allServiceSpecialists } = useQuery({
    queryKey: ["all-service-specialists-public"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_specialists")
        .select("service_id, specialist_id");
      if (error) throw error;
      return data ?? [];
    },
  });

  // Fetch clinic settings via RPC (bypasses RLS for anon users)
  const { data: clinicSettings } = useQuery({
    queryKey: ["clinic-settings-public"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("public_clinic_info");
      if (error) throw error;
      return data as { clinic_name: string; allow_multi_service_booking: boolean; timezone: string; booking_url: string; phone: string } | null;
    },
  });

  const allowMultiService = clinicSettings?.allow_multi_service_booking === true;
  const allowSpecialistChoice = pageSettings?.allow_specialist_choice ?? true;
  const categoriesExpanded = pageSettings?.categories_expanded ?? false;

  // Filter services: if a specialist is selected, only show services they can perform
  const filteredServices = useMemo(() => {
    if (!allServices) return [];
    const svcs = allServices.filter((s) => s.show_on_booking_page !== false);
    if (!specialistId || !allServiceSpecialists) return svcs;

    // Build set of service IDs this specialist can perform
    const specServiceIds = new Set(
      allServiceSpecialists
        .filter((ss) => ss.specialist_id === specialistId)
        .map((ss) => ss.service_id)
    );

    // If specialist has no restrictions (no entries), show all services
    if (specServiceIds.size === 0) return svcs;

    return svcs.filter((s) => specServiceIds.has(s.id));
  }, [allServices, specialistId, allServiceSpecialists]);

  // Organize by category
  const { uncategorized, categories } = useMemo(() => {
    if (!filteredServices.length) return { uncategorized: [], categories: [] };
    const catMap = new Map<string, ServiceItem[]>();
    const uncategorized: ServiceItem[] = [];
    filteredServices.forEach((s) => {
      if (s.category_id) {
        if (!catMap.has(s.category_id)) catMap.set(s.category_id, []);
        catMap.get(s.category_id)!.push(s);
      } else {
        uncategorized.push(s);
      }
    });
    const cats = (serviceCategories ?? [])
      .filter((c) => catMap.has(c.id))
      .map((c) => ({ name: c.name, services: catMap.get(c.id)! }));
    return { uncategorized, categories: cats };
  }, [filteredServices, serviceCategories]);

  const primaryServiceId = allowMultiService ? (selectedServiceIds[0] ?? "") : serviceId;

  const selectedServices = useMemo(() => {
    if (!allServices) return [];
    const ids = allowMultiService ? selectedServiceIds : serviceId ? [serviceId] : [];
    return ids.map((id) => allServices.find((s) => s.id === id)).filter(Boolean) as ServiceItem[];
  }, [allServices, allowMultiService, selectedServiceIds, serviceId]);

  const totalDuration = useMemo(
    () => selectedServices.reduce((sum, s) => sum + (s.duration_minutes || 30), 0),
    [selectedServices],
  );
  const totalPrice = useMemo(() => selectedServices.reduce((sum, s) => sum + (s.price || 0), 0), [selectedServices]);

  // Fetch specialists for selected service
  // Fetch specialist restrictions from service_specialists (service config)
  const { data: serviceSpecialists, isLoading: loadingServiceSpecialists } = useQuery({
    queryKey: ["service-specialists-public", primaryServiceId],
    queryFn: async () => {
      const { data, error } = await publicBookingClient
        .from("service_specialists")
        .select("specialist_id")
        .eq("service_id", primaryServiceId);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!primaryServiceId,
  });

  // Fetch specialist_services (specialist config in Equipa) to know which specialists perform this service
  const { data: specialistServicesForService, isLoading: loadingSpecialistServices } = useQuery({
    queryKey: ["specialist-services-for-service-public", primaryServiceId],
    queryFn: async () => {
      const { data, error } = await publicBookingClient
        .from("specialist_services")
        .select("specialist_id")
        .eq("service_id", primaryServiceId);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!primaryServiceId,
  });

  const { data: allSpecialists } = useQuery({
    queryKey: ["specialists-public"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("public_specialists");
      if (error) throw error;
      return (data ?? []) as Specialist[];
    },
  });

  // Fetch business hours to know which weekdays the clinic is open
  const { data: businessHours } = useQuery({
    queryKey: ["business-hours-public"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("business_hours")
        .select("weekday, active");
      if (error) throw error;
      return data ?? [];
    },
  });

  // Set of weekdays (0=Sun..6=Sat) that are closed
  const closedWeekdays = useMemo(() => {
    if (!businessHours) return new Set<number>();
    const activeWeekdays = new Set(businessHours.filter((h) => h.active).map((h) => h.weekday));
    const allDays = [0, 1, 2, 3, 4, 5, 6];
    return new Set(allDays.filter((d) => !activeWeekdays.has(d)));
  }, [businessHours]);

  const availableSpecialists = useMemo(() => {
    if (!allSpecialists) return [];
    let filtered = allSpecialists;

    // Filter by service_specialists (service-level config)
    if (serviceSpecialists && serviceSpecialists.length > 0) {
      const ids = new Set(serviceSpecialists.map((ss) => ss.specialist_id));
      filtered = filtered.filter((s) => ids.has(s.user_id));
    }

    // Filter by specialist_services (specialist-level config in Equipa)
    // If there are ANY entries in specialist_services for this service, only those specialists can perform it
    if (specialistServicesForService && specialistServicesForService.length > 0) {
      const ids = new Set(specialistServicesForService.map((ss) => ss.specialist_id));
      filtered = filtered.filter((s) => ids.has(s.user_id));
    }

    return filtered;
  }, [allSpecialists, serviceSpecialists, specialistServicesForService]);

  // Fetch slots via edge function (bypasses RLS for public access)
  const dateStr = selectedDate ? format(selectedDate, "yyyy-MM-dd") : "";
  const { data: slotsData, isLoading: slotsLoading } = useQuery({
    queryKey: ["availability", primaryServiceId, dateStr, specialistId, totalDuration],
    queryFn: async () => {
      const params = new URLSearchParams({
        service_id: primaryServiceId!,
        date: dateStr,
      });
      if (specialistId) params.set("specialist_id", specialistId);
      if (allowMultiService && selectedServiceIds.length > 1 && totalDuration) {
        params.set("duration", String(totalDuration));
      }
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/availability?${params}`;
      const res = await fetch(url, {
        headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
      });
      if (!res.ok) throw new Error("Erro ao buscar disponibilidade");
      return res.json();
    },
    enabled: !!primaryServiceId && !!dateStr && step === "datetime",
  });

  const slots = slotsData?.slots;
  const clinicTimezone = slotsData?.timezone;

  const groupedSlots = useMemo(() => {
    if (!slots) return { morning: [], afternoon: [], evening: [] };
    const morning: typeof slots = [];
    const afternoon: typeof slots = [];
    const evening: typeof slots = [];
    slots.forEach((s) => {
      // Use local_time from API (clinic timezone) if available, otherwise fallback
      let h: number;
      if (s.local_time) {
        h = parseInt(s.local_time.split(":")[0], 10);
      } else if (clinicTimezone) {
        h = parseInt(
          new Date(s.start).toLocaleTimeString("en-US", { timeZone: clinicTimezone, hour12: false, hour: "2-digit" }),
          10,
        );
      } else {
        h = new Date(s.start).getHours();
      }
      if (h < 12) morning.push(s);
      else if (h < 18) afternoon.push(s);
      else evening.push(s);
    });
    return { morning, afternoon, evening };
  }, [slots, clinicTimezone]);

  const clinicName = clinicSettings?.clinic_name || "Clínica";

  const formatPrice = (price: number | null) => {
    if (!price || price <= 0) return null;
    return `${Number(price).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} R$`;
  };

  const formatDuration = (mins: number | null) => {
    if (!mins) return null;
    if (mins >= 60) {
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      return m > 0 ? `${h}h${String(m).padStart(2, "0")}` : `${h}h`;
    }
    return `${mins}min`;
  };

  // Service selection handlers
  const handleServiceSelect = (svcId: string) => {
    setServiceId(svcId);
    goToSpecialistOrDatetime(svcId);
  };

  const handleMultiServiceToggle = (svcId: string) => {
    setSelectedServiceIds((prev) => (prev.includes(svcId) ? prev.filter((id) => id !== svcId) : [...prev, svcId]));
  };

  const handleMultiServiceContinue = () => {
    if (selectedServiceIds.length === 0) {
      toast.error("Selecione pelo menos um serviço.");
      return;
    }
    goToSpecialistOrDatetime(selectedServiceIds[0]);
  };

  const goToSpecialistOrDatetime = (svcId: string) => {
    // Check if specialist step is needed
    // Will be evaluated after specialists are loaded — handled by effect
    setStep("specialist");
  };

  // Auto-skip specialist step only when data is fully loaded
  useEffect(() => {
    if (step !== "specialist") return;
    if (loadingServiceSpecialists || loadingSpecialistServices) return;
    if (!allSpecialists) return;
    const specs = availableSpecialists;
    // If no specialists available, stay on step to show message
    if (specs.length === 0) return;
    if (specs.length === 1 || !allowSpecialistChoice) {
      setSpecialistId(specs.length === 1 ? specs[0].user_id : null);
      setStep("datetime");
    }
  }, [step, availableSpecialists, allSpecialists, allowSpecialistChoice, loadingServiceSpecialists, loadingSpecialistServices]);

  const handleBook = async () => {
    const errors: Record<string, boolean> = {};
    if (!name) errors.name = true;
    if (!phone) errors.phone = true;
    if (pageSettings?.require_email && !email) errors.email = true;
    if (pageSettings?.require_gender && !gender) errors.gender = true;
    if (pageSettings?.require_birth_date && (!birthDate || !/^\d{4}-\d{2}-\d{2}$/.test(birthDate))) errors.birthDate = true;
    if (pageSettings?.require_nif && !cpf) errors.cpf = true;
    if (!acceptTerms) errors.acceptTerms = true;

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      toast.error("Preencha todos os campos obrigatórios.");
      // Focus first invalid field
      const firstKey = Object.keys(errors)[0];
      setTimeout(() => {
        const el = document.querySelector(`[data-field="${firstKey}"]`) as HTMLElement;
        el?.focus();
      }, 50);
      return;
    }
    setValidationErrors({});

    if (!selectedSlot) {
      toast.error("Selecione um horário.");
      return;
    }
    setLoading(true);
    try {
      const bookingEmail = email || `${phone.replace(/\D/g, "")}@booking.local`;
      const { data: clientId, error: upsertClientError } = await publicBookingClient.rpc("upsert_booking_client", {
        p_full_name: name,
        p_phone: phone,
        p_email: bookingEmail,
        p_opt_in: acceptMarketing,
        p_birth_date: birthDate || null,
        p_citizen_card_number: nif || null,
        p_notify_whatsapp: notifyChannels.whatsapp,
        p_notify_email: notifyChannels.email,
        p_notify_sms: notifyChannels.sms,
      } as any);
      if (upsertClientError) throw upsertClientError;
      if (!clientId) throw new Error("Não foi possível registar o cliente.");

      const allSelectedIds = allowMultiService ? selectedServiceIds : [serviceId];
      const primarySvcId = allSelectedIds[0];
      if (!primarySvcId) throw new Error("Selecione um serviço para concluir a marcação.");

      const { data: apptData, error: apptError } = await publicBookingClient.rpc("create_public_booking", {
        p_client_id: clientId,
        p_service_id: primarySvcId,
        p_specialist_id: selectedSlot.specialist_id,
        p_start_time: selectedSlot.start,
        p_end_time: selectedSlot.end,
        p_notes: notes || null,
        p_service_ids: allSelectedIds,
      });
      if (apptError) throw apptError;
      if (!apptData) throw new Error("Erro ao criar agendamento.");
      const booking = apptData as unknown as { id: string; cancellation_token: string };
      // Send raw UTC to webhook — the Edge Function normalizes to clinic timezone
      const notificationStartTime = selectedSlot.start;

      const svc = allServices?.find((s) => s.id === primarySvcId);
      // Fire webhook via edge function (server-side, bypasses RLS)
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;
      fetch(`${supabaseUrl}/functions/v1/fire-booking-webhook`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": anonKey,
        },
        body: JSON.stringify({
          event: "confirmed",
          appointment_id: booking.id,
          cancellation_token: booking.cancellation_token,
          client: { full_name: name, phone, email },
          client_id: clientId,
          service_id: primarySvcId,
          service_name: svc?.name ?? null,
          start_time: notificationStartTime,
          specialist_name: selectedSlot.specialist_name || (selectedSlot.specialist_id ? allSpecialists?.find((sp: any) => sp.user_id === selectedSlot.specialist_id)?.full_name : null),
          specialist_id: selectedSlot.specialist_id || null,
          source: "client",
        }),
      }).catch((err) => console.error("[public-booking] webhook dispatch failed:", err));

      setAppointmentId(booking.id);
      setStep("done");
    } catch (err: any) {
      toast.error(err.message || "Erro ao agendar.");
    } finally {
      setLoading(false);
    }
  };

  const resetAll = () => {
    setStep("services");
    setServiceId("");
    setAppointmentId(null);
    setSelectedServiceIds([]);
    setSpecialistId(null);
    setSelectedDate(undefined);
    setSelectedSlot(null);
    setName("");
    setEmail("");
    setPhone("");
    setNotes("");
    setGender("");
    setNif("");
    setBirthDate("");
    setAcceptTerms(false);
    setAcceptMarketing(false);
    setValidationErrors({});
  };

  const goBack = () => {
    switch (step) {
      case "specialist":
        setStep("services");
        setSpecialistId(null);
        if (!allowMultiService) setServiceId("");
        break;
      case "datetime":
        setStep(availableSpecialists.length > 1 && allowSpecialistChoice ? "specialist" : "services");
        setSelectedDate(undefined);
        setSelectedSlot(null);
        break;
      case "confirm":
        setStep("datetime");
        setSelectedSlot(null);
        break;
    }
  };

  // ── Service item renderer ──
  const renderServiceItem = (s: ServiceItem) => {
    if (allowMultiService) {
      const isChecked = selectedServiceIds.includes(s.id);
      return (
        <button
          key={s.id}
          onClick={() => handleMultiServiceToggle(s.id)}
          className={cn(
            "w-full flex items-center gap-3 px-5 py-3.5 hover:bg-muted/40 transition-colors text-left",
            isChecked && "bg-primary/5",
          )}
        >
          <Checkbox checked={isChecked} className="pointer-events-none" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">{s.name}</p>
            {s.description && (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{s.description}</p>
            )}
            <div className="flex items-center gap-2 mt-0.5">
              {s.duration_minutes && (
                <span className="text-xs text-muted-foreground">
                  <Clock className="w-3 h-3 inline mr-0.5" />
                  {formatDuration(s.duration_minutes)}
                </span>
              )}
              {s.show_price_on_booking_page && formatPrice(s.price) && (
                <span className="text-xs text-muted-foreground">· {formatPrice(s.price)}</span>
              )}
            </div>
          </div>
        </button>
      );
    }

    return (
      <button
        key={s.id}
        onClick={() => handleServiceSelect(s.id)}
        className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-muted/40 transition-colors text-left"
      >
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">{s.name}</p>
          {s.description && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{s.description}</p>
          )}
          {s.duration_minutes && (
            <span className="text-xs text-muted-foreground">
              <Clock className="w-3 h-3 inline mr-0.5" />
              {formatDuration(s.duration_minutes)}
            </span>
          )}
        </div>
        {s.show_price_on_booking_page && formatPrice(s.price) && (
          <span className="text-xs text-muted-foreground shrink-0 ml-4">{formatPrice(s.price)}</span>
        )}
      </button>
    );
  };

  const bgColor = pageSettings?.background_color || "#f5f0eb";
  const pageTitle = pageSettings?.title || "Agendar";
  const logoUrl = pageSettings?.logo_url;
  const coverUrl = pageSettings?.cover_url;

  // Calendar: days in month
  const monthStart = startOfMonth(calMonth);
  const monthEnd = endOfMonth(calMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const today = startOfDay(new Date());

  // Determine first weekday for padding (Monday = 0)
  const firstDayOfWeek = (getDay(monthStart) + 6) % 7; // convert Sun=0 to Mon=0

  return (
    <div className={cn("min-h-screen", isEmbed && "min-h-0")} style={{ backgroundColor: isEmbed ? "transparent" : bgColor }}>
      {/* ── Admin Bar ── */}
      {!isEmbed && user && isAdmin && (
        <div className="sticky top-0 z-50 bg-foreground/95 backdrop-blur text-background flex items-center justify-between px-4 py-2.5">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-1.5 text-sm font-medium hover:opacity-80 transition-opacity"
          >
            <ArrowLeft className="w-4 h-4" /> Agenda
          </button>
          <button
            onClick={() => setEditOpen(true)}
            className="flex items-center gap-1.5 text-sm font-medium hover:opacity-80 transition-opacity"
          >
            <Pencil className="w-4 h-4" /> Editar
          </button>
        </div>
      )}

      {/* ── Cover / Hero ── */}
      {!isEmbed && (
      <div className="relative" style={{ maxWidth: 1090, margin: "0 auto" }}>
        {coverUrl ? (
          <div className="relative h-[260px] overflow-hidden rounded-b-[18px]">
            <img src={coverUrl} alt="Capa" className="w-full h-full object-cover" />
            {/* Social icons on top-right of cover */}
            <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
              {pageSettings?.social_instagram && (
                <a
                  href={pageSettings.social_instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-black/40 backdrop-blur flex items-center justify-center text-white hover:bg-black/60 transition-colors"
                >
                  <Instagram className="w-4 h-4" />
                </a>
              )}
              {pageSettings?.social_facebook && (
                <a
                  href={pageSettings.social_facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-black/40 backdrop-blur flex items-center justify-center text-white hover:bg-black/60 transition-colors"
                >
                  <Facebook className="w-4 h-4" />
                </a>
              )}
              {pageSettings?.social_website && (
                <a
                  href={pageSettings.social_website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-black/40 backdrop-blur flex items-center justify-center text-white hover:bg-black/60 transition-colors"
                >
                  <Globe className="w-4 h-4" />
                </a>
              )}
            </div>
            {/* Logo centered on cover */}
            <div className="absolute inset-0 flex items-center justify-center">
              <img
                src={logoUrl || logoFull}
                alt={clinicName}
                className="h-10 sm:h-14 object-contain invert drop-shadow-lg"
              />
            </div>
          </div>
        ) : (
          <div className="relative bg-gradient-to-b from-muted-foreground/80 to-muted-foreground/60 h-[260px] flex items-center justify-center px-4 rounded-b-[18px]">
            {/* Social icons top-right */}
            <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
              {pageSettings?.social_instagram && (
                <a
                  href={pageSettings.social_instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                >
                  <Instagram className="w-4 h-4" />
                </a>
              )}
              {pageSettings?.social_facebook && (
                <a
                  href={pageSettings.social_facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                >
                  <Facebook className="w-4 h-4" />
                </a>
              )}
              {pageSettings?.social_website && (
                <a
                  href={pageSettings.social_website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                >
                  <Globe className="w-4 h-4" />
                </a>
              )}
            </div>
            <img src={logoUrl || logoFull} alt={clinicName} className="h-10 sm:h-14 object-contain invert" />
          </div>
        )}
      </div>
      )}

      {/* ── Content ── */}
      <main className={cn("relative pb-12 z-10", isEmbed ? "pt-0" : "-mt-14")}>
        <div className={cn("mx-auto", isEmbed ? "w-full" : "max-w-xl px-4")}>
          <div className={cn("bg-card overflow-hidden", isEmbed ? "rounded-none border-0 shadow-none" : "rounded-xl shadow-sm border border-border")}>
            {/* Header with back */}
            {step !== "services" && step !== "done" && (
              <div className="flex items-center gap-3 px-6 pt-5 pb-2">
                <button onClick={goBack} className="text-muted-foreground hover:text-foreground transition-colors">
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h2 className="text-base font-semibold text-foreground">{pageTitle}</h2>
                  <p className="text-xs text-muted-foreground">
                    {step === "specialist" && "Escolha um profissional"}
                    {step === "datetime" && "Escolha data e horário"}
                    {step === "confirm" && "Confirme os dados"}
                  </p>
                </div>
              </div>
            )}

            {/* ── Step: Services (Accordion) ── */}
            {step === "services" && (
              <div className="pb-2">
                <div className="text-center px-6 pt-6 pb-4">
                  <h2 className="text-base font-semibold text-foreground">{pageTitle}</h2>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {allowMultiService ? "Escolha os serviços" : "Escolha um serviço"}
                  </p>
                </div>

                {servicesLoading ? (
                  <div className="px-6 space-y-3 pb-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <Skeleton key={i} className="h-14 rounded-lg" />
                    ))}
                  </div>
                ) : (
                  <>
                    {/* Uncategorized services — loose at top */}
                    {uncategorized.length > 0 && (
                      <div className="divide-y divide-border">{uncategorized.map(renderServiceItem)}</div>
                    )}

                    {/* Categorized services — accordion */}
                    {categories.length > 0 && (
                      <Accordion
                        type="multiple"
                        defaultValue={categoriesExpanded ? categories.map((c) => c.name) : []}
                        className="px-0"
                      >
                        {categories.map(({ name, services }) => (
                          <AccordionItem key={name} value={name} className="border-b-0">
                            <AccordionTrigger className="px-5 py-3.5 hover:no-underline hover:bg-muted/30 text-base font-semibold font-body">
                              <span className="flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-primary" />
                                {name}
                                <span className="text-xs font-normal text-muted-foreground">({services.length})</span>
                              </span>
                            </AccordionTrigger>
                            <AccordionContent className="pb-0">
                              <div className="divide-y divide-border border-t border-border">
                                {services.map(renderServiceItem)}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    )}

                    {/* Multi-service continue */}
                    {allowMultiService && (
                      <div className="px-6 py-4 space-y-3">
                        {selectedServiceIds.length > 0 && (
                          <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <span>
                              {selectedServiceIds.length} serviço{selectedServiceIds.length !== 1 ? "s" : ""} ·{" "}
                              {formatDuration(totalDuration)}
                            </span>
                            {totalPrice > 0 && (
                              <span className="font-medium text-foreground">{formatPrice(totalPrice)}</span>
                            )}
                          </div>
                        )}
                        <Button
                          onClick={handleMultiServiceContinue}
                          disabled={selectedServiceIds.length === 0}
                          className="w-full h-11 rounded-full"
                        >
                          Continuar
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* ── Step: Specialist ── */}
            {step === "specialist" && (
              <div className="pb-2">
                {(loadingServiceSpecialists || loadingSpecialistServices) ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : availableSpecialists.length > 1 ? (
                  availableSpecialists.map((spec) => (
                    <button
                      key={spec.user_id}
                      onClick={() => {
                        setSpecialistId(spec.user_id);
                        setStep("datetime");
                      }}
                      className="w-full flex items-center gap-4 px-6 py-4 hover:bg-muted/40 transition-colors border-b border-border last:border-b-0 text-left"
                    >
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={spec.avatar_url || undefined} alt={spec.full_name} />
                        <AvatarFallback className="bg-primary/10 text-primary text-sm">
                          {(spec.full_name || "?")
                            .split(" ")
                            .map((n) => n[0])
                            .slice(0, 2)
                            .join("")
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="flex-1 text-sm font-medium text-foreground">{spec.full_name}</span>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </button>
                  ))
                ) : availableSpecialists.length <= 1 ? (
                  // useEffect will auto-skip, show loading
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Nenhum profissional disponível para este serviço.
                  </p>
                )}
              </div>
            )}

            {/* ── Step: Date + Time (Monthly Calendar) ── */}
            {step === "datetime" && (
              <div className="p-6 space-y-5">
                {/* Month navigation */}
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setCalMonth(subMonths(calMonth, 1))}
                    className="p-2 hover:bg-muted rounded-lg transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <span className="text-sm font-semibold capitalize">
                    {format(calMonth, "MMMM yyyy", { locale: pt })}
                  </span>
                  <button
                    onClick={() => setCalMonth(addMonths(calMonth, 1))}
                    className="p-2 hover:bg-muted rounded-lg transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Weekday headers (Mon-Sun) */}
                <div className="grid grid-cols-7 gap-1 text-center">
                  {["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map((d) => (
                    <span key={d} className="text-xs font-medium text-muted-foreground py-1">
                      {d}
                    </span>
                  ))}
                </div>

                {/* Day pills */}
                <div className="grid grid-cols-7 gap-1">
                  {/* Empty cells for padding */}
                  {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                    <div key={`empty-${i}`} />
                  ))}
                  {daysInMonth.map((day) => {
                    const isPast = isBefore(day, today);
                    const isClosed = closedWeekdays.has(getDay(day));
                    const isDisabled = isPast || isClosed;
                    const isSelected = selectedDate && isSameDay(day, selectedDate);
                    const isToday = isSameDay(day, today);
                    return (
                      <button
                        key={day.toISOString()}
                        onClick={() => {
                          if (!isDisabled) {
                            setSelectedDate(day);
                            setSelectedSlot(null);
                          }
                        }}
                        disabled={isDisabled}
                        className={cn(
                          "h-10 rounded-full text-sm font-medium transition-all",
                          isDisabled && "text-muted-foreground/30 cursor-not-allowed",
                          !isDisabled && !isSelected && "hover:bg-muted text-foreground",
                          isSelected && "bg-foreground text-background",
                          isToday && !isSelected && !isClosed && "ring-1 ring-primary",
                        )}
                      >
                        {format(day, "d")}
                      </button>
                    );
                  })}
                </div>

                {/* Time slots below calendar when day selected */}
                {selectedDate && (
                  <div className="space-y-4 pt-2 border-t border-border">
                    <p className="text-sm font-medium text-foreground text-center">
                      {format(selectedDate, "EEEE, d 'de' MMMM", { locale: pt })}
                    </p>

                    {slotsLoading ? (
                      <div className="grid grid-cols-3 gap-2">
                        {Array.from({ length: 6 }).map((_, i) => (
                          <Skeleton key={i} className="h-11 rounded-full" />
                        ))}
                      </div>
                    ) : slots && slots.length > 0 ? (
                      <div className="grid grid-cols-3 gap-x-4 gap-y-1">
                        {/* Morning */}
                        <div className="space-y-1.5">
                          <p className="text-xs font-medium text-muted-foreground text-center">Manhã</p>
                          {groupedSlots.morning.map((slot, i) => (
                            <SlotPill key={i} slot={slot} selectedSlot={selectedSlot} onSelect={setSelectedSlot} />
                          ))}
                        </div>
                        {/* Afternoon */}
                        <div className="space-y-1.5">
                          <p className="text-xs font-medium text-muted-foreground text-center">Tarde</p>
                          {groupedSlots.afternoon.map((slot, i) => (
                            <SlotPill key={i} slot={slot} selectedSlot={selectedSlot} onSelect={setSelectedSlot} />
                          ))}
                        </div>
                        {/* Evening */}
                        <div className="space-y-1.5">
                          <p className="text-xs font-medium text-muted-foreground text-center">Noite</p>
                          {groupedSlots.evening.map((slot, i) => (
                            <SlotPill key={i} slot={slot} selectedSlot={selectedSlot} onSelect={setSelectedSlot} />
                          ))}
                        </div>
                        {groupedSlots.morning.length === 0 &&
                          groupedSlots.afternoon.length === 0 &&
                          groupedSlots.evening.length === 0 && (
                            <p className="col-span-3 text-center text-sm text-muted-foreground py-4">Sem horários.</p>
                          )}
                      </div>
                    ) : (
                      <p className="text-center text-sm text-muted-foreground py-4">
                        Nenhum horário disponível nesta data.
                      </p>
                    )}

                    <Button
                      onClick={() => setStep("confirm")}
                      disabled={!selectedSlot}
                      className="w-full h-11 rounded-full"
                    >
                      Continuar
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* ── Step: Confirm ── */}
            {step === "confirm" && (
              <div className="p-6 space-y-5">
                {/* Summary */}
                <div className="border border-border rounded-lg overflow-hidden">
                  <div className="px-4 py-3 bg-muted/30 text-center">
                    <p className="text-sm font-medium text-foreground">
                      {selectedDate && format(selectedDate, "d 'de' MMMM 'de' yyyy", { locale: pt })}
                      {selectedSlot &&
                        ` · ${(selectedSlot as any).local_time || new Date(selectedSlot.start).toLocaleTimeString("pt-PT", { timeZone: clinicSettings?.timezone || getTimezone(), hour: "2-digit", minute: "2-digit" })}`}
                    </p>
                    {selectedSlot?.specialist_name && (
                      <p className="text-xs text-muted-foreground">com {selectedSlot.specialist_name}</p>
                    )}
                  </div>
                  {selectedServices.map((svc, i) => (
                    <div
                      key={svc.id}
                      className={cn(
                        "flex items-center justify-between px-4 py-3",
                        i < selectedServices.length - 1 && "border-b border-border",
                      )}
                    >
                      <div>
                        <p className="text-sm font-medium">{svc.name}</p>
                        {svc.duration_minutes && (
                          <p className="text-xs text-muted-foreground">{formatDuration(svc.duration_minutes)}</p>
                        )}
                      </div>
                      {svc.show_price_on_booking_page && formatPrice(svc.price) && (
                        <span className="text-sm font-medium">{formatPrice(svc.price)}</span>
                      )}
                    </div>
                  ))}
                  {totalPrice > 0 && selectedServices.length > 1 && (
                    <div className="flex items-center justify-between px-4 py-2.5 bg-muted/30 border-t border-border">
                      <span className="text-sm font-semibold">Total</span>
                      <span className="text-sm font-semibold">{formatPrice(totalPrice)}</span>
                    </div>
                  )}
                </div>

                <div className="text-center">
                  <p className="text-sm font-medium text-foreground">Dados da marcação</p>
                </div>

                <div className="space-y-3">
                  <Input
                    data-field="name"
                    value={name}
                    onChange={(e) => { setName(e.target.value); setValidationErrors((p) => ({ ...p, name: false })); }}
                    placeholder="Primeiro e último nome *"
                    className={cn("h-11", validationErrors.name && "border-destructive focus-visible:ring-destructive")}
                  />
                  <div data-field="phone">
                    <PhoneInput
                      value={phone}
                      onChange={(v) => { setPhone(v); setValidationErrors((p) => ({ ...p, phone: false })); }}
                      placeholder="Telefone *"
                      className={cn(validationErrors.phone && "border-destructive focus-within:ring-destructive")}
                    />
                  </div>
                  {pageSettings?.require_email !== false && (
                    <Input
                      data-field="email"
                      type="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setValidationErrors((p) => ({ ...p, email: false })); }}
                      placeholder={`E-mail${pageSettings?.require_email ? " *" : ""}`}
                      className={cn("h-11", validationErrors.email && "border-destructive focus-visible:ring-destructive")}
                    />
                  )}
                  {pageSettings?.require_gender && (() => {
                    const genderOptions = [
                      { value: "feminino", label: "Feminino" },
                      { value: "masculino", label: "Masculino" },
                      { value: "outro", label: "Outro" },
                    ];
                    const activeIndex = genderOptions.findIndex((o) => o.value === gender);
                    return (
                      <div data-field="gender" className="space-y-1.5">
                        <p className="text-xs text-muted-foreground">Género *</p>
                        <div className={cn(
                          "relative flex w-full rounded-full border p-1",
                          validationErrors.gender && "border-destructive"
                        )}>
                          {/* Sliding indicator */}
                          {activeIndex >= 0 && (
                            <span
                              className="absolute top-1 bottom-1 rounded-full bg-primary transition-all duration-300 ease-out"
                              style={{
                                width: `calc(${100 / genderOptions.length}% - 2px)`,
                                left: `calc(${(activeIndex * 100) / genderOptions.length}% + 1px)`,
                              }}
                            />
                          )}
                          {genderOptions.map((opt) => (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => { setGender(opt.value); setValidationErrors((p) => ({ ...p, gender: false })); }}
                              className={cn(
                                "relative z-10 flex-1 px-4 py-2 text-sm rounded-full transition-colors duration-200",
                                gender === opt.value
                                  ? "text-primary-foreground"
                                  : "text-muted-foreground hover:bg-muted"
                              )}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                  {pageSettings?.require_nif && (
                    <Input
                      data-field="nif"
                      value={nif}
                      onChange={(e) => { setNif(e.target.value); setValidationErrors((p) => ({ ...p, nif: false })); }}
                      placeholder="CPF *"
                      className={cn("h-11", validationErrors.nif && "border-destructive focus-visible:ring-destructive")}
                    />
                  )}
                  {pageSettings?.require_birth_date && (
                    <div data-field="birthDate" className="space-y-1.5">
                      <p className="text-xs text-muted-foreground">Data de nascimento *</p>
                      <div className="grid grid-cols-3 gap-2">
                        <Select
                          value={birthDate ? birthDate.split("-")[2]?.replace(/^0/, "") : ""}
                          onValueChange={(day) => {
                            const parts = (birthDate || "--").split("-");
                            const y = parts[0] || "";
                            const m = parts[1] || "";
                            setBirthDate(`${y}-${m}-${day.padStart(2, "0")}`);
                            setValidationErrors((p) => ({ ...p, birthDate: false }));
                          }}
                        >
                          <SelectTrigger className={cn("h-11", validationErrors.birthDate && "border-destructive")}>
                            <SelectValue placeholder="Dia" />
                          </SelectTrigger>
                          <SelectContent className="max-h-56">
                            {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                              <SelectItem key={d} value={String(d)}>{d}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select
                          value={birthDate ? birthDate.split("-")[1]?.replace(/^0/, "") : ""}
                          onValueChange={(month) => {
                            const parts = (birthDate || "--").split("-");
                            const y = parts[0] || "";
                            const d = parts[2] || "";
                            setBirthDate(`${y}-${month.padStart(2, "0")}-${d}`);
                            setValidationErrors((p) => ({ ...p, birthDate: false }));
                          }}
                        >
                          <SelectTrigger className={cn("h-11", validationErrors.birthDate && "border-destructive")}>
                            <SelectValue placeholder="Mês" />
                          </SelectTrigger>
                          <SelectContent className="max-h-56">
                            {["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"].map((name, i) => (
                              <SelectItem key={i + 1} value={String(i + 1)}>{name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select
                          value={birthDate ? birthDate.split("-")[0] : ""}
                          onValueChange={(year) => {
                            const parts = (birthDate || "--").split("-");
                            const m = parts[1] || "";
                            const d = parts[2] || "";
                            setBirthDate(`${year}-${m}-${d}`);
                            setValidationErrors((p) => ({ ...p, birthDate: false }));
                          }}
                        >
                          <SelectTrigger className={cn("h-11", validationErrors.birthDate && "border-destructive")}>
                            <SelectValue placeholder="Ano" />
                          </SelectTrigger>
                          <SelectContent className="max-h-56">
                            {Array.from({ length: new Date().getFullYear() - 1919 }, (_, i) => new Date().getFullYear() - i).map((y) => (
                              <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Observações"
                    rows={3}
                    className="resize-none"
                  />

                  <div className="space-y-3 pt-1">
                    <label className={cn("flex items-start gap-2.5 cursor-pointer", validationErrors.acceptTerms && "text-destructive")}>
                      <Checkbox
                        checked={acceptTerms}
                        onCheckedChange={(v) => { setAcceptTerms(v === true); setValidationErrors((p) => ({ ...p, acceptTerms: false })); }}
                        className={cn("mt-0.5", validationErrors.acceptTerms && "border-destructive data-[state=unchecked]:border-destructive")}
                      />
                      <span className={cn("text-xs leading-relaxed", validationErrors.acceptTerms ? "text-destructive" : "text-muted-foreground")}>
                        Li e concordo com os{" "}
                        <a href={pageSettings?.terms_url || "#"} target={pageSettings?.terms_url ? "_blank" : undefined} rel="noopener noreferrer" className="underline text-primary font-medium">Termos e condições</a>
                        {" "}e{" "}
                        <a href={pageSettings?.privacy_url || "#"} target={pageSettings?.privacy_url ? "_blank" : undefined} rel="noopener noreferrer" className="underline text-primary font-medium">Política de Privacidade</a>.
                      </span>
                    </label>
                    <label className="flex items-start gap-2.5 cursor-pointer">
                      <Checkbox
                        checked={acceptMarketing}
                        onCheckedChange={(v) => setAcceptMarketing(v === true)}
                        className="mt-0.5"
                      />
                      <span className="text-xs text-muted-foreground leading-relaxed">
                        Aceito receber{" "}
                        {pageSettings?.marketing_url ? (
                          <a href={pageSettings.marketing_url} target="_blank" rel="noopener noreferrer" className="underline text-primary font-medium">informações comerciais e promoções</a>
                        ) : (
                          "informações comerciais e promoções"
                        )}{" "}
                        adaptadas ao meu perfil e interesses.
                      </span>
                    </label>

                    <div className="rounded-lg border border-border p-4">
                      <p className="text-xs font-medium text-foreground mb-3 uppercase tracking-wider">
                        Receber novidades sobre o agendamento
                      </p>
                      <div className="grid grid-cols-3 gap-3">
                        {([
                          { key: "whatsapp", label: "WhatsApp" },
                          { key: "email", label: "E-mail" },
                          { key: "sms", label: "SMS" },
                        ] as const).map((c) => (
                          <label
                            key={c.key}
                            className="flex items-center justify-between gap-2 px-1 py-1 cursor-pointer"
                          >
                            <span className="text-xs text-foreground">{c.label}</span>
                            <Switch
                              checked={notifyChannels[c.key]}
                              onCheckedChange={(v) => setNotifyChannels((p) => ({ ...p, [c.key]: v }))}
                            />
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <Button onClick={handleBook} disabled={loading} className="w-full h-12 rounded-full text-base">
                  {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Confirmar Marcação
                </Button>
              </div>
            )}

            {/* ── Step: Done ── */}
            {step === "done" && (
              <DoneStep
                selectedServices={selectedServices}
                selectedSlot={selectedSlot}
                clinicName={clinicName}
                clientName={name}
                appointmentId={appointmentId}
                totalDuration={totalDuration}
                onNewBooking={resetAll}
              />
            )}
          </div>

          {/* Footer */}
          {!isEmbed && pageSettings?.footer_notes && (
            <p className="text-center text-xs text-muted-foreground mt-4 px-2 whitespace-pre-line">
              {pageSettings.footer_notes}
            </p>
          )}
          {!isEmbed && (
          <p className="text-center text-[11px] text-muted-foreground mt-4">
            Powered by <span className="font-medium">{clinicName}</span>
          </p>
          )}
        </div>
      </main>

      {/* Edit Sidebar */}
      <BookingEditSidebar
        open={editOpen}
        onOpenChange={setEditOpen}
        settings={pageSettings ?? null}
        onSaved={() => qc.invalidateQueries({ queryKey: ["booking-page-settings"] })}
      />
    </div>
  );
};

// ── Slot pill ──
function SlotPill({
  slot,
  selectedSlot,
  onSelect,
}: {
  slot: { start: string; end: string; specialist_id: string; specialist_name?: string };
  selectedSlot: { start: string; specialist_id: string } | null;
  onSelect: (slot: any) => void;
}) {
  const time =
    (slot as any).local_time ||
    new Date(slot.start).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" });
  const isSelected = selectedSlot?.start === slot.start && selectedSlot?.specialist_id === slot.specialist_id;
  return (
    <button
      onClick={() => onSelect(slot)}
      className={cn(
        "w-full py-2 rounded-full border text-sm font-medium transition-all text-center",
        isSelected
          ? "border-foreground bg-foreground text-background"
          : "border-border hover:border-muted-foreground/50 text-foreground",
      )}
    >
      {time}
    </button>
  );
}

// ── Confetti canvas ──
function ConfettiCanvas() {
  const canvasRef = useCallback((canvas: HTMLCanvasElement | null) => {
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const W = (canvas.width = canvas.parentElement?.offsetWidth || 400);
    const H = (canvas.height = 400);
    const colors = ["#4ecdc4", "#ff6b6b", "#ffe66d", "#a78bfa", "#f472b6", "#34d399", "#60a5fa"];
    const pieces: {
      x: number;
      y: number;
      r: number;
      color: string;
      vx: number;
      vy: number;
      rot: number;
      rv: number;
      shape: number;
    }[] = [];
    for (let i = 0; i < 120; i++) {
      pieces.push({
        x: W / 2 + (Math.random() - 0.5) * 60,
        y: H / 2 - 40,
        r: Math.random() * 6 + 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        vx: (Math.random() - 0.5) * 12,
        vy: Math.random() * -14 - 4,
        rot: Math.random() * Math.PI * 2,
        rv: (Math.random() - 0.5) * 0.3,
        shape: Math.floor(Math.random() * 3),
      });
    }
    let frame = 0;
    const maxFrames = 180;
    const animate = () => {
      if (frame > maxFrames) return;
      ctx.clearRect(0, 0, W, H);
      pieces.forEach((p) => {
        p.vy += 0.25;
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.99;
        p.rot += p.rv;
        const alpha = Math.max(0, 1 - frame / maxFrames);
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        if (p.shape === 0) ctx.fillRect(-p.r / 2, -p.r, p.r, p.r * 2);
        else if (p.shape === 1) {
          ctx.beginPath();
          ctx.arc(0, 0, p.r, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.moveTo(0, -p.r);
          ctx.lineTo(p.r, p.r);
          ctx.lineTo(-p.r, p.r);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
      });
      frame++;
      requestAnimationFrame(animate);
    };
    animate();
  }, []);
  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-10" />;
}

// ── Done step ──
function DoneStep({
  selectedServices,
  selectedSlot,
  clinicName,
  clientName,
  appointmentId,
  totalDuration,
  onNewBooking,
}: {
  selectedServices: ServiceItem[];
  selectedSlot: { start: string; end: string; specialist_id: string; specialist_name?: string } | null;
  clinicName: string;
  clientName: string;
  appointmentId: string | null;
  totalDuration: number;
  onNewBooking: () => void;
}) {
  const serviceNames = selectedServices.map((s) => s.name).join(", ") || "—";
  const specialistName = selectedSlot?.specialist_name || "—";

  // Format date in the CLINIC timezone, not the browser's local timezone
  const effectiveTz = getTimezone();
  const dateFormatted = useMemo(() => {
    if (!selectedSlot) return "—";
    const d = new Date(selectedSlot.start);
    return d.toLocaleDateString("pt-PT", {
      timeZone: effectiveTz,
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, [selectedSlot, effectiveTz]);

  const createdAtFormatted = new Date().toLocaleDateString("pt-PT", {
    timeZone: effectiveTz,
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const googleCalUrl = useMemo(() => {
    if (!selectedSlot) return "#";
    const start = new Date(selectedSlot.start);
    const end = new Date(selectedSlot.end);
    const fmt = (d: Date) =>
      d
        .toISOString()
        .replace(/[-:]/g, "")
        .replace(/\.\d{3}/, "");
    const params = new URLSearchParams({
      action: "TEMPLATE",
      text: serviceNames,
      dates: `${fmt(start)}/${fmt(end)}`,
      ctz: effectiveTz,
      details: `${clientName} - ${clinicName}`,
    });
    return `https://www.google.com/calendar/render?${params.toString()}`;
  }, [selectedSlot, serviceNames, clinicName, clientName]);

  const downloadICS = useCallback(() => {
    if (!appointmentId) return;
    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
    const url = `https://${projectId}.supabase.co/functions/v1/calendar-ics?appointment_id=${appointmentId}`;
    const a = document.createElement("a");
    a.href = url;
    a.download = `marcacao-${appointmentId}.ics`;
    a.click();
  }, [appointmentId]);

  return (
    <div className="relative text-center py-14 px-6 space-y-5 overflow-hidden">
      <ConfettiCanvas />
      <div className="relative z-20 space-y-5">
        <div className="mx-auto w-20 h-20 rounded-full bg-[hsl(var(--success))] flex items-center justify-center animate-scale-in">
          <Check className="w-10 h-10 text-white" strokeWidth={3} />
        </div>
        <h2 className="text-xl font-semibold text-[hsl(var(--success))] animate-fade-in">Marcação Confirmada!</h2>
        <div className="space-y-1 animate-fade-in">
          <p className="text-base font-semibold text-foreground">{serviceNames}</p>
          <p className="text-sm text-muted-foreground">{dateFormatted}</p>
          <p className="text-sm text-muted-foreground">{specialistName}</p>
          <p className="text-[10px] text-muted-foreground/60 mt-2">
            Agendamento criado por {clientName || "cliente"} em {createdAtFormatted}
          </p>
        </div>
        <div className="space-y-2.5 pt-2 max-w-xs mx-auto animate-fade-in">
          <a
            href={googleCalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-lg bg-muted text-sm font-medium text-foreground hover:bg-muted/80 transition-colors"
          >
            <CalendarDays className="w-4 h-4" />
            Adicionar ao Google Calendar
          </a>
          <button
            onClick={downloadICS}
            className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-lg bg-muted text-sm font-medium text-foreground hover:bg-muted/80 transition-colors"
          >
            <CalendarDays className="w-4 h-4" />
            Adicionar ao Outlook / Apple Calendar
          </button>
        </div>
        <Button variant="ghost" size="sm" onClick={onNewBooking} className="mt-4 text-muted-foreground">
          Fazer nova marcação
        </Button>
      </div>
    </div>
  );
}

export default PublicBooking;
