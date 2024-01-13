import { CatchAsyncError } from "../middleware/catchAsyncErrors";
import { NextFunction, Response } from "express";
import OrderModel from "../models/order.model";

// create new order
export const newOrder = CatchAsyncError(async(data: any, next: NextFunction, res:Response) => {
    const order = await OrderModel.create(data);

    res.status(200).json({
        success: true,
        message: "Order created successfully",
        order,
      });
})