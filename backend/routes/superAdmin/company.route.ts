import { Router } from "express";
import {createCompany, getCompany, getByIdCompany, deleteCompany, updateCompany} from "../../controllers/superAdmin/company.controller.ts";
import {companyValidationSchema, updateCompanyValidationSchema, getByIdCompanyValidationSchema} from "../../schemas/company.schema.ts";
import { validate } from "../../middlewares/validate.middleware.ts";
import upload from "../../middlewares/upload.middleware.ts";
import {accessSuperAdminRoleOnly} from "../../middlewares/role.middleware.ts";
import {authMiddleware} from "../../middlewares/auth.middleware.ts";

const router = Router();
 

router.post("/register",authMiddleware,accessSuperAdminRoleOnly,upload.fields([{ name: "logo", maxCount: 1 }]),validate(companyValidationSchema), createCompany);
router.get("/get", authMiddleware,accessSuperAdminRoleOnly,getCompany);
router.get("/getById/:id",authMiddleware,validate(getByIdCompanyValidationSchema), getByIdCompany);
router.delete("/delete/:id",authMiddleware,accessSuperAdminRoleOnly,validate(getByIdCompanyValidationSchema), deleteCompany);
router.put("/update/:id",authMiddleware, accessSuperAdminRoleOnly, upload.fields([{ name: "logo", maxCount: 1 }]), validate(updateCompanyValidationSchema), updateCompany);

export default router;