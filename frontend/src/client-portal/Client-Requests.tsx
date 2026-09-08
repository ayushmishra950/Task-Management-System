import React, { useEffect, useMemo, useState } from "react";
import { Plus, Search, Edit, Trash2, Eye, Loader2, Inbox } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Helmet } from "react-helmet-async";
import { useToast } from "@/hooks/use-toast";
import DeleteCard from "@/components/cards/DeleteCard";
import ClientRequestForm from "./forms/ClientRequestForm";
import ClientRequestDetailCard from "./cards/ClientRequestDetailCard";
import { socket } from "@/socket/socket";
import {
  formatDateTime,
  getPriorityColor,
  getClientRequestStatusColor,
  clientRequestStatusLabel,
  clientRequestTypeLabel,
} from "@/services/allFunctions";
import {
  useGetMyClientRequestsQuery,
  useDeleteMyClientRequestMutation,
} from "@/redux-toolkit/api/client/clientRequest.api";

const ClientRequests: React.FC = () => {
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [initialData, setInitialData] = useState<any | null>(null);
  const [detailRequest, setDetailRequest] = useState<any | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const { data, refetch, isLoading } = useGetMyClientRequestsQuery();
  const [deleteRequest, { isLoading: isDeleting }] = useDeleteMyClientRequestMutation();

  const requests = data?.data || [];

  // Admin review kare to list turant update ho
  useEffect(() => {
    const handleChange = () => refetch();

    socket.on("clientRequest:changed", handleChange);
    socket.on("notification", handleChange);

    return () => {
      socket.off("clientRequest:changed", handleChange);
      socket.off("notification", handleChange);
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
        request.projectId?.name?.toLowerCase().includes(term);

      return matchesStatus && matchesSearch;
    });
  }, [requests, search, filterStatus]);

  const handleDelete = async () => {
    if (!deleteTargetId) return;

    try {
      const res = await deleteRequest({ id: deleteTargetId }).unwrap();
      toast({ title: "Request Withdrawn", description: res?.message || "Success" });
    } catch (err: any) {
      toast({
        title: "Withdraw Failed",
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
        <title>My Requests</title>
      </Helmet>

      <DeleteCard
        isOpen={Boolean(deleteTargetId)}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
        title="Withdraw this request?"
        message="This request will be removed and the admin will be notified. Only pending requests can be withdrawn."
      />

      <ClientRequestForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setInitialData(null);
        }}
        initialData={initialData}
      />

      <ClientRequestDetailCard request={detailRequest} isOpen={Boolean(detailRequest)} onClose={() => setDetailRequest(null)} />

      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base">My Requests</CardTitle>
            <CardDescription>Everything you have asked the admin for, and its current status.</CardDescription>
          </div>
          <Button
            onClick={() => {
              setInitialData(null);
              setIsFormOpen(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" /> New Request
          </Button>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search by title, description or project"
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
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Project</TableHead>
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
                      No requests found.
                    </TableCell>
                  </TableRow>
                )}

                {filteredRequests.map((request: any) => (
                  <TableRow key={request._id}>
                    <TableCell className="font-medium max-w-[240px] truncate">{request.title}</TableCell>
                    <TableCell>{clientRequestTypeLabel(request.requestType)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {request.projectId?.name || request.linkedProjectId?.name || "—"}
                    </TableCell>
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
                        <Button variant="ghost" size="icon" onClick={() => setDetailRequest(request)}>
                          <Eye className="w-4 h-4" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={request.status !== "pending"}
                          title={request.status !== "pending" ? "Already under review" : "Edit request"}
                          onClick={() => {
                            setInitialData(request);
                            setIsFormOpen(true);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          disabled={request.status !== "pending"}
                          title={request.status !== "pending" ? "Already under review" : "Withdraw request"}
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
