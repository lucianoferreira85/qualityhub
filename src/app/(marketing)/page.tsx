"use client";

import { useEffect, useRef } from "react";
import { usePageTitle } from "@/hooks/use-page-title";
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
  CheckCircle2,
  Users,
  Building2,
  Globe,
} from "lucide-react";

const FEATURES = [
  {
    icon: FolderKanban,
    title: "Projetos Multi-Norma",
    description:
      "Gerencie projetos de conformidade com multiplas normas ISO simultaneamente. Acompanhe o progresso e maturidade.",
  },
  {
    icon: Search,
    title: "Auditorias",
    description:
      "Planeje, execute e registre auditorias internas e externas. Gere achados e vincule a nao conformidades.",
  },
  {
    icon: AlertTriangle,
    title: "Nao Conformidades",
    description:
      "Workflow completo de NC em 6 etapas: abertura, analise de causa raiz (5 Porques, Ishikawa), acao e verificacao.",
  },
  {
    icon: ClipboardCheck,
    title: "Planos de Acao",
    description:
      "Acoes corretivas, preventivas e de melhoria com responsaveis, prazos e verificacao de eficacia.",
  },
  {
    icon: FileText,
    title: "Gestao Documental",
    description:
      "Hierarquia documental completa com controle de versoes, workflow de aprovacao e revisao periodica.",
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
    description: "Cadastre-se em 30 segundos e ganhe 14 dias gratis do plano Professional.",
  },
  {
    number: "2",
    title: "Configure seu projeto",
    description: "Escolha as normas, cadastre clientes e convide sua equipe.",
  },
  {
    number: "3",
    title: "Gerencie a conformidade",
    description: "Acompanhe requisitos, riscos, auditorias e acoes em um so lugar.",
  },
];

const STATS = [
  { icon: Users, value: "500+", label: "Usuarios ativos" },
  { icon: Building2, value: "50+", label: "Consultorias" },
  { icon: Globe, value: "12", label: "Normas suportadas" },
  { icon: CheckCircle2, value: "99.9%", label: "Uptime" },
];

function useScrollAnimation() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate-fade-in-up");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );

    const children = el.querySelectorAll("[data-animate]");
    children.forEach((child) => {
      (child as HTMLElement).style.opacity = "0";
      observer.observe(child);
    });

    return () => observer.disconnect();
  }, []);

  return ref;
}

export default function HomePage() {
  usePageTitle("Gestao da Qualidade e Conformidade ISO");
  const animRef = useScrollAnimation();

  return (
    <div ref={animRef}>
      <section className="relative py-28 px-6 lg:px-12 overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[600px] bg-gradient-to-br from-brand/8 via-brand/12 to-transparent rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-gradient-to-tl from-accent/5 to-transparent rounded-full blur-3xl" />
          <div className="absolute top-0 left-0 w-[300px] h-[300px] bg-gradient-to-br from-brand/5 to-transparent rounded-full blur-3xl" />
        </div>

        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-surface-primary text-brand px-4 py-1.5 rounded-full text-body-2 font-medium mb-6 animate-fade-in border border-stroke-secondary shadow-xs">
            <Shield className="h-4 w-4" />
            Plataforma SaaS para Consultorias ISO
          </div>
          <h1 className="text-display text-foreground-primary mb-6 leading-tight animate-fade-in-up">
            Gestao da Qualidade e{" "}
            <span className="gradient-brand bg-clip-text text-transparent">
              Conformidade ISO
            </span>{" "}
            simplificada
          </h1>
          <p className="text-title-3 text-foreground-secondary max-w-2xl mx-auto mb-10 font-normal animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
            Centralize auditorias, nao conformidades, riscos, documentos e
            indicadores em uma plataforma multi-tenant projetada para consultorias.
          </p>
          <div className="flex items-center justify-center gap-4 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
            <Link href="/signup">
              <Button size="lg">
                Comecar gratis
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Link href="/pricing">
              <Button variant="secondary" size="lg">
                Ver planos
              </Button>
            </Link>
          </div>
          <p className="text-caption-1 text-foreground-tertiary mt-5 animate-fade-in" style={{ animationDelay: "0.3s" }}>
            14 dias gratis &middot; Sem cartao de credito &middot; Cancele quando quiser
          </p>
        </div>
      </section>

      <section className="py-14 px-6 lg:px-12 border-y border-stroke-secondary bg-surface-primary">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map((stat) => (
            <div key={stat.label} className="text-center" data-animate>
              <div className="h-12 w-12 rounded-xl bg-brand-light flex items-center justify-center mx-auto mb-3 shadow-xs">
                <stat.icon className="h-5 w-5 text-brand" />
              </div>
              <div className="text-title-1 text-foreground-primary tracking-tight-2">{stat.value}</div>
              <div className="text-caption-1 text-foreground-secondary mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="py-24 px-6 lg:px-12 bg-surface-tertiary" id="features">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16" data-animate>
            <h2 className="text-title-1 text-foreground-primary mb-3 tracking-tight-2">
              Tudo que voce precisa para conformidade ISO
            </h2>
            <p className="text-body-1 text-foreground-secondary max-w-2xl mx-auto">
              6 modulos integrados para gerenciar o ciclo completo de gestao da qualidade
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((feature, i) => (
              <div
                key={feature.title}
                data-animate
                style={{ animationDelay: `${i * 0.1}s` }}
                className="bg-surface-primary rounded-card border border-stroke-secondary p-6 shadow-premium-card hover:shadow-premium-card-hover hover:-translate-y-1 transition-all duration-300 group"
              >
                <div className="h-12 w-12 rounded-xl bg-brand-light flex items-center justify-center mb-4 transition-all duration-200 group-hover:shadow-brand group-hover:scale-105">
                  <feature.icon className="h-6 w-6 text-brand" />
                </div>
                <h3 className="text-title-3 text-foreground-primary mb-2">
                  {feature.title}
                </h3>
                <p className="text-body-1 text-foreground-secondary leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-6 lg:px-12 bg-surface-primary">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16" data-animate>
            <h2 className="text-title-1 text-foreground-primary mb-3 tracking-tight-2">
              Como funciona
            </h2>
            <p className="text-body-1 text-foreground-secondary">
              Comece a gerenciar conformidade em minutos
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {STEPS.map((step, i) => (
              <div
                key={step.number}
                className="text-center relative"
                data-animate
                style={{ animationDelay: `${i * 0.15}s` }}
              >
                {i < STEPS.length - 1 && (
                  <div className="hidden md:block absolute top-6 left-[60%] w-[80%] h-[2px] bg-gradient-to-r from-brand/30 to-brand/5" />
                )}
                <div className="h-12 w-12 rounded-full gradient-brand flex items-center justify-center mx-auto mb-4 relative z-10 shadow-card-glow">
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

      <section className="py-24 px-6 lg:px-12 relative overflow-hidden bg-surface-tertiary">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-gradient-to-br from-brand/5 to-transparent rounded-full blur-3xl" />
        </div>
        <div className="max-w-3xl mx-auto text-center" data-animate>
          <div className="h-14 w-14 rounded-2xl gradient-brand flex items-center justify-center mx-auto mb-6 shadow-card-glow">
            <Shield className="h-7 w-7 text-white" />
          </div>
          <h2 className="text-title-1 text-foreground-primary mb-4 tracking-tight-2">
            Pronto para simplificar sua gestao ISO?
          </h2>
          <p className="text-body-1 text-foreground-secondary mb-8 max-w-lg mx-auto">
            Junte-se a consultorias que ja gerenciam conformidade de forma
            eficiente com o QualityHub.
          </p>
          <Link href="/signup">
            <Button size="lg">
              Comecar trial gratuito
              <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
