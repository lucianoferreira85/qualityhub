import { describe, it, expect } from "vitest";
import {
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  PlanLimitError,
  ValidationError,
  handleApiError,
  parsePaginationParams,
} from "./api-helpers";

describe("Error Classes", () => {
  describe("UnauthorizedError", () => {
    it("has correct name and default message", () => {
      const err = new UnauthorizedError();
      expect(err.name).toBe("UnauthorizedError");
      expect(err.message).toBe("Não autorizado");
    });

    it("accepts custom message", () => {
      const err = new UnauthorizedError("Token expirado");
      expect(err.message).toBe("Token expirado");
    });
  });

  describe("ForbiddenError", () => {
    it("has correct name and default message", () => {
      const err = new ForbiddenError();
      expect(err.name).toBe("ForbiddenError");
      expect(err.message).toBe("Acesso negado");
    });
  });

  describe("NotFoundError", () => {
    it("has correct name and formatted message", () => {
      const err = new NotFoundError("Projeto");
      expect(err.name).toBe("NotFoundError");
      expect(err.message).toBe("Projeto não encontrado");
    });

    it("uses default entity when not specified", () => {
      const err = new NotFoundError();
      expect(err.message).toBe("Recurso não encontrado");
    });
  });

  describe("PlanLimitError", () => {
    it("has correct name and limit info", () => {
      const err = new PlanLimitError("projects", 3, 3);
      expect(err.name).toBe("PlanLimitError");
      expect(err.resource).toBe("projects");
      expect(err.current).toBe(3);
      expect(err.limit).toBe(3);
      expect(err.message).toContain("3/3");
    });
  });

  describe("ValidationError", () => {
    it("has correct name and errors dict", () => {
      const errors = { title: ["Campo obrigatório"], email: ["Email inválido"] };
      const err = new ValidationError(errors);
      expect(err.name).toBe("ValidationError");
      expect(err.errors).toEqual(errors);
    });
  });
});

describe("handleApiError", () => {
  it("returns 401 for UnauthorizedError", async () => {
    const res = handleApiError(new UnauthorizedError());
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Não autorizado");
  });

  it("returns 403 for ForbiddenError", async () => {
    const res = handleApiError(new ForbiddenError());
    expect(res.status).toBe(403);
  });

  it("returns 404 for NotFoundError", async () => {
    const res = handleApiError(new NotFoundError("Auditoria"));
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toContain("Auditoria");
  });

  it("returns 402 for PlanLimitError with resource info", async () => {
    const res = handleApiError(new PlanLimitError("users", 10, 10));
    expect(res.status).toBe(402);
    const body = await res.json();
    expect(body.resource).toBe("users");
    expect(body.current).toBe(10);
    expect(body.limit).toBe(10);
  });

  it("returns 422 for ValidationError with details", async () => {
    const errors = { name: ["Obrigatório"] };
    const res = handleApiError(new ValidationError(errors));
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.details).toEqual(errors);
  });

  it("returns 500 for unknown errors", async () => {
    const res = handleApiError(new Error("something broke"));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("Erro interno do servidor");
  });

  it("returns 500 for non-Error objects", async () => {
    const res = handleApiError("string error");
    expect(res.status).toBe(500);
  });
});

describe("parsePaginationParams", () => {
  const makeUrl = (params: string) =>
    new URL(`http://localhost:3000/api/test?${params}`);

  it("returns null when no pagination params", () => {
    const result = parsePaginationParams(makeUrl("search=foo"));
    expect(result).toBeNull();
  });

  it("parses page and pageSize with defaults", () => {
    const result = parsePaginationParams(makeUrl("page=2"));
    expect(result).toEqual({ page: 2, pageSize: 20, skip: 20 });
  });

  it("calculates skip correctly", () => {
    const result = parsePaginationParams(makeUrl("page=3&pageSize=10"));
    expect(result).toEqual({ page: 3, pageSize: 10, skip: 20 });
  });

  it("clamps page to minimum 1", () => {
    const result = parsePaginationParams(makeUrl("page=0&pageSize=10"));
    expect(result!.page).toBe(1);
    expect(result!.skip).toBe(0);
  });

  it("clamps page for negative values", () => {
    const result = parsePaginationParams(makeUrl("page=-5"));
    expect(result!.page).toBe(1);
  });

  it("clamps pageSize to max 100", () => {
    const result = parsePaginationParams(makeUrl("page=1&pageSize=500"));
    expect(result!.pageSize).toBe(100);
  });

  it("falls back to default pageSize for zero", () => {
    const result = parsePaginationParams(makeUrl("page=1&pageSize=0"));
    expect(result!.pageSize).toBe(20);
  });

  it("handles non-numeric values gracefully", () => {
    const result = parsePaginationParams(makeUrl("page=abc&pageSize=xyz"));
    expect(result!.page).toBe(1);
    expect(result!.pageSize).toBe(20);
  });
});
