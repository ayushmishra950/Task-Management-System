// AdminFormDialog.tsx
import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { EyeOff, Eye, Loader2 } from "lucide-react";
import CompanyFormDialog from "@/Forms/CompanyFormDialog";
import {useGetCompanyQuery} from "@/redux-toolkit/api/superAdmin/company.api";
import {useRegisterAdminMutation, useUpdateAdminMutation} from "@/redux-toolkit/api/superAdmin/admin.api";

interface AdminFormDialogProps {
  open: boolean;
  setOpen: (val: boolean) => void;
  initialData?: any;
  mode?: boolean;
  setadminListRefresh?: (value: boolean) => void;
}

const AdminFormDialog: React.FC<AdminFormDialogProps> = ({
  open,
  setOpen,
  initialData,
  mode,
  setadminListRefresh,
}) => {
  const user = JSON.parse(localStorage.getItem("user"));
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    contact: "",
    address: "",
    companyId: "",
    role: "admin",
  });
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
const {data} = useGetCompanyQuery();
  const companyList = data?.data;
   const [registerAdmin, {isLoading:isRegistering}] = useRegisterAdminMutation();
  const [updateAdmin, {isLoading:isUpdating}] = useUpdateAdminMutation();

  const loading = isRegistering || isUpdating;
  const resetFrom = () => {
    setForm({
      fullName: "",
      email: "",
      password: "",
      companyId: "",
      address: "",
      contact: "",
      role: "admin"
    })
  };

  // Edit mode data
  useEffect(() => {
    if (initialData && mode === true) {
      setForm({
        fullName: initialData.fullName || "",
        email: initialData.email || "",
        password: "",
        contact: initialData.contact || "",
        address: initialData.address || "",
        companyId: initialData.companyId || "",
        role: initialData.role || "admin",
      });
    }
  }, [open, initialData, mode]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleCompanyChange = (val: string) => {
    setForm({ ...form, companyId: val });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let res;
     if (mode === false) {
  res = await registerAdmin({
    ...form,
    createdBy: user?.id,
  }).unwrap();

} else if (mode === true && initialData?._id) {
  res = await updateAdmin({
    id: initialData._id,
    body: {
      ...form,
      createdBy: user?.id,
    },
  }).unwrap();
}
        toast({
          title: mode === false ? "Admin Created" : "Admin Updated",
          description: res.message,
        });
        setOpen(false);
        resetFrom();
    } catch (err: any) {
      console.log("admin Error:",err);
      toast({
        title: "Error",
        description: err?.data?.message || "Something went wrong",
        variant: "destructive"
      });
    } 
  };


  return (
    <>
      <CompanyFormDialog
        open={isDialogOpen}
        setOpen={setIsDialogOpen}
        initialData={null}
        mode={false}
      />

      <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) { resetFrom() }; setOpen(isOpen) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {mode === false ? "Register New Admin" : "Edit Admin"}
            </DialogTitle>
            <DialogDescription>
              {mode === false
                ? "Add a new admin to the system."
                : "Update admin details."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-4">

            {/* Row 1: Name + Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  name="fullName"
                  value={form.fullName}
                  onChange={handleChange}
                  placeholder="Enter admin name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="admin@email.com"
                  required
                />
              </div>
            </div>

            {/* Row 2: Mobile + Address */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Mobile</Label>
                <Input
                  name="contact"
                  value={form.contact}
                  onChange={handleChange}
                  placeholder="+91 98765 43210"
                />
              </div>

              <div className="space-y-2">
                <Label>Address</Label>
                <Input
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  placeholder="Enter address"
                />
              </div>
            </div>

            {/* Row 3: Password + Company */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Password {mode === true && `(Optional)`}</Label>

                <div className="relative">
                  <Input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Enter password"
                    required={mode === false}
                    className="pr-10"
                  />

                  { (
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Company</Label>

                <Select
                  value={form.companyId || ""}
                  onValueChange={handleCompanyChange}
                  disabled={companyList?.length === 0} // disable if no companies
                >
                  <SelectTrigger className="h-9 sm:h-10 text-sm">
                    <SelectValue placeholder="Select company" />
                  </SelectTrigger>

                  {/* Only show content if there are companies */}
                  {companyList?.length > 0 && (
                    <SelectContent className="max-h-48 overflow-y-auto">
                      {companyList.map((company) => (
                        <SelectItem key={company._id} value={company._id}>
                          {company.name}
                        </SelectItem>
                      ))}

                      {/* Divider + Add More button */}
                      <div className="border-t my-1" />

                      <button
                        type="button"
                        onClick={() => setIsDialogOpen(true)}
                        className="w-full text-left px-2 py-1.5 text-sm text-primary hover:bg-muted rounded-sm"
                      >
                        + Add More Company
                      </button>
                    </SelectContent>
                  )}
                </Select>

                {/* Show message + add button if no companies */}
                {companyList?.length === 0 && (
                  <div className="flex items-center justify-between text-xs text-red-500 mt-1">
                    <span>Please add company first</span>

                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setIsDialogOpen(true)}
                      className="h-7 px-3 text-xs"
                    >
                      + Add Company
                    </Button>
                  </div>
                )}
              </div>

            </div>

            <DialogFooter className="pt-4 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  loading ||
                  !form?.fullName ||
                  !form?.email ||
                  !form?.contact ||
                  !form?.role ||
                  !form?.companyId ||
                  (mode === false && !form?.password) // <-- password required only if mode is false
                }
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {mode === false ? "Register" : "Update"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdminFormDialog;
