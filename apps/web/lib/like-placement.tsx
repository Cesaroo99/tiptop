"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api, type LikePlacement, type LikesMe } from "./api";
import { useSession } from "./session";

type LikePlacementState = {
  placement: LikePlacement | null;
  loadedAt: number;
  ready: boolean;
  refresh: () => Promise<void>;
};

const empty: LikePlacementState = {
  placement: null,
  loadedAt: 0,
  ready: false,
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
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setPlacement(null);
      setReady(true);
      return;
    }
    try {
      const me = await api<LikesMe>("/likes/me");
      setPlacement(me.placement ?? null);
      setLoadedAt(Date.now());
      setReady(true);
    } catch {
      /* session encore en cours de chargement, ou réseau : on garde l’état */
    }
  }, [user]);

  useEffect(() => {
    if (loading) return;
    void refresh();
  }, [loading, refresh]);

  const value = useMemo(() => ({ placement, loadedAt, ready, refresh }), [placement, loadedAt, ready, refresh]);

  return <LikePlacementContext.Provider value={value}>{children}</LikePlacementContext.Provider>;
}

export function useLikePlacement() {
  return useContext(LikePlacementContext) ?? empty;
}
