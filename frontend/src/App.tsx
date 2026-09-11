import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route, Navigate, useNavigate, BrowserRouter } from "react-router-dom";
import MainLayout from "@/components/layout/MainLayout";
import Login from "@/pages/Login";
import AdminLogin from "@/pages/AdminLogin";
import SuperAdminLogin from "@/pages/SuperAdminLogin";
import Dashboard from "@/pages/Dashboard";
import Users from "@/pages/Users";
import Companies from "@/pages/Companies";
import Departments from "@/pages/Departments";
import Attendance from "@/pages/Attendance"; 
import Leave from "@/pages/Leave";
import Expenses from "@/pages/Expenses";
import Payroll from "@/pages/Payroll";
import Notifications from "@/pages/Notifications";
import Reports from "@/pages/Reports";
import Settings from "@/pages/Settings";
import NotFound from "./pages/NotFound";
import EmployeeDashboard from "@/components/cards/EmployeeCard";
import TaskLayout from "@/task/TaskLayout";
import TaskDashboard from "./task/Task-Dashboard";
import Task from "./task/Task";
import SubTask from "./task/Sub-Task";
import Project from "./task/Project";
import OverdueTask from "./task/OverDue-Task";
import CompletedTask from "./task/Completed-Task";
import ReassignedTask from "./task/Reassigned-Task";
import TaskManager from "./task/TaskManager";
import { NotificationProvider } from "@/contexts/NotificationContext";
import JobDashboard from "./job-portal/Job-Dashboard";
import JobLayout from "./job-portal/JobLayout";
import ApplicationsPage from "@/job-portal/ApplicationsPage";
import CandidatesPage from "./job-portal/CandidatesPage";
import CompaniesPage from "./job-portal/CompaniesPage";
import JobsPage from "./job-portal/JobsPage";
import RevenuePage from "./job-portal/RevenuePage";
import SettingsPage from "./job-portal/SettingsPage";
import RolePage from "./job-portal/RolePage";
import LeadLayout from "@/lead-management/LeadLayout";
import OrderList from "@/lead-management/OrderList";
import LeadList from "@/lead-management/LeadList";
import ProductList from "@/lead-management/ProductList";
import { AuthProvider } from "./contexts/AuthContext";
import ClientLogin from "@/pages/ClientLogin";
import ClientLayout from "@/client-portal/ClientLayout";
import ClientDashboard from "@/client-portal/Client-Dashboard";
import ClientRequests from "@/client-portal/Client-Requests";
import ClientProjects from "@/client-portal/Client-Projects";
import Clients from "@/task/Clients";
import AdminClientRequests from "@/task/Client-Requests";


declare global {
  interface Window {
    reactRouterNavigate?: (path: string) => void;
  }
}
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,          
      refetchOnWindowFocus: false,    
      retry: 1,
    },
  },
});

const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
};

const hasStoredUser = () => {
  const storedUser = getStoredUser();
  return Boolean(storedUser?.id && storedUser?.role);
};

/** Client ka home /client hai, baaki sabka /tasks. */
const getHomePath = () => {
  const storedUser = getStoredUser();

  if (!storedUser?.id || !storedUser?.role) return "/login";

  return storedUser.role === "client" ? "/client" : "/tasks";
};

const getLoginPath = () => (getStoredUser()?.role === "client" ? "/client/login" : "/login");

const ClientRoute = ({ children }: { children: React.ReactNode }) => (
  getStoredUser()?.role === "client" ? children : <Navigate to={getHomePath()} replace />
);

const PublicRoute = ({ children }: { children: React.ReactNode }) => children;

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => (
  hasStoredUser() ? children : <Navigate to={getLoginPath()} replace />
);


const AppRoutes = () => {
  const navigate = useNavigate();
  window.reactRouterNavigate = navigate;
  
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/admin/login" element={<PublicRoute><AdminLogin /></PublicRoute>} />
      <Route path="/superAdmin/login" element={<PublicRoute><SuperAdminLogin /></PublicRoute>} />
      <Route path="/client/login" element={<PublicRoute><ClientLogin /></PublicRoute>} />
      <Route path="/" element={<Navigate to={getHomePath()} replace />} />

      <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/user/:id" element={<EmployeeDashboard />} />
        <Route path="/users" element={<Users />} />
        <Route path="/companies" element={<Companies />} />
        <Route path="/departments" element={<Departments />} />
        {/* <Route path="/tasks" element={<Tasks />} /> */}
        <Route path="/attendances" element={<Attendance />} />
        <Route path="/leaves" element={<Leave />} />
        <Route path="/expenses" element={<Expenses />} />
        <Route path="/payrolls" element={<Payroll />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/setting" element={<Settings />} />



        {/* Task Routes */}
        <Route path="/tasks" element={<TaskLayout />}>
          <Route index element={<TaskDashboard />} />
          <Route path="projects" element={<Project />} />
          <Route path="task" element={<Task />} />
          <Route path="sub-task" element={<SubTask />} />
          <Route path="completed-task" element={<CompletedTask />} />
          <Route path="reassigned-task" element={<ReassignedTask />} />
          <Route path="manager" element={<TaskManager />} />
          <Route path="clients" element={<Clients />} />
          <Route path="client-requests" element={<AdminClientRequests />} />
        </Route>


        {/* Client Portal Routes */}
        <Route path="/client" element={<ClientRoute><ClientLayout /></ClientRoute>}>
          <Route index element={<ClientDashboard />} />
          <Route path="requests" element={<ClientRequests />} />
          <Route path="projects" element={<ClientProjects />} />
        </Route>


        {/* Job Portal Routes */}
        <Route path="/jobs" element={<JobLayout />}>
          <Route index element={<JobDashboard />} />
          <Route path="application" element={<ApplicationsPage />} />
          <Route path="candidates" element={<CandidatesPage />} />
          <Route path="companys" element={<CompaniesPage />} />
          <Route path="jobs" element={<JobsPage />} />
          <Route path="revenues" element={<RevenuePage />} />
          <Route path="setting" element={<SettingsPage />} />
          <Route path="roles" element={<RolePage />} />
        </Route>

        <Route path="/leads" element={<LeadLayout />}>
          <Route index element={<LeadList />} />
          <Route path="orders" element={<OrderList />} />
          <Route path="products" element={<ProductList />} />
        </Route>
      </Route>



      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
     <BrowserRouter basename="/">
    <AuthProvider>
      <NotificationProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <AppRoutes />
        </TooltipProvider>
      </NotificationProvider>
    </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
); 

export default App;
