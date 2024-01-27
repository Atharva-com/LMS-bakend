import { NextFunction, Request, Response } from "express";
import { CatchAsyncError } from "../middleware/catchAsyncErrors";
import ErrorHandler from "../utils/ErrorHandler";
import OrderModel from "../models/order.model";
import userModel from "../models/user.model";
import CourseModel from "../models/course.model";
import { IOrder } from "../models/order.model";
import ejs from "ejs";
import path from "path";
import sendMail from "../utils/sendMail";
import NotificationModel from "../models/notification.model";
import { getAllOrdersService, newOrder } from "../services/order.service";
import { IGetUserRequest } from "./user.controller";
import { redis } from "../utils/redis";
require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

// create order
export const createOrder = CatchAsyncError(
  async (req: IGetUserRequest, res: Response, next: NextFunction) => {
    try {
      const { courseId, payment_Info } = req.body;
      if(payment_Info){
        if("id" in payment_Info){
          const paymentIntentId = payment_Info.id
          const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)

          if(paymentIntent.status !== "succeeded"){
            return next(new ErrorHandler("Payment not successful", 400))
          }
        }
      }
      const userId = req.user._id;

      const user = await userModel.findById(userId);
      if (!user) {
        return next(new ErrorHandler("User not found", 404));
      }

      const courseExit = user?.courses.some(
        (course: any) => course._id.toString() === courseId
      );
      if (courseExit) {
        return next(new ErrorHandler("You already purchased this course", 400));
      }

      const course = await CourseModel.findById(courseId);
      if (!course) {
        return next(new ErrorHandler("Course not found", 404));
      }

      const data: any = {
        courseId: course._id,
        userId: user._id,
        payment_Info,
      };

      const mailData = {
        order: {
          _id: course._id.toString().slice(0, 6),
          name: course.name,
          price: course.price,
          date: new Date().toLocaleDateString("en-IN", {
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
        },
      };

      const html = await ejs.renderFile(
        path.join(__dirname, "../mails/order-confirmation.ejs"),
        mailData
      );

      try {
        if (user) {
          await sendMail({
            email: user.email,
            subject: "Order Confirmation",
            template: "order-confirmation.ejs",
            data: mailData,
          });
        }
      } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
      }

      user?.courses.push(course._id);

      await redis.set(req.user?._id, JSON.stringify(user))

      await user?.save();

      const notification = await NotificationModel.create({
        user: user._id,
        title: "New Order",
        message: `You have successfully purchased ${course.name} course`,
      });
      if (course.purchased || course.purchased === 0) {
        course.purchased += 1;
      }

      await course.save();

      newOrder(data, res, next);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// get all orders only for admin
export const getAllOrders = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      getAllOrdersService(res)
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// send stripe publishable key 
export const sendStripePublishableKey = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  res.status(200).json({
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY
  })
})

// new payment
export const newPayment = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  try {

    const myPayment = await stripe.paymentIntents.create({
      amount: req.body.amount,
      currency: "inr",
      metadata: {
        company: "Learning",
      },
      description: "Course Payment",
      automatic_payment_methods: {
        enabled: true,
      }
    })

    res.status(200).json({
      success: true,
      client_secret: myPayment.client_secret
    })
    
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 500));
  }
})

