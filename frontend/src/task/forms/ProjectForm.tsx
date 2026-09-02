
import React, { useEffect, useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ChevronDown } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { ProjectFormData, ProjectFormProps, Priority } from "@/types/index";
import { formatForDateTimeInput } from "@/services/allFunctions";
import {useCreateProjectMutation,useUpdateProjectMutation} from "@/redux-toolkit/api/admin/project.api";


const ProjectForm: React.FC<ProjectFormProps> = ({
  isOpen,
  onClose,
  initialData = null,
}) => {
  const user = JSON.parse(localStorage.getItem("user"));
  const { toast } = useToast();
  const [formData, setFormData] = useState<ProjectFormData>({
    priority: 'medium',
    startDate: '',
    endDate: ''
  });
  const [startDateTouched, setStartDateTouched] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showScrollArrow, setShowScrollArrow] = useState(false);
  const startDateRef = useRef(null);
  const endDateRef = useRef(null);
  const [createProject, {isLoading:createLoading}] = useCreateProjectMutation();
  const [updateProject,{isLoading:updateLoading}] = useUpdateProjectMutation();
  const loading = createLoading || updateLoading;

  const isEdit = Boolean(initialData);
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    setStartDateTouched(false);
  }, [isOpen]);

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        startDate: formatForDateTimeInput(initialData.startDate),
        endDate: formatForDateTimeInput(initialData.endDate),
      });
    } else {
      setFormData({ priority: 'medium', startDate: '', endDate: '' });
    }
  }, [initialData, isOpen]);

  // Detect if scrolling is needed
  const checkIfScrollable = () => {
    if (!scrollRef.current) return;
    const { scrollHeight, clientHeight } = scrollRef.current;
    setShowScrollArrow(scrollHeight > clientHeight + 4); // small threshold
  };

  useEffect(() => {
    if (!isOpen) return;
    checkIfScrollable();

    const resizeObserver = new ResizeObserver(checkIfScrollable);
    if (scrollRef.current) {
      resizeObserver.observe(scrollRef.current);
    }

    // Also check after content might change
    const timer = setTimeout(checkIfScrollable, 300);

    return () => {
      resizeObserver.disconnect();
      clearTimeout(timer);
    };
  }, [isOpen, formData]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    const required = ['name', 'startDate', 'priority'] as const;
    for (const field of required) {
      if (!formData[field]) {
        toast({
          title: "Required Field Missing",
          description: `${field.charAt(0).toUpperCase() + field.slice(1)} is required.`,
          variant: "destructive",
        });
        return;
      }
    }
    try {  
    const obj = {...formData, companyId:user?.companyId, createdBy:user?.id, url:"http://localhost:5000", status:"pending"}
      console.log("formData:",obj)

      let res;
      if (isEdit) {
        res = await updateProject({body:obj, companyId:obj?.companyId, id:initialData?._id}).unwrap();
      } else {
       res = await createProject({body:obj}).unwrap();
      }

        toast({
          title: isEdit ? "Project Updated" : "Project Created",
          description: res.message || "Success",
        });
        onClose();
    } catch (err: any) {
      console.log("Project:",err);
      toast({
        title: "Project Create Error",
        description: err?.data?.errors?.[0]?.message || err?.data?.message || "Something went wrong",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[540px] w-[92vw] max-h-[91vh] p-0 gap-0 rounded-lg overflow-hidden">
        <form onSubmit={handleSave} className="flex flex-col h-full">
          <DialogHeader className="px-5 pt-5 pb-3 border-b shrink-0">
            <DialogTitle className="text-lg font-semibold">
              {isEdit ? 'Edit Project' : 'Create New Project'}
            </DialogTitle>
          </DialogHeader>

          {/* Scrollable content */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto px-5 py-5 space-y-4.5"
          >
            <div className="grid gap-1.5">
              <Label htmlFor="name" className="text-sm font-medium">Project Name *</Label>
              <Input
                id="name"
                placeholder="Enter project name"
                value={formData.name || ''}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="h-9 text-sm"
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="description" className="text-sm font-medium md:mt-2">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Briefly describe the project (Optional)"
                value={formData.description || ''}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                className="min-h-[72px] text-sm resize-y"
              />
            </div>
                        <div className="grid gap-1.5 my-2">
              <Label htmlFor="url" className="text-sm font-medium md:mt-2">Url *</Label>
              <Input
                id="url"
                placeholder="Briefly Url the project"
                value={formData.url || ''}
                onChange={e => setFormData({ ...formData, url: e.target.value })}
                className="h-10 text-sm p-2"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start md:mt-1">

              <div className="flex flex-col gap-1 ">
                <Label htmlFor="startDate" className="text-sm font-medium">
                  Start Date *
                </Label>
                <Input
                  id="startDate"
                  type="datetime-local"
                  ref={startDateRef}
                  onClick={() => { if (startDateRef.current?.showPicker) { startDateRef.current.showPicker() } }}
                  min={isEdit && !startDateTouched ? undefined : today}
                  value={formData.startDate || ''}
                  onChange={(e) => {
                    setStartDateTouched(true);
                    setFormData(prev => ({
                      ...prev,
                      startDate: e.target.value,
                      endDate:
                        prev.endDate &&
                          e.target.value &&
                          prev.endDate < e.target.value
                          ? ''
                          : prev.endDate,
                    }));
                  }}
                  className="h-9 text-sm"
                />
              </div>

              <div className="flex flex-col gap-1">
                <Label htmlFor="endDate" className="text-sm font-medium">
                  End Date (Optional)
                </Label>
                <Input
                  id="endDate"
                  type="datetime-local"
                  ref={endDateRef}
                  onClick={() => { if (endDateRef.current?.showPicker) { endDateRef.current.showPicker() } }}
                  min={formData.startDate || today}
                  disabled={!formData.startDate}
                  value={formData.endDate || ''}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, endDate: e.target.value }))
                  }
                  className="h-9 text-sm"
                />

              </div>

            </div>

            <div className="grid gap-1.5 my-2">
              <Label htmlFor="priority" className="text-sm font-medium">Priority *</Label>
              <Select
                value={formData.priority || 'medium'}
                onValueChange={(v: Priority) => setFormData({ ...formData, priority: v })}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="remarks" className="text-sm font-medium md:mt-2">Remarks (Optional)</Label>
              <Textarea
                id="remarks"
                placeholder="Add any additional notes (Optional)"
                value={formData.remarks || ''}
                onChange={e => setFormData({ ...formData, remarks: e.target.value })}
                className="min-h-[72px] text-sm resize-y "
              />
            </div>
          </div>

          {/* Footer + scroll hint */}
          <div className="relative shrink-0 border-t bg-background">
            <DialogFooter className="px-5 py-4 gap-3 flex-col-reverse sm:flex-row">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
                className="h-9 text-sm sm:w-auto w-full"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading || !formData.name || !formData.startDate || !formData.priority}
                className="h-9 text-sm sm:w-auto w-full"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEdit ? 'Update Project' : 'Create Project'}
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
  );
};

export default ProjectForm;