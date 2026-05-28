import { createFileRoute, Outlet, Navigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { BottomNav } from "@/components/bottom-nav";
import { Logo } from "@/components/logo";

export const Route = createFileRoute("/_authenticated")({ component: AuthLayout });

function AuthLayout() {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Carregando…</div>;
  if (!user) return <Navigate to="/login" />;
  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-20 bg-card border-b">
        <div className="mx-auto max-w-2xl flex items-center gap-3 px-4 py-3">
          <Logo className="h-9 w-9" />
          <div>
            <div className="font-bold text-sm leading-tight text-primary">HWM REFRIGERAÇÃO</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Ordens de Serviço</div>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-4 py-4">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
