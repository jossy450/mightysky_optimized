import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Loader2, TrendingUp, Users, Clock, PieChart } from "lucide-react";

export default function Analytics() {
  const { user, loading, isAuthenticated } = useAuth();

  // Fetch analytics data
  const { data: responseTimeData, isLoading: responseTimeLoading } = trpc.analytics.getResponseTimeByPriority.useQuery(
    undefined,
    { enabled: isAuthenticated && user?.role === "admin" }
  );

  const { data: staffPerformanceData, isLoading: staffPerformanceLoading } = trpc.analytics.getStaffPerformance.useQuery(
    undefined,
    { enabled: isAuthenticated && user?.role === "admin" }
  );

  const { data: priorityDistributionData, isLoading: priorityDistributionLoading } = trpc.analytics.getPriorityDistribution.useQuery(
    undefined,
    { enabled: isAuthenticated && user?.role === "admin" }
  );

  // Helper function to format milliseconds to human-readable time
  const formatTime = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  // Helper function to get priority badge styling
  const getPriorityColor = (priority: string) => {
    const colors = {
      high: "text-red-600",
      medium: "text-yellow-600",
      low: "text-green-600",
    };
    return colors[priority as keyof typeof colors] || "text-gray-600";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>Please log in to view the analytics dashboard.</CardDescription>
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

  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              This page is restricted to administrators only. Please contact your system administrator if you believe you should have access.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <a href="/">Back to Home</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isLoading = responseTimeLoading || staffPerformanceLoading || priorityDistributionLoading;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
            <p className="text-gray-600 mt-1">Track customer service performance and trends</p>
          </div>
          <Button asChild variant="outline">
            <a href="/staff">Go to Staff Dashboard</a>
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : (
          <>
            {/* Response Time by Priority */}
            <div>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Average Response Time by Priority
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {responseTimeData?.map((item) => (
                  <Card key={item.priority}>
                    <CardHeader>
                      <CardTitle className={`text-lg ${getPriorityColor(item.priority)}`}>
                        {item.priority.toUpperCase()} Priority
                      </CardTitle>
                      <CardDescription>{item.count} requests answered</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">
                        {item.count > 0 ? formatTime(item.avgResponseTime) : "N/A"}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">Average response time</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Priority Distribution */}
            <div>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <PieChart className="w-5 h-5" />
                Request Priority Distribution
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {priorityDistributionData?.map((item) => (
                  <Card key={item.priority}>
                    <CardHeader>
                      <CardTitle className={`text-lg ${getPriorityColor(item.priority)}`}>
                        {item.priority.toUpperCase()} Priority
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-4xl font-bold">{item.count}</div>
                      <p className="text-sm text-gray-500 mt-1">Total requests</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Staff Performance */}
            <div>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Staff Performance
              </h2>
              {staffPerformanceData && staffPerformanceData.length > 0 ? (
                <Card>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-100 border-b">
                          <tr>
                            <th className="text-left p-4 font-semibold">Staff Member</th>
                            <th className="text-left p-4 font-semibold">Requests Answered</th>
                            <th className="text-left p-4 font-semibold">Avg Response Time</th>
                          </tr>
                        </thead>
                        <tbody>
                          {staffPerformanceData.map((staff, index) => (
                            <tr key={index} className="border-b last:border-b-0 hover:bg-gray-50">
                              <td className="p-4 font-medium">{staff.staffName}</td>
                              <td className="p-4">{staff.totalAnswered}</td>
                              <td className="p-4">{formatTime(staff.avgResponseTime)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center text-gray-500">
                    No staff performance data available yet. Start answering customer requests to see metrics here.
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Summary Card */}
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Performance Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700">
                  {responseTimeData && priorityDistributionData && (
                    <>
                      Total requests processed:{" "}
                      <strong>
                        {priorityDistributionData.reduce((sum, item) => sum + item.count, 0)}
                      </strong>
                      . High-priority requests have an average response time of{" "}
                      <strong>
                        {responseTimeData.find((d) => d.priority === "high")?.count
                          ? formatTime(responseTimeData.find((d) => d.priority === "high")!.avgResponseTime)
                          : "N/A"}
                      </strong>
                      .
                    </>
                  )}
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
