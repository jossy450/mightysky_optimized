import { useAuth } from "@/_core/hooks/useAuth";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Loader2, Search, Plus, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { TopNav } from "@/components/layout/TopNav"; // ✅ add this

export default function KnowledgeBase() {
  const { user, loading, isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editQuestion, setEditQuestion] = useState("");
  const [editAnswer, setEditAnswer] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [newQuestion, setNewQuestion] = useState("");
  const [newAnswer, setNewAnswer] = useState("");

  // Fetch all Q&A pairs
  const {
    data: knowledgeBasePairs,
    isLoading,
    refetch,
  } = trpc.knowledgeBase.getAll.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === "admin",
  });

  // Mutations
  const updateMutation = trpc.knowledgeBase.update.useMutation({
    onSuccess: () => {
      toast.success("Q&A pair updated successfully");
      setEditingId(null);
      refetch();
    },
    onError: () => {
      toast.error("Failed to update Q&A pair");
    },
  });

  const deleteMutation = trpc.knowledgeBase.delete.useMutation({
    onSuccess: () => {
      toast.success("Q&A pair deleted successfully");
      refetch();
    },
    onError: () => {
      toast.error("Failed to delete Q&A pair");
    },
  });

  const createMutation = trpc.knowledgeBase.create.useMutation({
    onSuccess: () => {
      toast.success("Q&A pair created successfully");
      setIsCreating(false);
      setNewQuestion("");
      setNewAnswer("");
      refetch();
    },
    onError: () => {
      toast.error("Failed to create Q&A pair");
    },
  });

  // Filter pairs based on search query
  const filteredPairs = knowledgeBasePairs?.filter(
    (pair) =>
      pair.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pair.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEdit = (id: number, question: string, answer: string) => {
    setEditingId(id);
    setEditQuestion(question);
    setEditAnswer(answer);
    setIsCreating(false);
  };

  const handleSaveEdit = () => {
    if (!editingId || !editQuestion.trim() || !editAnswer.trim()) {
      toast.error("Please provide both a question and an answer.");
      return;
    }
    updateMutation.mutate({
      id: editingId,
      question: editQuestion.trim(),
      answer: editAnswer.trim(),
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditQuestion("");
    setEditAnswer("");
  };

  const handleDelete = (id: number, question: string) => {
    if (
      confirm(
        `Are you sure you want to delete this Q&A pair?\n\nQuestion: ${question}`
      )
    ) {
      deleteMutation.mutate({ id });
    }
  };

  const handleCreate = () => {
    if (!newQuestion.trim() || !newAnswer.trim()) {
      toast.error("Please provide both a question and an answer.");
      return;
    }
    createMutation.mutate({
      question: newQuestion.trim(),
      answer: newAnswer.trim(),
    });
  };

  // ---- Auth Gates -----------------------------------------------------------

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-950">
        <TopNav />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-slate-100" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-950 text-slate-50 p-4">
        <TopNav />
        <div className="flex-1 flex items-center justify-center">
          <Card className="max-w-md w-full bg-slate-900/70 border-slate-700">
            <CardHeader>
              <CardTitle>Knowledge Base</CardTitle>
              <CardDescription className="text-slate-400">
                Log in to manage the chatbot&apos;s Q&amp;A knowledge.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <a href={getLoginUrl()}>Log In</a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen flex flex-col bg-slate-950 text-slate-50 p-4">
        <TopNav />
        <div className="flex-1 flex items-center justify-center">
          <Card className="max-w-md w-full bg-slate-900/70 border-slate-700">
            <CardHeader>
              <CardTitle>Access Denied</CardTitle>
              <CardDescription className="text-slate-400">
                This page is restricted to administrators only. If you should
                have access, speak to your system administrator.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <a href="/">Back to Home</a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ---- Main UI --------------------------------------------------------------

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-50">
      <TopNav />
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500 mb-1">
              Content
            </p>
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
              Knowledge Base Management
            </h1>
            <p className="text-sm text-slate-400 mt-2">
              Curate the answers your chatbot can use. Keep responses accurate,
              on-brand and up to date.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 items-center justify-end">
            <Button
              onClick={() => {
                setIsCreating(true);
                setEditingId(null);
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              New Q&amp;A
            </Button>
            <Button asChild variant="outline" className="border-slate-600">
              <a href="/staff">Staff Dashboard</a>
            </Button>
          </div>
        </div>

        {/* Search bar */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
            <Input
              type="text"
              placeholder="Search questions or answers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-slate-900/60 border-slate-700 text-slate-50 placeholder:text-slate-500"
            />
          </div>
          <p className="text-xs text-slate-500">
            {knowledgeBasePairs?.length
              ? `${knowledgeBasePairs.length} total entries`
              : "No entries yet"}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[2fr,3fr] gap-6 items-start">
          {/* Left column – list of Q&A */}
          <Card className="bg-slate-900/70 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">All Q&amp;A Pairs</CardTitle>
              <CardDescription className="text-slate-400">
                Click an item to edit or remove it. Search to quickly find
                specific topics.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 max-h-[70vh] overflow-y-auto pr-2">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-slate-200" />
                </div>
              ) : filteredPairs && filteredPairs.length > 0 ? (
                filteredPairs.map((pair) => (
                  <button
                    key={pair.id}
                    onClick={() =>
                      handleEdit(pair.id, pair.question, pair.answer)
                    }
                    className={`w-full text-left rounded-lg border px-3 py-3 transition ${
                      editingId === pair.id
                        ? "border-sky-500 bg-sky-950/40"
                        : "border-slate-700 bg-slate-950/40 hover:bg-slate-900/80"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-xs text-slate-500 mb-1">
                          Q#{pair.id}
                        </p>
                        <h3 className="font-medium text-sm text-slate-50 line-clamp-2">
                          {pair.question}
                        </h3>
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                          {pair.answer}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7 border-slate-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(pair.id, pair.question, pair.answer);
                          }}
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7 border-slate-700"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(pair.id, pair.question);
                          }}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="w-3 h-3 text-red-400" />
                        </Button>
                      </div>
                    </div>
                    <p className="mt-2 text-[10px] text-slate-500">
                      Created{" "}
                      {new Date(pair.createdAt).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </button>
                ))
              ) : (
                <div className="py-10 text-center text-sm text-slate-400">
                  {searchQuery
                    ? "No Q&A pairs match your search."
                    : 'No Q&A pairs yet. Use "New Q&A" to add your first entry.'}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Right column – editor / create form */}
          <div className="space-y-4">
            {/* Create new */}
            {isCreating && (
              <Card className="bg-slate-900/70 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Create New Q&amp;A Pair
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Add a new question and answer for the chatbot to use.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-slate-300">
                      Question
                    </label>
                    <Input
                      value={newQuestion}
                      onChange={(e) => setNewQuestion(e.target.value)}
                      placeholder="Enter the question the customer might ask..."
                      className="mt-1 bg-slate-950/60 border-slate-700 text-slate-50 placeholder:text-slate-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-300">
                      Answer
                    </label>
                    <textarea
                      value={newAnswer}
                      onChange={(e) => setNewAnswer(e.target.value)}
                      placeholder="Write the ideal answer the chatbot should give..."
                      className="mt-1 w-full min-h-[140px] rounded-md bg-slate-950/60 border border-slate-700 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/60"
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button
                      onClick={handleCreate}
                      disabled={
                        createMutation.isPending ||
                        !newQuestion.trim() ||
                        !newAnswer.trim()
                      }
                    >
                      {createMutation.isPending && (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      )}
                      Create
                    </Button>
                    <Button
                      variant="outline"
                      className="border-slate-600"
                      onClick={() => setIsCreating(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Edit existing */}
            {editingId && !isCreating && (
              <Card className="bg-slate-900/70 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Edit className="w-4 h-4" />
                    Edit Q&amp;A Pair
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Update the wording or fix outdated information.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-slate-300">
                      Question
                    </label>
                    <Input
                      value={editQuestion}
                      onChange={(e) => setEditQuestion(e.target.value)}
                      className="mt-1 bg-slate-950/60 border-slate-700 text-slate-50"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-300">
                      Answer
                    </label>
                    <textarea
                      value={editAnswer}
                      onChange={(e) => setEditAnswer(e.target.value)}
                      className="mt-1 w-full min-h-[160px] rounded-md bg-slate-950/60 border border-slate-700 px-3 py-2 text-sm text-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-500/60"
                    />
                  </div>
                  <div className="flex gap-2 justify-between">
                    <Button
                      variant="outline"
                      className="border-slate-600"
                      size="sm"
                      onClick={() => {
                        setEditingId(null);
                        setEditQuestion("");
                        setEditAnswer("");
                      }}
                    >
                      Close
                    </Button>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-slate-600"
                        onClick={handleCancelEdit}
                        disabled={updateMutation.isPending}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSaveEdit}
                        disabled={updateMutation.isPending}
                      >
                        {updateMutation.isPending && (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        )}
                        Save Changes
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {!editingId && !isCreating && (
              <Card className="bg-slate-900/40 border-dashed border-slate-700">
                <CardHeader>
                  <CardTitle className="text-base">
                    Select or Create a Q&amp;A
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Choose an item from the list to edit, or click "New Q&amp;A"
                    to add a fresh entry.
                  </CardDescription>
                </CardHeader>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
