import React, { useEffect } from "react";
import { X, User, Building2, Briefcase } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getStatusColor, getPriorityColor } from "@/services/allFunctions";


interface SubTaskDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: any;
}

const SubTaskDetailCard: React.FC<SubTaskDetailModalProps> = ({
  isOpen,
  onClose,
  initialData
}) => {

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "auto";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex min-h-screen items-center justify-center bg-black/40 px-4 py-4"
      onClick={onClose}
    >
      <Card
        className="relative w-full max-w-lg rounded-xl shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ❌ Close Icon */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-muted-foreground hover:text-destructive"
        >
          <X className="w-5 h-5" />
        </button>

        <CardContent className="p-5 space-y-5">
          {/* Sub Task Title */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {initialData?.name}
            </h2>
            <p className="text-sm text-muted-foreground">
              {initialData?.description}
            </p>
          </div>

          {/* Status & Priority */}
          <div className="flex gap-2 flex-wrap">
            <Badge className={getStatusColor(initialData?.status)}>{initialData?.status}</Badge>
            <Badge className={getPriorityColor(initialData?.priority)}>{initialData?.priority} Priority</Badge>
          </div>

          {/* Assigned Employee */}
          <div className="border rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <User className="w-4 h-4 text-primary" />
              Assigned Employee
            </div>

            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9">
                <AvatarImage
                  src={initialData?.employeeId?.profileImage}
                />
                <AvatarFallback>
                  {initialData?.employeeId?.fullName?.charAt(0)}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0">
                <p className="font-medium truncate">
                  {initialData?.employeeId?.fullName}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {initialData?.employeeId?.role}
                </p>
              </div>
            </div>
          </div>

          {/* Department & Manager */}
          <div className="border rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Building2 className="w-4 h-4 text-primary" />
              Department Details
            </div>

            <div className="space-y-2 text-sm">
              {/* Department Name */}
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">
                  {initialData?.employeeId?.department?.name}
                </span>
              </div>

              {/* Managers List with Scroll */}
              <div>
                <p className="text-muted-foreground mb-1">  CreatedBy:</p>

              <div className="max-h-28 overflow-y-auto space-y-2 pr-1">
  {initialData?.createdBy && (
    <div className="flex items-center gap-2">
      {/* Profile Image */}
      <img
        src={initialData.createdBy.profileImage || "/default-avatar.png"}
        alt={initialData.createdBy.fullName}
        className="w-6 h-6 rounded-full object-cover border"
      />

      {/* Role Based Text Data */}
      <div className="flex flex-col text-sm">
        <span className="font-medium text-gray-800">
          {initialData.createdBy.fullName}
        </span>
        
        {/* Admin होने पर Role दिखेगा */}
        {initialData.createdBy.role === "admin" && (
          <span className="text-xs text-gray-500 capitalize">
            ({initialData.createdBy.role})
          </span>
        )}

        {/* Manager होने पर Department Name दिखेगा */}
        {initialData.createdBy.role === "manager" && (
          <span className="text-xs text-gray-500">
            {initialData.createdBy.department?.name || "No Department"}({initialData?.createdBy?.role})
          </span>
        )}
      </div>
    </div>
  )}
</div>

              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SubTaskDetailCard;
