import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { formatForDateTimeInput } from "@/services/allFunctions";
import {useGetAllEmployeeQuery} from "@/redux-toolkit/api/admin/employee.api";
import { useGetAllManagerQuery } from "@/redux-toolkit/api/admin/manager.api";


interface ReassignFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: any;
  reassignName: "Manager" | "Employee";
  reassignedType: "task" | "subTask";
  onSave: (value: any) => void;
}

const ReassignForm: React.FC<ReassignFormModalProps> = ({ isOpen,reassignedType, onClose, data, reassignName, onSave }) => {
  const  user = JSON.parse(localStorage.getItem("user"));
  const [newAssigneeId, setNewAssigneeId] = useState("");
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const startDateRef = useRef(null);
  const endDateRef = useRef(null);
  const { toast } = useToast();
    const {data:employeeData} = useGetAllEmployeeQuery({companyId:user?.companyId}, {skip: reassignName === "Manager" || reassignedType === "task" || !user?.id || !user?.role});
  const { data:managerData } = useGetAllManagerQuery({ companyId: user?.companyId},{skip:reassignName === "Employee" || reassignedType === "subTask" || !user?.id || !user?.role});
    const managers = managerData?.data || employeeData?.data;
  
const filteredAssignees = managers?.filter((item) => {
  if (reassignName === "Manager" || reassignedType === "task") {
    return item?.role === "manager";
  }

  if (reassignName === "Employee" || reassignedType === "subTask") {
    return item?.role === "employee";
  }

  return false;
});



  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newAssigneeId || !startDate || !endDate) {
      toast({ title: 'Error', description: 'All fields are required' });
      return;
    }
    if (new Date(endDate) < new Date(startDate)) {
      toast({ title: 'Error', description: 'End date cannot be before start date' });
      return;
    }
    setLoading(true);
    const obj = { employeeId:newAssigneeId, startDate, endDate, id: data?._id, reason }
    try {
      const res = await onSave(obj);
    }
    catch (err) {
      console.log(err);
      toast({ title: "Error", description: err.response.data.message, variant: "destructive" })
      setLoading(false);
    }
    finally {
      setLoading(false);
    }
  }
  
useEffect(() => {
  if (data && reassignName) {
    setStartDate(data?.startDate ? formatForDateTimeInput(data.startDate) : "");
    setEndDate(data?.endDate ? formatForDateTimeInput(data.endDate) : "");
    setReason("");
  } else {
    setNewAssigneeId("");
    setStartDate("");
    setEndDate("");
    setReason("");
  }
}, [data, reassignName]);


useEffect(() => {
  if (managers && managers.length > 0 && data) {
    const currentId = data?.managerId?._id || data?.employeeId?._id;
    if (currentId) {
      setNewAssigneeId(currentId);
    }
  }
}, [managers, data]); 


  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);


  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 sm:px-6">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-sm sm:max-w-md p-6 relative transition-all transform scale-100">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>

        <h2 className="text-xl font-semibold mb-4 text-center">Reassign {reassignName}</h2>
        <div className="mb-4 rounded-md bg-gray-50 p-3">
  <p className="text-xs text-gray-500">
    {reassignedType === "task" ? "Task" : "Sub Task"}
  </p>

  <p className="font-medium text-gray-900 truncate">
    {data?.name}
  </p>
</div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Employee Dropdown */}
          <div className="space-y-1">
            <Label htmlFor="employee">Select Employee</Label>
            <Select key={filteredAssignees?.length} value={newAssigneeId} onValueChange={setNewAssigneeId}>
              <SelectTrigger id="employee" className="w-full">
                <SelectValue placeholder="Choose an employee" />
              </SelectTrigger>
              <SelectContent className="w-full max-h-48 overflow-auto">
                {filteredAssignees?.map(emp => (
                  <SelectItem key={emp._id} value={emp._id} 
                  disabled={emp._id === newAssigneeId}
                  >
                    {emp?.fullName} {emp?.department?.name && ` (${emp.department.name})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Start Date */}
          <div className="space-y-1">
            <Label htmlFor="startDate">Start Date</Label>
            <Input
            ref={startDateRef}
              id="startDate"
              type="datetime-local"
               min={formatForDateTimeInput(data?.projectId?.startDate || data?.taskId?.startDate)}
              max={formatForDateTimeInput(data?.projectId?.endDate || data?.taskId?.endDate)}
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              onClick={()=>{if(startDateRef.current?.showPicker){startDateRef.current?.showPicker()}}}
            />
          </div>

          {/* End Date */}
          <div className="space-y-1">
            <Label htmlFor="endDate">End Date</Label>
            <Input
            ref={endDateRef}
              id="endDate"
              type="datetime-local"
              value={endDate}
               min={startDate}
              max={formatForDateTimeInput(data?.projectId?.endDate || data?.taskId?.endDate)}
              onChange={e => setEndDate(e.target.value)}
              onClick={()=>{if(endDateRef.current?.showPicker){endDateRef.current?.showPicker()}}}
            />
          </div>
       <div className="space-y-1">
  <Label htmlFor="reason">Reason (Optional)</Label>
  <Textarea
    id="reason"
    placeholder="Enter reason for reassignment"
    value={reason}
    onChange={(e) => setReason(e.target.value)}
    rows={3}
  />
</div>



          {/* Submit Button */}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Reassigning...' : 'Reassign'}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ReassignForm;
