import { Router } from "express";
import {loginEmployee,logoutEmployee, getEmployeeById} from "../../controllers/employee/employee.controller.ts";
import { loginEmployeeValidationSchema } from "../../schemas/user.schema.ts";
import {validate} from "../../middlewares/validate.middleware.ts";
import {authMiddleware} from "../../middlewares/auth.middleware.ts";
import {accessEmployeeRoleOnly} from "../../middlewares/role.middleware.ts";
import { getEmployeeByIdValidationSchema} from "../../schemas/user.schema.ts";


const router = Router();

router.post("/login",validate(loginEmployeeValidationSchema) ,loginEmployee);
router.put("/logout", authMiddleware, accessEmployeeRoleOnly ,logoutEmployee);
router.get("/getById/:id/:companyId", authMiddleware, accessEmployeeRoleOnly, validate(getEmployeeByIdValidationSchema) ,getEmployeeById);


export default router;
