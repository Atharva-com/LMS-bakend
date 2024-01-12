import { Request, Response, NextFunction } from "express";
import ErrorHandler from "../utils/ErrorHandler";
import { CatchAsyncError } from "../middleware/catchAsyncErrors";
require("dotenv").config();
import cloudinary from "cloudinary";
import { createCourse } from "../services/course.service";
import CourseModel from "../models/course.model";
import { redis } from "../utils/redis";
import { IGetUserRequest } from "./user.controller";
import mongoose from "mongoose";
import path from "path";
import ejs from "ejs";
import sendMail from "../utils/sendMail";

// upload Course
export const uploadCourse = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req.body;

      if (!data) {
        return next(new ErrorHandler("Please fill all the fields.", 400));
      }

      const thumbnail = data.thumbnail;

      if (thumbnail) {
        const myCloud = await cloudinary.v2.uploader.upload(thumbnail, {
          folder: "courses",
        });

        data.thumbnail = {
          url: myCloud.secure_url,
          public_id: myCloud.public_id,
        };
      }

      createCourse(data, res, next);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// edit course
export const editCourse = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req.body;

      if (!data) {
        return next(new ErrorHandler("Please fill all the fields.", 400));
      }

      const thumbnail = data.thumbnail;

      if (thumbnail) {
        await cloudinary.v2.uploader.destroy(data.thumbnail.public_id);

        const myCloud = await cloudinary.v2.uploader.upload(thumbnail, {
          folder: "courses",
        });

        data.thumbnail = {
          url: myCloud.secure_url,
          public_id: myCloud.public_id,
        };
      }

      const courseId = req.params.id;

      const course = await CourseModel.findByIdAndUpdate(
        courseId,
        { $set: data },
        { new: true }
      );

      res.status(200).json({
        success: true,
        course,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// get single course -- without purchasing
export const getSingleCourse = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const courseId = req.params.id;

      const isCashedExist = await redis.get(courseId);

      if (isCashedExist) {
        const course = JSON.parse(isCashedExist);
        return res.status(200).json({
          success: true,
          course,
        });
      } else {
        const course = await CourseModel.findById(courseId).select(
          "-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links"
        );

        if (!course) {
          return next(new ErrorHandler("Course not found", 404));
        }

        await redis.set(courseId, JSON.stringify(course));

        res.status(200).json({
          success: true,
          course,
        });
      }
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// get all course -- without purchasing
export const getAllCourses = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const isCashedExist = await redis.get("allCourses");

      if (isCashedExist) {
        const courses = JSON.parse(isCashedExist);
        return res.status(200).json({
          success: true,
          courses,
        });
      } else {
        const courses = await CourseModel.find().select(
          "-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links"
        );
        await redis.set("allCourses", JSON.stringify(courses));
        res.status(200).json({
          success: true,
          courses,
        });
      }
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// get course content - only for valid user
export const getCourseByUser = CatchAsyncError(
  async (req: IGetUserRequest, res: Response, next: NextFunction) => {
    try {
      const userCourseList = req?.user.courses;

      const courseId = req.params.id;

      const courseExist = userCourseList.find(
        (course: any) => course._id.toString() === courseId
      );

      if (!courseExist) {
        return next(new ErrorHandler("Course not found", 404));
      }

      const course = await CourseModel.findById(courseId);

      if (!course) {
        return next(new ErrorHandler("Course not found", 404));
      }

      const content = course?.courseData;

      res.status(200).json({
        success: true,
        content,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// add questions in course

interface IAddQuestionData {
  question: string;
  courseId: string;
  contentId: string;
}

export const addQuestion = CatchAsyncError(
  async (req: IGetUserRequest, res: Response, next: NextFunction) => {
    try {
      const { question, courseId, contentId } = req.body as IAddQuestionData;

      const course = await CourseModel.findById(courseId);

      if (!mongoose.Types.ObjectId.isValid(contentId)) {
        return next(new ErrorHandler("Invalid content Id.", 404));
      }

      if (!course) {
        return next(new ErrorHandler("Course not found", 404));
      }

      const courseContent = course?.courseData?.find(
        (item: any) => item._id.toString() === contentId
      );

      if (!courseContent) {
        return next(new ErrorHandler("Course content not found.", 404));
      }

      // create a new question
      const newQuestion: any = {
        user: req.user,
        question,
        questionReplies: [],
      };

      // add this question in course content
      courseContent.questions.push(newQuestion);

      await course?.save();

      res.status(200).json({
        success: true,
        course,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// add question replies in course
interface IAddAnswerData {
  answer: string;
  courseId: string;
  contentId: string;
  questionId: string;
}

export const addAnswer = CatchAsyncError(
  async (req: IGetUserRequest, res: Response, next: NextFunction) => {
    try {
      const { answer, courseId, contentId, questionId } =
        req.body as IAddAnswerData;

      const course = await CourseModel.findById(courseId);

      if (!mongoose.Types.ObjectId.isValid(contentId)) {
        return next(new ErrorHandler("Invalid content Id.", 404));
      }

      if (!course) {
        return next(new ErrorHandler("Course not found", 404));
      }

      const courseContent = course?.courseData?.find(
        (item: any) => item._id.toString() === contentId
      );

      if (!courseContent) {
        return next(new ErrorHandler("Course content not found.", 404));
      }

      const question = courseContent.questions.find(
        (item: any) => item._id.toString() === questionId
      );

      // If any error occurs then use item._id.equals(questionId)

      if (!question) {
        return next(new ErrorHandler("Question not found.", 404));
      }

      // create a new question
      const newAnswer: any = {
        user: req.user,
        answer,
      };

      // add this question in course content
      question.questionReplies.push(newAnswer);

      await course?.save();

      if(req.user?._id  === question.user.id) {
        // create a notification
      } else {
        const data = {
          name: question.user.name,
          title: courseContent.title
        }

        const html = await ejs.renderFile(
          path.join(__dirname, "../mails/question-reply.ejs"),
          data
        );

        try {
          await sendMail({
            email: question?.user?.email,
            subject: "Question Reply",
            template: "question-reply.ejs",
            data,
          });
  
        } catch (error: any) {
          return next(new ErrorHandler(error.message, 400));
        }
      }

      res.status(200).json({
        success: true,
        course,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);
