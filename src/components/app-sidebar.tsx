"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenuButton,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { useProjects } from "@/hooks/use-projects";
import { useRouter } from "next/navigation";
import { HomeIcon, MessageSquare, Trash } from "lucide-react";
import React, { useState } from "react";

export function AppSidebar() {
  const { projects, setProjects, loading } = useProjects();
  const router = useRouter();
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  console.log(projects);

  const handleDelete = async (id: string) => {
    // Optimistically update UI
    setProjects(projects.filter((p) => p.id !== id));
    try {
      const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
      if (!res.ok) {
        // Revert if failed
        setProjects(await (await fetch("/api/projects")).json());
        alert("Failed to delete project");
      }
    } catch {
      setProjects(await (await fetch("/api/projects")).json());
      alert("Failed to delete project");
    }
  };

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center justify-between px-4">
          <HomeIcon className="size-4" onClick={() => router.push("/")} />
          <h2 className="text-lg font-semibold">Projects</h2>
          <SidebarTrigger />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          {loading ? (
            <div className="px-4 py-2 text-sm text-muted-foreground">
              Loading...
            </div>
          ) : projects.length === 0 ? (
            <div className="px-4 py-2 text-sm text-muted-foreground">
              No projects yet
            </div>
          ) : (
            projects.map((project) => (
              <div
                key={project.id}
                className="group relative"
                onMouseEnter={() => setHoveredId(project.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                <SidebarMenuButton
                  onClick={() => router.push(`/chat/${project.id}`)}
                  className="flex items-center gap-2 pr-8"
                >
                  <MessageSquare className="size-4" />
                  <span className="truncate">{project.name}</span>
                </SidebarMenuButton>
                {hoveredId === project.id && (
                  <button
                    className="absolute right-2 top-1/2 -translate-y-1/2 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(project.id);
                    }}
                    aria-label="Delete project"
                  >
                    <Trash className="size-4 text-muted-foreground hover:text-black" />
                  </button>
                )}
              </div>
            ))
          )}
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter />
    </Sidebar>
  );
}
