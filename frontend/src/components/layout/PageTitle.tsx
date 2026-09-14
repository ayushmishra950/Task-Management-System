import React from "react";
import { useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  manager: "Manager",
  employee: "Employee",
  client: "Client",
};

/** Route path -> page ka naam (sidebar ke labels ke hisaab se). */
const PAGE_NAMES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/companies": "Companies",
  "/departments": "Departments",
  "/attendances": "Attendance",
  "/leaves": "Leave",
  "/expenses": "Expenses",
  "/payrolls": "Payroll",
  "/notifications": "Notifications",
  "/reports": "Reports",
  "/setting": "Settings",

  "/tasks": "Task Dashboard",
  "/tasks/projects": "Projects",
  "/tasks/task": "Tasks",
  "/tasks/sub-task": "Sub Tasks",
  "/tasks/completed-task": "Completed Tasks",
  "/tasks/reassigned-task": "Transfer to Other",
  "/tasks/manager": "Task Manager",
  "/tasks/clients": "Clients",
  "/tasks/client-requests": "Client Requests",

  "/client": "Dashboard",
  "/client/requests": "My Requests",
  "/client/projects": "My Projects",

  "/jobs": "Job Dashboard",
  "/jobs/companys": "Companies",
  "/jobs/jobs": "Jobs",
  "/jobs/application": "Applications",
  "/jobs/candidates": "Candidates",
  "/jobs/revenues": "Revenue",
  "/jobs/setting": "Job Settings",
  "/jobs/roles": "Roles",

  "/leads": "Leads",
  "/leads/orders": "Orders",
  "/leads/products": "Products",
};

const getStoredRole = (): string | undefined => {
  try {
    return JSON.parse(localStorage.getItem("user") || "null")?.role;
  } catch {
    return undefined;
  }
};

const getPageName = (pathname: string, role?: string) => {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;

  if (path === "/users") return role === "super_admin" ? "Admins" : "Employees";
  if (path.startsWith("/user/")) return "Employee Details";

  return PAGE_NAMES[path];
};

/** Browser tab ka title: "<Role> | <Current Page>", jaise "Admin | Dashboard". */
const PageTitle: React.FC = () => {
  const { pathname } = useLocation();
  const role = getStoredRole();
  const roleLabel = role ? ROLE_LABELS[role] ?? role : undefined;
  const pageName = getPageName(pathname, role);

  const title = [roleLabel, pageName].filter(Boolean).join(" | ") || "OfficeHub";

  return (
    <Helmet>
      <title>{title}</title>
    </Helmet>
  );
};

export default PageTitle;
