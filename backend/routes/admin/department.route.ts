import { Router } from "express";
import {createDepartment,getDepartment,updateDepartment,deleteDepartment} from "../../controllers/admin/department.controller.ts";
import { validate } from "../../middlewares/validate.middleware.ts";
import {departmentValidationSchema, updateDepartmentValidationSchema,getDepartmentValidationSchema, deleteDepartmentValidationSchema,} from "../../schemas/department.schema.ts";
import {authMiddleware} from "../../middlewares/auth.middleware.ts";
import {accessAdminRoleOnly} from "../../middlewares/role.middleware.ts";

const router = Router();

router.post("/create",authMiddleware, accessAdminRoleOnly, validate(departmentValidationSchema), createDepartment);
router.get("/get/:companyId",authMiddleware, accessAdminRoleOnly, validate(getDepartmentValidationSchema), getDepartment);
router.put("/update/:id/:companyId",authMiddleware, accessAdminRoleOnly, validate(updateDepartmentValidationSchema), updateDepartment);
router.delete("/delete/:id/:companyId",authMiddleware, accessAdminRoleOnly, validate(deleteDepartmentValidationSchema), deleteDepartment);
 
export default router;