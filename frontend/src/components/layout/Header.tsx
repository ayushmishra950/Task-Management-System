import React, { useState } from "react";
import { Bell, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useLocation, useNavigate } from "react-router-dom";
import { useNotifications } from "@/contexts/NotificationContext";
import { headingManage } from "@/services/allFunctions";
import * as Icons from "lucide-react";
import type { LucideProps } from "lucide-react";
import { useLogoutSuperAdminMutation, useGetSuperAdminQuery} from "@/redux-toolkit/api/superAdmin/auth.api";
import { useGetEmployeeByIdQuery } from "@/redux-toolkit/api/employee/auth.api";
import { useGetByIdAdminQuery } from "@/redux-toolkit/api/admin/auth.api";
import DeleteCard from "../cards/DeleteCard";
import {useLogoutEmployeeMutation} from "@/redux-toolkit/api/employee/auth.api";
import {useLogoutAdminMutation} from "@/redux-toolkit/api/admin/auth.api";
import { socket } from "@/socket/socket";

interface HeaderProps {
  activeSidebar: string;
  taskSubPage: string;
  taskName: string;
  jobName: string;
  jobSubPage: string;
  leadName: string;
  leadSubPage: string;
  onToggleSidebar?: () => void;
}

const Header: React.FC<HeaderProps> = ({
  taskName,
  activeSidebar,
  taskSubPage,
  jobName,
  jobSubPage,
  leadName,
  leadSubPage,
  onToggleSidebar,
}) => {
  const userData = JSON.parse(localStorage.getItem("user"));
  const { toast } = useToast();
  const navigate = useNavigate();
  const { unreadCount } = useNotifications();
  const [logoutDialog, setLogoutDialog] = useState(false);
  const location = useLocation();
  const data = headingManage(location.pathname, userData?.role);
  const IconComponent = Icons[
    data?.icon as keyof typeof Icons
  ] as React.ComponentType<LucideProps>;
  const [logoutSuperAdmin,{ isLoading: logoutSuperAdminLoading }] = useLogoutSuperAdminMutation();
  const [logoutAdmin,{ isLoading: logoutAdminLoading }] = useLogoutAdminMutation();
  const [logoutEmployee,{ isLoading: logoutEmployeeLoading }] = useLogoutEmployeeMutation();

  const loading = logoutSuperAdminLoading || logoutAdminLoading || logoutEmployeeLoading;

  const { data: superAdminData, isLoading } = useGetSuperAdminQuery(
    { id: userData?.id },
    { skip: userData?.role !== "super_admin" },
  );
  const {
    data: adminData,
    isLoading: adminLoading,
    error: adminError,
  } = useGetByIdAdminQuery(
    { id: userData?.id, companyId: userData?.companyId },
    {
      skip: userData?.role !== "admin" || !userData?.id || !userData?.companyId,
    },
  );
  const isEmployee =
    userData?.role === "employee" || userData?.role === "manager";
  const { data: employeeData } = useGetEmployeeByIdQuery(
    { id: userData?.id, companyId: userData?.companyId },
    { skip: !isEmployee || !userData?.id || !userData?.companyId },
  );
  const user = superAdminData?.data || adminData?.data || employeeData?.data;

const handleLogout = async () => {
  try {
    const storedUser = localStorage.getItem("user");

    if (!storedUser) {
      navigate("/login", { replace: true });
      return;
    }
    let user;
    try {
      user = JSON.parse(storedUser);
    } catch (parseError) {
      console.warn("Invalid user data found in localStorage.");

      localStorage.removeItem("user");
      navigate("/login", { replace: true });
      return;
    }

    try {
      let res;

      switch (user?.role) {
        case "super_admin":
          res = await logoutSuperAdmin().unwrap();
          break;

        case "admin":
          res = await logoutAdmin().unwrap();
          break;

        case "employee":
        case "manager":
          res = await logoutEmployee().unwrap();
          break;

        default:
          console.warn("Unknown user role:", user?.role);
          break;
      }

    } catch (apiError: any) {
      console.warn("Logout API failed:", apiError?.data?.message || apiError?.data?.error || apiError?.message);
    }
  } finally {
    localStorage.removeItem("user");
    if(socket.connected) socket.disconnect();
    navigate("/login", { replace: true });
    toast({
      title: "Logged out successfully.",
      description: "You have been logged out of your account.",
    });
  }
};


  return (
    <>
    <DeleteCard
          isOpen={logoutDialog}
          onClose={() => setLogoutDialog(false)}
          onConfirm={handleLogout}
          isDeleting={loading}
          title="Logout Confirmation?"
          message="Are you sure you want to log out of your account? You’ll need to log in again to access your account."
        />
    <header className="sticky top-0 z-20 bg-card border-b border-border px-4 lg:px-6 py-3">
      <div className="flex items-start justify-between">
        <div className="flex items-start justify-start gap-4">
          <button
            onClick={onToggleSidebar}
            className="md:hidden mt-0 p-2 bg-gray-200 dark:bg-gray-700 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center justify-center"
          >
            <Menu className="w-5 h-5 text-gray-800 dark:text-white" />
          </button>

          {/* Back Button */}
          <div className="mt-0">
            <button
              onClick={() => window.history.back()}
              className="p-2 bg-gray-200 dark:bg-gray-700 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center justify-center"
            >
              <Icons.ArrowLeft className="w-5 h-5 text-gray-800 dark:text-white" />
            </button>
          </div>

          {/* Left Side - Titles with Icon */}
          <div className="flex items-stretch gap-2">
            {/* Icon */}
            <div className="flex items-center">
              {IconComponent && (
                <IconComponent className="w-4 h-4 md:w-5 md:h-5" />
              )}
            </div>

            {/* Text Column */}
            <div className="flex flex-col justify-center leading-tight min-w-0">
              <p className="text-sm md:text-base font-semibold truncate">
                {data?.title}
              </p>

              <p className="text-xs md:text-sm text-muted-foreground truncate">
                {data?.description?.length > 25
                  ? data.description.substring(0, 25) + "..."
                  : data.description}
              </p>
            </div>
          </div>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-3">
          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                onClick={() => navigate("/notifications")}
                variant="ghost"
                size="icon"
                className="relative"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span
                    className="absolute -top-1 -right-1 min-w-[18px] h-[18px]
                  rounded-full bg-destructive text-destructive-foreground
                  text-xs flex items-center justify-center px-1"
                  >
                    {unreadCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
          </DropdownMenu>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 px-2">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                  <span className="text-sm font-semibold text-primary-foreground">
                    {user?.fullName?.charAt(0)}
                  </span>
                </div>
                <div className="hidden md:flex flex-col">
                  <span className="font-medium">{user?.fullName}</span>
                  <span className="text-xs text-gray-500">({user?.role})</span>
                </div>
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {/* <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => navigate("/setting")}
              >
                Profile
              </DropdownMenuItem> */}
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => navigate("/setting")}
              >
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive cursor-pointer"
                onClick={() =>{setLogoutDialog(true)}}
              >
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
    </>
  );
};

export default Header;
