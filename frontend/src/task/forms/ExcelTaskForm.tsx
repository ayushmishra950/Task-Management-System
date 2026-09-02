import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue} from "@/components/ui/select";
import { Loader2, Upload, FileSpreadsheet, X} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useGetAllManagerQuery } from "@/redux-toolkit/api/admin/manager.api";
import { useCreateTaskFromExcelMutation } from "@/redux-toolkit/api/admin/task.api";

interface IExcelTaskForm {
  isOpen: boolean;
  onClose: (value: boolean) => void;
  intialData: any;
}

interface IManager {
  _id: string;
  fullName: string;
  email?: string;
  department?: {
    _id: string;
    name: string;
  };
}

export const ExcelTaskForm = ({ isOpen, onClose, intialData}: IExcelTaskForm) => {
  const { toast } = useToast();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [projectName, setProjectName] = useState("");
  const [managerId, setManagerId] = useState("");
  const [excelFile, setExcelFile] = useState<File | null>( null);

  const [ createTasksFromExcel, { isLoading: loading }] = useCreateTaskFromExcelMutation();

  const [errors, setErrors] = useState<{
    projectName?: string;
    managerId?: string;
    excelFile?: string;
  }>({});

  // --------------------------------------------------
  // Get Managers
  // --------------------------------------------------

  const { data: managerData, isLoading: managerLoading,} = useGetAllManagerQuery({ companyId: user?.companyId});
      
  const managers = managerData?.data?.filter((manager) => manager?.role === "manager") || [];

  // --------------------------------------------------
  // Reset / Initial Data
  // --------------------------------------------------

  useEffect(() => {
    if (isOpen) {
      setProjectName( intialData?.name || intialData?.projectName || "");
      setManagerId("");
      setExcelFile(null);
      setErrors({});

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }, [isOpen, intialData]);

  
  const handleFileChange = ( event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      setExcelFile(null);
      return;
    }

    const allowedExtensions = [".xlsx", ".xls"];

    const fileName = file.name.toLowerCase();

    const isExcelFile = allowedExtensions.some((extension) =>fileName.endsWith(extension));

    if (!isExcelFile) {
      setExcelFile(null);

      setErrors((prev) => ({ ...prev,excelFile: "Please select a valid Excel file (.xlsx or .xls).",}));

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      return;
    }

    // 5 MB limit
    if (file.size > 5 * 1024 * 1024) {
      setExcelFile(null);

      setErrors((prev) => ({...prev,excelFile:"Excel file size must be less than 5 MB."}));

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      return;
    }
    setExcelFile(file);
    setErrors((prev) => ({...prev,excelFile: undefined,}));
  };

  const handleRemoveFile = () => {
    setExcelFile(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    setErrors((prev) => ({ ...prev, excelFile: undefined}));
  };

  const validateForm = () => {
    const newErrors: {
      projectName?: string;
      managerId?: string;
      excelFile?: string;
    } = {};

    if (!projectName.trim()) { newErrors.projectName = "Project name is required.";}

    if (!managerId) { newErrors.managerId = "Please select a manager."}

    if (!excelFile) { newErrors.excelFile = "Please select an Excel file.";}

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async ( event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validateForm()) return;

    try {
      const projectId =intialData?.projectId?._id || intialData?._id || intialData?.projectId;

      const createdBy = user?.id;

      if (!projectId) throw new Error("Project ID not found.");

      if (!createdBy) throw new Error( "Created By ID not found.");

      if (!excelFile) throw new Error( "Excel file is required.");

      console.log( "createdBy:", createdBy, "projectId:", projectId, "managerId:", managerId, "excelFile:", excelFile);

      const formData = new FormData();

      formData.append( "excel", excelFile);

      const result = await createTasksFromExcel({ projectId, managerId, createdBy, file: formData}).unwrap();

      toast({ title: "Tasks Created Successfully.", description:result?.message || "Tasks created successfully."});
      // Reset
      setProjectName("");
      setManagerId("");
      setExcelFile(null);
      setErrors({});

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      onClose(false);
    } catch (error: any) {
      console.log( "Task Create Error:", error);
      toast({ title: "Task Create Error", description: error?.data?.errors?.[0]?.message || error?.data?.message || "Something went wrong while creating Tasks.", variant: "destructive"});
    }
  };

  const handleClose = () => {
    if (loading) return;

    setProjectName("");
    setManagerId("");
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
            Create Tasks
          </DialogTitle>

          <DialogDescription>
            Select a manager and upload an Excel
            file to create multiple tasks.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          className="space-y-5 pt-2"
        >
          {/* ==========================================
              PROJECT NAME
          ========================================== */}

          <div className="space-y-2">
            <Label htmlFor="projectName">
              Project Name
            </Label>

            <input
              id="projectName"
              type="text"
              value={projectName}
              onChange={(event) => {
                setProjectName(
                  event.target.value
                );

                if (errors.projectName) {
                  setErrors((prev) => ({
                    ...prev,
                    projectName:
                      undefined,
                  }));
                }
              }}
              placeholder="Enter project name"
              disabled={loading}
              className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring ${
                errors.projectName
                  ? "border-red-500"
                  : "border-input"
              }`}
            />

            {errors.projectName && (
              <p className="text-xs text-red-500">
                {errors.projectName}
              </p>
            )}
          </div>

          {/* ==========================================
              MANAGER SELECT
          ========================================== */}

          <div className="space-y-2">
            <Label>
              Assign Manager
            </Label>

            <Select
              value={managerId}
              onValueChange={(value) => {
                setManagerId(value);

                if (errors.managerId) {
                  setErrors((prev) => ({
                    ...prev,
                    managerId:
                      undefined,
                  }));
                }
              }}
              disabled={
                loading ||
                managerLoading
              }
            >
              <SelectTrigger
                className={
                  errors.managerId
                    ? "border-red-500"
                    : ""
                }
              >
                <SelectValue
                  placeholder={
                    managerLoading
                      ? "Loading managers..."
                      : "Select manager"
                  }
                />
              </SelectTrigger>

              <SelectContent>
                {managers.length > 0 ? (
                  managers.map(
                    (manager: IManager) => (
                      <SelectItem
                        key={manager._id}
                        value={manager._id}
                      >
                        <div className="flex flex-col">
                          <span>
                            {manager.fullName}

                            {manager?.department
                              ?.name &&
                              ` (${manager.department.name})`}
                          </span>

                          {manager.email && (
                            <span className="text-xs text-muted-foreground">
                              {manager.email}
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    )
                  )
                ) : (
                  <div className="px-2 py-2 text-sm text-muted-foreground">
                    {managerLoading
                      ? "Loading..."
                      : "No managers found."}
                  </div>
                )}
              </SelectContent>
            </Select>

            {errors.managerId && (
              <p className="text-xs text-red-500">
                {errors.managerId}
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
                className={`flex min-h-[150px] w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-5 py-6 transition-colors ${
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

                <p className="mt-1">
                  Status will automatically be set
                  to{" "}
                  <span className="font-medium">
                    pending
                  </span>
                  .
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
                managerLoading
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
                  Create Tasks
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
