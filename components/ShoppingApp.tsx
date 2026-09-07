"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  Check, CheckCircle2, ClipboardList, History, ListChecks, Pencil, Plus,
  RefreshCw, Save, ShoppingBasket, Trash2, X,
} from "lucide-react";
import type { Purchase, PurchaseItem, PurchaseSummary } from "@/lib/types";
import * as S from "./styles";

const USE_DATABASE = process.env.NEXT_PUBLIC_USE_DATABASE === "true";
const STORAGE_KEY = "lista-facil-mercado:v1";
const UNITS = ["un", "kg", "g", "L", "ml", "pct", "cx"];

function uid() {
  return typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function calculatePurchase(purchase: Purchase): Purchase {
  return {
    ...purchase,
    total: purchase.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0),
    pickedCount: purchase.items.filter((item) => item.picked).length,
  };
}

function newDemoPurchase(): Purchase {
  return { id: uid(), purchaseDate: today(), status: "active", items: [], total: 0, pickedCount: 0 };
}

function loadDemo(): Purchase[] {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    if (value) return (JSON.parse(value) as Purchase[]).map(calculatePurchase);
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

function dateLabel(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "long", year: "numeric" })
    .format(new Date(`${value}T12:00:00`));
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

interface ItemDraft { name: string; quantity: string; unit: string; unitPrice: string }

function ItemEditor({ item, onSave, onCancel }: {
  item: PurchaseItem;
  onSave: (draft: ItemDraft) => Promise<void>;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<ItemDraft>({
    name: item.name,
    quantity: String(item.quantity),
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
      <label><span>Produto</span><S.TextInput autoFocus value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} required /></label>
      <label><span>Quantidade</span><S.TextInput inputMode="decimal" value={draft.quantity} onChange={(e) => setDraft({ ...draft, quantity: e.target.value })} /></label>
      <label><span>Unidade</span><S.Select value={draft.unit} onChange={(e) => setDraft({ ...draft, unit: e.target.value })}>{UNITS.map((unit) => <option key={unit}>{unit}</option>)}</S.Select></label>
      <label><span>Valor unitário</span><S.TextInput inputMode="decimal" value={draft.unitPrice} onChange={(e) => setDraft({ ...draft, unitPrice: e.target.value })} /></label>
      <S.RowActions>
        <S.IconButton type="submit" aria-label="Salvar alterações" disabled={saving}><Save /></S.IconButton>
        <S.IconButton type="button" $danger aria-label="Cancelar edição" onClick={onCancel}><X /></S.IconButton>
      </S.RowActions>
    </S.AddForm>
  );
}

function AddItemForm({ onSave, onCancel }: { onSave: (draft: ItemDraft) => Promise<void>; onCancel: () => void }) {
  const [draft, setDraft] = useState<ItemDraft>({ name: "", quantity: "1", unit: "un", unitPrice: "0,00" });
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
      <label><span>Produto</span><S.TextInput autoFocus placeholder="Ex.: Arroz" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} required /></label>
      <label><span>Quantidade</span><S.TextInput inputMode="decimal" value={draft.quantity} onChange={(e) => setDraft({ ...draft, quantity: e.target.value })} /></label>
      <label><span>Unidade</span><S.Select value={draft.unit} onChange={(e) => setDraft({ ...draft, unit: e.target.value })}>{UNITS.map((unit) => <option key={unit}>{unit}</option>)}</S.Select></label>
      <label><span>Valor unitário</span><S.TextInput inputMode="decimal" value={draft.unitPrice} onChange={(e) => setDraft({ ...draft, unitPrice: e.target.value })} /></label>
      <S.RowActions>
        <S.IconButton type="submit" aria-label="Salvar produto" disabled={saving}><Check /></S.IconButton>
        <S.IconButton type="button" $danger aria-label="Cancelar" onClick={onCancel}><X /></S.IconButton>
      </S.RowActions>
    </S.AddForm>
  );
}

export default function ShoppingApp() {
  const [view, setView] = useState<"current" | "history">("current");
  const [purchase, setPurchase] = useState<Purchase | null>(null);
  const [summaries, setSummaries] = useState<PurchaseSummary[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
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
        if (selected) setPurchase(calculatePurchase(selected));
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
        const createdData = await created.json();
        selectedId = createdData.id;
      }
      if (selectedId) {
        const detail = await fetch(`/api/purchases/${selectedId}`, { cache: "no-store" });
        if (!detail.ok) throw new Error("Não foi possível abrir a compra.");
        setPurchase((await detail.json()).purchase);
      }
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

  const parseNumber = (value: string) => Math.max(0, Number(value.replace(",", ".")) || 0);

  const addItem = async (draft: ItemDraft) => {
    if (!purchase) return;
    const payload = { name: draft.name.trim(), quantity: parseNumber(draft.quantity), unit: draft.unit, unitPrice: parseNumber(draft.unitPrice) };
    if (!USE_DATABASE) {
      mutateDemo((purchases) => purchases.map((current) => current.id === purchase.id ? {
        ...current,
        items: [...current.items, { id: uid(), purchaseId: current.id, ...payload, picked: false, position: current.items.length }],
      } : current));
    } else {
      await fetch(`/api/purchases/${purchase.id}/items`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      await refresh(purchase.id, true);
    }
    setAdding(false);
  };

  const updateItem = async (id: string, changes: Partial<PurchaseItem> | ItemDraft) => {
    if (!purchase) return;
    const payload = typeof changes.unitPrice === "string" ? (() => {
      const draft = changes as ItemDraft;
      return { name: draft.name.trim(), quantity: parseNumber(draft.quantity), unit: draft.unit, unitPrice: parseNumber(draft.unitPrice) };
    })() : changes;
    if (!USE_DATABASE) {
      mutateDemo((purchases) => purchases.map((current) => current.id === purchase.id ? {
        ...current, items: current.items.map((item) => item.id === id ? { ...item, ...payload } as PurchaseItem : item),
      } : current));
    } else {
      await fetch(`/api/items/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      await refresh(purchase.id, true);
    }
    setEditingId(null);
  };

  const deleteItem = async (id: string) => {
    if (!purchase || !window.confirm("Excluir este produto da lista?")) return;
    if (!USE_DATABASE) {
      mutateDemo((purchases) => purchases.map((current) => current.id === purchase.id ? { ...current, items: current.items.filter((item) => item.id !== id) } : current));
    } else {
      await fetch(`/api/items/${id}`, { method: "DELETE" });
      await refresh(purchase.id, true);
    }
  };

  const finishPurchase = async () => {
    if (!purchase || !window.confirm("Finalizar esta compra? Ela continuará disponível no histórico.")) return;
    if (!USE_DATABASE) {
      mutateDemo((purchases) => purchases.map((current) => current.id === purchase.id ? { ...current, status: "finished" } : current));
    } else {
      await fetch(`/api/purchases/${purchase.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "finished" }) });
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
      <S.Header>
        <S.HeaderInner>
          <S.Brand><S.BrandIcon><ShoppingBasket /></S.BrandIcon><div><h1>Lista Fácil</h1><span>Mercado</span></div></S.Brand>
          <S.SyncBadge title={USE_DATABASE ? "Sincronização automática" : "Modo local de demonstração"}><RefreshCw className={syncing ? "spin" : ""} /><span>{USE_DATABASE ? "Sincronizado" : "Teste local"}</span></S.SyncBadge>
        </S.HeaderInner>
      </S.Header>

      <S.Main>
        <S.Navigation aria-label="Navegação principal">
          <S.NavButton $active={view === "current"} onClick={() => { setView("current"); void refresh(); }}><ListChecks size={16} /> Lista atual</S.NavButton>
          <S.NavButton $active={view === "history"} onClick={() => setView("history")}><History size={16} /> Histórico</S.NavButton>
        </S.Navigation>

        {!USE_DATABASE && <S.Notice>Modo de demonstração: os dados estão somente neste navegador. A sincronização entre celulares será ativada ao conectar a Neon.</S.Notice>}
        {error && <S.ErrorNotice>{error}</S.ErrorNotice>}

        {view === "history" ? (
          <HistoryView summaries={summaries.filter((item) => item.status === "finished")} onOpen={(id) => { setView("current"); void refresh(id); }} onStart={startPurchase} />
        ) : purchase ? (
          <>
            <S.PurchaseHead>
              <div><h2>{purchase.status === "active" ? "Compra atual" : "Compra finalizada"}</h2><p>{dateLabel(purchase.purchaseDate)} · {completed} de {purchase.items.length} pegos</p></div>
              {purchase.status === "active" && <S.SecondaryButton onClick={() => void refresh(purchase.id)}><RefreshCw /> Atualizar</S.SecondaryButton>}
            </S.PurchaseHead>

            <S.Panel>
              {purchase.items.length === 0 ? (
                <S.Empty><ShoppingBasket /><h3>Sua lista está vazia</h3><p>Adicione o primeiro produto da compra.</p></S.Empty>
              ) : (
                <>
                  <S.DesktopTable>
                    <S.TableHeader><span>Pego</span><span>Produto</span><span>Quantidade</span><span>Unidade</span><span>Valor unit.</span><span>Total</span><span>Ações</span></S.TableHeader>
                    {purchase.items.map((item) => editingId === item.id ? <ItemEditor key={item.id} item={item} onSave={(draft) => updateItem(item.id, draft)} onCancel={() => setEditingId(null)} /> : (
                      <S.TableRow key={item.id} $picked={item.picked}>
                        <S.CheckButton $checked={item.picked} aria-label={item.picked ? "Desmarcar produto pego" : "Marcar produto como pego"} disabled={purchase.status === "finished"} onClick={() => updateItem(item.id, { picked: !item.picked })}>{item.picked && <Check />}</S.CheckButton>
                        <strong>{item.name}</strong><span>{item.quantity}</span><span>{item.unit}</span><span>{money(item.unitPrice)}</span><strong>{money(item.quantity * item.unitPrice)}</strong>
                        <S.RowActions>{purchase.status === "active" && <><S.IconButton aria-label="Editar produto" onClick={() => setEditingId(item.id)}><Pencil /></S.IconButton><S.IconButton $danger aria-label="Excluir produto" onClick={() => deleteItem(item.id)}><Trash2 /></S.IconButton></>}</S.RowActions>
                      </S.TableRow>
                    ))}
                  </S.DesktopTable>
                  <S.MobileList>
                    {purchase.items.map((item) => editingId === item.id ? <ItemEditor key={item.id} item={item} onSave={(draft) => updateItem(item.id, draft)} onCancel={() => setEditingId(null)} /> : (
                      <S.MobileCard key={item.id} $picked={item.picked}>
                        <S.MobileTop>
                          <S.CheckButton $checked={item.picked} aria-label={item.picked ? "Desmarcar produto pego" : "Marcar produto como pego"} disabled={purchase.status === "finished"} onClick={() => updateItem(item.id, { picked: !item.picked })}>{item.picked && <Check />}</S.CheckButton>
                          <S.MobileProduct><strong>{item.name}</strong><small>{item.picked ? "Produto pego" : "Ainda não pego"}</small></S.MobileProduct>
                          <S.RowActions>{purchase.status === "active" && <><S.IconButton aria-label="Editar produto" onClick={() => setEditingId(item.id)}><Pencil /></S.IconButton><S.IconButton $danger aria-label="Excluir produto" onClick={() => deleteItem(item.id)}><Trash2 /></S.IconButton></>}</S.RowActions>
                        </S.MobileTop>
                        <S.MobileGrid><div><span>Quantidade</span><strong>{item.quantity} {item.unit}</strong></div><div><span>Valor unitário</span><strong>{money(item.unitPrice)}</strong></div><div><span>Total</span><strong>{money(item.quantity * item.unitPrice)}</strong></div></S.MobileGrid>
                      </S.MobileCard>
                    ))}
                  </S.MobileList>
                </>
              )}
              {purchase.status === "active" && (adding ? <AddItemForm onSave={addItem} onCancel={() => setAdding(false)} /> : <S.AddArea><S.SecondaryButton onClick={() => setAdding(true)}><Plus /> Adicionar produto</S.SecondaryButton></S.AddArea>)}
            </S.Panel>

            <S.TotalBar>
              <div><span>Total da compra</span><strong>{money(purchase.total)}</strong></div>
              {purchase.status === "active" && <S.PrimaryButton onClick={finishPurchase} disabled={!purchase.items.length}><CheckCircle2 /> Finalizar compra</S.PrimaryButton>}
            </S.TotalBar>
          </>
        ) : (
          <S.Empty><ClipboardList /><h3>Nenhuma compra em andamento</h3><p>Comece uma nova lista para a próxima ida ao mercado.</p><br /><S.PrimaryButton onClick={startPurchase}><Plus /> Nova compra</S.PrimaryButton></S.Empty>
        )}
      </S.Main>
    </S.Shell>
  );
}

function HistoryView({ summaries, onOpen, onStart }: { summaries: PurchaseSummary[]; onOpen: (id: string) => void; onStart: () => void }) {
  return (
    <>
      <S.PurchaseHead><div><h2>Histórico de compras</h2><p>Consulte as listas e os valores das compras anteriores.</p></div><S.PrimaryButton onClick={onStart}><Plus /> Nova compra</S.PrimaryButton></S.PurchaseHead>
      {summaries.length === 0 ? <S.Panel><S.Empty><History /><h3>Ainda não há compras finalizadas</h3><p>Quando finalizar sua primeira compra, ela aparecerá aqui.</p></S.Empty></S.Panel> : (
        <S.HistoryGrid>{summaries.map((item) => <S.HistoryCard key={item.id} onClick={() => onOpen(item.id)}><h3>Compra de {dateLabel(item.purchaseDate)}</h3><div><span>Produtos</span><strong>{item.itemCount}</strong></div><div><span>Itens pegos</span><strong>{item.pickedCount}</strong></div><div><span>Total</span><strong>{money(item.total)}</strong></div></S.HistoryCard>)}</S.HistoryGrid>
      )}
    </>
  );
}
