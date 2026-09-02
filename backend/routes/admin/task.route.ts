import {Router} from "express";
import {createTask, getTask,createTaskFromExcel, getByIdTask,reassignTask,updateBulkTaskData, deleteTask,updateTask,updateTaskStatus} from "../../controllers/admin/task.controller.ts";
import { validate } from "../../middlewares/validate.middleware.ts";
import {taskValidationSchema,updateTaskStatusValidationSchema,deleteTaskByIdValidationSchema, updateTaskValidationSchema,getTaskValidationSchema, getTaskByIdValidationSchema} from "../../schemas/task.schema.ts";
import {authMiddleware} from "../../middlewares/auth.middleware.ts";
import {accessTeamRoleOnly} from "../../middlewares/role.middleware.ts";
import upload from "../../middlewares/upload.middleware.ts";

const router = Router();
 

router.post("/create",authMiddleware,accessTeamRoleOnly, validate(taskValidationSchema), createTask);
router.get("/get/:companyId",authMiddleware,accessTeamRoleOnly, validate(getTaskValidationSchema), getTask);
router.get("/getById/:id/:companyId",authMiddleware,accessTeamRoleOnly, validate(getTaskByIdValidationSchema), getByIdTask);
router.put("/update/:id/:companyId",authMiddleware,accessTeamRoleOnly, validate(updateTaskValidationSchema), updateTask);
router.patch("/update/status/:id/:companyId",authMiddleware,accessTeamRoleOnly, validate(updateTaskStatusValidationSchema), updateTaskStatus);
router.delete("/delete/:companyId",authMiddleware,accessTeamRoleOnly, validate(deleteTaskByIdValidationSchema), deleteTask);
router.patch("/reassigned/:taskId/:newManagerId",authMiddleware,accessTeamRoleOnly, reassignTask);
router.post("/create/excel/:createdBy/:managerId/:projectId",authMiddleware,accessTeamRoleOnly, upload.single("excel"), createTaskFromExcel);
router.patch("/update/bulk",authMiddleware,accessTeamRoleOnly, updateBulkTaskData);

export default router;