import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRegisterClientMutation, useUpdateClientMutation } from "@/redux-toolkit/api/admin/client.api";

interface ClientFormProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: any | null;
}

const emptyForm = {
  fullName: "",
  email: "",
  password: "",
  contact: "",
  clientCompanyName: "",
  designation: "",
  address: "",
  remarks: "",
};

const ClientForm: React.FC<ClientFormProps> = ({ isOpen, onClose, initialData = null }) => {
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const { toast } = useToast();

  const [formData, setFormData] = useState<any>(emptyForm);
  const [showPassword, setShowPassword] = useState(false);

  const isEdit = Boolean(initialData);

  const [registerClient, { isLoading: isCreating }] = useRegisterClientMutation();
  const [updateClient, { isLoading: isUpdating }] = useUpdateClientMutation();
  const loading = isCreating || isUpdating;

  useEffect(() => {
    if (!isOpen) return;

    setShowPassword(false);

    if (initialData) {
      setFormData({
        fullName: initialData.fullName || "",
        email: initialData.email || "",
        password: "",
        contact: initialData.contact || "",
        clientCompanyName: initialData.clientCompanyName || "",
        designation: initialData.designation || "",
        address: initialData.address || "",
        remarks: initialData.remarks || "",
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

    const required: [string, string][] = [
      ["fullName", "Full name"],
      ["email", "Email"],
      ["contact", "Contact"],
    ];

    for (const [field, label] of required) {
      if (!formData[field]?.trim()) {
        toast({ title: "Required Field Missing", description: `${label} is required.`, variant: "destructive" });
        return;
      }
    }

    if (!isEdit && (!formData.password || formData.password.length < 6)) {
      toast({ title: "Weak Password", description: "Password must be at least 6 characters.", variant: "destructive" });
      return;
    }

    const body: any = {
      fullName: formData.fullName.trim(),
      email: formData.email.trim().toLowerCase(),
      contact: formData.contact.trim(),
    };

    ["clientCompanyName", "designation", "address", "remarks"].forEach((field) => {
      if (formData[field]?.trim()) body[field] = formData[field].trim();
    });

    if (formData.password) body.password = formData.password;

    try {
      let res;

      if (isEdit) {
        res = await updateClient({ id: initialData._id, companyId: user?.companyId, body }).unwrap();
      } else {
        res = await registerClient({
          body: { ...body, companyId: user?.companyId, createdBy: user?.id },
        }).unwrap();
      }

      toast({ title: isEdit ? "Client Updated" : "Client Created", description: res?.message || "Success" });
      onClose();
    } catch (err: any) {
      toast({
        title: isEdit ? "Update Failed" : "Create Failed",
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
            <DialogTitle className="text-lg font-semibold">{isEdit ? "Edit Client" : "Add New Client"}</DialogTitle>
          </DialogHeader>

          <div className="px-5 py-4 space-y-4 overflow-y-auto max-h-[64vh]">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name *</Label>
                <Input id="fullName" value={formData.fullName} onChange={(e) => handleChange("fullName", e.target.value)} disabled={loading} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="clientCompanyName">Client Company</Label>
                <Input
                  id="clientCompanyName"
                  value={formData.clientCompanyName}
                  onChange={(e) => handleChange("clientCompanyName", e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input id="email" type="email" value={formData.email} onChange={(e) => handleChange("email", e.target.value)} disabled={loading} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact">Contact *</Label>
                <Input id="contact" value={formData.contact} onChange={(e) => handleChange("contact", e.target.value)} disabled={loading} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{isEdit ? "New Password (optional)" : "Password *"}</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                  placeholder={isEdit ? "Leave blank to keep the current password" : "Minimum 6 characters"}
                  disabled={loading}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Share these credentials with the client — they sign in at <span className="font-medium">/client/login</span>.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="designation">Designation</Label>
                <Input id="designation" value={formData.designation} onChange={(e) => handleChange("designation", e.target.value)} disabled={loading} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input id="address" value={formData.address} onChange={(e) => handleChange("address", e.target.value)} disabled={loading} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="remarks">Remarks</Label>
              <Textarea id="remarks" rows={3} value={formData.remarks} onChange={(e) => handleChange("remarks", e.target.value)} disabled={loading} />
            </div>
          </div>

          <DialogFooter className="px-5 py-4 border-t shrink-0 gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isEdit ? "Update Client" : "Create Client"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ClientForm;
