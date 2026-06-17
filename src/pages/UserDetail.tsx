import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BlurFade } from "@/components/ui/blur-fade";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, Edit, Mail, Phone, Clock } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrador",
  especialista: "Especialista",
  atendimento: "Recepcionista",
};

const WEEKDAY_NAMES = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const UserDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["user-profile", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", id!)
        .maybeSingle();
      if (error) throw error;
      const { data: emails } = await supabase.rpc("list_user_emails");
      const email = (emails ?? []).find((e: any) => e.user_id === id)?.email ?? null;
      return { ...data, email };
    },
    enabled: !!id,
  });

  const { data: roleData } = useQuery({
    queryKey: ["user-role", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", id!).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const isSpecialist = roleData?.role === "especialista";

  const { data: assignedServices } = useQuery({
    queryKey: ["specialist-services", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("specialist_services")
        .select("*, services(name, duration_minutes)")
        .eq("specialist_id", id!);
      if (error) throw error;
      return data;
    },
    enabled: !!id && isSpecialist,
  });

  const { data: specialistHours } = useQuery({
    queryKey: ["specialist-hours", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("specialist_hours")
        .select("*")
        .eq("specialist_id", id!)
        .order("weekday")
        .order("start_time");
      if (error) throw error;
      return data;
    },
    enabled: !!id && isSpecialist,
  });

  const getInitials = (name: string) =>
    name?.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase() ?? "?";

  if (isLoading) {
    return (
      <div className="max-w-xl mx-auto space-y-4 pt-8">
        <Skeleton className="h-24 w-24 rounded-full mx-auto" />
        <Skeleton className="h-6 w-48 mx-auto" />
        <Skeleton className="h-4 w-32 mx-auto" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div>
        <Button variant="outline" size="sm" className="mb-6 gap-1 text-muted-foreground hover:bg-muted" onClick={() => navigate("/equipe")}>
          <ChevronLeft className="w-4 h-4" /> Voltar
        </Button>
        <p className="text-muted-foreground">Usuário não encontrado.</p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto">
      <BlurFade delay={0.05}>
        <div className="flex items-center justify-between mb-8">
          <Button variant="outline" size="sm" className="gap-1 text-muted-foreground hover:bg-muted" onClick={() => navigate("/equipe")}>
            <ChevronLeft className="w-4 h-4" /> Voltar
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate(`/admin/usuarios/${id}/editar`)}>
            <Edit className="w-3.5 h-3.5" /> Editar
          </Button>
        </div>
      </BlurFade>

      {/* Profile hero */}
      <BlurFade delay={0.1}>
        <div className="flex flex-col items-center text-center mb-10">
          <Avatar className="h-24 w-24 mb-4 border-2 border-border shadow-sm">
            <AvatarImage src={profile.avatar_url || undefined} />
            <AvatarFallback className="text-xl bg-primary/10 text-primary font-light">
              {getInitials(profile.full_name || "U")}
            </AvatarFallback>
          </Avatar>

          <h1 className="text-2xl font-light tracking-wider mb-1">{profile.full_name}</h1>

          {roleData?.role && (
            <Badge variant="secondary" className="text-[10px] uppercase tracking-wider mb-4">
              {ROLE_LABELS[roleData.role] || roleData.role}
            </Badge>
          )}

          <div className="space-y-1.5">
            {profile.email && (
              <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
                <Mail className="w-3.5 h-3.5 shrink-0" /> {profile.email}
              </p>
            )}
            {profile.phone && (
              <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
                <Phone className="w-3.5 h-3.5 shrink-0" /> {profile.phone}
              </p>
            )}
          </div>

          {profile.created_at && (
            <p className="text-xs text-muted-foreground/60 mt-3">
              Membro desde {format(new Date(profile.created_at), "MMMM 'de' yyyy", { locale: ptBR })}
            </p>
          )}
        </div>
      </BlurFade>

      {/* Specialist sections */}
      {isSpecialist && (
        <>
          {/* Horários */}
          <BlurFade delay={0.15}>
            <div className="mb-8">
              <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-3">Horário</p>
              {specialistHours && specialistHours.length > 0 ? (
                <div className="divide-y divide-border rounded-xl border border-border overflow-hidden">
                  {[1, 2, 3, 4, 5, 6, 0].map((wd) => {
                    const slots = specialistHours.filter((h) => h.weekday === wd);
                    if (slots.length === 0) return null;
                    return (
                      <div key={wd} className="flex items-center gap-4 px-4 py-3 bg-card text-sm">
                        <span className="w-10 font-medium text-primary">{WEEKDAY_NAMES[wd]}</span>
                        <div className="flex flex-wrap gap-x-3 gap-y-1">
                          {slots.map((h: any) => (
                            <span key={h.id} className="text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {h.start_time?.slice(0, 5)} – {h.end_time?.slice(0, 5)}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Usa o horário da clínica.</p>
              )}
            </div>
          </BlurFade>

          {/* Serviços */}
          <BlurFade delay={0.2}>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-3">Serviços Atribuídos</p>
              {assignedServices && assignedServices.length > 0 ? (
                <div className="divide-y divide-border rounded-xl border border-border overflow-hidden">
                  {assignedServices.map((s: any) => (
                    <div key={s.id} className="flex items-center justify-between px-4 py-3 bg-card text-sm">
                      <span>{s.services?.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {s.custom_duration_minutes
                          ? `${s.custom_duration_minutes}min`
                          : s.services?.duration_minutes
                            ? `${s.services.duration_minutes}min`
                            : "—"}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhum serviço atribuído.</p>
              )}
            </div>
          </BlurFade>
        </>
      )}
    </div>
  );
};

export default UserDetail;
