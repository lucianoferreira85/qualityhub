"use client";

import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const plans = [
  {
    name: "Starter",
    price: "197",
    description: "Para pequenas consultorias",
    features: [
      "Até 3 usuários",
      "3 projetos simultâneos",
      "1 norma",
      "2GB de armazenamento",
      "3 clientes",
      "Auditorias e NCs",
      "Planos de ação",
      "Gestão documental",
    ],
    cta: "Começar trial",
    popular: false,
  },
  {
    name: "Professional",
    price: "497",
    description: "Para consultorias em crescimento",
    features: [
      "Até 10 usuários",
      "15 projetos simultâneos",
      "3 normas",
      "10GB de armazenamento",
      "15 clientes",
      "Tudo do Starter",
      "Indicadores e riscos",
      "SoA e análise de maturidade",
      "Análise crítica da direção",
      "Relatórios personalizados",
    ],
    cta: "Começar trial",
    popular: true,
  },
  {
    name: "Enterprise",
    price: "997",
    description: "Para grandes operações",
    features: [
      "Usuários ilimitados",
      "Projetos ilimitados",
      "Normas ilimitadas",
      "Armazenamento ilimitado",
      "Clientes ilimitados",
      "Tudo do Professional",
      "Acesso via API",
      "Suporte prioritário",
      "Onboarding dedicado",
    ],
    cta: "Falar com vendas",
    popular: false,
  },
];

export default function PricingPage() {
  return (
    <div className="py-16 px-6 lg:px-12">
      <div className="text-center mb-12">
        <h1 className="text-display text-foreground-primary mb-4">
          Planos e preços
        </h1>
        <p className="text-title-3 text-foreground-secondary max-w-2xl mx-auto">
          Escolha o plano ideal para sua consultoria. Todos incluem 14 dias de trial grátis.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`bg-surface-primary rounded-card border p-8 flex flex-col ${
              plan.popular
                ? "border-brand shadow-card-glow scale-105"
                : "border-stroke-secondary shadow-card"
            }`}
          >
            {plan.popular && (
              <div className="text-caption-1 text-brand font-medium mb-2">
                Mais popular
              </div>
            )}
            <h3 className="text-title-2 text-foreground-primary">{plan.name}</h3>
            <p className="text-body-2 text-foreground-secondary mt-1">
              {plan.description}
            </p>
            <div className="flex items-baseline gap-1 mt-4 mb-6">
              <span className="text-caption-1 text-foreground-tertiary">R$</span>
              <span className="text-display text-foreground-primary">
                {plan.price}
              </span>
              <span className="text-body-2 text-foreground-tertiary">/mês</span>
            </div>
            <Link href="/signup" className="mb-6">
              <Button
                variant={plan.popular ? "default" : "outline"}
                className="w-full"
              >
                {plan.cta}
              </Button>
            </Link>
            <ul className="space-y-3 flex-1">
              {plan.features.map((feature) => (
                <li
                  key={feature}
                  className="flex items-start gap-2 text-body-1 text-foreground-secondary"
                >
                  <Check className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
