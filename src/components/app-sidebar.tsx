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
import { HomeIcon, MessageSquare } from "lucide-react";

export function AppSidebar() {
  const { projects, loading } = useProjects();
  const router = useRouter();

  console.log(projects);

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
