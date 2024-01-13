import NotificationModel from "../models/notification.model";
import { NextFunction, Response, Request } from "express";
import { CatchAsyncError } from "../middleware/catchAsyncErrors";
import ErrorHandler from "../utils/ErrorHandler";

// get all notifications -- only admin
export const getNotifications = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const notification = await NotificationModel.find().sort({
        createdAt: -1,
      });

      res.status(200).json({
        success: true,
        message: "Notification fetched successfully",
        notification,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// update notification status -- only admin
export const updateNotification = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id;
      const notification = await NotificationModel.findById(id);
      if (!notification) {
        return next(new ErrorHandler("Notification not found", 404));
      }

      notification.status ? notification.status = "read" : notification.status
      await notification.save();

      const notifications = await NotificationModel.find().sort({
        createdAt: -1,
      }); 

      res.status(200).json({
        success: true,
        message: "Notification updated successfully",
        notifications,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);
