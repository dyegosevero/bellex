import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Pencil, AlertTriangle } from "lucide-react";

interface Props {
  channel: string;
  audienceFilter: string;
  includeNoOptin: boolean;
  onChangeFilter: (f: string) => void;
  onChangeOptin: (v: boolean) => void;
}

const channelContactField: Record<string, string> = {
  email: "email",
  sms: "phone",
  whatsapp: "phone",
};

interface AudienceClient {
  id: string;
  opt_in: boolean;
  phone?: string | null;
  email?: string | null;
}

interface AudienceAppointment {
  client_id: string;
  start_time: string;
}

export default function CampaignAudienceTab({
  channel,
  audienceFilter,
  includeNoOptin,
  onChangeFilter,
  onChangeOptin,
}: Props) {
  const contactField = channelContactField[channel] || "email";
  const isEmailChannel = contactField === "email";

  const { data: counts } = useQuery({
    queryKey: ["campaign-audience-detail", channel, includeNoOptin],
    queryFn: async () => {
      // Fetch ALL clients with pagination to avoid the 1000-row limit
      let allClients: AudienceClient[] = [];
      let offset = 0;
      const PAGE_SIZE = 1000;

      while (true) {
        const query = isEmailChannel
          ? supabase
              .from("clients")
              .select("id, opt_in, email")
              .not("email", "is", null)
              .neq("email", "")
          : supabase
              .from("clients")
              .select("id, opt_in, phone")
              .not("phone", "is", null)
              .neq("phone", "");

        const { data: page } = await query.range(offset, offset + PAGE_SIZE - 1);
        if (!page || page.length === 0) break;
        allClients = allClients.concat(page as AudienceClient[]);
        if (page.length < PAGE_SIZE) break;
        offset += PAGE_SIZE;
      }

      const filtered = includeNoOptin
        ? allClients
        : allClients.filter((c) => c.opt_in);

      const clientIds = filtered.map((c) => c.id);

      if (clientIds.length === 0) {
        return { all: 0, new: 0, active: 0, inactive: 0 };
      }

      // Fetch appointments in batches to avoid query limit
      let allAppointments: AudienceAppointment[] = [];
      for (let i = 0; i < clientIds.length; i += 500) {
        const batch = clientIds.slice(i, i + 500);
        const { data: appointments } = await supabase
          .from("appointments")
          .select("client_id, start_time")
          .in("client_id", batch);
        if (appointments) allAppointments = allAppointments.concat(appointments as AudienceAppointment[]);
      }

      const appByClient: Record<string, string[]> = {};
      allAppointments.forEach((a) => {
        if (!appByClient[a.client_id]) appByClient[a.client_id] = [];
        appByClient[a.client_id].push(a.start_time);
      });

      let newCount = 0;
      let activeCount = 0;
      let inactiveCount = 0;

      filtered.forEach((c) => {
        const appts = appByClient[c.id] || [];
        if (appts.length === 0) {
          inactiveCount++;
          return;
        }
        const sorted = appts.sort();
        const firstVisit = new Date(sorted[0]);
        const lastVisit = new Date(sorted[sorted.length - 1]);
        const cutoffDate = new Date();
        cutoffDate.setMonth(cutoffDate.getMonth() - 1);

        if (firstVisit >= cutoffDate) newCount++;
        if (lastVisit >= cutoffDate) activeCount++;
        else inactiveCount++;
      });

      return {
        all: filtered.length,
        new: newCount,
        active: activeCount,
        inactive: inactiveCount,
      };
    },
  });

  const segments = [
    {
      value: "all",
      label: `Todos os clientes (${counts?.all ?? "..."})`,
      desc: "Toda a lista de clientes",
    },
    {
      value: "new",
      label: `Novos clientes (${counts?.new ?? "..."})`,
      desc: "Clientes que fizeram a primeira marcação nos últimos 30 dias",
    },
    {
      value: "active",
      label: `Clientes ativos (${counts?.active ?? "..."})`,
      desc: "Clientes com marcações nos últimos 30 dias",
    },
    {
      value: "inactive",
      label: `Clientes inativos (${counts?.inactive ?? "..."})`,
      desc: "Clientes sem marcações nos últimos 30 dias",
    },
  ];

  return (
    <div className="space-y-4">
      {/* Opt-in warning */}
      <div className="rounded-lg bg-accent border border-border px-4 py-3 flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 text-primary mt-0.5 shrink-0" />
        <div className="text-sm text-foreground">
          <p>Apenas os clientes que aceitam receber campanhas de marketing são mostrados nesta lista.</p>
          <div className="flex items-center gap-2 mt-2">
            <Switch
              checked={includeNoOptin}
              onCheckedChange={onChangeOptin}
              className="scale-90"
            />
            <span className="text-xs">Incluir clientes sem consentimento de marketing</span>
          </div>
        </div>
      </div>

      {/* Audience segments */}
      <RadioGroup value={audienceFilter} onValueChange={onChangeFilter} className="space-y-2">
        {segments.map((seg) => (
          <label
            key={seg.value}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg border cursor-pointer transition-colors ${
              audienceFilter === seg.value
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/30"
            }`}
          >
            <RadioGroupItem value={seg.value} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{seg.label}</p>
              <p className="text-xs text-muted-foreground">{seg.desc}</p>
            </div>
            {audienceFilter === seg.value && (
              <Pencil className="w-4 h-4 text-muted-foreground" />
            )}
          </label>
        ))}
      </RadioGroup>
    </div>
  );
}
