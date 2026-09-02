import React, { useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  LayoutDashboard,
  Briefcase,
  Clock,
  AlertCircle,
  FolderOpen,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDate, getStatusColor } from "@/services/allFunctions";
import { Helmet } from "react-helmet-async";
import {useDashboardSummaryQuery, useDashboardDataQuery } from "@/redux-toolkit/api/admin/project.api";
import { socket } from "@/socket/socket";

const TaskDashboard: React.FC = () => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const { toast } = useToast();
  const { data: summaryData, isLoading: isSummaryLoading, isError: isSummaryError, error: summaryError, refetch:dashboardSummaryRefetch } = useDashboardSummaryQuery();
  const dashboardSummary = summaryData?.data || {};
  const { data, isLoading, isError, error, refetch:dashboardDataRefetch } = useDashboardDataQuery();
  const dashboardData = data?.data || {};

  const projects = dashboardData?.projects || [];
  const tasks = dashboardData?.tasks || [];
  const subTasks = dashboardData?.subTasks || [];

  useEffect(() => {
       const handleNotification = async(data) => {
           if(data?.recipientId?.toString() === user?.id?.toString()){
              dashboardSummaryRefetch();
              dashboardDataRefetch();
           }};

       socket.on("notification", handleNotification);

       return () => {
         socket.off("notification", handleNotification);
       };
     },[dashboardSummaryRefetch,dashboardDataRefetch, user?.id]);
 

  return (
    <>
      <Helmet>
        <title>Task Page</title>
        <meta name="description" content="This is the home page of our app" />
      </Helmet>

      <div className="flex flex-col min-h-screen bg-gray-50/50 p-6 space-y-8">
        {/* Summary Cards */}
       {/* Summary Cards */}
<div
  className={`grid grid-cols-1 md:mt-[-30px] gap-4 sm:grid-cols-2 ${
    user?.role === "admin" ? "lg:grid-cols-4" : "lg:grid-cols-4"
  }`}
>
  {/* ================= ADMIN ================= */}
  {user?.role === "admin" && (
    <>
      {/* Total Projects */}
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Total Projects
          </CardTitle>
          <Briefcase className="h-4 w-4 text-muted-foreground" />
        </CardHeader>

        <CardContent>
          <div className="text-2xl font-bold">
            {dashboardSummary?.totalProjects ?? 0}
          </div>
          <p className="text-xs text-muted-foreground">
            All company projects
          </p>
        </CardContent>
      </Card>

      {/* Current Month Projects */}
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            This Month Projects
          </CardTitle>
          <Briefcase className="h-4 w-4 text-blue-500" />
        </CardHeader>

        <CardContent>
          <div className="text-2xl font-bold">
            {dashboardSummary?.currentMonthProjects ?? 0}
          </div>
          <p className="text-xs text-muted-foreground">
            Created this month
          </p>
        </CardContent>
      </Card>

      {/* Completed Projects */}
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Completed Projects
          </CardTitle>
          <Briefcase className="h-4 w-4 text-green-500" />
        </CardHeader>

        <CardContent>
          <div className="text-2xl font-bold">
            {dashboardSummary?.completedProjects ?? 0}
          </div>
          <p className="text-xs text-muted-foreground">
            Successfully completed
          </p>
        </CardContent>
      </Card>

      {/* Total Tasks */}
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Total Tasks
          </CardTitle>
          <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
        </CardHeader>

        <CardContent>
          <div className="text-2xl font-bold">
            {dashboardSummary?.totalTasks ?? 0}
          </div>
          <p className="text-xs text-muted-foreground">
            All company tasks
          </p>
        </CardContent>
      </Card>

      {/* Current Month Tasks */}
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            This Month Tasks
          </CardTitle>
          <LayoutDashboard className="h-4 w-4 text-blue-500" />
        </CardHeader>

        <CardContent>
          <div className="text-2xl font-bold">
            {dashboardSummary?.currentMonthTasks ?? 0}
          </div>
          <p className="text-xs text-muted-foreground">
            Created this month
          </p>
        </CardContent>
      </Card>

      {/* Completed Tasks */}
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Completed Tasks
          </CardTitle>
          <LayoutDashboard className="h-4 w-4 text-green-500" />
        </CardHeader>

        <CardContent>
          <div className="text-2xl font-bold">
            {dashboardSummary?.completedTasks ?? 0}
          </div>
          <p className="text-xs text-muted-foreground">
            Successfully completed
          </p>
        </CardContent>
      </Card>

      {/* Pending Tasks */}
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Pending Tasks
          </CardTitle>
          <Clock className="h-4 w-4 text-yellow-500" />
        </CardHeader>

        <CardContent>
          <div className="text-2xl font-bold">
            {dashboardSummary?.pendingTasks ?? 0}
          </div>
          <p className="text-xs text-muted-foreground">
            Requires attention
          </p>
        </CardContent>
      </Card>

      {/* In Progress Tasks */}
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            In Progress Tasks
          </CardTitle>
          <FolderOpen className="h-4 w-4 text-blue-500" />
        </CardHeader>

        <CardContent>
          <div className="text-2xl font-bold">
            {dashboardSummary?.inProgressTasks ?? 0}
          </div>
          <p className="text-xs text-muted-foreground">
            Active workflows
          </p>
        </CardContent>
      </Card>
    </>
  )}

  {/* ================= MANAGER ================= */}
  {user?.role === "manager" && (
    <>
      {/* Total Tasks */}
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Total Assigned Tasks
          </CardTitle>
          <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
        </CardHeader>

        <CardContent>
          <div className="text-2xl font-bold">
            {dashboardSummary?.totalTasks ?? 0}
          </div>
          <p className="text-xs text-muted-foreground">
            Tasks assigned to you
          </p>
        </CardContent>
      </Card>

      {/* Completed Tasks */}
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Completed Tasks
          </CardTitle>
          <LayoutDashboard className="h-4 w-4 text-green-500" />
        </CardHeader>

        <CardContent>
          <div className="text-2xl font-bold">
            {dashboardSummary?.completedTasks ?? 0}
          </div>
          <p className="text-xs text-muted-foreground">
            Tasks completed by you
          </p>
        </CardContent>
      </Card>

      {/* Total Sub Tasks */}
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Total Sub Tasks
          </CardTitle>
          <FolderOpen className="h-4 w-4 text-muted-foreground" />
        </CardHeader>

        <CardContent>
          <div className="text-2xl font-bold">
            {dashboardSummary?.totalSubTasks ?? 0}
          </div>
          <p className="text-xs text-muted-foreground">
            Sub tasks created by you
          </p>
        </CardContent>
      </Card>

      {/* Completed Sub Tasks */}
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Completed Sub Tasks
          </CardTitle>
          <FolderOpen className="h-4 w-4 text-green-500" />
        </CardHeader>

        <CardContent>
          <div className="text-2xl font-bold">
            {dashboardSummary?.completedSubTasks ?? 0}
          </div>
          <p className="text-xs text-muted-foreground">
            Successfully completed
          </p>
        </CardContent>
      </Card>

      {/* Pending Sub Tasks */}
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Pending Sub Tasks
          </CardTitle>
          <Clock className="h-4 w-4 text-yellow-500" />
        </CardHeader>

        <CardContent>
          <div className="text-2xl font-bold">
            {dashboardSummary?.pendingSubTasks ?? 0}
          </div>
          <p className="text-xs text-muted-foreground">
            Requires attention
          </p>
        </CardContent>
      </Card>

      {/* In Progress Sub Tasks */}
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            In Progress Sub Tasks
          </CardTitle>
          <FolderOpen className="h-4 w-4 text-blue-500" />
        </CardHeader>

        <CardContent>
          <div className="text-2xl font-bold">
            {dashboardSummary?.inProgressSubTasks ?? 0}
          </div>
          <p className="text-xs text-muted-foreground">
            Active sub tasks
          </p>
        </CardContent>
      </Card>
    </>
  )}

  {/* ================= EMPLOYEE ================= */}
  {user?.role === "employee" && (
    <>
      {/* Total Sub Tasks */}
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Total Assigned Sub Tasks
          </CardTitle>
          <FolderOpen className="h-4 w-4 text-muted-foreground" />
        </CardHeader>

        <CardContent>
          <div className="text-2xl font-bold">
            {dashboardSummary?.totalSubTasks ?? 0}
          </div>
          <p className="text-xs text-muted-foreground">
            Sub tasks assigned to you
          </p>
        </CardContent>
      </Card>

      {/* Completed Sub Tasks */}
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Completed Sub Tasks
          </CardTitle>
          <FolderOpen className="h-4 w-4 text-green-500" />
        </CardHeader>

        <CardContent>
          <div className="text-2xl font-bold">
            {dashboardSummary?.completedSubTasks ?? 0}
          </div>
          <p className="text-xs text-muted-foreground">
            Successfully completed
          </p>
        </CardContent>
      </Card>

      {/* Pending Sub Tasks */}
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Pending Sub Tasks
          </CardTitle>
          <Clock className="h-4 w-4 text-yellow-500" />
        </CardHeader>

        <CardContent>
          <div className="text-2xl font-bold">
            {dashboardSummary?.pendingSubTasks ?? 0}
          </div>
          <p className="text-xs text-muted-foreground">
            Requires attention
          </p>
        </CardContent>
      </Card>

      {/* In Progress Sub Tasks */}
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            In Progress Sub Tasks
          </CardTitle>
          <FolderOpen className="h-4 w-4 text-blue-500" />
        </CardHeader>

        <CardContent>
          <div className="text-2xl font-bold">
            {dashboardSummary?.inProgressSubTasks ?? 0}
          </div>
          <p className="text-xs text-muted-foreground">
            Active sub tasks
          </p>
        </CardContent>
      </Card>
    </>
  )}
</div>


        {/* Main Content Area */}
       <div
  className={`grid grid-cols-1 gap-8 ${
    user?.role === "employee" ? "" : "lg:grid-cols-2"
  }`}
>

          {/* ================= LEFT TABLE ================= */}
          <Card className="shadow-sm border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>
                  {user?.role === "admin"
                    ? "Recent Projects"
                    : user?.role === "manager"
                      ? "Recent Tasks"
                      : "Recent Sub Tasks"}
                </CardTitle>

                <CardDescription>
                  {user?.role === "admin"
                    ? "Latest projects created in your company."
                    : user?.role === "manager"
                      ? "Latest tasks assigned to you."
                      : "Latest sub tasks assigned to you."}
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent>
              <Table className="w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      {user?.role === "admin"
                        ? "Project Name"
                        : user?.role === "manager"
                          ? "Task Name"
                          : "Sub Task Name"}
                    </TableHead>

                    <TableHead className="hidden md:table-cell">
                      {user?.role === "admin" ? "Priority" : "Assigned By"}
                    </TableHead>

                    <TableHead>Status</TableHead>

                    <TableHead className="text-right">Due Date</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {/* ================= LOADING ================= */}
  {isLoading && (
    <TableRow>
      <TableCell colSpan={4} className="text-center py-12">
        <div className="flex flex-col items-center justify-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-primary" />
          <span className="text-sm text-muted-foreground">
            Loading dashboard data...
          </span>
        </div>
      </TableCell>
    </TableRow>
  )}

  {/* ================= ERROR ================= */}
  {isError && (
    <TableRow>
      <TableCell colSpan={4} className="text-center py-12">
        <div className="flex flex-col items-center justify-center gap-2">
          <AlertCircle className="h-8 w-8 text-red-500" />

          <span className="font-medium text-red-500">
            Failed to load dashboard data
          </span>

          <span className="text-sm text-muted-foreground">
            {(error as any)?.data?.message ||
              (error as any)?.error ||
              "Something went wrong while fetching data."}
          </span>
        </div>
      </TableCell>
    </TableRow>
  )}
                  {/* ================= ADMIN PROJECTS ================= */}
                 {!isLoading && !isError && user?.role === "admin" && projects.length > 0
                    ? projects.map((project: any) => (
                        <TableRow
                          key={project._id}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <TableCell className="font-medium">
                            {project?.name || "N/A"}
                          </TableCell>

                          <TableCell className="hidden md:table-cell">
                            <Badge variant="outline">
                              {project?.priority || "medium"}
                            </Badge>
                          </TableCell>

                          <TableCell>
                            <Badge
                              variant="outline"
                              className={getStatusColor(project?.status)}
                            >
                              {project?.status || "pending"}
                            </Badge>
                          </TableCell>

                          <TableCell className="text-right">
                            {project?.endDate
                              ? formatDate(project.endDate)
                              : "N/A"}
                          </TableCell>
                        </TableRow>
                      ))
                    : null}

                  {/* ================= MANAGER TASKS ================= */}
                  {!isLoading && !isError && user?.role === "manager" && tasks.length > 0
                    ? tasks.map((task: any) => (
                        <TableRow
                          key={task._id}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <TableCell className="font-medium">
                            {task?.name || "N/A"}
                          </TableCell>

                          <TableCell className="hidden md:table-cell">
                            {task?.createdBy?.fullName ? (
                              <div className="flex flex-col">
                                <span className="font-medium">
                                  {task.createdBy.fullName}
                                </span>

                                <span className="text-xs text-muted-foreground capitalize">
                                  {task.createdBy.role}
                                </span>
                              </div>
                            ) : (
                              "N/A"
                            )}
                          </TableCell>

                          <TableCell>
                            <Badge
                              variant="outline"
                              className={getStatusColor(task?.status)}
                            >
                              {task?.status || "pending"}
                            </Badge>
                          </TableCell>

                          <TableCell className="text-right">
                            {task?.endDate ? formatDate(task.endDate) : "N/A"}
                          </TableCell>
                        </TableRow>
                      ))
                    : null}

                  {/* ================= EMPLOYEE SUB TASKS ================= */}
                 {!isLoading && !isError && user?.role === "employee" && subTasks.length > 0
                    ? subTasks.map((subTask: any) => (
                        <TableRow
                          key={subTask._id}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <TableCell className="font-medium">
                            {subTask?.name || "N/A"}
                          </TableCell>

                          <TableCell className="hidden md:table-cell">
                            {subTask?.createdBy?.fullName ? (
                              <div className="flex flex-col">
                                <span className="font-medium">
                                  {subTask.createdBy.fullName}
                                </span>

                                <span className="text-xs text-muted-foreground capitalize">
                                  {subTask.createdBy.role}
                                </span>
                              </div>
                            ) : (
                              "N/A"
                            )}
                          </TableCell>

                          <TableCell>
                            <Badge
                              variant="outline"
                              className={getStatusColor(subTask?.status)}
                            >
                              {subTask?.status || "pending"}
                            </Badge>
                          </TableCell>

                          <TableCell className="text-right">
                            {subTask?.endDate
                              ? formatDate(subTask.endDate)
                              : "N/A"}
                          </TableCell>
                        </TableRow>
                      ))
                    : null}

                  {/* ================= NO DATA ================= */}
                  {((user?.role === "admin" && projects.length === 0) ||
                    (user?.role === "manager" && tasks.length === 0) ||
                    (user?.role === "employee" && subTasks.length === 0)) && (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="text-center py-10 text-muted-foreground font-medium"
                      >
                        Data Not Found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* ================= RIGHT TABLE ================= */}

          {user?.role !== "employee" && (
            <Card className="shadow-sm border-gray-200">
              <CardHeader>
                <div>
                  <CardTitle>
                    {user?.role === "admin"
                      ? "Recent Tasks"
                      : "Recent Sub Tasks"}
                  </CardTitle>

                  <CardDescription>
                    {user?.role === "admin"
                      ? "Latest tasks created in your company."
                      : "Latest sub tasks created by you."}
                  </CardDescription>
                </div>
              </CardHeader>

              <CardContent>
                <ScrollArea className="h-[350px] pr-4">
                  <Table className="w-full">
                    <TableHeader>
                      <TableRow>
                        <TableHead>
                          {user?.role === "admin"
                            ? "Task Name"
                            : "Sub Task Name"}
                        </TableHead>
                        <TableHead>
                          {user?.role === "admin" ? "Assignee" : "Assignee"}
                        </TableHead>

                        <TableHead>Status</TableHead>

                        <TableHead className="text-right">Due Date</TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {/* ADMIN → TASKS */}
                      {user?.role === "admin" && tasks.length > 0
                        ? tasks.map((task: any) => (
                            <TableRow
                              key={task._id}
                              className="hover:bg-gray-50 transition-colors"
                            >
                              <TableCell className="font-medium">
                                {task?.name || "N/A"}
                              </TableCell>

                              <TableCell>
                                {task?.managerId?.fullName ? (
                                  <div className="flex flex-col">
                                    <span className="font-medium">
                                      {task.managerId.fullName}
                                    </span>

                                    <span className="text-xs text-muted-foreground capitalize">
                                      {task.managerId.role}
                                    </span>
                                  </div>
                                ) : (
                                  "N/A"
                                )}
                              </TableCell>

                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className={getStatusColor(task?.status)}
                                >
                                  {task?.status || "pending"}
                                </Badge>
                              </TableCell>

                              <TableCell className="text-right">
                                {task?.endDate
                                  ? formatDate(task.endDate)
                                  : "N/A"}
                              </TableCell>
                            </TableRow>
                          ))
                        : null}

                      {/* MANAGER → SUB TASKS */}
                      {user?.role === "manager" && subTasks.length > 0
                        ? subTasks.map((subTask: any) => (
                            <TableRow
                              key={subTask._id}
                              className="hover:bg-gray-50 transition-colors"
                            >
                              <TableCell className="font-medium">
                                {subTask?.name || "N/A"}
                              </TableCell>

                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className={getStatusColor(subTask?.status)}
                                >
                                  {subTask?.status || "pending"}
                                </Badge>
                              </TableCell>

                              <TableCell className="text-right">
                                {subTask?.endDate
                                  ? formatDate(subTask.endDate)
                                  : "N/A"}
                              </TableCell>
                            </TableRow>
                          ))
                        : null}

                      {/* NO DATA */}
                      {((user?.role === "admin" && tasks.length === 0) ||
                        (user?.role === "manager" &&
                          subTasks.length === 0)) && (
                        <TableRow>
                          <TableCell
                            colSpan={3}
                            className="text-center py-10 text-muted-foreground font-medium"
                          >
                            Data Not Found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
};

export default TaskDashboard;
