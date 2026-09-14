import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  ArrowRight,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDate, getStatusColor } from "@/services/allFunctions";
import { Helmet } from "react-helmet-async";
import {useDashboardSummaryQuery, useDashboardDataQuery } from "@/redux-toolkit/api/admin/project.api";
import { socket } from "@/socket/socket";

type SummaryCard = {
  title: string;
  valueKey: string;
  description: string;
  icon: React.ElementType;
  iconClassName: string;
  /** Card click par kis page par jana hai */
  path: string;
  /** Target page par pehle se lagne wala status filter */
  status?: "pending" | "in_progress" | "completed" | "overdue";
  /** "This Month" cards ke liye createdAt filter */
  period?: "this_month";
};

const SUMMARY_CARDS: Record<string, SummaryCard[]> = {
  admin: [
    { title: "Total Projects", valueKey: "totalProjects", description: "All company projects", icon: Briefcase, iconClassName: "text-muted-foreground", path: "/tasks/projects" },
    { title: "This Month Projects", valueKey: "currentMonthProjects", description: "Created this month", icon: Briefcase, iconClassName: "text-blue-500", path: "/tasks/projects", period: "this_month" },
    { title: "Completed Projects", valueKey: "completedProjects", description: "Successfully completed", icon: Briefcase, iconClassName: "text-green-500", path: "/tasks/projects", status: "completed" },
    { title: "Overdue Projects", valueKey: "overdueProjects", description: "End date passed, not completed", icon: AlertCircle, iconClassName: "text-red-500", path: "/tasks/projects", status: "overdue" },
    { title: "Total Tasks", valueKey: "totalTasks", description: "All company tasks", icon: LayoutDashboard, iconClassName: "text-muted-foreground", path: "/tasks/task" },
    { title: "This Month Tasks", valueKey: "currentMonthTasks", description: "Created this month", icon: LayoutDashboard, iconClassName: "text-blue-500", path: "/tasks/task", period: "this_month" },
    { title: "Completed Tasks", valueKey: "completedTasks", description: "Successfully completed", icon: LayoutDashboard, iconClassName: "text-green-500", path: "/tasks/task", status: "completed" },
    { title: "Pending Tasks", valueKey: "pendingTasks", description: "Requires attention", icon: Clock, iconClassName: "text-yellow-500", path: "/tasks/task", status: "pending" },
    { title: "In Progress Tasks", valueKey: "inProgressTasks", description: "Active workflows", icon: FolderOpen, iconClassName: "text-blue-500", path: "/tasks/task", status: "in_progress" },
    { title: "Overdue Tasks", valueKey: "overdueTasks", description: "End date passed, not completed", icon: AlertCircle, iconClassName: "text-red-500", path: "/tasks/task", status: "overdue" },
  ],
  manager: [
    { title: "Total Assigned Tasks", valueKey: "totalTasks", description: "Tasks assigned to you", icon: LayoutDashboard, iconClassName: "text-muted-foreground", path: "/tasks/task" },
    { title: "Completed Tasks", valueKey: "completedTasks", description: "Tasks completed by you", icon: LayoutDashboard, iconClassName: "text-green-500", path: "/tasks/task", status: "completed" },
    { title: "Overdue Tasks", valueKey: "overdueTasks", description: "End date passed, not completed", icon: AlertCircle, iconClassName: "text-red-500", path: "/tasks/task", status: "overdue" },
    { title: "Total Sub Tasks", valueKey: "totalSubTasks", description: "Sub tasks created by you", icon: FolderOpen, iconClassName: "text-muted-foreground", path: "/tasks/sub-task" },
    { title: "Completed Sub Tasks", valueKey: "completedSubTasks", description: "Successfully completed", icon: FolderOpen, iconClassName: "text-green-500", path: "/tasks/sub-task", status: "completed" },
    { title: "Pending Sub Tasks", valueKey: "pendingSubTasks", description: "Requires attention", icon: Clock, iconClassName: "text-yellow-500", path: "/tasks/sub-task", status: "pending" },
    { title: "In Progress Sub Tasks", valueKey: "inProgressSubTasks", description: "Active sub tasks", icon: FolderOpen, iconClassName: "text-blue-500", path: "/tasks/sub-task", status: "in_progress" },
    { title: "Overdue Sub Tasks", valueKey: "overdueSubTasks", description: "End date passed, not completed", icon: AlertCircle, iconClassName: "text-red-500", path: "/tasks/sub-task", status: "overdue" },
  ],
  employee: [
    { title: "Total Assigned Sub Tasks", valueKey: "totalSubTasks", description: "Sub tasks assigned to you", icon: FolderOpen, iconClassName: "text-muted-foreground", path: "/tasks/sub-task" },
    { title: "Completed Sub Tasks", valueKey: "completedSubTasks", description: "Successfully completed", icon: FolderOpen, iconClassName: "text-green-500", path: "/tasks/sub-task", status: "completed" },
    { title: "Pending Sub Tasks", valueKey: "pendingSubTasks", description: "Requires attention", icon: Clock, iconClassName: "text-yellow-500", path: "/tasks/sub-task", status: "pending" },
    { title: "In Progress Sub Tasks", valueKey: "inProgressSubTasks", description: "Active sub tasks", icon: FolderOpen, iconClassName: "text-blue-500", path: "/tasks/sub-task", status: "in_progress" },
    { title: "Overdue Sub Tasks", valueKey: "overdueSubTasks", description: "End date passed, not completed", icon: AlertCircle, iconClassName: "text-red-500", path: "/tasks/sub-task", status: "overdue" },
  ],
};

const TaskDashboard: React.FC = () => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const { toast } = useToast();
  const navigate = useNavigate();
  const { data: summaryData, isLoading: isSummaryLoading, isError: isSummaryError, error: summaryError, refetch:dashboardSummaryRefetch } = useDashboardSummaryQuery(undefined, {skip:!user?.id || !user?.role});
  const dashboardSummary = summaryData?.data || {};
  const { data, isLoading, isError, error, refetch:dashboardDataRefetch } = useDashboardDataQuery(undefined, {skip:!user?.id || !user?.role});
  const dashboardData = data?.data || {};

  const projects = dashboardData?.projects || [];
  const tasks = dashboardData?.tasks || [];
  const subTasks = dashboardData?.subTasks || [];

  // Row click par usi item ke apne page par jao aur uska detail card khol do
  const openProjectDetail = (project: any) =>
    navigate("/tasks/projects", { state: { viewProjectId: project?._id } });

  const openTaskDetail = (task: any) =>
    navigate("/tasks/task", { state: { viewTaskId: task?._id } });

  const openSubTaskDetail = (subTask: any) =>
    navigate("/tasks/sub-task", { state: { viewSubTaskId: subTask?._id } });

  // "View All" ke liye har table ka list page
  const leftTablePath =
    user?.role === "admin" ? "/tasks/projects" : user?.role === "manager" ? "/tasks/task" : "/tasks/sub-task";
  const rightTablePath = user?.role === "admin" ? "/tasks/task" : "/tasks/sub-task";

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
        <meta name="description" content="This is the home page of our app" />
      </Helmet>

      <div className="flex flex-col min-h-screen bg-gray-50/50 p-6 space-y-8">
        {/* Summary Cards - click par related page status filter ke saath khulta hai */}
        <div className="grid grid-cols-1 md:mt-[-30px] gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {(SUMMARY_CARDS[user?.role] || []).map((card) => {
            const Icon = card.icon;
            const goToCard = () =>
              navigate(card.path, { state: { status: card.status, period: card.period, cardTitle: card.title } });

            return (
              <Card
                key={card.title}
                role="button"
                tabIndex={0}
                onClick={goToCard}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    goToCard();
                  }
                }}
                className="cursor-pointer hover:shadow-md hover:border-primary/40 transition-all"
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {card.title}
                  </CardTitle>
                  <Icon className={`h-4 w-4 ${card.iconClassName}`} />
                </CardHeader>

                <CardContent>
                  <div className="text-2xl font-bold">
                    {dashboardSummary?.[card.valueKey] ?? 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {card.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>


        {/* Main Content Area */}
       <div
  className={`grid grid-cols-1 gap-8 ${
    user?.role === "employee" ? "" : "lg:grid-cols-2"
  }`}
>

          {/* ================= LEFT TABLE ================= */}
          <Card className="shadow-sm border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between gap-4">
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

              <Button
                variant="outline"
                size="sm"
                className="shrink-0"
                onClick={() => navigate(leftTablePath)}
              >
                View All <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
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
                          onClick={() => openProjectDetail(project)}
                          className="cursor-pointer hover:bg-gray-50 transition-colors"
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
                          onClick={() => openTaskDetail(task)}
                          className="cursor-pointer hover:bg-gray-50 transition-colors"
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
                          onClick={() => openSubTaskDetail(subTask)}
                          className="cursor-pointer hover:bg-gray-50 transition-colors"
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
              <CardHeader className="flex flex-row items-center justify-between gap-4">
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

                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                  onClick={() => navigate(rightTablePath)}
                >
                  View All <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
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
                              onClick={() => openTaskDetail(task)}
                              className="cursor-pointer hover:bg-gray-50 transition-colors"
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
                              onClick={() => openSubTaskDetail(subTask)}
                              className="cursor-pointer hover:bg-gray-50 transition-colors"
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
