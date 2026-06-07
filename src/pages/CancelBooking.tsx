import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, XCircle, Loader2, CalendarX } from "lucide-react";
import { Button } from "@/components/ui/button";
import logoIcon from "@/assets/logo-icon.png";
import { fireBookingWebhook } from "@/lib/webhook";

interface AppointmentInfo {
  id: string;
  start_time: string;
  status: string;
  cancellation_token: string;
  client_name: string;
  client_phone: string | null;
  client_email: string | null;
  service_name: string | null;
  specialist_name: string | null;
  specialist_id: string | null;
}

interface ClinicInfo {
  timezone?: string | null;
}

export default function CancelBooking() {
  const { token } = useParams<{ token: string }>();
  const [appointment, setAppointment] = useState<AppointmentInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [result, setResult] = useState<"cancelled" | "already" | "error" | null>(null);
  const [clinicTimezone, setClinicTimezone] = useState("Europe/Lisbon");

  useEffect(() => {
    if (!token) { setLoading(false); return; }

    (async () => {
      const [apptRes, clinicRes] = await Promise.all([
        supabase.rpc("get_appointment_by_cancel_token", { p_token: token }),
        supabase.rpc("public_clinic_info"),
      ]);

      const clinicData = clinicRes.data as ClinicInfo | null;
      if (clinicData?.timezone) {
        setClinicTimezone(clinicData.timezone);
      }

      if (apptRes.error || !apptRes.data) {
        setLoading(false);
        return;
      }

      const data = apptRes.data as Partial<AppointmentInfo> | null;
      if (!data?.id || !data.start_time || !data.status || !data.cancellation_token) {
        setLoading(false);
        return;
      }

      setAppointment({
        id: data.id,
        start_time: data.start_time,
        status: data.status,
        cancellation_token: data.cancellation_token,
        client_name: data.client_name ?? "",
        client_phone: data.client_phone ?? null,
        client_email: data.client_email ?? null,
        service_name: data.service_name ?? null,
        specialist_name: data.specialist_name ?? null,
        specialist_id: data.specialist_id ?? null,
      });
      setLoading(false);
    })();
  }, [token]);

  const handleCancel = async () => {
    if (!appointment) return;
    setCancelling(true);

    if (appointment.status === "cancelado") {
      setResult("already");
      setCancelling(false);
      return;
    }

    const { data, error } = await supabase.rpc("cancel_appointment_by_token", {
      p_token: appointment.cancellation_token,
    });

    if (error) {
      setResult("error");
    } else if (data === false) {
      setResult("already");
    } else {
      setResult("cancelled");
      fireBookingWebhook({
        event: "cancelled",
        appointment_id: appointment.id,
        cancellation_token: appointment.cancellation_token,
        client: {
          full_name: appointment.client_name,
          phone: appointment.client_phone,
          email: appointment.client_email,
        },
        service_name: appointment.service_name,
        start_time: appointment.start_time,
        specialist_name: appointment.specialist_name,
        specialist_id: appointment.specialist_id,
        source: "client",
      });
    }
    setCancelling(false);
  };

  const formatDateWithTimezone = (dateStr: string) => {
    const date = new Date(dateStr);
    const weekday = date.toLocaleDateString("pt-PT", { timeZone: clinicTimezone, weekday: "long" });
    const day = date.toLocaleDateString("pt-PT", { timeZone: clinicTimezone, day: "numeric", month: "long" });
    const time = date.toLocaleTimeString("pt-PT", { timeZone: clinicTimezone, hour: "2-digit", minute: "2-digit" });
    return `${weekday}, ${day} às ${time}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 text-center gap-4">
        <XCircle className="w-16 h-16 text-destructive" />
        <h1 className="text-xl font-semibold">Link inválido</h1>
        <p className="text-muted-foreground">Este link de cancelamento não é válido ou o agendamento não foi encontrado.</p>
      </div>
    );
  }

  const formattedDate = formatDateWithTimezone(appointment.start_time);

  if (result === "cancelled") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 text-center gap-4">
        <CheckCircle className="w-16 h-16 text-[hsl(var(--success))]" />
        <h1 className="text-xl font-semibold">Agendamento cancelado</h1>
        <p className="text-muted-foreground">O seu agendamento foi cancelado com sucesso.</p>
      </div>
    );
  }

  if (result === "already" || appointment.status === "cancelado") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 text-center gap-4">
        <CalendarX className="w-16 h-16 text-muted-foreground" />
        <h1 className="text-xl font-semibold">Já cancelado</h1>
        <p className="text-muted-foreground">Este agendamento já foi cancelado anteriormente.</p>
      </div>
    );
  }

  if (result === "error") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 text-center gap-4">
        <XCircle className="w-16 h-16 text-destructive" />
        <h1 className="text-xl font-semibold">Erro</h1>
        <p className="text-muted-foreground">Não foi possível cancelar. Tente novamente ou contacte-nos.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl p-8 space-y-6 text-center shadow-lg">
        <img src={logoIcon} alt="Logo" className="w-12 h-12 mx-auto" />
        <h1 className="text-xl font-semibold">Cancelar Agendamento</h1>

        <div className="space-y-2 text-sm text-left bg-muted/40 rounded-lg p-4">
          <p><span className="text-muted-foreground">Cliente:</span> <span className="font-medium">{appointment.client_name}</span></p>
          {appointment.service_name && (
            <p><span className="text-muted-foreground">Serviço:</span> <span className="font-medium">{appointment.service_name}</span></p>
          )}
          {appointment.specialist_name && (
            <p><span className="text-muted-foreground">Especialista:</span> <span className="font-medium">{appointment.specialist_name}</span></p>
          )}
          <p><span className="text-muted-foreground">Data:</span> <span className="font-medium capitalize">{formattedDate}</span></p>
        </div>

        <p className="text-sm text-muted-foreground">Tem a certeza que deseja cancelar este agendamento?</p>

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={() => window.close()} disabled={cancelling}>
            Não, manter
          </Button>
          <Button variant="destructive" className="flex-1" onClick={handleCancel} disabled={cancelling}>
            {cancelling && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Sim, cancelar
          </Button>
        </div>
      </div>
    </div>
  );
}
