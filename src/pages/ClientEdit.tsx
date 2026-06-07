import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ClientForm } from "@/components/clients/ClientForm";
import { Skeleton } from "@/components/ui/skeleton";

const ClientEdit = () => {
  const { id } = useParams<{ id: string }>();

  const { data: client, isLoading } = useQuery({
    queryKey: ["client", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!client) {
    return <p className="text-muted-foreground text-center py-12">Cliente não encontrado.</p>;
  }

  return (
    <ClientForm
      mode="edit"
      initialData={{
        id: client.id,
        full_name: client.full_name,
        email: client.email ?? "",
        phone: client.phone ?? "",
        birth_date: client.birth_date ?? "",
        profession: (client as any).profession ?? "",
        cpf: client.cpf ?? "",
        address: (client as any).address ?? "",
        preferred_schedule: (client as any).preferred_schedule ?? "",
        notes: client.notes ?? "",
        internal_notes: client.internal_notes ?? "",
        clinical_notes: client.clinical_notes ?? "",
        preferences: client.preferences ?? "",
        interests: client.interests ?? "",
        consent_given: client.consent_given ?? false,
        consent_pdf_url: client.consent_pdf_url ?? undefined,
      }}
    />
  );
};

export default ClientEdit;
