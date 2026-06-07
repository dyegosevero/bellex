import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Plus, Search, FolderOpen, Archive } from "lucide-react";
import { BlurFade } from "@/components/ui/blur-fade";
import ServiceDialog from "@/components/services/ServiceDialog";
import CategoryDialog from "@/components/services/CategoryDialog";
import ImportServicesDialog from "@/components/services/ImportServicesDialog";
import SortableServiceItem from "@/components/services/SortableServiceItem";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";

export interface ServiceRow {
  id: string;
  name: string;
  description: string | null;
  active: boolean;
  archived: boolean;
  duration_minutes: number | null;
  price: number | null;
  currency: string;
  color: string | null;
  vat_rate: number | null;
  show_on_booking_page: boolean;
  show_price_on_booking_page: boolean;
  category_id: string | null;
  display_order: number;
  requires_before_after_photos: boolean;
  requires_consent_form: boolean;
  requires_assessment_form: boolean;
  multi_session: boolean;
  session_count: number | null;
  created_at: string;
}

export interface ServiceCategory {
  id: string;
  name: string;
  color: string | null;
  display_order: number;
}

/** Unified item for the flat list */
export type DisplayItem =
  | { type: "category"; data: ServiceCategory }
  | { type: "service"; data: ServiceRow };

const formatDuration = (mins: number | null) => {
  if (!mins) return "";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h > 0 && m > 0) return `${h}h${String(m).padStart(2, "0")}`;
  if (h > 0) return `${h}h`;
  return `${m}min`;
};

const formatPrice = (price: number | null, currency: string) => {
  if (price == null) return "";
  return new Intl.NumberFormat("pt-PT", { style: "currency", currency }).format(price);
};

const Services = () => {
  const { role } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [serviceDialogOpen, setServiceDialogOpen] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceRow | null>(null);
  const [editingCategory, setEditingCategory] = useState<ServiceCategory | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const { data: services, isLoading: loadingServices } = useQuery({
    queryKey: ["services-page"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .order("display_order")
        .order("name");
      if (error) throw error;
      return data as ServiceRow[];
    },
  });

  const { data: categories, isLoading: loadingCategories } = useQuery({
    queryKey: ["service-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_categories")
        .select("*")
        .order("display_order");
      if (error) throw error;
      return data as ServiceCategory[];
    },
  });

  const isLoading = loadingServices || loadingCategories;

  /** Build flat display list: categories as separators with their services underneath, uncategorized at end */
  const { activeItems, archivedServices } = useMemo(() => {
    if (!services) return { activeItems: [] as DisplayItem[], archivedServices: [] as ServiceRow[] };
    const cats = categories ?? [];
    const items: DisplayItem[] = [];
    const archived: ServiceRow[] = [];
    const servicesByCategory = new Map<string, ServiceRow[]>();
    const uncategorized: ServiceRow[] = [];

    services.forEach((s) => {
      if (s.archived) {
        archived.push(s);
        return;
      }
      if (s.category_id) {
        if (!servicesByCategory.has(s.category_id)) servicesByCategory.set(s.category_id, []);
        servicesByCategory.get(s.category_id)!.push(s);
      } else {
        uncategorized.push(s);
      }
    });

    cats.forEach((cat) => {
      items.push({ type: "category", data: cat });
      const catServices = servicesByCategory.get(cat.id) ?? [];
      catServices.forEach((s) => items.push({ type: "service", data: s }));
    });

    uncategorized.forEach((s) => items.push({ type: "service", data: s }));

    return { activeItems: items, archivedServices: archived };
  }, [services, categories]);

  // Local optimistic state for drag reordering
  const [localOrder, setLocalOrder] = useState<DisplayItem[] | null>(null);

  // Clear local order when underlying query data changes
  useEffect(() => { setLocalOrder(null); }, [services, categories]);

  const currentItems = localOrder ?? activeItems;

  const archivedItems: DisplayItem[] = useMemo(() =>
    archivedServices.map((s) => ({ type: "service" as const, data: s })),
    [archivedServices]
  );

  const baseItems = showArchived ? archivedItems : currentItems;

  const filtered = useMemo(() => {
    if (!search) return baseItems;
    return baseItems.filter((item) => {
      if (item.type === "category") return item.data.name.toLowerCase().includes(search.toLowerCase());
      return item.data.name.toLowerCase().includes(search.toLowerCase());
    });
  }, [baseItems, search]);

  const isFiltering = search.length > 0 || showArchived;

  const invalidate = () => {
    setLocalOrder(null);
    queryClient.invalidateQueries({ queryKey: ["services-page"] });
    queryClient.invalidateQueries({ queryKey: ["service-categories"] });
  };

  const getItemId = (item: DisplayItem) =>
    item.type === "category" ? `cat-${item.data.id}` : item.data.id;

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = filtered.findIndex((item) => getItemId(item) === active.id);
    const newIndex = filtered.findIndex((item) => getItemId(item) === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove([...filtered], oldIndex, newIndex) as DisplayItem[];

    // Optimistic update — immediately show new order
    setLocalOrder(reordered);

    const serviceUpdates: { id: string; display_order: number }[] = [];
    const categoryUpdates: { id: string; display_order: number }[] = [];

    reordered.forEach((item, idx) => {
      if (item.type === "category") {
        categoryUpdates.push({ id: item.data.id, display_order: idx });
      } else {
        serviceUpdates.push({ id: item.data.id, display_order: idx });
      }
    });

    try {
      const promises: PromiseLike<unknown>[] = [];
      for (const u of serviceUpdates) {
        promises.push(supabase.from("services").update({ display_order: u.display_order }).eq("id", u.id));
      }
      for (const u of categoryUpdates) {
        promises.push(supabase.from("service_categories").update({ display_order: u.display_order }).eq("id", u.id));
      }
      await Promise.all(promises);
      // Don't invalidate — localOrder already has the correct order
      // Silently sync query cache so next render from query matches
      queryClient.setQueryData(["services-page"], (old: ServiceRow[] | undefined) => {
        if (!old) return old;
        return old.map(s => {
          const upd = serviceUpdates.find(u => u.id === s.id);
          return upd ? { ...s, display_order: upd.display_order } : s;
        }).sort((a, b) => a.display_order - b.display_order);
      });
      queryClient.setQueryData(["service-categories"], (old: ServiceCategory[] | undefined) => {
        if (!old) return old;
        return old.map(c => {
          const upd = categoryUpdates.find(u => u.id === c.id);
          return upd ? { ...c, display_order: upd.display_order } : c;
        }).sort((a, b) => a.display_order - b.display_order);
      });
    } catch {
      setLocalOrder(null);
      toast.error("Erro ao reordenar");
    }
  };

  if (role !== "admin" && role !== "atendimento") return <Navigate to="/dashboard" replace />;

  const openNewService = () => { setEditingService(null); setServiceDialogOpen(true); };
  const openEditService = (s: ServiceRow) => { setEditingService(s); setServiceDialogOpen(true); };
  const openNewCategory = () => { setEditingCategory(null); setCategoryDialogOpen(true); };
  const openEditCategory = (c: ServiceCategory) => { setEditingCategory(c); setCategoryDialogOpen(true); };

  const handleEditItem = (item: DisplayItem) => {
    if (item.type === "category") openEditCategory(item.data);
    else openEditService(item.data);
  };

  const handleRestore = async (serviceId: string) => {
    const { error } = await supabase.from("services").update({ archived: false, active: true }).eq("id", serviceId);
    if (error) { toast.error("Erro ao restaurar serviço"); return; }
    toast.success("Serviço restaurado");
    invalidate();
  };

  const sortableIds = filtered.map((item) => item.type === "category" ? `cat-${item.data.id}` : item.data.id);

  return (
    <div>
      <BlurFade delay={0.05}>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-light tracking-wider">Serviços</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {services?.length ?? 0} serviços · {categories?.length ?? 0} categorias
            </p>
          </div>
          <div className="flex items-center gap-2">
             <Button
               variant={showArchived ? "default" : "outline"}
               size="sm"
               onClick={() => setShowArchived(!showArchived)}
               className="gap-1.5"
               disabled={archivedServices.length === 0}
             >
               <Archive className="w-4 h-4" />
               Arquivados{archivedServices.length > 0 ? ` (${archivedServices.length})` : ""}
             </Button>
            <Button variant="outline" onClick={openNewCategory} size="sm">
              <FolderOpen className="w-4 h-4 mr-2" /> Nova Categoria
            </Button>
            <Button onClick={openNewService}>
              <Plus className="w-4 h-4 mr-2" /> Novo Serviço
            </Button>
          </div>
        </div>
      </BlurFade>

      <BlurFade delay={0.1}>
        <div className="flex items-center gap-3 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar serviço..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      </BlurFade>

      <BlurFade delay={0.15}>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
            <div className="space-y-1">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-14 bg-muted animate-pulse rounded-lg" />
                ))
              ) : filtered && filtered.length > 0 ? (
                filtered.map((item) => (
                   <SortableServiceItem
                    key={item.type === "category" ? `cat-${item.data.id}` : item.data.id}
                    item={item}
                    onEdit={handleEditItem}
                    onRestore={showArchived ? handleRestore : undefined}
                    formatDuration={formatDuration}
                    formatPrice={formatPrice}
                    isDragDisabled={isFiltering}
                  />
                ))
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  {search ? "Nenhum serviço encontrado." : "Nenhum serviço cadastrado."}
                </div>
              )}
            </div>
          </SortableContext>
        </DndContext>
      </BlurFade>


      <ServiceDialog
        open={serviceDialogOpen}
        onOpenChange={setServiceDialogOpen}
        editing={editingService}
        onSaved={invalidate}
        maxOrder={(services?.length ?? 0)}
        categories={categories ?? []}
      />
      <CategoryDialog
        open={categoryDialogOpen}
        onOpenChange={setCategoryDialogOpen}
        editing={editingCategory}
        onSaved={invalidate}
        maxOrder={(categories?.length ?? 0)}
      />
      <ImportServicesDialog open={importDialogOpen} onOpenChange={setImportDialogOpen} onImported={invalidate} />
    </div>
  );
};

export default Services;
