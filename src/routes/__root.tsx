import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Outlet, createRootRouteWithContext, HeadContent, Scripts } from "@tanstack/react-router";
import appCss from "../styles.css?url";
import { AuthProvider } from "@/lib/auth";
import { Toaster } from "@/components/ui/sonner";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "theme-color", content: "#0A66C2" },
      { title: "HWM Refrigeração OS" },
      { name: "description", content: "Gestão de ordens de serviço — HWM Refrigeração" },
      { property: "og:title", content: "HWM Refrigeração OS" },
      { name: "twitter:title", content: "HWM Refrigeração OS" },
      { property: "og:description", content: "Gestão de ordens de serviço — HWM Refrigeração" },
      { name: "twitter:description", content: "Gestão de ordens de serviço — HWM Refrigeração" },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/89569f95-b762-4cad-af01-033e85ddcfc5/id-preview-def2e16d--a2bdab94-cec6-48df-b1af-f8d2be98b75e.lovable.app-1779904919738.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/89569f95-b762-4cad-af01-033e85ddcfc5/id-preview-def2e16d--a2bdab94-cec6-48df-b1af-f8d2be98b75e.lovable.app-1779904919738.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:type", content: "website" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/manifest.json" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: () => (
    <div className="min-h-screen flex items-center justify-center p-6 text-center">
      <div><h1 className="text-3xl font-bold">404</h1><p className="text-muted-foreground mt-2">Página não encontrada</p></div>
    </div>
  ),
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Outlet />
        <Toaster richColors position="top-center" />
      </AuthProvider>
    </QueryClientProvider>
  );
}
