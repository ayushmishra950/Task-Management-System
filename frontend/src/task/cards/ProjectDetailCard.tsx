import React, { FC } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  CalendarDays,
  Users,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  Clock,
  User,
  X,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useGetProjectByIdQuery } from "@/redux-toolkit/api/admin/project.api";
import {
  formatDate,
  getStatusColor,
  getPriorityColor,
} from "@/services/allFunctions";
import { Button } from "@/components/ui/button";

interface ProjectDetailCardProps {
  isOpen: boolean;
  onClose: () => void;
  projectId?: string;
}

const ProjectDetailCard: FC<ProjectDetailCardProps> = ({
  isOpen,
  onClose,
  projectId,
}) => {
  const user = JSON.parse(localStorage.getItem("user"));
  const { toast } = useToast();
  const { data: projectData, error, isError, isLoading } = useGetProjectByIdQuery({
    id: projectId,
    companyId: user?.companyId,
  });
  const allData = projectData?.data;
  const project = allData?.project;
  const tasks = allData?.tasks;
  const subTasks = allData?.subTasks;

  if (!isOpen) return null;

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
              Loading Project
            </h3>

            <p className="mt-1 text-sm text-muted-foreground">
              Please wait while project details are being loaded...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

if (isError) {
  const errorMessage =
    (error as any)?.data?.message ||
    (error as any)?.error ||
    "Unable to load project details.";

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
            Failed to Load Project
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



  const uniqueManagers = Array.from(
    new Map(
      (tasks || [])
        .filter((task) => task?.managerId?._id)
        .map((task) => [task.managerId._id, task.managerId]),
    ).values(),
  );

  const uniqueEmployees = Array.from(
    new Map(
      (subTasks || [])
        .filter((sub) => sub?.employeeId?._id)
        .map((sub) => [sub.employeeId._id, sub.employeeId]),
    ).values(),
  );

  const teamSize = uniqueManagers.length + uniqueEmployees.length;
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className=" w-[95vw]  max-w-[95vw] sm:max-w-[600px] md:max-w-[800px] lg:max-w-[900px] max-h-[90vh] p-0 overflow-hidden flex flex-col ">
        <DialogHeader className="p-6 pb-2">
          <div className="flex justify-between items-start gap-4">
            <div>
              <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                {project?.name}
              </DialogTitle>
              <DialogDescription className="mt-1">
                {project?.description}
              </DialogDescription>
            </div>
            <div className="flex flex-col gap-2 items-end">
              <Badge
                variant="outline"
                className={getStatusColor(project?.status)}
              >
                {project?.status}
              </Badge>
              <Badge
                variant="outline"
                className={getPriorityColor(project?.priority)}
              >
                {project?.priority} Priority
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <Tabs
          defaultValue="overview"
          className="flex-1 flex flex-col overflow-hidden"
        >
          <div className="px-6 border-b">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="team">Team</TabsTrigger>
              <TabsTrigger value="tasks">Tasks & Progress</TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className=" flex-1 p-6 max-h-[70vh] sm:max-h-[65vh] overflow-y-auto">
            <TabsContent value="overview" className="mt-0 space-y-6">
              {/* Key Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Start Date
                    </CardTitle>
                    <CalendarDays className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatDate(project?.startDate)}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      End Date
                    </CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatDate(project?.endDate)}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total Tasks
                    </CardTitle>
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{tasks?.length}</div>
                    <p className="text-xs text-muted-foreground">
                      Major milestones
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Team Size
                    </CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{teamSize}</div>
                    <p className="text-xs text-muted-foreground">
                      Active members
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="team" className="mt-0 space-y-6">
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Briefcase className="h-4 w-4" /> Managers
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {uniqueManagers.length > 0 ? (
                    uniqueManagers.map((manager: any, i) => (
                      <div
                        key={manager?._id || i}
                        className="flex items-center space-x-3 p-3 bg-muted/40 rounded-lg border"
                      >
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                          {manager?.fullName?.charAt(0)}
                        </div>

                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">
                            {manager?.fullName}
                          </p>

                          <p className="text-xs text-muted-foreground truncate">
                            {manager?.email || "Manager"}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No managers assigned.
                    </p>
                  )}
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Users className="h-4 w-4" /> Team Members
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {uniqueEmployees?.map((e: any, i) => (
                    <div
                      key={e._id || i}
                      className="flex items-center space-x-3 p-3 text-sm border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
                        <User className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium">{e?.fullName}</p>
                        <p className="text-xs text-muted-foreground">
                          {e?.role}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

<TabsContent value="tasks" className="mt-0 space-y-4">
  {tasks?.length > 0 ? (
    tasks.map((task) => {
      const taskSubTasks =
        subTasks?.filter(
          (sub) => sub?.taskId === task?._id
        ) || [];

      return (
        <Card
          key={task?._id}
          className="overflow-hidden"
        >
          <CardHeader className="bg-muted/30 p-4 pb-3">
            <div className="flex flex-col sm:flex-row justify-between gap-3">
              <div className="space-y-2 min-w-0">
                <CardTitle className="text-base">
                  {task?.name}
                </CardTitle>

                {task?.description && (
                  <p className="text-xs text-muted-foreground">
                    {task?.description}
                  </p>
                )}

                <div className="flex flex-wrap gap-2">
                  <Badge
                    className={getPriorityColor(task?.priority)}
                  >
                    {task?.priority || "N/A"}
                  </Badge>

                  <Badge
                    className={getStatusColor(task?.status)}
                  >
                    {task?.status || "N/A"}
                  </Badge>
                </div>
              </div>

              {/* Manager */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                  {task?.managerId?.fullName?.charAt(0)}
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">
                    Manager
                  </p>

                  <p className="text-sm font-medium">
                    {task?.managerId?.fullName || "N/A"}
                  </p>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-4 space-y-4">
            {/* Task Information */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">
                  Start Date
                </p>

                <p className="text-sm font-medium mt-1">
                  {task?.startDate
                    ? formatDate(task.startDate)
                    : "N/A"}
                </p>
              </div>

              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">
                  End Date
                </p>

                <p className="text-sm font-medium mt-1">
                  {task?.endDate
                    ? formatDate(task.endDate)
                    : "N/A"}
                </p>
              </div>

              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">
                  Created By
                </p>

                <p className="text-sm font-medium mt-1">
                  {task?.createdBy?.fullName || "N/A"}
                </p>
              </div>

              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">
                  Sub Tasks
                </p>

                <p className="text-sm font-medium mt-1">
                  {taskSubTasks.length}
                </p>
              </div>
            </div>

            {/* Task URL */}
            {task?.url && (
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">
                  Task URL
                </p>

                <a
                  href={task.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline break-all"
                >
                  {task.url}
                </a>
              </div>
            )}

            <Separator />

            {/* Sub Tasks */}
            <div>
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-purple-500" />

                Sub Tasks ({taskSubTasks.length})
              </h4>

              {taskSubTasks.length > 0 ? (
                <div className="space-y-2">
                  {taskSubTasks.map((sub) => (
                    <div
                      key={sub?._id}
                      className="rounded-lg border p-3 space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          {sub?.status === "completed" ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                          ) : (
                            <div className="h-4 w-4 rounded-full border border-gray-400 shrink-0" />
                          )}

                          <span className="font-medium text-sm truncate">
                            {sub?.name}
                          </span>
                        </div>

                        <div className="flex gap-2">
                          <Badge
                            className={getStatusColor(
                              sub?.status
                            )}
                          >
                            {sub?.status}
                          </Badge>

                          <Badge
                            className={getPriorityColor(
                              sub?.priority
                            )}
                          >
                            {sub?.priority}
                          </Badge>
                        </div>
                      </div>

                      {/* Subtask Details */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                        <div>
                          <p className="text-muted-foreground">
                            Employee
                          </p>

                          <p className="font-medium mt-1">
                            {sub?.employeeId?.fullName || "N/A"}
                          </p>
                        </div>

                        <div>
                          <p className="text-muted-foreground">
                            Start Date
                          </p>

                          <p className="font-medium mt-1">
                            {sub?.startDate
                              ? formatDate(sub.startDate)
                              : "N/A"}
                          </p>
                        </div>

                        <div>
                          <p className="text-muted-foreground">
                            End Date
                          </p>

                          <p className="font-medium mt-1">
                            {sub?.endDate
                              ? formatDate(sub.endDate)
                              : "N/A"}
                          </p>
                        </div>

                        <div>
                          <p className="text-muted-foreground">
                            Created By
                          </p>

                          <p className="font-medium mt-1">
                            {sub?.createdBy?.fullName || "N/A"}({sub?.createdBy?.role === "admin" ? sub?.createdBy?.role : sub?.createdBy?.department?.name})
                          </p>
                        </div>
                      </div>

                      {sub?.description && (
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Description
                          </p>

                          <p className="text-sm mt-1">
                            {sub.description}
                          </p>
                        </div>
                      )}

                      {sub?.remarks && (
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Remarks
                          </p>

                          <p className="text-sm mt-1">
                            {sub.remarks}
                          </p>
                        </div>
                      )}

                      {sub?.url && (
                        <div>
                          <p className="text-xs text-muted-foreground">
                            URL
                          </p>

                          <a
                            href={sub.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline break-all"
                          >
                            {sub.url}
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  No subtasks found for this task.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      );
    })
  ) : (
    <div className="py-10 text-center">
      <AlertCircle className="mx-auto h-8 w-8 text-muted-foreground" />

      <p className="mt-2 text-sm text-muted-foreground">
        No tasks found for this project.
      </p>
    </div>
  )}
</TabsContent>

          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectDetailCard;
