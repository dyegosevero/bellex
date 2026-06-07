import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Upload } from "lucide-react";

interface BukService {
  name?: string;
  duration?: number;
  price?: number;
  color?: string;
  showOnBookingPage?: boolean;
  showPriceOnBookingPage?: boolean;
  vatRate?: number;
  category?: boolean;
  categoryName?: string;
}

const ImportServicesDialog = ({
  open, onOpenChange, onImported,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onImported: () => void;
}) => {
  const [jsonText, setJsonText] = useState("");

  const mutation = useMutation({
    mutationFn: async () => {
      let items: BukService[];
      try {
        const parsed = JSON.parse(jsonText);
        items = Array.isArray(parsed) ? parsed : parsed.services || parsed.data || [parsed];
      } catch {
        throw new Error("JSON inválido");
      }

      if (items.length === 0) throw new Error("Nenhum serviço encontrado no JSON");

      // Get existing service names to avoid duplicates
      const { data: existing } = await supabase.from("services").select("name");
      const existingNames = new Set((existing ?? []).map(s => s.name.toLowerCase()));

      const toInsert = items
        .filter((item) => !item.category)
        .map((item, idx) => ({
          name: item.name || `Serviço ${idx + 1}`,
          duration_minutes: item.duration || 30,
          price: item.price ?? 0,
          color: item.color || "#3B82F6",
          show_on_booking_page: item.showOnBookingPage ?? true,
          show_price_on_booking_page: item.showPriceOnBookingPage ?? true,
          vat_rate: item.vatRate ?? 0,
          display_order: idx,
          active: true,
        }))
        .filter(s => !existingNames.has(s.name.toLowerCase()));

      if (toInsert.length === 0) throw new Error("Todos os serviços já existem");

      const { error } = await supabase.from("services").insert(toInsert);
      if (error) throw error;

      return toInsert.length;
    },
    onSuccess: (count) => {
      onImported();
      onOpenChange(false);
      setJsonText("");
      toast.success(`${count} serviços importados com sucesso.`);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Importar Serviços (JSON)</DialogTitle>
          <DialogDescription>
            Cole o JSON com os serviços do sistema BUK. Serviços duplicados serão ignorados.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">JSON</Label>
            <Textarea
              rows={10}
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              placeholder='[{"name": "Limpeza de Pele", "duration": 90, "price": 60, ...}]'
              className="font-mono text-xs"
            />
          </div>
          <div className="flex gap-3">
            <Button type="submit" disabled={mutation.isPending || !jsonText.trim()} className="flex-1">
              {mutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
              Importar
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ImportServicesDialog;
