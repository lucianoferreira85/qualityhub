import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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
