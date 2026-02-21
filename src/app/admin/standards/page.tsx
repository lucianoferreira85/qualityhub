"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  Plus,
  ChevronDown,
  ChevronRight,
  FileText,
  Shield,
  X,
} from "lucide-react";

interface Standard {
  id: string;
  code: string;
  name: string;
  version: string;
  year: number;
  description: string | null;
  _count: { clauses: number; controls: number; projects: number };
}

interface Clause {
  id: string;
  code: string;
  title: string;
  description: string | null;
  parentId: string | null;
  orderIndex: number;
  children: Clause[];
}

interface Control {
  id: string;
  code: string;
  title: string;
  domain: string | null;
  type: string | null;
}

export default function AdminStandardsPage() {
  const [standards, setStandards] = useState<Standard[]>([]);
  const [loading, setLoading] = useState(true);

  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ code: "", name: "", version: "", year: new Date().getFullYear(), description: "" });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [tab, setTab] = useState<"clauses" | "controls">("clauses");
  const [clauses, setClauses] = useState<Clause[]>([]);
  const [controls, setControls] = useState<Control[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  const [showAddClause, setShowAddClause] = useState(false);
  const [clauseForm, setClauseForm] = useState({ code: "", title: "", description: "", parentId: "" });
  const [addingClause, setAddingClause] = useState(false);

  const [showAddControl, setShowAddControl] = useState(false);
  const [controlForm, setControlForm] = useState({ code: "", title: "", domain: "", type: "" });
  const [addingControl, setAddingControl] = useState(false);

  const fetchStandards = () => {
    fetch("/api/admin/standards")
      .then((res) => res.json())
      .then((res) => setStandards(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchStandards();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError("");
    try {
      const res = await fetch("/api/admin/standards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...createForm,
          year: Number(createForm.year),
          description: createForm.description || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao criar norma");
      }
      setCreateForm({ code: "", name: "", version: "", year: new Date().getFullYear(), description: "" });
      setShowCreate(false);
      setLoading(true);
      fetchStandards();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar");
    } finally {
      setCreating(false);
    }
  };

  const toggleExpand = async (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(id);
    setTab("clauses");
    setDetailLoading(true);
    setShowAddClause(false);
    setShowAddControl(false);
    try {
      const [clauseRes, controlRes] = await Promise.all([
        fetch(`/api/admin/standards/${id}/clauses`).then((r) => r.json()),
        fetch(`/api/admin/standards/${id}/controls`).then((r) => r.json()),
      ]);
      setClauses(clauseRes.data || []);
      setControls(controlRes.data || []);
    } catch {
      setClauses([]);
      setControls([]);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleAddClause = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expandedId) return;
    setAddingClause(true);
    try {
      const res = await fetch(`/api/admin/standards/${expandedId}/clauses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: clauseForm.code,
          title: clauseForm.title,
          description: clauseForm.description || null,
          parentId: clauseForm.parentId || null,
        }),
      });
      if (!res.ok) throw new Error("Erro ao adicionar clausula");
      setClauseForm({ code: "", title: "", description: "", parentId: "" });
      setShowAddClause(false);
      const updated = await fetch(`/api/admin/standards/${expandedId}/clauses`).then((r) => r.json());
      setClauses(updated.data || []);
      setLoading(true);
      fetchStandards();
    } catch {
      /* ignore */
    } finally {
      setAddingClause(false);
    }
  };

  const handleAddControl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expandedId) return;
    setAddingControl(true);
    try {
      const res = await fetch(`/api/admin/standards/${expandedId}/controls`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: controlForm.code,
          title: controlForm.title,
          domain: controlForm.domain || null,
          type: controlForm.type || null,
        }),
      });
      if (!res.ok) throw new Error("Erro ao adicionar controle");
      setControlForm({ code: "", title: "", domain: "", type: "" });
      setShowAddControl(false);
      const updated = await fetch(`/api/admin/standards/${expandedId}/controls`).then((r) => r.json());
      setControls(updated.data || []);
      setLoading(true);
      fetchStandards();
    } catch {
      /* ignore */
    } finally {
      setAddingControl(false);
    }
  };

  const allClauseIds = clauses.flatMap((c) => [
    { id: c.id, label: `${c.code} - ${c.title}` },
    ...c.children.map((ch) => ({ id: ch.id, label: `  ${ch.code} - ${ch.title}` })),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-title-1 text-foreground-primary">Normas</h1>
          <p className="text-body-1 text-foreground-secondary mt-1">
            Gerenciar normas, clausulas e controles
          </p>
        </div>
        <Button onClick={() => { setShowCreate(!showCreate); setError(""); }}>
          <Plus className="h-4 w-4" />
          Nova Norma
        </Button>
      </div>

      {showCreate && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-title-3 text-foreground-primary">Criar Norma</h2>
              <button onClick={() => setShowCreate(false)} className="text-foreground-tertiary hover:text-foreground-primary">
                <X className="h-5 w-5" />
              </button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-body-2 font-medium text-foreground-primary mb-1">Codigo *</label>
                  <Input
                    value={createForm.code}
                    onChange={(e) => setCreateForm({ ...createForm, code: e.target.value })}
                    placeholder="ISO 27001"
                    required
                  />
                </div>
                <div>
                  <label className="block text-body-2 font-medium text-foreground-primary mb-1">Nome *</label>
                  <Input
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    placeholder="Seguranca da Informacao"
                    required
                  />
                </div>
                <div>
                  <label className="block text-body-2 font-medium text-foreground-primary mb-1">Versao *</label>
                  <Input
                    value={createForm.version}
                    onChange={(e) => setCreateForm({ ...createForm, version: e.target.value })}
                    placeholder="2022"
                    required
                  />
                </div>
                <div>
                  <label className="block text-body-2 font-medium text-foreground-primary mb-1">Ano *</label>
                  <Input
                    type="number"
                    value={createForm.year}
                    onChange={(e) => setCreateForm({ ...createForm, year: Number(e.target.value) })}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-body-2 font-medium text-foreground-primary mb-1">Descricao</label>
                <Input
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  placeholder="Descricao da norma..."
                />
              </div>
              {error && (
                <div className="bg-danger-bg text-danger-fg text-body-2 p-3 rounded-button">
                  {error}
                </div>
              )}
              <div className="flex justify-end gap-3">
                <Button variant="outline" type="button" onClick={() => setShowCreate(false)}>
                  Cancelar
                </Button>
                <Button type="submit" loading={creating}>Criar Norma</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-surface-primary rounded-card animate-pulse" />
          ))}
        </div>
      ) : standards.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="h-8 w-8 text-foreground-tertiary mx-auto mb-2" />
            <p className="text-body-2 text-foreground-secondary">
              Nenhuma norma cadastrada
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {standards.map((s) => {
            const isExpanded = expandedId === s.id;
            return (
              <Card key={s.id}>
                <div
                  className="p-4 cursor-pointer hover:bg-surface-secondary transition-colors"
                  onClick={() => toggleExpand(s.id)}
                >
                  <div className="flex items-center gap-3">
                    {isExpanded ? (
                      <ChevronDown className="h-5 w-5 text-foreground-tertiary flex-shrink-0" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-foreground-tertiary flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-body-1 font-medium text-foreground-primary">
                          {s.code}
                        </h3>
                        <span className="text-body-2 text-foreground-secondary truncate">
                          {s.name}
                        </span>
                        <Badge variant="bg-brand-light text-brand">v{s.version}</Badge>
                        <Badge variant="bg-gray-100 text-gray-800">{s.year}</Badge>
                      </div>
                      {s.description && (
                        <p className="text-caption-1 text-foreground-tertiary mt-0.5 truncate">
                          {s.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="flex items-center gap-1 text-caption-1 text-foreground-tertiary">
                        <FileText className="h-3.5 w-3.5" />
                        {s._count.clauses}
                      </div>
                      <div className="flex items-center gap-1 text-caption-1 text-foreground-tertiary">
                        <Shield className="h-3.5 w-3.5" />
                        {s._count.controls}
                      </div>
                      <Badge variant="bg-success-bg text-success-fg">
                        {s._count.projects} projeto{s._count.projects !== 1 ? "s" : ""}
                      </Badge>
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-stroke-secondary">
                    <div className="flex items-center gap-1 px-4 pt-3">
                      <button
                        onClick={() => setTab("clauses")}
                        className={`px-3 py-1.5 rounded-button text-body-2 font-medium transition-colors ${
                          tab === "clauses"
                            ? "bg-brand text-white"
                            : "text-foreground-secondary hover:bg-surface-tertiary"
                        }`}
                      >
                        Clausulas ({clauses.reduce((acc, c) => acc + 1 + c.children.length, 0)})
                      </button>
                      <button
                        onClick={() => setTab("controls")}
                        className={`px-3 py-1.5 rounded-button text-body-2 font-medium transition-colors ${
                          tab === "controls"
                            ? "bg-brand text-white"
                            : "text-foreground-secondary hover:bg-surface-tertiary"
                        }`}
                      >
                        Controles ({controls.length})
                      </button>
                    </div>

                    <div className="p-4">
                      {detailLoading ? (
                        <div className="space-y-2">
                          {[1, 2, 3].map((i) => (
                            <div key={i} className="h-8 bg-surface-tertiary rounded animate-pulse" />
                          ))}
                        </div>
                      ) : tab === "clauses" ? (
                        <div className="space-y-3">
                          {clauses.length === 0 ? (
                            <p className="text-body-2 text-foreground-tertiary text-center py-4">
                              Nenhuma clausula cadastrada
                            </p>
                          ) : (
                            <div className="space-y-1">
                              {clauses.map((clause) => (
                                <div key={clause.id}>
                                  <div className="flex items-start gap-2 p-2 rounded-card hover:bg-surface-tertiary">
                                    <FileText className="h-4 w-4 text-brand mt-0.5 flex-shrink-0" />
                                    <div className="min-w-0">
                                      <p className="text-body-2 text-foreground-primary">
                                        <span className="font-medium">{clause.code}</span>
                                        {" - "}{clause.title}
                                      </p>
                                      {clause.description && (
                                        <p className="text-caption-1 text-foreground-tertiary mt-0.5 line-clamp-1">
                                          {clause.description}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                  {clause.children.length > 0 && (
                                    <div className="ml-6 space-y-1">
                                      {clause.children.map((child) => (
                                        <div
                                          key={child.id}
                                          className="flex items-start gap-2 p-2 rounded-card hover:bg-surface-tertiary"
                                        >
                                          <FileText className="h-3.5 w-3.5 text-foreground-tertiary mt-0.5 flex-shrink-0" />
                                          <div className="min-w-0">
                                            <p className="text-body-2 text-foreground-secondary">
                                              <span className="font-medium">{child.code}</span>
                                              {" - "}{child.title}
                                            </p>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                          {showAddClause ? (
                            <form onSubmit={handleAddClause} className="space-y-3 p-3 bg-surface-tertiary rounded-card">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-caption-1 font-medium text-foreground-primary mb-1">
                                    Codigo *
                                  </label>
                                  <Input
                                    value={clauseForm.code}
                                    onChange={(e) => setClauseForm({ ...clauseForm, code: e.target.value })}
                                    placeholder="4.1"
                                    required
                                  />
                                </div>
                                <div>
                                  <label className="block text-caption-1 font-medium text-foreground-primary mb-1">
                                    Titulo *
                                  </label>
                                  <Input
                                    value={clauseForm.title}
                                    onChange={(e) => setClauseForm({ ...clauseForm, title: e.target.value })}
                                    placeholder="Contexto da organizacao"
                                    required
                                  />
                                </div>
                              </div>
                              <div>
                                <label className="block text-caption-1 font-medium text-foreground-primary mb-1">
                                  Clausula Pai (opcional)
                                </label>
                                <select
                                  value={clauseForm.parentId}
                                  onChange={(e) => setClauseForm({ ...clauseForm, parentId: e.target.value })}
                                  className="h-10 w-full rounded-input border border-stroke-primary bg-surface-primary px-3 text-body-1 text-foreground-primary focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                                >
                                  <option value="">Nenhuma (clausula raiz)</option>
                                  {allClauseIds.map((c) => (
                                    <option key={c.id} value={c.id}>{c.label}</option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="block text-caption-1 font-medium text-foreground-primary mb-1">
                                  Descricao
                                </label>
                                <Input
                                  value={clauseForm.description}
                                  onChange={(e) => setClauseForm({ ...clauseForm, description: e.target.value })}
                                  placeholder="Descricao..."
                                />
                              </div>
                              <div className="flex justify-end gap-2">
                                <Button variant="outline" size="sm" type="button" onClick={() => setShowAddClause(false)}>
                                  Cancelar
                                </Button>
                                <Button size="sm" type="submit" loading={addingClause}>Adicionar</Button>
                              </div>
                            </form>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setShowAddClause(true)}
                            >
                              <Plus className="h-4 w-4" />
                              Adicionar Clausula
                            </Button>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {controls.length === 0 ? (
                            <p className="text-body-2 text-foreground-tertiary text-center py-4">
                              Nenhum controle cadastrado
                            </p>
                          ) : (
                            <div className="overflow-x-auto">
                              <table className="w-full">
                                <thead>
                                  <tr className="border-b border-stroke-secondary">
                                    <th className="text-left text-caption-1 font-medium text-foreground-tertiary py-2 px-3">
                                      Codigo
                                    </th>
                                    <th className="text-left text-caption-1 font-medium text-foreground-tertiary py-2 px-3">
                                      Titulo
                                    </th>
                                    <th className="text-left text-caption-1 font-medium text-foreground-tertiary py-2 px-3">
                                      Domínio
                                    </th>
                                    <th className="text-left text-caption-1 font-medium text-foreground-tertiary py-2 px-3">
                                      Tipo
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {controls.map((ctrl) => (
                                    <tr key={ctrl.id} className="border-b border-stroke-secondary last:border-0">
                                      <td className="py-2 px-3 text-body-2 font-medium text-brand">
                                        {ctrl.code}
                                      </td>
                                      <td className="py-2 px-3 text-body-2 text-foreground-primary">
                                        {ctrl.title}
                                      </td>
                                      <td className="py-2 px-3 text-body-2 text-foreground-secondary">
                                        {ctrl.domain || "—"}
                                      </td>
                                      <td className="py-2 px-3">
                                        {ctrl.type ? (
                                          <Badge variant="bg-brand-light text-brand">{ctrl.type}</Badge>
                                        ) : (
                                          <span className="text-body-2 text-foreground-tertiary">—</span>
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}

                          {showAddControl ? (
                            <form onSubmit={handleAddControl} className="space-y-3 p-3 bg-surface-tertiary rounded-card">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-caption-1 font-medium text-foreground-primary mb-1">
                                    Codigo *
                                  </label>
                                  <Input
                                    value={controlForm.code}
                                    onChange={(e) => setControlForm({ ...controlForm, code: e.target.value })}
                                    placeholder="A.5.1"
                                    required
                                  />
                                </div>
                                <div>
                                  <label className="block text-caption-1 font-medium text-foreground-primary mb-1">
                                    Titulo *
                                  </label>
                                  <Input
                                    value={controlForm.title}
                                    onChange={(e) => setControlForm({ ...controlForm, title: e.target.value })}
                                    placeholder="Politicas de SI"
                                    required
                                  />
                                </div>
                                <div>
                                  <label className="block text-caption-1 font-medium text-foreground-primary mb-1">
                                    Domínio
                                  </label>
                                  <Input
                                    value={controlForm.domain}
                                    onChange={(e) => setControlForm({ ...controlForm, domain: e.target.value })}
                                    placeholder="Organizacional"
                                  />
                                </div>
                                <div>
                                  <label className="block text-caption-1 font-medium text-foreground-primary mb-1">
                                    Tipo
                                  </label>
                                  <select
                                    value={controlForm.type}
                                    onChange={(e) => setControlForm({ ...controlForm, type: e.target.value })}
                                    className="h-10 w-full rounded-input border border-stroke-primary bg-surface-primary px-3 text-body-1 text-foreground-primary focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                                  >
                                    <option value="">Selecionar...</option>
                                    <option value="Preventivo">Preventivo</option>
                                    <option value="Detectivo">Detectivo</option>
                                    <option value="Corretivo">Corretivo</option>
                                  </select>
                                </div>
                              </div>
                              <div className="flex justify-end gap-2">
                                <Button variant="outline" size="sm" type="button" onClick={() => setShowAddControl(false)}>
                                  Cancelar
                                </Button>
                                <Button size="sm" type="submit" loading={addingControl}>Adicionar</Button>
                              </div>
                            </form>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setShowAddControl(true)}
                            >
                              <Plus className="h-4 w-4" />
                              Adicionar Controle
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
