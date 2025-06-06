import { Message } from "@ai-sdk/react";

export const useProjectApi = (projectId: string) => {
  const updateChat = async (messages: Message[]) => {
    try {
      // First get the current project state
      const currentProject = await fetch(`/api/project/${projectId}`).then(
        (res) => res.json()
      );
      const currentMessages = currentProject?.chat?.messages || [];

      // Merge the messages, ensuring no duplicates
      const mergedMessages = [...currentMessages];
      for (const newMessage of messages) {
        if (!mergedMessages.some((msg) => msg.id === newMessage.id)) {
          mergedMessages.push(newMessage);
        }
      }

      const response = await fetch(`/api/project/${projectId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat: { messages: mergedMessages },
        }),
      });
      console.log("response", response);
      if (!response.ok) {
        throw new Error("Failed to update chat");
      }
      return await response.json();
    } catch (error) {
      console.error("Error updating chat:", error);
      throw error;
    }
  };

  const saveCode = async (files: Record<string, string>) => {
    try {
      const response = await fetch(`/api/project/${projectId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files }),
      });
      if (!response.ok) {
        throw new Error("Failed to save code");
      }
    } catch (error) {
      console.error("Error saving code:", error);
      throw error;
    }
  };

  const deleteProject = async (id: string) => {
    try {
      const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
      if (!res.ok) {
        throw new Error("Failed to delete project");
      }
      return true;
    } catch (error) {
      console.error("Error deleting project:", error);
      throw error;
    }
  };

  return {
    updateChat,
    saveCode,
    deleteProject,
  };
};
