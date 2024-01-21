import { Request, Response, NextFunction } from "express";
import ErrorHandler from "../utils/ErrorHandler";
import { CatchAsyncError } from "../middleware/catchAsyncErrors";
require("dotenv").config();
import cloudinary from "cloudinary";
import { createCourse, getAllCoursesService } from "../services/course.service";
import CourseModel from "../models/course.model";
import { redis } from "../utils/redis";
import { IGetUserRequest } from "./user.controller";
import mongoose from "mongoose";
import path from "path";
import ejs from "ejs";
import sendMail from "../utils/sendMail";
import NotificationModel from "../models/notification.model";
import axios from "axios";

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
      console.log(error);
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

        await redis.set(courseId, JSON.stringify(course), "EX", 604800);

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

      await NotificationModel.create({
        user: req.user?._id,
        title: "New Question Recieved.",
        message: `${req.user?.name} has asked a question on your course ${course?.name} in ${courseContent?.title}`,
      });

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

      if (req.user?._id === question.user.id) {
        await NotificationModel.create({
          user: req.user?._id,
          title: "New Answer Recieved.",
          message: `${req.user?.name} has replied your question on your course ${course?.name} in ${courseContent?.title}`,
        });
      } else {
        const data = {
          name: question.user.name,
          title: courseContent.title,
        };

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

// add review to the course
interface IAddReviewData {
  review: string;
  rating: number;
  userId: string;
}

export const addReview = CatchAsyncError(
  async (req: IGetUserRequest, res: Response, next: NextFunction) => {
    try {
      const userCourseList = req.user?.courses;
      const courseId = req.params.id;

      const courseExist = userCourseList.find(
        (course: any) => course._id.toString() === courseId.toString()
      );

      if (!courseExist) {
        return next(
          new ErrorHandler("You are not eligible to access this course.", 400)
        );
      }

      const { review, rating } = req.body as IAddReviewData;

      const course = await CourseModel.findById(courseId);

      if (!course) {
        return next(new ErrorHandler("Course not found.", 404));
      }

      const reviewData: any = {
        user: req.user,
        comment: review,
        rating,
      };

      course?.reviews?.push(reviewData);

      let avg = 0;

      course?.reviews?.forEach((item: any) => {
        avg += item.rating;
      });

      if (course) {
        course.ratings = avg / course?.reviews?.length;
      }

      course?.save();

      const notification = {
        title: "New Review Recieved.",
        message: `${req.user?.name} has given a review on your course ${course?.name}`,
      };

      // create notification

      res.status(200).json({
        success: true,
        course,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// add replies to the reviews
interface IAddCommentReplyData {
  comment: string;
  courseId: string;
  reviewId: string;
}

export const addReplyToReview = CatchAsyncError(
  async (req: IGetUserRequest, res: Response, next: NextFunction) => {
    try {
      const { comment, courseId, reviewId } = req.body as IAddCommentReplyData;

      const course = await CourseModel.findById(courseId);

      if (!course) {
        return next(new ErrorHandler("Course not found.", 404));
      }

      const review = course?.reviews?.find(
        (item: any) => item._id.toString() === reviewId
      );

      if (!review) {
        return next(new ErrorHandler("Review not found.", 404));
      }

      const replyData: any = {
        user: req?.user,
        comment,
      };

      if (!review?.commentReplies) {
        review.commentReplies = [];
      }

      review?.commentReplies.push(replyData);

      course?.save();

      // create notification

      res.status(200).json({
        success: true,
        course,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// get all courses only for admin
export const getAllCoursesAdmin = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      getAllCoursesService(res);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// delete course - only admin

export const deleteCourse = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      console.log(id);
      
      
      const course = await CourseModel.findById(id);

      if (!course) {
        return next(new ErrorHandler("Course not found.", 400));
      }

      await course.deleteOne({ id });

      try {
        const res: any = await redis.get("allCourses");
        const allCourses = JSON.parse(res);
        console.log(allCourses)
        const course = allCourses.findIndex((course:any) => course._id === id)
        if (course !== -1) {
          allCourses.splice(course, 1);
      
          // Step 5: Update the allCourses array in Redis
          await redis.set('allCourses', JSON.stringify(allCourses));
          console.log('Course deleted successfully.');
        } else {
          console.log('Course not found.');
        }
        
      } catch (error) {
        console.log(error)
      }
      res.status(200).json({
        success: true,
        message: "Course deleted successfully.",
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// generate video url
export const generateVideoUrl = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { videoId } = req.body;

      const response = await axios.post(
        // `https://dev.vdocipher.com/api/videos/${videoId}/otp`,
        ``,
        { ttl: 300 },
        {
          headers: {
            Authorization: `Bearer ${process.env.VIMEO_ACCESS_TOKEN}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );

      res.json(response.data)
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);
