import { Router } from "express";
import {createManager,getManager,deleteManager,updateManager} from "../../controllers/admin/manager.controller.ts";
import { validate } from "../../middlewares/validate.middleware.ts";
import {managerValidationSchema, updateManagerValidationSchema, getManagerValidationSchema} from "../../schemas/manager.schema.ts";
import {authMiddleware} from "../../middlewares/auth.middleware.ts";
import {accessAdminRoleOnly} from "../../middlewares/role.middleware.ts";

const router = Router();

router.post("/create/:id/:companyId/:departmentId",authMiddleware, accessAdminRoleOnly, validate(managerValidationSchema), createManager);
router.get("/get/:companyId",authMiddleware, accessAdminRoleOnly, validate(getManagerValidationSchema), getManager);
router.put("/update/:id/:companyId/:oldDepartmentId/:newDepartmentId",authMiddleware, accessAdminRoleOnly, validate(updateManagerValidationSchema), updateManager);
router.delete("/delete/:id/:companyId/:departmentId",authMiddleware, accessAdminRoleOnly, validate(managerValidationSchema), deleteManager);

export default router;