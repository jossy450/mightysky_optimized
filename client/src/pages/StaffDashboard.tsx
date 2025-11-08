import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function StaffDashboard() {
  const { user, loading, isAuthenticated } = useAuth();
  const [answeringRequestId, setAnsweringRequestId] = useState<number | null>(null);
  const [answerText, setAnswerText] = useState("");

  // Fetch pending requests
  const { data: requests, isLoading: requestsLoading, refetch } = trpc.chatbot.getPendingRequests.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  // Mutation to answer a request
  const answerMutation = trpc.chatbot.answerRequest.useMutation({
    onSuccess: (data) => {
      toast.success(`Answer sent to ${data.userEmail} and added to knowledge base!`);
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin h-8 w-8" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Staff Dashboard</CardTitle>
            <CardDescription>Please log in to access the staff dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <a href={getLoginUrl()}>Log In</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if user is an admin
  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>You do not have permission to access the staff dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              This page is restricted to administrators only. If you believe you should have access,
              please contact your system administrator.
            </p>
            <Button asChild variant="outline" className="w-full">
              <a href="/">Return to Home</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Staff Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage customer service requests from the chatbot</p>
          <p className="text-sm text-gray-500 mt-2">Logged in as: {user?.name || user?.email}</p>
        </div>

        {requestsLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin h-8 w-8" />
          </div>
        ) : requests && requests.length > 0 ? (
          <div className="space-y-4">
            {requests.map((request) => (
              <Card key={request.id}>
                <CardHeader>
                  <CardTitle className="text-lg">Request #{request.id}</CardTitle>
                  <CardDescription>
                    From: {request.userEmail} • Submitted:{" "}
                    {new Date(request.createdAt).toLocaleString()}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="font-semibold">Customer Question:</Label>
                    <p className="mt-1 p-3 bg-gray-100 rounded-md">{request.question}</p>
                  </div>

                  {answeringRequestId === request.id ? (
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor={`answer-${request.id}`}>Your Answer:</Label>
                        <Textarea
                          id={`answer-${request.id}`}
                          value={answerText}
                          onChange={(e) => setAnswerText(e.target.value)}
                          placeholder="Type your answer here..."
                          rows={4}
                          className="mt-1"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleAnswerSubmit(request.id)}
                          disabled={answerMutation.isPending}
                        >
                          {answerMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Submitting...
                            </>
                          ) : (
                            "Submit Answer"
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setAnsweringRequestId(null);
                            setAnswerText("");
                          }}
                          disabled={answerMutation.isPending}
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
                    >
                      Answer This Request
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-500">No pending requests at the moment. Great job!</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
