"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Shield,
  ClipboardCheck,
  AlertTriangle,
  FileText,
  TrendingUp,
  Search,
  FolderKanban,
  ArrowRight,
} from "lucide-react";

const FEATURES = [
  {
    icon: FolderKanban,
    title: "Projetos Multi-Norma",
    description:
      "Gerencie projetos de conformidade com múltiplas normas ISO simultaneamente. Acompanhe o progresso e maturidade.",
  },
  {
    icon: Search,
    title: "Auditorias",
    description:
      "Planeje, execute e registre auditorias internas e externas. Gere achados e vincule a não conformidades.",
  },
  {
    icon: AlertTriangle,
    title: "Não Conformidades",
    description:
      "Workflow completo de NC em 6 etapas: abertura, análise de causa raiz (5 Porquês, Ishikawa), ação e verificação.",
  },
  {
    icon: ClipboardCheck,
    title: "Planos de Ação",
    description:
      "Ações corretivas, preventivas e de melhoria com responsáveis, prazos e verificação de eficácia.",
  },
  {
    icon: FileText,
    title: "Gestão Documental",
    description:
      "Hierarquia documental completa com controle de versões, workflow de aprovação e revisão periódica.",
  },
  {
    icon: TrendingUp,
    title: "Indicadores & Riscos",
    description:
      "Monitore KPIs com limites de alerta. Avalie riscos com matriz de probabilidade x impacto e SoA.",
  },
];

const STEPS = [
  {
    number: "1",
    title: "Crie sua conta",
    description: "Cadastre-se em 30 segundos e ganhe 14 dias grátis do plano Professional.",
  },
  {
    number: "2",
    title: "Configure seu projeto",
    description: "Escolha as normas, cadastre clientes e convide sua equipe.",
  },
  {
    number: "3",
    title: "Gerencie a conformidade",
    description: "Acompanhe requisitos, riscos, auditorias e ações em um só lugar.",
  },
];

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="py-20 px-6 lg:px-12">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-brand-light text-brand px-4 py-1.5 rounded-full text-body-2 font-medium mb-6">
            <Shield className="h-4 w-4" />
            Plataforma SaaS para Consultorias ISO
          </div>
          <h1 className="text-display text-foreground-primary mb-6 leading-tight">
            Gestão da Qualidade e
            <span className="gradient-brand bg-clip-text text-transparent">
              {" "}
              Conformidade ISO
            </span>{" "}
            simplificada
          </h1>
          <p className="text-title-3 text-foreground-secondary max-w-2xl mx-auto mb-8 font-normal">
            Centralize auditorias, não conformidades, riscos, documentos e
            indicadores em uma plataforma multi-tenant projetada para consultorias.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/signup">
              <Button size="lg">
                Começar grátis
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Link href="/pricing">
              <Button variant="outline" size="lg">
                Ver planos
              </Button>
            </Link>
          </div>
          <p className="text-caption-1 text-foreground-tertiary mt-4">
            14 dias grátis &middot; Sem cartão de crédito &middot; Cancele quando quiser
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-6 lg:px-12 bg-surface-tertiary" id="features">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-title-1 text-foreground-primary mb-3">
              Tudo que você precisa para conformidade ISO
            </h2>
            <p className="text-body-1 text-foreground-secondary max-w-2xl mx-auto">
              6 módulos integrados para gerenciar o ciclo completo de gestão da qualidade
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="bg-surface-primary rounded-card border border-stroke-secondary p-6 shadow-card hover:shadow-card-hover transition-shadow"
              >
                <div className="h-10 w-10 rounded-button bg-brand-light flex items-center justify-center mb-4">
                  <feature.icon className="h-5 w-5 text-brand" />
                </div>
                <h3 className="text-title-3 text-foreground-primary mb-2">
                  {feature.title}
                </h3>
                <p className="text-body-1 text-foreground-secondary">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 px-6 lg:px-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-title-1 text-foreground-primary mb-3">
              Como funciona
            </h2>
            <p className="text-body-1 text-foreground-secondary">
              Comece a gerenciar conformidade em minutos
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {STEPS.map((step) => (
              <div key={step.number} className="text-center">
                <div className="h-12 w-12 rounded-full gradient-brand flex items-center justify-center mx-auto mb-4">
                  <span className="text-title-2 text-white">{step.number}</span>
                </div>
                <h3 className="text-title-3 text-foreground-primary mb-2">
                  {step.title}
                </h3>
                <p className="text-body-1 text-foreground-secondary">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6 lg:px-12 bg-surface-tertiary">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-title-1 text-foreground-primary mb-4">
            Pronto para simplificar sua gestão ISO?
          </h2>
          <p className="text-body-1 text-foreground-secondary mb-8">
            Junte-se a consultorias que já gerenciam conformidade de forma eficiente.
          </p>
          <Link href="/signup">
            <Button size="lg">
              Começar trial gratuito
              <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>
    </>
  );
}
