import { useEffect, useState } from "react";
import { Projects } from "@/db/schema";

type Project = typeof Projects.$inferSelect;

// Shared state outside the hook
let projectsState: Project[] = [];
let loadingState = true;
let errorState: Error | null = null;

// Event emitter for state changes
const listeners = new Set<() => void>();

function notifyListeners() {
  listeners.forEach((listener) => listener());
}

export function useProjects() {
  const [projects, setProjectsState] = useState<Project[]>(projectsState);
  const [loading, setLoadingState] = useState(loadingState);
  const [error, setErrorState] = useState<Error | null>(errorState);

  useEffect(() => {
    const listener = () => {
      setProjectsState(projectsState);
      setLoadingState(loadingState);
      setErrorState(errorState);
    };
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const setProjects = (newProjects: Project[]) => {
    projectsState = newProjects;
    notifyListeners();
  };

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch("/api/projects");
        if (!response.ok) throw new Error("Failed to fetch projects");
        const data = await response.json();
        projectsState = data;
        loadingState = false;
        notifyListeners();
      } catch (err) {
        errorState =
          err instanceof Error ? err : new Error("Failed to fetch projects");
        loadingState = false;
        notifyListeners();
      }
    };

    fetchProjects();
  }, []);

  return { projects, setProjects, loading, error };
}
