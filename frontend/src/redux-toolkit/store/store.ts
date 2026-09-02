import { configureStore } from "@reduxjs/toolkit";
import companyReducer from "../slice/allPage/companySlice";
import userReducer from "../slice/allPage/userSlice";
import settingReducer from "../slice/allPage/settingSlice";
import attendanceReducer from "../slice/allPage/attendanceSlice";
import leaveReducer from "../slice/allPage/leaveSlice";
import payrollReducer from "../slice/allPage/payrollSlice";
import departmentReducer from "../slice/allPage/departmentSlice";
import expenseReducer from "../slice/allPage/expenseSlice";
import reportReducer from "../slice/allPage/reportSlice";
import dashboardReducer from "../slice/allPage/dashboardSlice";
import loginUserReducer from "../slice/allPage/loginUserSlice";


// Only Task Reducers 
import projectReducer from "../slice/task/projectSlice";
import managerReducer from "../slice/task/taskManagerSlice";
import overdueTaskReducer from "../slice/task/overdueTaskSlice";
import taskReducer from "../slice/task/taskSlice";
import subTaskReducer from "../slice/task/subTaskSlice";
import taskDashboardReducer from "../slice/task/dashboardSlice";

// job-portal k liye
import roleReducer from "../slice/job-portal/roleSlice";
import candidateReducer from "../slice/job-portal/candidateSlice";
import companyJobReducer from "../slice/job-portal/companyJobSlice";
import jobReducer from "../slice/job-portal/jobSlice";
import applicationReducer from "../slice/job-portal/applicationSlice";
import dashboardJobReducer from "../slice/job-portal/dashboardSlice";
// lead-portal k liye
import leadReducer from "../slice/lead-portal/leadSlice";
import productReducer from "../slice/lead-portal/productSlice";


// super Admin api
import {companyApi} from "../api/superAdmin/company.api";
import {superAdminauthApi} from "../api/superAdmin/auth.api";
import {superAdmin_admin_Api} from "../api/superAdmin/admin.api";

// Admin Api
import {admin_Auth_Api} from "../api/admin/auth.api";
import {admin_Department_Api} from "../api/admin/department.api";
import {admin_Employee_Api} from "../api/admin/employee.api";
import {admin_Project_Api} from "../api/admin/project.api";
import { admin_Manager_Api } from "../api/admin/manager.api";
import {admin_Task_Api} from "../api/admin/task.api";
import {admin_SubTask_Api} from "../api/admin/subTask.api";
import {admin_Notification_Api} from "../api/admin/notification.api";


// Employee Api
import {employee_Auth_Api} from "../api/employee/auth.api";

export const store = configureStore({
    reducer: {
        company: companyReducer,
        user: userReducer,
        setting: settingReducer,
        attendance: attendanceReducer,
        leave: leaveReducer,
        payroll: payrollReducer,
        department: departmentReducer,
        expense: expenseReducer,
        report: reportReducer,
        dashboard: dashboardReducer,
        loginUser:loginUserReducer,
        // Task Reducers
        project: projectReducer,
        manager: managerReducer,
        overdueTask: overdueTaskReducer,
        task: taskReducer,
        subTask: subTaskReducer,
        taskDashboard: taskDashboardReducer,

        // job-portal k liye
        role: roleReducer,
        candidate: candidateReducer,
        companyJob: companyJobReducer,
        job: jobReducer, 
        application: applicationReducer, 
        dashboardJob: dashboardJobReducer,

        // lead-portal k liye
        lead: leadReducer, 
        product: productReducer,





        [companyApi.reducerPath] : companyApi.reducer,
        [superAdminauthApi.reducerPath] : superAdminauthApi.reducer,
        [superAdmin_admin_Api.reducerPath]: superAdmin_admin_Api.reducer,
        
        [admin_Auth_Api.reducerPath]:admin_Auth_Api.reducer,
        [admin_Department_Api.reducerPath]: admin_Department_Api.reducer,
        [admin_Employee_Api.reducerPath]:admin_Employee_Api.reducer,
        [admin_Project_Api.reducerPath]:admin_Project_Api.reducer,
        [admin_Manager_Api.reducerPath]:admin_Manager_Api.reducer,
        [admin_Task_Api.reducerPath]:admin_Task_Api.reducer,
        [admin_SubTask_Api.reducerPath]:admin_SubTask_Api.reducer,
        [admin_Notification_Api.reducerPath]:admin_Notification_Api.reducer,
        [employee_Auth_Api.reducerPath]: employee_Auth_Api.reducer,
    
    },

    middleware : (getDefaultMiddleware) => (
        getDefaultMiddleware().concat(
            companyApi.middleware,
            superAdminauthApi.middleware,
            superAdmin_admin_Api.middleware,

            admin_Auth_Api.middleware,
            admin_Department_Api.middleware,
            admin_Employee_Api.middleware,
            admin_Project_Api.middleware,
            admin_Manager_Api.middleware,
            admin_Task_Api.middleware,
            admin_SubTask_Api.middleware,
            admin_Notification_Api.middleware,

            employee_Auth_Api.middleware,
        
        )
    )
});



export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;