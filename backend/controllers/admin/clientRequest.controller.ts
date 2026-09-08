import ClientRequest from "../../models/clientRequest.model.ts";
import Project from "../../models/project.model.ts";
import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import {
  clientRequestIdValidationSchema,
  reviewClientRequestValidationSchema,
  convertClientRequestValidationSchema,
} from "../../schemas/clientRequest.schema.ts";
import { notifyClientOfRequestReview } from "../../sockets/clientRequest.socket.ts";
import { emitClientProjectChanged } from "../../sockets/project.socket.ts";
import { stripUndefined } from "../../utils/stripUndefined.ts";

type RequestIdParams = z.infer<typeof clientRequestIdValidationSchema>["params"];
type ReviewInput = z.infer<typeof reviewClientRequestValidationSchema>["body"];
type ConvertInput = z.infer<typeof convertClientRequestValidationSchema>["body"];

const CLIENT_FIELDS = "fullName email contact clientCompanyName profileImage";

/** Admin inbox — company ki saari client requests, optional ?status= filter ke saath. */
export const getAllClientRequests = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filter: Record<string, unknown> = { companyId: req.user?.companyId };

    const status = req.query?.status?.toString();
    if (status && status !== "all") filter.status = status;

    const requests = await ClientRequest.find(filter)
      .populate("clientId", CLIENT_FIELDS)
      .populate("projectId", "name status priority")
      .populate("linkedProjectId", "name status priority")
      .populate("reviewedBy", "fullName email")
      .sort({ createdAt: -1 });

    const pendingCount = await ClientRequest.countDocuments({ companyId: req.user?.companyId, status: "pending" });

    return res.status(200).json({ success: true, data: requests, pendingCount });
  } catch (error: any) {
    console.log("Client Requests Get Error:-", error?.message);
    next(error);
  }
};

export const getClientRequestById = async (req: Request<RequestIdParams, {}, {}>, res: Response, next: NextFunction) => {
  try {
    const request = await ClientRequest.findOne({ _id: req.params.id, companyId: req.user?.companyId })
      .populate("clientId", CLIENT_FIELDS)
      .populate("projectId", "name status priority startDate endDate")
      .populate("linkedProjectId", "name status priority")
      .populate("reviewedBy", "fullName email");

    if (!request) return res.status(404).json({ success: false, message: "Client Request Not Found." });

    return res.status(200).json({ success: true, data: request });
  } catch (error: any) {
    console.log("Client Request Get Error:-", error?.message);
    next(error);
  }
};

/** Admin status / remarks update kare -> client ko live notification jaye. */
export const reviewClientRequest = async (req: Request<RequestIdParams, {}, ReviewInput>, res: Response, next: NextFunction) => {
  try {
    const request = await ClientRequest.findOneAndUpdate(
      { _id: req.params.id, companyId: req.user?.companyId },
      {
        $set: {
          status: req.body.status,
          ...(req.body.adminRemarks !== undefined && { adminRemarks: req.body.adminRemarks }),
          reviewedBy: req.user?.id,
          reviewedAt: new Date(),
        },
      },
      { new: true, runValidators: true }
    ).populate("clientId", CLIENT_FIELDS);

    if (!request) return res.status(404).json({ success: false, message: "Client Request Not Found." });

    await notifyClientOfRequestReview({ user: req.user, request });

    return res.status(200).json({ success: true, message: "Request status updated successfully.", data: request });
  } catch (error: any) {
    console.log("Client Request Review Error:-", error?.message);
    next(error);
  }
};

/** new_project request ko asli Project me convert karo aur client se link kar do. */
export const convertRequestToProject = async (req: Request<RequestIdParams, {}, ConvertInput>, res: Response, next: NextFunction) => {
  try {
    const request = await ClientRequest.findOne({ _id: req.params.id, companyId: req.user?.companyId }).populate("clientId", CLIENT_FIELDS);
    if (!request) return res.status(404).json({ success: false, message: "Client Request Not Found." });

    if (request.requestType !== "new_project") {
      return res.status(400).json({ success: false, message: "Only a new project request can be converted into a project." });
    }

    if (request.linkedProjectId) {
      return res.status(409).json({ success: false, message: "This request has already been converted into a project." });
    }

    const name = req.body.name?.trim() || request.title;

    const duplicate = await Project.findOne({ companyId: req.user?.companyId, name });
    if (duplicate) return res.status(409).json({ success: false, message: "A project with this name already exists." });

    const project: any = await Project.create(stripUndefined({
      name,
      description: req.body.description ?? request.description,
      url: req.body.url ?? request.referenceUrl,
      startDate: req.body.startDate ?? new Date(),
      ...(req.body.endDate || request.expectedDate ? { endDate: req.body.endDate ?? request.expectedDate } : {}),
      priority: req.body.priority ?? request.priority,
      status: "pending",
      ...(req.body.remarks && { remarks: req.body.remarks }),
      createdBy: req.user?.id,
      companyId: req.user?.companyId,
      clientId: (request.clientId as any)?._id || request.clientId,
      sourceRequestId: request._id,
    }));

    request.linkedProjectId = project._id as any;
    request.status = "approved";
    request.reviewedBy = req.user?.id as any;
    request.reviewedAt = new Date();
    await request.save();

    await notifyClientOfRequestReview({ user: req.user, request });

    // Naya project client ki list me turant dikhna chahiye
    emitClientProjectChanged({ clientIds: [project.clientId], action: "assigned", projectId: project._id });

    return res.status(201).json({ success: true, message: "Request converted into a project successfully.", data: { project, request } });
  } catch (error: any) {
    console.log("Client Request Convert Error:-", error?.message);
    next(error);
  }
};

export const deleteClientRequestByAdmin = async (req: Request<RequestIdParams, {}, {}>, res: Response, next: NextFunction) => {
  try {
    const request = await ClientRequest.findOneAndDelete({ _id: req.params.id, companyId: req.user?.companyId });
    if (!request) return res.status(404).json({ success: false, message: "Client Request Not Found." });

    return res.status(200).json({ success: true, message: "Client request deleted successfully." });
  } catch (error: any) {
    console.log("Client Request Delete Error:-", error?.message);
    next(error);
  }
};
