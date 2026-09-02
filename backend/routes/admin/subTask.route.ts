import {Router} from "express";
import {createSubTask,createSubTaskFromExcel, getSubTask, getByIdSubTask,updateBulkSubTaskData,reassignedSubTask, deleteSubTask,updateSubTask,updateSubTaskStatus} from "../../controllers/admin/subTask.controller.ts";
import { validate } from "../../middlewares/validate.middleware.ts";
import {subTaskValidationSchema,updateSubTaskStatusValidationSchema,deleteSubTaskByIdValidationSchema,updateSubTaskValidationSchema,getSubTaskValidationSchema, getSubTaskByIdValidationSchema} from "../../schemas/subTask.schema.ts";
import {authMiddleware} from "../../middlewares/auth.middleware.ts";
import {accessTeamRoleOnly} from "../../middlewares/role.middleware.ts";
import upload from "../../middlewares/upload.middleware.ts";

const router = Router();

 
router.post("/create",authMiddleware,accessTeamRoleOnly, validate(subTaskValidationSchema), createSubTask);
router.get("/get/:companyId",authMiddleware,accessTeamRoleOnly, validate(getSubTaskValidationSchema), getSubTask);
router.get("/getById/:id/:companyId",authMiddleware,accessTeamRoleOnly, validate(getSubTaskByIdValidationSchema), getByIdSubTask);
router.put("/update/:id/:companyId",authMiddleware,accessTeamRoleOnly, validate(updateSubTaskValidationSchema), updateSubTask);
router.patch("/update/status/:id/:companyId",authMiddleware,accessTeamRoleOnly, validate(updateSubTaskStatusValidationSchema), updateSubTaskStatus);
router.delete("/delete/:companyId",authMiddleware,accessTeamRoleOnly, validate(deleteSubTaskByIdValidationSchema), deleteSubTask);
router.patch("/reassigned/:subTaskId/:newEmployeeId",authMiddleware,accessTeamRoleOnly, reassignedSubTask);
router.post("/create/excel/:createdBy/:employeeId/:taskId",authMiddleware,accessTeamRoleOnly, upload.single("excel"), createSubTaskFromExcel);
router.patch("/update/bulk",authMiddleware,accessTeamRoleOnly, updateBulkSubTaskData);

export default router;