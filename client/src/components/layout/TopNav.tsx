import { APP_TITLE } from "@/const";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Link, useLocation } from "wouter";

export function TopNav() {
  const { user, isAuthenticated, logout } = useAuth();
  const [location] = useLocation();

  const linkClasses = (path: string) =>
    `text-xs sm:text-sm px-3 py-1.5 rounded-full border ${
      location === path
        ? "bg-slate-100 text-slate-900 border-slate-100"
        : "border-slate-700 text-slate-200 hover:bg-slate-800"
    }`;

  return (
    <header className="w-full border-b border-slate-800 bg-slate-950/90 backdrop-blur">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3 gap-3">
        <div className="flex items-center gap-2">
          <span className="h-8 w-8 rounded-xl bg-slate-800 flex items-center justify-center text-xs font-semibold">
            MS
          </span>
          <span className="text-sm sm:text-base font-semibold tracking-tight text-slate-50">
            {APP_TITLE || "Mighty Sky"}
          </span>
        </div>

        <nav className="hidden sm:flex items-center gap-2">
          <Link href="/">
            <a className={linkClasses("/")}>Home</a>
          </Link>
          <Link href="/staff">
            <a className={linkClasses("/staff")}>Staff</a>
          </Link>
          <Link href="/analytics">
            <a className={linkClasses("/analytics")}>Analytics</a>
          </Link>
          <Link href="/knowledge">
            <a className={linkClasses("/knowledge")}>Knowledge</a>
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          {isAuthenticated && (
            <span className="hidden md:inline text-xs text-slate-400 max-w-[180px] truncate">
              {user?.name || user?.email}
            </span>
          )}

          {isAuthenticated ? (
            <Button
              size="sm"
              variant="outline"
              className="border-slate-700 text-slate-100"
              onClick={logout}
            >
              Logout
            </Button>
          ) : (
            <Button size="sm" asChild>
              <a href={getLoginUrl()}>Sign in</a>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
