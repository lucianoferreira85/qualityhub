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

  it("returns false for unknown role", () => {
    // @ts-expect-error testing invalid role
    expect(hasPermission("unknown_role", "project", "read")).toBe(false);
  });
});
