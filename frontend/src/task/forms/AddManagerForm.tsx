
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectTrigger,
    SelectContent,
    SelectItem,
    SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    useRegisterManagerMutation,
    useUpdateManagerMutation,
} from "@/redux-toolkit/api/admin/manager.api";
import { useGetDepartmentQuery } from "@/redux-toolkit/api/admin/department.api";
import { useGetAllEmployeeQuery } from "@/redux-toolkit/api/admin/employee.api";

const AddManagerForm = ({
    isOpen,
    onIsOpenChange,
    initialData,
    managerData,
}) => {
    const { toast } = useToast();

    const user = JSON.parse(localStorage.getItem("user"));

    const [department, setDepartment] = useState("none");
    const [filteredEmployees, setFilteredEmployees] = useState([]);
    const [selectedEmployees, setSelectedEmployees] = useState([]);
    const [existingManagers, setExistingManagers] = useState([]);

    const [registerManager, { isLoading: registerLoading }] =
        useRegisterManagerMutation();

    const [updateManager, { isLoading: updateLoading }] =
        useUpdateManagerMutation();

    const loading = registerLoading || updateLoading;

    const { data } = useGetDepartmentQuery({
        companyId: user?.companyId,
    }, {skip:!user?.id || !user?.role});

    const departmentList = data?.data || [];

    const { data: employeeData } = useGetAllEmployeeQuery({
        companyId: user?.companyId,
    }, {skip:!user?.id || !user?.role});

    const employeeList = employeeData?.data || [];

    // managerData or initialData = current manager while editing
    const currentManager = managerData || initialData;

    const resetForm = () => {
        setDepartment("none");
        setFilteredEmployees([]);
        setSelectedEmployees([]);
        setExistingManagers([]);
    };

    useEffect(() => {
        if (!isOpen) return;

        const data = managerData || initialData;

        // EDIT MODE
        if (data) {
            const deptId =
                data.department?._id ||
                data.departmentId ||
                "none";

            const managerId = data._id;

            setDepartment(deptId);

            // Only the current manager is selected
            setExistingManagers(managerId ? [managerId] : []);
            setSelectedEmployees(managerId ? [managerId] : []);

            const filtered = employeeList.filter(
                (emp) => emp.department?._id === deptId
            );

            setFilteredEmployees(filtered);
        }

        // ADD MODE
        else {
            resetForm();
        }
    }, [
        initialData,
        managerData,
        isOpen,
        employeeList,
        departmentList,
    ]);

    const handleDepartmentChange = (value) => {
        setDepartment(value);

        if (value === "none") {
            setFilteredEmployees([]);
            setSelectedEmployees([]);
            setExistingManagers([]);
            return;
        }

        const filtered = employeeList.filter(
            (emp) => emp.department?._id === value
        );

        setFilteredEmployees(filtered);

        if (!currentManager) {
            setSelectedEmployees([]);
            setExistingManagers([]);
        }
    };

    const toggleEmployee = (id) => {
        setSelectedEmployees([id]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!department || department === "none") {
            return;
        }

        // CREATE ke liye ek employee required hai.
        if (!currentManager && selectedEmployees.length !== 1) {
            return;
        }

        try {
            let res;

            // =========================
            // CREATE MANAGER
            // =========================
            if (!currentManager) {
                const employeeId = selectedEmployees[0];

                res = await registerManager({
                    id: employeeId,
                    companyId: user?.companyId,
                    departmentId: department,
                }).unwrap();
            }

            // =========================
            // UPDATE MANAGER
            // =========================
            else {
                const managerId = currentManager?._id;

                const oldDepartmentId =
                    currentManager?.department?._id ||
                    currentManager?.departmentId;

                if (!managerId || !oldDepartmentId) {
                    toast({
                        title: "Error",
                        description:
                            "Manager or old department information is missing.",
                        variant: "destructive",
                    });

                    return;
                }

                if (oldDepartmentId === department) {
                    onIsOpenChange(false);
                    resetForm();
                    return;
                }

                res = await updateManager({
                    id: managerId,
                    companyId: user?.companyId,
                    oldDepartmentId,
                    newDepartmentId: department,
                }).unwrap();
            }

            toast({
                title: currentManager
                    ? "Manager Updated."
                    : "Manager Added.",
                description: res?.message,
            });

            onIsOpenChange(false);
            resetForm();
        } catch (err: any) {
            console.log("Manager Error:",err);
            toast({
                title: "Error",
                description:
                    err?.data?.errors?.[0]?.message ||
                    err?.data?.message ||
                    "Something went wrong.",
                variant: "destructive",
            });
        }
    };

    return (
        <Dialog
            open={isOpen}
            onOpenChange={(open) => {
                resetForm();
                onIsOpenChange(open);
            }}
        >
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>
                        {currentManager
                            ? "Edit Manager"
                            : "Add Manager"}
                    </DialogTitle>

                    <DialogDescription>
                        Manager Form
                    </DialogDescription>
                </DialogHeader>

                <form
                    className="space-y-4"
                    onSubmit={handleSubmit}
                >
                    <div>
                        <Label>Department*</Label>

                        <Select
                            value={department}
                            onValueChange={handleDepartmentChange}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select department" />
                            </SelectTrigger>

                            <SelectContent>
                                <SelectItem value="none">
                                    None
                                </SelectItem>

                                {departmentList.map((dep) => (
                                    <SelectItem
                                        key={dep._id}
                                        value={dep._id}
                                    >
                                        {dep.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Label>Employees</Label>

                        <div className="border rounded-md p-2 max-h-52 overflow-y-auto space-y-2">
                            {filteredEmployees.map((emp) => {
                                const isExisting =
                                    existingManagers.includes(emp._id);

                                const isSelected =
                                    selectedEmployees.includes(emp._id);

                                return (
                                    <div
                                        key={emp._id}
                                        onClick={() =>
                                            toggleEmployee(emp._id)
                                        }
                                        className={`flex justify-between items-center p-2 rounded cursor-pointer transition
                                            ${
                                                isSelected
                                                    ? "bg-green-100"
                                                    : "hover:bg-gray-100"
                                            }
                                        `}
                                    >
                                        <span className="text-sm">
                                            {emp.fullName}
                                        </span>

                                        {(isExisting || isSelected) && (
                                            <span className="text-xs text-green-700 font-semibold">
                                                Selected
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {department === "none" && (
                            <p className="text-xs text-red-500 mt-1">
                                Please select a department
                            </p>
                        )}

                        {department !== "none" &&
                            filteredEmployees.length === 0 && (
                                <p className="text-xs text-red-500 mt-1">
                                    No employees found
                                </p>
                            )}
                    </div>

                    <div className="flex gap-2">
                        <Button
                            type="button"
                            variant="secondary"
                            className="w-full"
                            onClick={() => {
                                onIsOpenChange(false);
                                resetForm();
                            }}
                        >
                            Cancel
                        </Button>

                        <Button
                            type="submit"
                            className="w-full"
                            disabled={
                                loading ||
                                department === "none" ||
                                (!currentManager &&
                                    selectedEmployees.length === 0)
                            }
                        >
                            {loading && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}

                            {currentManager ? "Update" : "Save"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default AddManagerForm;
