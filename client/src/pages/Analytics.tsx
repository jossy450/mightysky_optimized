import { useAuth } from "@/_core/hooks/useAuth";
import { DateRangePicker } from "@/components/DateRangePicker";
import { useState } from "react";
import { exportAnalyticsToCSV } from "@/lib/csvExport";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import {
  Loader2,
  TrendingUp,
  Users,
  Clock,
  PieChart,
  Download,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

type ComparisonPeriod =
  | "this-month-vs-last"
  | "this-week-vs-last"
  | "last-30-vs-previous"
  | "custom";

export default function Analytics() {
  const { user, loading, isAuthenticated } = useAuth();
  const [dateRange, setDateRange] = useState<{
    startDate?: string;
    endDate?: string;
  }>({});
  const [comparisonMode, setComparisonMode] = useState(false);
  const [comparisonPeriod, setComparisonPeriod] =
    useState<ComparisonPeriod>("this-month-vs-last");

  // ---- Comparison helpers ---------------------------------------------------

  const getComparisonDates = (period: ComparisonPeriod) => {
    const now = new Date();
    const result = {
      period1Start: "",
      period1End: "",
      period2Start: "",
      period2End: "",
      period1Label: "",
      period2Label: "",
    };

    switch (period) {
      case "this-month-vs-last": {
        const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const thisMonthEnd = new Date(
          now.getFullYear(),
          now.getMonth() + 1,
          0
        );
        const lastMonthStart = new Date(
          now.getFullYear(),
          now.getMonth() - 1,
          1
        );
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

        result.period1Start = thisMonthStart.toISOString();
        result.period1End = thisMonthEnd.toISOString();
        result.period2Start = lastMonthStart.toISOString();
        result.period2End = lastMonthEnd.toISOString();
        result.period1Label = "This Month";
        result.period2Label = "Last Month";
        break;
      }
      case "this-week-vs-last": {
        const thisWeekEnd = new Date();
        const thisWeekStart = new Date();
        thisWeekStart.setDate(thisWeekStart.getDate() - 6);

        const lastWeekEnd = new Date(thisWeekStart);
        lastWeekEnd.setDate(lastWeekEnd.getDate() - 1);
        const lastWeekStart = new Date(lastWeekEnd);
        lastWeekStart.setDate(lastWeekStart.getDate() - 6);

        result.period1Start = thisWeekStart.toISOString();
        result.period1End = thisWeekEnd.toISOString();
        result.period2Start = lastWeekStart.toISOString();
        result.period2End = lastWeekEnd.toISOString();
        result.period1Label = "This Week";
        result.period2Label = "Last Week";
        break;
      }
      case "last-30-vs-previous": {
        const last30End = new Date();
        const last30Start = new Date();
        last30Start.setDate(last30Start.getDate() - 29);

        const prev30End = new Date(last30Start);
        prev30End.setDate(prev30End.getDate() - 1);
        const prev30Start = new Date(prev30End);
        prev30Start.setDate(prev30Start.getDate() - 29);

        result.period1Start = last30Start.toISOString();
        result.period1End = last30End.toISOString();
        result.period2Start = prev30Start.toISOString();
        result.period2End = prev30End.toISOString();
        result.period1Label = "Last 30 Days";
        result.period2Label = "Previous 30 Days";
        break;
      }
    }

    return result;
  };

  const comparisonDates = comparisonMode
    ? getComparisonDates(comparisonPeriod)
    : null;

  // ---- CSV Export -----------------------------------------------------------

  const handleExportCSV = () => {
    if (!responseTimeData || !staffPerformanceData || !priorityDistributionData)
      return;

    exportAnalyticsToCSV({
      responseTime: responseTimeData,
      staffPerformance: staffPerformanceData,
      priorityDistribution: priorityDistributionData,
      dateRange,
    });
  };

  // ---- Queries --------------------------------------------------------------

  const { data: responseTimeData, isLoading: responseTimeLoading } =
    trpc.analytics.getResponseTimeByPriority.useQuery(dateRange, {
      enabled: isAuthenticated && user?.role === "admin",
    });

  const { data: staffPerformanceData, isLoading: staffPerformanceLoading } =
    trpc.analytics.getStaffPerformance.useQuery(dateRange, {
      enabled: isAuthenticated && user?.role === "admin",
    });

  const {
    data: priorityDistributionData,
    isLoading: priorityDistributionLoading,
  } = trpc.analytics.getPriorityDistribution.useQuery(dateRange, {
    enabled: isAuthenticated && user?.role === "admin",
  });

  const { data: surveyData, isLoading: surveyLoading } =
    trpc.survey.analytics.useQuery(dateRange, {
      enabled: isAuthenticated && user?.role === "admin",
    });

  const { data: trendsData, isLoading: trendsLoading } =
    trpc.survey.trends.useQuery(
      { days: 30 },
      {
        enabled: isAuthenticated && user?.role === "admin" && !comparisonMode,
      }
    );

  const { data: comparisonData, isLoading: comparisonLoading } =
    trpc.survey.compare.useQuery(
      comparisonDates
        ? {
            period1Start: comparisonDates.period1Start,
            period1End: comparisonDates.period1End,
            period2Start: comparisonDates.period2Start,
            period2End: comparisonDates.period2End,
          }
        : {
            period1Start: "",
            period1End: "",
            period2Start: "",
            period2End: "",
          },
      {
        enabled:
          isAuthenticated &&
          user?.role === "admin" &&
          comparisonMode &&
          !!comparisonDates,
      }
    );

  // ---- Helpers --------------------------------------------------------------

  const formatTime = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      high: "text-red-400",
      medium: "text-yellow-400",
      low: "text-emerald-400",
    };
    return colors[priority as keyof typeof colors] || "text-slate-300";
  };

  // ---- Auth states ----------------------------------------------------------

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <Loader2 className="w-8 h-8 animate-spin text-slate-200" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-slate-50 p-4">
        <Card className="max-w-md w-full bg-slate-900/70 border-slate-700">
          <CardHeader>
            <CardTitle>Analytics Dashboard</CardTitle>
            <CardDescription className="text-slate-400">
              Log in to view performance, trends and satisfaction analytics.
            </CardDescription>
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
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-slate-50 p-4">
        <Card className="max-w-md w-full bg-slate-900/70 border-slate-700">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription className="text-slate-400">
              The analytics dashboard is restricted to administrators only.
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

  const isLoading =
    responseTimeLoading ||
    staffPerformanceLoading ||
    priorityDistributionLoading ||
    surveyLoading ||
    trendsLoading ||
    comparisonLoading;

  // ---- Main UI --------------------------------------------------------------

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500 mb-1">
              Insights
            </p>
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
              Analytics Dashboard
            </h1>
            <p className="text-sm text-slate-400 mt-2">
              Monitor response speed, staff performance and customer happiness
              in one place.
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Signed in as{" "}
              <span className="font-medium text-slate-200">
                {user?.name || user?.email}
              </span>
            </p>
          </div>

          <div className="flex flex-wrap gap-2 items-center justify-end">
            <DateRangePicker
              onDateRangeChange={(startDate, endDate) =>
                setDateRange({ startDate, endDate })
              }
            />
            <Button
              variant="outline"
              onClick={handleExportCSV}
              disabled={isLoading || !responseTimeData}
              className="border-slate-600 bg-slate-900/60 hover:bg-slate-800"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button asChild variant="outline" className="border-slate-600">
              <a href="/staff">Staff Dashboard</a>
            </Button>
          </div>
        </header>

        {/* Loading state */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-slate-200" />
          </div>
        ) : (
          <>
            {/* KPI cards */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-slate-900/60 border-slate-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Clock className="w-4 h-4 text-sky-400" />
                    Avg Response Time (High)
                  </CardTitle>
                  <span className="text-xs text-slate-400 uppercase tracking-wide">
                    Speed
                  </span>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-semibold">
                    {responseTimeData?.find((d) => d.priority === "high")
                      ?.count
                      ? formatTime(
                          responseTimeData.find(
                            (d) => d.priority === "high"
                          )!.avgResponseTime
                        )
                      : "N/A"}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    For high-priority requests
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-slate-900/60 border-slate-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <PieChart className="w-4 h-4 text-emerald-400" />
                    Total Requests
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-semibold">
                    {priorityDistributionData
                      ? priorityDistributionData.reduce(
                          (sum, item) => sum + item.count,
                          0
                        )
                      : 0}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Across all priority levels
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-slate-900/60 border-slate-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Users className="w-4 h-4 text-violet-400" />
                    Active Staff
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-semibold">
                    {staffPerformanceData?.length || 0}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Staff members with answered tickets
                  </p>
                </CardContent>
              </Card>
            </section>

            {/* Response Time + Priority Distribution */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Response time cards */}
              <Card className="bg-slate-900/60 border-slate-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm md:text-base">
                    <Clock className="w-4 h-4" />
                    Average Response Time by Priority
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    How quickly your team replies to different urgency levels.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {responseTimeData?.map((item) => (
                      <div
                        key={item.priority}
                        className="rounded-lg border border-slate-700/80 bg-slate-950/40 px-3 py-3"
                      >
                        <p
                          className={`text-xs font-semibold uppercase tracking-wide ${getPriorityColor(
                            item.priority
                          )}`}
                        >
                          {item.priority} priority
                        </p>
                        <p className="text-xl font-semibold mt-1">
                          {item.count > 0
                            ? formatTime(item.avgResponseTime)
                            : "N/A"}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-1">
                          {item.count} requests answered
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Priority distribution */}
              <Card className="bg-slate-900/60 border-slate-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm md:text-base">
                    <PieChart className="w-4 h-4" />
                    Request Priority Distribution
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Volume of requests by urgency.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {priorityDistributionData?.map((item) => (
                      <div
                        key={item.priority}
                        className="rounded-lg border border-slate-700/80 bg-slate-950/40 px-3 py-3"
                      >
                        <p
                          className={`text-xs font-semibold uppercase tracking-wide ${getPriorityColor(
                            item.priority
                          )}`}
                        >
                          {item.priority} priority
                        </p>
                        <p className="text-3xl font-semibold mt-1">
                          {item.count}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-1">
                          Total requests
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Staff Performance */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Staff Performance
                </h2>
              </div>

              {staffPerformanceData && staffPerformanceData.length > 0 ? (
                <Card className="bg-slate-900/60 border-slate-700">
                  <CardContent className="p-0">
                    <div className="overflow-x-auto rounded-b-xl">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-900/80 border-b border-slate-700">
                          <tr>
                            <th className="text-left p-4 font-semibold">
                              Staff Member
                            </th>
                            <th className="text-left p-4 font-semibold">
                              Requests Answered
                            </th>
                            <th className="text-left p-4 font-semibold">
                              Avg Response Time
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {staffPerformanceData.map((staff, index) => (
                            <tr
                              key={index}
                              className="border-b border-slate-800/70 last:border-b-0 hover:bg-slate-900/80"
                            >
                              <td className="p-4 font-medium text-slate-100">
                                {staff.staffName}
                              </td>
                              <td className="p-4 text-slate-200">
                                {staff.totalAnswered}
                              </td>
                              <td className="p-4 text-slate-200">
                                {formatTime(staff.avgResponseTime)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="bg-slate-900/60 border-slate-700">
                  <CardContent className="p-8 text-center text-slate-400">
                    No staff performance data yet. Once your team starts
                    answering requests, you&apos;ll see metrics here.
                  </CardContent>
                </Card>
              )}
            </section>

            {/* Performance Summary */}
            <Card className="bg-sky-950/40 border-sky-700/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-sky-300" />
                  Performance Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                {responseTimeData && priorityDistributionData ? (
                  <p className="text-sm text-slate-100">
                    Your team has processed{" "}
                    <span className="font-semibold">
                      {priorityDistributionData.reduce(
                        (sum, item) => sum + item.count,
                        0
                      )}
                    </span>{" "}
                    requests in the selected date range. High-priority tickets
                    are handled in{" "}
                    <span className="font-semibold">
                      {responseTimeData.find((d) => d.priority === "high")
                        ?.count
                        ? formatTime(
                            responseTimeData.find(
                              (d) => d.priority === "high"
                            )!.avgResponseTime
                          )
                        : "N/A"}
                    </span>{" "}
                    on average. Use this panel together with satisfaction
                    metrics below to spot bottlenecks and celebrate wins.
                  </p>
                ) : (
                  <p className="text-sm text-slate-300">
                    Not enough data yet to build a summary.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Customer Satisfaction Section */}
            <section className="space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Customer Satisfaction
              </h2>

              {surveyData ? (
                <div className="space-y-4">
                  {/* Top satisfaction KPIs */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="bg-slate-900/60 border-slate-700">
                      <CardHeader>
                        <CardTitle className="text-sm font-medium">
                          Total Surveys
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-3xl font-semibold">
                          {surveyData.totalSurveys}
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="bg-slate-900/60 border-slate-700">
                      <CardHeader>
                        <CardTitle className="text-sm font-medium">
                          Average Rating
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-3xl font-semibold">
                          {surveyData.averageRating.toFixed(1)} / 5.0
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="bg-slate-900/60 border-slate-700">
                      <CardHeader>
                        <CardTitle className="text-sm font-medium">
                          Satisfaction Rate
                        </CardTitle>
                        <CardDescription className="text-slate-400">
                          Percentage of 4–5 star ratings
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-3xl font-semibold">
                          {surveyData.totalSurveys > 0
                            ? Math.round(
                                ((surveyData.ratingDistribution[4] +
                                  surveyData.ratingDistribution[5]) /
                                  surveyData.totalSurveys) *
                                  100
                              )
                            : 0}
                          %
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Trends / Comparison */}
                  <Card className="bg-slate-900/60 border-slate-700">
                    <CardHeader>
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                          <CardTitle>
                            {comparisonMode
                              ? "Satisfaction Trends – Comparison"
                              : "Satisfaction Trends (Last 30 Days)"}
                          </CardTitle>
                          <CardDescription className="text-slate-400">
                            {comparisonMode
                              ? "Compare two time periods to see how your rating is moving."
                              : "Daily average rating, including days without responses."}
                          </CardDescription>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant={comparisonMode ? "default" : "outline"}
                            size="sm"
                            onClick={() =>
                              setComparisonMode((prev) => !prev)
                            }
                          >
                            {comparisonMode ? "Exit Comparison" : "Compare"}
                          </Button>
                        </div>
                      </div>

                      {comparisonMode && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant={
                              comparisonPeriod === "this-month-vs-last"
                                ? "default"
                                : "outline"
                            }
                            onClick={() =>
                              setComparisonPeriod("this-month-vs-last")
                            }
                          >
                            This Month vs Last
                          </Button>
                          <Button
                            size="sm"
                            variant={
                              comparisonPeriod === "this-week-vs-last"
                                ? "default"
                                : "outline"
                            }
                            onClick={() =>
                              setComparisonPeriod("this-week-vs-last")
                            }
                          >
                            This Week vs Last
                          </Button>
                          <Button
                            size="sm"
                            variant={
                              comparisonPeriod === "last-30-vs-previous"
                                ? "default"
                                : "outline"
                            }
                            onClick={() =>
                              setComparisonPeriod("last-30-vs-previous")
                            }
                          >
                            Last 30 vs Previous 30
                          </Button>
                        </div>
                      )}
                    </CardHeader>

                    <CardContent>
                      {comparisonMode && comparisonData ? (
                        <>
                          {/* Comparison metrics */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            <div className="p-4 rounded-lg border border-slate-700 bg-slate-950/40">
                              <p className="text-xs text-slate-400">
                                Rating Change
                              </p>
                              <p
                                className={`text-2xl font-semibold ${
                                  comparisonData.comparison.ratingChange > 0
                                    ? "text-emerald-400"
                                    : comparisonData.comparison.ratingChange <
                                      0
                                    ? "text-red-400"
                                    : "text-slate-100"
                                }`}
                              >
                                {comparisonData.comparison.ratingChange > 0
                                  ? "+"
                                  : ""}
                                {comparisonData.comparison.ratingChange}
                              </p>
                            </div>
                            <div className="p-4 rounded-lg border border-slate-700 bg-slate-950/40">
                              <p className="text-xs text-slate-400">
                                Percentage Change
                              </p>
                              <p
                                className={`text-2xl font-semibold ${
                                  comparisonData.comparison.percentageChange >
                                  0
                                    ? "text-emerald-400"
                                    : comparisonData.comparison
                                        .percentageChange < 0
                                    ? "text-red-400"
                                    : "text-slate-100"
                                }`}
                              >
                                {comparisonData.comparison.percentageChange > 0
                                  ? "+"
                                  : ""}
                                {comparisonData.comparison.percentageChange}%
                              </p>
                            </div>
                            <div className="p-4 rounded-lg border border-slate-700 bg-slate-950/40">
                              <p className="text-xs text-slate-400">
                                Survey Count Change
                              </p>
                              <p className="text-2xl font-semibold text-slate-100">
                                {comparisonData.comparison.surveyCountChange >
                                0
                                  ? "+"
                                  : ""}
                                {
                                  comparisonData.comparison
                                    .surveyCountChange
                                }
                              </p>
                            </div>
                          </div>

                          {/* Comparison chart */}
                          <ResponsiveContainer width="100%" height={320}>
                            <LineChart>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis
                                dataKey="date"
                                type="category"
                                tickFormatter={(value) => {
                                  const date = new Date(value as string);
                                  return `${date.getMonth() + 1}/${date.getDate()}`;
                                }}
                              />
                              <YAxis
                                domain={[0, 5]}
                                ticks={[0, 1, 2, 3, 4, 5]}
                              />
                              <Tooltip
                                labelFormatter={(value) => {
                                  const date = new Date(value as string);
                                  return date.toLocaleDateString();
                                }}
                              />
                              <Legend />
                              <Line
                                data={comparisonData.period1.trends}
                                type="monotone"
                                dataKey="averageRating"
                                stroke="#38bdf8"
                                strokeWidth={2}
                                dot={{ r: 3 }}
                                connectNulls
                                name={
                                  comparisonDates?.period1Label || "Period 1"
                                }
                              />
                              <Line
                                data={comparisonData.period2.trends}
                                type="monotone"
                                dataKey="averageRating"
                                stroke="#f97316"
                                strokeWidth={2}
                                dot={{ r: 3 }}
                                connectNulls
                                name={
                                  comparisonDates?.period2Label || "Period 2"
                                }
                              />
                            </LineChart>
                          </ResponsiveContainer>

                          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-300">
                            <div className="p-3 rounded-lg bg-sky-950/60 border border-sky-800/70">
                              <p className="font-semibold">
                                {comparisonDates?.period1Label}
                              </p>
                              <p className="mt-1">
                                Average rating{" "}
                                {
                                  comparisonData.period1.stats
                                    .averageRating
                                }{" "}
                                from{" "}
                                {comparisonData.period1.stats.totalSurveys}{" "}
                                surveys.
                              </p>
                            </div>
                            <div className="p-3 rounded-lg bg-amber-950/60 border border-amber-800/70">
                              <p className="font-semibold">
                                {comparisonDates?.period2Label}
                              </p>
                              <p className="mt-1">
                                Average rating{" "}
                                {
                                  comparisonData.period2.stats
                                    .averageRating
                                }{" "}
                                from{" "}
                                {comparisonData.period2.stats.totalSurveys}{" "}
                                surveys.
                              </p>
                            </div>
                          </div>
                        </>
                      ) : !comparisonMode &&
                        trendsData &&
                        trendsData.length > 0 ? (
                        <>
                          <ResponsiveContainer width="100%" height={320}>
                            <LineChart data={trendsData}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis
                                dataKey="date"
                                tickFormatter={(value) => {
                                  const date = new Date(value);
                                  return `${date.getMonth() + 1}/${date.getDate()}`;
                                }}
                              />
                              <YAxis
                                domain={[0, 5]}
                                ticks={[0, 1, 2, 3, 4, 5]}
                              />
                              <Tooltip
                                labelFormatter={(value) => {
                                  const date = new Date(value as string);
                                  return date.toLocaleDateString();
                                }}
                                formatter={(value: any, name: string) => {
                                  if (name === "averageRating") {
                                    return value !== null
                                      ? [value, "Average Rating"]
                                      : ["No data", "Average Rating"];
                                  }
                                  return [value, name];
                                }}
                              />
                              <Legend />
                              <Line
                                type="monotone"
                                dataKey="averageRating"
                                stroke="#38bdf8"
                                strokeWidth={2}
                                dot={{ r: 3 }}
                                connectNulls
                                name="Average Rating"
                              />
                            </LineChart>
                          </ResponsiveContainer>
                          <p className="mt-3 text-xs text-slate-400">
                            Each point represents the average rating for that
                            day. Days without responses are connected so you
                            can still see the overall trend.
                          </p>
                        </>
                      ) : (
                        <p className="text-center text-slate-400 py-8 text-sm">
                          No trend data available yet.
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Rating distribution */}
                  <Card className="bg-slate-900/60 border-slate-700">
                    <CardHeader>
                      <CardTitle>Rating Distribution</CardTitle>
                      <CardDescription className="text-slate-400">
                        How ratings are spread across 1–5 stars.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {[5, 4, 3, 2, 1].map((rating) => (
                          <div
                            key={rating}
                            className="flex items-center gap-3 text-sm"
                          >
                            <span className="w-20 text-slate-300">
                              {rating} star{rating !== 1 && "s"}
                            </span>
                            <div className="flex-1 bg-slate-800 rounded-full h-6 overflow-hidden">
                              <div
                                className="bg-sky-500 h-full flex items-center justify-end pr-2 transition-all"
                                style={{
                                  width:
                                    surveyData.totalSurveys > 0
                                      ? `${
                                          (surveyData.ratingDistribution[
                                            rating as 1 | 2 | 3 | 4 | 5
                                          ] /
                                            surveyData.totalSurveys) *
                                          100
                                        }%`
                                      : "0%",
                                }}
                              >
                                {surveyData.ratingDistribution[
                                  rating as 1 | 2 | 3 | 4 | 5
                                ] > 0 && (
                                  <span className="text-[11px] text-slate-50 font-medium">
                                    {
                                      surveyData.ratingDistribution[
                                        rating as 1 | 2 | 3 | 4 | 5
                                      ]
                                    }
                                  </span>
                                )}
                              </div>
                            </div>
                            <span className="w-10 text-right text-xs text-slate-400">
                              {
                                surveyData.ratingDistribution[
                                  rating as 1 | 2 | 3 | 4 | 5
                                ]
                              }
                            </span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Recent feedback */}
                  {surveyData.recentFeedback.length > 0 && (
                    <Card className="bg-slate-900/60 border-slate-700">
                      <CardHeader>
                        <CardTitle>Recent Feedback</CardTitle>
                        <CardDescription className="text-slate-400">
                          A sample of the latest written comments.
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {surveyData.recentFeedback.map((item, idx) => (
                            <div
                              key={idx}
                              className="p-4 rounded-lg border border-slate-700 bg-slate-950/40"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-semibold text-slate-100">
                                  {item.rating} / 5 stars
                                </span>
                                <span className="text-xs text-slate-400">
                                  {new Date(
                                    item.createdAt
                                  ).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-sm text-slate-200">
                                {item.feedback}
                              </p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              ) : (
                <Card className="bg-slate-900/60 border-slate-700">
                  <CardContent className="p-8 text-center text-slate-400 text-sm">
                    No survey data yet. Once customers start filling out the
                    satisfaction survey after conversations, their feedback will
                    appear here.
                  </CardContent>
                </Card>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
