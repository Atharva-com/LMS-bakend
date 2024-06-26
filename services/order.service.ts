import { CatchAsyncError } from "../middleware/catchAsyncErrors";
import { NextFunction, Response } from "express";
import OrderModel from "../models/order.model";

// create new order
export const newOrder = CatchAsyncError(
  async (data: any, res: Response, next: NextFunction, ) => {
    const order = await OrderModel.create(data);

    return res.status(200).json({
      success: true,
      message: "Order created successfully",
      order,
    });
  }
);

// get all orders
export const getAllOrdersService = async (res: Response) => {
  const orders = await OrderModel.find().sort({ createdAt: -1 });
  return res.status(200).json({
    success: true,
    orders,
  });
};
