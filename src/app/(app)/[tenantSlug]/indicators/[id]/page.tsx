"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useTenant } from "@/hooks/use-tenant";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  TrendingUp,
  FolderKanban,
  Target,
  Calendar,
  Plus,
} from "lucide-react";
import { getFrequencyLabel, formatDate } from "@/lib/utils";
import { toast } from "sonner";
import type { Indicator, IndicatorMeasurement } from "@/types";

const FREQUENCIES = [
  { value: "daily", label: "Diário" },
  { value: "weekly", label: "Semanal" },
  { value: "monthly", label: "Mensal" },
  { value: "quarterly", label: "Trimestral" },
  { value: "yearly", label: "Anual" },
];

interface IndicatorDetail extends Omit<Indicator, "measurements"> {
  project?: { id: string; name: string } | null;
  measurements?: IndicatorMeasurement[];
}

export default function IndicatorDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { tenant, can } = useTenant();
  const id = params.id as string;

  const [indicator, setIndicator] = useState<IndicatorDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState("");

  // Edit fields
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editUnit, setEditUnit] = useState("");
  const [editFrequency, setEditFrequency] = useState("");
  const [editTarget, setEditTarget] = useState("");
  const [editLower, setEditLower] = useState("");
  const [editUpper, setEditUpper] = useState("");

  // New measurement
  const [showAddMeasurement, setShowAddMeasurement] = useState(false);
  const [mValue, setMValue] = useState("");
  const [mPeriod, setMPeriod] = useState("");
  const [mNotes, setMNotes] = useState("");
  const [addingMeasurement, setAddingMeasurement] = useState(false);

  // Edit/delete measurement
  const [editingMeasurementId, setEditingMeasurementId] = useState<string | null>(null);
  const [editMValue, setEditMValue] = useState("");
  const [editMPeriod, setEditMPeriod] = useState("");
  const [editMNotes, setEditMNotes] = useState("");
  const [savingMeasurement, setSavingMeasurement] = useState(false);
  const [confirmDeleteMeasurement, setConfirmDeleteMeasurement] = useState<string | null>(null);
  const [deletingMeasurementId, setDeletingMeasurementId] = useState<string | null>(null);

  const fetchIndicator = () => {
    fetch(`/api/tenants/${tenant.slug}/indicators/${id}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.data) setIndicator(res.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchIndicator();
  }, [tenant.slug, id]);

  const startEdit = () => {
    if (!indicator) return;
    setEditName(indicator.name);
    setEditDescription(indicator.description || "");
    setEditUnit(indicator.unit);
    setEditFrequency(indicator.frequency);
    setEditTarget(String(Number(indicator.target)));
    setEditLower(indicator.lowerLimit !== null ? String(Number(indicator.lowerLimit)) : "");
    setEditUpper(indicator.upperLimit !== null ? String(Number(indicator.upperLimit)) : "");
    setEditing(true);
    setError("");
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/tenants/${tenant.slug}/indicators/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          description: editDescription || null,
          unit: editUnit,
          frequency: editFrequency,
          target: parseFloat(editTarget),
          lowerLimit: editLower ? parseFloat(editLower) : null,
          upperLimit: editUpper ? parseFloat(editUpper) : null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao atualizar");
      }
      setLoading(true);
      fetchIndicator();
      setEditing(false);
      toast.success("Indicador atualizado com sucesso");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao salvar";
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/tenants/${tenant.slug}/indicators/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Erro ao excluir");
      toast.success("Indicador excluído com sucesso");
      router.push(`/${tenant.slug}/indicators`);
    } catch {
      setError("Erro ao excluir indicador");
      toast.error("Erro ao excluir indicador");
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  const handleAddMeasurement = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingMeasurement(true);
    setError("");
    try {
      const res = await fetch(`/api/tenants/${tenant.slug}/indicators/${id}/measurements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          value: parseFloat(mValue),
          period: mPeriod,
          notes: mNotes || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao registrar medição");
      }
      setMValue("");
      setMPeriod("");
      setMNotes("");
      setShowAddMeasurement(false);
      setLoading(true);
      fetchIndicator();
      toast.success("Medição adicionada com sucesso");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao registrar";
      setError(message);
      toast.error(message);
    } finally {
      setAddingMeasurement(false);
    }
  };

  const startEditMeasurement = (m: IndicatorMeasurement) => {
    setEditingMeasurementId(m.id);
    setEditMValue(String(Number(m.value)));
    setEditMPeriod(new Date(m.period).toISOString().split("T")[0]);
    setEditMNotes(m.notes || "");
    setError("");
  };

  const handleSaveMeasurement = async () => {
    if (!editingMeasurementId) return;
    setSavingMeasurement(true);
    setError("");
    try {
      const res = await fetch(
        `/api/tenants/${tenant.slug}/indicators/${id}/measurements/${editingMeasurementId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            value: parseFloat(editMValue),
            period: editMPeriod,
            notes: editMNotes || null,
          }),
        }
      );
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao atualizar medição");
      }
      setEditingMeasurementId(null);
      setLoading(true);
      fetchIndicator();
      toast.success("Medição atualizada com sucesso");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao salvar";
      setError(message);
      toast.error(message);
    } finally {
      setSavingMeasurement(false);
    }
  };

  const handleDeleteMeasurement = async (measurementId: string) => {
    setDeletingMeasurementId(measurementId);
    try {
      const res = await fetch(
        `/api/tenants/${tenant.slug}/indicators/${id}/measurements/${measurementId}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error("Erro ao excluir");
      setConfirmDeleteMeasurement(null);
      setLoading(true);
      fetchIndicator();
      toast.success("Medição excluída com sucesso");
    } catch {
      setError("Erro ao excluir medição");
      toast.error("Erro ao excluir medição");
    } finally {
      setDeletingMeasurementId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 bg-surface-tertiary rounded animate-pulse" />
          <div className="h-6 w-48 bg-surface-tertiary rounded animate-pulse" />
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-5 bg-surface-tertiary rounded w-1/3" />
              <div className="h-4 bg-surface-tertiary rounded w-2/3" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!indicator) {
    return (
      <div className="space-y-6">
        <Link href={`/${tenant.slug}/indicators`}>
          <Button variant="ghost" size="icon-sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <Card>
          <CardContent className="flex flex-col items-center py-12">
            <TrendingUp className="h-12 w-12 text-foreground-tertiary mb-4" />
            <p className="text-title-3 text-foreground-primary">Indicador não encontrado</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const measurements = indicator.measurements || [];
  const targetNum = Number(indicator.target);
  const lowerNum = indicator.lowerLimit !== null ? Number(indicator.lowerLimit) : null;
  const upperNum = indicator.upperLimit !== null ? Number(indicator.upperLimit) : null;

  // Chart data: last 12 measurements, reversed for chronological order
  const chartData = measurements.slice(0, 12).reverse();
  const allValues = chartData.map((m) => Number(m.value));
  const chartMax = allValues.length > 0
    ? Math.max(...allValues, targetNum, upperNum || 0) * 1.1
    : targetNum * 1.5;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Link href={`/${tenant.slug}/indicators`}>
            <Button variant="ghost" size="icon-sm" className="mt-1">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-title-1 text-foreground-primary">{indicator.name}</h1>
            <div className="flex items-center gap-2 mt-1 text-body-2 text-foreground-secondary">
              <span>{getFrequencyLabel(indicator.frequency)}</span>
              <span>&middot;</span>
              <span>Meta: {targetNum.toLocaleString("pt-BR")} {indicator.unit}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {can("indicator", "update") && !editing && (
            <Button variant="outline" size="sm" onClick={startEdit}>
              <Pencil className="h-4 w-4" />
              Editar
            </Button>
          )}
          {can("indicator", "delete") && !editing && (
            <>
              {confirmDelete ? (
                <div className="flex items-center gap-2">
                  <span className="text-body-2 text-danger-fg">Confirmar?</span>
                  <Button variant="danger" size="sm" onClick={handleDelete} loading={deleting}>
                    Sim, excluir
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setConfirmDelete(false)}>
                    Não
                  </Button>
                </div>
              ) : (
                <Button variant="outline" size="sm" onClick={() => setConfirmDelete(true)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Edit Form */}
      {editing ? (
        <Card>
          <CardHeader>
            <h2 className="text-title-3 text-foreground-primary">Editar Indicador</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-body-2 font-medium text-foreground-primary mb-1">Nome</label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div>
              <label className="block text-body-2 font-medium text-foreground-primary mb-1">Descrição</label>
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={3}
                className="w-full rounded-input border border-stroke-primary bg-surface-primary px-3 py-2 text-body-1 text-foreground-primary focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent resize-none"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-body-2 font-medium text-foreground-primary mb-1">Unidade</label>
                <Input value={editUnit} onChange={(e) => setEditUnit(e.target.value)} />
              </div>
              <div>
                <label className="block text-body-2 font-medium text-foreground-primary mb-1">Frequência</label>
                <select
                  value={editFrequency}
                  onChange={(e) => setEditFrequency(e.target.value)}
                  className="h-10 w-full rounded-input border border-stroke-primary bg-surface-primary px-3 text-body-1 text-foreground-primary focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                >
                  {FREQUENCIES.map((f) => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-body-2 font-medium text-foreground-primary mb-1">Meta</label>
                <Input type="number" step="0.01" value={editTarget} onChange={(e) => setEditTarget(e.target.value)} />
              </div>
              <div>
                <label className="block text-body-2 font-medium text-foreground-primary mb-1">Limite inferior</label>
                <Input type="number" step="0.01" value={editLower} onChange={(e) => setEditLower(e.target.value)} />
              </div>
              <div>
                <label className="block text-body-2 font-medium text-foreground-primary mb-1">Limite superior</label>
                <Input type="number" step="0.01" value={editUpper} onChange={(e) => setEditUpper(e.target.value)} />
              </div>
            </div>
            {error && (
              <div className="bg-danger-bg text-danger-fg text-body-2 p-3 rounded-button">{error}</div>
            )}
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setEditing(false)}>Cancelar</Button>
              <Button onClick={handleSave} loading={saving}>Salvar</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-5 space-y-3">
                {indicator.description && (
                  <p className="text-body-2 text-foreground-secondary">{indicator.description}</p>
                )}
                {indicator.project && (
                  <div className="flex items-center gap-2 text-body-2">
                    <FolderKanban className="h-4 w-4 text-foreground-tertiary" />
                    <span className="text-foreground-secondary">Projeto:</span>
                    <span className="text-foreground-primary font-medium">{indicator.project.name}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-body-2">
                  <Calendar className="h-4 w-4 text-foreground-tertiary" />
                  <span className="text-foreground-secondary">Criado em:</span>
                  <span className="text-foreground-primary font-medium">{formatDate(indicator.createdAt)}</span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-caption-1 text-foreground-tertiary">Meta</p>
                    <p className="text-title-3 font-semibold text-foreground-primary">
                      {targetNum.toLocaleString("pt-BR")}
                    </p>
                    <p className="text-caption-1 text-foreground-tertiary">{indicator.unit}</p>
                  </div>
                  {lowerNum !== null && (
                    <div>
                      <p className="text-caption-1 text-foreground-tertiary">Lim. Inferior</p>
                      <p className="text-title-3 font-semibold text-warning-fg">
                        {lowerNum.toLocaleString("pt-BR")}
                      </p>
                      <p className="text-caption-1 text-foreground-tertiary">{indicator.unit}</p>
                    </div>
                  )}
                  {upperNum !== null && (
                    <div>
                      <p className="text-caption-1 text-foreground-tertiary">Lim. Superior</p>
                      <p className="text-title-3 font-semibold text-warning-fg">
                        {upperNum.toLocaleString("pt-BR")}
                      </p>
                      <p className="text-caption-1 text-foreground-tertiary">{indicator.unit}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chart */}
          {chartData.length > 0 && (
            <Card>
              <CardHeader>
                <h2 className="text-title-3 text-foreground-primary">Evolução</h2>
              </CardHeader>
              <CardContent>
                <div className="relative h-48">
                  {/* Target line */}
                  <div
                    className="absolute left-0 right-0 border-t-2 border-dashed border-brand z-10"
                    style={{ bottom: `${(targetNum / chartMax) * 100}%` }}
                  >
                    <span className="absolute -top-5 right-0 text-caption-2 text-brand font-medium">
                      Meta: {targetNum.toLocaleString("pt-BR")}
                    </span>
                  </div>
                  {/* Bars */}
                  <div className="flex items-end gap-1 h-full">
                    {chartData.map((m) => {
                      const val = Number(m.value);
                      const heightPct = chartMax > 0 ? (val / chartMax) * 100 : 0;
                      const isAboveTarget = val >= targetNum;
                      const isOutOfBounds =
                        (upperNum !== null && val > upperNum) ||
                        (lowerNum !== null && val < lowerNum);
                      return (
                        <div
                          key={m.id}
                          className="flex-1 flex flex-col items-center justify-end h-full"
                        >
                          <span className="text-caption-2 text-foreground-tertiary mb-1">
                            {val.toLocaleString("pt-BR")}
                          </span>
                          <div
                            className={`w-full rounded-t transition-all ${
                              isOutOfBounds
                                ? "bg-danger-fg"
                                : isAboveTarget
                                ? "bg-success-fg"
                                : "bg-warning-fg"
                            }`}
                            style={{
                              height: `${Math.max(heightPct, 2)}%`,
                              minHeight: "4px",
                            }}
                          />
                          <span className="text-caption-2 text-foreground-tertiary mt-1 truncate w-full text-center">
                            {new Date(m.period).toLocaleDateString("pt-BR", {
                              month: "short",
                              year: "2-digit",
                            }).replace(". de ", "/")}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Measurements */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-foreground-tertiary" />
                  <h2 className="text-title-3 text-foreground-primary">
                    Medições ({measurements.length})
                  </h2>
                </div>
                {can("indicator", "create") && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddMeasurement(!showAddMeasurement)}
                  >
                    <Plus className="h-4 w-4" />
                    Nova Medição
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {/* Add measurement form */}
              {showAddMeasurement && (
                <form onSubmit={handleAddMeasurement} className="mb-4 p-4 bg-surface-secondary rounded-card space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-body-2 font-medium text-foreground-primary mb-1">
                        Valor *
                      </label>
                      <Input
                        type="number"
                        step="0.01"
                        value={mValue}
                        onChange={(e) => setMValue(e.target.value)}
                        placeholder="Ex: 92.5"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-body-2 font-medium text-foreground-primary mb-1">
                        Período *
                      </label>
                      <Input
                        type="date"
                        value={mPeriod}
                        onChange={(e) => setMPeriod(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-body-2 font-medium text-foreground-primary mb-1">
                        Observações
                      </label>
                      <Input
                        value={mNotes}
                        onChange={(e) => setMNotes(e.target.value)}
                        placeholder="Opcional"
                      />
                    </div>
                  </div>
                  {error && (
                    <div className="bg-danger-bg text-danger-fg text-body-2 p-2 rounded-button">{error}</div>
                  )}
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" type="button" onClick={() => setShowAddMeasurement(false)}>
                      Cancelar
                    </Button>
                    <Button size="sm" type="submit" loading={addingMeasurement}>
                      Registrar
                    </Button>
                  </div>
                </form>
              )}

              {/* Measurements list */}
              {measurements.length === 0 ? (
                <div className="text-center py-8">
                  <TrendingUp className="h-8 w-8 text-foreground-tertiary mx-auto mb-2" />
                  <p className="text-body-2 text-foreground-secondary mb-3">
                    Nenhuma medição registrada ainda
                  </p>
                  {can("indicator", "create") && (
                    <Button variant="outline" size="sm" onClick={() => setShowAddMeasurement(true)}>
                      <Plus className="h-4 w-4" />
                      Registrar primeira medição
                    </Button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-stroke-secondary">
                        <th className="text-left text-caption-1 font-medium text-foreground-tertiary py-2 px-3">
                          Período
                        </th>
                        <th className="text-right text-caption-1 font-medium text-foreground-tertiary py-2 px-3">
                          Valor
                        </th>
                        <th className="text-right text-caption-1 font-medium text-foreground-tertiary py-2 px-3">
                          vs Meta
                        </th>
                        <th className="text-left text-caption-1 font-medium text-foreground-tertiary py-2 px-3">
                          Status
                        </th>
                        <th className="text-left text-caption-1 font-medium text-foreground-tertiary py-2 px-3">
                          Observações
                        </th>
                        {(can("indicator", "update") || can("indicator", "delete")) && (
                          <th className="text-right text-caption-1 font-medium text-foreground-tertiary py-2 px-3">
                            Ações
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {measurements.map((m) => {
                        const val = Number(m.value);
                        const diff = val - targetNum;
                        const pct = targetNum > 0 ? (val / targetNum) * 100 : 0;
                        const isOutOfBounds =
                          (upperNum !== null && val > upperNum) ||
                          (lowerNum !== null && val < lowerNum);
                        const isOnTarget = pct >= 95;

                        if (editingMeasurementId === m.id) {
                          return (
                            <tr key={m.id} className="border-b border-stroke-secondary bg-surface-secondary">
                              <td className="py-2 px-3">
                                <Input type="date" value={editMPeriod} onChange={(e) => setEditMPeriod(e.target.value)} className="h-8 text-body-2" />
                              </td>
                              <td className="py-2 px-3">
                                <Input type="number" step="0.01" value={editMValue} onChange={(e) => setEditMValue(e.target.value)} className="h-8 text-body-2 text-right w-28" />
                              </td>
                              <td className="py-2 px-3" />
                              <td className="py-2 px-3" />
                              <td className="py-2 px-3">
                                <Input value={editMNotes} onChange={(e) => setEditMNotes(e.target.value)} className="h-8 text-body-2" placeholder="Notas" />
                              </td>
                              <td className="py-2 px-3 text-right">
                                <div className="flex items-center gap-1 justify-end">
                                  <Button variant="outline" size="sm" onClick={() => setEditingMeasurementId(null)}>Cancelar</Button>
                                  <Button size="sm" onClick={handleSaveMeasurement} loading={savingMeasurement}>Salvar</Button>
                                </div>
                              </td>
                            </tr>
                          );
                        }

                        return (
                          <tr key={m.id} className="border-b border-stroke-secondary last:border-0">
                            <td className="py-2.5 px-3 text-body-2 text-foreground-primary">
                              {formatDate(m.period)}
                            </td>
                            <td className="py-2.5 px-3 text-body-2 text-foreground-primary text-right font-medium">
                              {val.toLocaleString("pt-BR")} {indicator.unit}
                            </td>
                            <td className={`py-2.5 px-3 text-body-2 text-right font-medium ${
                              diff >= 0 ? "text-success-fg" : "text-danger-fg"
                            }`}>
                              {diff >= 0 ? "+" : ""}{diff.toLocaleString("pt-BR")}
                            </td>
                            <td className="py-2.5 px-3">
                              <Badge
                                variant={
                                  isOutOfBounds
                                    ? "bg-danger-bg text-danger-fg"
                                    : isOnTarget
                                    ? "bg-success-bg text-success-fg"
                                    : "bg-warning-bg text-warning-fg"
                                }
                              >
                                {isOutOfBounds ? "Fora" : isOnTarget ? "OK" : "Atenção"}
                              </Badge>
                            </td>
                            <td className="py-2.5 px-3 text-body-2 text-foreground-secondary truncate max-w-[200px]">
                              {m.notes || "—"}
                            </td>
                            {(can("indicator", "update") || can("indicator", "delete")) && (
                              <td className="py-2.5 px-3 text-right">
                                <div className="flex items-center gap-1 justify-end">
                                  {can("indicator", "update") && (
                                    <Button variant="ghost" size="icon-sm" onClick={() => startEditMeasurement(m)}>
                                      <Pencil className="h-3.5 w-3.5" />
                                    </Button>
                                  )}
                                  {can("indicator", "delete") && (
                                    confirmDeleteMeasurement === m.id ? (
                                      <div className="flex items-center gap-1">
                                        <Button
                                          variant="danger"
                                          size="sm"
                                          onClick={() => handleDeleteMeasurement(m.id)}
                                          loading={deletingMeasurementId === m.id}
                                        >
                                          Sim
                                        </Button>
                                        <Button variant="outline" size="sm" onClick={() => setConfirmDeleteMeasurement(null)}>
                                          Não
                                        </Button>
                                      </div>
                                    ) : (
                                      <Button variant="ghost" size="icon-sm" onClick={() => setConfirmDeleteMeasurement(m.id)}>
                                        <Trash2 className="h-3.5 w-3.5 text-danger-fg" />
                                      </Button>
                                    )
                                  )}
                                </div>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
