import { describe, it, expect } from "vitest";
import {
  hasPermission,
  isAdmin,
  isManager,
  isConsultant,
  isAuditor,
  isViewer,
  canCreate,
  canRead,
  canUpdate,
  canDelete,
} from "./permissions";

describe("Role checks", () => {
  describe("isAdmin", () => {
    it("returns true for tenant_admin", () => {
      expect(isAdmin("tenant_admin")).toBe(true);
    });
    it("returns false for other roles", () => {
      expect(isAdmin("project_manager")).toBe(false);
      expect(isAdmin("client_viewer")).toBe(false);
    });
  });

  describe("isManager", () => {
    it("returns true for admin and project_manager", () => {
      expect(isManager("tenant_admin")).toBe(true);
      expect(isManager("project_manager")).toBe(true);
    });
    it("returns false for non-managers", () => {
      expect(isManager("junior_consultant")).toBe(false);
      expect(isManager("client_viewer")).toBe(false);
    });
  });

  describe("isConsultant", () => {
    it("returns true for consultants and PM", () => {
      expect(isConsultant("senior_consultant")).toBe(true);
      expect(isConsultant("junior_consultant")).toBe(true);
      expect(isConsultant("project_manager")).toBe(true);
    });
    it("returns false for non-consultants", () => {
      expect(isConsultant("client_viewer")).toBe(false);
      expect(isConsultant("internal_auditor")).toBe(false);
    });
  });

  describe("isAuditor", () => {
    it("returns true for auditors", () => {
      expect(isAuditor("internal_auditor")).toBe(true);
      expect(isAuditor("external_auditor")).toBe(true);
    });
    it("returns false for non-auditors", () => {
      expect(isAuditor("tenant_admin")).toBe(false);
    });
  });

  describe("isViewer", () => {
    it("returns true for viewers", () => {
      expect(isViewer("client_viewer")).toBe(true);
      expect(isViewer("external_auditor")).toBe(true);
    });
    it("returns false for non-viewers", () => {
      expect(isViewer("tenant_admin")).toBe(false);
    });
  });
});

describe("hasPermission", () => {
  describe("tenant_admin", () => {
    it("can do everything on projects", () => {
      expect(hasPermission("tenant_admin", "project", "create")).toBe(true);
      expect(hasPermission("tenant_admin", "project", "read")).toBe(true);
      expect(hasPermission("tenant_admin", "project", "update")).toBe(true);
      expect(hasPermission("tenant_admin", "project", "delete")).toBe(true);
    });

    it("can manage billing", () => {
      expect(hasPermission("tenant_admin", "billing", "read")).toBe(true);
      expect(hasPermission("tenant_admin", "billing", "update")).toBe(true);
    });

    it("can manage members", () => {
      expect(hasPermission("tenant_admin", "member", "create")).toBe(true);
      expect(hasPermission("tenant_admin", "member", "delete")).toBe(true);
    });
  });

  describe("client_viewer", () => {
    it("can read projects and documents", () => {
      expect(hasPermission("client_viewer", "project", "read")).toBe(true);
      expect(hasPermission("client_viewer", "document", "read")).toBe(true);
    });

    it("cannot create or delete", () => {
      expect(hasPermission("client_viewer", "project", "create")).toBe(false);
      expect(hasPermission("client_viewer", "document", "create")).toBe(false);
      expect(hasPermission("client_viewer", "project", "delete")).toBe(false);
    });
  });

  describe("project_manager", () => {
    it("can CRU (not delete) on projects", () => {
      expect(canCreate("project_manager", "project")).toBe(true);
      expect(canRead("project_manager", "project")).toBe(true);
      expect(canUpdate("project_manager", "project")).toBe(true);
      expect(canDelete("project_manager", "project")).toBe(false);
    });

    it("cannot manage billing", () => {
      expect(hasPermission("project_manager", "billing", "update")).toBe(false);
    });
  });

  describe("senior_consultant", () => {
    it("can CRU risks, action plans, NCs, documents", () => {
      expect(canCreate("senior_consultant", "risk")).toBe(true);
      expect(canRead("senior_consultant", "risk")).toBe(true);
      expect(canUpdate("senior_consultant", "risk")).toBe(true);
      expect(canCreate("senior_consultant", "actionPlan")).toBe(true);
      expect(canCreate("senior_consultant", "nonconformity")).toBe(true);
      expect(canCreate("senior_consultant", "document")).toBe(true);
    });

    it("can only read projects and audits", () => {
      expect(canRead("senior_consultant", "project")).toBe(true);
      expect(canCreate("senior_consultant", "project")).toBe(false);
      expect(canRead("senior_consultant", "audit")).toBe(true);
      expect(canCreate("senior_consultant", "audit")).toBe(false);
    });

    it("can only read management reviews", () => {
      expect(canRead("senior_consultant", "managementReview")).toBe(true);
      expect(canCreate("senior_consultant", "managementReview")).toBe(false);
    });

    it("cannot delete anything", () => {
      expect(canDelete("senior_consultant", "risk")).toBe(false);
      expect(canDelete("senior_consultant", "document")).toBe(false);
      expect(canDelete("senior_consultant", "nonconformity")).toBe(false);
    });

    it("cannot access billing", () => {
      expect(hasPermission("senior_consultant", "billing", "read")).toBe(false);
    });
  });

  describe("junior_consultant", () => {
    it("can read and update risks/NCs/action plans but not create", () => {
      expect(canRead("junior_consultant", "risk")).toBe(true);
      expect(canUpdate("junior_consultant", "risk")).toBe(true);
      expect(canCreate("junior_consultant", "risk")).toBe(false);
      expect(canRead("junior_consultant", "nonconformity")).toBe(true);
      expect(canUpdate("junior_consultant", "nonconformity")).toBe(true);
      expect(canCreate("junior_consultant", "nonconformity")).toBe(false);
    });

    it("can only read indicators, projects, audits", () => {
      expect(canRead("junior_consultant", "indicator")).toBe(true);
      expect(canCreate("junior_consultant", "indicator")).toBe(false);
      expect(canRead("junior_consultant", "project")).toBe(true);
      expect(canRead("junior_consultant", "audit")).toBe(true);
    });

    it("cannot access billing or settings", () => {
      expect(hasPermission("junior_consultant", "billing", "read")).toBe(false);
      expect(hasPermission("junior_consultant", "settings", "read")).toBe(false);
    });

    it("cannot delete anything", () => {
      expect(canDelete("junior_consultant", "document")).toBe(false);
      expect(canDelete("junior_consultant", "risk")).toBe(false);
    });
  });

  describe("internal_auditor", () => {
    it("can CRU audits and audit findings", () => {
      expect(canCreate("internal_auditor", "audit")).toBe(true);
      expect(canRead("internal_auditor", "audit")).toBe(true);
      expect(canUpdate("internal_auditor", "audit")).toBe(true);
      expect(canDelete("internal_auditor", "audit")).toBe(false);
      expect(canCreate("internal_auditor", "auditFinding")).toBe(true);
      expect(canUpdate("internal_auditor", "auditFinding")).toBe(true);
    });

    it("can create and read NCs", () => {
      expect(canCreate("internal_auditor", "nonconformity")).toBe(true);
      expect(canRead("internal_auditor", "nonconformity")).toBe(true);
      expect(canUpdate("internal_auditor", "nonconformity")).toBe(false);
    });

    it("can only read risks, documents, indicators", () => {
      expect(canRead("internal_auditor", "risk")).toBe(true);
      expect(canCreate("internal_auditor", "risk")).toBe(false);
      expect(canRead("internal_auditor", "document")).toBe(true);
      expect(canCreate("internal_auditor", "document")).toBe(false);
    });

    it("cannot access billing or settings", () => {
      expect(hasPermission("internal_auditor", "billing", "read")).toBe(false);
      expect(hasPermission("internal_auditor", "settings", "read")).toBe(false);
    });
  });

  describe("external_auditor", () => {
    it("can only read all resources", () => {
      expect(canRead("external_auditor", "audit")).toBe(true);
      expect(canRead("external_auditor", "nonconformity")).toBe(true);
      expect(canRead("external_auditor", "risk")).toBe(true);
      expect(canRead("external_auditor", "document")).toBe(true);
      expect(canRead("external_auditor", "managementReview")).toBe(true);
    });

    it("cannot create, update or delete anything", () => {
      expect(canCreate("external_auditor", "audit")).toBe(false);
      expect(canUpdate("external_auditor", "audit")).toBe(false);
      expect(canDelete("external_auditor", "audit")).toBe(false);
      expect(canCreate("external_auditor", "nonconformity")).toBe(false);
    });

    it("cannot access billing, settings, members, clients", () => {
      expect(hasPermission("external_auditor", "billing", "read")).toBe(false);
      expect(hasPermission("external_auditor", "settings", "read")).toBe(false);
      expect(hasPermission("external_auditor", "member", "read")).toBe(false);
      expect(hasPermission("external_auditor", "client", "read")).toBe(false);
    });
  });

  it("returns false for unknown role", () => {
    // @ts-expect-error testing invalid role
    expect(hasPermission("unknown_role", "project", "read")).toBe(false);
  });
});
