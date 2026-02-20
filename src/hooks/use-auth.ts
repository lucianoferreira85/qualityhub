"use client";

import { useContext } from "react";
import { AuthContext, type AuthContextValue } from "@/components/providers/auth-provider";

function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de AuthProvider");
  }
  return context;
}

export { useAuth };
