import {Router} from "express";
import {createProject, getProject, getByIdProject, deleteProject,getDashboardSummary,getDashboardData,completedAssigment,reassignedhistoryAssignment,updateProject,updateProjectStatus} from "../../controllers/admin/project.controller.ts";
import { validate } from "../../middlewares/validate.middleware.ts";
import {projectValidationSchema,updateProjectStatusValidationSchema,deleteProjectByIdValidationSchema, updateProjectValidationSchema, getProjectValidationSchema, getProjectByIdValidationSchema} from "../../schemas/project.schema.ts";
import {authMiddleware} from "../../middlewares/auth.middleware.ts";
import {accessAdminRoleOnly} from "../../middlewares/role.middleware.ts";
import upload from "../../middlewares/upload.middleware.ts";

const router = Router();
 

router.post("/create",authMiddleware, accessAdminRoleOnly, validate(projectValidationSchema), createProject);
router.get("/get/:companyId",authMiddleware, accessAdminRoleOnly, validate(getProjectValidationSchema), getProject);
router.get("/getById/:id/:companyId",authMiddleware, accessAdminRoleOnly, validate(getProjectByIdValidationSchema), getByIdProject);
router.put("/update/:id/:companyId",authMiddleware, accessAdminRoleOnly, validate(updateProjectValidationSchema), updateProject);
router.patch("/update/status/:id/:companyId",authMiddleware, accessAdminRoleOnly, validate(updateProjectStatusValidationSchema), updateProjectStatus);
router.delete("/delete/:companyId",authMiddleware, accessAdminRoleOnly, validate(deleteProjectByIdValidationSchema), deleteProject);
router.get("/completed/assignment",authMiddleware, completedAssigment);
router.get("/reassigned/history",authMiddleware, reassignedhistoryAssignment);
router.get("/dashboard/data",authMiddleware, getDashboardData);
router.get("/dashboard/summary",authMiddleware, getDashboardSummary);

export default router;