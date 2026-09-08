import React, { useEffect, useState } from "react";
import {
  Plus,
  MoreHorizontal,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  CheckSquare,
  UserCheck,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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
import ProjectForm from "./forms/ProjectForm";
import ProjectDetailCard from "./cards/ProjectDetailCard";
import TaskStatusChangeModal from "./cards/TaskStatusChangeModal";
import { useToast } from "@/hooks/use-toast";
import {
  formatDateTime,
  getStatusColor,
  getPriorityColor,
} from "@/services/allFunctions";
import DeleteCard from "@/components/cards/DeleteCard";
import { useNavigate } from "react-router-dom";
import TaskForm from "./forms/TaskForm";
import SubTaskForm from "./forms/SubTaskForm";
import {useGetAllProjectQuery,useDeleteProjectMutation,useUpdateProjectStatusMutation} from "@/redux-toolkit/api/admin/project.api";
import { ExcelTaskForm } from "@/task/forms/ExcelTaskForm";
import {socket} from "@/socket/socket";

type Priority = "low" | "medium" | "high" | "urgent";
interface ProjectItem {
  _id: string;
  name: string;
  status: | "pending" | "in_progress" | "completed" | "overdue" | "active" | "cancelled";
  endDate: string;
  startDate: string;
  priority: Priority;
  clientId?: any;
}

const Project: React.FC = () => {
  const { toast } = useToast();
  const user = JSON.parse(localStorage.getItem("user"));
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isProjectDetailOpen, setIsProjectDetailOpen] = useState(false);
  const [isTaskStatusChangeModalOpen, setIsTaskStatusChangeModalOpen] =
    useState(false);
  const [name, setName] = useState("Project");
  const [initialData, setInitialData] = useState<ProjectItem | null>(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [newStatus, setNewStatus] = useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(null);
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  const [taskOpenForm, setTaskOpenForm] = useState(false);
  const [subTaskOpenForm, setSubTaskOpenForm] = useState(false);
  const [openExcelForm, setOpenExcelForm] = useState(false);
  const [projectId, setProjectId] = useState("");
  const [viewSelectedProjectId, setViewSelectedProjectId] = useState("");
  const [updateProjectStatus, { isLoading: isUpdateStatus }] =
    useUpdateProjectStatusMutation();
  const [deleteProject, { isLoading: isDeleting }] = useDeleteProjectMutation();
  const { data, refetch:allProjectRefetch, isLoading: isProjectsLoading } = useGetAllProjectQuery(
    { companyId: user?.companyId },
    {
      skip:
        user?.role === "super_admin" ||
        user?.role === "manager" ||
        user?.role === "employee" || !user?.id || !user?.role,
    },
  );
  const projects = data?.data || [];
  const navigate = useNavigate();

  useEffect(() => {
      const handleNotification = async(data) => {
          if(data?.recipientId?.toString() === user?.id?.toString()){
              allProjectRefetch();
          }
      };
  
      socket.on("notification", handleNotification);
  
      return () => {
        socket.off("notification", handleNotification);
      }
    },[allProjectRefetch, user?.id]);

  const isAllSelected =
    projects.length > 0 &&
    projects.every((project) => selectedProjectIds.includes(project._id));

  const isSelected = (id: string) => selectedProjectIds.includes(id);

  const handleSelectProject = (id: string) => {
    setSelectedProjectIds((prev) =>
      prev.includes(id)
        ? prev.filter((projectId) => projectId !== id)
        : [...prev, id],
    );
  };

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedProjectIds([]);
    } else {
      setSelectedProjectIds(projects.map((project) => project._id));
    }
  };

  const today = new Date();

  const filteredProjects = projects.filter((t) => {
    const matchesSearch = t.name.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "overdue"
        ? new Date(t.endDate) < today
        : t.status === filterStatus);

    return matchesSearch && matchesStatus;
  });

  const handleChangeStatus = async () => {
    try {
      const res = await updateProjectStatus({
        id: selectedProject?._id,
        companyId: user?.companyId,
        body: { status: newStatus },
      }).unwrap();
      toast({ title: "Project Status.", description: res.message });
      setIsTaskStatusChangeModalOpen(false);
      setSelectedProject(null);
    } catch (err: any) {
      console.log(err);
      toast({
        title: "Update Project Status Error",
        description: err?.data?.errors[0]?.message || err.data.message,
        variant: "destructive",
      });
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedProjectIds.length) {
      toast({
        title: "Project Not Selected.",
        description: `At least one project select.`,
      });
      return;
    }
    try {
      const res = await deleteProject({
        projectIds: selectedProjectIds,
        companyId: user?.companyId,
      }).unwrap();
      toast({
        title: "Project Deleted successfully.",
        description: `${res?.message}`,
      });
      setIsDeleteDialogOpen(false);
      setSelectedProjectIds([]);
    } catch (error) {
      console.error(error);
      toast({
        title: "Project Delete Error",
        description:
          error?.data?.errors[0]?.message ||
          error?.data?.message ||
          "Something went wrong",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <ExcelTaskForm
        isOpen={openExcelForm}
        onClose={() => {
          setOpenExcelForm(false);
        }}
        intialData={initialData}
      />
      <TaskForm
        isOpen={taskOpenForm}
        onClose={() => setTaskOpenForm(false)}
        initialData={null}
        projectId={projectId}
      />
      <SubTaskForm
        isOpen={subTaskOpenForm}
        taskId={null}
        onClose={() => setSubTaskOpenForm(false)}
        initialData={null}
      />
      <DeleteCard
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
        title={
          selectedProjectIds.length > 1
            ? `Delete ${selectedProjectIds.length} Projects`
            : "Confirm Project Deletion"
        }
        message={
          selectedProjectIds.length > 1
            ? `Are you sure you want to permanently delete these ${selectedProjectIds.length} projects? All associated tasks and subtasks will be removed and cannot be recovered.`
            : "Are you sure you want to permanently delete this project? All associated tasks and subtasks will be removed and cannot be recovered."
        }
      />
      <ProjectForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        initialData={initialData}
      />
      <ProjectDetailCard
        isOpen={isProjectDetailOpen}
        onClose={() => setIsProjectDetailOpen(false)}
        projectId={viewSelectedProjectId}
      />
      <TaskStatusChangeModal
        name={name}
        task={selectedProject}
        isOpen={isTaskStatusChangeModalOpen}
        newStatus={newStatus}
        setNewStatus={setNewStatus}
        onConfirm={handleChangeStatus}
        onClose={() => setIsTaskStatusChangeModalOpen(false)}
      />
      <div className="flex flex-col md:mt-[-34px] min-h-screen bg-gray-50/50 p-3 sm:p-6 space-y-6 max-w-[100vw] sm:max-w-none">
        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle>
              <div
                className="flex items-center justify-between
                  text-[13px] md:text-[25px] gap-2"
              >
                <span className="whitespace-nowrap">
                  Project List ({filteredProjects?.length})
                </span>

                <div className="flex items-center gap-2">
                  {selectedProjectIds.length > 0 && (
                    <Button
                      variant="destructive"
                      className="w-auto px-2 py-1 text-[12px] md:text-base whitespace-nowrap"
                      onClick={() => {
                        setIsDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="mr-1 h-3 w-3 md:h-4 md:w-4" />
                      Delete ({selectedProjectIds.length})
                    </Button>
                  )}

                  <Button
                    className="w-auto md:w-[150px] px-2 py-1 text-[12px] md:text-base whitespace-nowrap"
                    onClick={() => {
                      setInitialData(null);
                      setIsFormOpen(true);
                    }}
                  >
                    <Plus className="mr-1 h-3 w-3 md:h-4 md:w-4" />
                    Create Project
                  </Button>
                </div>
              </div>
            </CardTitle>

            <CardDescription className="mt-1 text-[11px] md:text-sm">
              All projects with status and due dates.
            </CardDescription>
          </CardHeader>

          <CardContent>
            {/* Search + Filter */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search projects..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8"
                />
              </div>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full sm:w-48">
                  <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem className="cursor-pointer" value="all">
                    All
                  </SelectItem>
                  <SelectItem className="cursor-pointer" value="pending">
                    Pending
                  </SelectItem>
                  <SelectItem className="cursor-pointer" value="active">
                    In Progress
                  </SelectItem>
                  <SelectItem className="cursor-pointer" value="completed">
                    Completed
                  </SelectItem>
                  <SelectItem className="cursor-pointer" value="overdue">
                    Overdue
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Table */}
            <div className="rounded-md border overflow-x-auto md:overflow-visible">
              <Table className="w-full">
                <TableHeader>
                  <TableRow className="text-[11px] md:text-sm">
                    <TableHead className="w-10 px-2 md:px-4">
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        onChange={handleSelectAll}
                        onClick={(e) => e.stopPropagation()}
                        className="h-4 w-4 cursor-pointer"
                      />
                    </TableHead>
                    <TableHead className="px-2 md:px-4">Project</TableHead>
                    <TableHead className="hidden lg:table-cell px-4">
                      Client
                    </TableHead>
                    <TableHead className="hidden md:table-cell px-4">
                      Start Day
                    </TableHead>
                    <TableHead className="px-2 md:px-4">End Day</TableHead>
                    <TableHead className="hidden md:table-cell px-4">
                      Priority
                    </TableHead>
                    <TableHead className="px-2 md:px-4">Status</TableHead>
                    <TableHead className="text-right px-2 md:px-4">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {
                  isProjectsLoading ? (
    // Loading rows
    Array.from({ length: 5 }).map((_, index) => (
      <TableRow key={index} className="animate-pulse">
        <TableCell className="w-10 px-2 md:px-4">
          <div className="h-4 w-4 bg-gray-200 rounded" />
        </TableCell>

        <TableCell className="px-2 md:px-4">
          <div className="h-4 w-24 md:w-40 bg-gray-200 rounded" />
        </TableCell>

        <TableCell className="hidden lg:table-cell px-4">
          <div className="h-4 w-24 bg-gray-200 rounded" />
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
                  filteredProjects.length ? (
                    filteredProjects.map((project) => (
                      <TableRow
                        key={project._id}
                        className="cursor-pointer text-[11px] md:text-sm"
                        onClick={() => {
                          navigate("/tasks/task", {
                            state: { id: project?._id, name: project?.name },
                          });
                        }}
                      >
                        <TableCell className="w-10 px-2 md:px-4">
                          <input
                            type="checkbox"
                            checked={isSelected(project._id)}
                            onChange={() => handleSelectProject(project._id)}
                            onClick={(e) => e.stopPropagation()}
                            className="h-4 w-4 cursor-pointer"
                          />
                        </TableCell>
                        <TableCell className="font-medium px-2 md:px-4 truncate max-w-[100px] md:max-w-none">
                          {project.name}
                        </TableCell>

                        <TableCell className="hidden lg:table-cell px-4">
                          {project.clientId ? (
                            <span className="whitespace-nowrap">
                              {project.clientId.fullName}
                              {project.clientId.clientCompanyName && (
                                <span className="block text-[10px] text-muted-foreground">
                                  {project.clientId.clientCompanyName}
                                </span>
                              )}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>

                        <TableCell className="hidden md:table-cell px-4">
                          {formatDateTime(project.startDate)}
                        </TableCell>

                        <TableCell className="px-2 md:px-4 text-[10px] md:text-sm">
                          {formatDateTime(project.endDate)}
                        </TableCell>

                        <TableCell className="hidden md:table-cell px-4">
                          <Badge className={getPriorityColor(project.priority)}>
                            {project.priority}
                          </Badge>
                        </TableCell>

                        <TableCell className="px-2 md:px-4">
                          <Badge
                            className={`${getStatusColor(project.status)} text-[10px] md:text-xs px-1 py-0`}
                          >
                            {project.status === "active"
                              ? "In_Progress"
                              : project.status.charAt(0).toUpperCase() +
                                project.status.slice(1)}
                          </Badge>
                        </TableCell>

                        <TableCell className="text-right px-2 md:px-4">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 md:h-8 md:w-8"
                              >
                                <MoreHorizontal className="h-3 w-3 md:h-4 md:w-4" />
                              </Button>
                            </DropdownMenuTrigger>

                            <DropdownMenuContent align="end" className="w-44">
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setProjectId(project?._id);
                                  setTaskOpenForm(true);
                                }}
                                className="flex items-center gap-2"
                              >
                                <CheckSquare className="h-4 w-4" />
                                Add Task
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setViewSelectedProjectId(project?._id);
                                  setIsProjectDetailOpen(true);
                                }}
                                className="flex items-center gap-2"
                              >
                                <Eye className="h-4 w-4" />
                                View
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setInitialData(project);
                                  setOpenExcelForm(true);
                                }}
                                className="flex items-center gap-2 cursor-pointer"
                              >
                                <UserCheck className="h-4 w-4 text-blue-600" />
                                Add Task From Excel
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedProject(project);
                                  setIsTaskStatusChangeModalOpen(true);
                                }}
                                className="flex items-center gap-2"
                              >
                                <Filter className="h-4 w-4" />
                                Change Status
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setInitialData(project);
                                  setIsFormOpen(true);
                                }}
                                className="flex items-center gap-2"
                              >
                                <Edit className="h-4 w-4" />
                                Edit
                              </DropdownMenuItem>

                              <DropdownMenuSeparator />

                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedProjectIds([project?._id]);
                                  setIsDeleteDialogOpen(true);
                                }}
                                className="flex items-center gap-2 text-red-600"
                              >
                                <Trash2 className="h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="text-center h-20 text-sm"
                      >
                        No projects found
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

export default Project;
