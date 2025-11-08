import { format } from "date-fns";

interface ResponseTimeData {
  priority: string;
  avgResponseTime: number;
  count: number;
}

interface StaffPerformanceData {
  staffName: string;
  avgResponseTime: number;
  totalAnswered: number;
}

interface PriorityDistributionData {
  priority: string;
  count: number;
}

interface AnalyticsData {
  responseTime: ResponseTimeData[];
  staffPerformance: StaffPerformanceData[];
  priorityDistribution: PriorityDistributionData[];
  dateRange?: {
    startDate?: string;
    endDate?: string;
  };
}

/**
 * Convert milliseconds to human-readable time format
 */
function formatTime(ms: number): string {
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

/**
 * Convert analytics data to CSV format and trigger download
 */
export function exportAnalyticsToCSV(data: AnalyticsData) {
  const { responseTime, staffPerformance, priorityDistribution, dateRange } = data;

  // Build CSV content
  let csvContent = "";

  // Add header with date range
  csvContent += "Analytics Report\n";
  if (dateRange?.startDate && dateRange?.endDate) {
    csvContent += `Date Range: ${format(new Date(dateRange.startDate), "MMM d, yyyy")} - ${format(new Date(dateRange.endDate), "MMM d, yyyy")}\n`;
  } else {
    csvContent += "Date Range: All Time\n";
  }
  csvContent += `Generated: ${format(new Date(), "MMM d, yyyy HH:mm")}\n`;
  csvContent += "\n";

  // Response Time by Priority section
  csvContent += "Response Time by Priority\n";
  csvContent += "Priority,Average Response Time,Request Count\n";
  responseTime.forEach((row) => {
    csvContent += `${row.priority},${formatTime(row.avgResponseTime)},${row.count}\n`;
  });
  csvContent += "\n";

  // Staff Performance section
  csvContent += "Staff Performance\n";
  csvContent += "Staff Name,Average Response Time,Requests Answered\n";
  staffPerformance.forEach((row) => {
    csvContent += `${row.staffName},${formatTime(row.avgResponseTime)},${row.totalAnswered}\n`;
  });
  csvContent += "\n";

  // Priority Distribution section
  csvContent += "Priority Distribution\n";
  csvContent += "Priority,Total Requests\n";
  priorityDistribution.forEach((row) => {
    csvContent += `${row.priority},${row.count}\n`;
  });

  // Create blob and download
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  // Generate filename with date range
  let filename = "analytics-report";
  if (dateRange?.startDate && dateRange?.endDate) {
    const start = format(new Date(dateRange.startDate), "yyyy-MM-dd");
    const end = format(new Date(dateRange.endDate), "yyyy-MM-dd");
    filename += `-${start}-to-${end}`;
  } else {
    filename += `-all-time`;
  }
  filename += `.csv`;

  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
