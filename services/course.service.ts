import { Response } from "express";
import { CatchAsyncError } from "../middleware/catchAsyncErrors";
import CourseModel from "../models/course.model";

// create course
export const createCourse = CatchAsyncError(async (data: any, res: Response) => {
    console.log(data)
    const course = await CourseModel.create(data)
    
    return res.status(200).json({
        success: true,
        message: 'Course created',
        course
    });
})