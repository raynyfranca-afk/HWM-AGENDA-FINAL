import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutGrid, Calendar, BarChart3, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth";

const items = [
  { to: "/dashboard", label: "OS", icon: LayoutGrid },
  { to: "/agenda", label: "Agenda", icon: Calendar },
  { to: "/relatorios", label: "Relatórios", icon: BarChart3, adminOnly: true },
];

export function BottomNav() {
  const { isAdmin, signOut } = useAuth();
  const path = useRouterState({ select: (r) => r.location.pathname });
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 border-t bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 safe-area-pb">
      <div className="mx-auto max-w-2xl grid grid-cols-4">
        {items.filter(i => !i.adminOnly || isAdmin).map(({ to, label, icon: Icon }) => {
          const active = path.startsWith(to);
          return (
            <Link key={to} to={to} className={`flex flex-col items-center justify-center gap-1 py-3 text-xs font-medium ${active ? "text-primary" : "text-muted-foreground"}`}>
              <Icon className="h-6 w-6" />
              <span>{label}</span>
            </Link>
          );
        })}
        <button onClick={signOut} className="flex flex-col items-center justify-center gap-1 py-3 text-xs font-medium text-muted-foreground">
          <LogOut className="h-6 w-6" />
          <span>Sair</span>
        </button>
      </div>
    </nav>
  );
}
