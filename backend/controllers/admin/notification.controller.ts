import type { Request, Response, NextFunction } from "express";
import Notification from "../../models/notification.model.ts";
import {deleteNotificationFromSchema} from "../../schemas/notification.schema.ts";
import {z} from "zod";

type NotificationParams = z.infer<typeof deleteNotificationFromSchema>["params"];

export const getAllNotifications = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const notifications = await Notification.find({ recipientId: req.user?.id, companyId: req.user?.companyId }).populate("recipientId", "fullName email role").populate("createdBy", "fullName email role").sort({ createdAt: -1 });

        res.status(200).json({ success: true, data: notifications });
    } catch (error: any) {
        console.error("getAllNotifications Error:-", error?.message);
        next(error);
    }
};


export const deleteNotification = async(req: Request<NotificationParams, {}, {}>, res: Response, next: NextFunction) => {
  try{
       const notification = await Notification.deleteOne({_id: req.params.notificationId, companyId:req.user?.companyId as string});
       if(!notification) return res.status(404).json({success:false, message:"Notification Not Found."});

       res.status(200).json({success:true, message: "Notification deleted successfully."})
  }
  catch (error: any) {
        console.error("getAllNotifications Error:-", error?.message);
        next(error);
    }
};



export const deleteAllNotification = async(req: Request, res: Response, next: NextFunction) => {
  try{
  
       const notification = await Notification.deleteMany({recipientId: req.user?.id, companyId:req.user?.companyId as string});
       if(notification?.deletedCount === 0) return res.status(404).json({success:false, message:"Notification Not Found."});

       res.status(200).json({success:true, message: "All Notifications deleted successfully.",})
  }
  catch (error: any) {
        console.error("delete All Notifications Error:-", error?.message);
        next(error);
    } 
};





export const markAllNotification = async(req: Request, res: Response, next: NextFunction) => {
  try{  
       const notification = await Notification.updateMany({recipientId: req.user?.id, companyId:req.user?.companyId as string, isRead:false}, {$set:{isRead:true}});
       if(notification?.modifiedCount === 0) return res.status(404).json({success:false, message:"Notification Not Found."});

       res.status(200).json({success:true, message: "All notifications marked as read successfully."});
  }
  catch (error: any) {
        console.error("delete All Notifications Error:-", error?.message);
        next(error);
    } 
};