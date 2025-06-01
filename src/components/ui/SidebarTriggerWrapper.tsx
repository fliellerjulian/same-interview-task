"use client";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import type { ComponentProps } from "react";

export function SidebarTriggerWrapper(
  props: ComponentProps<typeof SidebarTrigger>
) {
  const { state } = useSidebar();
  if (state === "expanded") return null;
  return <SidebarTrigger {...props} />;
}
