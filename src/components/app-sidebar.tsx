"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { useProjects } from "@/hooks/use-projects";
import { useRouter } from "next/navigation";
import { MessageSquare } from "lucide-react";

export function AppSidebar() {
  const { projects, loading } = useProjects();
  const router = useRouter();

  console.log(projects);

  return (
    <Sidebar>
      <SidebarHeader>
        <h2 className="px-4 text-lg font-semibold">Projects</h2>
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
              <SidebarMenuButton
                key={project.id}
                onClick={() => router.push(`/chat/${project.id}`)}
                className="flex items-center gap-2"
              >
                <MessageSquare className="size-4" />
                <span className="truncate">{project.name}</span>
              </SidebarMenuButton>
            ))
          )}
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter />
    </Sidebar>
  );
}
