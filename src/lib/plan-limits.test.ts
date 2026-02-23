import { describe, it, expect } from "vitest";
import { DEFAULT_PLANS, UNLIMITED, hasFeature, type PlanLimits } from "./plan-limits";

describe("DEFAULT_PLANS", () => {
  it("defines starter, professional, and enterprise plans", () => {
    expect(DEFAULT_PLANS).toHaveProperty("starter");
    expect(DEFAULT_PLANS).toHaveProperty("professional");
    expect(DEFAULT_PLANS).toHaveProperty("enterprise");
  });

  describe("starter", () => {
    const plan = DEFAULT_PLANS.starter;

    it("has correct limits", () => {
      expect(plan.maxUsers).toBe(3);
      expect(plan.maxProjects).toBe(3);
      expect(plan.maxStandards).toBe(1);
      expect(plan.maxStorage).toBe(2048);
      expect(plan.maxClients).toBe(3);
    });

    it("has basic features enabled", () => {
      expect(plan.features.audits).toBe(true);
      expect(plan.features.nonconformities).toBe(true);
      expect(plan.features.actionPlans).toBe(true);
      expect(plan.features.documents).toBe(true);
    });

    it("has advanced features disabled", () => {
      expect(plan.features.indicators).toBe(false);
      expect(plan.features.risks).toBe(false);
      expect(plan.features.soa).toBe(false);
      expect(plan.features.managementReview).toBe(false);
      expect(plan.features.customReports).toBe(false);
      expect(plan.features.apiAccess).toBe(false);
    });
  });

  describe("professional", () => {
    const plan = DEFAULT_PLANS.professional;

    it("has higher limits than starter", () => {
      expect(plan.maxUsers).toBeGreaterThan(DEFAULT_PLANS.starter.maxUsers);
      expect(plan.maxProjects).toBeGreaterThan(DEFAULT_PLANS.starter.maxProjects);
    });

    it("has most features enabled except apiAccess", () => {
      expect(plan.features.indicators).toBe(true);
      expect(plan.features.risks).toBe(true);
      expect(plan.features.soa).toBe(true);
      expect(plan.features.managementReview).toBe(true);
      expect(plan.features.customReports).toBe(true);
      expect(plan.features.apiAccess).toBe(false);
    });
  });

  describe("enterprise", () => {
    const plan = DEFAULT_PLANS.enterprise;

    it("has unlimited resources", () => {
      expect(plan.maxUsers).toBe(UNLIMITED);
      expect(plan.maxProjects).toBe(UNLIMITED);
      expect(plan.maxStandards).toBe(UNLIMITED);
      expect(plan.maxStorage).toBe(UNLIMITED);
      expect(plan.maxClients).toBe(UNLIMITED);
    });

    it("has all features enabled", () => {
      Object.values(plan.features).forEach((enabled) => {
        expect(enabled).toBe(true);
      });
    });
  });
});

describe("hasFeature", () => {
  const mockPlan: PlanLimits = {
    maxUsers: 10,
    maxProjects: 10,
    maxStandards: 3,
    maxStorage: 10240,
    maxClients: 10,
    features: {
      audits: true,
      risks: true,
      apiAccess: false,
    },
  };

  it("returns true for enabled features", () => {
    expect(hasFeature(mockPlan, "audits")).toBe(true);
    expect(hasFeature(mockPlan, "risks")).toBe(true);
  });

  it("returns false for disabled features", () => {
    expect(hasFeature(mockPlan, "apiAccess")).toBe(false);
  });

  it("returns false for non-existent features", () => {
    expect(hasFeature(mockPlan, "nonExistentFeature")).toBe(false);
  });

  it("returns false when plan is null", () => {
    expect(hasFeature(null, "audits")).toBe(false);
  });
});

describe("UNLIMITED constant", () => {
  it("is 999999", () => {
    expect(UNLIMITED).toBe(999999);
  });
});
