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
  X,
  CheckSquare,
  User,
  CalendarDays,
  Link2,
  FileText,
  Flag,
} from "lucide-react";
import {useGetAllEmployeeQuery} from "@/redux-toolkit/api/admin/employee.api";
import { useUpdateBulkSubTaskDataMutation } from "@/redux-toolkit/api/admin/subTask.api";
import { useToast } from "@/hooks/use-toast";
import DeleteCard from "@/components/cards/DeleteCard";


interface BulkSubTaskUpdateFormProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: any[];
}

const BulkSubTaskUpdateForm: React.FC<BulkSubTaskUpdateFormProps> = ({
  isOpen,
  onClose,
  initialData,
}) => {
  const {toast} = useToast();
    const user = JSON.parse(localStorage.getItem("user"));
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showScrollArrow, setShowScrollArrow] = useState(false);
   const {data:employeeData, isLoading:employeeLoading} = useGetAllEmployeeQuery({companyId:user?.companyId});
   const userList = employeeData?.data?.filter((e) => e?.role === "employee") || [];
  const [subTasks, setSubTasks] = useState<any[]>([]);
  const [confirmOpenDialog, setConfirmOpenDialog] = useState(false);
  const [updateBulkSubTaskData, {isLoading: isUpdatingBulkSubTasks }] = useUpdateBulkSubTaskDataMutation();

  useEffect(() => {
    if (isOpen) {
      setSubTasks(Array.isArray(initialData) ? initialData : []);
    }
  }, [isOpen, initialData]);

  const checkScrollable = () => {
    if (!scrollRef.current) return;

    const { scrollHeight, clientHeight } = scrollRef.current;

    setShowScrollArrow(scrollHeight > clientHeight + 5);
  };

  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(checkScrollable, 300);

    const handleResize = () => checkScrollable();

    window.addEventListener("resize", handleResize);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", handleResize);
    };
  }, [isOpen, subTasks]);

  const handleChange = ( index: number, field: string, value: any) => {
   setSubTasks((prev) => prev.map((subTask, i) => i === index ? { ...subTask, [field]: value} : subTask));
  };

  const handleClose = () => {
    setSubTasks([]);
    onClose();
  };


  const handleUpdateBulkSubTasks = async () => {
    try {
      const subTaskDatas = subTasks.map((subTask) => ({
        _id: subTask._id,
        name: subTask.name,
        url: subTask.url,
        description: subTask.description,
        startDate: subTask.startDate,
        endDate: subTask.endDate,
        employeeId: subTask.employeeId?._id || subTask.employeeId,
        priority: subTask.priority,
        remarks: subTask.remarks,
      }));

     const res = await updateBulkSubTaskData({ subTaskDatas }).unwrap();
      toast({title:"Bulk Sub Tasks Updated", description:res?.message || "Sub tasks updated successfully."});
      handleClose();
    } catch (error) {
      toast({
        title: "Bulk Sub Tasks Update Failed",
        description: error?.data?.errors?.[0]?.message || error?.data?.message ||"Failed to update sub tasks.",
        variant: "destructive",
      });
      console.error("Error updating bulk sub tasks:", error);
    }
  };

  if (!isOpen) return null;

  return (
    <>
    <DeleteCard
        isOpen={confirmOpenDialog}
        onClose={() => setConfirmOpenDialog(false)}
        onConfirm={handleUpdateBulkSubTasks}
        isDeleting={isUpdatingBulkSubTasks}
        title="Confirm Bulk Update"
        message="Are you sure you want to update the selected sub tasks? This action cannot be undone."
      />

    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          handleClose();
        }
      }}  
    >   
      <DialogContent className={`sm:max-w-[760px] w-[80vw] h-[80vh] max-h-[90vh] p-0 gap-0 rounded-lg overflow-hidden flex flex-col ${confirmOpenDialog ? "pointer-events-none opacity-50" : ""}`}>

        {/* ================= HEADER ================= */}

        <DialogHeader className="px-5 py-4 border-b shrink-0">
          <div className="flex items-center justify-between pr-8">
            <div>
              <DialogTitle className="text-lg font-semibold flex items-center gap-2">
                <CheckSquare className="h-5 w-5 text-primary" />
                Update Sub Tasks
              </DialogTitle>

              <p className="text-xs text-muted-foreground mt-1">
                Update the details of the selected sub tasks.
              </p>
            </div>

            <div className="rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-medium">
              {subTasks.length}{" "}
              {subTasks.length === 1 ? "Sub Task" : "Sub Tasks"}
            </div>
          </div>
        </DialogHeader>

        {/* ================= SCROLLABLE CONTENT ================= */}

        <div
          ref={scrollRef}
          className="relative flex-1 overflow-y-auto px-5 py-5 space-y-5"
        >
          {subTasks.length === 0 ? (
            <div className="flex min-h-[300px] items-center justify-center">
              <div className="text-center">
                <CheckSquare className="mx-auto h-10 w-10 text-muted-foreground/40" />

                <p className="mt-3 text-sm font-medium text-muted-foreground">
                  No sub tasks selected
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  Please select at least one sub task.
                </p>
              </div>
            </div>
          ) : (
            subTasks.map((subTask, index) => (
              <div
                key={subTask?._id || index}
                className="rounded-xl border bg-card shadow-sm overflow-hidden"
              >
                {/* ================= CARD HEADER ================= */}

                <div className="flex items-center justify-between border-b bg-muted/30 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-semibold">
                      {index + 1}
                    </div>

                    <div>
                      <p className="text-sm font-semibold">
                        Sub Task {index + 1}
                      </p>

                      <p className="text-xs text-muted-foreground">
                        ID: {subTask?._id || "N/A"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                      {subTask?.status || "pending"}
                    </span>
                  </div>
                </div>

                {/* ================= CARD BODY ================= */}

                <div className="p-4 space-y-4">
                  {/* Name + URL */}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="grid gap-1.5">
                      <Label
                        htmlFor={`name-${index}`}
                        className="text-sm font-medium"
                      >
                        Sub Task Name *
                      </Label>

                      <Input
                        id={`name-${index}`}
                        value={subTask?.name || ""}
                        placeholder="Enter sub task name"
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
                        value={subTask?.url || ""}
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
                      value={subTask?.description || ""}
                      placeholder="Briefly describe the sub task..."
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

                  {/* Dates */}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="grid gap-1.5">
                      <Label
                        htmlFor={`startDate-${index}`}
                        className="text-sm font-medium flex items-center gap-1"
                      >
                        <CalendarDays className="h-3.5 w-3.5" />
                        Start Date
                      </Label>

                      <Input
                        id={`startDate-${index}`}
                        type="datetime-local"
                        value={
                          subTask?.startDate
                            ? new Date(subTask.startDate)
                                .toISOString()
                                .slice(0, 16)
                            : ""
                        }
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
                        htmlFor={`endDate-${index}`}
                        className="text-sm font-medium flex items-center gap-1"
                      >
                        <CalendarDays className="h-3.5 w-3.5" />
                        End Date
                      </Label>

                      <Input
                        id={`endDate-${index}`}
                        type="datetime-local"
                        value={
                          subTask?.endDate
                            ? new Date(subTask.endDate)
                                .toISOString()
                                .slice(0, 16)
                            : ""
                        }
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

                  {/* Employee + Priority */}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="grid gap-1.5">
                      <Label className="text-sm font-medium flex items-center gap-1">
                        <User className="h-3.5 w-3.5" />
                        Assigned Employee
                      </Label>

                      <Select
                        value={
                          subTask?.employeeId?._id ||
                          subTask?.employeeId ||
                          ""
                        }
                        onValueChange={(value) =>
                          handleChange(
                            index,
                            "employeeId",
                            value
                          )
                        }
                      >
                        <SelectTrigger className="h-9 text-sm">
                          <SelectValue placeholder="Select employee" />
                        </SelectTrigger>

                       <SelectContent>
      {employeeLoading ? (
        <div className="flex items-center justify-center py-2 text-sm text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Loading employees...
        </div>
      ) : userList.length > 0 ? (
        userList.map((employee) => (
          <SelectItem
            key={employee?._id}
            value={employee?._id}
          >
            {employee?.fullName}
          </SelectItem>
        ))
      ) : (
        <div className="py-2 text-center text-sm text-muted-foreground">
          No employees found
        </div>
      )}
    </SelectContent>
                      </Select>

                      {subTask?.employeeId?.fullName && (
                        <p className="text-xs text-muted-foreground">
                          Current:{" "}
                          {subTask.employeeId.fullName}
                        </p>
                      )}
                    </div>

                    <div className="grid gap-1.5">
                      <Label className="text-sm font-medium flex items-center gap-1">
                        <Flag className="h-3.5 w-3.5" />
                        Priority
                      </Label>

                      <Select
                        value={subTask?.priority || "medium"}
                        onValueChange={(value) =>
                          handleChange(
                            index,
                            "priority",
                            value
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
                      value={subTask?.remarks || ""}
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

          {/* Scroll Indicator */}

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

        {/* ================= FOOTER ================= */}

        <DialogFooter className="border-t bg-background px-5 py-4 gap-3 flex-col-reverse sm:flex-row shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            className="h-9 text-sm w-full sm:w-auto"
          >
            Cancel
          </Button>

          <Button
            type="button"
            disabled={subTasks.length === 0}
            className="h-9 text-sm w-full sm:w-auto"
            // onClick={() => setConfirmOpenDialog(true)}
            onClick={handleUpdateBulkSubTasks}
          >

         { isUpdatingBulkSubTasks ?  
         <Loader2 className="animate-spin" size={19} color="white" />
         : <> <CheckSquare className="mr-2 h-4 w-4" />
            Update {subTasks.length > 0 ? `${subTasks.length} ` : ""}
            Sub Task{subTasks.length !== 1 ? "s" : ""}
            </>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
};

export default BulkSubTaskUpdateForm;