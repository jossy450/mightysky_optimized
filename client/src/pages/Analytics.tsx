import { useAuth } from "@/_core/hooks/useAuth";
import { DateRangePicker } from "@/components/DateRangePicker";
import { useState } from "react";
import { exportAnalyticsToCSV } from "@/lib/csvExport";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Loader2, TrendingUp, Users, Clock, PieChart, Download } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function Analytics() {
  const { user, loading, isAuthenticated } = useAuth();
  const [dateRange, setDateRange] = useState<{ startDate?: string; endDate?: string }>({});

  const handleExportCSV = () => {
    if (!responseTimeData || !staffPerformanceData || !priorityDistributionData) {
      return;
    }

    exportAnalyticsToCSV({
      responseTime: responseTimeData,
      staffPerformance: staffPerformanceData,
      priorityDistribution: priorityDistributionData,
      dateRange,
    });
  };

  // Fetch analytics data
  const { data: responseTimeData, isLoading: responseTimeLoading } = trpc.analytics.getResponseTimeByPriority.useQuery(
    dateRange,
    { enabled: isAuthenticated && user?.role === "admin" }
  );

  const { data: staffPerformanceData, isLoading: staffPerformanceLoading } = trpc.analytics.getStaffPerformance.useQuery(
    dateRange,
    { enabled: isAuthenticated && user?.role === "admin" }
  );

  const { data: priorityDistributionData, isLoading: priorityDistributionLoading } = trpc.analytics.getPriorityDistribution.useQuery(
    dateRange,
    { enabled: isAuthenticated && user?.role === "admin" }
  );

  const { data: surveyData, isLoading: surveyLoading } = trpc.survey.analytics.useQuery(
    dateRange,
    { enabled: isAuthenticated && user?.role === "admin" }
  );

  const { data: trendsData, isLoading: trendsLoading } = trpc.survey.trends.useQuery(
    { days: 30 },
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

  const isLoading = responseTimeLoading || staffPerformanceLoading || priorityDistributionLoading || surveyLoading || trendsLoading;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
            <p className="text-gray-600 mt-1">Track customer service performance and trends</p>
          </div>
          <div className="flex gap-2">
            <DateRangePicker
              onDateRangeChange={(startDate, endDate) => {
                setDateRange({ startDate, endDate });
              }}
            />
            <Button
              variant="outline"
              onClick={handleExportCSV}
              disabled={isLoading || !responseTimeData}
            >
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
            <Button asChild variant="outline">
              <a href="/staff">Go to Staff Dashboard</a>
            </Button>
          </div>
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

            {/* Customer Satisfaction Surveys */}
            <div>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Customer Satisfaction Surveys
              </h2>
              {surveyData ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Total Surveys</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-4xl font-bold">{surveyData.totalSurveys}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Average Rating</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-4xl font-bold">{surveyData.averageRating} / 5.0</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Satisfaction Rate</CardTitle>
                        <CardDescription>4-5 star ratings</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="text-4xl font-bold">
                          {surveyData.totalSurveys > 0
                            ? Math.round(
                                ((surveyData.ratingDistribution[4] + surveyData.ratingDistribution[5]) /
                                  surveyData.totalSurveys) *
                                  100
                              )
                            : 0}
                          %
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Satisfaction Trends Chart */}
                  {trendsData && trendsData.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Satisfaction Trends (Past 30 Days)</CardTitle>
                        <CardDescription>Daily average customer satisfaction ratings</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                          <LineChart data={trendsData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                              dataKey="date"
                              tickFormatter={(value) => {
                                const date = new Date(value);
                                return `${date.getMonth() + 1}/${date.getDate()}`;
                              }}
                            />
                            <YAxis domain={[0, 5]} ticks={[0, 1, 2, 3, 4, 5]} />
                            <Tooltip
                              labelFormatter={(value) => {
                                const date = new Date(value as string);
                                return date.toLocaleDateString();
                              }}
                              formatter={(value: any, name: string) => {
                                if (name === "averageRating") {
                                  return value !== null ? [value, "Average Rating"] : ["No data", "Average Rating"];
                                }
                                return [value, name];
                              }}
                            />
                            <Legend />
                            <Line
                              type="monotone"
                              dataKey="averageRating"
                              stroke="#3b82f6"
                              strokeWidth={2}
                              dot={{ r: 4 }}
                              connectNulls
                              name="Average Rating"
                            />
                          </LineChart>
                        </ResponsiveContainer>
                        <div className="mt-4 text-sm text-gray-600">
                          <p>
                            This chart shows the daily average satisfaction rating over the past 30 days. Days without
                            survey responses are connected to show the overall trend.
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <Card>
                    <CardHeader>
                      <CardTitle>Rating Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {[5, 4, 3, 2, 1].map((rating) => (
                          <div key={rating} className="flex items-center gap-3">
                            <span className="w-20 text-sm font-medium">{rating} stars</span>
                            <div className="flex-1 bg-gray-200 rounded-full h-8 overflow-hidden">
                              <div
                                className="bg-blue-500 h-full flex items-center justify-end pr-2"
                                style={{
                                  width:
                                    surveyData.totalSurveys > 0
                                      ? `${(surveyData.ratingDistribution[rating as 1 | 2 | 3 | 4 | 5] / surveyData.totalSurveys) * 100}%`
                                      : "0%",
                                }}
                              >
                                {surveyData.ratingDistribution[rating as 1 | 2 | 3 | 4 | 5] > 0 && (
                                  <span className="text-xs text-white font-medium">
                                    {surveyData.ratingDistribution[rating as 1 | 2 | 3 | 4 | 5]}
                                  </span>
                                )}
                              </div>
                            </div>
                            <span className="w-16 text-sm text-right">{surveyData.ratingDistribution[rating as 1 | 2 | 3 | 4 | 5]}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {surveyData.recentFeedback.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Recent Feedback</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {surveyData.recentFeedback.map((item, index) => (
                            <div key={index} className="p-4 border rounded-lg bg-gray-50">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-semibold">{item.rating} / 5 stars</span>
                                <span className="text-xs text-gray-500">
                                  {new Date(item.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-sm text-gray-700">{item.feedback}</p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center text-gray-500">
                    No survey data available yet. Customers will see a satisfaction survey after chatbot conversations.
                  </CardContent>
                </Card>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
