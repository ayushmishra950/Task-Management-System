
import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue} from "@/components/ui/select";
import { Loader2, Upload, FileSpreadsheet, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {useGetAllEmployeeQuery} from "@/redux-toolkit/api/admin/employee.api";
import {useCreateSubTaskFromExcelMutation} from "@/redux-toolkit/api/admin/subTask.api";


interface IExcelSubTaskForm {
  isOpen: boolean;
  onClose: (value: boolean) => void;
  intialData: any;
}


export const ExcelSubTaskForm = ({
  isOpen,
  onClose,
  intialData,
}: IExcelSubTaskForm) => {
  const { toast } = useToast();
   const user = JSON.parse(localStorage.getItem("user"));
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [taskName, setTaskName] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [createSubTaskFromExcel,{isLoading:loading}] = useCreateSubTaskFromExcelMutation();


  const [errors, setErrors] = useState<{
    taskName?: string;
    employeeId?: string;
    excelFile?: string;
  }>({});
      const {data:employeeData, isLoading:employeeLoading} = useGetAllEmployeeQuery({companyId:user?.companyId});

    const employees = employeeData?.data?.filter((e) => e?.role === "employee") || [];

  useEffect(() => {
    if (isOpen) {
      setTaskName( intialData?.name || intialData?.taskName || "");
      setEmployeeId("");
      setExcelFile(null);
      setErrors({});

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }, [isOpen, intialData]);
  

  // --------------------------------------------------
  // Excel File Change
  // --------------------------------------------------

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) {
      setExcelFile(null);
      return;
    }

    const allowedExtensions = [".xlsx", ".xls"];

    const fileName = file.name.toLowerCase();

    const isExcelFile = allowedExtensions.some(
      (extension) =>
        fileName.endsWith(extension)
    );

    if (!isExcelFile) {
      setExcelFile(null);

      setErrors((prev) => ({
        ...prev,
        excelFile:
          "Please select a valid Excel file (.xlsx or .xls).",
      }));

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      return;
    }

    // 5 MB
    if (file.size > 5 * 1024 * 1024) {
      setExcelFile(null);

      setErrors((prev) => ({
        ...prev,
        excelFile:
          "Excel file size must be less than 5 MB.",
      }));

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      return;
    }

    setExcelFile(file);

    setErrors((prev) => ({
      ...prev,
      excelFile: undefined,
    }));
  };

  // --------------------------------------------------
  // Remove Excel File
  // --------------------------------------------------

  const handleRemoveFile = () => {
    setExcelFile(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    setErrors((prev) => ({
      ...prev,
      excelFile: undefined,
    }));
  };

  // --------------------------------------------------
  // Validation
  // --------------------------------------------------

  const validateForm = () => {
    const newErrors: {
      taskName?: string;
      employeeId?: string;
      excelFile?: string;
    } = {};

    if (!taskName.trim()) {
      newErrors.taskName =
        "Task name is required.";
    }

    if (!employeeId) {
      newErrors.employeeId =
        "Please select an employee.";
    }

    if (!excelFile) {
      newErrors.excelFile =
        "Please select an Excel file.";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  // --------------------------------------------------
  // Submit
  // --------------------------------------------------

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validateForm()) return;

    try {
      const taskId = intialData?.taskId?._id;

      const createdBy = user?.id;

      if (!taskId) throw new Error( "Task ID not found." );

      if (!createdBy) throw new Error("Created By ID not found.");
    
      const formData = new FormData();

      formData.append( "excel", excelFile!);


      const result = await createSubTaskFromExcel({taskId:taskId, employeeId:employeeId, file:formData, createdBy}).unwrap();

      toast({ title: "SubTask Create Successfully.", description: result?.message || "Sub Tasks created successfully."});

      // Reset
      setTaskName("");
      setEmployeeId("");
      setExcelFile(null);
      setErrors({});

      if (fileInputRef.current) { fileInputRef.current.value = "";}

      onClose(false);
    } catch (error: any) {
        console.log("Sub Task Create Error:", error);
      toast({  title: "Sub Task Create Error", description: error?.data?.errors?.[0]?.message || error?.data?.message || "Something went wrong while creating Sub Tasks.", variant: "destructive" });
    }
  };

  const handleClose = () => {
    if (loading) return;

    setTaskName("");
    setEmployeeId("");
    setExcelFile(null);
    setErrors({});

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    onClose(false);
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          handleClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="text-xl">
            Create Sub Tasks
          </DialogTitle>

          <DialogDescription>
            Select an employee and upload an Excel
            file to create multiple sub tasks.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          className="space-y-5 pt-2"
        >
          {/* ==========================================
              TASK NAME
          ========================================== */}

          <div className="space-y-2">
            <Label htmlFor="taskName">
              Task Name
            </Label>

            <input
              id="taskName"
              type="text"
              value={taskName}
              onChange={(event) => {
                setTaskName(
                  event.target.value
                );

                if (errors.taskName) {
                  setErrors((prev) => ({
                    ...prev,
                    taskName: undefined,
                  }));
                }
              }}
              placeholder="Enter task name"
              disabled={loading}
              className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm
                outline-none
                focus:ring-2 focus:ring-ring
                ${
                  errors.taskName
                    ? "border-red-500"
                    : "border-input"
                }`}
            />

            {errors.taskName && (
              <p className="text-xs text-red-500">
                {errors.taskName}
              </p>
            )}
          </div>

          {/* ==========================================
              EMPLOYEE SELECT
          ========================================== */}

          <div className="space-y-2">
            <Label> Assign Employee</Label>

            <Select
              value={employeeId}
              onValueChange={(value) => {
                setEmployeeId(value);

                if (errors.employeeId) {
                  setErrors((prev) => ({
                    ...prev,
                    employeeId: undefined,
                  }));
                }
              }}
              disabled={
                loading ||
                employeeLoading
              }
            >
              <SelectTrigger
                className={
                  errors.employeeId
                    ? "border-red-500"
                    : ""
                }
              >
                <SelectValue
                  placeholder={
                    employeeLoading
                      ? "Loading employees..."
                      : "Select employee"
                  }
                />
              </SelectTrigger>

              <SelectContent>
                {employees.length > 0 ? (
                  employees.map(
                    (employee) => (
                      <SelectItem
                        key={employee._id}
                        value={employee._id}
                      >
                        <div className="flex flex-col">
                          <span>
                            {employee.fullName} {`(${employee?.department?.name})`}
                          </span>

                          {employee.email && (
                            <span className="text-xs text-muted-foreground">
                              {employee.email}
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    )
                  )
                ) : (
                  <div className="px-2 py-2 text-sm text-muted-foreground">
                    {employeeLoading
                      ? "Loading..."
                      : "No employees found."}
                  </div>
                )}
              </SelectContent>
            </Select>

            {errors.employeeId && (
              <p className="text-xs text-red-500">
                {errors.employeeId}
              </p>
            )}
          </div>

          {/* ==========================================
              EXCEL UPLOAD
          ========================================== */}

          <div className="space-y-2">
            <Label>
              Excel File
            </Label>

            {!excelFile ? (
              <label
                htmlFor="excel"
                className={`flex min-h-[150px] w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-5 py-6 transition-colors
                  ${
                    errors.excelFile
                      ? "border-red-500 bg-red-50/50"
                      : "border-muted-foreground/25 hover:border-primary hover:bg-muted/30"
                  }`}
              >
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                  <FileSpreadsheet className="h-6 w-6 text-green-600" />
                </div>

                <p className="text-sm font-medium">
                  Click to upload Excel file
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  XLSX or XLS file
                </p>

                <p className="text-xs text-muted-foreground">
                  Maximum file size: 5 MB
                </p>

                <input
                  ref={fileInputRef}
                  id="excel"
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={
                    handleFileChange
                  }
                  disabled={loading}
                  className="hidden"
                />
              </label>
            ) : (
              <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-4">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-green-100">
                    <FileSpreadsheet className="h-5 w-5 text-green-600" />
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {excelFile.name}
                    </p>

                    <p className="text-xs text-muted-foreground">
                      {(
                        excelFile.size /
                        1024 /
                        1024
                      ).toFixed(2)}{" "}
                      MB
                    </p>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={
                    handleRemoveFile
                  }
                  disabled={loading}
                  className="shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            {errors.excelFile && (
              <p className="text-xs text-red-500">
                {errors.excelFile}
              </p>
            )}
          </div>

          {/* ==========================================
              EXCEL FORMAT INFO
          ========================================== */}

          <div className="rounded-lg border bg-muted/30 p-3">
            <div className="flex items-start gap-2">
              <FileSpreadsheet className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />

              <div className="text-xs text-muted-foreground">
                <p className="font-medium text-foreground">
                  Excel columns
                </p>

                <p className="mt-1">
                  Required:{" "}
                  <span className="font-medium">
                    name, url
                  </span>
                </p>

                <p className="mt-1">
                  Optional:{" "}
                  <span className="font-medium">
                    description, startDate,
                    endDate, priority,
                    remarks
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* ==========================================
              BUTTONS
          ========================================== */}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={
                loading ||
                employeeLoading
              }
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Create Sub Tasks
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
