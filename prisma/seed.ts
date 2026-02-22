import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

type ClauseInput = { code: string; title: string; children?: ClauseInput[] };
type ControlInput = { code: string; title: string; domain: string; type?: string };

async function createClausesForStandard(
  standardId: string,
  items: ClauseInput[],
  parentId: string | null,
  order: number
) {
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const clause = await prisma.standardClause.upsert({
      where: { standardId_code: { standardId, code: item.code } },
      update: {},
      create: {
        standardId,
        code: item.code,
        title: item.title,
        parentId,
        orderIndex: order + i,
      },
    });
    if (item.children) {
      await createClausesForStandard(standardId, item.children, clause.id, 0);
    }
  }
}

async function createControlsForStandard(standardId: string, controls: ControlInput[]) {
  for (const ctrl of controls) {
    await prisma.standardControl.upsert({
      where: { standardId_code: { standardId, code: ctrl.code } },
      update: {},
      create: {
        standardId,
        code: ctrl.code,
        title: ctrl.title,
        domain: ctrl.domain,
        type: ctrl.type || "control",
      },
    });
  }
}

async function main() {
  console.log("Seeding database...");

  // ==================== Plans ====================
  const plans = await Promise.all([
    prisma.plan.upsert({
      where: { slug: "starter" },
      update: {},
      create: {
        name: "Starter",
        slug: "starter",
        price: 197,
        maxUsers: 3,
        maxProjects: 3,
        maxStandards: 1,
        maxStorage: 2048,
        maxClients: 3,
        features: {
          audits: true,
          nonconformities: true,
          actionPlans: true,
          documents: true,
          indicators: false,
          risks: false,
          soa: false,
          managementReview: false,
          customReports: false,
          apiAccess: false,
        },
      },
    }),
    prisma.plan.upsert({
      where: { slug: "professional" },
      update: {},
      create: {
        name: "Professional",
        slug: "professional",
        price: 497,
        maxUsers: 10,
        maxProjects: 15,
        maxStandards: 3,
        maxStorage: 10240,
        maxClients: 15,
        features: {
          audits: true,
          nonconformities: true,
          actionPlans: true,
          documents: true,
          indicators: true,
          risks: true,
          soa: true,
          managementReview: true,
          customReports: true,
          apiAccess: false,
        },
      },
    }),
    prisma.plan.upsert({
      where: { slug: "enterprise" },
      update: {},
      create: {
        name: "Enterprise",
        slug: "enterprise",
        price: 997,
        maxUsers: 999999,
        maxProjects: 999999,
        maxStandards: 999999,
        maxStorage: 999999,
        maxClients: 999999,
        features: {
          audits: true,
          nonconformities: true,
          actionPlans: true,
          documents: true,
          indicators: true,
          risks: true,
          soa: true,
          managementReview: true,
          customReports: true,
          apiAccess: true,
        },
      },
    }),
  ]);

  console.log(`Created ${plans.length} plans`);

  // ==================== ISO 27001:2022 ====================
  const iso27001 = await prisma.standard.upsert({
    where: { code: "ISO-27001" },
    update: {},
    create: {
      code: "ISO-27001",
      name: "ISO/IEC 27001:2022",
      version: "2022",
      year: 2022,
      description: "Sistemas de gestão de segurança da informação - Requisitos",
    },
  });
  console.log(`Standard: ${iso27001.name}`);

  await createClausesForStandard(iso27001.id, [
    { code: "4", title: "Contexto da organização", children: [
      { code: "4.1", title: "Entendendo a organização e seu contexto" },
      { code: "4.2", title: "Entendendo as necessidades e expectativas das partes interessadas" },
      { code: "4.3", title: "Determinando o escopo do SGSI" },
      { code: "4.4", title: "Sistema de gestão de segurança da informação" },
    ]},
    { code: "5", title: "Liderança", children: [
      { code: "5.1", title: "Liderança e comprometimento" },
      { code: "5.2", title: "Política" },
      { code: "5.3", title: "Papéis, responsabilidades e autoridades organizacionais" },
    ]},
    { code: "6", title: "Planejamento", children: [
      { code: "6.1", title: "Ações para abordar riscos e oportunidades", children: [
        { code: "6.1.1", title: "Generalidades" },
        { code: "6.1.2", title: "Avaliação de riscos de segurança da informação" },
        { code: "6.1.3", title: "Tratamento de riscos de segurança da informação" },
      ]},
      { code: "6.2", title: "Objetivos de segurança da informação e planejamento para alcançá-los" },
      { code: "6.3", title: "Planejamento de mudanças" },
    ]},
    { code: "7", title: "Apoio", children: [
      { code: "7.1", title: "Recursos" },
      { code: "7.2", title: "Competência" },
      { code: "7.3", title: "Conscientização" },
      { code: "7.4", title: "Comunicação" },
      { code: "7.5", title: "Informação documentada", children: [
        { code: "7.5.1", title: "Generalidades" },
        { code: "7.5.2", title: "Criação e atualização" },
        { code: "7.5.3", title: "Controle de informação documentada" },
      ]},
    ]},
    { code: "8", title: "Operação", children: [
      { code: "8.1", title: "Planejamento e controle operacional" },
      { code: "8.2", title: "Avaliação de riscos de segurança da informação" },
      { code: "8.3", title: "Tratamento de riscos de segurança da informação" },
    ]},
    { code: "9", title: "Avaliação de desempenho", children: [
      { code: "9.1", title: "Monitoramento, medição, análise e avaliação" },
      { code: "9.2", title: "Auditoria interna", children: [
        { code: "9.2.1", title: "Generalidades" },
        { code: "9.2.2", title: "Programa de auditoria interna" },
      ]},
      { code: "9.3", title: "Análise crítica pela direção" },
    ]},
    { code: "10", title: "Melhoria", children: [
      { code: "10.1", title: "Melhoria contínua" },
      { code: "10.2", title: "Não conformidade e ação corretiva" },
    ]},
  ], null, 0);
  console.log("  -> Clauses created");

  await createControlsForStandard(iso27001.id, [
    // 5 - Organizational controls (37)
    { code: "A.5.1", title: "Políticas de segurança da informação", domain: "Organizational" },
    { code: "A.5.2", title: "Papéis e responsabilidades de segurança da informação", domain: "Organizational" },
    { code: "A.5.3", title: "Segregação de funções", domain: "Organizational" },
    { code: "A.5.4", title: "Responsabilidades da direção", domain: "Organizational" },
    { code: "A.5.5", title: "Contato com autoridades", domain: "Organizational" },
    { code: "A.5.6", title: "Contato com grupos de interesse especial", domain: "Organizational" },
    { code: "A.5.7", title: "Inteligência de ameaças", domain: "Organizational" },
    { code: "A.5.8", title: "Segurança da informação no gerenciamento de projetos", domain: "Organizational" },
    { code: "A.5.9", title: "Inventário de informações e outros ativos associados", domain: "Organizational" },
    { code: "A.5.10", title: "Uso aceitável de informações e outros ativos associados", domain: "Organizational" },
    { code: "A.5.11", title: "Devolução de ativos", domain: "Organizational" },
    { code: "A.5.12", title: "Classificação das informações", domain: "Organizational" },
    { code: "A.5.13", title: "Rotulagem de informações", domain: "Organizational" },
    { code: "A.5.14", title: "Transferência de informações", domain: "Organizational" },
    { code: "A.5.15", title: "Controle de acesso", domain: "Organizational" },
    { code: "A.5.16", title: "Gestão de identidade", domain: "Organizational" },
    { code: "A.5.17", title: "Informações de autenticação", domain: "Organizational" },
    { code: "A.5.18", title: "Direitos de acesso", domain: "Organizational" },
    { code: "A.5.19", title: "Segurança da informação nas relações com fornecedores", domain: "Organizational" },
    { code: "A.5.20", title: "Abordagem da segurança da informação nos contratos com fornecedores", domain: "Organizational" },
    { code: "A.5.21", title: "Gestão da segurança da informação na cadeia de fornecimento de TIC", domain: "Organizational" },
    { code: "A.5.22", title: "Monitoramento, análise crítica e gestão de mudanças dos serviços de fornecedores", domain: "Organizational" },
    { code: "A.5.23", title: "Segurança da informação para uso de serviços em nuvem", domain: "Organizational" },
    { code: "A.5.24", title: "Planejamento e preparação da gestão de incidentes de segurança da informação", domain: "Organizational" },
    { code: "A.5.25", title: "Avaliação e decisão sobre eventos de segurança da informação", domain: "Organizational" },
    { code: "A.5.26", title: "Resposta a incidentes de segurança da informação", domain: "Organizational" },
    { code: "A.5.27", title: "Aprendizado com incidentes de segurança da informação", domain: "Organizational" },
    { code: "A.5.28", title: "Coleta de evidências", domain: "Organizational" },
    { code: "A.5.29", title: "Segurança da informação durante disrupção", domain: "Organizational" },
    { code: "A.5.30", title: "Prontidão de TIC para continuidade de negócios", domain: "Organizational" },
    { code: "A.5.31", title: "Requisitos legais, estatutários, regulamentares e contratuais", domain: "Organizational" },
    { code: "A.5.32", title: "Direitos de propriedade intelectual", domain: "Organizational" },
    { code: "A.5.33", title: "Proteção de registros", domain: "Organizational" },
    { code: "A.5.34", title: "Privacidade e proteção de dados pessoais", domain: "Organizational" },
    { code: "A.5.35", title: "Análise crítica independente da segurança da informação", domain: "Organizational" },
    { code: "A.5.36", title: "Conformidade com políticas, regras e normas de segurança da informação", domain: "Organizational" },
    { code: "A.5.37", title: "Procedimentos operacionais documentados", domain: "Organizational" },
    // 6 - People controls (8)
    { code: "A.6.1", title: "Seleção", domain: "People" },
    { code: "A.6.2", title: "Termos e condições de contratação", domain: "People" },
    { code: "A.6.3", title: "Conscientização, educação e treinamento em segurança da informação", domain: "People" },
    { code: "A.6.4", title: "Processo disciplinar", domain: "People" },
    { code: "A.6.5", title: "Responsabilidades após encerramento ou mudança da contratação", domain: "People" },
    { code: "A.6.6", title: "Acordos de confidencialidade ou não divulgação", domain: "People" },
    { code: "A.6.7", title: "Trabalho remoto", domain: "People" },
    { code: "A.6.8", title: "Relato de eventos de segurança da informação", domain: "People" },
    // 7 - Physical controls (14)
    { code: "A.7.1", title: "Perímetros de segurança física", domain: "Physical" },
    { code: "A.7.2", title: "Entrada física", domain: "Physical" },
    { code: "A.7.3", title: "Segurança de escritórios, salas e instalações", domain: "Physical" },
    { code: "A.7.4", title: "Monitoramento de segurança física", domain: "Physical" },
    { code: "A.7.5", title: "Proteção contra ameaças físicas e ambientais", domain: "Physical" },
    { code: "A.7.6", title: "Trabalho em áreas seguras", domain: "Physical" },
    { code: "A.7.7", title: "Mesa limpa e tela limpa", domain: "Physical" },
    { code: "A.7.8", title: "Localização e proteção de equipamentos", domain: "Physical" },
    { code: "A.7.9", title: "Segurança de ativos fora das instalações", domain: "Physical" },
    { code: "A.7.10", title: "Mídias de armazenamento", domain: "Physical" },
    { code: "A.7.11", title: "Utilidades de suporte", domain: "Physical" },
    { code: "A.7.12", title: "Segurança do cabeamento", domain: "Physical" },
    { code: "A.7.13", title: "Manutenção de equipamentos", domain: "Physical" },
    { code: "A.7.14", title: "Descarte ou reutilização segura de equipamentos", domain: "Physical" },
    // 8 - Technological controls (34)
    { code: "A.8.1", title: "Dispositivos endpoint do usuário", domain: "Technological" },
    { code: "A.8.2", title: "Direitos de acesso privilegiado", domain: "Technological" },
    { code: "A.8.3", title: "Restrição de acesso à informação", domain: "Technological" },
    { code: "A.8.4", title: "Acesso ao código-fonte", domain: "Technological" },
    { code: "A.8.5", title: "Autenticação segura", domain: "Technological" },
    { code: "A.8.6", title: "Gestão de capacidade", domain: "Technological" },
    { code: "A.8.7", title: "Proteção contra malware", domain: "Technological" },
    { code: "A.8.8", title: "Gestão de vulnerabilidades técnicas", domain: "Technological" },
    { code: "A.8.9", title: "Gestão de configuração", domain: "Technological" },
    { code: "A.8.10", title: "Exclusão de informações", domain: "Technological" },
    { code: "A.8.11", title: "Mascaramento de dados", domain: "Technological" },
    { code: "A.8.12", title: "Prevenção de vazamento de dados", domain: "Technological" },
    { code: "A.8.13", title: "Backup de informações", domain: "Technological" },
    { code: "A.8.14", title: "Redundância de recursos de processamento de informações", domain: "Technological" },
    { code: "A.8.15", title: "Log", domain: "Technological" },
    { code: "A.8.16", title: "Atividades de monitoramento", domain: "Technological" },
    { code: "A.8.17", title: "Sincronização de relógios", domain: "Technological" },
    { code: "A.8.18", title: "Uso de programas utilitários privilegiados", domain: "Technological" },
    { code: "A.8.19", title: "Instalação de software em sistemas operacionais", domain: "Technological" },
    { code: "A.8.20", title: "Segurança de redes", domain: "Technological" },
    { code: "A.8.21", title: "Segurança de serviços de rede", domain: "Technological" },
    { code: "A.8.22", title: "Segregação de redes", domain: "Technological" },
    { code: "A.8.23", title: "Filtragem da web", domain: "Technological" },
    { code: "A.8.24", title: "Uso de criptografia", domain: "Technological" },
    { code: "A.8.25", title: "Ciclo de vida de desenvolvimento seguro", domain: "Technological" },
    { code: "A.8.26", title: "Requisitos de segurança de aplicações", domain: "Technological" },
    { code: "A.8.27", title: "Princípios de arquitetura e engenharia de sistemas seguros", domain: "Technological" },
    { code: "A.8.28", title: "Codificação segura", domain: "Technological" },
    { code: "A.8.29", title: "Testes de segurança em desenvolvimento e aceitação", domain: "Technological" },
    { code: "A.8.30", title: "Desenvolvimento terceirizado", domain: "Technological" },
    { code: "A.8.31", title: "Separação dos ambientes de desenvolvimento, teste e produção", domain: "Technological" },
    { code: "A.8.32", title: "Gestão de mudanças", domain: "Technological" },
    { code: "A.8.33", title: "Informações de teste", domain: "Technological" },
    { code: "A.8.34", title: "Proteção de sistemas de informação durante testes de auditoria", domain: "Technological" },
  ]);
  console.log("  -> 93 Annex A controls created");

  // ==================== ISO 9001:2015 ====================
  const iso9001 = await prisma.standard.upsert({
    where: { code: "ISO-9001" },
    update: {},
    create: {
      code: "ISO-9001",
      name: "ISO 9001:2015",
      version: "2015",
      year: 2015,
      description: "Sistemas de gestão da qualidade - Requisitos",
    },
  });
  console.log(`Standard: ${iso9001.name}`);

  await createClausesForStandard(iso9001.id, [
    { code: "4", title: "Contexto da organização", children: [
      { code: "4.1", title: "Entendendo a organização e seu contexto" },
      { code: "4.2", title: "Entendendo as necessidades e expectativas de partes interessadas" },
      { code: "4.3", title: "Determinando o escopo do sistema de gestão da qualidade" },
      { code: "4.4", title: "Sistema de gestão da qualidade e seus processos" },
    ]},
    { code: "5", title: "Liderança", children: [
      { code: "5.1", title: "Liderança e comprometimento", children: [
        { code: "5.1.1", title: "Generalidades" },
        { code: "5.1.2", title: "Foco no cliente" },
      ]},
      { code: "5.2", title: "Política", children: [
        { code: "5.2.1", title: "Desenvolvendo a política da qualidade" },
        { code: "5.2.2", title: "Comunicando a política da qualidade" },
      ]},
      { code: "5.3", title: "Papéis, responsabilidades e autoridades organizacionais" },
    ]},
    { code: "6", title: "Planejamento", children: [
      { code: "6.1", title: "Ações para abordar riscos e oportunidades" },
      { code: "6.2", title: "Objetivos da qualidade e planejamento para alcançá-los" },
      { code: "6.3", title: "Planejamento de mudanças" },
    ]},
    { code: "7", title: "Apoio", children: [
      { code: "7.1", title: "Recursos", children: [
        { code: "7.1.1", title: "Generalidades" },
        { code: "7.1.2", title: "Pessoas" },
        { code: "7.1.3", title: "Infraestrutura" },
        { code: "7.1.4", title: "Ambiente para a operação dos processos" },
        { code: "7.1.5", title: "Recursos de monitoramento e medição" },
        { code: "7.1.6", title: "Conhecimento organizacional" },
      ]},
      { code: "7.2", title: "Competência" },
      { code: "7.3", title: "Conscientização" },
      { code: "7.4", title: "Comunicação" },
      { code: "7.5", title: "Informação documentada", children: [
        { code: "7.5.1", title: "Generalidades" },
        { code: "7.5.2", title: "Criando e atualizando" },
        { code: "7.5.3", title: "Controle de informação documentada" },
      ]},
    ]},
    { code: "8", title: "Operação", children: [
      { code: "8.1", title: "Planejamento e controle operacionais" },
      { code: "8.2", title: "Requisitos para produtos e serviços", children: [
        { code: "8.2.1", title: "Comunicação com o cliente" },
        { code: "8.2.2", title: "Determinação de requisitos relativos a produtos e serviços" },
        { code: "8.2.3", title: "Análise crítica de requisitos relativos a produtos e serviços" },
        { code: "8.2.4", title: "Mudanças nos requisitos para produtos e serviços" },
      ]},
      { code: "8.3", title: "Projeto e desenvolvimento de produtos e serviços", children: [
        { code: "8.3.1", title: "Generalidades" },
        { code: "8.3.2", title: "Planejamento de projeto e desenvolvimento" },
        { code: "8.3.3", title: "Entradas de projeto e desenvolvimento" },
        { code: "8.3.4", title: "Controles de projeto e desenvolvimento" },
        { code: "8.3.5", title: "Saídas de projeto e desenvolvimento" },
        { code: "8.3.6", title: "Mudanças de projeto e desenvolvimento" },
      ]},
      { code: "8.4", title: "Controle de processos, produtos e serviços providos externamente", children: [
        { code: "8.4.1", title: "Generalidades" },
        { code: "8.4.2", title: "Tipo e extensão do controle" },
        { code: "8.4.3", title: "Informação para provedores externos" },
      ]},
      { code: "8.5", title: "Produção e provisão de serviço", children: [
        { code: "8.5.1", title: "Controle de produção e de provisão de serviço" },
        { code: "8.5.2", title: "Identificação e rastreabilidade" },
        { code: "8.5.3", title: "Propriedade pertencente a clientes ou provedores externos" },
        { code: "8.5.4", title: "Preservação" },
        { code: "8.5.5", title: "Atividades pós-entrega" },
        { code: "8.5.6", title: "Controle de mudanças" },
      ]},
      { code: "8.6", title: "Liberação de produtos e serviços" },
      { code: "8.7", title: "Controle de saídas não conformes" },
    ]},
    { code: "9", title: "Avaliação de desempenho", children: [
      { code: "9.1", title: "Monitoramento, medição, análise e avaliação", children: [
        { code: "9.1.1", title: "Generalidades" },
        { code: "9.1.2", title: "Satisfação do cliente" },
        { code: "9.1.3", title: "Análise e avaliação" },
      ]},
      { code: "9.2", title: "Auditoria interna" },
      { code: "9.3", title: "Análise crítica pela direção", children: [
        { code: "9.3.1", title: "Generalidades" },
        { code: "9.3.2", title: "Entradas da análise crítica pela direção" },
        { code: "9.3.3", title: "Saídas da análise crítica pela direção" },
      ]},
    ]},
    { code: "10", title: "Melhoria", children: [
      { code: "10.1", title: "Generalidades" },
      { code: "10.2", title: "Não conformidade e ação corretiva" },
      { code: "10.3", title: "Melhoria contínua" },
    ]},
  ], null, 0);
  console.log("  -> Clauses created");

  // ==================== ISO 14001:2015 ====================
  const iso14001 = await prisma.standard.upsert({
    where: { code: "ISO-14001" },
    update: {},
    create: {
      code: "ISO-14001",
      name: "ISO 14001:2015",
      version: "2015",
      year: 2015,
      description: "Sistemas de gestão ambiental - Requisitos com orientações para uso",
    },
  });
  console.log(`Standard: ${iso14001.name}`);

  await createClausesForStandard(iso14001.id, [
    { code: "4", title: "Contexto da organização", children: [
      { code: "4.1", title: "Entendendo a organização e seu contexto" },
      { code: "4.2", title: "Entendendo as necessidades e expectativas de partes interessadas" },
      { code: "4.3", title: "Determinando o escopo do sistema de gestão ambiental" },
      { code: "4.4", title: "Sistema de gestão ambiental" },
    ]},
    { code: "5", title: "Liderança", children: [
      { code: "5.1", title: "Liderança e comprometimento" },
      { code: "5.2", title: "Política ambiental" },
      { code: "5.3", title: "Papéis, responsabilidades e autoridades organizacionais" },
    ]},
    { code: "6", title: "Planejamento", children: [
      { code: "6.1", title: "Ações para abordar riscos e oportunidades", children: [
        { code: "6.1.1", title: "Generalidades" },
        { code: "6.1.2", title: "Aspectos ambientais" },
        { code: "6.1.3", title: "Requisitos legais e outros requisitos" },
        { code: "6.1.4", title: "Planejamento de ações" },
      ]},
      { code: "6.2", title: "Objetivos ambientais e planejamento para alcançá-los", children: [
        { code: "6.2.1", title: "Objetivos ambientais" },
        { code: "6.2.2", title: "Planejamento de ações para alcançar os objetivos ambientais" },
      ]},
    ]},
    { code: "7", title: "Apoio", children: [
      { code: "7.1", title: "Recursos" },
      { code: "7.2", title: "Competência" },
      { code: "7.3", title: "Conscientização" },
      { code: "7.4", title: "Comunicação", children: [
        { code: "7.4.1", title: "Generalidades" },
        { code: "7.4.2", title: "Comunicação interna" },
        { code: "7.4.3", title: "Comunicação externa" },
      ]},
      { code: "7.5", title: "Informação documentada", children: [
        { code: "7.5.1", title: "Generalidades" },
        { code: "7.5.2", title: "Criando e atualizando" },
        { code: "7.5.3", title: "Controle de informação documentada" },
      ]},
    ]},
    { code: "8", title: "Operação", children: [
      { code: "8.1", title: "Planejamento e controle operacionais" },
      { code: "8.2", title: "Preparação e resposta a emergências" },
    ]},
    { code: "9", title: "Avaliação de desempenho", children: [
      { code: "9.1", title: "Monitoramento, medição, análise e avaliação", children: [
        { code: "9.1.1", title: "Generalidades" },
        { code: "9.1.2", title: "Avaliação do atendimento a requisitos legais e outros requisitos" },
      ]},
      { code: "9.2", title: "Auditoria interna", children: [
        { code: "9.2.1", title: "Generalidades" },
        { code: "9.2.2", title: "Programa de auditoria interna" },
      ]},
      { code: "9.3", title: "Análise crítica pela direção" },
    ]},
    { code: "10", title: "Melhoria", children: [
      { code: "10.1", title: "Generalidades" },
      { code: "10.2", title: "Não conformidade e ação corretiva" },
      { code: "10.3", title: "Melhoria contínua" },
    ]},
  ], null, 0);
  console.log("  -> Clauses created");

  // ==================== ISO 45001:2018 ====================
  const iso45001 = await prisma.standard.upsert({
    where: { code: "ISO-45001" },
    update: {},
    create: {
      code: "ISO-45001",
      name: "ISO 45001:2018",
      version: "2018",
      year: 2018,
      description: "Sistemas de gestão de saúde e segurança ocupacional - Requisitos",
    },
  });
  console.log(`Standard: ${iso45001.name}`);

  await createClausesForStandard(iso45001.id, [
    { code: "4", title: "Contexto da organização", children: [
      { code: "4.1", title: "Entendendo a organização e seu contexto" },
      { code: "4.2", title: "Entendendo as necessidades e expectativas de trabalhadores e outras partes interessadas" },
      { code: "4.3", title: "Determinando o escopo do sistema de gestão de SSO" },
      { code: "4.4", title: "Sistema de gestão de SSO" },
    ]},
    { code: "5", title: "Liderança e participação dos trabalhadores", children: [
      { code: "5.1", title: "Liderança e comprometimento" },
      { code: "5.2", title: "Política de SSO" },
      { code: "5.3", title: "Papéis, responsabilidades e autoridades organizacionais" },
      { code: "5.4", title: "Consulta e participação de trabalhadores" },
    ]},
    { code: "6", title: "Planejamento", children: [
      { code: "6.1", title: "Ações para abordar riscos e oportunidades", children: [
        { code: "6.1.1", title: "Generalidades" },
        { code: "6.1.2", title: "Identificação de perigos e avaliação de riscos e oportunidades", children: [
          { code: "6.1.2.1", title: "Identificação de perigos" },
          { code: "6.1.2.2", title: "Avaliação de riscos de SSO e outros riscos" },
          { code: "6.1.2.3", title: "Avaliação de oportunidades de SSO e outras oportunidades" },
        ]},
        { code: "6.1.3", title: "Determinação dos requisitos legais e outros requisitos" },
        { code: "6.1.4", title: "Planejamento de ações" },
      ]},
      { code: "6.2", title: "Objetivos de SSO e planejamento para alcançá-los", children: [
        { code: "6.2.1", title: "Objetivos de SSO" },
        { code: "6.2.2", title: "Planejamento para alcançar os objetivos de SSO" },
      ]},
    ]},
    { code: "7", title: "Apoio", children: [
      { code: "7.1", title: "Recursos" },
      { code: "7.2", title: "Competência" },
      { code: "7.3", title: "Conscientização" },
      { code: "7.4", title: "Comunicação", children: [
        { code: "7.4.1", title: "Generalidades" },
        { code: "7.4.2", title: "Comunicação interna" },
        { code: "7.4.3", title: "Comunicação externa" },
      ]},
      { code: "7.5", title: "Informação documentada", children: [
        { code: "7.5.1", title: "Generalidades" },
        { code: "7.5.2", title: "Criando e atualizando" },
        { code: "7.5.3", title: "Controle de informação documentada" },
      ]},
    ]},
    { code: "8", title: "Operação", children: [
      { code: "8.1", title: "Planejamento e controle operacionais", children: [
        { code: "8.1.1", title: "Generalidades" },
        { code: "8.1.2", title: "Eliminando perigos e reduzindo riscos de SSO" },
        { code: "8.1.3", title: "Gestão de mudança" },
        { code: "8.1.4", title: "Aquisição", children: [
          { code: "8.1.4.1", title: "Generalidades" },
          { code: "8.1.4.2", title: "Contratados" },
          { code: "8.1.4.3", title: "Terceirização" },
        ]},
      ]},
      { code: "8.2", title: "Preparação e resposta de emergência" },
    ]},
    { code: "9", title: "Avaliação de desempenho", children: [
      { code: "9.1", title: "Monitoramento, medição, análise e avaliação de desempenho", children: [
        { code: "9.1.1", title: "Generalidades" },
        { code: "9.1.2", title: "Avaliação do atendimento a requisitos legais e outros requisitos" },
      ]},
      { code: "9.2", title: "Auditoria interna", children: [
        { code: "9.2.1", title: "Generalidades" },
        { code: "9.2.2", title: "Programa de auditoria interna" },
      ]},
      { code: "9.3", title: "Análise crítica pela direção" },
    ]},
    { code: "10", title: "Melhoria", children: [
      { code: "10.1", title: "Generalidades" },
      { code: "10.2", title: "Incidente, não conformidade e ação corretiva" },
      { code: "10.3", title: "Melhoria contínua" },
    ]},
  ], null, 0);
  console.log("  -> Clauses created");

  // ==================== ISO 22301:2019 ====================
  const iso22301 = await prisma.standard.upsert({
    where: { code: "ISO-22301" },
    update: {},
    create: {
      code: "ISO-22301",
      name: "ISO 22301:2019",
      version: "2019",
      year: 2019,
      description: "Segurança e resiliência - Sistemas de gestão de continuidade de negócios - Requisitos",
    },
  });
  console.log(`Standard: ${iso22301.name}`);

  await createClausesForStandard(iso22301.id, [
    { code: "4", title: "Contexto da organização", children: [
      { code: "4.1", title: "Entendendo a organização e seu contexto" },
      { code: "4.2", title: "Entendendo as necessidades e expectativas das partes interessadas" },
      { code: "4.3", title: "Determinando o escopo do SGCN" },
      { code: "4.4", title: "Sistema de gestão de continuidade de negócios" },
    ]},
    { code: "5", title: "Liderança", children: [
      { code: "5.1", title: "Liderança e comprometimento" },
      { code: "5.2", title: "Política" },
      { code: "5.3", title: "Papéis, responsabilidades e autoridades organizacionais" },
    ]},
    { code: "6", title: "Planejamento", children: [
      { code: "6.1", title: "Ações para abordar riscos e oportunidades" },
      { code: "6.2", title: "Objetivos de continuidade de negócios e planejamento para alcançá-los" },
      { code: "6.3", title: "Planejamento de mudanças" },
    ]},
    { code: "7", title: "Apoio", children: [
      { code: "7.1", title: "Recursos" },
      { code: "7.2", title: "Competência" },
      { code: "7.3", title: "Conscientização" },
      { code: "7.4", title: "Comunicação" },
      { code: "7.5", title: "Informação documentada", children: [
        { code: "7.5.1", title: "Generalidades" },
        { code: "7.5.2", title: "Criando e atualizando" },
        { code: "7.5.3", title: "Controle de informação documentada" },
      ]},
    ]},
    { code: "8", title: "Operação", children: [
      { code: "8.1", title: "Planejamento e controle operacionais" },
      { code: "8.2", title: "Análise de impacto nos negócios e avaliação de riscos", children: [
        { code: "8.2.1", title: "Generalidades" },
        { code: "8.2.2", title: "Análise de impacto nos negócios" },
        { code: "8.2.3", title: "Avaliação de riscos" },
      ]},
      { code: "8.3", title: "Estratégias e soluções de continuidade de negócios", children: [
        { code: "8.3.1", title: "Generalidades" },
        { code: "8.3.2", title: "Identificação de estratégias e soluções" },
        { code: "8.3.3", title: "Proteção e estabilização de recursos" },
      ]},
      { code: "8.4", title: "Planos e procedimentos de continuidade de negócios", children: [
        { code: "8.4.1", title: "Generalidades" },
        { code: "8.4.2", title: "Estrutura de resposta a incidentes" },
        { code: "8.4.3", title: "Planos de continuidade de negócios" },
        { code: "8.4.4", title: "Recuperação" },
      ]},
      { code: "8.5", title: "Programa de exercícios" },
      { code: "8.6", title: "Avaliação da documentação e capacidades de continuidade de negócios" },
    ]},
    { code: "9", title: "Avaliação de desempenho", children: [
      { code: "9.1", title: "Monitoramento, medição, análise e avaliação" },
      { code: "9.2", title: "Auditoria interna" },
      { code: "9.3", title: "Análise crítica pela direção" },
    ]},
    { code: "10", title: "Melhoria", children: [
      { code: "10.1", title: "Não conformidade e ação corretiva" },
      { code: "10.2", title: "Melhoria contínua" },
    ]},
  ], null, 0);
  console.log("  -> Clauses created");

  // ==================== ISO 27701:2019 ====================
  const iso27701 = await prisma.standard.upsert({
    where: { code: "ISO-27701" },
    update: {},
    create: {
      code: "ISO-27701",
      name: "ISO/IEC 27701:2019",
      version: "2019",
      year: 2019,
      description: "Extensão à ISO 27001 e ISO 27002 para gestão da privacidade da informação - Requisitos e diretrizes",
    },
  });
  console.log(`Standard: ${iso27701.name}`);

  await createClausesForStandard(iso27701.id, [
    { code: "5", title: "Requisitos específicos de SGPI relacionados à ISO 27001", children: [
      { code: "5.1", title: "Generalidades" },
      { code: "5.2", title: "Contexto da organização", children: [
        { code: "5.2.1", title: "Entendendo a organização e seu contexto" },
        { code: "5.2.2", title: "Entendendo as necessidades e expectativas das partes interessadas" },
        { code: "5.2.3", title: "Determinando o escopo do SGPI" },
        { code: "5.2.4", title: "Sistema de gestão da privacidade da informação" },
      ]},
      { code: "5.3", title: "Liderança", children: [
        { code: "5.3.1", title: "Liderança e comprometimento" },
        { code: "5.3.2", title: "Política" },
        { code: "5.3.3", title: "Papéis, responsabilidades e autoridades organizacionais" },
      ]},
      { code: "5.4", title: "Planejamento", children: [
        { code: "5.4.1", title: "Ações para abordar riscos e oportunidades" },
        { code: "5.4.2", title: "Objetivos de segurança da informação e planejamento para alcançá-los" },
      ]},
      { code: "5.5", title: "Apoio", children: [
        { code: "5.5.1", title: "Recursos" },
        { code: "5.5.2", title: "Competência" },
        { code: "5.5.3", title: "Conscientização" },
        { code: "5.5.4", title: "Comunicação" },
        { code: "5.5.5", title: "Informação documentada" },
      ]},
      { code: "5.6", title: "Operação", children: [
        { code: "5.6.1", title: "Planejamento e controle operacional" },
        { code: "5.6.2", title: "Avaliação de riscos de segurança da informação" },
        { code: "5.6.3", title: "Tratamento de riscos de segurança da informação" },
      ]},
      { code: "5.7", title: "Avaliação de desempenho", children: [
        { code: "5.7.1", title: "Monitoramento, medição, análise e avaliação" },
        { code: "5.7.2", title: "Auditoria interna" },
        { code: "5.7.3", title: "Análise crítica pela direção" },
      ]},
      { code: "5.8", title: "Melhoria", children: [
        { code: "5.8.1", title: "Não conformidade e ação corretiva" },
        { code: "5.8.2", title: "Melhoria contínua" },
      ]},
    ]},
    { code: "6", title: "Diretrizes específicas de SGPI relacionadas à ISO 27002", children: [
      { code: "6.1", title: "Generalidades" },
      { code: "6.2", title: "Políticas de segurança da informação" },
      { code: "6.3", title: "Organização da segurança da informação" },
      { code: "6.4", title: "Segurança em recursos humanos" },
      { code: "6.5", title: "Gestão de ativos" },
      { code: "6.6", title: "Controle de acesso" },
      { code: "6.7", title: "Criptografia" },
      { code: "6.8", title: "Segurança física e do ambiente" },
      { code: "6.9", title: "Segurança nas operações" },
      { code: "6.10", title: "Segurança nas comunicações" },
      { code: "6.11", title: "Aquisição, desenvolvimento e manutenção de sistemas" },
      { code: "6.12", title: "Relacionamento na cadeia de suprimento" },
      { code: "6.13", title: "Gestão de incidentes de segurança da informação" },
      { code: "6.14", title: "Aspectos da segurança da informação na gestão da continuidade do negócio" },
      { code: "6.15", title: "Conformidade" },
    ]},
    { code: "7", title: "Diretrizes adicionais para controladores de DP", children: [
      { code: "7.1", title: "Generalidades" },
      { code: "7.2", title: "Condições para coleta e tratamento", children: [
        { code: "7.2.1", title: "Identificar e documentar a finalidade" },
        { code: "7.2.2", title: "Identificar as bases legais" },
        { code: "7.2.3", title: "Determinar quando e como o consentimento deve ser obtido" },
        { code: "7.2.4", title: "Obter e registrar o consentimento" },
        { code: "7.2.5", title: "Avaliação de impacto sobre a privacidade" },
        { code: "7.2.6", title: "Contratos com operadores de DP" },
        { code: "7.2.7", title: "Controladoria conjunta de DP" },
        { code: "7.2.8", title: "Registros relacionados ao tratamento de DP" },
      ]},
      { code: "7.3", title: "Obrigações para titulares de DP", children: [
        { code: "7.3.1", title: "Determinação e cumprimento de obrigações" },
        { code: "7.3.2", title: "Determinação de informações para titulares de DP" },
        { code: "7.3.3", title: "Fornecimento de informações aos titulares de DP" },
        { code: "7.3.4", title: "Fornecimento de mecanismo para modificar ou retirar consentimento" },
        { code: "7.3.5", title: "Fornecimento de mecanismo para se opor ao tratamento de DP" },
        { code: "7.3.6", title: "Acesso, correção e/ou eliminação" },
        { code: "7.3.7", title: "Obrigações dos controladores de DP para informar terceiros" },
        { code: "7.3.8", title: "Fornecimento de cópia dos DP tratados" },
        { code: "7.3.9", title: "Tratamento de solicitações" },
        { code: "7.3.10", title: "Tomada de decisão automatizada" },
      ]},
      { code: "7.4", title: "Privacidade por design e por padrão", children: [
        { code: "7.4.1", title: "Limitar a coleta" },
        { code: "7.4.2", title: "Limitar o tratamento" },
        { code: "7.4.3", title: "Precisão e qualidade" },
        { code: "7.4.4", title: "Objetivos de minimização de DP" },
        { code: "7.4.5", title: "Desidentificação e eliminação de DP no final do tratamento" },
        { code: "7.4.6", title: "Arquivos temporários" },
        { code: "7.4.7", title: "Retenção" },
        { code: "7.4.8", title: "Descarte" },
        { code: "7.4.9", title: "Controles de transmissão de DP" },
      ]},
      { code: "7.5", title: "Compartilhamento, transferência e divulgação de DP", children: [
        { code: "7.5.1", title: "Identificação da base para transferência de DP entre jurisdições" },
        { code: "7.5.2", title: "Países e organizações internacionais para os quais DP podem ser transferidos" },
        { code: "7.5.3", title: "Registros de transferência de DP" },
        { code: "7.5.4", title: "Registros de divulgação de DP para terceiros" },
      ]},
    ]},
    { code: "8", title: "Diretrizes adicionais para operadores de DP", children: [
      { code: "8.1", title: "Generalidades" },
      { code: "8.2", title: "Condições para coleta e tratamento", children: [
        { code: "8.2.1", title: "Acordo com o cliente" },
        { code: "8.2.2", title: "Finalidades da organização" },
        { code: "8.2.3", title: "Uso de marketing e publicidade" },
        { code: "8.2.4", title: "Instrução infratora" },
        { code: "8.2.5", title: "Obrigações do cliente" },
        { code: "8.2.6", title: "Registros relacionados ao tratamento de DP" },
      ]},
      { code: "8.3", title: "Obrigações para titulares de DP", children: [
        { code: "8.3.1", title: "Obrigações para titulares de DP" },
      ]},
      { code: "8.4", title: "Privacidade por design e por padrão", children: [
        { code: "8.4.1", title: "Arquivos temporários" },
        { code: "8.4.2", title: "Devolução, transferência ou descarte de DP" },
        { code: "8.4.3", title: "Controles de transmissão de DP" },
      ]},
      { code: "8.5", title: "Compartilhamento, transferência e divulgação de DP", children: [
        { code: "8.5.1", title: "Bases para transferência de DP entre jurisdições" },
        { code: "8.5.2", title: "Países e organizações internacionais para os quais DP podem ser transferidos" },
        { code: "8.5.3", title: "Registros de transferência de DP para terceiros" },
        { code: "8.5.4", title: "Notificação de solicitações de divulgação de DP" },
        { code: "8.5.5", title: "Divulgações juridicamente vinculantes de DP" },
        { code: "8.5.6", title: "Divulgação de subcontratados usados para tratar DP" },
        { code: "8.5.7", title: "Contratação de um subcontratado para tratar DP" },
        { code: "8.5.8", title: "Mudança de subcontratado para tratar DP" },
      ]},
    ]},
  ], null, 0);
  console.log("  -> Clauses created");

  // ISO 27701 Privacy Controls (Annex A - Controllers + Annex B - Processors)
  await createControlsForStandard(iso27701.id, [
    // Annex A - Controllers
    { code: "A.7.2.1", title: "Identificar e documentar a finalidade", domain: "Controller" },
    { code: "A.7.2.2", title: "Identificar as bases legais", domain: "Controller" },
    { code: "A.7.2.3", title: "Determinar quando e como obter consentimento", domain: "Controller" },
    { code: "A.7.2.4", title: "Obter e registrar o consentimento", domain: "Controller" },
    { code: "A.7.2.5", title: "Avaliação de impacto sobre a privacidade", domain: "Controller" },
    { code: "A.7.2.6", title: "Contratos com operadores de DP", domain: "Controller" },
    { code: "A.7.2.7", title: "Controladoria conjunta de DP", domain: "Controller" },
    { code: "A.7.2.8", title: "Registros relacionados ao tratamento de DP", domain: "Controller" },
    { code: "A.7.3.1", title: "Determinação e cumprimento de obrigações para titulares", domain: "Controller" },
    { code: "A.7.3.2", title: "Determinação de informações para titulares de DP", domain: "Controller" },
    { code: "A.7.3.3", title: "Fornecimento de informações aos titulares", domain: "Controller" },
    { code: "A.7.3.4", title: "Mecanismo para modificar ou retirar consentimento", domain: "Controller" },
    { code: "A.7.3.5", title: "Mecanismo para se opor ao tratamento", domain: "Controller" },
    { code: "A.7.3.6", title: "Acesso, correção e/ou eliminação", domain: "Controller" },
    { code: "A.7.3.7", title: "Obrigações de informar terceiros", domain: "Controller" },
    { code: "A.7.3.8", title: "Fornecimento de cópia dos DP tratados", domain: "Controller" },
    { code: "A.7.3.9", title: "Tratamento de solicitações", domain: "Controller" },
    { code: "A.7.3.10", title: "Tomada de decisão automatizada", domain: "Controller" },
    { code: "A.7.4.1", title: "Limitar a coleta", domain: "Controller" },
    { code: "A.7.4.2", title: "Limitar o tratamento", domain: "Controller" },
    { code: "A.7.4.3", title: "Precisão e qualidade", domain: "Controller" },
    { code: "A.7.4.4", title: "Objetivos de minimização de DP", domain: "Controller" },
    { code: "A.7.4.5", title: "Desidentificação e eliminação de DP", domain: "Controller" },
    { code: "A.7.4.6", title: "Arquivos temporários", domain: "Controller" },
    { code: "A.7.4.7", title: "Retenção", domain: "Controller" },
    { code: "A.7.4.8", title: "Descarte", domain: "Controller" },
    { code: "A.7.4.9", title: "Controles de transmissão de DP", domain: "Controller" },
    { code: "A.7.5.1", title: "Base para transferência entre jurisdições", domain: "Controller" },
    { code: "A.7.5.2", title: "Países para transferência de DP", domain: "Controller" },
    { code: "A.7.5.3", title: "Registros de transferência de DP", domain: "Controller" },
    { code: "A.7.5.4", title: "Registros de divulgação a terceiros", domain: "Controller" },
    // Annex B - Processors
    { code: "B.8.2.1", title: "Acordo com o cliente", domain: "Processor" },
    { code: "B.8.2.2", title: "Finalidades da organização", domain: "Processor" },
    { code: "B.8.2.3", title: "Uso de marketing e publicidade", domain: "Processor" },
    { code: "B.8.2.4", title: "Instrução infratora", domain: "Processor" },
    { code: "B.8.2.5", title: "Obrigações do cliente", domain: "Processor" },
    { code: "B.8.2.6", title: "Registros relacionados ao tratamento de DP", domain: "Processor" },
    { code: "B.8.3.1", title: "Obrigações para titulares de DP", domain: "Processor" },
    { code: "B.8.4.1", title: "Arquivos temporários", domain: "Processor" },
    { code: "B.8.4.2", title: "Devolução, transferência ou descarte de DP", domain: "Processor" },
    { code: "B.8.4.3", title: "Controles de transmissão de DP", domain: "Processor" },
    { code: "B.8.5.1", title: "Bases para transferência entre jurisdições", domain: "Processor" },
    { code: "B.8.5.2", title: "Países para transferência de DP", domain: "Processor" },
    { code: "B.8.5.3", title: "Registros de transferência a terceiros", domain: "Processor" },
    { code: "B.8.5.4", title: "Notificação de solicitações de divulgação", domain: "Processor" },
    { code: "B.8.5.5", title: "Divulgações juridicamente vinculantes", domain: "Processor" },
    { code: "B.8.5.6", title: "Divulgação de subcontratados", domain: "Processor" },
    { code: "B.8.5.7", title: "Contratação de subcontratado", domain: "Processor" },
    { code: "B.8.5.8", title: "Mudança de subcontratado", domain: "Processor" },
  ]);
  console.log("  -> 49 privacy controls created");

  console.log("\nSeed completed! Standards created:");
  console.log("  - ISO/IEC 27001:2022 (SGSI) - 7 clauses + sub-clauses + 93 Annex A controls");
  console.log("  - ISO 9001:2015 (SGQ) - 7 clauses + sub-clauses");
  console.log("  - ISO 14001:2015 (SGA) - 7 clauses + sub-clauses");
  console.log("  - ISO 45001:2018 (SSO) - 7 clauses + sub-clauses");
  console.log("  - ISO 22301:2019 (SGCN) - 7 clauses + sub-clauses");
  console.log("  - ISO/IEC 27701:2019 (SGPI) - 4 sections + sub-clauses + 49 privacy controls");

  // ==================== DEMO TENANT ====================
  await seedDemoTenant(plans, iso27001, iso27701, iso9001);
}

function daysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

function monthsAgo(months: number, day = 15): Date {
  const d = new Date();
  d.setMonth(d.getMonth() - months);
  d.setDate(day);
  return d;
}

function futureDate(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

function getRiskLevel(p: number, i: number): string {
  const score = p * i;
  if (score >= 17) return "critical";
  if (score >= 10) return "high";
  if (score >= 5) return "medium";
  return "low";
}

async function seedDemoTenant(
  plans: { id: string; slug: string }[],
  iso27001: { id: string },
  iso27701: { id: string },
  iso9001: { id: string }
) {
  console.log("\n==================== DEMO TENANT ====================");

  // Check if demo tenant exists
  const existing = await prisma.tenant.findUnique({ where: { slug: "demo" } });
  if (existing) {
    console.log("Demo tenant exists. Deleting for fresh seed...");
    await prisma.tenant.delete({ where: { slug: "demo" } });
  }

  // Find or create demo user
  const demoUserId = process.env.DEMO_USER_ID;
  let userId: string;

  if (demoUserId) {
    userId = demoUserId;
    console.log(`Using DEMO_USER_ID: ${userId}`);
  } else {
    const firstUser = await prisma.user.findFirst({ orderBy: { createdAt: "asc" } });
    if (!firstUser) {
      console.log("No users found in database. Skipping demo tenant seed.");
      console.log("Tip: Set DEMO_USER_ID env var or create a user via Supabase first.");
      return;
    }
    userId = firstUser.id;
    console.log(`Using first user: ${firstUser.email} (${userId})`);
  }

  // 1. Tenant
  const tenant = await prisma.tenant.create({
    data: {
      name: "PowerConsult Demonstração",
      slug: "demo",
      status: "active",
    },
  });
  const T = tenant.id;
  console.log(`Tenant: ${tenant.name} (${T})`);

  // 2. TenantMember
  await prisma.tenantMember.create({
    data: { tenantId: T, userId, role: "tenant_admin" },
  });

  // 3. Subscription (Professional plan)
  const proPlan = plans.find((p) => p.slug === "professional");
  if (proPlan) {
    await prisma.subscription.create({
      data: {
        tenantId: T,
        planId: proPlan.id,
        status: "active",
        currentPeriodStart: daysAgo(15),
        currentPeriodEnd: futureDate(15),
      },
    });
  }

  // 4. Consulting Clients
  const client1 = await prisma.consultingClient.create({
    data: { tenantId: T, name: "TechCorp S.A.", cnpj: "12.345.678/0001-90", contactName: "Carlos Silva", contactEmail: "carlos@techcorp.com.br", sector: "Tecnologia" },
  });
  const client2 = await prisma.consultingClient.create({
    data: { tenantId: T, name: "Indústria Beta Ltda", cnpj: "98.765.432/0001-10", contactName: "Ana Oliveira", contactEmail: "ana@industriabeta.com.br", sector: "Manufatura" },
  });
  console.log("Clients: TechCorp, Indústria Beta");

  // 5. Projects
  const proj1 = await prisma.project.create({
    data: {
      tenantId: T,
      name: "SGSI - ISO 27001 TechCorp",
      description: "Implementação do Sistema de Gestão de Segurança da Informação para TechCorp S.A.",
      clientId: client1.id,
      status: "in_progress",
      startDate: monthsAgo(4, 1),
      progress: 45,
      targetMaturity: 3,
      members: { create: { userId, role: "owner" } },
      standards: {
        create: [
          { standardId: iso27001.id },
          { standardId: iso27701.id },
        ],
      },
    },
  });

  const proj2 = await prisma.project.create({
    data: {
      tenantId: T,
      name: "SGQ - ISO 9001 Indústria Beta",
      description: "Implementação do Sistema de Gestão da Qualidade para Indústria Beta Ltda.",
      clientId: client2.id,
      status: "planning",
      startDate: monthsAgo(1, 15),
      progress: 10,
      targetMaturity: 3,
      members: { create: { userId, role: "owner" } },
      standards: {
        create: [{ standardId: iso9001.id }],
      },
    },
  });
  console.log("Projects: SGSI TechCorp (in_progress), SGQ Beta (planning)");

  // Auto-import requirements and controls for both projects
  const [clauses27001, controls27001, clauses27701, controls27701, clauses9001] = await Promise.all([
    prisma.standardClause.findMany({ where: { standardId: iso27001.id }, select: { id: true } }),
    prisma.standardControl.findMany({ where: { standardId: iso27001.id }, select: { id: true } }),
    prisma.standardClause.findMany({ where: { standardId: iso27701.id }, select: { id: true } }),
    prisma.standardControl.findMany({ where: { standardId: iso27701.id }, select: { id: true } }),
    prisma.standardClause.findMany({ where: { standardId: iso9001.id }, select: { id: true } }),
  ]);

  await Promise.all([
    prisma.projectRequirement.createMany({
      data: [...clauses27001, ...clauses27701].map((c) => ({ tenantId: T, projectId: proj1.id, clauseId: c.id })),
      skipDuplicates: true,
    }),
    prisma.projectControl.createMany({
      data: [...controls27001, ...controls27701].map((c) => ({ tenantId: T, projectId: proj1.id, controlId: c.id })),
      skipDuplicates: true,
    }),
    prisma.projectRequirement.createMany({
      data: clauses9001.map((c) => ({ tenantId: T, projectId: proj2.id, clauseId: c.id })),
      skipDuplicates: true,
    }),
  ]);
  console.log("  -> Requirements & controls auto-imported");

  // 6. Risks (10 total, 5 per project)
  const riskData = [
    { proj: proj1.id, code: "RSK-2025-001", title: "Acesso não autorizado a sistemas críticos", desc: "Funcionários com acesso excessivo a sistemas que contêm dados sensíveis", cat: "access_control", p: 4, i: 5, treatment: "mitigate", treatmentPlan: "Implementar controle de acesso baseado em papéis (RBAC)", daysBack: 150 },
    { proj: proj1.id, code: "RSK-2025-002", title: "Vazamento de dados pessoais", desc: "Risco de exposição de dados pessoais de clientes em sistemas internos", cat: "data_protection", p: 3, i: 5, treatment: "mitigate", treatmentPlan: "Criptografia de dados em repouso e em trânsito", daysBack: 140 },
    { proj: proj1.id, code: "RSK-2025-003", title: "Phishing direcionado a executivos", desc: "Ataques de engenharia social via email direcionados à alta direção", cat: "social_engineering", p: 4, i: 4, treatment: "mitigate", treatmentPlan: "Treinamento de conscientização e filtros avançados de email", daysBack: 120 },
    { proj: proj1.id, code: "RSK-2025-004", title: "Indisponibilidade de serviços em nuvem", desc: "Falha do provedor de nuvem principal afetando operações", cat: "availability", p: 2, i: 4, treatment: "transfer", treatmentPlan: "SLA com provedor e plano de DR", daysBack: 100 },
    { proj: proj1.id, code: "RSK-2025-005", title: "Desatualização de software", desc: "Sistemas operacionais e aplicações sem patches de segurança", cat: "vulnerability", p: 3, i: 3, treatment: "mitigate", treatmentPlan: "Política de patch management mensal", daysBack: 80 },
    { proj: proj2.id, code: "RSK-2025-006", title: "Falha no controle de qualidade de MP", desc: "Matéria-prima recebida sem inspeção adequada", cat: "quality", p: 3, i: 4, treatment: "mitigate", treatmentPlan: "Inspeção de recebimento com checklist padronizado", daysBack: 60 },
    { proj: proj2.id, code: "RSK-2025-007", title: "Perda de calibração de instrumentos", desc: "Instrumentos de medição fora de calibração gerando medições incorretas", cat: "measurement", p: 3, i: 3, treatment: "mitigate", treatmentPlan: "Programa de calibração semestral", daysBack: 50 },
    { proj: proj2.id, code: "RSK-2025-008", title: "Turnover de operadores qualificados", desc: "Perda de funcionários treinados em processos críticos", cat: "human_resources", p: 4, i: 3, treatment: "mitigate", treatmentPlan: "Programa de retenção e matriz de competências", daysBack: 45 },
    { proj: proj2.id, code: "RSK-2025-009", title: "Atraso de fornecedor estratégico", desc: "Fornecedor único com histórico de atrasos na entrega", cat: "supply_chain", p: 2, i: 3, treatment: "transfer", treatmentPlan: "Segundo fornecedor homologado como backup", daysBack: 30 },
    { proj: proj2.id, code: "RSK-2025-010", title: "Não conformidade regulatória ambiental", desc: "Descarte inadequado de resíduos do processo produtivo", cat: "regulatory", p: 2, i: 5, treatment: "avoid", treatmentPlan: "Contratação de empresa licenciada de gestão de resíduos", daysBack: 20 },
  ];

  const risks = [];
  for (const r of riskData) {
    const risk = await prisma.risk.create({
      data: {
        tenantId: T, projectId: r.proj, code: r.code, title: r.title,
        description: r.desc, category: r.cat, probability: r.p, impact: r.i,
        riskLevel: getRiskLevel(r.p, r.i), treatment: r.treatment,
        treatmentPlan: r.treatmentPlan, responsibleId: userId,
        createdAt: daysAgo(r.daysBack),
      },
    });
    risks.push(risk);
  }
  console.log(`Risks: ${risks.length} created`);

  // 7. Nonconformities (6 total)
  const ncData = [
    { proj: proj1.id, code: "NC-2025-001", title: "Ausência de política de senhas", desc: "Política de senhas não documentada conforme requisito A.5.17", origin: "internal_audit", severity: "major" as const, status: "open" as const, daysBack: 130 },
    { proj: proj1.id, code: "NC-2025-002", title: "Logs de acesso incompletos", desc: "Sistema de logs não registra todas as ações administrativas (A.8.15)", origin: "internal_audit", severity: "minor" as const, status: "action_defined" as const, daysBack: 110 },
    { proj: proj1.id, code: "NC-2025-003", title: "Falta de acordo de confidencialidade", desc: "Terceiros acessando dados sem NDA assinado (A.6.6)", origin: "gap_analysis", severity: "observation" as const, status: "closed" as const, daysBack: 90, closedDaysBack: 60 },
    { proj: proj2.id, code: "NC-2025-004", title: "Calibração de instrumentos vencida", desc: "3 instrumentos de medição com calibração expirada há mais de 30 dias", origin: "internal_audit", severity: "major" as const, status: "in_execution" as const, daysBack: 55 },
    { proj: proj2.id, code: "NC-2025-005", title: "Registro de inspeção incompleto", desc: "Formulário de inspeção de recebimento sem campos obrigatórios preenchidos", origin: "process_audit", severity: "minor" as const, status: "analysis" as const, daysBack: 35 },
    { proj: proj2.id, code: "NC-2025-006", title: "Procedimento desatualizado", desc: "IT de montagem não reflete mudança de layout realizada há 2 meses", origin: "operational", severity: "observation" as const, status: "open" as const, daysBack: 15 },
  ];

  const ncs = [];
  for (const nc of ncData) {
    const created = await prisma.nonconformity.create({
      data: {
        tenantId: T, projectId: nc.proj, code: nc.code, title: nc.title,
        description: nc.desc, origin: nc.origin, severity: nc.severity,
        status: nc.status, responsibleId: userId,
        dueDate: futureDate(30),
        closedAt: "closedDaysBack" in nc ? daysAgo((nc as { closedDaysBack: number }).closedDaysBack) : undefined,
        createdAt: daysAgo(nc.daysBack),
      },
    });
    ncs.push(created);
  }
  console.log(`Nonconformities: ${ncs.length} created`);

  // 8. NcRootCause (2 analyses)
  await prisma.ncRootCause.create({
    data: {
      nonconformityId: ncs[0].id,
      method: "five_whys",
      analysis: {
        whys: [
          "Por que não há política de senhas? Porque nunca foi formalmente documentada.",
          "Por que não foi documentada? Porque não havia responsável definido.",
          "Por que não havia responsável? Porque o escopo do SGSI não estava claro.",
          "Por que o escopo não estava claro? Porque o projeto iniciou sem análise de contexto.",
          "Por que sem análise? Porque a metodologia não previa essa etapa."
        ],
      },
      conclusion: "Raiz: falta de metodologia estruturada para definição do SGSI.",
    },
  });

  await prisma.ncRootCause.create({
    data: {
      nonconformityId: ncs[3].id,
      method: "ishikawa",
      analysis: {
        categories: {
          mao_de_obra: ["Falta de responsável pelo programa de calibração"],
          metodo: ["Ausência de alerta automático de vencimento"],
          maquina: ["Sistema de gestão de calibração não implementado"],
          material: ["Certificados armazenados em pasta física sem controle"],
          meio_ambiente: ["Laboratório de metrologia sem climatização adequada"],
          medicao: ["Critérios de aceitação não definidos para instrumentos"],
        },
      },
      conclusion: "Raiz principal: ausência de sistema informatizado para controle de calibração.",
    },
  });
  console.log("Root causes: 2 created (5 whys + ishikawa)");

  // 9. Action Plans (8 total)
  const apData = [
    { proj: proj1.id, code: "AP-2025-001", title: "Elaborar política de senhas", type: "corrective" as const, status: "in_progress" as const, ncIdx: 0, daysBack: 125 },
    { proj: proj1.id, code: "AP-2025-002", title: "Configurar logs completos de auditoria", type: "corrective" as const, status: "planned" as const, ncIdx: 1, daysBack: 105 },
    { proj: proj1.id, code: "AP-2025-003", title: "Implementar NDAs para terceiros", type: "corrective" as const, status: "completed" as const, ncIdx: 2, daysBack: 85 },
    { proj: proj1.id, code: "AP-2025-004", title: "Programa de conscientização em segurança", type: "preventive" as const, status: "in_progress" as const, ncIdx: null, daysBack: 70 },
    { proj: proj2.id, code: "AP-2025-005", title: "Recalibrar instrumentos vencidos", type: "corrective" as const, status: "in_progress" as const, ncIdx: 3, daysBack: 50 },
    { proj: proj2.id, code: "AP-2025-006", title: "Revisar formulário de inspeção", type: "corrective" as const, status: "planned" as const, ncIdx: 4, daysBack: 30 },
    { proj: proj2.id, code: "AP-2025-007", title: "Atualizar IT de montagem", type: "corrective" as const, status: "planned" as const, ncIdx: 5, daysBack: 10 },
    { proj: proj2.id, code: "AP-2025-008", title: "Implantar sistema de gestão de calibração", type: "improvement" as const, status: "planned" as const, ncIdx: null, daysBack: 40 },
  ];

  for (const ap of apData) {
    await prisma.actionPlan.create({
      data: {
        tenantId: T, projectId: ap.proj, code: ap.code, title: ap.title,
        description: `Ação para: ${ap.title}`, type: ap.type, status: ap.status,
        responsibleId: userId,
        nonconformityId: ap.ncIdx !== null ? ncs[ap.ncIdx].id : undefined,
        riskId: ap.ncIdx === null ? risks[ap.proj === proj1.id ? 0 : 5].id : undefined,
        dueDate: futureDate(45),
        completedAt: ap.status === "completed" ? daysAgo(10) : undefined,
        createdAt: daysAgo(ap.daysBack),
      },
    });
  }
  console.log("Action Plans: 8 created");

  // 10. Audits (4) + Findings (6)
  const audit1 = await prisma.audit.create({
    data: {
      tenantId: T, projectId: proj1.id, type: "internal",
      title: "Auditoria Interna SGSI - Ciclo 1",
      startDate: daysAgo(90), endDate: daysAgo(85),
      status: "completed", leadAuditorId: userId,
      scope: "Cláusulas 4-10 e Anexo A", conclusion: "Conformidade parcial identificada",
      createdAt: daysAgo(95),
    },
  });

  const audit2 = await prisma.audit.create({
    data: {
      tenantId: T, projectId: proj1.id, type: "internal",
      title: "Auditoria de Acompanhamento SGSI",
      startDate: daysAgo(10), status: "in_progress", leadAuditorId: userId,
      scope: "Cláusulas 6, 7, 8 e controles A.5, A.8",
      createdAt: daysAgo(15),
    },
  });

  await prisma.audit.create({
    data: {
      tenantId: T, projectId: proj2.id, type: "internal",
      title: "Auditoria Interna SGQ - Planejada",
      startDate: futureDate(30), status: "planned", leadAuditorId: userId,
      scope: "Cláusulas 4-10 da ISO 9001",
      createdAt: daysAgo(5),
    },
  });

  await prisma.audit.create({
    data: {
      tenantId: T, projectId: proj2.id, type: "external",
      title: "Pré-auditoria de Certificação SGQ",
      startDate: futureDate(90), status: "planned",
      scope: "Análise completa do SGQ",
      createdAt: daysAgo(3),
    },
  });
  console.log("Audits: 4 created");

  // Audit Findings for audit1
  const findingData = [
    { classification: "minor_nc" as const, desc: "Política de senhas não documentada", evidence: "Entrevista com TI e análise documental" },
    { classification: "minor_nc" as const, desc: "Logs de acesso incompletos em 2 de 5 sistemas avaliados", evidence: "Análise de logs dos sistemas ERP e CRM" },
    { classification: "observation" as const, desc: "Processo de gestão de mudanças pode ser melhorado", evidence: "Entrevista com equipe de desenvolvimento" },
    { classification: "conformity" as const, desc: "Controle de acesso físico adequado", evidence: "Inspeção física e registro de visitantes" },
    { classification: "opportunity" as const, desc: "Automatizar processo de revisão de acessos", evidence: "Benchmark com boas práticas do mercado" },
    { classification: "major_nc" as const, desc: "Ausência de plano de continuidade de negócios testado", evidence: "Análise documental e entrevista com direção" },
  ];

  for (const f of findingData) {
    await prisma.auditFinding.create({
      data: {
        tenantId: T, auditId: audit1.id,
        classification: f.classification, description: f.desc, evidence: f.evidence,
      },
    });
  }
  console.log("Audit Findings: 6 created");

  // 11. Documents (8) + Versions (4)
  const docData = [
    { code: "POL-2025-001", title: "Política de Segurança da Informação", type: "policy" as const, status: "approved" as const, proj: proj1.id, version: "2.0", daysBack: 120 },
    { code: "POL-2025-002", title: "Política de Privacidade e Proteção de Dados", type: "policy" as const, status: "in_review" as const, proj: proj1.id, version: "1.0", daysBack: 60 },
    { code: "PRC-2025-001", title: "Procedimento de Gestão de Incidentes", type: "procedure" as const, status: "approved" as const, proj: proj1.id, version: "1.0", daysBack: 100 },
    { code: "PRC-2025-002", title: "Procedimento de Controle de Documentos", type: "procedure" as const, status: "draft" as const, proj: proj1.id, version: "1.0", daysBack: 30 },
    { code: "IT-2025-001", title: "Instrução de Trabalho - Backup e Restore", type: "work_instruction" as const, status: "approved" as const, proj: proj1.id, version: "1.0", daysBack: 80 },
    { code: "IT-2025-002", title: "Instrução de Trabalho - Inspeção de Recebimento", type: "work_instruction" as const, status: "approved" as const, proj: proj2.id, version: "1.0", daysBack: 40 },
    { code: "FRM-2025-001", title: "Formulário de Registro de Incidentes", type: "form" as const, status: "approved" as const, proj: proj1.id, version: "1.0", daysBack: 95 },
    { code: "REG-2025-001", title: "Registro de Análise Crítica pela Direção", type: "record" as const, status: "draft" as const, proj: proj2.id, version: "1.0", daysBack: 20 },
  ];

  const docs = [];
  for (const d of docData) {
    const doc = await prisma.document.create({
      data: {
        tenantId: T, projectId: d.proj, code: d.code, title: d.title,
        type: d.type, status: d.status, version: d.version,
        authorId: userId, reviewerId: userId,
        nextReviewDate: futureDate(180),
        createdAt: daysAgo(d.daysBack),
      },
    });
    docs.push(doc);
  }

  // Document Versions
  await prisma.documentVersion.create({ data: { documentId: docs[0].id, version: "1.0", changedById: userId, changeNotes: "Versão inicial", createdAt: daysAgo(150) } });
  await prisma.documentVersion.create({ data: { documentId: docs[0].id, version: "2.0", changedById: userId, changeNotes: "Atualização conforme Anexo A 2022", createdAt: daysAgo(120) } });
  await prisma.documentVersion.create({ data: { documentId: docs[2].id, version: "1.0", changedById: userId, changeNotes: "Versão inicial aprovada", createdAt: daysAgo(100) } });
  await prisma.documentVersion.create({ data: { documentId: docs[4].id, version: "1.0", changedById: userId, changeNotes: "Versão inicial do procedimento de backup", createdAt: daysAgo(80) } });
  console.log("Documents: 8 + 4 versions created");

  // 12. Indicators (4) + Measurements (12)
  const ind1 = await prisma.indicator.create({
    data: { tenantId: T, projectId: proj1.id, name: "Taxa de Incidentes de Segurança", unit: "incidentes/mês", frequency: "monthly", target: 2 },
  });
  const ind2 = await prisma.indicator.create({
    data: { tenantId: T, projectId: proj1.id, name: "Conformidade de Controles Annex A", unit: "%", frequency: "quarterly", target: 80 },
  });
  const ind3 = await prisma.indicator.create({
    data: { tenantId: T, projectId: proj2.id, name: "Índice de Satisfação do Cliente", unit: "%", frequency: "monthly", target: 90 },
  });
  const ind4 = await prisma.indicator.create({
    data: { tenantId: T, projectId: proj2.id, name: "Taxa de Rejeição em Inspeção", unit: "%", frequency: "monthly", target: 3 },
  });

  // Measurements over last 6 months
  const measurementData = [
    { indId: ind1.id, values: [5, 3, 4, 2, 1, 2] },
    { indId: ind2.id, values: [35, 45, 55, 60, 68, 72] },
    { indId: ind3.id, values: [82, 85, 88, 87, 91, 93] },
    { indId: ind4.id, values: [8, 6, 5, 4, 3.5, 2.8] },
  ];

  for (const m of measurementData) {
    for (let i = 0; i < 6; i++) {
      const period = monthsAgo(5 - i, 1);
      await prisma.indicatorMeasurement.create({
        data: {
          tenantId: T, indicatorId: m.indId,
          value: m.values[i],
          period,
          createdAt: monthsAgo(5 - i, 5),
        },
      });
    }
  }
  console.log("Indicators: 4 + 24 measurements created");

  // 13. Management Reviews (2)
  await prisma.managementReview.create({
    data: {
      tenantId: T, projectId: proj1.id,
      scheduledDate: daysAgo(60), actualDate: daysAgo(58),
      status: "completed",
      minutes: "Análise dos resultados do SGSI no 1º semestre. Decisões tomadas sobre investimentos em segurança.",
      decisions: [
        { decision: "Aprovar orçamento para ferramenta SIEM", responsible: "Diretor de TI", deadline: "2025-09-30" },
        { decision: "Contratar pentest externo", responsible: "CISO", deadline: "2025-08-15" },
        { decision: "Revisar política de acesso remoto", responsible: "Equipe SI", deadline: "2025-07-31" },
      ],
    },
  });

  await prisma.managementReview.create({
    data: {
      tenantId: T, projectId: proj1.id,
      scheduledDate: futureDate(60),
      status: "scheduled",
    },
  });
  console.log("Management Reviews: 2 created");

  // 14. Processes (3)
  await prisma.process.create({
    data: { tenantId: T, projectId: proj1.id, code: "PCS-001", name: "Gestão de Incidentes de Segurança", responsibleId: userId, status: "active", category: "core" },
  });
  await prisma.process.create({
    data: { tenantId: T, projectId: proj1.id, code: "PCS-002", name: "Gestão de Acessos", responsibleId: userId, status: "active", category: "core" },
  });
  await prisma.process.create({
    data: { tenantId: T, projectId: proj2.id, code: "PCS-003", name: "Controle da Qualidade", responsibleId: userId, status: "active", category: "core" },
  });
  console.log("Processes: 3 created");

  // 15. Policies (4) + Acknowledgments
  const policies = [];
  const polData = [
    { proj: proj1.id, code: "PPOL-001", title: "Política de Segurança da Informação", status: "published", category: "security" },
    { proj: proj1.id, code: "PPOL-002", title: "Política de Uso Aceitável", status: "published", category: "security" },
    { proj: proj1.id, code: "PPOL-003", title: "Política de Privacidade", status: "draft", category: "privacy" },
    { proj: proj2.id, code: "PPOL-004", title: "Política da Qualidade", status: "published", category: "quality" },
  ];

  for (const p of polData) {
    const pol = await prisma.policy.create({
      data: {
        tenantId: T, projectId: p.proj, code: p.code, title: p.title,
        status: p.status, category: p.category, version: "1.0",
        authorId: userId,
        publishedAt: p.status === "published" ? daysAgo(30) : undefined,
        nextReviewDate: futureDate(365),
      },
    });
    policies.push(pol);
  }

  // Acknowledgments for published policies
  for (const pol of policies.filter((_, i) => polData[i].status === "published")) {
    await prisma.policyAcknowledgment.create({
      data: { tenantId: T, policyId: pol.id, userId },
    });
  }
  console.log("Policies: 4 + 3 acknowledgments created");

  // 16. Security Incidents (3)
  await prisma.securityIncident.create({
    data: {
      tenantId: T, projectId: proj1.id, code: "INC-2025-001",
      title: "Tentativa de phishing detectada", description: "Emails de phishing enviados a 5 colaboradores simulando suporte de TI",
      type: "phishing", severity: "medium", category: "confidentiality",
      detectedAt: daysAgo(45), reportedById: userId, status: "resolved",
      resolvedAt: daysAgo(43), containmentActions: "Bloqueio do remetente e exclusão dos emails",
      correctiveActions: "Treinamento emergencial sobre phishing", lessonsLearned: "Reforçar filtros de email e conscientização",
      createdAt: daysAgo(45),
    },
  });

  await prisma.securityIncident.create({
    data: {
      tenantId: T, projectId: proj1.id, code: "INC-2025-002",
      title: "Acesso indevido a pasta compartilhada", description: "Estagiário com acesso a pasta de RH contendo dados sensíveis",
      type: "unauthorized_access", severity: "high", category: "confidentiality",
      detectedAt: daysAgo(20), reportedById: userId, assignedToId: userId, status: "investigating",
      containmentActions: "Revogação imediata do acesso", createdAt: daysAgo(20),
    },
  });

  await prisma.securityIncident.create({
    data: {
      tenantId: T, projectId: proj1.id, code: "INC-2025-003",
      title: "Falha no backup semanal", description: "Backup agendado de sexta-feira falhou por falta de espaço em disco",
      type: "other", severity: "low", category: "availability",
      detectedAt: daysAgo(5), reportedById: userId, status: "reported",
      createdAt: daysAgo(5),
    },
  });
  console.log("Security Incidents: 3 created");

  // 17. Information Assets (4)
  await prisma.informationAsset.create({
    data: { tenantId: T, projectId: proj1.id, code: "AST-001", name: "Servidor de Aplicações Principal", type: "hardware", classification: "confidential", criticality: "critical", owner: "TI", location: "Data Center São Paulo", responsibleId: userId, status: "active" },
  });
  await prisma.informationAsset.create({
    data: { tenantId: T, projectId: proj1.id, code: "AST-002", name: "Sistema ERP", type: "software", classification: "confidential", criticality: "high", owner: "TI", location: "Cloud AWS", responsibleId: userId, status: "active" },
  });
  await prisma.informationAsset.create({
    data: { tenantId: T, projectId: proj1.id, code: "AST-003", name: "Base de Dados de Clientes", type: "data", classification: "restricted", criticality: "critical", owner: "Comercial", location: "RDS AWS", responsibleId: userId, status: "active" },
  });
  await prisma.informationAsset.create({
    data: { tenantId: T, projectId: proj1.id, code: "AST-004", name: "Serviço de Email (M365)", type: "service", classification: "internal", criticality: "high", owner: "TI", location: "Microsoft Cloud", responsibleId: userId, status: "active" },
  });
  console.log("Information Assets: 4 created");

  // 18. Suppliers (3) + Assessments
  const sup1 = await prisma.supplier.create({
    data: {
      tenantId: T, projectId: proj1.id, code: "SUP-001", name: "CloudTech Solutions",
      contactName: "Roberto Mendes", contactEmail: "roberto@cloudtech.com",
      type: "cloud_provider", category: "critical", riskLevel: "high",
      servicesProvided: "Infraestrutura em nuvem (IaaS)", dataAccess: "full",
      responsibleId: userId, status: "active",
      contractStartDate: monthsAgo(12, 1), contractEndDate: futureDate(365),
    },
  });

  const sup2 = await prisma.supplier.create({
    data: {
      tenantId: T, projectId: proj1.id, code: "SUP-002", name: "SecureNet Consulting",
      contactName: "Maria Santos", contactEmail: "maria@securenet.com",
      type: "consulting", category: "important", riskLevel: "medium",
      servicesProvided: "Consultoria em segurança e pentest", dataAccess: "limited",
      responsibleId: userId, status: "active",
    },
  });

  await prisma.supplier.create({
    data: {
      tenantId: T, projectId: proj2.id, code: "SUP-003", name: "Calibra Metrologia",
      contactName: "José Ferreira", contactEmail: "jose@calibra.com.br",
      type: "consulting", category: "standard", riskLevel: "low",
      servicesProvided: "Calibração de instrumentos de medição", dataAccess: "none",
      responsibleId: userId, status: "active",
    },
  });

  // Supplier Assessments
  await prisma.supplierAssessment.create({
    data: { tenantId: T, supplierId: sup1.id, assessmentDate: daysAgo(60), assessorId: userId, overallScore: 85, securityScore: 82, complianceScore: 90, serviceScore: 83, findings: "SLA cumprido em 98% dos meses", status: "completed" },
  });
  await prisma.supplierAssessment.create({
    data: { tenantId: T, supplierId: sup2.id, assessmentDate: daysAgo(30), assessorId: userId, overallScore: 92, securityScore: 95, complianceScore: 90, serviceScore: 91, findings: "Excelente qualidade técnica", status: "completed" },
  });
  console.log("Suppliers: 3 + 2 assessments created");

  // 19. Change Requests (3)
  await prisma.changeRequest.create({
    data: {
      tenantId: T, projectId: proj1.id, code: "CHG-2025-001",
      title: "Migração de firewall para next-gen", type: "technology",
      description: "Substituição do firewall atual por solução next-generation com IPS",
      reason: "Requisito de segurança A.8.20 e A.8.22", priority: "high",
      requestedById: userId, status: "approved", approvedAt: daysAgo(10),
      impactAnalysis: "Janela de manutenção de 4h necessária",
    },
  });

  await prisma.changeRequest.create({
    data: {
      tenantId: T, projectId: proj1.id, code: "CHG-2025-002",
      title: "Implementação de MFA para todos os sistemas", type: "technology",
      description: "Autenticação multifator obrigatória para acesso a sistemas críticos",
      reason: "Controle A.8.5 - Autenticação segura", priority: "high",
      requestedById: userId, status: "in_progress",
    },
  });

  await prisma.changeRequest.create({
    data: {
      tenantId: T, projectId: proj2.id, code: "CHG-2025-003",
      title: "Reestruturação do layout produtivo", type: "process",
      description: "Reorganização do chão de fábrica para otimizar fluxo de produção",
      reason: "Melhoria de eficiência operacional", priority: "medium",
      requestedById: userId, status: "requested",
    },
  });
  console.log("Change Requests: 3 created");

  // 20. Awareness Campaigns (2) + Participants
  const campaign1 = await prisma.awarenessCampaign.create({
    data: {
      tenantId: T, projectId: proj1.id, code: "AWR-2025-001",
      title: "Conscientização em Segurança da Informação", type: "training",
      description: "Treinamento obrigatório para todos os colaboradores sobre práticas de segurança",
      targetAudience: "Todos os colaboradores", startDate: daysAgo(30),
      endDate: daysAgo(28), duration: 120, location: "Auditório principal",
      instructor: "Especialista SI", status: "completed", completionRate: 92,
      responsibleId: userId,
    },
  });

  const campaign2 = await prisma.awarenessCampaign.create({
    data: {
      tenantId: T, projectId: proj1.id, code: "AWR-2025-002",
      title: "Workshop Anti-Phishing", type: "workshop",
      description: "Workshop prático sobre identificação de emails de phishing",
      targetAudience: "Equipe administrativa", startDate: futureDate(15),
      duration: 60, status: "planned", responsibleId: userId,
    },
  });

  await prisma.awarenessParticipant.create({ data: { tenantId: T, campaignId: campaign1.id, userId, attended: true, completedAt: daysAgo(28), score: 95, status: "completed" } });
  await prisma.awarenessParticipant.create({ data: { tenantId: T, campaignId: campaign2.id, userId, status: "invited" } });
  console.log("Awareness Campaigns: 2 + 2 participants created");

  // 21. Communication Plans (2)
  await prisma.communicationPlan.create({
    data: {
      tenantId: T, projectId: proj1.id,
      topic: "Resultados de auditoria interna",
      audience: "Alta direção e gestores de área",
      frequency: "Após cada ciclo de auditoria",
      method: "Reunião presencial + relatório por email",
      responsibleId: userId, status: "active",
    },
  });

  await prisma.communicationPlan.create({
    data: {
      tenantId: T, projectId: proj1.id,
      topic: "Alertas de incidentes de segurança",
      audience: "Todos os colaboradores",
      frequency: "Conforme ocorrência",
      method: "Email corporativo + intranet",
      responsibleId: userId, status: "active",
    },
  });
  console.log("Communication Plans: 2 created");

  // 22. Competences (3)
  await prisma.competence.create({
    data: {
      tenantId: T, projectId: proj1.id, role: "Analista de Segurança",
      requiredCompetence: "Conhecimento em ISO 27001, análise de vulnerabilidades e gestão de incidentes",
      currentLevel: "intermediate", trainingAction: "Certificação ISO 27001 Lead Implementer",
      trainingType: "external", responsibleId: userId, status: "in_progress",
      dueDate: futureDate(90),
    },
  });

  await prisma.competence.create({
    data: {
      tenantId: T, projectId: proj1.id, role: "DPO",
      requiredCompetence: "LGPD, ISO 27701, gestão de privacidade",
      currentLevel: "basic", trainingAction: "Curso de DPO certificado",
      trainingType: "external", responsibleId: userId, status: "identified",
      dueDate: futureDate(120),
    },
  });

  await prisma.competence.create({
    data: {
      tenantId: T, projectId: proj2.id, role: "Auditor Interno da Qualidade",
      requiredCompetence: "ISO 9001, técnicas de auditoria, ISO 19011",
      currentLevel: "advanced", trainingAction: "Reciclagem em ISO 19011:2018",
      trainingType: "internal", responsibleId: userId, status: "completed",
      completedAt: daysAgo(15),
    },
  });
  console.log("Competences: 3 created");

  // 23. Security Objectives (2)
  await prisma.securityObjective.create({
    data: {
      tenantId: T, projectId: proj1.id, code: "OBJ-001",
      title: "Reduzir incidentes de segurança em 50%",
      description: "Reduzir o número de incidentes de segurança para no máximo 2/mês até dezembro",
      category: "operational", targetValue: 2, targetUnit: "incidentes/mês",
      currentValue: 3, responsibleId: userId, status: "in_progress",
      measurable: true, monitoringFrequency: "monthly",
      deadline: futureDate(120),
    },
  });

  await prisma.securityObjective.create({
    data: {
      tenantId: T, projectId: proj1.id, code: "OBJ-002",
      title: "Atingir 80% de conformidade dos controles",
      description: "Implementar ao menos 80% dos controles aplicáveis do Anexo A da ISO 27001",
      category: "compliance", targetValue: 80, targetUnit: "%",
      currentValue: 72, responsibleId: userId, status: "in_progress",
      measurable: true, monitoringFrequency: "quarterly",
      deadline: futureDate(180),
    },
  });
  console.log("Security Objectives: 2 created");

  // 24. SGSI Scope (1)
  await prisma.sgsiScope.create({
    data: {
      tenantId: T, projectId: proj1.id,
      title: "Escopo do SGSI - TechCorp S.A.",
      description: "O SGSI abrange todos os processos de TI e desenvolvimento de software da TechCorp S.A.",
      boundaries: "Sede São Paulo, escritório remoto, infraestrutura cloud AWS",
      exclusions: "Processos de RH e financeiro (escopo futuro)",
      justification: "Foco inicial nos processos de maior risco conforme análise de contexto",
      interfaces: "Clientes externos, fornecedores de TI, órgãos reguladores",
      status: "approved", approvedById: userId, approvedAt: daysAgo(100),
      version: "1.0",
    },
  });
  console.log("SGSI Scope: 1 created");

  // 25. Organization Contexts (2 SWOT)
  const swotData = [
    { type: "strength", title: "Equipe técnica qualificada", desc: "Time de TI com certificações de mercado", cat: "human_resources", impact: "high" },
    { type: "weakness", title: "Processos manuais de SI", desc: "Muitos controles de segurança dependem de processos manuais", cat: "technological", impact: "high" },
    { type: "opportunity", title: "Expansão para mercado regulado", desc: "Clientes do setor financeiro exigem ISO 27001", cat: "market", impact: "high" },
    { type: "threat", title: "Aumento de ataques cibernéticos", desc: "Crescimento de 40% nos ataques ao setor em 2024", cat: "technological", impact: "high" },
  ];

  for (const s of swotData) {
    await prisma.organizationContext.create({
      data: { tenantId: T, projectId: proj1.id, type: s.type, title: s.title, description: s.desc, category: s.cat, impact: s.impact },
    });
  }
  console.log("Organization Contexts: 4 SWOT items created");

  // 26. Interested Parties (3)
  await prisma.interestedParty.create({
    data: {
      tenantId: T, projectId: proj1.id, name: "Clientes corporativos", type: "external",
      category: "customer", needsExpectations: "Proteção de dados e disponibilidade de serviços",
      requirements: "SLA 99.9%, conformidade LGPD, relatórios de segurança",
      influence: "high", interest: "high", strategy: "manage_closely",
    },
  });

  await prisma.interestedParty.create({
    data: {
      tenantId: T, projectId: proj1.id, name: "ANPD - Autoridade Nacional de Proteção de Dados", type: "external",
      category: "regulator", needsExpectations: "Conformidade com LGPD",
      requirements: "Relatório de impacto, DPO nomeado, notificação de incidentes",
      influence: "high", interest: "medium", strategy: "keep_satisfied",
    },
  });

  await prisma.interestedParty.create({
    data: {
      tenantId: T, projectId: proj1.id, name: "Colaboradores", type: "internal",
      category: "employee", needsExpectations: "Ambiente de trabalho seguro e treinamento",
      requirements: "Conscientização em SI, canais de comunicação, proteção de dados pessoais",
      influence: "medium", interest: "medium", strategy: "keep_informed",
    },
  });
  console.log("Interested Parties: 3 created");

  // 27. Notifications (10)
  const notifData = [
    { type: "nc_assigned", title: "NC Atribuída: NC-2025-001", msg: "Você foi designado responsável pela NC 'Ausência de política de senhas'", entity: "nonconformity", daysBack: 130 },
    { type: "nc_assigned", title: "NC Atribuída: NC-2025-004", msg: "Você foi designado responsável pela NC 'Calibração de instrumentos vencida'", entity: "nonconformity", daysBack: 55 },
    { type: "audit_scheduled", title: "Auditoria Agendada", msg: "Auditoria Interna SGSI - Ciclo 1 agendada para as próximas semanas", entity: "audit", daysBack: 95 },
    { type: "document_review", title: "Documento para Revisão", msg: "O documento 'Política de Privacidade' está aguardando sua revisão", entity: "document", daysBack: 60 },
    { type: "risk_critical", title: "Risco Crítico Identificado", msg: "Risco 'Acesso não autorizado a sistemas críticos' classificado como crítico", entity: "risk", daysBack: 150 },
    { type: "action_assigned", title: "Ação Atribuída: AP-2025-001", msg: "Você é responsável pela ação 'Elaborar política de senhas'", entity: "actionPlan", daysBack: 125 },
    { type: "nc_status_changed", title: "NC Status Alterado", msg: "NC-2025-003 foi encerrada como resolvida", entity: "nonconformity", daysBack: 60, read: true },
    { type: "audit_scheduled", title: "Pré-auditoria Agendada", msg: "Pré-auditoria de Certificação SGQ agendada", entity: "audit", daysBack: 3 },
    { type: "action_assigned", title: "Ação Atribuída: AP-2025-005", msg: "Você é responsável pela ação 'Recalibrar instrumentos vencidos'", entity: "actionPlan", daysBack: 50 },
    { type: "risk_critical", title: "Risco Alto: Vazamento de Dados", msg: "Risco de vazamento de dados pessoais classificado como alto", entity: "risk", daysBack: 140 },
  ];

  for (const n of notifData) {
    await prisma.notification.create({
      data: {
        tenantId: T, userId, type: n.type, title: n.title, message: n.msg,
        entityType: n.entity,
        readAt: "read" in n ? daysAgo(n.daysBack - 1) : undefined,
        createdAt: daysAgo(n.daysBack),
      },
    });
  }
  console.log("Notifications: 10 created");

  console.log("\n==================== DEMO SEED COMPLETE ====================");
  console.log("Tenant: demo (PowerConsult Demonstração)");
  console.log("Total records: ~200+");
  console.log("Login and visit: /demo/dashboard");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
