import { useState } from "react";
import { useSpecialists } from "@/hooks/useAppointmentData";
import { BlurFade } from "@/components/ui/blur-fade";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, Sparkles } from "lucide-react";
import SpecialistHoursTab from "@/components/services/SpecialistHoursTab";
import SpecialistServicesTab from "@/components/services/SpecialistServicesTab";

const SpecialistHours = () => {
  const [selectedSpec, setSelectedSpec] = useState("");
  const { data: specialists } = useSpecialists();

  return (
    <div>
      <BlurFade delay={0.05}>
        <div className="mb-8">
          <h1 className="text-2xl font-light tracking-wider">Equipa — Especialistas</h1>
          <p className="text-sm text-muted-foreground mt-1">Horários e serviços por especialista</p>
        </div>
      </BlurFade>

      <BlurFade delay={0.1}>
        <div className="space-y-6">
          <Select value={selectedSpec} onValueChange={setSelectedSpec}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Selecione o especialista" />
            </SelectTrigger>
            <SelectContent>
              {specialists?.map((s) => (
                <SelectItem key={s.user_id} value={s.user_id}>
                  {s.full_name || "Sem nome"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedSpec && (
            <Tabs defaultValue="horario" className="w-full">
              <TabsList>
                <TabsTrigger value="horario" className="gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> Horário
                </TabsTrigger>
                <TabsTrigger value="servicos" className="gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> Serviços
                </TabsTrigger>
              </TabsList>
              <TabsContent value="horario" className="mt-4">
                <SpecialistHoursTab specialistId={selectedSpec} />
              </TabsContent>
              <TabsContent value="servicos" className="mt-4">
                <SpecialistServicesTab specialistId={selectedSpec} />
              </TabsContent>
            </Tabs>
          )}

          {!selectedSpec && (
            <div className="bg-card border border-border rounded-lg p-12 text-center">
              <p className="text-sm text-muted-foreground">Selecione um especialista para configurar horários e serviços.</p>
            </div>
          )}
        </div>
      </BlurFade>
    </div>
  );
};

export default SpecialistHours;
