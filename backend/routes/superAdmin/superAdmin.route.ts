import {registerSuperAdmin, getSuperAdmin,loginSuperAdmin,logoutSuperAdmin, deleteSuperAdmin, updateSuperAdmin} from "../../controllers/superAdmin/superAdmin.controller.ts";
import { Router } from "express";
import { superAdminValidationSchema,loginSuperAdminValidationSchema, updateSuperAdminValidationSchema,getSuperAdminValidationSchema } from "../../schemas/superAdmin.schema.ts";
import {validate} from "../../middlewares/validate.middleware.ts";
import {accessSuperAdminRoleOnly} from "../../middlewares/role.middleware.ts";
import {authMiddleware} from "../../middlewares/auth.middleware.ts";

const router = Router();

router.post("/register",validate(superAdminValidationSchema), registerSuperAdmin);
router.post("/login",validate(loginSuperAdminValidationSchema), loginSuperAdmin);
router.get("/get/:id",authMiddleware,accessSuperAdminRoleOnly,validate(getSuperAdminValidationSchema), getSuperAdmin);
router.delete("/delete/:id",authMiddleware,accessSuperAdminRoleOnly,validate(getSuperAdminValidationSchema), deleteSuperAdmin);
router.put("/update/:id",authMiddleware,accessSuperAdminRoleOnly,validate(updateSuperAdminValidationSchema), updateSuperAdmin);
router.put("/logout",authMiddleware,accessSuperAdminRoleOnly, logoutSuperAdmin);
 
export default router;
