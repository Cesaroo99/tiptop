"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api, type LikePlacement, type LikesMe } from "./api";
import { useSession } from "./session";

type LikePlacementState = {
  placement: LikePlacement | null;
  loadedAt: number;
  refresh: () => Promise<void>;
};

const empty: LikePlacementState = {
  placement: null,
  loadedAt: 0,
  refresh: async () => undefined,
};

const LikePlacementContext = createContext<LikePlacementState | null>(null);

export function LikePlacementScope({
  value,
  children,
}: {
  value: LikePlacementState;
  children: ReactNode;
}) {
  return <LikePlacementContext.Provider value={value}>{children}</LikePlacementContext.Provider>;
}

export function LikePlacementProvider({
  children,
  initial = null,
}: {
  children: ReactNode;
  initial?: LikePlacement | null;
}) {
  const { user, loading } = useSession();
  const [placement, setPlacement] = useState<LikePlacement | null>(initial);
  const [loadedAt, setLoadedAt] = useState(() => Date.now());

  const refresh = useCallback(async () => {
    if (!user) {
      setPlacement(null);
      return;
    }
    try {
      const me = await api<LikesMe>("/likes/me");
      setPlacement(me.placement ?? null);
      setLoadedAt(Date.now());
    } catch {
      /* session encore en cours de chargement, ou réseau : on garde l’état */
    }
  }, [user]);

  useEffect(() => {
    if (loading) return;
    void refresh();
  }, [loading, refresh]);

  const value = useMemo(() => ({ placement, loadedAt, refresh }), [placement, loadedAt, refresh]);

  return <LikePlacementContext.Provider value={value}>{children}</LikePlacementContext.Provider>;
}

export function useLikePlacement() {
  return useContext(LikePlacementContext) ?? empty;
}
