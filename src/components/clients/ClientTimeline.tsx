import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Calendar, ShoppingBag, CreditCard, Image as ImageIcon, Package,
} from "lucide-react";
import { fmtDate, fmtDateTime, fmtCurrency } from "@/lib/date";
import {
  VerticalTimeline,
  VerticalTimelineElement,
} from "react-vertical-timeline-component";
import "react-vertical-timeline-component/style.min.css";

type EventType = "atendimento" | "compra" | "imagem" | "cobranca";

interface TimelineEvent {
  id: string;
  date: string;
  type: EventType;
  label: string;
  detail?: string | null;
  extra?: Record<string, unknown>;
}

const TYPE_CONFIG: Record<EventType, { icon: typeof Calendar; color: string; label: string }> = {
  atendimento: { icon: Calendar, color: "hsl(var(--primary))", label: "Atendimentos" },
  compra: { icon: ShoppingBag, color: "hsl(var(--success))", label: "Compras" },
  imagem: { icon: ImageIcon, color: "hsl(217, 71%, 53%)", label: "Imagens" },
  cobranca: { icon: CreditCard, color: "hsl(var(--warning))", label: "Cobranças" },
};

const FILTER_OPTIONS: { value: EventType | "todos"; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "atendimento", label: "Atendimentos" },
  { value: "compra", label: "Compras" },
  { value: "imagem", label: "Imagens" },
  { value: "cobranca", label: "Cobranças" },
];

export const ClientTimeline = ({ clientId }: { clientId: string }) => {
  const { data: appointments, isLoading: loadingAppts } = useQuery({
    queryKey: ["timeline-appointments", clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select("*, services(name), appointment_products(quantity, unit_price, products(name))")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });

  const { data: charges, isLoading: loadingCharges } = useQuery({
    queryKey: ["timeline-charges", clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("charges")
        .select("*")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });

  const { data: images, isLoading: loadingImages } = useQuery({
    queryKey: ["timeline-images", clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_images")
        .select("*")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });

  const isLoading = loadingAppts || loadingCharges || loadingImages;

  // Build unified timeline
  const events: TimelineEvent[] = [];

  (appointments ?? []).forEach((a) => {
    const serviceName = (a.services as any)?.name;
    const products = (a.appointment_products as any[]) ?? [];
    const prodList = products.map((p) => `${p.products?.name ?? "?"} x${p.quantity}`).join(", ");

    events.push({
      id: `appt-${a.id}`,
      date: a.start_time,
      type: "atendimento",
      label: serviceName ? `${serviceName}` : "Atendimento",
      detail: [a.notes, prodList ? `Produtos: ${prodList}` : null].filter(Boolean).join(" · "),
      extra: { status: a.status, products },
    });
  });

  (charges ?? []).forEach((c) => {
    events.push({
      id: `charge-${c.id}`,
      date: c.created_at,
      type: "cobranca",
      label: `${fmtCurrency(c.amount)}`,
      detail: c.notes,
      extra: { status: c.status, dueDate: c.due_date },
    });
  });

  const IMAGE_TYPE_LABELS: Record<string, string> = {
    before_after: "Envio de Imagem",
    before: "Antes",
    after: "Depois",
  };

  (images ?? []).forEach((img) => {
    events.push({
      id: `img-${img.id}`,
      date: img.created_at,
      type: "imagem",
      label: IMAGE_TYPE_LABELS[img.image_type] || img.image_type || "Imagem",
      detail: img.caption,
      extra: { fileUrl: img.file_url, imageType: img.image_type },
    });
  });

  events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (isLoading) {
    return <Skeleton className="h-48 w-full" />;
  }

  if (events.length === 0) {
    return <p className="text-center py-12 text-muted-foreground text-sm">Nenhum evento registrado</p>;
  }

  return (
    <div className="client-timeline">
      <VerticalTimeline lineColor="hsl(var(--border))" layout="1-column-left">
        {events.map((event) => {
          const config = TYPE_CONFIG[event.type];
          const Icon = config.icon;

          return (
            <VerticalTimelineElement
              key={event.id}
              date={fmtDateTime(event.date)}
              dateClassName="!text-muted-foreground !text-xs !font-normal"
              iconStyle={{
                background: config.color,
                color: "#fff",
                boxShadow: `0 0 0 3px hsl(var(--border))`,
              }}
              icon={<Icon />}
              contentStyle={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "0.5rem",
                boxShadow: "none",
                padding: "1rem 1.25rem",
              }}
              contentArrowStyle={{
                borderRight: "7px solid hsl(var(--border))",
              }}
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-semibold text-foreground">{event.label}</h3>
                {event.extra?.status && (
                  <Badge
                    variant={
                      (event.extra.status as string) === "pago" || (event.extra.status as string) === "concluido"
                        ? "default"
                        : "secondary"
                    }
                    className="text-[9px] flex-shrink-0"
                  >
                    {event.extra.status as string}
                  </Badge>
                )}
              </div>
              {event.detail && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{event.detail}</p>
              )}
              {event.type === "imagem" && event.extra?.fileUrl && (
                <ImageThumb fileUrl={event.extra.fileUrl as string} />
              )}
              {event.type === "atendimento" && (event.extra?.products as any[])?.length > 0 && (
                <div className="flex items-center gap-1 mt-2">
                  <Package className="w-3 h-3 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground">
                    {(event.extra!.products as any[]).length} produto(s) utilizado(s)
                  </span>
                </div>
              )}
            </VerticalTimelineElement>
          );
        })}
      </VerticalTimeline>
    </div>
  );
};

const ImageThumb = ({ fileUrl }: { fileUrl: string }) => {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    supabase.storage.from("client-images").createSignedUrl(fileUrl, 3600).then(({ data }) => {
      if (data?.signedUrl) setUrl(data.signedUrl);
    });
  }, [fileUrl]);

  if (!url) return <div className="block mt-2 rounded border border-border w-32 h-24 bg-muted animate-pulse" />;

  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="block mt-2">
      <img
        src={url}
        alt=""
        className="rounded border border-border object-cover w-32 h-24"
      />
    </a>
  );
};
