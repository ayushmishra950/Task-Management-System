import React, { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ChevronDown } from "lucide-react";
import { Priority, SubTaskFormModalProps, SubTaskFormData } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { formatForDateTimeInput } from "@/services/allFunctions";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import TaskForm from "./TaskForm";
import { EmployeeFormDialog } from "@/Forms/EmployeeFormDialog";
import {useCreateSubTaskMutation, useUpdateSubTaskMutation} from "@/redux-toolkit/api/admin/subTask.api";
import {useGetAllTaskQuery} from "@/redux-toolkit/api/admin/task.api";
import {useGetAllEmployeeQuery} from "@/redux-toolkit/api/admin/employee.api";

const SubTaskForm: React.FC<SubTaskFormModalProps> = ({
  isOpen,
  onClose,
  initialData,
  taskId
}) => {
  const user = JSON.parse(localStorage.getItem("user"));
  const { toast } = useToast();
  const [taskForm, setTaskForm] = useState<SubTaskFormData>();
  const [employeeList, setEmployeeList] = useState<any[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [taskDates, setTaskDates] = useState<{ startDate?: string; endDate?: string }>({});
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const startDateRef = useRef(null);
  const endDateRef = useRef(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showScrollArrow, setShowScrollArrow] = useState(false);
  const [createSubTask, {isLoading:createLoading}] = useCreateSubTaskMutation();
  const [updateSubTask, {isLoading:updateLoading}] = useUpdateSubTaskMutation();
  
  const loading = createLoading || updateLoading;

    const {data:employeeData, isLoading:employeeLoading, error:employeeError} = useGetAllEmployeeQuery({companyId:user?.companyId});
   const {data:taskData, error} = useGetAllTaskQuery({projectId:"", companyId:user?.companyId}, {skip:user?.role === "super_admin"});
   const taskList = taskData?.data ?? [];
 
   const isAdmin = user?.role === "admin";
const isManager = user?.role === "manager";
// Sirf employee role wale
const userList = (employeeData?.data ?? []).filter(
  (employee) => employee?.role === "employee"
);
  const isEdit = Boolean(initialData);

  // Scroll detection
  const checkScrollable = () => {
    if (!scrollRef.current) return;
    const { scrollHeight, clientHeight } = scrollRef.current;
    setShowScrollArrow(scrollHeight > clientHeight + 5);
  };

  useEffect(() => {
    if (!isOpen) return;
    checkScrollable();
    const timer = setTimeout(checkScrollable, 400);
    const ro = new ResizeObserver(checkScrollable);
    if (scrollRef.current) ro.observe(scrollRef.current);
    return () => {
      clearTimeout(timer);
      ro.disconnect();
    };
  }, [isOpen, taskForm, employeeList, taskList, isFormOpen]);

  useEffect(() => {
    if (taskId) {
      setTaskForm(prev => ({ ...prev, taskId }));
    }
  }, [taskId]);

  useEffect(() => {
    const initializeForm = async () => {
      if (!isOpen) return;

      if (initialData?._id || taskId) {
        const selectedTaskId = taskId || initialData?.taskId?._id || initialData?.taskId;
        if (!user?.id || (!user?.companyId)) return;

      const selectedTask = taskList.find(t => t._id === selectedTaskId);


        if (selectedTask) {
          setTaskDates({
            startDate: formatForDateTimeInput(selectedTask?.startDate),
            endDate: formatForDateTimeInput(selectedTask?.endDate),
          });
       setEmployeeList(userList);

setTaskForm({
  _id: initialData?._id,
  taskId: selectedTaskId,
  name: initialData?.name,
  description: initialData?.description,
  startDate: formatForDateTimeInput(initialData?.startDate),
  endDate: formatForDateTimeInput(initialData?.endDate),
  employee: initialData?.employeeId?._id || "",
  priority: initialData?.priority,
  remarks: initialData?.remarks,
  url: initialData?.url || "",
});

        }
      } else {
        setTaskForm({ taskId, url:"" });
        setEmployeeList([]);
      }
    };

    initializeForm();
  }, [isOpen, initialData, taskId]);

  const handleParentTaskChange = (selectedTaskId: string) => {
  if (isEdit || initialData?._id) return;

  const selectedTask = taskList.find(t => t._id === selectedTaskId);
  if (!selectedTask) return;

  setEmployeeList(userList);

  setTaskForm(prev => ({
    ...prev,
    taskId: selectedTaskId,
    employee: ""
  }));

  setTaskDates({
    startDate: formatForDateTimeInput(selectedTask.startDate),
    endDate: formatForDateTimeInput(selectedTask.endDate),
  });
};



  const handleSave = async (e?: React.FormEvent, forceCreate = false) => {
    e?.preventDefault();

    const payload = {
      companyId: user?.companyId,
      taskId: taskForm?.taskId,
      createdBy: user?.id,
      employeeId: taskForm?.employee,
      name: taskForm?.name,
      description: taskForm?.description,
      remarks: taskForm?.remarks,
      startDate: taskForm?.startDate,
      endDate: taskForm?.endDate,
      priority: taskForm?.priority,
      url:taskForm?.url || "http://localhost:5000",
      status:"pending"
    };
    try {
    const res = await (isEdit ? updateSubTask({ id: initialData?._id, companyId: user?.companyId, body: payload}).unwrap() : createSubTask({ body: payload}).unwrap());
        toast({
          title: isEdit ? "Update Sub Task Successfully" : "Add Sub Task Successfully",
          description: res.message,
        });
        onClose();
    } catch (err: any) {
      console.log(err);
      toast({
        title: "SubTask Error",
        description: err?.data?.errors?.[0]?.message || err.response?.data?.message || "Failed to save",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <EmployeeFormDialog
        open={isDialogOpen}
        onClose={() => { setIsDialogOpen(false) }}
        isEditMode={false}
        initialData={null}
        selectedDepartmentId={""}
      />

      <TaskForm
        projectId={null}
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        initialData={null}
      />

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Employee already has active tasks</AlertDialogTitle>
            <AlertDialogDescription>
              Do you still want to assign this sub-task?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirmOpen(false);
                handleSave(undefined, true);
              }}
            >
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[580px] w-[92vw] max-h-[94vh] p-0 gap-0 rounded-lg overflow-hidden">
          <form onSubmit={handleSave} className="flex flex-col h-full">
            <DialogHeader className="px-5 pt-2 pb-1 border-b shrink-0">
              <DialogTitle className="text-lg font-semibold">
                {isEdit ? "Edit Sub-Task" : "Create New Sub-Task"}
              </DialogTitle>
            </DialogHeader>

            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto px-5 py-1 space-y-4 text-sm"
            >
              {/* Parent Task & Sub-Task Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-1.5">
                  <Label htmlFor="parentTask" className="text-sm font-medium">Parent Task *</Label>
                  <Select
                    value={taskForm?.taskId?.toString() || ""}
                    onValueChange={handleParentTaskChange}
                    disabled={taskList.length === 0}
                  >
                    <SelectTrigger id="parentTask" className="h-9 text-sm">
                      <SelectValue placeholder="Select Parent Task" />
                    </SelectTrigger>
                    <SelectContent className="max-h-52">
                      {taskList.map((t) => (
                        <SelectItem key={t._id} value={t._id}>
                          {t.name}
                        </SelectItem>
                      ))}
                      <div className="border-t my-1" />
                      <button
                        type="button"
                        onClick={() => setIsFormOpen(true)}
                        className="w-full text-left px-2 py-1.5 text-sm text-primary hover:bg-muted rounded-sm"
                      >
                        + Add New Parent Task
                      </button>
                    </SelectContent>
                  </Select>

                  {taskList.length === 0 && (
                    <div className="flex items-center justify-between text-xs text-red-500 mt-1">
                      <span>Please add a parent task first</span>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => setIsFormOpen(true)}
                        className="h-7 px-3 text-xs"
                      >
                        + Add Task
                      </Button>
                    </div>
                  )}
                </div>

                <div className="grid gap-1.5">
                  <Label htmlFor="taskName" className="text-sm font-medium">Sub Task Name *</Label>
                  <Input
                    id="taskName"
                    placeholder="Enter sub-task name"
                    value={taskForm?.name || ""}
                    onChange={(e) => setTaskForm({ ...taskForm, name: e.target.value })}
                    className="h-9 text-sm"
                    required
                  />
                </div>
              </div>

              {/* Description */}
              <div className="grid gap-1.5">
                <Label htmlFor="description" className="text-sm font-medium md:mt[-15px]">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Briefly describe the sub-task (Optional)"
                  value={taskForm?.description || ""}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                  className="min-h-[72px] text-sm resize-y"
                />
              </div>
              {/* URL */}
<div className="grid gap-1.5">
  <Label htmlFor="url" className="text-sm font-medium">
    URL *
  </Label>

  <Input
    id="url"
    type="url"
    placeholder="https://example.com"
    value={taskForm?.url || ""}
    onChange={(e) =>
      setTaskForm({ ...taskForm, url: e.target.value })
    }
    className="h-9 text-sm"
  />
</div>


              {/* Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-1.5">
                  <Label htmlFor="startDate" className="text-sm font-medium">Start Date *</Label>
                  <Input
                    id="startDate"
                    type="datetime-local"
                    ref={startDateRef}
                    onClick={() => { if (startDateRef.current?.showPicker) { startDateRef.current.showPicker() } }}
                    min={taskDates?.startDate}
                    max={taskDates?.endDate}
                    value={taskForm?.startDate || ""}
                    onChange={(e) => {
                      setTaskForm(prev => ({
                        ...prev,
                        startDate: e.target.value,
                        endDate:
                          prev.endDate && e.target.value && prev.endDate < e.target.value
                            ? ""
                            : prev.endDate
                      }));
                    }}
                    className="h-9 text-sm"
                    required
                  />
                </div>

                <div className="grid gap-1.5">
                  <Label htmlFor="endDate" className="text-sm font-medium">End Date *</Label>
                  <Input
                    id="endDate"
                    type="datetime-local"
                    ref={endDateRef}
                    onClick={() => { if (endDateRef.current?.showPicker) { endDateRef.current.showPicker() } }}
                    min={taskForm?.startDate || taskDates?.startDate}
                    max={taskDates?.endDate}
                    disabled={!taskForm?.startDate}
                    value={taskForm?.endDate || ""}
                    onChange={(e) => setTaskForm({ ...taskForm, endDate: e.target.value })}
                    required
                    className="h-9 text-sm"
                  />
                  {!taskForm?.startDate && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Select start date first
                    </p>
                  )}
                </div>
              </div>

              {/* Employee & Priority */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                <div className="grid gap-1.5">
                  <Label htmlFor="employee" className="text-sm font-medium">
                    Employee *
                  </Label>

                  <Select
                    disabled={!taskForm?.taskId}
                    value={taskForm?.employee || ""}
                    onValueChange={(value) =>
                      setTaskForm({ ...taskForm, employee: value })
                    }
                    required
                  >
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue placeholder="Select Employee" />
                    </SelectTrigger>

                    <SelectContent>
                      {employeeList.length > 0 ? (
                        <>
                          {employeeList.map((emp) => (
                            <SelectItem
                              key={emp._id}
                              value={emp._id}
                              disabled={emp?.department?.managers?.includes(emp?._id)}
                            >
                              {emp.fullName} ({emp.department?.name})
                              {emp?.department?.managers?.includes(emp?._id) ? " • Manager" : ""}
                            </SelectItem>
                          ))}

                          {/* Add More button inside dropdown */}
                          {user?.role === "admin" && <div className="px-2 py-1">
                            <button
                              type="button"
                              className="w-full text-xs text-center text-blue-600 hover:underline"
                              onClick={() => {
                                setIsDialogOpen(true);
                              }}
                            >
                              + Add More Employee
                            </button>
                          </div>}
                        </>
                      ) : (
                        taskForm?.taskId && (
                          <div className="px-2 py-2 text-xs text-muted-foreground">
                            No employees found for this task
                          </div>
                        )
                      )}
                    </SelectContent>
                  </Select>

                  {/* Show message + Add button only if task selected AND no employees */}
                  {taskForm?.taskId && employeeList.length === 0 && (
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs text-muted-foreground">
                        No employees available for selected task
                      </p>
                      {user?.role === "admin" && <button
                        type="button"
                        className="text-xs text-blue-600 hover:underline"
                        onClick={() => {
                          setIsDialogOpen(true);
                        }}
                      >
                        + Add Employee
                      </button>}
                    </div>
                  )}

                  {!taskForm?.taskId && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Select parent task first
                    </p>
                  )}
                </div>


                <div className="grid gap-1.5">
                  <Label htmlFor="priority" className="text-sm font-medium">Priority *</Label>
                  <Select
                    value={taskForm?.priority || ""}
                    onValueChange={(value) => setTaskForm({ ...taskForm, priority: value as Priority })}
                  >
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue placeholder="Select Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Remarks */}
              <div className="grid gap-1.5">
                <Label htmlFor="remarks" className="text-sm font-medium">Remarks (Optional)</Label>
                <Textarea
                  id="remarks"
                  placeholder="Add any additional notes or remarks (Optional)"
                  value={taskForm?.remarks || ""}
                  onChange={(e) => setTaskForm({ ...taskForm, remarks: e.target.value })}
                  className="min-h-[70px] text-sm resize-y"
                />
              </div>
            </div>

            {/* Footer + scroll indicator */}
            <div className="relative shrink-0 border-t bg-background">
              <DialogFooter className="px-5 py-4 gap-3 flex-col-reverse sm:flex-row">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={loading}
                  className="h-9 text-sm w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    loading ||
                    !taskForm?.name ||
                    !taskForm?.startDate ||
                    !taskForm?.endDate ||
                    !taskForm?.employee ||
                    !taskForm?.priority ||
                    !taskForm?.taskId
                  }
                  className="h-9 text-sm w-full sm:w-auto"
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isEdit ? "Update Sub-Task" : "Create Sub-Task"}
                </Button>
              </DialogFooter>

              {showScrollArrow && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 pointer-events-none">
                  <div className="flex flex-col items-center text-muted-foreground animate-bounce">
                    <ChevronDown className="h-6 w-6 opacity-70" />
                    <span className="text-xs opacity-60 mt-0.5">scroll for more</span>
                  </div>
                </div>
              )}
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SubTaskForm;
