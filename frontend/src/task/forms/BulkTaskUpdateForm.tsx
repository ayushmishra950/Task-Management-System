import React, { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  ChevronDown,
  CheckSquare,
  User,
  CalendarDays,
  Link2,
  FileText,
  Flag,
  FolderKanban,
} from "lucide-react";
import { Priority } from "@/types";
import { formatForDateTimeInput } from "@/services/allFunctions";
import { useToast } from "@/hooks/use-toast";
import { useGetAllManagerQuery } from "@/redux-toolkit/api/admin/manager.api";
import { useGetAllProjectQuery } from "@/redux-toolkit/api/admin/project.api";
import { useUpdateBulkTaskDataMutation } from "@/redux-toolkit/api/admin/task.api";

interface BulkTaskUpdateFormProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: any[];
}

const BulkTaskUpdateForm: React.FC<BulkTaskUpdateFormProps> = ({
  isOpen,
  onClose,
  initialData,
}) => {
  const user = JSON.parse(localStorage.getItem("user"));
  const { toast } = useToast();

  const scrollRef = useRef<HTMLDivElement>(null);

  const [tasks, setTasks] = useState<any[]>([]);
  const [showScrollArrow, setShowScrollArrow] = useState(false);

  const [updateBulkTask, { isLoading }] = useUpdateBulkTaskDataMutation();

  const { data: managerData } = useGetAllManagerQuery({
    companyId: user?.companyId,
  },{skip:!user?.id || !user?.role});

  const managers = managerData?.data || [];

  const { data: projectData } = useGetAllProjectQuery(
    {
      companyId: user?.companyId,
    },
    {
      skip:
        user?.role === "super_admin" ||
        user?.role === "employee" || !user?.id || !user?.role,
    }
  );

  const projects = projectData?.data || [];

  // ----------------------------------------
  // Initial Data
  // ----------------------------------------

  useEffect(() => {
    if (!isOpen) return;

    if (Array.isArray(initialData)) {
      setTasks(
        initialData.map((task) => ({
          ...task,

          projectId:
            task?.projectId?._id ||
            task?.projectId ||
            "",

          managerId:
            task?.managerId?._id ||
            task?.managerId ||
            "",

          startDate: task?.startDate
            ? formatForDateTimeInput(task.startDate)
            : "",

          endDate: task?.endDate
            ? formatForDateTimeInput(task.endDate)
            : "",
        }))
      );
    } else {
      setTasks([]);
    }
  }, [isOpen, initialData]);

  // ----------------------------------------
  // Scroll Detection
  // ----------------------------------------

  const checkScrollable = () => {
    if (!scrollRef.current) return;

    const { scrollHeight, clientHeight } = scrollRef.current;

    setShowScrollArrow(scrollHeight > clientHeight + 5);
  };

  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(checkScrollable, 300);

    const handleResize = () => {
      checkScrollable();
    };

    window.addEventListener("resize", handleResize);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", handleResize);
    };
  }, [isOpen, tasks]);

  // ----------------------------------------
  // Handle Field Change
  // ----------------------------------------

  const handleChange = (
    index: number,
    field: string,
    value: any
  ) => {
    setTasks((prev) =>
      prev.map((task, i) =>
        i === index
          ? {
              ...task,
              [field]: value,
            }
          : task
      )
    );
  };

  // ----------------------------------------
  // Project Change
  // ----------------------------------------

  const handleProjectChange = (
    index: number,
    projectId: string
  ) => {
    const selectedProject = projects.find(
      (project) => project._id === projectId
    );

    setTasks((prev) =>
      prev.map((task, i) =>
        i === index
          ? {
              ...task,
              projectId,
              startDate:
                task.startDate ||
                formatForDateTimeInput(
                  selectedProject?.startDate
                ),
              endDate:
                task.endDate ||
                formatForDateTimeInput(
                  selectedProject?.endDate
                ),
            }
          : task
      )
    );
  };

  // ----------------------------------------
  // Close
  // ----------------------------------------

  const handleClose = () => {
    if (isLoading) return;

    setTasks([]);
    onClose();
  };

  // ----------------------------------------
  // Bulk Update
  // ----------------------------------------

  const handleBulkUpdate = async () => {
    if (!tasks.length) return;

      const taskDatas = tasks.map((task) => ({
        _id: task._id,
        name: task.name,
        url: task.url,
        description: task.description,
        startDate: task.startDate,
        endDate: task.endDate,
        managerId: task.managerId?._id || task.managerId,
        priority: task.priority,
        remarks: task.remarks,
      }))

    try {
     await updateBulkTask({ taskDatas }).unwrap();
      toast({ title: "Tasks Updated Successfully", description: `${tasks.length} ${ tasks.length === 1 ? "task" : "tasks"} updated successfully.`});
      handleClose();
    } catch (err: any) {
      console.error("Bulk Task Update Error:", err);
      toast({title: "Bulk Task Update Error",description: err?.data?.errors?.[0]?.message || err?.data?.message || "Something went wrong while updating tasks.",variant: "destructive"});
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          handleClose();
        }
      }}
    >
      <DialogContent
        className="
          sm:max-w-[760px]
          w-[94vw]
          max-h-[80vh]
          h-[80vh]
          p-0
          gap-0
          rounded-lg
          overflow-hidden
          flex
          flex-col
        "
      >
        {/* ================================= */}
        {/* HEADER */}
        {/* ================================= */}

        <DialogHeader className="px-5 py-4 border-b shrink-0">
          <div className="flex items-center justify-between pr-8">
            <div>
              <DialogTitle className="text-lg font-semibold flex items-center gap-2">
                <CheckSquare className="h-5 w-5 text-primary" />

                Update Tasks
              </DialogTitle>

              <p className="text-xs text-muted-foreground mt-1">
                Update the details of the selected tasks.
              </p>
            </div>

            <div className="rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-medium">
              {tasks.length}{" "}
              {tasks.length === 1 ? "Task" : "Tasks"}
            </div>
          </div>
        </DialogHeader>

        {/* ================================= */}
        {/* SCROLLABLE CONTENT */}
        {/* ================================= */}

        <div
          ref={scrollRef}
          className="
            relative
            flex-1
            min-h-0
            overflow-y-auto
            px-5
            py-5
            space-y-5
          "
        >
          {tasks.length === 0 ? (
            <div className="flex min-h-[300px] items-center justify-center">
              <div className="text-center">
                <CheckSquare className="mx-auto h-10 w-10 text-muted-foreground/40" />

                <p className="mt-3 text-sm font-medium text-muted-foreground">
                  No tasks selected
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  Please select at least one task.
                </p>
              </div>
            </div>
          ) : (
            tasks.map((task, index) => (
              <div
                key={task?._id || index}
                className="
                  rounded-xl
                  border
                  bg-card
                  shadow-sm
                  overflow-hidden
                "
              >
                {/* ================================= */}
                {/* CARD HEADER */}
                {/* ================================= */}

                <div className="flex items-center justify-between border-b bg-muted/30 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-semibold">
                      {index + 1}
                    </div>

                    <div>
                      <p className="text-sm font-semibold">
                        Task {index + 1}
                      </p>

                      <p className="text-xs text-muted-foreground">
                        ID: {task?._id || "N/A"}
                      </p>
                    </div>
                  </div>

                  <span className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                    {task?.status || "pending"}
                  </span>
                </div>

                {/* ================================= */}
                {/* CARD BODY */}
                {/* ================================= */}

                <div className="p-4 space-y-4">

                  {/* Project + Task Name */}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                    {/* Project */}

                    <div className="grid gap-1.5">
                      <Label className="text-sm font-medium flex items-center gap-1">
                        <FolderKanban className="h-3.5 w-3.5" />
                        Project *
                      </Label>

                      <Select
                        value={task?.projectId || ""}
                        disabled
                        onValueChange={(value) =>
                          handleProjectChange(
                            index,
                            value
                          )
                        }
                      >
                        <SelectTrigger className="h-9 text-sm">
                          <SelectValue placeholder="Select project" />
                        </SelectTrigger>

                        <SelectContent className="max-h-52">
                          {projects.map((project) => (
                            <SelectItem
                              key={project._id}
                              value={project._id}
                            >
                              {project.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Task Name */}

                    <div className="grid gap-1.5">
                      <Label
                        htmlFor={`task-name-${index}`}
                        className="text-sm font-medium"
                      >
                        Task Name *
                      </Label>

                      <Input
                        id={`task-name-${index}`}
                        value={task?.name || ""}
                        placeholder="Enter task name"
                        onChange={(e) =>
                          handleChange(
                            index,
                            "name",
                            e.target.value
                          )
                        }
                        className="h-9 text-sm"
                      />
                    </div>
                  </div>

                  {/* Description */}

                  <div className="grid gap-1.5">
                    <Label
                      htmlFor={`description-${index}`}
                      className="text-sm font-medium flex items-center gap-1"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      Description
                    </Label>

                    <Textarea
                      id={`description-${index}`}
                      value={task?.description || ""}
                      placeholder="Briefly describe the task..."
                      onChange={(e) =>
                        handleChange(
                          index,
                          "description",
                          e.target.value
                        )
                      }
                      className="min-h-[70px] text-sm resize-y"
                    />
                  </div>

                  {/* URL */}

                  <div className="grid gap-1.5">
                    <Label
                      htmlFor={`url-${index}`}
                      className="text-sm font-medium flex items-center gap-1"
                    >
                      <Link2 className="h-3.5 w-3.5" />
                      URL *
                    </Label>

                    <Input
                      id={`url-${index}`}
                      type="url"
                      value={task?.url || ""}
                      placeholder="https://example.com"
                      onChange={(e) =>
                        handleChange(
                          index,
                          "url",
                          e.target.value
                        )
                      }
                      className="h-9 text-sm"
                    />
                  </div>

                  {/* Dates */}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                    <div className="grid gap-1.5">
                      <Label
                        htmlFor={`start-date-${index}`}
                        className="text-sm font-medium flex items-center gap-1"
                      >
                        <CalendarDays className="h-3.5 w-3.5" />
                        Start Date *
                      </Label>

                      <Input
                        id={`start-date-${index}`}
                        type="datetime-local"
                        value={task?.startDate || ""}
                        onChange={(e) =>
                          handleChange(
                            index,
                            "startDate",
                            e.target.value
                          )
                        }
                        className="h-9 text-sm"
                      />
                    </div>

                    <div className="grid gap-1.5">
                      <Label
                        htmlFor={`end-date-${index}`}
                        className="text-sm font-medium flex items-center gap-1"
                      >
                        <CalendarDays className="h-3.5 w-3.5" />
                        End Date
                      </Label>

                      <Input
                        id={`end-date-${index}`}
                        type="datetime-local"
                        min={task?.startDate || ""}
                        value={task?.endDate || ""}
                        onChange={(e) =>
                          handleChange(
                            index,
                            "endDate",
                            e.target.value
                          )
                        }
                        className="h-9 text-sm"
                      />
                    </div>
                  </div>

                  {/* Manager + Priority */}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                    {/* Manager */}

                    <div className="grid gap-1.5">
                      <Label className="text-sm font-medium flex items-center gap-1">
                        <User className="h-3.5 w-3.5" />
                        Manager *
                      </Label>

                      <Select
                        value={task?.managerId || ""}
                        onValueChange={(value) =>
                          handleChange(
                            index,
                            "managerId",
                            value
                          )
                        }
                      >
                        <SelectTrigger className="h-9 text-sm">
                          <SelectValue placeholder="Select manager" />
                        </SelectTrigger>

                        <SelectContent className="max-h-48">
                          {managers.map((manager) => (
                            <SelectItem
                              key={manager._id}
                              value={manager._id}
                            >
                              {manager.fullName}{" "}
                              {manager?.managedDepartments?.length
                                ? `(${manager.managedDepartments
                                    .map(
                                      (dept) =>
                                        dept.name
                                    )
                                    .join(", ")})`
                                : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {task?.managerId?.fullName && (
                        <p className="text-xs text-muted-foreground">
                          Current:{" "}
                          {task.managerId.fullName}
                        </p>
                      )}
                    </div>

                    {/* Priority */}

                    <div className="grid gap-1.5">
                      <Label className="text-sm font-medium flex items-center gap-1">
                        <Flag className="h-3.5 w-3.5" />
                        Priority *
                      </Label>

                      <Select
                        value={
                          task?.priority || "medium"
                        }
                        onValueChange={(value) =>
                          handleChange(
                            index,
                            "priority",
                            value as Priority
                          )
                        }
                      >
                        <SelectTrigger className="h-9 text-sm">
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>

                        <SelectContent>
                          <SelectItem value="low">
                            Low
                          </SelectItem>

                          <SelectItem value="medium">
                            Medium
                          </SelectItem>

                          <SelectItem value="high">
                            High
                          </SelectItem>

                          <SelectItem value="urgent">
                            Urgent
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Remarks */}

                  <div className="grid gap-1.5">
                    <Label
                      htmlFor={`remarks-${index}`}
                      className="text-sm font-medium"
                    >
                      Remarks
                    </Label>

                    <Textarea
                      id={`remarks-${index}`}
                      value={task?.remarks || ""}
                      placeholder="Add remarks..."
                      onChange={(e) =>
                        handleChange(
                          index,
                          "remarks",
                          e.target.value
                        )
                      }
                      className="min-h-[60px] text-sm resize-y"
                    />
                  </div>
                </div>
              </div>
            ))
          )}

          {/* ================================= */}
          {/* SCROLL INDICATOR */}
          {/* ================================= */}

          {showScrollArrow && (
            <div className="sticky bottom-3 left-1/2 flex justify-center pointer-events-none">
              <div className="flex flex-col items-center rounded-full bg-background/90 border shadow-sm px-3 py-1.5 text-muted-foreground animate-bounce">
                <ChevronDown className="h-5 w-5" />

                <span className="text-[10px]">
                  Scroll for more
                </span>
              </div>
            </div>
          )}
        </div>

        {/* ================================= */}
        {/* FOOTER */}
        {/* ================================= */}

        <DialogFooter className="border-t bg-background px-5 py-4 gap-3 flex-col-reverse sm:flex-row shrink-0">

          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
            className="h-9 text-sm w-full sm:w-auto"
          >
            Cancel
          </Button>

          <Button
            type="button"
            onClick={handleBulkUpdate}
            disabled={
              isLoading ||
              tasks.length === 0
            }
            className="h-9 text-sm w-full sm:w-auto"
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CheckSquare className="mr-2 h-4 w-4" />
            )}

            {isLoading
              ? "Updating..."
              : `Update ${tasks.length} ${
                  tasks.length === 1
                    ? "Task"
                    : "Tasks"
                }`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BulkTaskUpdateForm;
