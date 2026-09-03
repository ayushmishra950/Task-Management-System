import React, { useEffect, useState } from "react";
import {Plus,MoreHorizontal,Search,Filter,Eye,Edit,UserCheck,Trash2} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue,} from "@/components/ui/select";
import SubTaskForm from "./forms/SubTaskForm";
import ReassignForm from "./forms/ReassignForm";
import TaskStatusChangeModal from "./cards/TaskStatusChangeModal";
import SubTaskDetailCard from "./cards/SubTaskDetailCard";
import { useToast } from "@/hooks/use-toast";
import { formatDateTime, getPriorityColor } from "@/services/allFunctions";
import DeleteCard from "@/components/cards/DeleteCard";
import { useLocation } from "react-router-dom";
import {
  useGetAllSubTaskQuery,
  useUpdateSubTaskStatusMutation,
  useDeleteSubTaskMutation,
  useReassignedSubTaskMutation,
} from "@/redux-toolkit/api/admin/subTask.api";
import BulkSubTaskUpdateForm from "@/task/forms/BulkSubTaskUpdateForm";
import { socket } from "@/socket/socket";

const SubTask: React.FC = () => {
  const user = JSON.parse(localStorage.getItem("user"));
  const { toast } = useToast();

  const location = useLocation();
  const taskId = location?.state?.id;
  const taskName = location?.state?.taskName;
  const projectName = location?.state?.projectName;

  const [search, setSearch] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [initialData, setInitialData] = useState<any>(null);
  const [isTaskStatusChangeModalOpen, setIsTaskStatusChangeModalOpen] =
    useState(false);
  const [name, setName] = useState("Sub-Task");
  const [reasignForm, setReasignForm] = useState(false);
  const [isSubTaskDetailCardOpen, setIsSubTaskDetailCardOpen] = useState(false);
  const [selectedSubTask, setSelectedSubTask] = useState(null);
  const [newStatus, setNewStatus] = useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(null);
  const [selectedSubTaskIds, setSelectedSubTaskIds] = useState<string[]>([]);
  const [viewSeletedId, setViewSelectedId] = useState("");
  const [deleteSubTask, { isLoading: isDeleting }] = useDeleteSubTaskMutation();
  const [updateSubTaskStatus] = useUpdateSubTaskStatusMutation();
  const [bulkSubTaskFormOpen, setBulkSubTaskFormOpen] = useState(false);
  const [bulkSubTaskInitialData, setBulkSubTaskInitialData] = useState<any[]>(
    [],
  );
  const [reassignedSubTask, { isLoading }] = useReassignedSubTaskMutation();
  const { data: adminSubTaskData, error, refetch:subTaskRefetch, isLoading:isSubTaskLoading } = useGetAllSubTaskQuery({
    taskId: taskId ? taskId : "",
    companyId: user?.companyId,
  }, {skip:!user?.id || !user?.role});
  const subTaskList = adminSubTaskData?.data;
  const today = new Date();

  const filteredSubTasks = subTaskList?.filter((t) => {
    const matchesTasks = taskId ? t?.taskId?._id === taskId : true;
    const matchesSearch = t?.name
      ?.toLowerCase()
      ?.includes(search?.toLowerCase());

    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "overdue"
        ? new Date(t.endDate) < today
        : t?.status === filterStatus);

    return matchesTasks && matchesSearch && matchesStatus;
  });

  const isAllSelected =
    filteredSubTasks?.length > 0 &&
    filteredSubTasks.every((subTask) =>
      selectedSubTaskIds.includes(subTask._id),
    );

  const isSubTaskSelected = (id: string) => {
    return selectedSubTaskIds.includes(id);
  };


  useEffect(() => {
    const handleNotification = async(data) => {
      if(data?.recipientId?.toString() === user?.id?.toString()){
      subTaskRefetch()
      }
    };
    socket.on("notification", handleNotification);
    
    return () => {
      socket.off("notification", handleNotification);
    }
  },[subTaskRefetch, user?.id]);

  const handleSelectSubTask = (id: string) => {
    setSelectedSubTaskIds((prev) =>
      prev.includes(id)
        ? prev.filter((subTaskId) => subTaskId !== id)
        : [...prev, id],
    );
  };

  const handleSelectAllSubTasks = () => {
    const filteredIds = filteredSubTasks?.map((subTask) => subTask._id) || [];

    if (isAllSelected) {
      setSelectedSubTaskIds((prev) =>
        prev.filter((id) => !filteredIds.includes(id)),
      );
    } else {
      setSelectedSubTaskIds((prev) => [...new Set([...prev, ...filteredIds])]);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100/80";
      case "active":
        return "bg-blue-100 text-blue-800 hover:bg-blue-100/80";
      case "completed":
        return "bg-green-100 text-green-800 hover:bg-green-100/80";
      case "overdue":
        return "bg-red-100 text-red-800 hover:bg-red-100/80";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-100/80";
    }
  };

  const handleChangeStatus = async () => {
    try {
      const res = await updateSubTaskStatus({
        id: selectedSubTask?._id,
        companyId: user?.companyId,
        body: { status: newStatus },
      });
      toast({ title: "Sub Task Status.", description: res.data.message });
      setIsTaskStatusChangeModalOpen(false);
    } catch (err) {
      console.log(err);
      toast({
        title: "Update Sub Task Status Error",
        description: err?.data?.errors?.[0]?.message || err.data.message,
        variant: "destructive",
      });
    }
  };

  const handleReassignTask = async (object) => {
    const obj = {
      reason: object?.reason,
      endDate: object?.endDate,
      startDate: object?.startDate,
      newEmployeeId: object?.employeeId,
      subTaskId: object?.id,
    };
    try {
      const res = await reassignedSubTask(obj).unwrap();
      toast({
        title: "Reassign Sub Task Successfully.",
        description: res.message,
      });
      setReasignForm(false);
    } catch (err: any) {
      console.log(err);
      toast({
        title: "Reassign Sub Task Error",
        description: err?.data?.errors?.[0]?.message || err.data.message,
        variant: "destructive",
      });
    }
  };

  const handleConfirmDelete = async () => {
    try {
      const res = await deleteSubTask({
        subTaskIds: selectedSubTaskIds,
        companyId: user?.companyId,
      }).unwrap();
      toast({
        title: "Sub Task Deleted successfully.",
        description: `${res?.message}`,
      });
      setIsDeleteDialogOpen(false);
      setSelectedSubTaskIds([]);
    } catch (error: any) {
      console.error(error);
      toast({
        title: "Sub Task Delete Error",
        description:
          error?.data?.errors?.[0]?.message ||
          error?.data?.message ||
          "Something went wrong",
        variant: "destructive",
      });
    }
  };

  const selectedSubTasks =
    subTaskList?.filter((subTask) =>
      selectedSubTaskIds.includes(subTask._id),
    ) || [];

  return (
    <>
      <BulkSubTaskUpdateForm
        isOpen={bulkSubTaskFormOpen}
        onClose={() => {
          setBulkSubTaskFormOpen(false);
        }}
        initialData={bulkSubTaskInitialData}
      />
      <SubTaskForm
        isOpen={isFormOpen}
        taskId={null}
        onClose={() => setIsFormOpen(false)}
        initialData={initialData}
      />
      <ReassignForm
        isOpen={reasignForm}
        onClose={() => {
          setReasignForm(false);
        }}
        data={selectedSubTask}
        reassignName={"Employee"}
        onSave={handleReassignTask}
        reassignedType={"subTask"}
      />
      <DeleteCard
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
        title="Confirm Subtask Deletion"
        message="Are you sure you want to permanently delete this subtask? Once deleted, it cannot be recovered."
      />
      <SubTaskDetailCard
        isOpen={isSubTaskDetailCardOpen}
        initialData={initialData}
        onClose={() => setIsSubTaskDetailCardOpen(false)}
      />
      <TaskStatusChangeModal
        name={name}
        task={selectedSubTask}
        isOpen={isTaskStatusChangeModalOpen}
        newStatus={newStatus}
        setNewStatus={setNewStatus}
        onConfirm={handleChangeStatus}
        onClose={() => setIsTaskStatusChangeModalOpen(false)}
      />
      <div className="flex flex-col md:mt-[-30px] min-h-screen bg-gray-50/50 p-6 space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              {/* LEFT SIDE */}
              <div className="flex items-center gap-2 min-w-0">
                {taskId && projectName && taskName ? (
                  <>
                    <h1 className="text-[14px] sm:text-3xl font-bold text-gray-900 truncate">
                      {projectName} &gt; {taskName}
                    </h1>

                    <h2 className="text-[12px] sm:text-xl font-semibold text-gray-700 whitespace-nowrap">
                      Sub-Task List ({filteredSubTasks?.length})
                    </h2>
                  </>
                ) : (
                  <h2 className="text-[14px] sm:text-3xl font-bold text-gray-900 truncate">
                    Sub-Task List
                  </h2>
                )}
              </div>

              {/* RIGHT SIDE BUTTON */}
              {(user?.role === "admin" || user?.role === "manager") && (
                <div className="flex items-center gap-1 sm:gap-2">
                  {selectedSubTaskIds.length > 0 && (
                    <>
                      <Button
                        variant="outline"
                        className="px-2 py-1 text-[11px] sm:text-sm h-7 sm:h-10 whitespace-nowrap"
                        onClick={() => {
                          setBulkSubTaskInitialData(selectedSubTasks);
                          setBulkSubTaskFormOpen(true);
                          setSelectedSubTaskIds([]);
                        }}
                      >
                        <Edit className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
                        Edit ({selectedSubTaskIds.length})
                      </Button>

                      <Button
                        variant="destructive"
                        className="px-2 py-1 text-[11px] sm:text-sm h-7 sm:h-10 whitespace-nowrap"
                        onClick={() => {
                          setIsDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
                        Delete ({selectedSubTaskIds.length})
                      </Button>
                    </>
                  )}

                  <Button
                    className="px-2 py-1 text-[11px] md:w-[160px] sm:text-sm h-7 sm:h-10 whitespace-nowrap"
                    onClick={() => {
                      setInitialData(null);
                      setIsFormOpen(true);
                    }}
                  >
                    <Plus className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
                    Create Sub Task
                  </Button>
                </div>
              )}
            </div>

            {/* DESCRIPTION */}
            {taskId && projectName && taskName && (
              <p className="text-gray-500 text-[11px] sm:text-sm mt-1">
                Manage tasks for this project, track progress, and deadlines.
              </p>
            )}
          </CardHeader>

          <CardContent>
            {/* Search and Filter */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search sub-tasks..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
              <div className="w-full md:w-48">
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
                    <SelectValue placeholder="Filter by Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending" className="cursor-pointer">
                      Pending
                    </SelectItem>
                    <SelectItem value="active" className="cursor-pointer">
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
            </div>

            {/* Table */}
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="text-[11px] md:text-sm">
                   {user?.role !== "employee" && <TableHead className="w-10 px-1 md:px-4">
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        onChange={handleSelectAllSubTasks}
                        onClick={(e) => e.stopPropagation()}
                        className="h-4 w-4 cursor-pointer"
                      />
                    </TableHead>}
                    <TableHead className="px-1 md:px-4">
                      Sub-Task Title
                    </TableHead>
                    <TableHead className="hidden md:table-cell">
                      Parent Task
                    </TableHead>
                    <TableHead className="hidden md:table-cell">
                      {user?.role === "admin" || user?.role === "manager"
                        ? "Assignee (Employee)"
                        : "AssignedBy"}
                    </TableHead>

                    <TableHead className="hidden md:table-cell">
                      Priority
                    </TableHead>
                    <TableHead className="px-1 md:px-4">Status</TableHead>
                    <TableHead className="px-1 md:px-4">Due Date</TableHead>
                    <TableHead className="text-right px-1 md:px-4">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {
                   isSubTaskLoading ? (
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
                  filteredSubTasks?.length > 0 ? (
                    filteredSubTasks?.map((subTask) => (
                      <TableRow
                        key={subTask?._id}
                        className="text-[11px] md:text-sm"
                      >
                       { user?.role !== "employee" && <TableCell className="w-10 px-1 md:px-4">
                          <input
                            type="checkbox"
                            checked={isSubTaskSelected(subTask?._id)}
                            onChange={() => handleSelectSubTask(subTask?._id)}
                            onClick={(e) => e.stopPropagation()}
                            className="h-4 w-4 cursor-pointer"
                          />
                        </TableCell>}

                        {/* Title */}
                        <TableCell className="font-medium px-1 md:px-4 truncate max-w-[100px]">
                          {subTask?.name}
                        </TableCell>

                        {/* Parent Task */}
                        <TableCell className="hidden md:table-cell">
                          {subTask?.taskId?.name}
                        </TableCell>

                        {/* Employee */}
                        <TableCell className="hidden md:table-cell">
                          {user?.role === "admin" ||
                          user?.role === "manager" ? (
                            <>
                              {subTask?.employeeId?.fullName} (
                              {subTask?.employeeId?.department?.name})
                            </>
                          ) : (
                            <>
                              {subTask?.createdBy?.fullName}
                              {`(${subTask?.createdBy?.role})`}
                            </>
                          )}
                        </TableCell>

                        {/* Priority */}
                        <TableCell className="hidden md:table-cell">
                          <Badge
                            className={`${getPriorityColor(subTask?.priority)} whitespace-nowrap`}
                          >
                            {subTask?.priority}
                          </Badge>
                        </TableCell>

                        {/* Status */}
                        <TableCell className="px-1 md:px-4">
                          <Badge
                            variant="outline"
                            className={`${getStatusColor(subTask?.status)} text-[10px] md:text-sm px-1 py-0`}
                          >
                            {subTask?.status === "active"
                              ? "In_Progress"
                              : subTask?.status?.charAt(0)?.toUpperCase() +
                                subTask?.status?.slice(1)}
                          </Badge>
                        </TableCell>

                        {/* Due Date */}
                        <TableCell className="px-1 md:px-4 whitespace-nowrap text-[10px] md:text-sm">
                          {formatDateTime(subTask?.endDate)}
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="text-right px-1 md:px-4">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                className="h-7 w-7 md:h-8 md:w-8 p-0"
                              >
                                <MoreHorizontal className="h-3 w-3 md:h-4 md:w-4" />
                              </Button>
                            </DropdownMenuTrigger>

                            <DropdownMenuContent align="end" className="w-44">
                              <DropdownMenuItem
                                className="flex items-center gap-2 cursor-pointer"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setInitialData(subTask);
                                  setIsSubTaskDetailCardOpen(true);
                                }}
                              >
                                <Eye className="h-4 w-4 text-green-600" />
                                View
                              </DropdownMenuItem>

                             {user?.role !== "employee" && <><DropdownMenuItem
                                className="flex items-center gap-2 cursor-pointer"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setInitialData(subTask);
                                  setIsFormOpen(true);
                                }}
                              >
                                <Edit className="h-4 w-4 text-green-600" />
                                Edit
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedSubTask(subTask);
                                  setReasignForm(true);
                                }}
                                className="flex items-center gap-2 cursor-pointer"
                              >
                                <UserCheck className="h-4 w-4 text-blue-600" />
                                Reassign
                              </DropdownMenuItem></>}
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedSubTask(subTask);
                                  setIsTaskStatusChangeModalOpen(true);
                                }}
                                className="flex items-center gap-2 cursor-pointer"
                              >
                                <Filter className="h-4 w-4 text-purple-600" />
                                Change Status
                              </DropdownMenuItem>

                              <DropdownMenuSeparator />

{                           user?.role !== "employee" && (
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedSubTaskIds([subTask?._id]);
                                  setIsDeleteDialogOpen(true);
                                }}
                                className="flex items-center gap-2 text-red-600 cursor-pointer"
                              >
                                <Trash2 className="h-4 w-4" />
                                Delete
                              </DropdownMenuItem>)}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="h-20 text-center text-sm"
                      >
                        No Sub Task Found.
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

export default SubTask;
