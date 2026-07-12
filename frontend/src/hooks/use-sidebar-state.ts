"use client";

import { create } from "zustand";

interface SidebarState {
  expanded: boolean;
  mobileOpen: boolean;
  setExpanded: (expanded: boolean) => void;
  toggleExpanded: () => void;
  setMobileOpen: (open: boolean) => void;
  toggleMobileOpen: () => void;
}

export const useSidebarState = create<SidebarState>((set) => ({
  expanded: true,
  mobileOpen: false,
  setExpanded: (expanded) => set({ expanded }),
  toggleExpanded: () => set((s) => ({ expanded: !s.expanded })),
  setMobileOpen: (mobileOpen) => set({ mobileOpen }),
  toggleMobileOpen: () => set((s) => ({ mobileOpen: !s.mobileOpen })),
}));
