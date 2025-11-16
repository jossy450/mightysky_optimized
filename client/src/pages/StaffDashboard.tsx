import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Loader2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { TopNav } from "@/components/layout/TopNav"; // ✅ add this

// Helper function to get priority badge styling
const getPriorityBadge = (priority: "high" | "medium" | "low") => {
  const styles = {
    high: "bg-red-500/15 text-red-300 border-red-500/40",
    medium: "bg-amber-500/15 text-amber-300 border-amber-500/40",
    low: "bg-emerald-500/15 text-emerald-300 border-emerald-500/40",
  };
  return styles[priority];
};

export default function StaffDashboard() {
  const { user, loading, isAuthenticated } = useAuth();
  const [answeringRequestId, setAnsweringRequestId] = useState<number | null>(
    null
  );
  const [answerText, setAnswerText] = useState("");
  const previousRequestIds = useRef<Set<number>>(new Set());

  // Fetch pending requests with polling enabled
  const {
    data: requests,
    isLoading: requestsLoading,
    refetch,
  } = trpc.chatbot.getPendingRequests.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchInterval: 10000, // Poll every 10 seconds
  });

  // Detect new requests and show toast notifications
  useEffect(() => {
    if (!requests || !isAuthenticated || user?.role !== "admin") return;

    const currentRequestIds = new Set(requests.map((r) => r.id));
    const newRequests = requests.filter(
      (r) => !previousRequestIds.current.has(r.id)
    );

    // Show toast for each new request (but not on initial load)
    if (previousRequestIds.current.size > 0 && newRequests.length > 0) {
      newRequests.forEach((req) => {
        toast.info(`New request from ${req.userEmail}`, {
          description:
            req.question.substring(0, 100) +
            (req.question.length > 100 ? "..." : ""),
          duration: 5000,
        });
      });
    }

    // Update the tracked request IDs
    previousRequestIds.current = currentRequestIds;
  }, [requests, isAuthenticated, user?.role]);

  // Fetch answered requests for audit log
  const { data: answeredRequests, isLoading: answeredLoading } =
    trpc.chatbot.getAnsweredRequests.useQuery(undefined, {
      enabled: isAuthenticated && user?.role === "admin",
    });

  // Calculate staff performance metrics
  const staffMetrics =
    answeredRequests?.reduce((acc, req) => {
      const staffName = req.answeredBy || "Unknown";
      acc[staffName] = (acc[staffName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

  // Mutation to answer a request
  const answerMutation = trpc.chatbot.answerRequest.useMutation({
    onSuccess: (data) => {
      toast.success(
        `Answer sent to ${data.userEmail} and added to knowledge base!`
      );
      setAnsweringRequestId(null);
      setAnswerText("");
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to answer request: ${error.message}`);
    },
  });

  const handleAnswerSubmit = (requestId: number) => {
    if (!answerText.trim()) {
      toast.error("Please provide an answer before submitting.");
      return;
    }

    answerMutation.mutate({
      requestId,
      answer: answerText,
    });
  };

  // ---------- States: loading / unauth / not admin ----------

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-50">
        <TopNav />
	<Loader2 className="animate-spin h-8 w-8 text-slate-300" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-50">
        <TopNav />
	<Card className="w-full max-w-md border-slate-800 bg-slate-900">
          <CardHeader>
            <CardTitle className="text-lg">Staff dashboard</CardTitle>
            <CardDescription className="text-slate-400">
              Please log in to access the staff dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <a href={getLoginUrl()}>Log in</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-50">
        <TopNav />
	<Card className="w-full max-w-md border-slate-800 bg-slate-900">
          <CardHeader>
            <CardTitle className="text-lg">Access denied</CardTitle>
            <CardDescription className="text-slate-400">
              You do not have permission to access the staff dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-400 mb-4">
              This page is restricted to administrators only. If you believe you
              should have access, please contact your system administrator.
            </p>
            <Button
              asChild
              variant="outline"
              className="w-full border-slate-700 text-slate-100"
            >
              <a href="/">Return to home</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ---------- Main dashboard ----------

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
	<TopNav />      
	{/* Top bar */}
      <header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              Staff dashboard
            </h1>
            <p className="text-xs text-slate-400">
              Manage customer service requests from the chatbot.
            </p>
          </div>
          <div className="text-xs text-right text-slate-400">
            <div className="font-medium text-slate-200">
              {user?.name || user?.email}
            </div>
            <div>Role: admin</div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Metrics cards */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-slate-800 bg-slate-900/70">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-slate-300">
                Total answered
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold text-slate-50">
                {answeredRequests?.length || 0}
              </p>
            </CardContent>
          </Card>

          <Card className="border-slate-800 bg-slate-900/70">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-slate-300">
                Pending requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold text-slate-50">
                {requests?.length || 0}
              </p>
            </CardContent>
          </Card>

          <Card className="border-slate-800 bg-slate-900/70">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-slate-300">
                Active staff
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold text-slate-50">
                {Object.keys(staffMetrics).length}
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Layout: left = pending, right = recent activity */}
        <section className="grid lg:grid-cols-[3fr,2fr] gap-6 items-start">
          {/* Pending requests */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-slate-100">
                Pending requests
              </h2>
              {requests && requests.length > 0 && (
                <p className="text-[11px] text-slate-500">
                  Auto-refreshing every 10 seconds
                </p>
              )}
            </div>

            {requestsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="animate-spin h-6 w-6 text-slate-300" />
              </div>
            ) : requests && requests.length > 0 ? (
              <div className="space-y-4">
                {requests.map((request) => (
                  <Card
                    key={request.id}
                    className="border-slate-800 bg-slate-900/80"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <CardTitle className="text-sm font-semibold">
                            Request #{request.id}
                          </CardTitle>
                          <CardDescription className="text-[11px] text-slate-400">
                            From {request.userEmail} • Submitted{" "}
                            {new Date(request.createdAt).toLocaleString()}
                          </CardDescription>
                        </div>
                        <span
                          className={`text-[10px] font-semibold px-3 py-1 rounded-full border uppercase tracking-wide ${getPriorityBadge(
                            request.priority
                          )}`}
                        >
                          {request.priority} priority
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label className="text-xs text-slate-300">
                          Customer question
                        </Label>
                        <p className="mt-1 p-3 rounded-lg bg-slate-900 border border-slate-800 text-sm text-slate-100">
                          {request.question}
                        </p>
                      </div>

                      {answeringRequestId === request.id ? (
                        <div className="space-y-3">
                          <div>
                            <Label
                              htmlFor={`answer-${request.id}`}
                              className="text-xs text-slate-300"
                            >
                              Your answer
                            </Label>
                            <Textarea
                              id={`answer-${request.id}`}
                              value={answerText}
                              onChange={(e) => setAnswerText(e.target.value)}
                              placeholder="Type your answer here..."
                              rows={4}
                              className="mt-1 bg-slate-950 border-slate-800 text-sm text-slate-100"
                            />
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Button
                              onClick={() => handleAnswerSubmit(request.id)}
                              disabled={answerMutation.isPending}
                            >
                              {answerMutation.isPending ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Submitting…
                                </>
                              ) : (
                                "Submit answer"
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => {
                                setAnsweringRequestId(null);
                                setAnswerText("");
                              }}
                              disabled={answerMutation.isPending}
                              className="border-slate-700 text-slate-100"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button
                          onClick={() => {
                            setAnsweringRequestId(request.id);
                            setAnswerText("");
                          }}
                          size="sm"
                        >
                          Answer this request
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border-slate-800 bg-slate-900/70">
                <CardContent className="py-10 text-center">
                  <p className="text-sm text-slate-400">
                    No pending requests at the moment. Nice work ✨
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Recent activity / answered */}
          <div className="space-y-4">
            <Card className="border-slate-800 bg-slate-900/80">
              <CardHeader>
                <CardTitle className="text-sm font-semibold text-slate-100">
                  Recent activity
                </CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  Latest answered customer service requests.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {answeredLoading ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="animate-spin h-5 w-5 text-slate-300" />
                  </div>
                ) : answeredRequests && answeredRequests.length > 0 ? (
                  <div className="space-y-3">
                    {answeredRequests.slice(0, 6).map((req) => (
                      <div
                        key={req.id}
                        className="flex items-start justify-between gap-3 rounded-lg border border-slate-800 bg-slate-950/80 px-3 py-2"
                      >
                        <div className="flex-1">
                          <p className="text-xs font-medium text-slate-100">
                            {req.question}
                          </p>
                          <p className="text-[11px] text-slate-500 mt-1">
                            Answered by {req.answeredBy || "Unknown"} •{" "}
                            {req.answeredAt
                              ? new Date(req.answeredAt).toLocaleString()
                              : "—"}
                          </p>
                        </div>
                        <span className="text-[10px] bg-emerald-500/15 text-emerald-300 px-2 py-1 rounded-full border border-emerald-500/40">
                          Answered
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 text-center py-6">
                    No answered requests yet.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Simple staff breakdown */}
            {Object.keys(staffMetrics).length > 0 && (
              <Card className="border-slate-800 bg-slate-900/80">
                <CardHeader>
                  <CardTitle className="text-sm font-semibold text-slate-100">
                    Staff performance snapshot
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-400">
                    Number of requests answered per staff member.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {Object.entries(staffMetrics).map(([name, count]) => (
                    <div
                      key={name}
                      className="flex items-center justify-between text-xs text-slate-300"
                    >
                      <span>{name}</span>
                      <span className="text-slate-100 font-semibold">
                        {count}
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
