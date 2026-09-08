import ClientRequest from "../../models/clientRequest.model.ts";
import Project from "../../models/project.model.ts";
import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import {
  createClientRequestValidationSchema,
  updateClientRequestValidationSchema,
  clientRequestIdValidationSchema,
} from "../../schemas/clientRequest.schema.ts";
import { notifyAdminsOfClientRequest } from "../../sockets/clientRequest.socket.ts";
import { stripUndefined } from "../../utils/stripUndefined.ts";

type CreateInput = z.infer<typeof createClientRequestValidationSchema>["body"];
type UpdateInput = z.infer<typeof updateClientRequestValidationSchema>["body"];
type RequestIdParams = z.infer<typeof clientRequestIdValidationSchema>["params"];

/** Pending request hi client edit / withdraw kar sakta hai. */
const EDITABLE_STATUS = "pending";

export const createClientRequest = async (req: Request<{}, {}, CreateInput>, res: Response, next: NextFunction) => {
  try {
    if (req.body.requestType === "project_update") {
      const project = await Project.findOne({ _id: req.body.projectId, companyId: req.user?.companyId, clientId: req.user?.id });
      if (!project) return res.status(404).json({ success: false, message: "Project not found or not assigned to you." });
    }

    const { projectId, ...restBody } = req.body;

    const request: any = await ClientRequest.create(
      stripUndefined({
        ...restBody,
        ...(req.body.requestType === "project_update" && { projectId }),
        clientId: req.user?.id,
        companyId: req.user?.companyId,
        status: "pending",
      })
    );

    await notifyAdminsOfClientRequest({ user: req.user, request, action: "created" });

    return res.status(201).json({ success: true, message: "Your request has been sent to the admin.", data: request });
  } catch (error: any) {
    console.log("Client Request Create Error:-", error?.message);
    next(error);
  }
};

export const getMyClientRequests = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filter: Record<string, unknown> = { companyId: req.user?.companyId, clientId: req.user?.id };

    const status = req.query?.status?.toString();
    if (status && status !== "all") filter.status = status;

    const requests = await ClientRequest.find(filter)
      .populate("projectId", "name status priority")
      .populate("linkedProjectId", "name status priority")
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, data: requests });
  } catch (error: any) {
    console.log("Client Requests Get Error:-", error?.message);
    next(error);
  }
};

export const getMyClientRequestById = async (req: Request<RequestIdParams, {}, {}>, res: Response, next: NextFunction) => {
  try {
    const request = await ClientRequest.findOne({ _id: req.params.id, companyId: req.user?.companyId, clientId: req.user?.id })
      .populate("projectId", "name status priority startDate endDate")
      .populate("linkedProjectId", "name status priority")
      .populate("reviewedBy", "fullName email");

    if (!request) return res.status(404).json({ success: false, message: "Request Not Found." });

    return res.status(200).json({ success: true, data: request });
  } catch (error: any) {
    console.log("Client Request Get Error:-", error?.message);
    next(error);
  }
};

export const updateMyClientRequest = async (req: Request<RequestIdParams, {}, UpdateInput>, res: Response, next: NextFunction) => {
  try {
    const existing = await ClientRequest.findOne({ _id: req.params.id, companyId: req.user?.companyId, clientId: req.user?.id });
    if (!existing) return res.status(404).json({ success: false, message: "Request Not Found." });

    if (existing.status !== EDITABLE_STATUS) {
      return res.status(400).json({ success: false, message: "This request is already under review and can no longer be edited." });
    }

    const requestType = req.body.requestType ?? existing.requestType;
    const projectId = req.body.projectId ?? existing.projectId;

    if (requestType === "project_update") {
      if (!projectId) return res.status(400).json({ success: false, message: "Project is required for an update request." });

      const project = await Project.findOne({ _id: projectId, companyId: req.user?.companyId, clientId: req.user?.id });
      if (!project) return res.status(404).json({ success: false, message: "Project not found or not assigned to you." });
    }

    Object.assign(existing, stripUndefined(req.body), { requestType });

    // new_project pe purana projectId link nahi rehna chahiye
    if (requestType === "new_project") existing.set("projectId", undefined);

    await existing.save();

    await notifyAdminsOfClientRequest({ user: req.user, request: existing, action: "updated" });

    return res.status(200).json({ success: true, message: "Request updated successfully.", data: existing });
  } catch (error: any) {
    console.log("Client Request Update Error:-", error?.message);
    next(error);
  }
};

export const deleteMyClientRequest = async (req: Request<RequestIdParams, {}, {}>, res: Response, next: NextFunction) => {
  try {
    const existing = await ClientRequest.findOne({ _id: req.params.id, companyId: req.user?.companyId, clientId: req.user?.id });
    if (!existing) return res.status(404).json({ success: false, message: "Request Not Found." });

    if (existing.status !== EDITABLE_STATUS) {
      return res.status(400).json({ success: false, message: "This request is already under review and can no longer be withdrawn." });
    }

    await existing.deleteOne();

    await notifyAdminsOfClientRequest({ user: req.user, request: existing, action: "deleted" });

    return res.status(200).json({ success: true, message: "Request withdrawn successfully." });
  } catch (error: any) {
    console.log("Client Request Delete Error:-", error?.message);
    next(error);
  }
};

/** Client dashboard ke counters. */
export const getClientDashboardSummary = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const baseFilter = { companyId: req.user?.companyId, clientId: req.user?.id };

    const [total, pending, inReview, approved, rejected, completed, projects] = await Promise.all([
      ClientRequest.countDocuments(baseFilter),
      ClientRequest.countDocuments({ ...baseFilter, status: "pending" }),
      ClientRequest.countDocuments({ ...baseFilter, status: "in_review" }),
      ClientRequest.countDocuments({ ...baseFilter, status: "approved" }),
      ClientRequest.countDocuments({ ...baseFilter, status: "rejected" }),
      ClientRequest.countDocuments({ ...baseFilter, status: "completed" }),
      Project.countDocuments({ companyId: req.user?.companyId, clientId: req.user?.id }),
    ]);

    return res.status(200).json({
      success: true,
      data: { total, pending, inReview, approved, rejected, completed, projects },
    });
  } catch (error: any) {
    console.log("Client Dashboard Summary Error:-", error?.message);
    next(error);
  }
};
