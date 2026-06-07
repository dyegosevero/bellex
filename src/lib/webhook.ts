import { supabase } from "@/integrations/supabase/client";

interface BookingWebhookPayload {
  event: "confirmed" | "cancelled" | "changed";
  appointment_id: string;
  cancellation_token?: string;
  notify_client?: boolean;
  client: {
    full_name: string;
    phone: string | null;
    email: string | null;
  };
  client_id?: string | null;
  service_id?: string | null;
  service_name: string | null;
  start_time: string;
  specialist_name?: string | null;
  specialist_id?: string | null;
  clinic_name?: string | null;
  source?: "staff" | "client";
}

export async function fireBookingWebhook(payload: BookingWebhookPayload) {
  // Resolve specialist_name from specialist_id if not provided
  if (!payload.specialist_name && payload.specialist_id) {
    try {
      const { data } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", payload.specialist_id)
        .maybeSingle();
      if (data?.full_name) {
        payload.specialist_name = data.full_name;
      }
    } catch (e) {
      console.error("[fireBookingWebhook] failed to resolve specialist name:", e);
    }
  }

  // Call edge function — it handles everything (webhook, reminders, notify-staff)
  const { error } = await supabase.functions.invoke("fire-booking-webhook", {
    body: payload,
  });

  if (error) {
    console.error("[fireBookingWebhook] error:", error);
  }
}
