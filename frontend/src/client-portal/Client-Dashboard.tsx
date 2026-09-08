import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Inbox, Clock, Eye, CheckCircle2, XCircle, FolderKanban, Plus, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Helmet } from "react-helmet-async";
import { socket } from "@/socket/socket";
import {
  formatDateTime,
  getPriorityColor,
  getClientRequestStatusColor,
  clientRequestStatusLabel,
  clientRequestTypeLabel,
} from "@/services/allFunctions";
import {
  useClientDashboardSummaryQuery,
  useGetMyClientRequestsQuery,
} from "@/redux-toolkit/api/client/clientRequest.api";

const ClientDashboard: React.FC = () => {
  const navigate = useNavigate();

  const { data: summaryData, refetch: refetchSummary, isLoading: isSummaryLoading } = useClientDashboardSummaryQuery();
  const { data: requestData, refetch: refetchRequests } = useGetMyClientRequestsQuery();

  const summary = summaryData?.data || {};
  const recentRequests = (requestData?.data || []).slice(0, 5);

  // Admin request review kare to dashboard turant update ho jaye
  useEffect(() => {
    const handleChange = () => {
      refetchSummary();
      refetchRequests();
    };

    socket.on("clientProject:changed", handleChange);
    socket.on("clientRequest:changed", handleChange);
    socket.on("notification", handleChange);

    return () => {
      socket.off("clientProject:changed", handleChange);
      socket.off("clientRequest:changed", handleChange);
      socket.off("notification", handleChange);
    };
  }, [refetchSummary, refetchRequests]);

  const stats = [
    { label: "Total Requests", value: summary.total ?? 0, icon: Inbox, color: "text-blue-600 bg-blue-50" },
    { label: "Pending", value: summary.pending ?? 0, icon: Clock, color: "text-yellow-600 bg-yellow-50" },
    { label: "In Review", value: summary.inReview ?? 0, icon: Eye, color: "text-indigo-600 bg-indigo-50" },
    { label: "Approved", value: summary.approved ?? 0, icon: CheckCircle2, color: "text-emerald-600 bg-emerald-50" },
    { label: "Rejected", value: summary.rejected ?? 0, icon: XCircle, color: "text-red-600 bg-red-50" },
    { label: "My Projects", value: summary.projects ?? 0, icon: FolderKanban, color: "text-purple-600 bg-purple-50" },
  ];

  return (
    <>
      <Helmet>
        <title>Client Dashboard</title>
      </Helmet>

      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">Welcome back</h2>
            <p className="text-sm text-muted-foreground">
              Raise a new project request or ask for an update — your admin gets it instantly.
            </p>
          </div>
          <Button onClick={() => navigate("/client/requests")}>
            <Plus className="w-4 h-4 mr-2" /> New Request
          </Button>
        </div>

        <div className="grid gap-4 grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {stats.map((stat) => (
            <Card key={stat.label}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.color}`}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold leading-none">
                    {isSummaryLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : stat.value}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Requests</CardTitle>
            <CardDescription>Your latest 5 requests and where they stand.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentRequests.length === 0 && (
              <p className="text-sm text-muted-foreground py-6 text-center">
                You haven't raised any request yet.
              </p>
            )}

            {recentRequests.map((request: any) => (
              <div
                key={request._id}
                onClick={() => navigate("/client/requests")}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/50 transition-colors"
              >
                <div className="min-w-0">
                  <p className="font-medium truncate">{request.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {clientRequestTypeLabel(request.requestType)}
                    {request.projectId?.name ? ` · ${request.projectId.name}` : ""} · {formatDateTime(request.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getPriorityColor(request.priority)} variant="secondary">
                    {request.priority}
                  </Badge>
                  <Badge className={getClientRequestStatusColor(request.status)} variant="secondary">
                    {clientRequestStatusLabel(request.status)}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default ClientDashboard;
