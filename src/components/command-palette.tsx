"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { Command } from "cmdk";
import {
  LayoutDashboard,
  FolderKanban,
  Building2,
  AlertTriangle,
  ClipboardCheck,
  ShieldAlert,
  Search as SearchIcon,
  FileText,
  TrendingUp,
  Cog,
  BookOpen,
  Settings,
  Plus,
  Moon,
  Sun,
  Bell,
  User,
  LogOut,
  ExternalLink,
} from "lucide-react";
import { useTenant } from "@/hooks/use-tenant";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";
import { useCmdK } from "@/hooks/use-hotkeys";

interface CommandItem {
  label: string;
  icon: React.ElementType;
  action: () => void;
  keywords?: string;
}

export function openCommandPalette() {
  document.dispatchEvent(new CustomEvent("open-command-palette"));
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { tenant } = useTenant();
  const { signOut } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const basePath = `/${tenant.slug}`;

  useCmdK(useCallback(() => setOpen((o) => !o), []));

  useEffect(() => {
    function onOpen() {
      setOpen(true);
    }
    document.addEventListener("open-command-palette", onOpen);
    return () => document.removeEventListener("open-command-palette", onOpen);
  }, []);

  function navigate(path: string) {
    router.push(`${basePath}${path}`);
    setOpen(false);
  }

  const pages: CommandItem[] = [
    { label: "Dashboard", icon: LayoutDashboard, action: () => navigate("/dashboard"), keywords: "inicio home" },
    { label: "Projetos", icon: FolderKanban, action: () => navigate("/projects"), keywords: "iso projeto" },
    { label: "Clientes", icon: Building2, action: () => navigate("/clients"), keywords: "cliente empresa" },
    { label: "Nao Conformidades", icon: AlertTriangle, action: () => navigate("/nonconformities"), keywords: "nc nao conformidade" },
    { label: "Planos de Acao", icon: ClipboardCheck, action: () => navigate("/action-plans"), keywords: "acao plano corretiva" },
    { label: "Riscos", icon: ShieldAlert, action: () => navigate("/risks"), keywords: "risco ameaca" },
    { label: "Auditorias", icon: SearchIcon, action: () => navigate("/audits"), keywords: "auditoria interna externa" },
    { label: "Documentos", icon: FileText, action: () => navigate("/documents"), keywords: "documento politica procedimento" },
    { label: "Processos", icon: Cog, action: () => navigate("/processes"), keywords: "processo mapeamento" },
    { label: "Indicadores", icon: TrendingUp, action: () => navigate("/indicators"), keywords: "indicador kpi meta" },
    { label: "Analise Critica", icon: BookOpen, action: () => navigate("/management-reviews"), keywords: "analise critica direcao" },
    { label: "Configuracoes", icon: Settings, action: () => navigate("/settings"), keywords: "config preferencia" },
    { label: "Notificacoes", icon: Bell, action: () => navigate("/notifications"), keywords: "notificacao alerta aviso" },
  ];

  const quickActions: CommandItem[] = [
    { label: "Novo Projeto", icon: Plus, action: () => navigate("/projects/new"), keywords: "criar projeto novo" },
    { label: "Nova Nao Conformidade", icon: Plus, action: () => navigate("/nonconformities/new"), keywords: "criar nc nova" },
    { label: "Novo Risco", icon: Plus, action: () => navigate("/risks/new"), keywords: "criar risco novo" },
    { label: "Nova Auditoria", icon: Plus, action: () => navigate("/audits/new"), keywords: "criar auditoria nova" },
    { label: "Novo Plano de Acao", icon: Plus, action: () => navigate("/action-plans/new"), keywords: "criar plano acao novo" },
    { label: "Novo Documento", icon: Plus, action: () => navigate("/documents/new"), keywords: "criar documento novo" },
    { label: "Novo Indicador", icon: Plus, action: () => navigate("/indicators/new"), keywords: "criar indicador novo kpi" },
    { label: "Novo Cliente", icon: Plus, action: () => navigate("/clients/new"), keywords: "criar cliente novo" },
    { label: "Novo Processo", icon: Plus, action: () => navigate("/processes/new"), keywords: "criar processo novo" },
    { label: "Nova Analise Critica", icon: Plus, action: () => navigate("/management-reviews/new"), keywords: "criar analise critica nova" },
  ];

  const utilActions: CommandItem[] = [
    { label: "Meu Perfil", icon: User, action: () => { router.push("/profile"); setOpen(false); }, keywords: "perfil conta usuario" },
    { label: "Trocar Empresa", icon: ExternalLink, action: () => { router.push("/organizations"); setOpen(false); }, keywords: "trocar empresa organizacao tenant" },
    {
      label: "Sair",
      icon: LogOut,
      action: () => { signOut(); setOpen(false); },
      keywords: "sair logout desconectar",
    },
  ];

  const groupHeadingClass = "[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-foreground-tertiary [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.08em]";
  const itemClass = "flex items-center gap-3 px-2.5 py-2 rounded-button text-body-2 text-foreground-secondary cursor-pointer data-[selected=true]:bg-surface-tertiary data-[selected=true]:text-foreground-primary transition-all duration-120";

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm animate-fade-in" />
        <Dialog.Content
          className="fixed left-1/2 top-[20%] z-50 w-full max-w-lg -translate-x-1/2 rounded-xl bg-surface-elevated border border-stroke-secondary shadow-dialog animate-scale-in"
          aria-label="Busca global e comandos"
        >
          <Command className="flex flex-col" loop>
            <div className="flex items-center border-b border-stroke-secondary px-4">
              <SearchIcon className="h-4 w-4 text-foreground-tertiary flex-shrink-0" />
              <Command.Input
                placeholder="Buscar paginas, acoes..."
                className="flex-1 h-12 bg-transparent px-3 text-body-1 text-foreground-primary placeholder:text-foreground-tertiary outline-none"
              />
              <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded-badge border border-stroke-secondary bg-surface-tertiary px-1.5 text-[10px] font-medium text-foreground-tertiary">
                ESC
              </kbd>
            </div>

            <Command.List className="max-h-[320px] overflow-y-auto p-2">
              <Command.Empty className="py-8 text-center text-body-2 text-foreground-tertiary">
                Nenhum resultado encontrado.
              </Command.Empty>

              <Command.Group heading="Paginas" className={groupHeadingClass}>
                {pages.map((item) => (
                  <Command.Item
                    key={item.label}
                    value={`${item.label} ${item.keywords || ""}`}
                    onSelect={item.action}
                    className={itemClass}
                  >
                    <item.icon className="h-4 w-4 flex-shrink-0 text-foreground-tertiary" />
                    <span>{item.label}</span>
                  </Command.Item>
                ))}
              </Command.Group>

              <Command.Separator className="my-1.5 h-px bg-stroke-secondary" />

              <Command.Group heading="Acoes Rapidas" className={groupHeadingClass}>
                {quickActions.map((item) => (
                  <Command.Item
                    key={item.label}
                    value={`${item.label} ${item.keywords || ""}`}
                    onSelect={item.action}
                    className={itemClass}
                  >
                    <item.icon className="h-4 w-4 flex-shrink-0 text-brand" />
                    <span>{item.label}</span>
                  </Command.Item>
                ))}
              </Command.Group>

              <Command.Separator className="my-1.5 h-px bg-stroke-secondary" />

              <Command.Group heading="Conta" className={groupHeadingClass}>
                {utilActions.map((item) => (
                  <Command.Item
                    key={item.label}
                    value={`${item.label} ${item.keywords || ""}`}
                    onSelect={item.action}
                    className={itemClass}
                  >
                    <item.icon className="h-4 w-4 flex-shrink-0 text-foreground-tertiary" />
                    <span>{item.label}</span>
                  </Command.Item>
                ))}
              </Command.Group>

              <Command.Separator className="my-1.5 h-px bg-stroke-secondary" />

              <Command.Group heading="Tema" className={groupHeadingClass}>
                <Command.Item
                  value="alternar tema dark mode claro escuro"
                  onSelect={() => {
                    toggleTheme();
                    setOpen(false);
                  }}
                  className={itemClass}
                >
                  {isDark ? <Sun className="h-4 w-4 flex-shrink-0 text-foreground-tertiary" /> : <Moon className="h-4 w-4 flex-shrink-0 text-foreground-tertiary" />}
                  <span>{isDark ? "Modo Claro" : "Modo Escuro"}</span>
                </Command.Item>
              </Command.Group>
            </Command.List>
          </Command>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
