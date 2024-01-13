import NotificationModel from "../models/notification.model";
import { NextFunction, Response, Request } from "express";
import { CatchAsyncError } from "../middleware/catchAsyncErrors";
import ErrorHandler from "../utils/ErrorHandler";

// get all notifications -- only admin
export const getNotifications = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const notification = await NotificationModel.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Notification fetched successfully",
      notification,
    });
  }
);