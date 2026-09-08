import User from "../../models/user.model.ts";
import ClientRequest from "../../models/clientRequest.model.ts";
import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { stripUndefined } from "../../utils/stripUndefined.ts";
import {
  registerClientValidationSchema,
  updateClientValidationSchema,
  getClientValidationSchema,
  getClientByIdValidationSchema,
} from "../../schemas/client.schema.ts";

type RegisterClientInput = z.infer<typeof registerClientValidationSchema>["body"];
type UpdateClientInput = z.infer<typeof updateClientValidationSchema>["body"];
type UpdateClientParams = z.infer<typeof updateClientValidationSchema>["params"];
type GetClientParams = z.infer<typeof getClientValidationSchema>["params"];
type GetClientByIdParams = z.infer<typeof getClientByIdValidationSchema>["params"];

export const registerClient = async (req: Request<{}, {}, RegisterClientInput>, res: Response, next: NextFunction) => {
  try {
    const email = req.body.email.toLowerCase().trim();

    const existing = await User.findOne({ email, companyId: req.body.companyId });
    if (existing) return res.status(409).json({ success: false, message: "A user with this email already exists in your company." });

    const client: any = await User.create(stripUndefined({ ...req.body, email, role: "client", active: true }));

    const { password, ...safeClient } = client.toObject();

    return res.status(201).json({ success: true, message: `${client.fullName} is registered as a client successfully.`, data: safeClient });
  } catch (error: any) {
    console.log("Client Register Error:-", error?.message);
    next(error);
  }
};

export const getClients = async (req: Request<GetClientParams, {}, {}>, res: Response, next: NextFunction) => {
  try {
    const clients = await User.find({ companyId: req.params.companyId, role: "client" }).select("-password").sort({ createdAt: -1 });

    return res.status(200).json({ success: true, data: clients });
  } catch (error: any) {
    console.log("Clients Get Error:-", error?.message);
    next(error);
  }
};

export const getClientById = async (req: Request<GetClientByIdParams, {}, {}>, res: Response, next: NextFunction) => {
  try {
    const client = await User.findOne({ _id: req.params.id, companyId: req.params.companyId, role: "client" }).select("-password");
    if (!client) return res.status(404).json({ success: false, message: "Client Not Found." });

    return res.status(200).json({ success: true, data: client });
  } catch (error: any) {
    console.log("Client Get Error:-", error?.message);
    next(error);
  }
};

export const updateClient = async (req: Request<UpdateClientParams, {}, UpdateClientInput>, res: Response, next: NextFunction) => {
  try {
    const { password, email, ...restBody } = req.body;

    const client = await User.findOne({ _id: req.params.id, companyId: req.params.companyId, role: "client" });
    if (!client) return res.status(404).json({ success: false, message: "Client Not Found." });

    Object.assign(client, restBody);

    if (email) client.email = email.toLowerCase().trim();

    // save() se hi pre-save hook chalega jo password hash karta hai
    if (password) client.password = password;

    await client.save();

    return res.status(200).json({ success: true, message: "Client updated successfully." });
  } catch (error: any) {
    console.log("Client Update Error:-", error?.message);
    next(error);
  }
};

export const deleteClient = async (req: Request<GetClientByIdParams, {}, {}>, res: Response, next: NextFunction) => {
  try {
    const client = await User.findOneAndDelete({ _id: req.params.id, companyId: req.params.companyId, role: "client" });
    if (!client) return res.status(404).json({ success: false, message: "Client Not Found." });

    await ClientRequest.deleteMany({ clientId: req.params.id, companyId: req.params.companyId });

    return res.status(200).json({ success: true, message: "Client deleted successfully." });
  } catch (error: any) {
    console.log("Client Delete Error:-", error?.message);
    next(error);
  }
};
