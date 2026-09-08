import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, FolderPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  formatDateTime,
  formatForDateTimeInput,
  getPriorityColor,
  getClientRequestStatusColor,
  clientRequestStatusLabel,
  clientRequestTypeLabel,
} from "@/services/allFunctions";
import {
  useReviewClientRequestMutation,
  useConvertRequestToProjectMutation,
} from "@/redux-toolkit/api/admin/clientRequest.api";

interface ClientRequestReviewCardProps {
  request: any | null;
  isOpen: boolean;
  onClose: () => void;
}

const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="grid grid-cols-3 gap-3 py-2 border-b last:border-b-0">
    <span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
    <span className="col-span-2 text-sm break-words">{children}</span>
  </div>
);

const ClientRequestReviewCard: React.FC<ClientRequestReviewCardProps> = ({ request, isOpen, onClose }) => {
  const { toast } = useToast();

  const [status, setStatus] = useState("pending");
  const [adminRemarks, setAdminRemarks] = useState("");
  const [showConvert, setShowConvert] = useState(false);
  const [projectForm, setProjectForm] = useState({ name: "", startDate: "", endDate: "", url: "" });

  const [reviewRequest, { isLoading: isReviewing }] = useReviewClientRequestMutation();
  const [convertRequest, { isLoading: isConverting }] = useConvertRequestToProjectMutation();

  useEffect(() => {
    if (!isOpen || !request) return;

    setStatus(request.status || "pending");
    setAdminRemarks(request.adminRemarks || "");
    setShowConvert(false);
    setProjectForm({
      name: request.title || "",
      startDate: "",
      endDate: request.expectedDate ? formatForDateTimeInput(request.expectedDate) : "",
      url: request.referenceUrl || "",
    });
  }, [isOpen, request]);

  if (!request) return null;

  const canConvert = request.requestType === "new_project" && !request.linkedProjectId;

  const handleReview = async () => {
    try {
      const res = await reviewRequest({ id: request._id, body: { status, adminRemarks } }).unwrap();
      toast({ title: "Status Updated", description: res?.message || "The client has been notified." });
      onClose();
    } catch (err: any) {
      toast({
        title: "Update Failed",
        description: err?.data?.errors?.[0]?.message || err?.data?.message || "Something went wrong",
        variant: "destructive",
      });
    }
  };

  const handleConvert = async () => {
    if (!projectForm.name.trim()) {
      toast({ title: "Required Field Missing", description: "Project name is required.", variant: "destructive" });
      return;
    }

    const body: any = { name: projectForm.name.trim() };

    if (projectForm.startDate) body.startDate = projectForm.startDate;
    if (projectForm.endDate) body.endDate = projectForm.endDate;
    if (projectForm.url.trim()) body.url = projectForm.url.trim();

    try {
      const res = await convertRequest({ id: request._id, body }).unwrap();
      toast({ title: "Project Created", description: res?.message || "The client has been notified." });
      onClose();
    } catch (err: any) {
      toast({
        title: "Convert Failed",
        description: err?.data?.errors?.[0]?.message || err?.data?.message || "Something went wrong",
        variant: "destructive",
      });
    }
  };

  const loading = isReviewing || isConverting;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[620px] w-[92vw] max-h-[90vh] p-0 gap-0 rounded-lg overflow-hidden flex flex-col">
        <DialogHeader className="px-5 pt-5 pb-3 border-b shrink-0">
          <DialogTitle className="text-lg font-semibold">{request.title}</DialogTitle>
        </DialogHeader>

        <div className="px-5 py-4 space-y-5 overflow-y-auto">
          <div className="divide-y">
            <Row label="Client">
              {request.clientId?.fullName || "—"}
              {request.clientId?.clientCompanyName ? ` · ${request.clientId.clientCompanyName}` : ""}
            </Row>

            <Row label="Email">{request.clientId?.email || "—"}</Row>

            <Row label="Type">{clientRequestTypeLabel(request.requestType)}</Row>

            {(request.projectId?.name || request.linkedProjectId?.name) && (
              <Row label="Project">{request.projectId?.name || request.linkedProjectId?.name}</Row>
            )}

            <Row label="Priority">
              <Badge className={getPriorityColor(request.priority)} variant="secondary">
                {request.priority}
              </Badge>
            </Row>

            <Row label="Current Status">
              <Badge className={getClientRequestStatusColor(request.status)} variant="secondary">
                {clientRequestStatusLabel(request.status)}
              </Badge>
            </Row>

            <Row label="Description">
              <span className="whitespace-pre-wrap">{request.description}</span>
            </Row>

            {request.expectedDate && <Row label="Expected Date">{formatDateTime(request.expectedDate)}</Row>}

            {request.referenceUrl && (
              <Row label="Reference">
                <a href={request.referenceUrl} target="_blank" rel="noreferrer" className="text-blue-600 underline break-all">
                  {request.referenceUrl}
                </a>
              </Row>
            )}

            <Row label="Raised On">{formatDateTime(request.createdAt)}</Row>
          </div>

          {!showConvert && (
            <div className="space-y-4 rounded-lg border p-4">
              <p className="text-sm font-medium">Respond to this request</p>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_review">In Review</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="adminRemarks">Remarks for the client</Label>
                <Textarea
                  id="adminRemarks"
                  rows={3}
                  value={adminRemarks}
                  onChange={(e) => setAdminRemarks(e.target.value)}
                  placeholder="This message is shown to the client along with the status."
                  disabled={loading}
                />
              </div>
            </div>
          )}

          {showConvert && (
            <div className="space-y-4 rounded-lg border p-4">
              <p className="text-sm font-medium">Create a project from this request</p>

              <div className="space-y-2">
                <Label htmlFor="projectName">Project Name *</Label>
                <Input
                  id="projectName"
                  value={projectForm.name}
                  onChange={(e) => setProjectForm((prev) => ({ ...prev, name: e.target.value }))}
                  disabled={loading}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="projectStart">Start Date</Label>
                  <Input
                    id="projectStart"
                    type="date"
                    value={projectForm.startDate}
                    onChange={(e) => setProjectForm((prev) => ({ ...prev, startDate: e.target.value }))}
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="projectEnd">End Date</Label>
                  <Input
                    id="projectEnd"
                    type="date"
                    value={projectForm.endDate}
                    onChange={(e) => setProjectForm((prev) => ({ ...prev, endDate: e.target.value }))}
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="projectUrl">Project URL</Label>
                <Input
                  id="projectUrl"
                  type="url"
                  value={projectForm.url}
                  onChange={(e) => setProjectForm((prev) => ({ ...prev, url: e.target.value }))}
                  placeholder="https://example.com"
                  disabled={loading}
                />
              </div>

              <p className="text-xs text-muted-foreground">
                The project is linked to this client, so they can track it and raise update requests on it.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="px-5 py-4 border-t shrink-0 gap-2 flex-wrap">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Close
          </Button>

          {canConvert && (
            <Button type="button" variant="secondary" onClick={() => setShowConvert((prev) => !prev)} disabled={loading}>
              <FolderPlus className="w-4 h-4 mr-2" />
              {showConvert ? "Back to Status" : "Convert to Project"}
            </Button>
          )}

          <Button type="button" onClick={showConvert ? handleConvert : handleReview} disabled={loading}>
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {showConvert ? "Create Project" : "Save & Notify Client"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ClientRequestReviewCard;
