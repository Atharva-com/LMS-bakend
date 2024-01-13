import { Request, Response, NextFunction } from "express";
import ErrorHandler from "../utils/ErrorHandler";
import { CatchAsyncError } from "../middleware/catchAsyncErrors";
import { generateLast12MonthsData } from "../utils/analytics.generator";
import userModel from "../models/user.model";
import CourseModel from "../models/course.model";
import OrderModel from "../models/order.model";

// user data analytics -- only admin
export const getUserAnalytics = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = await generateLast12MonthsData(userModel)
        res.status(200).json({
            success: true,
            user
        })
    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
    }
  }
);

// course data analytics -- only admin
export const getCourseAnalytics = CatchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
      try {
          const course = await generateLast12MonthsData(CourseModel)
          res.status(200).json({
              success: true,
              course
          })
      } catch (error: any) {
          return next(new ErrorHandler(error.message, 400));
      }
    }
  );

// order data analytics -- only admin
export const getOrderAnalytics = CatchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
      try {
          const order = await generateLast12MonthsData(OrderModel)
          res.status(200).json({
              success: true,
              order
          })
      } catch (error: any) {
          return next(new ErrorHandler(error.message, 400));
      }
    }
  );