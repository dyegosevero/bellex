import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import type { ServiceCategory } from "@/pages/Services";

const CategoryDialog = ({
  open, onOpenChange, editing, onSaved, maxOrder,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: ServiceCategory | null;
  onSaved: () => void;
  maxOrder: number;
}) => {
  const [name, setName] = useState("");
  const [color, setColor] = useState("#3B82F6");
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (open) {
      if (editing) {
        setName(editing.name);
        setColor(editing.color ?? "#3B82F6");
      } else {
        setName("");
        setColor("#3B82F6");
      }
      setConfirmDelete(false);
    }
  }, [open, editing]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (editing) {
        const { error } = await supabase
          .from("service_categories")
          .update({ name, color })
          .eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("service_categories")
          .insert({ name, color, display_order: maxOrder });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      onSaved();
      onOpenChange(false);
      toast.success(editing ? "Categoria atualizada." : "Categoria criada.");
    },
    onError: (err: any) => {
      console.error("Category save error:", JSON.stringify(err, null, 2));
      toast.error(`Erro ao salvar categoria: ${err?.message || err}`);
    },
  });

  const handleDelete = async () => {
    if (!editing) return;
    // Remove category reference from all services first
    await supabase.from("services").update({ category_id: null }).eq("category_id", editing.id);
    const { error } = await supabase.from("service_categories").delete().eq("id", editing.id);
    if (error) {
      toast.error("Erro ao excluir categoria.");
      return;
    }
    toast.success("Categoria excluída.");
    setConfirmDelete(false);
    onOpenChange(false);
    onSaved();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Categoria" : "Nova Categoria"}</DialogTitle>
            <DialogDescription>Categorias agrupam serviços visualmente</DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Nome *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Ex: Faciais & SkinCare" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Cor</Label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-10 h-10 rounded-full border-2 border-muted cursor-pointer p-0.5"
                />
                <Input
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  placeholder="#3B82F6"
                  className="flex-1 font-mono text-sm"
                  maxLength={7}
                />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={mutation.isPending} className="flex-1">
                {mutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editing ? "Salvar" : "Criar Categoria"}
              </Button>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            </div>
            {editing && (
              <div className="pt-1 border-t border-border">
                <button
                  type="button"
                  className="text-sm text-destructive hover:underline"
                  onClick={() => setConfirmDelete(true)}
                >
                  Excluir categoria
                </button>
              </div>
            )}
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Categoria</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a categoria "{editing?.name}"? Serviços vinculados ficarão sem categoria.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default CategoryDialog;
