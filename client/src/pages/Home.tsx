import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { Link } from "wouter";

export default function Home() {
  const { user, loading, isAuthenticated, logout } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-50">
      {/* Top nav */}
      <header className="w-full border-b border-slate-800/60 bg-slate-950/80 backdrop-blur">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            {APP_LOGO && (
              <img
                src={APP_LOGO}
                alt="Logo"
                className="h-9 w-9 rounded-xl border border-slate-800 object-cover"
              />
            )}
            <span className="text-lg font-semibold tracking-tight">
              {APP_TITLE || "Mighty Sky"}
            </span>
          </div>

          {!loading && (
            <div className="flex items-center gap-3">
              {isAuthenticated && (
                <span className="hidden sm:inline text-sm text-slate-300">
                  Signed in as{" "}
                  <span className="font-medium">
                    {user?.name || user?.email || "user"}
                  </span>
                </span>
              )}

              {isAuthenticated ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="border-slate-700 text-slate-200 hover:bg-slate-800"
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
          )}
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1">
        <section className="border-b border-slate-800 bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900">
          <div className="max-w-6xl mx-auto px-4 py-16 lg:py-20 grid lg:grid-cols-[3fr,2fr] gap-10 items-center">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900 px-3 py-1 text-xs font-medium text-slate-300 mb-4">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                AI-powered customer support workspace
              </p>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold leading-tight tracking-tight mb-4">
                Turn conversations into{" "}
                <span className="text-emerald-400">insight,</span> not chaos.
              </h1>

              <p className="text-sm sm:text-base text-slate-300 max-w-xl mb-6">
                Mighty Sky centralises customer questions, knowledge base
                content, satisfaction surveys, and team performance into a
                single, connected dashboard — powered by AI.
              </p>

              {!isAuthenticated ? (
                <div className="flex flex-wrap items-center gap-3">
                  <Button size="lg" asChild>
                    <a href={getLoginUrl()}>Start with your account</a>
                  </Button>
                  <span className="text-xs sm:text-sm text-slate-400">
                    No card required. Your existing OAuth account is enough.
                  </span>
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-3">
                  <Button asChild size="lg" variant="default">
                    <Link href="/staff">Open Staff Dashboard</Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href="/analytics">View Analytics</Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href="/knowledge">Knowledge Base</Link>
                  </Button>
                </div>
              )}
            </div>

            {/* Right column – quick stats / illustration */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 sm:p-5 shadow-xl shadow-slate-900/50">
              <p className="text-xs font-medium text-slate-400 mb-3">
                Live snapshot
              </p>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between rounded-xl bg-slate-900/80 px-3 py-3 border border-slate-800/80">
                  <div>
                    <p className="text-xs text-slate-400">Pending requests</p>
                    <p className="text-base font-semibold">—</p>
                  </div>
                  <span className="rounded-full bg-amber-500/15 text-amber-400 text-xs px-3 py-1">
                    central queue
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-xl bg-slate-900/80 px-3 py-3 border border-slate-800/80">
                    <p className="text-[11px] text-slate-400">
                      CSAT (30 days)
                    </p>
                    <p className="text-lg font-semibold">—</p>
                  </div>
                  <div className="rounded-xl bg-slate-900/80 px-3 py-3 border border-slate-800/80">
                    <p className="text-[11px] text-slate-400">
                      Avg. reply time
                    </p>
                    <p className="text-lg font-semibold">—</p>
                  </div>
                  <div className="rounded-xl bg-slate-900/80 px-3 py-3 border border-slate-800/80">
                    <p className="text-[11px] text-slate-400">
                      Knowledge articles
                    </p>
                    <p className="text-lg font-semibold">—</p>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 mt-2">
                  Connect your data and these tiles come alive with real
                  metrics from your Mighty Sky backend.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="border-t border-slate-800 bg-slate-900/80">
          <div className="max-w-6xl mx-auto px-4 py-10 grid md:grid-cols-3 gap-6">
            <FeatureCard
              title="Unified support inbox"
              description="Track every open customer request, assign it to staff, and prevent messages from slipping through."
            />
            <FeatureCard
              title="Living knowledge base"
              description="Capture good answers as articles, and let staff and AI re-use them instantly."
            />
            <FeatureCard
              title="Deep analytics"
              description="Monitor satisfaction, response time, and staff performance — with trends, not just raw numbers."
            />
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-800 bg-slate-950 py-4 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} {APP_TITLE || "Mighty Sky"}. All rights
        reserved.
      </footer>
    </div>
  );
}

type FeatureCardProps = {
  title: string;
  description: string;
};

function FeatureCard({ title, description }: FeatureCardProps) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 shadow-sm shadow-slate-950/60">
      <h3 className="text-sm font-semibold mb-2 text-slate-50">{title}</h3>
      <p className="text-xs text-slate-300 leading-relaxed">{description}</p>
    </div>
  );
}
