import express from "express";
import env from "./config/env.ts";
import cors from "cors";
import cookieParser from "cookie-parser";
import {errorHandler} from "./middlewares/error.middleware.ts";
import path from "path";

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
import adminClientRoutes from "./routes/admin/client.route.ts";
import adminClientRequestRoutes from "./routes/admin/clientRequest.route.ts";

//Employee Routes
import employeeAuthRoutes from "./routes/employee/employee.route.ts";


// Client Routes
import clientAuthRoutes from "./routes/client/client.route.ts";
import clientRequestRoutes from "./routes/client/clientRequest.route.ts";


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
   app.use("/api/admin/client", adminClientRoutes);
   app.use("/api/admin/clientRequest", adminClientRequestRoutes);

   
   app.use("/api/employee/auth", employeeAuthRoutes);

   app.use("/api/client/auth", clientAuthRoutes);
   app.use("/api/client/request", clientRequestRoutes);
   
   app.use("/api/session/token", sessionRefreshRoutes);


// =========================
// FRONTEND BUILD
// =========================

const frontendPath = path.join(process.cwd(), "./build");

app.use(express.static(frontendPath));


// =========================
// FRONTEND SPA FALLBACK
// =========================

// React SPA fallback
app.get("/{*splat}", (req, res, next) => {
  if (req.path.startsWith("/api/")) {
    return next();
  }

  if (req.path.startsWith("/socket.io/")) {
    return next();
  }

  res.sendFile(path.join(frontendPath, "index.html"));
});



app.use(errorHandler);

export default app;
