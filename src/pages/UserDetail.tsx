import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BlurFade } from "@/components/ui/blur-fade";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Edit, Mail, Phone, Calendar, Shield } from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrador",
  especialista: "Especialista",
  atendimento: "Recepcionista",
};

const UserDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: profile, isLoading: loadingProfile } = useQuery({
    queryKey: ["user-profile", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", id!)
        .maybeSingle();
      if (error) throw error;

      // Fetch email
      const { data: emails } = await supabase.rpc("list_user_emails");
      const email = (emails ?? []).find((e: any) => e.user_id === id)?.email ?? null;

      return { ...data, email };
    },
    enabled: !!id,
  });

  const { data: roleData } = useQuery({
    queryKey: ["user-role", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", id!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

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
    enabled: !!id && roleData?.role === "especialista",
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
    enabled: !!id && roleData?.role === "especialista",
  });

  const getInitials = (name: string) =>
    name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  const WEEKDAY_NAMES = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  if (loadingProfile) {
    return (
      <div className="max-w-2xl space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-2xl">
        <Button variant="ghost" size="sm" onClick={() => navigate("/equipe")} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
        </Button>
        <p className="text-muted-foreground">Usuário não encontrado.</p>
      </div>
    );
  }

  const role = roleData?.role;
  const isSpecialist = role === "especialista";

  return (
    <div className="max-w-2xl">
      <BlurFade delay={0.05}>
        <Button variant="ghost" size="sm" className="mb-4 -ml-2 text-muted-foreground" onClick={() => navigate("/equipe")}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
        </Button>
      </BlurFade>

      <BlurFade delay={0.1}>
        <div className="flex items-start gap-5 mb-8">
          <Avatar className="h-20 w-20 border-2 border-border">
            <AvatarImage src={profile.avatar_url || undefined} />
            <AvatarFallback className="text-lg bg-primary/10 text-primary">
              {getInitials(profile.full_name || "U")}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-light tracking-wider">{profile.full_name}</h1>
            {role && (
              <Badge variant="secondary" className="mt-1 text-[10px] uppercase tracking-wider">
                {ROLE_LABELS[role] || role}
              </Badge>
            )}
            <div className="mt-3 space-y-1">
              {profile.email && (
                <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" /> {profile.email}
                </p>
              )}
              {profile.phone && (
                <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5" /> {profile.phone}
                </p>
              )}
              {profile.created_at && (
                <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> Criado em {format(new Date(profile.created_at), "d 'de' MMMM 'de' yyyy", { locale: pt })}
                </p>
              )}
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate(`/admin/usuarios/${id}/editar`)}>
            <Edit className="w-4 h-4 mr-1" /> Editar
          </Button>
        </div>
      </BlurFade>

      {/* Info card */}
      <BlurFade delay={0.12}>
        <Card className="mb-8">
          <CardHeader className="pb-4">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Informações da Conta</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">E-mail</Label>
              <Input value={profile.email ?? "—"} readOnly className="bg-muted/40" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Data de Criação</Label>
              <Input
                value={profile.created_at ? format(new Date(profile.created_at), "dd/MM/yyyy HH:mm", { locale: pt }) : "—"}
                readOnly
                className="bg-muted/40"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs text-muted-foreground">UID</Label>
              <Input value={id ?? "—"} readOnly className="bg-muted/40 font-mono text-xs" />
            </div>
          </CardContent>
        </Card>
      </BlurFade>

      {/* Specialist-specific sections */}
      {isSpecialist && (
        <>
          {/* Hours */}
          <BlurFade delay={0.15}>
            <div className="mb-8">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Horário Personalizado</h2>
              {specialistHours && specialistHours.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[1, 2, 3, 4, 5, 6, 0].map((wd) => {
                    const dayHours = specialistHours.filter((h) => h.weekday === wd);
                    if (dayHours.length === 0) return null;
                    return (
                      <div key={wd} className="flex items-center gap-2 p-2 rounded-md border border-border bg-card text-sm">
                        <span className="font-medium w-10">{WEEKDAY_NAMES[wd]}</span>
                        <div className="flex flex-col gap-0.5">
                          {dayHours.map((h: any) => (
                            <span key={h.id} className="text-muted-foreground text-xs">
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

          {/* Services */}
          <BlurFade delay={0.2}>
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Serviços Atribuídos</h2>
              {assignedServices && assignedServices.length > 0 ? (
                <div className="space-y-1.5">
                  {assignedServices.map((s: any) => (
                    <div key={s.id} className="flex items-center justify-between p-2.5 rounded-md border border-border bg-card text-sm">
                      <span>{s.services?.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {s.custom_duration_minutes
                          ? `${s.custom_duration_minutes}min (personalizado)`
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
