import { Router } from "express";
import {registerEmployee,getEmployee,getEmployeeById,deleteEmployee,updateEmployee,updateEmployeeStatus} from "../../controllers/admin/employee.controller.ts";
import {validate} from "../../middlewares/validate.middleware.ts";
import {employeeValidationSchema, updateEmployeeValidationSchema,getEmployeeValdationSchema, getEmployeeByIdValidationSchema, updateEmployeeStatusValidationSchema} from "../../schemas/user.schema.ts";
import {authMiddleware} from "../../middlewares/auth.middleware.ts";
import {accessAdminRoleOnly} from "../../middlewares/role.middleware.ts";
import upload from "../../middlewares/upload.middleware.ts";

const router = Router();

router.post("/register",authMiddleware, accessAdminRoleOnly,upload.fields([{ name: "profileImage", maxCount: 1 }, { name: "salarySlip", maxCount: 1 }, { name: "aadharCard", maxCount: 1 },{ name: "panCard", maxCount: 1 },{ name: "bankPassBook", maxCount: 1 }]), validate(employeeValidationSchema), registerEmployee);
router.get("/get/:companyId",authMiddleware,validate(getEmployeeValdationSchema), getEmployee);
router.get("/getById/:id/:companyId",authMiddleware, accessAdminRoleOnly,validate(getEmployeeByIdValidationSchema), getEmployeeById);
router.patch("/status/:id/:companyId",authMiddleware, accessAdminRoleOnly,validate(updateEmployeeStatusValidationSchema), updateEmployeeStatus);
router.delete("/delete/:id/:companyId",authMiddleware, accessAdminRoleOnly,validate(getEmployeeByIdValidationSchema), deleteEmployee);
router.put("/update/:id/:companyId",authMiddleware, accessAdminRoleOnly,upload.fields([{ name: "profileImage", maxCount: 1 }, { name: "salarySlip", maxCount: 1 }, { name: "aadharCard", maxCount: 1 },{ name: "panCard", maxCount: 1 },{ name: "bankPassBook", maxCount: 1 }]),validate(updateEmployeeValidationSchema), updateEmployee);

export default router;