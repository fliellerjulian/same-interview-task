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
import { useProjectApi } from "@/hooks/useProjectApi";
import { useRouter } from "next/navigation";
import { HomeIcon, MessageSquare, Trash } from "lucide-react";
import React, { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function AppSidebar() {
  const { projects, setProjects, loading } = useProjects();
  const router = useRouter();
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
  const { deleteProject } = useProjectApi("");

  const handleDelete = async (id: string) => {
    // Optimistically update UI
    setProjects(projects.filter((p) => p.id !== id));
    try {
      await deleteProject(id);
    } catch {
      // Revert if failed
      setProjects(await (await fetch("/api/projects")).json());
      alert("Failed to delete project");
    }
  };

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center justify-between px-4">
          <button
            type="button"
            aria-label="Home"
            onClick={() => router.push("/")}
            className="rounded-md size-7 flex items-center justify-center transition-colors hover:bg-sidebar-accent"
          >
            <HomeIcon className="size-4" />
          </button>
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
            [...projects]
              .sort(
                (a, b) =>
                  new Date(b.updatedAt).getTime() -
                  new Date(a.updatedAt).getTime()
              )
              .map((project) => (
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
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button
                          className="absolute right-2 top-1/2 -translate-y-1/2 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            setProjectToDelete(project.id);
                          }}
                          aria-label="Delete project"
                        >
                          <Trash className="size-4 text-muted-foreground hover:text-black" />
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently
                            delete the project
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => {
                              if (projectToDelete) {
                                handleDelete(projectToDelete);
                                setProjectToDelete(null);
                              }
                            }}
                            className="bg-black text-white hover:bg-zinc-800"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
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
