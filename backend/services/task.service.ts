import * as XLSX from "xlsx";
import mongoose from "mongoose";
import Task from "../models/task.model.ts";
import SubTask from "../models/subTask.model.ts";
import TaskAssignmentHistory from "../models/task.history.model.ts";
import {createTaskSocket, updateTaskSocket, reassignTaskSocket, deleteTaskSocket} from "../sockets/task.socket.ts";


interface GetTaskDataResponse {
  success: boolean;
  message?: string;
  data?: any[];
}

export const getTaskData = async ({ user, projectId}: any): Promise<GetTaskDataResponse> => {
  try {
    const userId = user?.id;
    const companyId = user?.companyId;
    const role = user?.role;

    if (!userId || !companyId || !role) return { success: false, message: "User information is missing."}

    let query: any = { companyId };

  
    if (role === "admin") {
      query = { companyId };
    }

  
    if (role === "manager") {
      query = { companyId, managerId: userId };
    }

    if (projectId) {
      query.projectId = projectId;
    }

    const tasks = await Task.find(query).populate("projectId", "name")
      .populate({path:"managerId", select:"fullName email department", populate:{path:"department", select:"name"}})
      .populate({path:"createdBy", select:"fullName email role"})
      .sort({ createdAt: -1 }).lean();


    return { success: true, data: tasks};
  } catch (error: any) {
    return { success: false, message: error?.message || "Something Went Wrong."};
  }
};



export const getTaskByIdData = async ({ taskId, companyId}: any) => {
  try {
    if (!taskId) return { success: false, message: "Task ID is required."};

    if (!companyId) return { success: false, message: "Company ID is required." };

  
    if (!mongoose.Types.ObjectId.isValid(taskId)) return { success: false, message: "Invalid Task ID."};

    if (!mongoose.Types.ObjectId.isValid(companyId)) return { success: false, message: "Invalid Company ID."};

  
    const task = await Task.findOne({ _id: taskId, companyId: companyId})
      .populate("managerId", "fullName email")
      .populate("createdBy", "fullName email")
      .populate("projectId", "name")
      .lean();

    if (!task) return { success: false, message: "Task Not Found."};

    const subTasks = await SubTask.find({ taskId: task._id, companyId: companyId})
      .populate({path:"employeeId", select:"fullName email role department", populate:{path:"department", select:"name"}})
      .populate("createdBy", "fullName email")
      .lean();

    return { success: true, message: "Task data fetched successfully.", data: { task, subTasks, }};
  } catch (error: any) {
    return { success: false, message: error?.message || "Something Went Wrong."};
  }
};










export const handleReassignedTask = async ({ user, taskId, newManagerId, startDate, endDate, reason}: any) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const task = await Task.findOne({_id: taskId, companyId: user?.companyId}).session(session);

    if (!task) {
      await session.abortTransaction();

      return {success: false, message: "Task Not Found."};
    }

    const oldManagerId = task.managerId;

    if (oldManagerId.toString() === newManagerId.toString()) {
      await session.abortTransaction();

      return { success: false, message: "Task is already assigned to this manager."};
    }

    await TaskAssignmentHistory.create([{taskId: task._id,projectId: task.projectId,companyId: task.companyId,fromManagerId: oldManagerId,toManagerId: newManagerId,reassignedBy: user?.id,reason: reason || undefined,reassignedAt: new Date()}],{ session });

    task.managerId = new mongoose.Types.ObjectId(newManagerId);

    if (startDate) {
      task.startDate = new Date(startDate);
    }

    if (endDate) {
      task.endDate = new Date(endDate);
    }

    await task.save({ session });

    // 7. Dono operations successful
    await session.commitTransaction();

    // 🔄 Send reassignment notifications
    await reassignTaskSocket({user,fromManagerId: oldManagerId,toManagerId: newManagerId,task});

    return {success: true,message: "Task reassigned successfully.",data: {taskId: task._id,fromManagerId: oldManagerId,toManagerId: newManagerId}};

  } catch (error: any) {
    await session.abortTransaction();

    return { success: false, message: error?.message || "Something Went Wrong."};
  } finally {
    await session.endSession();
  }
};






export const handleUpdateBulkTaskData = async ({ user, taskDatas}: {user: any;taskDatas: any[]}) => {
  try {
    if (!user?.id || !user?.companyId) return { success: false, message: "Unauthorized."};

    if (!Array.isArray(taskDatas) || taskDatas.length === 0) return { success: false, message: "Task data is required."};

    const bulkOperations = taskDatas.filter((task) => task?._id).map((task) => {
        const updateData: Record<string, any> = {};

        if (task.name !== undefined) {
          updateData.name = task.name;
        }

        if (task.url !== undefined) {
          updateData.url = task.url;
        }

        if (task.managerId !== undefined) {
          updateData.managerId = task.managerId;
        }


        if (task.priority !== undefined) {
          updateData.priority = task.priority;
        }

        if (task.status !== undefined) {
          updateData.status = task.status;
        }

        if (task.description !== undefined) {
          updateData.description = task.description;
        }

        if (task.remarks !== undefined) {
          updateData.remarks = task.remarks;
        }

        if (task.startDate !== undefined) {
          updateData.startDate = task.startDate === "" || task.startDate === null ? null : task.startDate;
        }

       
        if (task.endDate !== undefined) {
          updateData.endDate = task.endDate === "" || task.endDate === null ? null : task.endDate;
        }

        return { updateOne: {filter: {_id: task._id,companyId: user.companyId},update: {$set: updateData}}};
      });

    if (bulkOperations.length === 0) return { success: false, message: "No valid task data found."};

    const result = await Task.bulkWrite(bulkOperations);

    const updatedTasks = await Task.find({_id: {$in: taskDatas.filter((task) => task?._id).map((task) => task._id)}, companyId: user.companyId});

    // 🔔 Send notifications
   await Promise.all(updatedTasks.map((task) => updateTaskSocket({ user, managerId: task.managerId, task})));

    return {success: true,message: "Tasks updated successfully.",data: { matchedCount: result.matchedCount, modifiedCount: result.modifiedCount}};
  } catch (error: any) {
    return { success: false, message: error?.message || "Something Went Wrong."};
  }
};






export const handleDeleteTaskData = async ({user, taskIds, companyId}: {user:any, taskIds: string[]; companyId: string}) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    
    const tasks = await Task.find({_id: { $in: taskIds },companyId}).select("_id fullName managerId").session(session);

    if (!tasks.length) {
      await session.abortTransaction();
      return {success: false,message: "No matching tasks found."};
    }

    const matchedTaskIds = tasks.map((task) => task._id);

     const subTasks = await SubTask.find({taskId: { $in: matchedTaskIds }, companyId}).select("_id taskId employeeId").session(session);

    const subTaskDeleteResult = await SubTask.deleteMany({taskId: { $in: matchedTaskIds }, companyId},{ session });

    const taskDeleteResult = await Task.deleteMany({_id: { $in: matchedTaskIds },companyId},{ session });

    await session.commitTransaction();

    // 6. Commit ke baad socket notification
    await Promise.all(tasks.map(async (task) => {
        const taskSubTasks = subTasks.filter((subTask: any) => subTask.taskId.toString() === task._id.toString());
        await deleteTaskSocket({user,task,subTasks: taskSubTasks})}));

    return {success: true,message: `Tasks ${subTasks?.length > 0 && "and related subtasks"} deleted successfully.`,data: {deletedTasks: taskDeleteResult.deletedCount,deletedSubTasks: subTaskDeleteResult.deletedCount}};
  }
  catch (error: any) {
    await session.abortTransaction();
    return {success: false,message: error?.message || "Something Went Wrong."};
  }
   finally {
    await session.endSession();
  }
};













export const handleCreateTasksFromExcel = async ({ user, createdBy, managerId, projectId, file}: any) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    if (!file) {
      await session.abortTransaction();
      return { success: false, message: "Excel file is required."};
    }

    if (!managerId) {
      await session.abortTransaction();
      return {success: false,message: "Manager ID is required."};
    }

    if (!createdBy) {
      await session.abortTransaction();
      return { success: false, message: "Created By ID is required."};
    }

    if (!projectId) {
      await session.abortTransaction();
      return { success: false, message: "Project ID is required."};
    }

    if (!user?.companyId) {
      await session.abortTransaction();
      return { success: false, message: "Company ID is required."};
    }

    if (!mongoose.Types.ObjectId.isValid(managerId)) {
      await session.abortTransaction();
      return { success: false, message: "Invalid Manager ID."};
    }

    if (!mongoose.Types.ObjectId.isValid(createdBy)) {
      await session.abortTransaction();
      return { success: false, message: "Invalid Created By ID."};
    }

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      await session.abortTransaction();
      return { success: false, message: "Invalid Project ID."};
    }

    if (!mongoose.Types.ObjectId.isValid(user.companyId)) {
      await session.abortTransaction();
      return { success: false, message: "Invalid Company ID."};
    }

    const workbook = XLSX.read(file.buffer, { type: "buffer", cellDates: true});

    const [firstSheetName] = workbook.SheetNames;

    if (!firstSheetName) {
      await session.abortTransaction();
      return { success: false, message: "Excel file does not contain any sheet."};
    }

    const worksheet = workbook.Sheets[firstSheetName];

    if (!worksheet) {
      await session.abortTransaction();
      return { success: false, message: "Excel worksheet not found."};
    }

    const rows: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet, { defval: "", raw: true,});

    if (!rows.length) {
      await session.abortTransaction();
      return { success: false, message: "Excel file is empty."};
    }

    const tasks = rows.map((row, index) => {
      const rowNumber = index + 2;

      const name = row.name?.toString().trim();

      if (!name) throw new Error(`Task name is required at Excel row ${rowNumber}.`);

      const url = row.url?.toString().trim();

      if (!url) throw new Error(`URL is required at Excel row ${rowNumber}.`);

      const taskData: any = {
        name,
        url,
        managerId: new mongoose.Types.ObjectId(managerId),
        projectId: new mongoose.Types.ObjectId(projectId),
        companyId: new mongoose.Types.ObjectId(user.companyId),
        createdBy: new mongoose.Types.ObjectId(createdBy),
      };

      if (row.description !== undefined &&row.description !== null &&row.description.toString().trim() !== "") {
        taskData.description = row.description.toString().trim();
      }

      if (row.startDate !== undefined &&row.startDate !== null &&row.startDate !== "") {
        const startDate = new Date(row.startDate);

        if (isNaN(startDate.getTime())) {
          throw new Error( `Invalid startDate at Excel row ${rowNumber}.`);
        }

        taskData.startDate = startDate;
      }

      if (row.endDate !== undefined &&row.endDate !== null &&row.endDate !== "") {
        const endDate = new Date(row.endDate);

        if (isNaN(endDate.getTime())) {
          throw new Error(`Invalid endDate at Excel row ${rowNumber}.`);
        }

        taskData.endDate = endDate;
      }

      if (row.priority !== undefined &&row.priority !== null &&row.priority.toString().trim() !== "") {
        const priority = row.priority.toString().trim().toLowerCase();

        const allowedPriorities = ["low","medium","high","urgent"];

        if (!allowedPriorities.includes(priority)) {
          throw new Error(`Invalid priority "${priority}" at Excel row ${rowNumber}. ` +  `Allowed values: low, medium, high, urgent.`);
        }

        taskData.priority = priority;
      }

    
      if (row.remarks !== undefined &&row.remarks !== null &&row.remarks.toString().trim() !== "") {
        taskData.remarks = row.remarks.toString().trim();
      }

      return taskData;
    });

    const createdTasks = await Task.insertMany(
      tasks,
      { session }
    );

    if (!createdTasks.length) {
      await session.abortTransaction();
      return { success: false, message: "Tasks could not be created."};
    }

    await session.commitTransaction();

    for (const task of createdTasks) {
    await createTaskSocket({user, managerId, task});
    }

    return {success: true,message: `${createdTasks.length} Tasks created successfully.`,data: {count: createdTasks.length,tasks: createdTasks}};

  } catch (error: any) {
    await session.abortTransaction();
    return { success: false, message: error?.message || "Something Went Wrong.",
    };
  } finally {
    await session.endSession();
  }
};

