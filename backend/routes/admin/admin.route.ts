import { Router } from "express";
import {registerAdmin,loginAdmin,logoutAdmin, getAdminById, deleteAdmin, updateAdmin} from "../../controllers/admin/admin.controller.ts";
import {validate} from "../../middlewares/validate.middleware.ts";
import { adminValidationSchema, updateAdminValidationSchema, getAdminByIdValidationSchema, loginAdminValidationSchema } from "../../schemas/admin.schema.ts";
import {authMiddleware} from "../../middlewares/auth.middleware.ts";
import {accessAdminRoleOnly} from "../../middlewares/role.middleware.ts";
import upload from "../../middlewares/upload.middleware.ts";

const router = Router();

router.post("/register",validate(adminValidationSchema) ,registerAdmin);
router.post("/login",validate(loginAdminValidationSchema) ,loginAdmin);
router.get("/getById/:id/:companyId",authMiddleware, accessAdminRoleOnly, validate(getAdminByIdValidationSchema) ,getAdminById);
router.delete("/delete/:id/:companyId",authMiddleware, accessAdminRoleOnly,validate(getAdminByIdValidationSchema) ,deleteAdmin);
router.put("/update/:id/:companyId",authMiddleware, accessAdminRoleOnly,validate(updateAdminValidationSchema) ,updateAdmin);
router.put("/logout", authMiddleware, accessAdminRoleOnly ,logoutAdmin);
 
export default router;