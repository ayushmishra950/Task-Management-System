import React, { useState } from 'react';
import { Briefcase, Plus, Search, Users, MoreHorizontal, Edit, Trash2, UserPlus, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import DepartmentDialog from "@/Forms/DepartmentDialog";
import DeleteCard from "@/components/cards/DeleteCard";
import DepartmentCard from "@/components/cards/DepartmentCard";
import { Helmet } from "react-helmet-async";
import { EmployeeFormDialog } from "@/Forms/EmployeeFormDialog"
import {useAppSelector } from '@/redux-toolkit/hooks/hook';
import EmployeeListModal from "@/components/cards/EmployeeList";
import {useGetDepartmentQuery, useDeleteDepartmentMutation} from "@/redux-toolkit/api/admin/department.api";

const departmentColors = [
  'bg-primary/10 text-primary',
  'bg-success/10 text-success',
  'bg-warning/10 text-warning',
  'bg-info/10 text-info',
  'bg-destructive/10 text-destructive',
  'bg-accent text-accent-foreground',
];

const Departments: React.FC = () => {
  const { toast } = useToast();
  const  user  = JSON.parse(localStorage.getItem("user"));
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [initialData, setInitialData] = useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>();
  const [showDepartment, setShowDepartment] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<null | any>(null);
  const [selectedDepartmentEmployees, setSelectedDepartmentEmployees] = useState<any[]>([]);
  const [employeeListRefresh, setEmployeeListRefresh] = useState(false);
  const [employeeDialogOpen, setEmployeeDialogOpen] = useState(false);
  const [employeeListDialog, setEmployeeListDialog] = useState(false);
  const [pageLoading, setPageLoading] = useState(false);
  const [deleteDepartment,{isLoading:deleteLoading}] = useDeleteDepartmentMutation();
  const {data, isLoading, error, isError} = useGetDepartmentQuery({companyId:user?.companyId});
  const departmentList = data?.data || [];

  const employeeList = useAppSelector((state) => state.user.employees);
  const filterEmployees = employeeList.filter((e) => e?.status !== "RELIEVED")
  const filteredDepartments = departmentList?.filter(
    (dept) =>
      dept?.name?.toLowerCase()?.includes(searchQuery?.toLowerCase()) ||
      dept?.description?.toLowerCase()?.includes(searchQuery?.toLowerCase())
  );

  const handleDeleteClick = (employeeId) => {
    setSelectedDepartmentId(employeeId);
    setIsDeleteDialogOpen(true);
  };


  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await deleteDepartment({id:selectedDepartmentId, companyId:user?.companyId}).unwrap();
        toast({
          title: "Department Deleted",
          description: `${res?.message}`,
        });
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: error?.data?.errors?.[0]?.message || error?.data?.message || "Something went wrong",
      });
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  if (pageLoading && (departmentList.length === 0 || filterEmployees.length === 0)) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      <EmployeeListModal open={employeeListDialog} onClose={() => { setEmployeeListDialog(false) }} data={filterEmployees} />
      <Helmet>
        <title>Department Page</title>
        <meta name="description" content="This is the home page of our app" />
      </Helmet>
      <div className="space-y-6">
        <DepartmentDialog
          isOpen={isDialogOpen}
          setIsOpen={() => { setIsDialogOpen(false) }}
          initialData={initialData}
          mode={isEditDialogOpen}
        />
        <EmployeeFormDialog
          open={employeeDialogOpen}
          onClose={() => { setEmployeeDialogOpen(false) }}
          isEditMode={null}
          initialData={null}
          selectedDepartmentId={selectedDepartmentId}
        />

        <DeleteCard
          isOpen={isDeleteDialogOpen}
          onClose={() => setIsDeleteDialogOpen(false)}
          onConfirm={handleConfirmDelete}
          isDeleting={isDeleting}
          title="Delete Department?"
          message="This Action Will Permanently Delete This Department."
        />
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end md:mt-[-15px] gap-4">
          {/* Right: Add Department Button */}
          <div className="flex flex-wrap sm:flex-nowrap justify-end gap-2 sm:gap-3">

            <Button
              onClick={() => { setEmployeeDialogOpen(true) }}
              className="flex items-center gap-1 sm:gap-2 
               px-2 py-1 sm:px-4 sm:py-2 
               text-xs sm:text-sm 
               bg-blue-600 text-white hover:bg-blue-700"
            >
              <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
              Add Employee
            </Button>

            <Button
              onClick={() => {
                setInitialData(null);
                setIsEditDialogOpen(false);
                setIsDialogOpen(true);
              }}
              className="flex items-center gap-1 sm:gap-2 
               px-2 py-1 sm:px-4 sm:py-2 
               text-xs sm:text-sm 
               bg-blue-600 text-white hover:bg-blue-700"
            >
              <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
              Add Department
            </Button>

          </div>

        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5">

          {/* Departments Card */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Briefcase className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Departments</p>
                  <p className="text-xl font-bold">{departmentList?.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Employees Card */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-3">

                {/* Left side */}
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-success/10">
                    <Users className="w-5 h-5 text-success" />
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">Total Employees</p>
                    <p className="text-xl font-bold">{filterEmployees?.length}</p>
                  </div>
                </div>

                {/* Button */}
                <button
                  onClick={() => setEmployeeListDialog(true)}
                  className="px-3 py-1 text-sm font-medium rounded-md border border-primary text-primary hover:bg-primary/10 whitespace-nowrap"
                >
                  View
                </button>

              </div>
            </CardContent>
          </Card>

          {/* Avg per Dept Card */}
          <Card className="col-span-1 sm:col-span-2 md:col-span-1">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-info/10">
                  <Users className="w-5 h-5 text-info" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Avg per Dept</p>
                  <p className="text-xl font-bold">
                    {(filterEmployees?.length > 0 && departmentList?.length > 0)
                      ? Math.round(filterEmployees?.length / departmentList?.length)
                      : 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search departments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Departments Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pb-10 md:pb-0">
          {filteredDepartments?.map((dept, index) => (
            <Card key={dept?._id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-xl ${departmentColors[index % departmentColors?.length]}`}>
                    <Briefcase className="w-6 h-6" />
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem className='cursor-pointer' onClick={() => { setSelectedDepartmentId(dept._id); setEmployeeDialogOpen(true) }}>
                        <Edit className="w-4 h-4 mr-2" />
                        Add Employee
                      </DropdownMenuItem>
                      <DropdownMenuItem className='cursor-pointer' onClick={() => { setInitialData(dept); setIsEditDialogOpen(true); setIsDialogOpen(true) }}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive cursor-pointer" onClick={() => { handleDeleteClick(dept?._id) }}>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <h3 className="text-lg font-semibold mb-2">{dept?.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">{dept?.description}</p>

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{filterEmployees?.filter((emp) => emp.department?._id === dept._id).length} employees</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedDepartment(dept); // pura dept object
                      setSelectedDepartmentEmployees(
                        filterEmployees.filter((emp) => emp.department?._id === dept?._id)
                      );
                      setShowDepartment(true);
                    }}
                  >
                    View
                  </Button>

                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {showDepartment && selectedDepartment && (
          <DepartmentCard

            departmentData={selectedDepartment} // pura dept object
            employees={selectedDepartmentEmployees}
            onClose={() => setShowDepartment(false)}
            departmentList={filteredDepartments}
            setSelectedDepartmentEmployees={setSelectedDepartmentEmployees}
            refreshList={null}
          />
        )}


        {filteredDepartments?.length === 0 && (
          <div className="text-center py-12">
            <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No departments found.</p>
          </div>
        )}
      </div>
    </>
  );
};

export default Departments;
