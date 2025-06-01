import type { Metadata } from "next";
import "./globals.css";
import { SidebarProvider } from "@/components/ui/sidebar";
import { SidebarTriggerWrapper } from "@/components/ui/SidebarTriggerWrapper";
import { AppSidebar } from "@/components/app-sidebar";

export const metadata: Metadata = {
  title: "Same",
  description: "Build fullstack web apps by prompting",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <SidebarProvider defaultOpen={true}>
          <AppSidebar />
          <main className="relative min-h-screen w-full flex">
            <SidebarTriggerWrapper className="absolute top-2 left-4" />
            {children}
          </main>
        </SidebarProvider>
      </body>
    </html>
  );
}
