
import mongoose from "mongoose";
import { getIO } from "../config/socketInit.ts";
import Notification from "../models/notification.model.ts";
import type { notificationType, notificationEntityType} from "../types/global.ts";


export const deleteProjectSocket = async ({ user, tasks, subTasks}: any) => {
  try {
    const io = getIO();

    const notifications: any[] = [];

    await Promise.all(tasks.filter((task: any) => task.managerId).map(async (task: any) => {
          const managerId = task.managerId.toString();
          const notification = await Notification.create({
            companyId: new mongoose.Types.ObjectId(user.companyId),
            recipientId: new mongoose.Types.ObjectId(managerId),
            createdBy: new mongoose.Types.ObjectId(user.id),
            type: "task_deleted" as notificationType,
            entityType: "Task" as notificationEntityType,
            entityId: new mongoose.Types.ObjectId(task._id),
            title: "Task Deleted",
            message: `The task "${task.name}" has been deleted because its project was deleted.`,
            isRead: false,
          });

          io.to(managerId).emit("notification", notification);

          notifications.push(notification);
        })
    );

    await Promise.all(subTasks.filter((subTask: any) => subTask.employeeId).map(async (subTask: any) => {
          const employeeId = subTask.employeeId.toString();
          const notification = await Notification.create({
            companyId: new mongoose.Types.ObjectId(user.companyId),
            recipientId: new mongoose.Types.ObjectId(employeeId),
            createdBy: new mongoose.Types.ObjectId(user.id),
            type: "subtask_deleted" as notificationType,
            entityType: "SubTask" as notificationEntityType,
            entityId: new mongoose.Types.ObjectId(subTask._id),
            title: "SubTask Deleted",
            message: `The subtask "${subTask.name}" has been deleted because its project was deleted.`,
            isRead: false,
          });

          io.to(employeeId).emit("notification", notification);

          notifications.push(notification);
        })
    );

    console.log(`🔔 Project deletion notifications sent. Tasks: ${tasks.length}, SubTasks: ${subTasks.length}`);

    return {success: true,notifications};

  } catch (error: any) {
    console.error("deleteProjectSocket Error:-",error?.message);
    return {success: false,message:error?.message ||"Something went wrong while creating project deletion notifications."};
  }
};


type ProjectClientAction = "assigned" | "unassigned";

const PROJECT_CLIENT_META: Record<ProjectClientAction, { type: notificationType; title: string }> = {
  assigned: { type: "project_assigned", title: "New Project Assigned" },
  unassigned: { type: "project_unassigned", title: "Project Removed" },
};

/**
 * Admin ne project ko client se link ya unlink kiya -> us client ko
 * Notification doc + live socket event bhejo (bell count + list refresh dono ke liye).
 */
export const notifyClientOfProjectAssignment = async ({ user, project, clientId, action }: { user: any; project: any; clientId: any; action: ProjectClientAction }) => {
  try {
    if (!clientId) return { success: false, message: "Client id is required." };

    const io = getIO();

    const meta = PROJECT_CLIENT_META[action];

    const message =
      action === "assigned"
        ? `The project "${project?.name}" has been assigned to you. You can now track it and raise update requests on it.`
        : `The project "${project?.name}" is no longer linked to your account.`;

    const notification = await Notification.create({
      companyId: new mongoose.Types.ObjectId(user.companyId),
      recipientId: new mongoose.Types.ObjectId(clientId),
      createdBy: new mongoose.Types.ObjectId(user.id),
      type: meta.type,
      entityType: "Project" as notificationEntityType,
      entityId: new mongoose.Types.ObjectId(project._id),
      title: meta.title,
      message,
      isRead: false,
    });

    const clientRoom = clientId.toString();

    io.to(clientRoom).emit("notification", notification);

    io.to(clientRoom).emit("clientProject:changed", {
      action,
      projectId: project._id?.toString(),
    });

    console.log(`🔔 Project ${action} notification sent to client: ${clientRoom}`);

    return { success: true, notification };
  } catch (error: any) {
    console.error("notifyClientOfProjectAssignment Error:-", error?.message);
    return { success: false, message: error?.message || "Something went wrong while notifying the client." };
  }
};

/**
 * Project ka data badla (edit / status / delete) -> linked client ki list chup-chaap
 * refresh ho jaye. Yahan Notification doc nahi banta, warna bell spam ho jayegi.
 */
export const emitClientProjectChanged = ({ clientIds, action, projectId }: { clientIds: any[]; action: string; projectId?: any }) => {
  try {
    if (!clientIds?.length) return;

    const io = getIO();

    const uniqueClientIds = [...new Set(clientIds.filter(Boolean).map((id: any) => id.toString()))];

    uniqueClientIds.forEach((clientId) => {
      io.to(clientId).emit("clientProject:changed", { action, projectId: projectId?.toString() });
    });
  } catch (error: any) {
    console.error("emitClientProjectChanged Error:-", error?.message);
  }
};
