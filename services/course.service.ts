import { Response } from "express";
import { CatchAsyncError } from "../middleware/catchAsyncErrors";
import CourseModel from "../models/course.model";

// create course
export const createCourse = CatchAsyncError(async (data: any, res: Response) => {
    const course = await CourseModel.create(data)
    await course.save();
    return res.status(200).json({
        success: true,
        message: 'Course created',
        course
    });
})

// get all courses
export const getAllCoursesService = async (res: Response) => {
    const courses = await CourseModel.find().sort({createdAt: -1});
    return res.status(200).json({
        success: true,
        courses
    });
}