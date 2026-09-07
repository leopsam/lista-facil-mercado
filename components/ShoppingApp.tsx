"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  Check, CheckCircle2, ClipboardList, History, ListChecks, Pencil, Plus,
  RefreshCw, Save, ShoppingBasket, Trash2, X,
} from "lucide-react";
import type { ItemWeighing, Purchase, PurchaseItem, PurchaseMode, PurchaseSummary } from "@/lib/types";
import * as S from "./styles";

const USE_DATABASE = process.env.NEXT_PUBLIC_USE_DATABASE === "true";
const STORAGE_KEY = "lista-facil-mercado:v2";
const LEGACY_STORAGE_KEY = "lista-facil-mercado:v1";
const UNITS = ["un", "kg", "g", "L", "ml", "pct", "cx"];
const CATEGORIES = ["Geral", "Carnes", "Frios", "Hortifruti", "Padaria", "Bebidas", "Mercearia", "Limpeza", "Higiene", "Outros"];

function uid() {
  return typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function itemWeight(item: PurchaseItem) {
  return item.weighings.reduce((sum, weighing) => sum + weighing.weightKg, 0);
}

function itemValue(item: PurchaseItem) {
  return item.purchaseMode === "weighted"
    ? item.weighings.reduce((sum, weighing) => sum + weighing.totalPrice, 0)
    : item.quantity * item.unitPrice;
}

function normalizeItem(item: PurchaseItem): PurchaseItem {
  return {
    ...item,
    category: item.category || "Geral",
    purchaseMode: item.purchaseMode === "weighted" ? "weighted" : "standard",
    targetQuantity: Number(item.targetQuantity) || 0,
    weighings: Array.isArray(item.weighings) ? item.weighings : [],
  };
}

function calculatePurchase(purchase: Purchase): Purchase {
  const items = purchase.items.map(normalizeItem);
  return {
    ...purchase,
    items,
    total: items.reduce((sum, item) => sum + itemValue(item), 0),
    pickedCount: items.filter((item) => item.picked).length,
  };
}

function newDemoPurchase(): Purchase {
  return { id: uid(), purchaseDate: today(), status: "active", items: [], total: 0, pickedCount: 0 };
}

function loadDemo(): Purchase[] {
  try {
    const current = localStorage.getItem(STORAGE_KEY);
    if (current) return (JSON.parse(current) as Purchase[]).map(calculatePurchase);
    const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacy) {
      const migrated = (JSON.parse(legacy) as Purchase[]).map(calculatePurchase);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
      return migrated;
    }
  } catch {}
  const initial = [newDemoPurchase()];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
  return initial;
}

function saveDemo(purchases: Purchase[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(purchases));
  window.dispatchEvent(new Event("lista-facil-atualizada"));
}

function money(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0);
}

function decimal(value: number, digits = 3) {
  return new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: digits }).format(value || 0);
}

function dateLabel(value: string) {
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return "data não informada";
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "long", year: "numeric" }).format(date);
}

function summariesFrom(purchases: Purchase[]): PurchaseSummary[] {
  return [...purchases].sort((a, b) => b.purchaseDate.localeCompare(a.purchaseDate)).map((purchase) => ({
    id: purchase.id,
    purchaseDate: purchase.purchaseDate,
    status: purchase.status,
    itemCount: purchase.items.length,
    pickedCount: purchase.pickedCount,
    total: purchase.total,
  }));
}

function parseNumber(value: string) {
  return Math.max(0, Number(value.replace(",", ".")) || 0);
}

interface ItemDraft {
  name: string;
  category: string;
  purchaseMode: PurchaseMode;
  targetQuantity: string;
  quantity: string;
  unit: string;
  unitPrice: string;
}

function ItemFields({ draft, setDraft, autoFocus = false }: {
  draft: ItemDraft;
  setDraft: (draft: ItemDraft) => void;
  autoFocus?: boolean;
}) {
  return (
    <>
      <label><span>Produto</span><S.TextInput autoFocus={autoFocus} placeholder="Ex.: Sobrecoxa de frango" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} required /></label>
      <label><span>Categoria</span><S.Select value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })}>{CATEGORIES.map((category) => <option key={category}>{category}</option>)}</S.Select></label>
      <label><span>Tipo de compra</span><S.Select value={draft.purchaseMode} onChange={(e) => setDraft({ ...draft, purchaseMode: e.target.value as PurchaseMode })}><option value="standard">Normal</option><option value="weighted">Peso fracionado</option></S.Select></label>
      {draft.purchaseMode === "weighted" ? (
        <label><span>Meta de peso (kg)</span><S.TextInput inputMode="decimal" placeholder="Ex.: 8" value={draft.targetQuantity} onChange={(e) => setDraft({ ...draft, targetQuantity: e.target.value })} /></label>
      ) : (
        <>
          <label><span>Quantidade</span><S.TextInput inputMode="decimal" value={draft.quantity} onChange={(e) => setDraft({ ...draft, quantity: e.target.value })} /></label>
          <label><span>Unidade</span><S.Select value={draft.unit} onChange={(e) => setDraft({ ...draft, unit: e.target.value })}>{UNITS.map((unit) => <option key={unit}>{unit}</option>)}</S.Select></label>
          <label><span>Valor unitário</span><S.TextInput inputMode="decimal" value={draft.unitPrice} onChange={(e) => setDraft({ ...draft, unitPrice: e.target.value })} /></label>
        </>
      )}
    </>
  );
}

function ItemEditor({ item, onSave, onCancel }: {
  item: PurchaseItem;
  onSave: (draft: ItemDraft) => Promise<void>;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<ItemDraft>({
    name: item.name,
    category: item.category,
    purchaseMode: item.purchaseMode,
    targetQuantity: String(item.targetQuantity || "").replace(".", ","),
    quantity: String(item.quantity).replace(".", ","),
    unit: item.unit,
    unitPrice: String(item.unitPrice).replace(".", ","),
  });
  const [saving, setSaving] = useState(false);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!draft.name.trim()) return;
    setSaving(true);
    await onSave(draft);
    setSaving(false);
  };
  return (
    <S.AddForm as="form" onSubmit={submit}>
      <ItemFields draft={draft} setDraft={setDraft} autoFocus />
      <S.RowActions>
        <S.IconButton type="submit" aria-label="Salvar alterações" disabled={saving}><Save /></S.IconButton>
        <S.IconButton type="button" $danger aria-label="Cancelar edição" onClick={onCancel}><X /></S.IconButton>
      </S.RowActions>
    </S.AddForm>
  );
}

function AddItemForm({ onSave, onCancel }: { onSave: (draft: ItemDraft) => Promise<void>; onCancel: () => void }) {
  const [draft, setDraft] = useState<ItemDraft>({
    name: "", category: "Geral", purchaseMode: "standard", targetQuantity: "", quantity: "1", unit: "un", unitPrice: "0,00",
  });
  const [saving, setSaving] = useState(false);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!draft.name.trim()) return;
    setSaving(true);
    await onSave(draft);
    setSaving(false);
  };
  return (
    <S.AddForm onSubmit={submit}>
      <ItemFields draft={draft} setDraft={setDraft} autoFocus />
      <S.RowActions>
        <S.IconButton type="submit" aria-label="Salvar produto" disabled={saving}><Check /></S.IconButton>
        <S.IconButton type="button" $danger aria-label="Cancelar" onClick={onCancel}><X /></S.IconButton>
      </S.RowActions>
    </S.AddForm>
  );
}

interface WeighingDraft { weightKg: string; totalPrice: string; pricePerKg: string }

function WeighingForm({ item, onSave, onCancel }: {
  item: PurchaseItem;
  onSave: (draft: WeighingDraft) => Promise<void>;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<WeighingDraft>({ weightKg: "", totalPrice: "", pricePerKg: "" });
  const [saving, setSaving] = useState(false);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const weight = parseNumber(draft.weightKg);
    if (weight <= 0) return;
    setSaving(true);
    await onSave(draft);
    setSaving(false);
  };
  return (
    <S.WeighingForm onSubmit={submit}>
      <div><strong>Nova pesagem — {item.name}</strong><small>Informe o peso e o valor da etiqueta. Se preferir, informe o preço por kg.</small></div>
      <label><span>Peso (kg)</span><S.TextInput autoFocus inputMode="decimal" placeholder="2,500" value={draft.weightKg} onChange={(e) => setDraft({ ...draft, weightKg: e.target.value })} required /></label>
      <label><span>Valor da embalagem</span><S.TextInput inputMode="decimal" placeholder="34,98" value={draft.totalPrice} onChange={(e) => setDraft({ ...draft, totalPrice: e.target.value })} /></label>
      <label><span>Preço/kg (opcional)</span><S.TextInput inputMode="decimal" placeholder="13,99" value={draft.pricePerKg} onChange={(e) => setDraft({ ...draft, pricePerKg: e.target.value })} /></label>
      <S.RowActions><S.IconButton type="submit" aria-label="Salvar pesagem" disabled={saving}><Check /></S.IconButton><S.IconButton type="button" $danger aria-label="Cancelar pesagem" onClick={onCancel}><X /></S.IconButton></S.RowActions>
    </S.WeighingForm>
  );
}

function WeightedDetails({ item, active, onAdd, onDelete }: {
  item: PurchaseItem;
  active: boolean;
  onAdd: () => void;
  onDelete: (weighing: ItemWeighing) => void;
}) {
  const weight = itemWeight(item);
  const total = itemValue(item);
  const average = weight > 0 ? total / weight : 0;
  const progress = item.targetQuantity > 0 ? Math.min(100, (weight / item.targetQuantity) * 100) : 0;
  return (
    <S.WeighingDetail>
      <S.WeightStats>
        <div><span>Peso comprado</span><strong>{decimal(weight)} kg{item.targetQuantity > 0 ? ` de ${decimal(item.targetQuantity)} kg` : ""}</strong></div>
        <div><span>Valor acumulado</span><strong>{money(total)}</strong></div>
        <div><span>Preço médio</span><strong>{weight > 0 ? `${money(average)}/kg` : "—"}</strong></div>
      </S.WeightStats>
      {item.targetQuantity > 0 && <S.ProgressTrack><S.ProgressBar style={{ width: `${progress}%` }} /></S.ProgressTrack>}
      {item.weighings.length > 0 && <S.WeighingList>{item.weighings.map((weighing, index) => (
        <S.WeighingRow key={weighing.id}>
          <div><strong>Pacote {index + 1}</strong><span>{decimal(weighing.weightKg)} kg · {money(weighing.totalPrice)}{weighing.weightKg > 0 ? ` · ${money(weighing.totalPrice / weighing.weightKg)}/kg` : ""}</span></div>
          {active && <S.IconButton $danger aria-label={`Excluir pesagem ${index + 1}`} onClick={() => onDelete(weighing)}><Trash2 /></S.IconButton>}
        </S.WeighingRow>
      ))}</S.WeighingList>}
      {active && <S.SecondaryButton type="button" onClick={onAdd}><Plus /> Adicionar pesagem</S.SecondaryButton>}
    </S.WeighingDetail>
  );
}

export default function ShoppingApp() {
  const [view, setView] = useState<"current" | "history">("current");
  const [purchase, setPurchase] = useState<Purchase | null>(null);
  const [summaries, setSummaries] = useState<PurchaseSummary[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [weighingItemId, setWeighingItemId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [syncing, setSyncing] = useState(false);

  const refresh = useCallback(async (preferredId?: string, silent = false) => {
    if (!silent) setLoading(true);
    try {
      if (!USE_DATABASE) {
        const purchases = loadDemo();
        let selected = preferredId ? purchases.find((item) => item.id === preferredId) : purchases.find((item) => item.status === "active");
        if (!selected && view === "current") {
          selected = newDemoPurchase();
          purchases.push(selected);
          saveDemo(purchases);
        }
        setSummaries(summariesFrom(purchases));
        setPurchase(selected ? calculatePurchase(selected) : null);
        setError("");
        return;
      }
      setSyncing(true);
      const response = await fetch("/api/purchases", { cache: "no-store" });
      if (!response.ok) throw new Error("Não foi possível carregar suas compras.");
      const data = await response.json();
      setSummaries(data.purchases);
      let selectedId = preferredId ?? data.purchases.find((item: PurchaseSummary) => item.status === "active")?.id;
      if (!selectedId && view === "current") {
        const created = await fetch("/api/purchases", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ purchaseDate: today() }) });
        if (!created.ok) throw new Error("Não foi possível iniciar uma compra.");
        const createdData = await created.json();
        selectedId = createdData.id;
      }
      if (selectedId) {
        const detail = await fetch(`/api/purchases/${selectedId}`, { cache: "no-store" });
        if (!detail.ok) throw new Error("Não foi possível abrir a compra.");
        setPurchase((await detail.json()).purchase);
      } else setPurchase(null);
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Ocorreu um erro inesperado.");
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  }, [view]);

  useEffect(() => {
    const timer = window.setTimeout(() => void refresh(), 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);

  useEffect(() => {
    const timer = window.setInterval(() => void refresh(purchase?.id, true), 2500);
    const localRefresh = () => void refresh(purchase?.id, true);
    window.addEventListener("storage", localRefresh);
    window.addEventListener("lista-facil-atualizada", localRefresh);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("storage", localRefresh);
      window.removeEventListener("lista-facil-atualizada", localRefresh);
    };
  }, [purchase?.id, refresh]);

  const mutateDemo = (change: (purchases: Purchase[]) => Purchase[]) => {
    const next = change(loadDemo()).map(calculatePurchase);
    saveDemo(next);
    setSummaries(summariesFrom(next));
    const selected = next.find((item) => item.id === purchase?.id) ?? next.find((item) => item.status === "active") ?? null;
    setPurchase(selected);
  };

  const addItem = async (draft: ItemDraft) => {
    if (!purchase) return;
    const payload = {
      name: draft.name.trim(), category: draft.category, purchaseMode: draft.purchaseMode,
      targetQuantity: parseNumber(draft.targetQuantity), quantity: parseNumber(draft.quantity),
      unit: draft.unit, unitPrice: parseNumber(draft.unitPrice),
    };
    if (!USE_DATABASE) {
      mutateDemo((purchases) => purchases.map((current) => current.id === purchase.id ? {
        ...current,
        items: [...current.items, {
          id: uid(), purchaseId: current.id, ...payload,
          quantity: payload.purchaseMode === "weighted" ? 0 : payload.quantity,
          unit: payload.purchaseMode === "weighted" ? "kg" : payload.unit,
          unitPrice: payload.purchaseMode === "weighted" ? 0 : payload.unitPrice,
          picked: false, position: current.items.length, weighings: [],
        }],
      } : current));
    } else {
      const response = await fetch(`/api/purchases/${purchase.id}/items`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!response.ok) throw new Error("Não foi possível adicionar o produto.");
      await refresh(purchase.id, true);
    }
    setAdding(false);
  };

  const updateItem = async (id: string, changes: Partial<PurchaseItem> | ItemDraft) => {
    if (!purchase) return;
    const payload = "purchaseMode" in changes && typeof changes.targetQuantity === "string" ? (() => {
      const draft = changes as ItemDraft;
      return {
        name: draft.name.trim(), category: draft.category, purchaseMode: draft.purchaseMode,
        targetQuantity: parseNumber(draft.targetQuantity), quantity: parseNumber(draft.quantity),
        unit: draft.unit, unitPrice: parseNumber(draft.unitPrice),
      };
    })() : changes;
    if (!USE_DATABASE) {
      mutateDemo((purchases) => purchases.map((current) => current.id === purchase.id ? {
        ...current,
        items: current.items.map((item) => item.id === id ? normalizeItem({ ...item, ...payload } as PurchaseItem) : item),
      } : current));
    } else {
      const response = await fetch(`/api/items/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!response.ok) throw new Error("Não foi possível atualizar o produto.");
      await refresh(purchase.id, true);
    }
    setEditingId(null);
  };

  const deleteItem = async (id: string) => {
    if (!purchase || !window.confirm("Excluir este produto da lista?")) return;
    if (!USE_DATABASE) {
      mutateDemo((purchases) => purchases.map((current) => current.id === purchase.id ? { ...current, items: current.items.filter((item) => item.id !== id) } : current));
    } else {
      const response = await fetch(`/api/items/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Não foi possível excluir o produto.");
      await refresh(purchase.id, true);
    }
  };

  const addWeighing = async (item: PurchaseItem, draft: WeighingDraft) => {
    if (!purchase) return;
    const weightKg = parseNumber(draft.weightKg);
    const directTotal = parseNumber(draft.totalPrice);
    const pricePerKg = parseNumber(draft.pricePerKg);
    const totalPrice = directTotal > 0 ? directTotal : weightKg * pricePerKg;
    if (weightKg <= 0) return;
    if (!USE_DATABASE) {
      mutateDemo((purchases) => purchases.map((current) => current.id === purchase.id ? {
        ...current,
        items: current.items.map((candidate) => candidate.id === item.id ? {
          ...candidate,
          weighings: [...candidate.weighings, { id: uid(), itemId: item.id, weightKg, totalPrice, position: candidate.weighings.length }],
        } : candidate),
      } : current));
    } else {
      const response = await fetch(`/api/items/${item.id}/weighings`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ weightKg, totalPrice }) });
      if (!response.ok) throw new Error("Não foi possível salvar a pesagem.");
      await refresh(purchase.id, true);
    }
    setWeighingItemId(null);
  };

  const deleteWeighing = async (item: PurchaseItem, weighing: ItemWeighing) => {
    if (!purchase || !window.confirm(`Excluir a pesagem de ${decimal(weighing.weightKg)} kg?`)) return;
    if (!USE_DATABASE) {
      mutateDemo((purchases) => purchases.map((current) => current.id === purchase.id ? {
        ...current,
        items: current.items.map((candidate) => candidate.id === item.id ? { ...candidate, weighings: candidate.weighings.filter((entry) => entry.id !== weighing.id) } : candidate),
      } : current));
    } else {
      const response = await fetch(`/api/weighings/${weighing.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Não foi possível excluir a pesagem.");
      await refresh(purchase.id, true);
    }
  };

  const finishPurchase = async () => {
    if (!purchase || !window.confirm("Finalizar esta compra? Ela continuará disponível no histórico.")) return;
    if (!USE_DATABASE) mutateDemo((purchases) => purchases.map((current) => current.id === purchase.id ? { ...current, status: "finished" } : current));
    else {
      const response = await fetch(`/api/purchases/${purchase.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "finished" }) });
      if (!response.ok) throw new Error("Não foi possível finalizar a compra.");
    }
    setPurchase(null);
    setView("history");
    await refresh(undefined, true);
  };

  const startPurchase = async () => {
    if (!USE_DATABASE) {
      const purchases = loadDemo();
      const active = purchases.find((item) => item.status === "active");
      const created = active ?? newDemoPurchase();
      if (!active) saveDemo([...purchases, created]);
      setPurchase(created);
    } else {
      const response = await fetch("/api/purchases", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ purchaseDate: today() }) });
      if (!response.ok) throw new Error("Não foi possível iniciar uma nova compra.");
      const data = await response.json();
      await refresh(data.id, true);
    }
    setView("current");
  };

  const completed = useMemo(() => purchase?.items.filter((item) => item.picked).length ?? 0, [purchase]);

  if (loading) return <><S.GlobalStyle /><S.Loading>Preparando sua lista...</S.Loading></>;

  return (
    <S.Shell>
      <S.GlobalStyle />
      <S.Header><S.HeaderInner><S.Brand><S.BrandIcon><ShoppingBasket /></S.BrandIcon><div><h1>Lista Fácil</h1><span>Mercado</span></div></S.Brand><S.SyncBadge title={USE_DATABASE ? "Sincronização automática" : "Modo local de demonstração"}><RefreshCw className={syncing ? "spin" : ""} /><span>{USE_DATABASE ? "Sincronizado" : "Teste local"}</span></S.SyncBadge></S.HeaderInner></S.Header>
      <S.Main>
        <S.Navigation aria-label="Navegação principal"><S.NavButton $active={view === "current"} onClick={() => { setView("current"); void refresh(); }}><ListChecks size={16} /> Lista atual</S.NavButton><S.NavButton $active={view === "history"} onClick={() => setView("history")}><History size={16} /> Histórico</S.NavButton></S.Navigation>
        {!USE_DATABASE && <S.Notice>Modo de demonstração: os dados estão somente neste navegador.</S.Notice>}
        {error && <S.ErrorNotice>{error}</S.ErrorNotice>}
        {view === "history" ? (
          <HistoryView summaries={summaries.filter((item) => item.status === "finished")} onOpen={(id) => { setView("current"); void refresh(id); }} onStart={startPurchase} />
        ) : purchase ? (
          <>
            <S.PurchaseHead><div><h2>{purchase.status === "active" ? "Compra atual" : "Compra finalizada"}</h2><p>{dateLabel(purchase.purchaseDate)} · {completed} de {purchase.items.length} pegos</p></div>{purchase.status === "active" && <S.SecondaryButton onClick={() => void refresh(purchase.id)}><RefreshCw /> Atualizar</S.SecondaryButton>}</S.PurchaseHead>
            <S.Panel>
              {purchase.items.length === 0 ? <S.Empty><ShoppingBasket /><h3>Sua lista está vazia</h3><p>Adicione o primeiro produto da compra.</p></S.Empty> : (
                <>
                  <S.DesktopTable>
                    <S.TableHeader><span>Pego</span><span>Produto</span><span>Quantidade</span><span>Unidade</span><span>Valor unit.</span><span>Total</span><span>Ações</span></S.TableHeader>
                    {purchase.items.map((item) => editingId === item.id ? <ItemEditor key={item.id} item={item} onSave={(draft) => updateItem(item.id, draft)} onCancel={() => setEditingId(null)} /> : (
                      <div key={item.id}>
                        <S.TableRow $picked={item.picked}>
                          <S.CheckButton $checked={item.picked} aria-label={item.picked ? "Desmarcar produto pego" : "Marcar produto como pego"} disabled={purchase.status === "finished"} onClick={() => updateItem(item.id, { picked: !item.picked })}>{item.picked && <Check />}</S.CheckButton>
                          <div><strong>{item.name}</strong><S.MetaLine><S.MetaBadge>{item.category}</S.MetaBadge>{item.purchaseMode === "weighted" && <S.MetaBadge>Peso fracionado</S.MetaBadge>}</S.MetaLine></div>
                          <span>{item.purchaseMode === "weighted" ? decimal(itemWeight(item)) : item.quantity}</span><span>{item.purchaseMode === "weighted" ? "kg" : item.unit}</span><span>{item.purchaseMode === "weighted" ? (itemWeight(item) > 0 ? `${money(itemValue(item) / itemWeight(item))}/kg` : "—") : money(item.unitPrice)}</span><strong>{money(itemValue(item))}</strong>
                          <S.RowActions>{purchase.status === "active" && <><S.IconButton aria-label="Editar produto" onClick={() => setEditingId(item.id)}><Pencil /></S.IconButton><S.IconButton $danger aria-label="Excluir produto" onClick={() => deleteItem(item.id)}><Trash2 /></S.IconButton></>}</S.RowActions>
                        </S.TableRow>
                        {item.purchaseMode === "weighted" && <WeightedDetails item={item} active={purchase.status === "active"} onAdd={() => setWeighingItemId(item.id)} onDelete={(weighing) => void deleteWeighing(item, weighing)} />}
                        {weighingItemId === item.id && <WeighingForm item={item} onSave={(draft) => addWeighing(item, draft)} onCancel={() => setWeighingItemId(null)} />}
                      </div>
                    ))}
                  </S.DesktopTable>
                  <S.MobileList>
                    {purchase.items.map((item) => editingId === item.id ? <ItemEditor key={item.id} item={item} onSave={(draft) => updateItem(item.id, draft)} onCancel={() => setEditingId(null)} /> : (
                      <S.MobileCard key={item.id} $picked={item.picked}>
                        <S.MobileTop><S.CheckButton $checked={item.picked} aria-label={item.picked ? "Desmarcar produto pego" : "Marcar produto como pego"} disabled={purchase.status === "finished"} onClick={() => updateItem(item.id, { picked: !item.picked })}>{item.picked && <Check />}</S.CheckButton><S.MobileProduct><strong>{item.name}</strong><S.MetaLine><S.MetaBadge>{item.category}</S.MetaBadge>{item.purchaseMode === "weighted" && <S.MetaBadge>Peso fracionado</S.MetaBadge>}</S.MetaLine><small>{item.picked ? "Produto pego" : "Ainda não pego"}</small></S.MobileProduct><S.RowActions>{purchase.status === "active" && <><S.IconButton aria-label="Editar produto" onClick={() => setEditingId(item.id)}><Pencil /></S.IconButton><S.IconButton $danger aria-label="Excluir produto" onClick={() => deleteItem(item.id)}><Trash2 /></S.IconButton></>}</S.RowActions></S.MobileTop>
                        {item.purchaseMode === "standard" ? <S.MobileGrid><div><span>Quantidade</span><strong>{item.quantity} {item.unit}</strong></div><div><span>Valor unitário</span><strong>{money(item.unitPrice)}</strong></div><div><span>Total</span><strong>{money(itemValue(item))}</strong></div></S.MobileGrid> : <WeightedDetails item={item} active={purchase.status === "active"} onAdd={() => setWeighingItemId(item.id)} onDelete={(weighing) => void deleteWeighing(item, weighing)} />}
                        {weighingItemId === item.id && <WeighingForm item={item} onSave={(draft) => addWeighing(item, draft)} onCancel={() => setWeighingItemId(null)} />}
                      </S.MobileCard>
                    ))}
                  </S.MobileList>
                </>
              )}
              {purchase.status === "active" && (adding ? <AddItemForm onSave={addItem} onCancel={() => setAdding(false)} /> : <S.AddArea><S.SecondaryButton onClick={() => setAdding(true)}><Plus /> Adicionar produto</S.SecondaryButton></S.AddArea>)}
            </S.Panel>
            <S.TotalBar><div><span>Total da compra</span><strong>{money(purchase.total)}</strong></div>{purchase.status === "active" && <S.PrimaryButton onClick={finishPurchase} disabled={!purchase.items.length}><CheckCircle2 /> Finalizar compra</S.PrimaryButton>}</S.TotalBar>
          </>
        ) : <S.Empty><ClipboardList /><h3>Nenhuma compra em andamento</h3><p>Comece uma nova lista para a próxima ida ao mercado.</p><br /><S.PrimaryButton onClick={startPurchase}><Plus /> Nova compra</S.PrimaryButton></S.Empty>}
      </S.Main>
    </S.Shell>
  );
}

function HistoryView({ summaries, onOpen, onStart }: { summaries: PurchaseSummary[]; onOpen: (id: string) => void; onStart: () => void }) {
  return (
    <><S.PurchaseHead><div><h2>Histórico de compras</h2><p>Consulte as listas e os valores das compras anteriores.</p></div><S.PrimaryButton onClick={onStart}><Plus /> Nova compra</S.PrimaryButton></S.PurchaseHead>{summaries.length === 0 ? <S.Panel><S.Empty><History /><h3>Ainda não há compras finalizadas</h3><p>Quando finalizar sua primeira compra, ela aparecerá aqui.</p></S.Empty></S.Panel> : <S.HistoryGrid>{summaries.map((item) => <S.HistoryCard key={item.id} onClick={() => onOpen(item.id)}><h3>Compra de {dateLabel(item.purchaseDate)}</h3><div><span>Produtos</span><strong>{item.itemCount}</strong></div><div><span>Itens pegos</span><strong>{item.pickedCount}</strong></div><div><span>Total</span><strong>{money(item.total)}</strong></div></S.HistoryCard>)}</S.HistoryGrid>}</>
  );
}
