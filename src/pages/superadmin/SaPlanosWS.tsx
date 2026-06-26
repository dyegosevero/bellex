import { useState } from "react";
import { useSaPlans, SaPlan } from "@/hooks/useSaPlans";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Check, HardDrive, Zap, Building2, Pencil, X, Save, Loader2 } from "lucide-react";

type EditState = Partial<SaPlan>;

export default function SaPlanosWS() {
  const { plans, loading, update } = useSaPlans();
  const [editId, setEditId] = useState<string | null>(null);
  const [edit, setEdit] = useState<EditState>({});
  const [saving, setSaving] = useState(false);

  const startEdit = (p: SaPlan) => {
    setEditId(p.id);
    setEdit({
      name: p.name,
      price_monthly: p.price_monthly,
      seats: p.seats,
      storage_gb: p.storage_gb,
      ai_conversations_month: p.ai_conversations_month,
      features: [...p.features],
    });
  };

  const cancelEdit = () => { setEditId(null); setEdit({}); };

  const saveEdit = async () => {
    if (!editId) return;
    setSaving(true);
    await update(editId, edit);
    setSaving(false);
    setEditId(null);
    setEdit({});
  };

  const setField = (k: keyof EditState, v: unknown) =>
    setEdit(prev => ({ ...prev, [k]: v }));

  const setFeature = (i: number, v: string) => {
    const arr = [...(edit.features ?? [])];
    arr[i] = v;
    setField("features", arr);
  };

  const addFeature = () => setField("features", [...(edit.features ?? []), ""]);
  const removeFeature = (i: number) => {
    const arr = [...(edit.features ?? [])];
    arr.splice(i, 1);
    setField("features", arr);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64 gap-2 text-muted-foreground">
      <Loader2 className="w-4 h-4 animate-spin" /> Carregando planos…
    </div>
  );

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto">
      <div className="mb-1">
        <h1 className="text-lg font-semibold text-foreground">Planos WS</h1>
        <p className="text-[12px] text-muted-foreground mt-0.5">
          Planos que a Bellex oferece para operadores de Workspace — clique em editar para ajustar valores
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-5">
        {plans.map(p => {
          const isEditing = editId === p.id;
          const cur = isEditing ? edit : p;

          return (
            <div key={p.id} className="relative rounded-xl border border-border/40 bg-card overflow-hidden">
              {p.popular && !isEditing && (
                <div className="absolute top-3.5 right-10">
                  <span className="text-[10px] font-bold bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full">Popular</span>
                </div>
              )}

              {/* Botão editar / cancelar */}
              <div className="absolute top-3 right-3">
                {isEditing ? (
                  <button onClick={cancelEdit} className="text-muted-foreground hover:text-foreground">
                    <X className="w-4 h-4" />
                  </button>
                ) : (
                  <button onClick={() => startEdit(p)} className="text-muted-foreground hover:text-foreground">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="h-1" style={{ background: p.color }} />

              <div className="p-5 space-y-4">
                {/* Nome e preço */}
                <div>
                  {isEditing ? (
                    <Input
                      className="h-7 text-sm font-semibold mb-2"
                      value={cur.name ?? ""}
                      onChange={e => setField("name", e.target.value)}
                    />
                  ) : (
                    <p className="text-base font-bold text-foreground">{p.name}</p>
                  )}

                  <div className="flex items-baseline gap-1 mt-1">
                    {isEditing ? (
                      <div className="flex items-center gap-1">
                        <span className="text-sm text-muted-foreground">R$</span>
                        <Input
                          type="number"
                          className="h-8 w-28 text-xl font-bold"
                          value={cur.price_monthly ?? ""}
                          onChange={e => setField("price_monthly", Number(e.target.value))}
                        />
                        <span className="text-sm text-muted-foreground">/mês</span>
                      </div>
                    ) : (
                      <>
                        <span className="text-3xl font-bold text-foreground">
                          R$ {p.price_monthly.toLocaleString("pt-BR")}
                        </span>
                        <span className="text-sm text-muted-foreground">/mês</span>
                      </>
                    )}
                  </div>

                  {/* Limites */}
                  <div className="flex flex-wrap gap-x-3 gap-y-1.5 mt-3">
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <Building2 className="w-3 h-3" />
                      {isEditing ? (
                        <Input type="number" className="h-5 w-14 text-[11px] px-1" value={cur.seats ?? ""} onChange={e => setField("seats", Number(e.target.value))} />
                      ) : `${p.seats} clínicas`}
                    </span>
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <Zap className="w-3 h-3" />
                      {isEditing ? (
                        <Input type="number" className="h-5 w-20 text-[11px] px-1" value={cur.ai_conversations_month ?? ""} onChange={e => setField("ai_conversations_month", Number(e.target.value))} />
                      ) : `${p.ai_conversations_month.toLocaleString()} conv. IA`}
                    </span>
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <HardDrive className="w-3 h-3" />
                      {isEditing ? (
                        <Input type="number" className="h-5 w-14 text-[11px] px-1" value={cur.storage_gb ?? ""} onChange={e => setField("storage_gb", Number(e.target.value))} />
                      ) : `${p.storage_gb} GB`}
                    </span>
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-2 pt-1 border-t border-border/30">
                  {isEditing ? (
                    <>
                      {(edit.features ?? []).map((f, i) => (
                        <div key={i} className="flex items-center gap-1.5">
                          <Input
                            className="h-6 text-[12px]"
                            value={f}
                            onChange={e => setFeature(i, e.target.value)}
                          />
                          <button onClick={() => removeFeature(i)} className="text-muted-foreground hover:text-destructive shrink-0">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={addFeature}
                        className="text-[11px] text-primary hover:underline mt-1"
                      >+ Adicionar feature</button>
                    </>
                  ) : (
                    p.features.map(f => (
                      <div key={f} className="flex items-center gap-2 text-[12px] text-muted-foreground">
                        <Check className="w-3 h-3 shrink-0" style={{ color: p.color }} />
                        {f}
                      </div>
                    ))
                  )}
                </div>

                {/* Botão salvar */}
                {isEditing && (
                  <Button size="sm" className="w-full gap-1.5 mt-1" onClick={saveEdit} disabled={saving}>
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    Salvar
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
