import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BlurFade } from "@/components/ui/blur-fade";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { ChevronLeft, Loader2, Trash2 } from "lucide-react";
import SpecialistHoursTab from "@/components/services/SpecialistHoursTab";
import SpecialistServicesTab from "@/components/services/SpecialistServicesTab";

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrador",
  especialista: "Especialista",
  atendimento: "Recepcionista",
};

const UserEdit = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");

  const { data: profile, isLoading } = useQuery({
    queryKey: ["user-profile", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", id!)
        .maybeSingle();
      if (error) throw error;
      return data;
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

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setPhone(profile.phone || "");
    }
  }, [profile]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!fullName.trim()) throw new Error("Nome é obrigatório");
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: fullName.trim(), phone: phone.trim() || null })
        .eq("user_id", id!);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Perfil atualizado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["user-profile", id] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const getInitials = (name: string) =>
    name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  if (isLoading) {
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
        <Button variant="outline" size="sm" className="mb-4 gap-1 text-muted-foreground hover:bg-muted" onClick={() => navigate("/equipe")}>
          <ChevronLeft className="w-4 h-4" /> Voltar
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
        <Button variant="outline" size="sm" className="mb-6 gap-1 text-muted-foreground hover:bg-muted" onClick={() => navigate("/equipe")}>
          <ChevronLeft className="w-4 h-4" /> Voltar
        </Button>
        <h1 className="text-2xl font-light tracking-wider mb-1">Editar Colaborador</h1>
      </BlurFade>

      <BlurFade delay={0.1}>
        {/* Avatar + Role */}
        <div className="flex flex-col items-center mb-6">
          <Avatar className="h-20 w-20 border-2 border-border mb-2">
            <AvatarImage src={profile.avatar_url || undefined} />
            <AvatarFallback className="text-lg bg-primary/10 text-primary">
              {getInitials(profile.full_name || "U")}
            </AvatarFallback>
          </Avatar>
          {role && (
            <Badge variant="secondary" className="text-[10px] uppercase tracking-wider">
              {ROLE_LABELS[role] || role}
            </Badge>
          )}
        </div>

        {/* Basic fields */}
        <div className="space-y-5 mb-6">
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Nome do colaborador</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Telefone</Label>
            <PhoneInput value={phone} onChange={setPhone} />
          </div>
        </div>

        {/* Specialist tabs */}
        {isSpecialist && id ? (
          <Tabs defaultValue="horario" className="mb-6">
            <TabsList className="w-full">
              <TabsTrigger value="horario" className="flex-1">Horário</TabsTrigger>
              <TabsTrigger value="servicos" className="flex-1">Serviços</TabsTrigger>
            </TabsList>
            <TabsContent value="horario" className="mt-4">
              <SpecialistHoursTab specialistId={id} />
            </TabsContent>
            <TabsContent value="servicos" className="mt-4">
              <SpecialistServicesTab specialistId={id} />
            </TabsContent>
          </Tabs>
        ) : null}

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-border">
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="flex-1">
            {saveMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Salvar
          </Button>
          <Button variant="outline" onClick={() => navigate("/equipe")}>Cancelar</Button>
        </div>
      </BlurFade>
    </div>
  );
};

export default UserEdit;
