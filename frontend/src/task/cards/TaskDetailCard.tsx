import React, { useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Laptop2, Users, CheckSquare, X, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useGetTaskByIdQuery } from "@/redux-toolkit/api/admin/task.api";
import { getStatusColor, getPriorityColor } from "@/services/allFunctions";
import { Button } from "@/components/ui/button";

interface TaskDetailCardProps {
  isOpen: boolean;
  onClose: () => void;
  taskId: string;
}

const TaskDetailCard: React.FC<TaskDetailCardProps> = ({
  isOpen,
  onClose,
  taskId,
}) => {
  const user = JSON.parse(localStorage.getItem("user"));
  const { toast } = useToast();
  const {
    data: taskData,
    error,
    isError,
    isLoading,
  } = useGetTaskByIdQuery({ id: taskId, companyId: user?.companyId });
  const allData = taskData?.data;
  const task = allData?.task;
  const subTasks = allData?.subTasks || [];

 

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "auto";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  if (!isOpen) return null;
// --------------------------------------------------
// Loading State
// --------------------------------------------------

if (isLoading) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 sm:px-6"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-5xl rounded-lg bg-white p-10 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex min-h-[300px] flex-col items-center justify-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />

          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900">
              Loading Task
            </h3>

            <p className="mt-1 text-sm text-muted-foreground">
              Please wait while task details are being loaded...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// --------------------------------------------------
// Error State
// --------------------------------------------------

if (isError) {
  const errorMessage =
    (error as any)?.data?.message ||
    (error as any)?.error ||
    "Unable to load task details.";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 sm:px-6"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-5xl rounded-lg bg-white p-10 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-500 transition hover:text-gray-800"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex min-h-[300px] flex-col items-center justify-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
            <X className="h-7 w-7 text-red-600" />
          </div>

          <h3 className="text-lg font-semibold text-gray-900">
            Failed to Load Task
          </h3>

          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            {errorMessage}
          </p>

          <Button
            type="button"
            variant="outline"
            className="mt-5"
            onClick={onClose}
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}


  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 sm:px-6"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-lg shadow-lg w-full max-w-5xl p-6 overflow-y-auto max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ❌ Close Icon */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">
            Task Overview
          </h2>
          {/* <Badge variant="outline" className="px-3 py-1 text-sm">
            {subTasks.length} Sub Tasks
          </Badge> */}
        </div>

        <div className="grid gap-6">
          <Card className="group hover:shadow-lg transition-all duration-300 border-gray-200/60 overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-blue-500 to-purple-500 w-full" />
            <CardHeader className="pb-4">
              <div className="flex flex-col md:flex-row justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge className={getPriorityColor(task?.priority)}>
                      {task?.priority} Priority
                    </Badge>
                    <Badge className={getStatusColor(task?.status)}>
                      {task?.status}
                    </Badge>
                  </div>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <Laptop2 className="w-6 h-6 text-gray-400" />
                    {task?.name}
                  </CardTitle>
                </div>

                <div className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-full border">
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarImage
                      src={
                        task?.managerId?.profileImage ||
                        `https://api.dicebear.com/7.x/avataaars/svg?seed=${task?.managerId?.profileImage}`
                      }
                    />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {task?.managerId?.fullName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="leading-tight">
                    <p className="text-xs text-gray-500">Task Manager</p>
                    <p className="text-sm font-semibold text-gray-800">
                      {task?.managerId?.fullName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {task?.managerId?.email}
                    </p>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="grid gap-6">
              {/* Team */}
              <div className="bg-gray-50/50 p-4 rounded-lg border border-gray-100/50">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-white rounded-md shadow-sm text-gray-500">
                    <Users className="w-4 h-4" />
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Assigned Team
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-40 overflow-y-auto pr-2">
                  {subTasks?.map((sub, idx) => (
                    <div
                      key={idx}
                      className="flex flex-col items-center text-center"
                    >
                      <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                        <AvatarImage
                          src={
                            sub?.employeeId?.profileImage ||
                            `https://api.dicebear.com/7.x/avataaars/svg?seed=${sub?.employeeId?.profileImage}`
                          }
                        />
                        <AvatarFallback className="text-xs bg-gray-100">
                          {sub?.employeeId?.fullName?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>

                      <p className="mt-1 text-xs font-medium text-gray-700 truncate max-w-[200px]">
                        {sub?.employeeId?.fullName} (
                        {sub?.employeeId?.department?.name})
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Subtasks */}
              {subTasks?.length > 0 && (
                <div className="space-y-3">
                  <h4 className="flex items-center gap-2 text-sm font-semibold">
                    <CheckSquare className="w-4 h-4 text-purple-500" />
                    Sub-tasks ({subTasks?.length})
                  </h4>

                  <div className="grid sm:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2">
                    {subTasks?.map((sub) => (
                      <div
                        key={sub._id}
                        className="flex justify-between p-3 border rounded-lg"
                      >
                        <span>{sub.name}</span>
                        <div className="flex -space-x-1">
                          <Avatar className="h-6 w-6">
                            <AvatarImage
                              src={
                                sub?.employeeId?.profileImage ||
                                `https://api.dicebear.com/7.x/avataaars/svg?seed=${sub?.employeeId?.profileImage}`
                              }
                            />
                            <AvatarFallback>
                              {sub?.employeeId?.fullName?.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TaskDetailCard;
