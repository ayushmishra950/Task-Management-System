import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatForDateTimeInput } from "@/services/allFunctions";
import {
  useCreateClientRequestMutation,
  useUpdateMyClientRequestMutation,
} from "@/redux-toolkit/api/client/clientRequest.api";
import { useGetMyProjectsQuery } from "@/redux-toolkit/api/client/auth.api";

interface ClientRequestFormProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: any | null;
}

const emptyForm = {
  requestType: "new_project",
  projectId: "",
  title: "",
  description: "",
  priority: "medium",
  expectedDate: "",
  referenceUrl: "",
};

const ClientRequestForm: React.FC<ClientRequestFormProps> = ({ isOpen, onClose, initialData = null }) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<any>(emptyForm);

  const isEdit = Boolean(initialData);

  const { data: projectData } = useGetMyProjectsQuery(undefined, { skip: !isOpen });
  const projects = projectData?.data || [];

  const [createRequest, { isLoading: isCreating }] = useCreateClientRequestMutation();
  const [updateRequest, { isLoading: isUpdating }] = useUpdateMyClientRequestMutation();
  const loading = isCreating || isUpdating;

  useEffect(() => {
    if (!isOpen) return;

    if (initialData) {
      setFormData({
        requestType: initialData.requestType || "new_project",
        projectId: initialData.projectId?._id || initialData.projectId || "",
        title: initialData.title || "",
        description: initialData.description || "",
        priority: initialData.priority || "medium",
        expectedDate: initialData.expectedDate ? formatForDateTimeInput(initialData.expectedDate) : "",
        referenceUrl: initialData.referenceUrl || "",
      });
    } else {
      setFormData(emptyForm);
    }
  }, [initialData, isOpen]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title?.trim()) {
      toast({ title: "Required Field Missing", description: "Title is required.", variant: "destructive" });
      return;
    }

    if (!formData.description?.trim()) {
      toast({ title: "Required Field Missing", description: "Description is required.", variant: "destructive" });
      return;
    }

    if (formData.requestType === "project_update" && !formData.projectId) {
      toast({ title: "Required Field Missing", description: "Please select the project you need an update on.", variant: "destructive" });
      return;
    }

    const body: any = {
      requestType: formData.requestType,
      title: formData.title.trim(),
      description: formData.description.trim(),
      priority: formData.priority,
    };

    // Edit pe khali value bhejni zaroori hai taaki purani value clear ho sake,
    // create pe khali field bhejne ka koi matlab nahi.
    if (isEdit || formData.expectedDate) body.expectedDate = formData.expectedDate || "";
    if (isEdit || formData.referenceUrl?.trim()) body.referenceUrl = formData.referenceUrl?.trim() || "";

    if (formData.requestType === "project_update") body.projectId = formData.projectId;

    try {
      const res = isEdit
        ? await updateRequest({ id: initialData._id, body }).unwrap()
        : await createRequest({ body }).unwrap();

      toast({
        title: isEdit ? "Request Updated" : "Request Sent",
        description: res?.message || "Success",
      });

      onClose();
    } catch (err: any) {
      toast({
        title: isEdit ? "Update Failed" : "Request Failed",
        description: err?.data?.errors?.[0]?.message || err?.data?.message || "Something went wrong",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[560px] w-[92vw] max-h-[91vh] p-0 gap-0 rounded-lg overflow-hidden">
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <DialogHeader className="px-5 pt-5 pb-3 border-b shrink-0">
            <DialogTitle className="text-lg font-semibold">
              {isEdit ? "Edit Request" : "Raise a New Request"}
            </DialogTitle>
          </DialogHeader>

          <div className="px-5 py-4 space-y-4 overflow-y-auto max-h-[64vh]">
            <div className="space-y-2">
              <Label>Request Type *</Label>
              <Select value={formData.requestType} onValueChange={(value) => handleChange("requestType", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select request type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new_project">New Project</SelectItem>
                  <SelectItem value="project_update">Update on an existing project</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.requestType === "project_update" && (
              <div className="space-y-2">
                <Label>Project *</Label>
                <Select value={formData.projectId} onValueChange={(value) => handleChange("projectId", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder={projects.length ? "Select a project" : "No project assigned to you yet"} />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project: any) => (
                      <SelectItem key={project._id} value={project._id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {projects.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    Once the admin links a project to your account it will show up here.
                  </p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleChange("title", e.target.value)}
                placeholder={formData.requestType === "new_project" ? "e.g. E-commerce website" : "e.g. Need a status update on the payment module"}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                rows={5}
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                placeholder="Describe exactly what you need, with any scope, deadline or reference details."
                disabled={loading}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={formData.priority} onValueChange={(value) => handleChange("priority", value)}>
                  <SelectTrigger>
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

              <div className="space-y-2">
                <Label htmlFor="expectedDate">Expected Date</Label>
                <Input
                  id="expectedDate"
                  type="date"
                  value={formData.expectedDate}
                  onChange={(e) => handleChange("expectedDate", e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="referenceUrl">Reference Link</Label>
              <Input
                id="referenceUrl"
                type="url"
                value={formData.referenceUrl}
                onChange={(e) => handleChange("referenceUrl", e.target.value)}
                placeholder="https://example.com/reference"
                disabled={loading}
              />
            </div>
          </div>

          <DialogFooter className="px-5 py-4 border-t shrink-0 gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isEdit ? "Update Request" : "Send to Admin"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ClientRequestForm;
