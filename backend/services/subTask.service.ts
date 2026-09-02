import mongoose from "mongoose";
import SubTask from "../models/subTask.model.ts";
import SubTaskAssignmentHistory from "../models/subTask.history.model.ts";
import * as XLSX from "xlsx";
import {createSubTaskSocket, updateSubTaskSocket, reassignSubTaskSocket} from "../sockets/subTask.socket.ts";


interface GetSubTaskDataResponse {
  success: boolean;
  message?: string;
  data?: any[];
}

export const getSubTaskData = async ({ user, taskId}: any): Promise<GetSubTaskDataResponse> => {
  try {
    const userId = user?.id;
    const companyId = user?.companyId;
    const role = user?.role;

    if (!userId || !companyId || !role) return { success: false, message: "User information is missing." };

    let query: any = { companyId };

    if (role === "admin") {
      query = { companyId };
    }

  
    if (role === "manager") {
      query = { companyId, createdBy: userId };
    }

  
    if (role === "employee") {
      query = { companyId, employeeId: userId };
    }
    if (taskId) {
      query.taskId = taskId;
    }

    const subTasks = await SubTask.find(query)
      .populate("taskId", "name")
      .populate({path:"employeeId", select:"fullName email role department",populate:{path:"department", select:"name"}})
      .populate("createdBy", "fullName email role")
      .sort({ createdAt: -1 })
      .lean();


    return { success: true, data: subTasks };
  } catch (error: any) {
    return { success: false, message: error?.message || "Something Went Wrong."};
  }
};





export const handleReassignedSubTask = async ({user,subTaskId,newEmployeeId,startDate,endDate,reason}: any) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const subTask = await SubTask.findOne({ _id: subTaskId, companyId: user?.companyId}).session(session);

    if (!subTask) {
      await session.abortTransaction();
      return { success: false, message: "Sub Task Not Found."};
    }

    const oldEmployeeId = subTask.employeeId;

    if (oldEmployeeId.toString() === newEmployeeId.toString()) {
      await session.abortTransaction();

      return { success: false, message: "Sub Task is already assigned to this employee."};
    }

    await SubTaskAssignmentHistory.create(
      [
        {
          subTaskId: subTask._id,
          taskId: subTask.taskId,
          companyId: subTask.companyId,
          fromEmployeeId: oldEmployeeId,
          toEmployeeId: newEmployeeId,
          reassignedBy: user?.id,
          reason: reason || undefined,
          reassignedAt: new Date(),
        },
      ],
      { session }
    );

    subTask.employeeId = new mongoose.Types.ObjectId(newEmployeeId);

    if (startDate) {
      subTask.startDate = new Date(startDate);
    }

    if (endDate) {
      subTask.endDate = new Date(endDate);
    }

    await subTask.save({ session });

    await session.commitTransaction();

    await reassignSubTaskSocket({
            user,
            fromEmployeeId: oldEmployeeId,
            toEmployeeId: newEmployeeId,
            subTask
        });

    return {
      success: true,
      message: "Sub Task reassigned successfully.",
      data: {
        subTaskId: subTask._id,
        fromEmployeeId: oldEmployeeId,
        toEmployeeId: newEmployeeId,
      },
    };
  } catch (error: any) {
    await session.abortTransaction();

    return { success: false, message: error?.message || "Something Went Wrong."};
  } finally {
    await session.endSession();
  }
};





export const handleUpdateBulkSubTaskData = async ({user,subTaskDatas}: { user: any; subTaskDatas: any[] }) => {
  try {
    if (!Array.isArray(subTaskDatas) || subTaskDatas.length === 0) return { success: false, message: "SubTask data is required."};
   
     const subTaskIds = subTaskDatas.filter((subTask) => subTask?._id).map((subTask) => subTask._id);

    const bulkOperations = subTaskDatas.filter((subTask) => subTask?._id).map((subTask) => {
        const updateData: Record<string, any> = {};

        if (subTask.name !== undefined) {
          updateData.name = subTask.name;
        }

        if (subTask.url !== undefined) {
          updateData.url = subTask.url;
        }

        if (subTask.employeeId !== undefined) {
          updateData.employeeId = subTask.employeeId;
        }

        if (subTask.priority !== undefined) {
          updateData.priority = subTask.priority;
        }

        if (subTask.status !== undefined) {
          updateData.status = subTask.status;
        }


        if (subTask.description !== undefined) {
          updateData.description = subTask.description === "" ? "" : subTask.description;
        }

        if (subTask.remarks !== undefined) {
          updateData.remarks = subTask.remarks === "" ? "" : subTask.remarks;
        }

      
        if (subTask.startDate !== undefined) {
          updateData.startDate = subTask.startDate === "" || subTask.startDate === null ? null : subTask.startDate;
        }

        if (subTask.endDate !== undefined) {
          updateData.endDate = subTask.endDate === "" || subTask.endDate === null ? null : subTask.endDate;
        }

        return {
          updateOne: {
            filter: {_id: subTask._id, companyId: user.companyId},
            update: { $set: updateData},
          },
        };
      });

    if (bulkOperations.length === 0) return { success: false, message: "No valid subTask data found."};

    const result = await SubTask.bulkWrite(bulkOperations);

     const updatedSubTasks = await SubTask.find({ _id: { $in: subTaskIds }, companyId: user.companyId});

        for (const subTask of updatedSubTasks) {
            await updateSubTaskSocket({ user, employeeId: subTask.employeeId, subTask});
        }

    return {success: true,message: "SubTasks updated successfully.",data: { matchedCount: result.matchedCount, modifiedCount: result.modifiedCount},
    };
  } catch (error: any) {
    return { success: false, message: error?.message || "Something Went Wrong."};
  }
};








export const handleCreateSubTasksFromExcel = async ({user,createdBy,employeeId,taskId,file}: any) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    if (!file) {
      await session.abortTransaction();
      return { success: false, message: "Excel file is required."};
    }

    if (!employeeId) {
      await session.abortTransaction();
      return { success: false, message: "Employee ID is required."};
    }

    if (!createdBy) {
      await session.abortTransaction();
      return { success: false, message: "Created By ID is required."};
    }

    if (!taskId) {
      await session.abortTransaction();
      return { success: false, message: "Task ID is required."};
    }

    if (!user?.companyId) {
      await session.abortTransaction();
      return { success: false, message: "Company ID is required."};
    }

    if (!mongoose.Types.ObjectId.isValid(employeeId)) {
      await session.abortTransaction();
      return { success: false, message: "Invalid Employee ID."};
    }

    if (!mongoose.Types.ObjectId.isValid(createdBy)) {
      await session.abortTransaction();
      return { success: false, message: "Invalid Created By ID."};
    }

    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      await session.abortTransaction();
      return { success: false, message: "Invalid Task ID."};
    }

    if (!mongoose.Types.ObjectId.isValid(user.companyId)) {
      await session.abortTransaction();
      return { success: false, message: "Invalid Company ID.",};
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

    const rows: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet, {defval: "", raw: true});

    if (!rows.length) {
      await session.abortTransaction();
      return {success: false,message: "Excel file is empty."};
    }

    const subTasks = rows.map((row, index) => {
      const rowNumber = index + 2;

      const name = row.name?.toString().trim();

      if (!name) {
        throw new Error(`Sub Task name is required at Excel row ${rowNumber}.`);
      }

      const url = row.url?.toString().trim();

      if (!url) {
        throw new Error( `URL is required at Excel row ${rowNumber}.`);
      }

      const subTaskData: any = {
        name,
        url,
        employeeId: new mongoose.Types.ObjectId(employeeId),
        taskId: new mongoose.Types.ObjectId(taskId),
        companyId: new mongoose.Types.ObjectId(user.companyId),
        createdBy: new mongoose.Types.ObjectId(createdBy),
      };


      if (row.description !== undefined &&row.description !== null &&row.description.toString().trim() !== "") {
        subTaskData.description = row.description.toString().trim();
      }

      if (row.startDate !== undefined &&row.startDate !== null &&row.startDate !== "") {
        const startDate = new Date(row.startDate);

        if (isNaN(startDate.getTime())) {
          throw new Error(`Invalid startDate at Excel row ${rowNumber}.`);
        }
        subTaskData.startDate = startDate;
      }

      if (row.endDate !== undefined &&row.endDate !== null &&row.endDate !== "") {
        const endDate = new Date(row.endDate);

        if (isNaN(endDate.getTime())) {
          throw new Error(`Invalid endDate at Excel row ${rowNumber}.`);
        }

        subTaskData.endDate = endDate;
      }

      if (row.priority !== undefined &&row.priority !== null &&row.priority.toString().trim() !== "") {
        const priority = row.priority.toString().trim().toLowerCase();

        const allowedPriorities = ["low","medium","high","urgent"];

        if (!allowedPriorities.includes(priority)) {
          throw new Error(`Invalid priority "${priority}" at Excel row ${rowNumber}. ` +`Allowed values: low, medium, high, urgent.`);
        }

        subTaskData.priority = priority;
      }

      if (row.remarks !== undefined &&row.remarks !== null &&row.remarks.toString().trim() !== "") {
        subTaskData.remarks = row.remarks.toString().trim();
      }

      return subTaskData;
    });

    const createdSubTasks = await SubTask.insertMany(subTasks,{ session });

    if (!createdSubTasks.length) {
      await session.abortTransaction();
      return {success: false,message: "Sub Tasks could not be created.",
      };
    }

    await session.commitTransaction();

    // 🔔 Create notification for every subtask
   await Promise.all(createdSubTasks.map((subTask) => createSubTaskSocket({ user, employeeId, subTask})));

    return { success: true, message: `${createdSubTasks.length} Sub Tasks created successfully.`, data: {count: createdSubTasks.length, subTasks: createdSubTasks},
    };
  } catch (error: any) {
    await session.abortTransaction();
    return { success: false, message: error?.message || "Something Went Wrong."};
  } finally {
    await session.endSession();
  }
};
