import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  formatDateTime,
  getPriorityColor,
  getClientRequestStatusColor,
  clientRequestStatusLabel,
  clientRequestTypeLabel,
} from "@/services/allFunctions";

interface ClientRequestDetailCardProps {
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

const ClientRequestDetailCard: React.FC<ClientRequestDetailCardProps> = ({ request, isOpen, onClose }) => {
  if (!request) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[560px] w-[92vw] max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg">{request.title}</DialogTitle>
        </DialogHeader>

        <div className="divide-y">
          <Row label="Type">{clientRequestTypeLabel(request.requestType)}</Row>

          <Row label="Status">
            <Badge className={getClientRequestStatusColor(request.status)} variant="secondary">
              {clientRequestStatusLabel(request.status)}
            </Badge>
          </Row>

          <Row label="Priority">
            <Badge className={getPriorityColor(request.priority)} variant="secondary">
              {request.priority}
            </Badge>
          </Row>

          {request.clientId?.fullName && (
            <Row label="Client">
              {request.clientId.fullName}
              {request.clientId.clientCompanyName ? ` · ${request.clientId.clientCompanyName}` : ""}
              {request.clientId.email ? ` · ${request.clientId.email}` : ""}
            </Row>
          )}

          {(request.projectId?.name || request.linkedProjectId?.name) && (
            <Row label="Project">{request.projectId?.name || request.linkedProjectId?.name}</Row>
          )}

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

          {request.adminRemarks && (
            <Row label="Admin Remarks">
              <span className="whitespace-pre-wrap">{request.adminRemarks}</span>
            </Row>
          )}

          {request.reviewedAt && (
            <Row label="Reviewed">
              {formatDateTime(request.reviewedAt)}
              {request.reviewedBy?.fullName ? ` · by ${request.reviewedBy.fullName}` : ""}
            </Row>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ClientRequestDetailCard;
