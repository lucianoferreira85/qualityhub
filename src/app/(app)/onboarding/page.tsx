"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, Building2, UserCircle, BookOpen, FolderPlus, Users, ArrowRight, ArrowLeft, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

const STEPS = [
  { title: "Consultoria", icon: Building2 },
  { title: "Perfil", icon: UserCircle },
  { title: "Normas", icon: BookOpen },
  { title: "Projeto", icon: FolderPlus },
  { title: "Equipe", icon: Users },
];

const STANDARDS = [
  { id: "iso-27001", name: "ISO 27001:2022", description: "Segurança da Informação" },
  { id: "iso-9001", name: "ISO 9001:2015", description: "Gestão da Qualidade" },
  { id: "iso-14001", name: "ISO 14001:2015", description: "Gestão Ambiental" },
  { id: "iso-45001", name: "ISO 45001:2018", description: "Saúde e Segurança Ocupacional" },
  { id: "iso-22301", name: "ISO 22301:2019", description: "Continuidade de Negócios" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Step 1
  const [tenantName, setTenantName] = useState("");
  const [cnpj, setCnpj] = useState("");
  // Step 2
  const [phone, setPhone] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  // Step 3
  const [selectedStandards, setSelectedStandards] = useState<string[]>([]);
  // Step 4
  const [projectName, setProjectName] = useState("");
  // Step 5
  const [inviteEmails, setInviteEmails] = useState<string[]>([""]);

  const handleNext = () => setStep((s) => Math.min(s + 1, 4));
  const handleBack = () => setStep((s) => Math.max(s - 1, 0));

  const toggleStandard = (id: string) => {
    setSelectedStandards((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleComplete = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: tenantName, cnpj }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao criar empresa");
      }

      const { data: tenant } = await res.json();

      if (projectName && tenant.slug) {
        await fetch(`/api/tenants/${tenant.slug}/projects`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: projectName }),
        });
      }

      router.push(`/${tenant.slug}/dashboard`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao completar setup");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-tertiary p-4">
      <div className="w-full max-w-2xl">
        <div className="flex flex-col items-center mb-8">
          <div className="h-14 w-14 rounded-2xl gradient-brand flex items-center justify-center mb-4">
            <Shield className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-title-1 text-foreground-primary">
            Configure sua conta
          </h1>
          <p className="text-body-1 text-foreground-secondary mt-1">
            Trial Professional gratuito por 14 dias
          </p>
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center text-caption-1 font-medium transition-colors ${
                  i < step
                    ? "bg-success text-white"
                    : i === step
                    ? "bg-brand text-white"
                    : "bg-surface-primary text-foreground-tertiary border border-stroke-primary"
                }`}
              >
                {i < step ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`h-0.5 w-8 ${i < step ? "bg-success" : "bg-stroke-primary"}`} />
              )}
            </div>
          ))}
        </div>

        <Card>
          <CardContent className="p-8">
            {/* Step 1: Consultoria */}
            {step === 0 && (
              <div className="space-y-4">
                <h2 className="text-title-2 text-foreground-primary mb-2">
                  Dados da consultoria
                </h2>
                <div>
                  <label className="block text-body-1 font-medium text-foreground-primary mb-1">
                    Nome da consultoria *
                  </label>
                  <Input
                    value={tenantName}
                    onChange={(e) => setTenantName(e.target.value)}
                    placeholder="Ex: PowerConsult Ltda"
                    required
                  />
                </div>
                <div>
                  <label className="block text-body-1 font-medium text-foreground-primary mb-1">
                    CNPJ
                  </label>
                  <Input
                    value={cnpj}
                    onChange={(e) => setCnpj(e.target.value)}
                    placeholder="00.000.000/0001-00"
                  />
                </div>
              </div>
            )}

            {/* Step 2: Perfil */}
            {step === 1 && (
              <div className="space-y-4">
                <h2 className="text-title-2 text-foreground-primary mb-2">
                  Seu perfil
                </h2>
                <div>
                  <label className="block text-body-1 font-medium text-foreground-primary mb-1">
                    Cargo
                  </label>
                  <Input
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="Ex: Consultor Sênior"
                  />
                </div>
                <div>
                  <label className="block text-body-1 font-medium text-foreground-primary mb-1">
                    Telefone
                  </label>
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(11) 99999-9999"
                  />
                </div>
              </div>
            )}

            {/* Step 3: Normas */}
            {step === 2 && (
              <div className="space-y-4">
                <h2 className="text-title-2 text-foreground-primary mb-2">
                  Normas de interesse
                </h2>
                <p className="text-body-1 text-foreground-secondary">
                  Selecione as normas com as quais você trabalha
                </p>
                <div className="space-y-2">
                  {STANDARDS.map((std) => (
                    <button
                      key={std.id}
                      onClick={() => toggleStandard(std.id)}
                      className={`w-full flex items-center gap-3 p-4 rounded-button border transition-all text-left ${
                        selectedStandards.includes(std.id)
                          ? "border-brand bg-brand-light"
                          : "border-stroke-primary hover:border-stroke-primary hover:bg-surface-tertiary"
                      }`}
                    >
                      <div
                        className={`h-5 w-5 rounded flex items-center justify-center flex-shrink-0 ${
                          selectedStandards.includes(std.id)
                            ? "bg-brand"
                            : "border border-stroke-primary"
                        }`}
                      >
                        {selectedStandards.includes(std.id) && (
                          <Check className="h-3 w-3 text-white" />
                        )}
                      </div>
                      <div>
                        <p className="text-body-1 font-medium text-foreground-primary">
                          {std.name}
                        </p>
                        <p className="text-caption-1 text-foreground-secondary">
                          {std.description}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 4: Primeiro projeto */}
            {step === 3 && (
              <div className="space-y-4">
                <h2 className="text-title-2 text-foreground-primary mb-2">
                  Primeiro projeto (opcional)
                </h2>
                <p className="text-body-1 text-foreground-secondary">
                  Crie seu primeiro projeto ou pule esta etapa
                </p>
                <div>
                  <label className="block text-body-1 font-medium text-foreground-primary mb-1">
                    Nome do projeto
                  </label>
                  <Input
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="Ex: Certificação ISO 27001 - Cliente ABC"
                  />
                </div>
              </div>
            )}

            {/* Step 5: Convidar equipe */}
            {step === 4 && (
              <div className="space-y-4">
                <h2 className="text-title-2 text-foreground-primary mb-2">
                  Convide sua equipe (opcional)
                </h2>
                <p className="text-body-1 text-foreground-secondary">
                  Convide membros agora ou depois nas configurações
                </p>
                {inviteEmails.map((email, i) => (
                  <Input
                    key={i}
                    value={email}
                    onChange={(e) => {
                      const newEmails = [...inviteEmails];
                      newEmails[i] = e.target.value;
                      setInviteEmails(newEmails);
                    }}
                    placeholder="email@exemplo.com"
                    type="email"
                  />
                ))}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setInviteEmails([...inviteEmails, ""])}
                >
                  + Adicionar outro
                </Button>
              </div>
            )}

            {error && (
              <div className="bg-danger-bg text-danger-fg text-body-2 p-3 rounded-button mt-4">
                {error}
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between mt-8">
              {step > 0 ? (
                <Button variant="outline" onClick={handleBack}>
                  <ArrowLeft className="h-4 w-4" />
                  Voltar
                </Button>
              ) : (
                <div />
              )}

              {step < 4 ? (
                <Button
                  onClick={handleNext}
                  disabled={step === 0 && !tenantName}
                >
                  Próximo
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={handleComplete} loading={loading}>
                  Completar Setup
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
