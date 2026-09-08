import React, { useEffect, useMemo, useState } from "react";
import { Search, Trash2, Eye, Loader2, Inbox, Radio } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Helmet } from "react-helmet-async";
import { useToast } from "@/hooks/use-toast";
import DeleteCard from "@/components/cards/DeleteCard";
import ClientRequestReviewCard from "./cards/ClientRequestReviewCard";
import { socket } from "@/socket/socket";
import {
  formatDateTime,
  getPriorityColor,
  getClientRequestStatusColor,
  clientRequestStatusLabel,
  clientRequestTypeLabel,
} from "@/services/allFunctions";
import {
  useGetAllClientRequestsQuery,
  useDeleteClientRequestMutation,
} from "@/redux-toolkit/api/admin/clientRequest.api";

const ClientRequests: React.FC = () => {
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [reviewRequest, setReviewRequest] = useState<any | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [liveCount, setLiveCount] = useState(0);

  const { data, refetch, isLoading } = useGetAllClientRequestsQuery(undefined, {
    skip: user?.role !== "admin",
  });

  const [deleteClientRequest, { isLoading: isDeleting }] = useDeleteClientRequestMutation();

  const requests = data?.data || [];
  const pendingCount = data?.pendingCount ?? 0;

  // Client koi request bheje ya update kare to admin ki list turant refresh ho
  useEffect(() => {
    const handleChange = (payload: any) => {
      refetch();

      if (payload?.action === "created") setLiveCount((prev) => prev + 1);
    };

    const handleNotification = (notification: any) => {
      if (notification?.entityType === "ClientRequest") refetch();
    };

    socket.on("clientRequest:changed", handleChange);
    socket.on("notification", handleNotification);

    return () => {
      socket.off("clientRequest:changed", handleChange);
      socket.off("notification", handleNotification);
    };
  }, [refetch]);

  const filteredRequests = useMemo(() => {
    const term = search.trim().toLowerCase();

    return requests.filter((request: any) => {
      const matchesStatus = filterStatus === "all" || request.status === filterStatus;
      const matchesSearch =
        !term ||
        request.title?.toLowerCase().includes(term) ||
        request.description?.toLowerCase().includes(term) ||
        request.clientId?.fullName?.toLowerCase().includes(term) ||
        request.clientId?.clientCompanyName?.toLowerCase().includes(term) ||
        request.projectId?.name?.toLowerCase().includes(term);

      return matchesStatus && matchesSearch;
    });
  }, [requests, search, filterStatus]);

  const handleDelete = async () => {
    if (!deleteTargetId) return;

    try {
      const res = await deleteClientRequest({ id: deleteTargetId }).unwrap();
      toast({ title: "Request Deleted", description: res?.message || "Success" });
    } catch (err: any) {
      toast({
        title: "Delete Failed",
        description: err?.data?.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setDeleteTargetId(null);
    }
  };

  return (
    <>
      <Helmet>
        <title>Client Requests</title>
      </Helmet>

      <DeleteCard
        isOpen={Boolean(deleteTargetId)}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
        title="Delete this request?"
        message="The request will be permanently removed from the inbox."
      />

      <ClientRequestReviewCard
        request={reviewRequest}
        isOpen={Boolean(reviewRequest)}
        onClose={() => setReviewRequest(null)}
      />

      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              Client Requests
              {pendingCount > 0 && (
                <Badge className="bg-yellow-100 text-yellow-800" variant="secondary">
                  {pendingCount} pending
                </Badge>
              )}
            </CardTitle>
            <CardDescription>Requests raised by your clients — they land here live.</CardDescription>
          </div>

          {liveCount > 0 && (
            <Button
              variant="secondary"
              onClick={() => {
                setLiveCount(0);
                refetch();
              }}
            >
              <Radio className="w-4 h-4 mr-2 text-green-600" />
              {liveCount} new request{liveCount > 1 ? "s" : ""}
            </Button>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search by client, title or project"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="sm:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_review">In Review</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Request</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Raised On</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10">
                      <Loader2 className="w-5 h-5 animate-spin mx-auto text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                )}

                {!isLoading && filteredRequests.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                      <Inbox className="w-8 h-8 mx-auto mb-2 opacity-40" />
                      No client request yet.
                    </TableCell>
                  </TableRow>
                )}

                {filteredRequests.map((request: any) => (
                  <TableRow
                    key={request._id}
                    className={request.status === "pending" ? "bg-yellow-50/40" : undefined}
                  >
                    <TableCell>
                      <p className="font-medium">{request.clientId?.fullName || "—"}</p>
                      {request.clientId?.clientCompanyName && (
                        <p className="text-xs text-muted-foreground mt-0.5">{request.clientId.clientCompanyName}</p>
                      )}
                    </TableCell>
                    <TableCell className="max-w-[220px]">
                      <p className="font-medium truncate">{request.title}</p>
                      {(request.projectId?.name || request.linkedProjectId?.name) && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {request.projectId?.name || request.linkedProjectId?.name}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>{clientRequestTypeLabel(request.requestType)}</TableCell>
                    <TableCell>
                      <Badge className={getPriorityColor(request.priority)} variant="secondary">
                        {request.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getClientRequestStatusColor(request.status)} variant="secondary">
                        {clientRequestStatusLabel(request.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground whitespace-nowrap">
                      {formatDateTime(request.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" title="Review" onClick={() => setReviewRequest(request)}>
                          <Eye className="w-4 h-4" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          title="Delete"
                          onClick={() => setDeleteTargetId(request._id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default ClientRequests;
