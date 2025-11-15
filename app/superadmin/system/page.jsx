"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function SystemHealthPage() {
  const healthStatus = useQuery(api.systemHealth.getHealthStatus);
  const dbStats = useQuery(api.systemHealth.getDatabaseStats);
  const recentErrors = useQuery(api.systemHealth.getRecentErrors);
  const performanceMetrics = useQuery(api.systemHealth.getPerformanceMetrics);
  const orgMetrics = useQuery(api.systemHealth.getOrganizationMetrics);

  const getStatusColor = (status) => {
    switch (status) {
      case "healthy":
      case "excellent":
      case "active":
        return "text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30";
      case "good":
      case "degraded":
        return "text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30";
      case "slow":
      case "unhealthy":
        return "text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30";
      default:
        return "text-muted-foreground bg-muted";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">System Health</h2>
        <p className="text-muted-foreground">Monitor database status, API performance, and system metrics</p>
      </div>

      {/* Overall Health Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border rounded-lg p-6">
          <div className="text-sm text-muted-foreground mb-2">System Status</div>
          {healthStatus ? (
            <div className="flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  healthStatus.status === "healthy"
                    ? "bg-emerald-500"
                    : healthStatus.status === "degraded"
                    ? "bg-yellow-500"
                    : "bg-red-500"
                }`}
              />
              <span className="text-2xl font-bold capitalize">{healthStatus.status}</span>
            </div>
          ) : (
            <div className="h-8 animate-pulse bg-muted rounded" />
          )}
        </div>

        <div className="bg-card border rounded-lg p-6">
          <div className="text-sm text-muted-foreground mb-2">Database Status</div>
          {healthStatus ? (
            <>
              <div className="text-2xl font-bold capitalize mb-1">
                {healthStatus.database.status}
              </div>
              <div className="text-xs text-muted-foreground">
                Latency: {healthStatus.database.latency}ms
              </div>
            </>
          ) : (
            <div className="h-8 animate-pulse bg-muted rounded" />
          )}
        </div>

        <div className="bg-card border rounded-lg p-6">
          <div className="text-sm text-muted-foreground mb-2">Total Records</div>
          {dbStats ? (
            <div className="text-2xl font-bold">{dbStats.totalRecords.toLocaleString()}</div>
          ) : (
            <div className="h-8 animate-pulse bg-muted rounded" />
          )}
        </div>
      </div>

      {/* Database Statistics */}
      <div className="bg-card border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Database Statistics</h3>
        {dbStats ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {Object.entries(dbStats.tables).map(([table, count]) => (
              <div key={table} className="bg-muted/50 rounded-lg p-4">
                <div className="text-xs text-muted-foreground capitalize mb-1">{table}</div>
                <div className="text-xl font-bold">{count.toLocaleString()}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-24 animate-pulse bg-muted rounded" />
        )}
        {dbStats && (
          <div className="mt-4 text-xs text-muted-foreground">
            Query time: {dbStats.queryTime}ms • Last updated: {new Date(dbStats.timestamp).toLocaleString()}
          </div>
        )}
      </div>

      {/* Performance Metrics */}
      <div className="bg-card border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Query Performance</h3>
        {performanceMetrics ? (
          <>
            <div className="mb-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Average Query Time:</span>
                <span className="font-semibold">{performanceMetrics.averageQueryTime.toFixed(2)}ms</span>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                    performanceMetrics.status
                  )}`}
                >
                  {performanceMetrics.status}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              {performanceMetrics.metrics.map((metric) => (
                <div key={metric.query} className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-sm font-mono">{metric.query}</span>
                  <span className="text-sm font-semibold">{metric.duration}ms</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="h-32 animate-pulse bg-muted rounded" />
        )}
      </div>

      {/* Organization Metrics */}
      <div className="bg-card border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Organization Metrics</h3>
        {orgMetrics ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="text-sm text-muted-foreground">Total Organizations</div>
                <div className="text-2xl font-bold mt-1">{orgMetrics.totalOrganizations}</div>
              </div>
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="text-sm text-muted-foreground">Active Organizations</div>
                <div className="text-2xl font-bold mt-1">{orgMetrics.activeOrganizations}</div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">
                      Organization
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">
                      Total Users
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">
                      Active Users
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">
                      Recent Activity
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {orgMetrics.organizations.map((org) => (
                    <tr key={org.orgId}>
                      <td className="px-4 py-3 text-sm font-medium">{org.orgName}</td>
                      <td className="px-4 py-3 text-sm">{org.totalUsers}</td>
                      <td className="px-4 py-3 text-sm">{org.activeUsers}</td>
                      <td className="px-4 py-3 text-sm">{org.recentActivityCount}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(org.status)}`}>
                          {org.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="h-64 animate-pulse bg-muted rounded" />
        )}
      </div>

      {/* Recent Errors */}
      <div className="bg-card border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Errors</h3>
        {recentErrors ? (
          <>
            <div className="mb-4">
              <span className="text-sm text-muted-foreground">
                Total errors in last 1000 logs:{" "}
                <span className="font-semibold">{recentErrors.totalErrors}</span>
              </span>
            </div>
            {recentErrors.recentErrors.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border">
                  <thead>
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">
                        Timestamp
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">
                        User
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">
                        Action
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">
                        Details
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {recentErrors.recentErrors.map((error) => (
                      <tr key={error._id}>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {new Date(error.timestamp).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-sm">{error.userName}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300">
                            {error.action}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {error.details ? (
                            <details className="cursor-pointer">
                              <summary className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300">
                                View
                              </summary>
                              <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto max-w-md">
                                {error.details}
                              </pre>
                            </details>
                          ) : (
                            "—"
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <span className="text-4xl mb-2 block">✅</span>
                <p className="text-muted-foreground">No errors found</p>
              </div>
            )}
          </>
        ) : (
          <div className="h-48 animate-pulse bg-muted rounded" />
        )}
      </div>
    </div>
  );
}
