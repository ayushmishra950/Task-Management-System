import React, { useEffect, useState } from "react";
import { Plus, MoreHorizontal, Edit, Trash2 } from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import AddManagerForm from "./forms/AddManagerForm";
import DeleteCard from "@/components/cards/DeleteCard";
import { useToast } from "@/hooks/use-toast";
import { useGetAllManagerQuery, useDeleteManagerMutation } from "@/redux-toolkit/api/admin/manager.api";

interface ManagerItem {
  _id: string;
  fullName: string;
  email: string;
  taskRoleStatus: string;
  department: any;
  profileImage: string;
}

const TaskManager = () => {
  const { toast } = useToast();
  const user = JSON.parse(localStorage.getItem("user"));
  const [deleteManager, {isLoading:isDeleting}] = useDeleteManagerMutation();
  const { data, refetch, isLoading:allManagerLoading } = useGetAllManagerQuery({
    companyId: user?.companyId,
  },{skip:!user?.id || !user?.role});
  const managers = data?.data || [];

  const [search, setSearch] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [initialData, setInitialData] = useState<ManagerItem | null>(null);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedManager, setSelectedManager] = useState(null);

  // ================= FLATTEN DATA =================
  const managerList = managers?.flatMap((manager) =>
    (manager?.managedDepartments || []).map((dept) => ({
      _id: manager?._id,
      fullName: manager?.fullName,
      email: manager?.email,
      profileImage: manager?.profileImage,
      department: dept,
      departmentName: dept?.name,
      departmentId: dept?._id,
    })),
  );

  // ================= SEARCH =================
  const filteredManagers = managerList?.filter(
    (m) =>
      m?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      m?.email?.toLowerCase().includes(search.toLowerCase()) ||
      m?.departmentName?.toLowerCase().includes(search.toLowerCase()),
  );

  const handleConfirmDelete = async () => {
    if (!selectedManager?._id || !selectedManager?.department?._id) return;

    try {
      const res = await deleteManager({
        id: selectedManager._id,
        companyId: user?.companyId,
        departmentId: selectedManager.department._id,
      }).unwrap();

      await refetch();
      toast({
        title: "Manager Delete Successfully.",
        description: res?.message,
      });
      setIsDeleteDialogOpen(false);
    } catch (error:any) {
      toast({
        title: "Error",
        description: error?.data?.errors?.[0] || error?.data?.message || "Something went wrong",
      variant:"destructive"
    });
    } 
  };

  // ================= UI =================
  return (
    <>
      <AddManagerForm
        isOpen={isFormOpen}
        onIsOpenChange={setIsFormOpen}
        initialData={initialData}
        managerData={null}
      />

      <DeleteCard
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
        title="Remove Manager"
        message="Are you sure you want to remove this manager?"
      />

      <div className="flex flex-col min-h-screen bg-gray-50/50 p-3 sm:p-6 space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-2">
              {/* Title */}
              <span className="text-[16px] sm:text-xl font-semibold">
                Manager List
              </span>

              {/* Button */}
              <Button
                onClick={() => {
                  setInitialData(null);
                  setIsFormOpen(true);
                }}
                className="px-2 py-1 text-[12px] md:w-[150px] sm:text-sm h-7 sm:h-9 whitespace-nowrap"
              >
                <Plus className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
                Add Manager
              </Button>
            </CardTitle>

            <CardDescription className="text-[11px] sm:text-sm mt-1">
              All managers grouped by department
            </CardDescription>
          </CardHeader>

          <CardContent>
            {/* Search */}
            <Input
              placeholder="Search managers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="mb-4"
            />

            {/* Table */}
            <div className="border rounded-md overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="text-[11px] md:text-sm">
                    <TableHead className="px-1 md:px-4">Profile</TableHead>
                    <TableHead className="px-1 md:px-4">Name</TableHead>
                    <TableHead className="hidden md:table-cell">
                      Email
                    </TableHead>
                    <TableHead className="px-1 md:px-4">Department</TableHead>
                    <TableHead className="text-right px-1 md:px-4">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {
                   allManagerLoading ? (
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
                  filteredManagers?.length ? (
                    filteredManagers.map((manager) => (
                      <TableRow
                        key={manager._id}
                        className="text-[11px] md:text-sm"
                      >
                        {/* Profile */}
                        <TableCell className="px-1 md:px-4">
                          {manager.profileImage ? (
                            <img
                              src={manager.profileImage}
                              alt={manager.fullName}
                              className="h-6 w-6 md:h-8 md:w-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="h-6 w-6 md:h-8 md:w-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-medium uppercase">
                              {manager.fullName?.charAt(0)}
                            </div>
                          )}
                        </TableCell>

                        {/* Name */}
                        <TableCell className="px-1 md:px-4 font-medium truncate max-w-[90px]">
                          {manager.fullName}
                        </TableCell>

                        {/* Email */}
                        <TableCell className="hidden md:table-cell">
                          {manager.email}
                        </TableCell>

                        {/* Department */}
                        <TableCell className="px-1 md:px-4 truncate max-w-[90px]">
                          {manager.department?.name}
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="text-right px-1 md:px-4">
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

                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                className="cursor-pointer flex items-center gap-2"
                                onClick={() => {
                                  setInitialData(manager);
                                  setIsFormOpen(true);
                                }}
                              >
                                <Edit className="w-4 h-4" />
                                Edit
                              </DropdownMenuItem>

                              <DropdownMenuSeparator />

                              <DropdownMenuItem
                                className="text-red-600 cursor-pointer flex items-center gap-2"
                                onClick={() => { setSelectedManager(manager);setIsDeleteDialogOpen(true)}}
                              >
                                <Trash2 className="w-4 h-4" />
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
                        colSpan={5}
                        className="text-center h-20 text-sm"
                      >
                        No managers found
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

export default TaskManager;
