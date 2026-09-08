import mongoose from "mongoose";
import { getIO } from "../config/socketInit.ts";
import Notification from "../models/notification.model.ts";
import User from "../models/user.model.ts";
import type { notificationType, notificationEntityType } from "../types/global.ts";

type RequestAction = "created" | "updated" | "deleted";

const ACTION_META: Record<RequestAction, { type: notificationType; title: string }> = {
  created: { type: "client_request_created", title: "New Client Request" },
  updated: { type: "client_request_updated", title: "Client Request Updated" },
  deleted: { type: "client_request_deleted", title: "Client Request Withdrawn" },
};

const buildAdminMessage = (action: RequestAction, clientName: string, request: any) => {
  const label = request?.requestType === "new_project" ? "new project request" : "project update request";

  switch (action) {
    case "created":
      return `${clientName} raised a ${label}: "${request?.title}".`;
    case "updated":
      return `${clientName} updated the ${label}: "${request?.title}".`;
    case "deleted":
      return `${clientName} withdrew the ${label}: "${request?.title}".`;
  }
};

/**
 * Client ne koi request create / update / delete ki -> company ke saare admins ko
 * notification + live socket event bhejo.
 */
export const notifyAdminsOfClientRequest = async ({ user, request, action }: { user: any; request: any; action: RequestAction }) => {
  try {
    const io = getIO();

    const companyId = new mongoose.Types.ObjectId(user.companyId);

    const [client, admins] = await Promise.all([
      User.findById(user.id).select("fullName clientCompanyName"),
      User.find({ companyId, role: "admin" }).select("_id"),
    ]);

    const clientName = client?.fullName || "A client";
    const meta = ACTION_META[action];

    const notifications = await Promise.all(
      admins.map(async (admin: any) => {
        const notification = await Notification.create({
          companyId,
          recipientId: admin._id,
          createdBy: new mongoose.Types.ObjectId(user.id),
          type: meta.type,
          entityType: "ClientRequest" as notificationEntityType,
          entityId: new mongoose.Types.ObjectId(request._id),
          title: meta.title,
          message: buildAdminMessage(action, clientName, request),
          isRead: false,
        });

        io.to(admin._id.toString()).emit("notification", notification);

        return notification;
      })
    );

    // Admin ki Client Requests list ko turant refresh karne ke liye company-wide event
    io.to(`company_${user.companyId}`).emit("clientRequest:changed", {
      action,
      requestId: request._id?.toString(),
      clientId: user.id?.toString(),
      status: request?.status,
    });

    console.log(`🔔 Client request ${action} -> notified ${admins.length} admin(s).`);

    return { success: true, notifications };
  } catch (error: any) {
    console.error("notifyAdminsOfClientRequest Error:-", error?.message);
    return { success: false, message: error?.message || "Something went wrong while notifying admins." };
  }
};

/**
 * Admin ne request review ki (status / remarks change) -> client ko notification + live event.
 */
export const notifyClientOfRequestReview = async ({ user, request }: { user: any; request: any }) => {
  try {
    const io = getIO();

    const clientId = request?.clientId?._id || request?.clientId;
    if (!clientId) return { success: false, message: "Client not found on request." };

    const notification = await Notification.create({
      companyId: new mongoose.Types.ObjectId(user.companyId),
      recipientId: new mongoose.Types.ObjectId(clientId),
      createdBy: new mongoose.Types.ObjectId(user.id),
      type: "client_request_reviewed" as notificationType,
      entityType: "ClientRequest" as notificationEntityType,
      entityId: new mongoose.Types.ObjectId(request._id),
      title: "Request Status Updated",
      message: `Your request "${request?.title}" is now marked as "${request?.status}".`,
      isRead: false,
    });

    io.to(clientId.toString()).emit("notification", notification);

    io.to(`company_${user.companyId}`).emit("clientRequest:changed", {
      action: "reviewed",
      requestId: request._id?.toString(),
      clientId: clientId.toString(),
      status: request?.status,
    });

    console.log(`🔔 Client request review notification sent to client: ${clientId}`);

    return { success: true, notification };
  } catch (error: any) {
    console.error("notifyClientOfRequestReview Error:-", error?.message);
    return { success: false, message: error?.message || "Something went wrong while notifying the client." };
  }
};
