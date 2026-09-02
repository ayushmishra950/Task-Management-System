import express from "express";
import env from "./config/env.ts";
import cors from "cors";
import cookieParser from "cookie-parser";
import {errorHandler} from "./middlewares/error.middleware.ts";

// SuperAdmin Routes
import superAdminRoutes from "./routes/superAdmin/superAdmin.route.ts";
import superAdminCompanyRoutes from "./routes/superAdmin/company.route.ts";
import superAdminAdminRoutes from "./routes/superAdmin/admin.route.ts";


// Admin Routes
import adminAdminRoutes from "./routes/admin/admin.route.ts";
import adminDepartmentRoutes from "./routes/admin/department.route.ts";
import adminEmployeeRoutes from "./routes/admin/employee.route.ts";
import adminManagerRoutes from "./routes/admin/manager.route.ts";
import adminProjectRoutes from "./routes/admin/project.route.ts";
import adminTaskRoutes from "./routes/admin/task.route.ts";
import adminSubTaskRoutes from "./routes/admin/subTask.route.ts";
import adminNotificationRoutes from "./routes/admin/notification.route.ts";

//Employee Routes
import employeeAuthRoutes from "./routes/employee/employee.route.ts";


// Refresh Token Routes
import sessionRefreshRoutes from "./routes/session/session.route.ts";


const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(cors({origin:[env.PRODUCTION_FRONTEND_URL], methods:["POST", "GET", "PUT", "PATCH", "DELETE"], credentials:true}));



  app.use("/api/superAdmin/auth", superAdminRoutes);
  app.use("/api/superAdmin/admin", superAdminAdminRoutes);
  app.use("/api/superAdmin/Company", superAdminCompanyRoutes);


   app.use("/api/admin/auth", adminAdminRoutes);
   app.use("/api/admin/department", adminDepartmentRoutes);
   app.use("/api/admin/employee", adminEmployeeRoutes);
   app.use("/api/admin/manager", adminManagerRoutes);
   app.use("/api/admin/project", adminProjectRoutes);
   app.use("/api/admin/task", adminTaskRoutes);
   app.use("/api/admin/subTask", adminSubTaskRoutes);
   app.use("/api/admin/notification", adminNotificationRoutes);

   
   app.use("/api/employee/auth", employeeAuthRoutes);
   
   app.use("/api/session/token", sessionRefreshRoutes);



app.get("/",(req,res) => {
   res.send({message:`Server is running on PORT- ${env?.PORT}`});
});


app.use(errorHandler);

export default app;
