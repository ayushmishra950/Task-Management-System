import React, { useEffect, useState } from "react";
import {
  Plus,
  MoreHorizontal,
  Search,
  Filter,
  Eye,
  Edit,
  UserCheck,
  Trash2,
  CheckSquare,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import TaskForm from "./forms/TaskForm";
import SubTaskForm from "./forms/SubTaskForm";
import ReassignForm from "./forms/ReassignForm";
import TaskStatusChangeModal from "./cards/TaskStatusChangeModal";
import TaskDetailCard from "./cards/TaskDetailCard";
import { useToast } from "@/hooks/use-toast";
import {
  formatDateTime,
  getStatusColor,
  getPriorityColor,
} from "@/services/allFunctions";
import DeleteCard from "@/components/cards/DeleteCard";
import { useLocation, useNavigate } from "react-router-dom";
import ActiveFilterBanner, { isCreatedThisMonth, isOverdueItem } from "@/components/cards/ActiveFilterBanner";
import { EmployeeFormDialog } from "@/Forms/EmployeeFormDialog";
import {
  useGetAllTaskQuery,
  useDeleteTaskMutation,
  useUpdateTaskStatusMutation,
  useReassignedTaskMutation,
} from "@/redux-toolkit/api/admin/task.api";
import { ExcelSubTaskForm } from "@/task/forms/ExcelSubTaskForm";
import BulkTaskUpdateForm from "./forms/BulkTaskUpdateForm";
import {socket} from "@/socket/socket";

const Task: React.FC = () => {
  const { toast } = useToast();
  const location = useLocation();
  const projectId = location?.state?.id;
  const projectName = location?.state?.name;

  const user = JSON.parse(localStorage.getItem("user"));
  const [search, setSearch] = useState("");
  // Dashboard card se aaye to status filter pehle se set rahe
  const [filterStatus, setFilterStatus] = useState(location?.state?.status ?? "all");
  const [filterThisMonth, setFilterThisMonth] = useState(location?.state?.period === "this_month");
  // Project wise filter - Projects page se kisi project par click karke aaye to wahi project select rahe
  const [filterProject, setFilterProject] = useState<string>(projectId ?? "all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [initialData, setInitialData] = useState<any>(null);
  const [reasignForm, setReasignForm] = useState(false);
  const [isTaskStatusChangeModalOpen, setIsTaskStatusChangeModalOpen] =
    useState(false);
  const [name, setName] = useState("Task");
  const [taskCard, setTaskCard] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [newStatus, setNewStatus] = useState(null);
  const [reassignName, setReassignName] = useState("Manager");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(null);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [subTaskOpenForm, setSubTaskOpenForm] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [taskId, setTaskId] = useState("");
  const [viewTaskId, setViewTaskId] = useState("");
  const [reassignedTask, { isLoading }] = useReassignedTaskMutation();
  const [openExcelForm, setOpenExcelForm] = useState(false);
  const [bulkTaskUpdateFormOpen, setBulkTaskUpdateFormOpen] = useState(false);
  const [bulkTaskInitialData, setBulkTaskInitialData] = useState<any[]>([]);
  const [deleteTask, { isLoading: isDeleting }] = useDeleteTaskMutation();
  const [updateTaskStatus] = useUpdateTaskStatusMutation();
  const { data: adminTaskData, refetch: allTaskRefetch, isLoading:isTaskLoading } = useGetAllTaskQuery(
    // Hamesha poori list lao, project filter frontend par lagta hai (taaki dropdown me saare projects aaye)
    { projectId: null, companyId: user?.companyId },
    { skip: !user?.id || !user?.role || user?.role === "super_admin" || user?.role === "employee" },
  );
  const taskList = adminTaskData?.data;
  const navigate = useNavigate();

  // Dashboard par task row click karke aaye to usi task ka detail card khol do
  const dashboardViewTaskId = location?.state?.viewTaskId;
  useEffect(() => {
    if (!dashboardViewTaskId) return;
    setViewTaskId(dashboardViewTaskId);
    setTaskCard(true);
  }, [dashboardViewTaskId]);

  const today = new Date();

  useEffect(() => {
    const handleNotification = async(data) => {
        if(data?.recipientId?.toString() === user?.id?.toString()){
            allTaskRefetch();
        }
    };

    socket.on("notification", handleNotification);

    return () => {
      socket.off("notification", handleNotification);
    }
  },[allTaskRefetch, user?.id]);
  

  // Dropdown ke liye list me aaye tasks se unique projects
  const projectOptions: [string, string][] = Array.from(
    new Map<string, string>(
      (taskList || [])
        .filter((t) => t?.projectId?._id)
        .map((t) => [t.projectId._id, t.projectId.name || "Untitled Project"]),
    ).entries(),
  ).sort((a, b) => a[1].localeCompare(b[1]));
  const selectedProjectName = projectOptions.find(([id]) => id === filterProject)?.[1] ?? projectName;

  const filteredTasks = taskList?.filter((t) => {
    const matchesProject = filterProject === "all" || t?.projectId?._id === filterProject;
    const matchesSearch = t?.name.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      // "All" me completed nahi dikhte, wo sirf Completed filter chunne par dikhenge
      (filterStatus === "all" && t?.status !== "completed") ||
      (filterStatus === "overdue"
        ? isOverdueItem(t)
        : t.status === filterStatus);

    const matchesMonth = !filterThisMonth || isCreatedThisMonth(t?.createdAt);

    return matchesProject && matchesSearch && matchesStatus && matchesMonth;
  });

   const selectedTasks =
  taskList?.filter((task) =>
    selectedTaskIds.includes(task?._id),
  ) || [];


  const isAllSelected =
    filteredTasks?.length > 0 &&
    filteredTasks.every((task) => selectedTaskIds.includes(task._id));

  const isTaskSelected = (id: string) => {
    return selectedTaskIds.includes(id);
  };

  const handleSelectTask = (id: string) => {
    setSelectedTaskIds((prev) =>
      prev.includes(id)
        ? prev.filter((taskId) => taskId !== id)
        : [...prev, id],
    );
  };

  const handleSelectAllTasks = () => {
    const filteredIds = filteredTasks?.map((task) => task._id) || [];

    if (isAllSelected) {
      setSelectedTaskIds((prev) =>
        prev.filter((id) => !filteredIds.includes(id)),
      );
    } else {
      setSelectedTaskIds((prev) => [...new Set([...prev, ...filteredIds])]);
    }
  };

  const handleOpenTaskForm = () => {
    setInitialData(null);
    setIsFormOpen(true);
  };

  const handleReassignTask = async (object) => {
    const obj = {
      reason: object?.reason,
      endDate: object?.endDate,
      startDate: object?.startDate,
      newManagerId: object?.employeeId,
      taskId: object?.id,
    };
    try {
      const res = await reassignedTask(obj).unwrap();
      toast({ title: "Task transferred successfully.", description: res.message });
      setReasignForm(false);
    } catch (err: any) {
      console.log(err);
      toast({
        title: "Task Transfer Error",
        description:
          err?.data?.errors?.[0]?.message ||
          err.data.message ||
          "Something Went Wrong.",
        variant: "destructive",
      });
    }
  };

  const handleChangeStatus = async (reason?: string) => {
    const obj = {
      id: selectedTask?._id,
      companyId: user?.companyId,
      body: { status: newStatus, ...(reason ? { reason } : {}) },
    };
    try {
      const res = await updateTaskStatus(obj).unwrap();
      toast({ title: "Task Status.", description: res.message });
      setIsTaskStatusChangeModalOpen(false);
    } catch (err: any) {
      console.log(err);
      toast({
        title: "Task Status Change Error",
        description: err?.data?.errors?.[0]?.message || err.data.message,
        variant: "destructive",
      });
    }
  };

  const handleConfirmDelete = async () => {
    try {
      const res = await deleteTask({
        taskIds: selectedTaskIds,
        companyId: user?.companyId,
      }).unwrap();
      toast({
        title: "Task Deleted successfully.",
        description: `${res?.message}`,
      });
      setIsDeleteDialogOpen(false);
      setSelectedTaskIds([]);
    } catch (error: any) {
      console.error(error);
      toast({
        title: "Task Delete Error",
        description:
          error?.data?.errors?.[0]?.message ||
          error?.data?.message ||
          "Something went wrong",
      });
    }
  };

 

  return (
    <>
    <BulkTaskUpdateForm isOpen={bulkTaskUpdateFormOpen} onClose={() => {setBulkTaskUpdateFormOpen(false)}} initialData={bulkTaskInitialData} />
      <ExcelSubTaskForm
        isOpen={openExcelForm}
        onClose={() => {
          setOpenExcelForm(false);
        }}
        intialData={initialData}
      />
      <EmployeeFormDialog
        open={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
        }}
        isEditMode={false}
        initialData={null}
        selectedDepartmentId={""}
      />

      <SubTaskForm
        isOpen={subTaskOpenForm}
        onClose={() => setSubTaskOpenForm(false)}
        taskId={taskId}
        initialData={null}
      />

      <TaskForm
        projectId={null}
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        initialData={initialData}
      />
      <DeleteCard
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
        title="Confirm Task Deletion"
        message="Are you sure you want to permanently delete this task? All associated subtasks will also be deleted and cannot be recovered."
      />
      <ReassignForm
        isOpen={reasignForm}
        onClose={() => {
          setReasignForm(false);
        }}
        reassignedType={"task"}
        data={selectedTask}
        reassignName={"Manager"}
        onSave={handleReassignTask}
      />
      <TaskStatusChangeModal
        name={name}
        task={selectedTask}
        isOpen={isTaskStatusChangeModalOpen}
        newStatus={newStatus}
        setNewStatus={setNewStatus}
        onConfirm={handleChangeStatus}
        onClose={() => setIsTaskStatusChangeModalOpen(false)}
      />
      {(user?.role === "admin" || user?.role === "manager") && (
        <TaskDetailCard
          isOpen={taskCard}
          taskId={viewTaskId}
          onClose={() => setTaskCard(false)}
        />
      )}

      <div className="flex flex-col md:mt-[-30px] min-h-screen bg-gray-50/50 p-3 sm:p-6 space-y-6 max-w-[100vw] sm:max-w-none">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-2 w-full">
              {/* LEFT SIDE (always single row) */}
              <div className="flex items-center gap-2 min-w-0">
                {projectName && filterProject === projectId && (
                  <h1 className="text-[14px] sm:text-3xl font-bold text-gray-900 truncate">
                    Project: {projectName}
                  </h1>
                )}

                <h2 className="text-[12px] sm:text-xl font-semibold text-gray-700 whitespace-nowrap">
                  Task List ({filteredTasks?.length})
                </h2>
              </div>

              {/* RIGHT SIDE BUTTONS (single row, compact) */}
              {user?.role === "admin" && (
                <div className="flex items-center gap-1 sm:gap-2">
                {selectedTaskIds.length > 0 && (
  <>
    <Button
      variant="outline"
      className="px-2 py-1 text-[11px] sm:text-sm h-7 sm:h-9 whitespace-nowrap"
      onClick={() => {
        setBulkTaskInitialData(selectedTasks);
        setBulkTaskUpdateFormOpen(true);
        setSelectedTaskIds([]);
      }}
    >
      <Edit className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
      Edit ({selectedTaskIds.length})
    </Button>

    <Button
      variant="destructive"
      className="px-2 py-1 text-[11px] sm:text-sm h-7 sm:h-9 whitespace-nowrap"
      onClick={() => {
        setIsDeleteDialogOpen(true);
      }}
    >
      <Trash2 className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
      Delete ({selectedTaskIds.length})
    </Button>
  </>
)}


                  <Button
                    className="px-2 py-1 text-[11px] md:w-[140px] sm:text-sm h-7 sm:h-9"
                    onClick={() => setIsDialogOpen(true)}
                  >
                    <Plus className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
                    Add
                  </Button>

                  <Button
                    className="px-2 py-1 text-[11px] md:w-[140px] sm:text-sm h-7 sm:h-9"
                    onClick={handleOpenTaskForm}
                  >
                    <Plus className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
                    Create Task
                  </Button>
                </div>
              )}
            </div>

            {/* DESCRIPTION (only size adjust) */}
            {projectName && filterProject === projectId && (
              <p className="text-gray-500 text-[11px] sm:text-sm mt-1">
                Manage tasks for this project, track progress, and deadlines.
              </p>
            )}
          </CardHeader>

          <CardContent>
            {/* Kaunsa filter laga hai / kis dashboard card se aaye */}
            <ActiveFilterBanner
              sourceTitle={location?.state?.cardTitle}
              isSourceFilter={
                filterStatus === (location?.state?.status ?? "all") &&
                filterThisMonth === (location?.state?.period === "this_month") &&
                filterProject === (projectId ?? "all")
              }
              status={filterStatus}
              thisMonth={filterThisMonth}
              extraChips={filterProject !== "all" ? [`Project: ${selectedProjectName ?? "Selected"}`] : []}
              count={filteredTasks?.length ?? 0}
              itemLabel="tasks"
              onClear={() => {
                setFilterStatus("all");
                setFilterThisMonth(false);
                setFilterProject("all");
              }}
            />

            {/* Search & Filter */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tasks..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8"
                />
              </div>

              {/* Project wise filter */}
              <Select value={filterProject} onValueChange={setFilterProject}>
                <SelectTrigger className="w-full sm:w-56">
                  <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="cursor-pointer">
                    All Projects
                  </SelectItem>
                  {projectOptions.map(([id, name]) => (
                    <SelectItem key={id} value={id} className="cursor-pointer">
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full sm:w-48">
                  <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="cursor-pointer">
                    All (except Completed)
                  </SelectItem>
                  <SelectItem value="pending" className="cursor-pointer">
                    Pending
                  </SelectItem>
                  <SelectItem value="in_progress" className="cursor-pointer">
                    In Progress
                  </SelectItem>
                  <SelectItem value="completed" className="cursor-pointer">
                    Completed
                  </SelectItem>
                  <SelectItem value="overdue" className="cursor-pointer">
                    Overdue
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Table */}
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="text-[11px] md:text-sm">
                  { user?.role === "admin" && <TableHead className="w-10 px-1 md:px-4">
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        onChange={handleSelectAllTasks}
                        onClick={(e) => e.stopPropagation()}
                        className="h-4 w-4 cursor-pointer"
                      />
                    </TableHead>}
                    <TableHead className="px-1 md:px-4">Task</TableHead>
                    <TableHead className="hidden md:table-cell">
                      Project
                    </TableHead>

                    {["admin", "manager"].includes(user?.role) && (
                      <TableHead className="hidden md:table-cell">
                        {user?.role === "admin" ? "Assignee (Manager)" : "AssignedBy (Admin)"}
                      </TableHead>
                    )}

                    <TableHead className="hidden md:table-cell">
                      Priority
                    </TableHead>

                    <TableHead className="px-1 md:px-4">Status</TableHead>
                    <TableHead className="px-1 md:px-4">Due</TableHead>
                    <TableHead className="text-right px-1 md:px-4">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {
                    isTaskLoading ? (
    // Loading rows
    Array.from({ length: 5 }).map((_, index) => (
      <TableRow key={index} className="animate-pulse">
        <TableCell className="w-10 px-2 md:px-4">
          <div className="h-4 w-4 bg-gray-200 rounded" />
        </TableCell>

        <TableCell className="px-2 md:px-4">
          <div className="h-4 w-24 md:w-40 bg-gray-200 rounded" />
        </TableCell>

        <TableCell className="hidden md:table-cell px-4">
          <div className="h-4 w-28 bg-gray-200 rounded" />
        </TableCell>

        <TableCell className="px-2 md:px-4">
          <div className="h-4 w-28 bg-gray-200 rounded" />
        </TableCell>

        <TableCell className="hidden md:table-cell px-4">
          <div className="h-5 w-16 bg-gray-200 rounded-full" />
        </TableCell>

        <TableCell className="px-2 md:px-4">
          <div className="h-5 w-20 bg-gray-200 rounded-full" />
        </TableCell>

        <TableCell className="text-right px-2 md:px-4">
          <div className="h-7 w-7 bg-gray-200 rounded ml-auto" />
        </TableCell>
      </TableRow>
    ))
  ) :
                  filteredTasks?.length ? (
                    filteredTasks?.map((task) => (
                      <TableRow
                        key={task?._id}
                        className="text-[11px] md:text-sm cursor-pointer"
                        onClick={() => {
                          if (user?.role !== "employee") {
                            navigate("/tasks/sub-task", {
                              state: {
                                id: task?._id,
                                projectName: task?.projectId?.name,
                                taskName: task?.name,
                              },
                            });
                          }
                        }}
                      >
                        {user?.role === "admin" && (
                          <TableCell className="w-10 px-1 md:px-4">
                            <input
                              type="checkbox"
                              checked={isTaskSelected(task._id)}
                              onChange={() => handleSelectTask(task._id)}
                                onClick={(e) => e.stopPropagation()}
                            className="h-4 w-4 cursor-pointer"
                          />
                        </TableCell>)}
                        {/* Task */}
                        <TableCell className="font-medium px-1 md:px-4 truncate max-w-[90px]">
                          {task?.name}
                        </TableCell>

                        {/* Project */}
                        <TableCell className="hidden md:table-cell whitespace-nowrap">
                          {task?.projectId?.name}
                        </TableCell>

                        {/* Assigned By */}
                        {["admin", "manager"].includes(user?.role) && (
                          <TableCell className="hidden md:table-cell">
                            {user?.role === "admin"
                              ? `${task?.managerId?.fullName} (${task?.managerId?.department?.name})`
                              : task?.createdBy?.fullName}
                          </TableCell>
                        )}

                        {/* Priority */}
                        <TableCell className="hidden md:table-cell">
                          <Badge
                            className={`${getPriorityColor(task?.priority)} whitespace-nowrap`}
                          >
                            {task?.priority}
                          </Badge>
                        </TableCell>

                        {/* Status */}
                        <TableCell className="px-1 md:px-4">
                          <Badge className={getStatusColor(task?.status)}>
                            {task?.status === "active"
                              ? "In_Progress"
                              : task?.status?.charAt(0).toUpperCase() +
                                task?.status?.slice(1)}
                          </Badge>
                        </TableCell>

                        {/* Due */}
                        <TableCell className="px-1 md:px-4 whitespace-nowrap">
                          {formatDateTime(task?.endDate)}
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="text-right px-1 md:px-4">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 md:h-9 md:w-9"
                              >
                                <MoreHorizontal className="h-3 w-3 md:h-4 md:w-4" />
                              </Button>
                            </DropdownMenuTrigger>

                            <DropdownMenuContent align="end" className="w-44">
                              <DropdownMenuItem
                                className="flex items-center gap-2 cursor-pointer"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setTaskId(task?._id);
                                  setSubTaskOpenForm(true);
                                }}
                              >
                                <CheckSquare className="h-4 w-4 text-green-600" />
                                Add Sub-Task
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                className="flex items-center gap-2 cursor-pointer"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setViewTaskId(task?._id);
                                  setTaskCard(true);
                                }}
                              >
                                <Eye className="h-4 w-4 text-green-600" />
                                View Task
                              </DropdownMenuItem>

                              {user?.role === "admin" && (
                                <>
                                  <DropdownMenuItem
                                    className="flex items-center gap-2 cursor-pointer"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setInitialData(task);
                                      setIsFormOpen(true);
                                    }}
                                  >
                                    <Edit className="h-4 w-4 text-green-600" />
                                    Edit Task
                                  </DropdownMenuItem>

                                  {user?.role === "admin" && (
                                    <DropdownMenuItem
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedTask(task);
                                        setReasignForm(true);
                                      }}
                                      className="flex items-center gap-2 cursor-pointer"
                                    >
                                      <UserCheck className="h-4 w-4 text-blue-600" />
                                      Transfer to Other
                                    </DropdownMenuItem>
                                  )}
                                </>
                              )}

                              {/* Excel se sub task - admin aur manager (manager ko sirf apne assigned tasks hi dikhte hai) */}
                              {(user?.role === "admin" || user?.role === "manager") && (
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setInitialData(task);
                                    setOpenExcelForm(true);
                                  }}
                                  className="flex items-center gap-2 cursor-pointer"
                                >
                                  <UserCheck className="h-4 w-4 text-blue-600" />
                                  Add SubTask From Excel
                                </DropdownMenuItem>
                              )}

                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedTask(task);
                                  setIsTaskStatusChangeModalOpen(true);
                                }}
                                className="flex items-center gap-2 cursor-pointer"
                              >
                                <Filter className="h-4 w-4 text-purple-600" />
                                Change Status
                              </DropdownMenuItem>

                              <DropdownMenuSeparator />

                              {user?.role === "admin" && (
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedTaskIds([task?._id]);
                                    setIsDeleteDialogOpen(true);
                                  }}
                                  className="flex items-center gap-2 text-red-600 cursor-pointer"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  Delete Task
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="text-center h-24 text-sm"
                      >
                        No tasks found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default Task;
