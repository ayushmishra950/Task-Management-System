
import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { LogOut, Menu, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SidebarProps, navItems, taskSubMenu, JobSubMenu, LeadSubMenu } from "@/services/allFunctions";
import { createPortal } from 'react-dom';
import {useLogoutSuperAdminMutation, useGetSuperAdminQuery} from "@/redux-toolkit/api/superAdmin/auth.api";
import {useGetByIdAdminQuery} from "@/redux-toolkit/api/admin/auth.api";
import { useToast } from '@/hooks/use-toast';
import {useGetCompanyByIdQuery} from "@/redux-toolkit/api/superAdmin/company.api";
import {useGetEmployeeByIdQuery} from "@/redux-toolkit/api/employee/auth.api";
import DeleteCard from "../cards/DeleteCard";
import {useLogoutEmployeeMutation} from "@/redux-toolkit/api/employee/auth.api";
import {useLogoutAdminMutation} from "@/redux-toolkit/api/admin/auth.api";
import { socket } from '@/socket/socket';

const Sidebar: React.FC<SidebarProps> = ({ setTaskName, setJobName, isOpen, onToggle, setActiveSidebar, setTaskSubPage, setJobSubPage, setLeadSubPage, setLeadName }) => {
  const  userData  = JSON.parse(localStorage.getItem("user"));
  const navigate = useNavigate();
  const {toast} = useToast();
  const location = useLocation();
  const sidebarRef = useRef<HTMLDivElement>(null);
  const jobDropdownRef = useRef<HTMLDivElement>(null);
  const leadDropdownRef = useRef<HTMLDivElement>(null);
    const [logoutDialog, setLogoutDialog] = useState(false);
  // Default sidebar open
  const [isLocalOpen, setLocalOpen] = useState<boolean>(isOpen);

  // Submenus
  const [showTaskSubMenu, setShowTaskSubMenu] = useState(false);
  const [showJobSubMenu, setShowJobSubMenu] = useState(false);
  const [showLeadSubMenu, setShowLeadSubMenu] = useState(false);
  const [dropdownPos, setDropdownPos] = useState<{ top: number, left: number }>({ top: 0, left: 0 });
  const [jobDropdownPos, setJobDropdownPos] = useState<{ top: number, left: number }>({ top: 0, left: 0 });
  const [leadDropdownPos, setLeadDropdownPos] = useState<{ top: number, left: number }>({ top: 0, left: 0 });
 const {data} = useGetCompanyByIdQuery({id:userData?.companyId}, {skip:!userData?.companyId});
     const company = data?.data;
  
 const [logoutSuperAdmin,{ isLoading: logoutSuperAdminLoading }] = useLogoutSuperAdminMutation();
   const [logoutAdmin,{ isLoading: logoutAdminLoading }] = useLogoutAdminMutation();
   const [logoutEmployee,{ isLoading: logoutEmployeeLoading }] = useLogoutEmployeeMutation();
 
   const loading = logoutSuperAdminLoading || logoutAdminLoading || logoutEmployeeLoading;

  const {data:superAdminData, isLoading:superAdminLoading, error:superAdminError} = useGetSuperAdminQuery({id:userData?.id}, {skip:!userData?.id || userData?.role !== "super_admin"});
    const {data:adminData, isLoading:adminLoading, error:adminError} = useGetByIdAdminQuery(
      {id:userData?.id, companyId:userData?.companyId},
      {skip:userData?.role !== "admin" || !userData?.id || !userData?.companyId}
    );
    const isEmployee = userData?.role === "employee" || userData?.role === "manager";
    const {data:employeeData, error} = useGetEmployeeByIdQuery(
      {id:userData?.id, companyId:userData?.companyId},
      {skip:!isEmployee || !userData?.id || !userData?.companyId}
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
    // Phir socket disconnect karo
  if (socket.connected) socket.disconnect();
    navigate("/login", { replace: true });
    toast({
      title: "Logged out successfully.",
      description: "You have been logged out of your account.",
    });
  }
};

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const isMobile = window.innerWidth <= 768;

      if (!isMobile) return;

      const target = event.target as Element;

      // Ignore if clicking inside a dropdown portal
      if (target.closest('.dropdown-portal')) {
        return;
      }

      if (sidebarRef.current && !sidebarRef.current.contains(target as Node)) {
        if (isOpen) onToggle();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleTaskMouseEnter = (e: React.MouseEvent<HTMLLIElement, MouseEvent>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    // setDropdownPos({ top: rect.top, left: rect.right });
    setDropdownPos({
      top: rect.top,
      left: rect.right
    });
    setShowTaskSubMenu(true);
  };

  const handleTaskMouseLeave = () => {
    setShowTaskSubMenu(false);
  };

  const handleJobMouseEnter = (e: React.MouseEvent<HTMLLIElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();

    setShowJobSubMenu(true);

    setTimeout(() => {
      if (jobDropdownRef.current) {
        const dropdownHeight = jobDropdownRef.current.offsetHeight;
        const spaceBelow = window.innerHeight - rect.top;

        let topPosition = rect.top;

        if (spaceBelow < dropdownHeight) {
          topPosition = rect.bottom - dropdownHeight;
        }

        setJobDropdownPos({
          top: topPosition,
          left: rect.right
        });
      }
    }, 0);
  };


  const handleJobMouseLeave = () => setShowJobSubMenu(false);


  const handleLeadMouseEnter = (e: React.MouseEvent<HTMLLIElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();

    setShowLeadSubMenu(true);

    setTimeout(() => {
      if (leadDropdownRef.current) {
        const dropdownHeight = leadDropdownRef.current.offsetHeight;
        const spaceBelow = window.innerHeight - rect.top;

        let topPosition = rect.top;

        if (spaceBelow < dropdownHeight) {
          topPosition = rect.bottom - dropdownHeight;
        }

        setLeadDropdownPos({
          top: topPosition,
          left: rect.right
        });
      }
    }, 0);
  };

  const handleLeadMouseLeave = () => setShowLeadSubMenu(false);


  const toggleSidebar = () => {
    setLocalOpen(prev => !prev);
    onToggle();
  };
  const filteredNavItems = navItems.filter(
    (item) => user && item.roles.includes(user.role)
  );
const effectiveRole = user?.role === "admin" ? "admin" :
    (user?.role === "manager" && Array.isArray(user?.managedDepartments) && user.managedDepartments.length > 0) ? "manager" : "employee";


  const filteredTaskSubMenu = taskSubMenu.filter(sub => sub.roles.includes(effectiveRole));
  const filteredLeadSubMenu = LeadSubMenu.filter(sub => sub.roles.includes(effectiveRole));

  const getRoleBadge = (role: string) => {
    const roleLabels = {
      super_admin: 'Super Admin',
      admin: 'Admin',
      employee: (user?.role === "manager" && user?.managedDepartments?.length > 0) ? `Department Manager(${user?.department?.name})` : `Employee (${user?.department?.name})`,
    };
    return roleLabels[role as keyof typeof roleLabels] || role;
  };

  useEffect(() => {
    if (!isOpen) {
      setShowTaskSubMenu(false);
      setShowJobSubMenu(false);
      setShowLeadSubMenu(false);
    }
  }, [isOpen]);

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

      <aside
        ref={sidebarRef}
        className={cn(
          "fixed top-0 left-0 h-full z-50 flex flex-col bg-sidebar shadow-lg transition-all duration-300 ease-in-out",
          isOpen ? "w-64" : "w-16 max-md:-translate-x-full"
        )}
      >
        {/* Top Menu Toggle */}
        <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
          {isOpen && (
            <div className='flex items-center justify-between gap-2'>
              <img className='w-9 h-9 rounded'
                src={company?.logo || "https://imgs.search.brave.com/fyjiYJDWqHKM10ialxrNUXefvIkntePcZxIe4bW0UkY/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly93MC5w/ZWFrcHguY29tL3dh/bGxwYXBlci82MDAv/NzA3L0hELXdhbGxw/YXBlci1zLWctbmFh/bS1rZS1nb2xkLXMt/Zy1nb2xkLXNnLWxl/dHRlci1zZy5qcGc"} />
              <h1 className="font-bold text-lg text-sidebar-foreground truncate">
              {(() => {
  const name = company?.name || 'Super Admin';
  const maxLength = 'Super Admin'.length;

  return name.length > maxLength
    ? `${name.slice(0, maxLength)}...`
    : name;
})()}

              </h1>
            </div>
          )}
          <button
            onClick={toggleSidebar}
            className="p-1 rounded hover:bg-sidebar-accent/20"
          >
            <Menu className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* User Info */}
        {user && (
          <div className={cn("p-4 border-b border-sidebar-border transition-all", !isOpen && "justify-center flex items-center")}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-sidebar-accent flex items-center justify-center">
                <span className="font-semibold text-sidebar-accent-foreground">
                  {user.username?.charAt(0) || user.fullName?.charAt(0)}
                </span>
              </div>
              {isOpen && (
                <div>
                  <p className="text-sm text-white font-medium truncate">{user.username || user.fullName}</p>
                  <p className="text-xs text-sidebar-primary">{getRoleBadge(user.role)}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 relative">
          <ul className="space-y-1 px-2">
            {filteredNavItems.map(item => {
              const isTasksActive = location.pathname.startsWith("/tasks");
              const isJobPortalActive = location.pathname.startsWith("/jobs");
              const isLeadPortalActive = location.pathname.startsWith("/leads");
              const isThisActive = location.pathname === item.path;

              const renderItem = (itemLabel: string) => (
                <NavLink
                  to={item.path}
                  onClick={() => { setTaskName(""); setJobName(""); setLeadName(""); setActiveSidebar(item.label) }}
                  className={cn(
                    "sidebar-item flex items-center justify-between p-2",
                    (itemLabel === "Tasks" && isTasksActive) ||
                      (itemLabel === "Job-Portal" && isJobPortalActive)
                      || (itemLabel === "Lead-Portal" && isLeadPortalActive) || isThisActive
                      ? "bg-blue-600 text-white font-semibold"
                      : "",
                    !isOpen && "justify-center"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    {isOpen && <span>{item.label === "Employees" ? user?.role === "super_admin" ? "Admins" : "Employees" : item?.label}</span>}
                  </div>

                  {/* Arrow only for Tasks & Job-Portal */}
                  {isOpen && (item.label === "Tasks" || item.label === "Job-Portal" || item.label === "Lead-Portal") && (
                    <ChevronRight
                      className={cn(
                        "w-4 h-4 transition-transform duration-200",
                        item.label === "Tasks" && showTaskSubMenu && "rotate-90",
                        item.label === "Job-Portal" && showJobSubMenu && "rotate-90",
                        item.label === "Lead-Portal" && showLeadSubMenu && "rotate-90"
                      )}
                    />
                  )}
                </NavLink>
              );


              // Tasks Dropdown
              if (item.label === "Tasks") {
                return (
                  <li
                    key={item.path}
                    onMouseEnter={(e) => isOpen && handleTaskMouseEnter(e)}
                    onMouseLeave={handleTaskMouseLeave}  >
                    {renderItem(item.label)}

                    {showTaskSubMenu && createPortal(
                      <div
                        style={{ top: dropdownPos.top, left: dropdownPos.left }}
                        className="fixed w-48 bg-sidebar shadow-lg border border-sidebar-border z-50 dropdown-portal"
                        onMouseEnter={() => setShowTaskSubMenu(true)}
                        onMouseLeave={handleTaskMouseLeave}
                      >
                        <ul>
                          {filteredTaskSubMenu.map(sub => (
                            <li key={sub.path}>
                              <NavLink
                                to={sub.path}
                                onClick={() => {
                                  setTaskName("Tasks");
                                  setTaskSubPage(sub?.label);
                                  if (window.innerWidth <= 768 && isOpen) onToggle();
                                }}
                                end={sub.path === "/tasks"} // only for dashboard
                                className={({ isActive }) => cn(
                                  "block px-4 py-2 text-sm text-white hover:bg-sidebar-accent",
                                  isActive && "bg-sidebar-accent font-medium"
                                )}
                              >
                                {sub.label}
                              </NavLink>
                            </li>
                          ))}
                        </ul>
                      </div>,
                      document.body
                    )}

                  </li>
                );
              }

              // Job Dropdown
              if (item.label === "Job-Portal") {
                return (
                  <li
                    key={item.path}
                    className="relative"
                    onMouseEnter={(e) => isOpen && handleJobMouseEnter(e)}
                    onMouseLeave={handleJobMouseLeave}
                  >
                    {renderItem(item.label)}

                    {isOpen && showJobSubMenu && createPortal(
                      <div
                        ref={jobDropdownRef}
                        style={{ top: jobDropdownPos.top, left: jobDropdownPos.left }}
                        className="fixed w-48 bg-sidebar shadow-lg border border-sidebar-border z-50 dropdown-portal"
                        onMouseEnter={() => setShowJobSubMenu(true)}
                        onMouseLeave={handleJobMouseLeave}
                      >
                        <ul>
                          {JobSubMenu.map(sub => (
                            <li key={sub.path}>
                              <NavLink
                                to={sub.path}
                                end={sub.path === "/jobs"} // only for dashboard
                                onClick={() => {
                                  setJobSubPage(sub?.label);
                                  setJobName("Job-Portal");
                                  if (window.innerWidth <= 768 && isOpen) onToggle();
                                }}
                                className={({ isActive }) => cn(
                                  "block px-4 py-2 text-sm text-white hover:bg-sidebar-accent",
                                  isActive && "bg-sidebar-accent font-medium"
                                )}
                              >
                                {sub.label}
                              </NavLink>
                            </li>
                          ))}
                        </ul>
                      </div>,
                      document.body
                    )}
                  </li>
                );
              }

              if (item.label === "Lead-Portal") {
                return (
                  <li
                    key={item.path}
                    className="relative"
                    onMouseEnter={(e) => isOpen && handleLeadMouseEnter(e)}
                    onMouseLeave={handleLeadMouseLeave}
                  >
                    {renderItem(item.label)}

                    {isOpen && showLeadSubMenu && createPortal(
                      <div
                        ref={leadDropdownRef}
                        style={{ top: leadDropdownPos.top, left: leadDropdownPos.left }}
                        className="fixed w-48 bg-sidebar shadow-lg border border-sidebar-border z-50 dropdown-portal"
                        onMouseEnter={() => setShowLeadSubMenu(true)}
                        onMouseLeave={handleLeadMouseLeave}
                      >
                        <ul>
                          {LeadSubMenu.map(sub => (
                            <li key={sub.path}>
                              <NavLink
                                to={sub.path}
                                end={sub.path === "/leads"} // only for dashboard
                                onClick={() => {
                                  setLeadSubPage(sub?.label);
                                  setLeadName("Lead-Portal");
                                  if (window.innerWidth <= 768 && isOpen) onToggle();
                                }}
                                className={({ isActive }) => cn(
                                  "block px-4 py-2 text-sm text-white hover:bg-sidebar-accent",
                                  isActive && "bg-sidebar-accent font-medium"
                                )}
                              >
                                {sub.label}
                              </NavLink>
                            </li>
                          ))}
                        </ul>
                      </div>,
                      document.body
                    )}
                  </li>
                );
              }


              return <li key={item.path}>{renderItem(item.label)}</li>;
            })}
          </ul>
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-sidebar-border mt-auto" onClick={() => {setLogoutDialog(true)}}>
          <button
            onClick={() => {setLogoutDialog(true)}}
            className={cn(
              "sidebar-item w-full flex items-center gap-3 text-destructive hover:bg-destructive/10",
              !isOpen && "justify-center"
            )}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {isOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
