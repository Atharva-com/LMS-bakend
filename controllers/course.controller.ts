import { Request, Response, NextFunction } from "express";
import ErrorHandler from "../utils/ErrorHandler";
import { CatchAsyncError } from "../middleware/catchAsyncErrors";
require("dotenv").config();
import cloudinary from "cloudinary";
import { createCourse } from "../services/course.service";

// upload Course
export const uploadCourse = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
        
        const data = req.body;

    if (!data) {
        return next(new ErrorHandler("Please fill all the fields.", 400));
      }

    const thumbnail = data.thumbnail

    if(thumbnail){
        const myCloud = await cloudinary.v2.uploader.upload(thumbnail, {
            folder: "courses",
        })

        data.thumbnail = {
            url: myCloud.secure_url,
            public_id: myCloud.public_id
        }
    }

    createCourse(data, res, next)

    } catch (error: any) {

        return next(new ErrorHandler(error.message, 500));
        
    }
  }
);