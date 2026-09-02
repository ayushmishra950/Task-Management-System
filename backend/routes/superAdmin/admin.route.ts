import { Router } from "express";
import {registerAdmin,updateAdminStatus, getAllAdmins, deleteAdmin, updateAdmin} from "../../controllers/superAdmin/admin.controller.ts";
import {validate} from "../../middlewares/validate.middleware.ts";
import {authMiddleware} from "../../middlewares/auth.middleware.ts";
import {accessSuperAdminRoleOnly} from "../../middlewares/role.middleware.ts";
import { adminValidationSchema,updateAdminStatusValidationSchema, updateAdminValidationSchema, getAdminByIdValidationSchema } from "../../schemas/admin.schema.ts";

const router = Router();

router.post("/register",authMiddleware, accessSuperAdminRoleOnly, validate(adminValidationSchema) ,registerAdmin);
router.get("/get",authMiddleware, accessSuperAdminRoleOnly ,getAllAdmins);
router.put("/update/:id",authMiddleware, accessSuperAdminRoleOnly,validate(updateAdminValidationSchema) ,updateAdmin);
router.patch("/update/status/:id/:companyId",authMiddleware, accessSuperAdminRoleOnly,validate(updateAdminStatusValidationSchema) ,updateAdminStatus);
router.delete("/delete/:id/:companyId",authMiddleware, accessSuperAdminRoleOnly,validate(getAdminByIdValidationSchema) ,deleteAdmin);

export default router;