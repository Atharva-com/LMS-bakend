"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateVideoUrl = exports.deleteCourse = exports.getAllCoursesAdmin = exports.addReplyToReview = exports.addReview = exports.addAnswer = exports.addQuestion = exports.getCourseByUser = exports.getAllCourses = exports.getSingleCourse = exports.editCourse = exports.uploadCourse = void 0;
const ErrorHandler_1 = __importDefault(require("../utils/ErrorHandler"));
const catchAsyncErrors_1 = require("../middleware/catchAsyncErrors");
require("dotenv").config();
const cloudinary_1 = __importDefault(require("cloudinary"));
const course_service_1 = require("../services/course.service");
const course_model_1 = __importDefault(require("../models/course.model"));
const redis_1 = require("../utils/redis");
const mongoose_1 = __importDefault(require("mongoose"));
const path_1 = __importDefault(require("path"));
const ejs_1 = __importDefault(require("ejs"));
const sendMail_1 = __importDefault(require("../utils/sendMail"));
const notification_model_1 = __importDefault(require("../models/notification.model"));
const axios_1 = __importDefault(require("axios"));
// upload Course
exports.uploadCourse = (0, catchAsyncErrors_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const data = req.body;
        if (!data) {
            return next(new ErrorHandler_1.default("Please fill all the fields.", 400));
        }
        const thumbnail = data.thumbnail;
        if (thumbnail) {
            const myCloud = await cloudinary_1.default.v2.uploader.upload(thumbnail, {
                folder: "courses",
            });
            data.thumbnail = {
                url: myCloud.secure_url,
                public_id: myCloud.public_id,
            };
        }
        (0, course_service_1.createCourse)(data, res, next);
    }
    catch (error) {
        console.log(error);
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
// edit course
exports.editCourse = (0, catchAsyncErrors_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const data = req.body;
        if (!data) {
            return next(new ErrorHandler_1.default("Please fill all the fields.", 400));
        }
        const thumbnail = data.thumbnail;
        const courseId = req.params.id;
        const courseData = await course_model_1.default.findById(courseId);
        if (thumbnail && !thumbnail.startsWith("https")) {
            await cloudinary_1.default.v2.uploader.destroy(data.thumbnail.public_id);
            const myCloud = await cloudinary_1.default.v2.uploader.upload(thumbnail, {
                folder: "courses",
            });
            data.thumbnail = {
                url: myCloud.secure_url,
                public_id: myCloud.public_id,
            };
        }
        if (thumbnail.startsWith("https")) {
            data.thumbnail = {
                url: courseData.thumbnail.url,
                public_id: courseData?.thumbnail.public_id
            };
        }
        const course = await course_model_1.default.findByIdAndUpdate(courseId, { $set: data }, { new: true });
        res.status(200).json({
            success: true,
            message: "Course updated successfully.",
            course,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
// get single course -- without purchasing
exports.getSingleCourse = (0, catchAsyncErrors_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const courseId = req.params.id;
        const isCashedExist = await redis_1.redis.get(courseId);
        if (isCashedExist) {
            const course = JSON.parse(isCashedExist);
            return res.status(200).json({
                success: true,
                course,
            });
        }
        else {
            const course = await course_model_1.default.findById(courseId).select("-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links");
            if (!course) {
                return next(new ErrorHandler_1.default("Course not found", 404));
            }
            await redis_1.redis.set(courseId, JSON.stringify(course), "EX", 604800);
            res.status(200).json({
                success: true,
                course,
            });
        }
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
// get all course -- without purchasing
exports.getAllCourses = (0, catchAsyncErrors_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const isCashedExist = await redis_1.redis.get("allCourses");
        if (isCashedExist) {
            const courses = await course_model_1.default.find().select("-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links");
            await redis_1.redis.set("allCourses", JSON.stringify(courses));
            return res.status(200).json({
                success: true,
                courses,
            });
        }
        else {
            const courses = await course_model_1.default.find().select("-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links");
            await redis_1.redis.set("allCourses", JSON.stringify(courses));
            res.status(200).json({
                success: true,
                courses,
            });
        }
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
// get course content - only for valid user
exports.getCourseByUser = (0, catchAsyncErrors_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const userCourseList = req?.user.courses;
        const courseId = req.params.id;
        const courseExist = userCourseList.find((course) => course._id.toString() === courseId.toString());
        if (!courseExist) {
            return next(new ErrorHandler_1.default("Course not found", 404));
        }
        const course = await course_model_1.default.findById(courseId);
        if (!course) {
            return next(new ErrorHandler_1.default("Course not found", 404));
        }
        const content = course?.courseData;
        res.status(200).json({
            success: true,
            content,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
exports.addQuestion = (0, catchAsyncErrors_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const { question, courseId, contentId } = req.body;
        const course = await course_model_1.default.findById(courseId);
        if (!mongoose_1.default.Types.ObjectId.isValid(contentId)) {
            return next(new ErrorHandler_1.default("Invalid content Id.", 404));
        }
        if (!course) {
            return next(new ErrorHandler_1.default("Course not found", 404));
        }
        const courseContent = course?.courseData?.find((item) => item._id.toString() === contentId);
        if (!courseContent) {
            return next(new ErrorHandler_1.default("Course content not found.", 404));
        }
        // create a new question
        const newQuestion = {
            user: req.user,
            question,
            questionReplies: [],
        };
        // add this question in course content
        courseContent.questions.push(newQuestion);
        await notification_model_1.default.create({
            user: req.user?._id,
            title: "New Question Recieved.",
            message: `${req.user?.name} has asked a question on your course ${course?.name} in ${courseContent?.title}`,
        });
        await course?.save();
        res.status(200).json({
            success: true,
            course,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
exports.addAnswer = (0, catchAsyncErrors_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const { answer, courseId, contentId, questionId } = req.body;
        const course = await course_model_1.default.findById(courseId);
        if (!mongoose_1.default.Types.ObjectId.isValid(contentId)) {
            return next(new ErrorHandler_1.default("Invalid content Id.", 404));
        }
        if (!course) {
            return next(new ErrorHandler_1.default("Course not found", 404));
        }
        const courseContent = course?.courseData?.find((item) => item._id.toString() === contentId);
        if (!courseContent) {
            return next(new ErrorHandler_1.default("Course content not found.", 404));
        }
        const question = courseContent.questions.find((item) => item._id.toString() === questionId);
        // If any error occurs then use item._id.equals(questionId)
        if (!question) {
            return next(new ErrorHandler_1.default("Question not found.", 404));
        }
        // create a new question
        const newAnswer = {
            user: req.user,
            answer,
        };
        // add this question in course content
        question.questionReplies.push(newAnswer);
        await course?.save();
        if (req.user?._id === question.user.id) {
            await notification_model_1.default.create({
                user: req.user?._id,
                title: "New Answer Recieved.",
                message: `${req.user?.name} has replied your question on your course ${course?.name} in ${courseContent?.title}`,
            });
        }
        else {
            const data = {
                name: question.user.name,
                title: courseContent.title,
            };
            const html = await ejs_1.default.renderFile(path_1.default.join(__dirname, "../mails/question-reply.ejs"), data);
            try {
                await (0, sendMail_1.default)({
                    email: question?.user?.email,
                    subject: "Question Reply",
                    template: "question-reply.ejs",
                    data,
                });
            }
            catch (error) {
                return next(new ErrorHandler_1.default(error.message, 400));
            }
        }
        res.status(200).json({
            success: true,
            course,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
exports.addReview = (0, catchAsyncErrors_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const userCourseList = req.user?.courses;
        const courseId = req.params.id;
        const courseExist = userCourseList.find((course) => course._id.toString() === courseId.toString());
        if (!courseExist) {
            return next(new ErrorHandler_1.default("You are not eligible to access this course.", 400));
        }
        const { review, rating } = req.body;
        const course = await course_model_1.default.findById(courseId);
        if (!course) {
            return next(new ErrorHandler_1.default("Course not found.", 404));
        }
        const reviewData = {
            user: req.user,
            comment: review,
            rating,
        };
        course?.reviews?.push(reviewData);
        let avg = 0;
        course?.reviews?.forEach((item) => {
            avg += item.rating;
        });
        if (course) {
            course.ratings = avg / course?.reviews?.length;
        }
        course?.save();
        await redis_1.redis.set(courseId, JSON.stringify(course), "EX", 604800);
        const notification = {
            title: "New Review Recieved.",
            message: `${req.user?.name} has given a review on your course ${course?.name}`,
        };
        // create notification
        res.status(200).json({
            success: true,
            course,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
exports.addReplyToReview = (0, catchAsyncErrors_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const { comment, courseId, reviewId } = req.body;
        const course = await course_model_1.default.findById(courseId);
        if (!course) {
            return next(new ErrorHandler_1.default("Course not found.", 404));
        }
        const review = course?.reviews?.find((item) => item._id.toString() === reviewId.toString());
        if (!review) {
            return next(new ErrorHandler_1.default("Review not found.", 404));
        }
        const replyData = {
            user: req?.user,
            comment,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        if (!review?.commentReplies) {
            review.commentReplies = [];
        }
        review?.commentReplies.push(replyData);
        course?.save();
        await redis_1.redis.set(courseId, JSON.stringify(course), "EX", 604800);
        // create notification
        res.status(200).json({
            success: true,
            course,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
// get all courses only for admin
exports.getAllCoursesAdmin = (0, catchAsyncErrors_1.CatchAsyncError)(async (req, res, next) => {
    try {
        (0, course_service_1.getAllCoursesService)(res);
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
});
// delete course - only admin
exports.deleteCourse = (0, catchAsyncErrors_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const { id } = req.params;
        const course = await course_model_1.default.findById(id);
        if (!course) {
            return next(new ErrorHandler_1.default("Course not found.", 400));
        }
        await course.deleteOne({ id });
        try {
            const res = await redis_1.redis.get("allCourses");
            const allCourses = JSON.parse(res);
            const course = allCourses.findIndex((course) => course._id === id);
            if (course !== -1) {
                allCourses.splice(course, 1);
                // Step 5: Update the allCourses array in Redis
                await redis_1.redis.set('allCourses', JSON.stringify(allCourses));
            }
        }
        catch (error) {
            console.log(error);
        }
        await redis_1.redis.del(id);
        res.status(200).json({
            success: true,
            message: "Course deleted successfully.",
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
});
// generate video url
exports.generateVideoUrl = (0, catchAsyncErrors_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const { videoId } = req.body;
        const response = await axios_1.default.post(
        // `https://dev.vdocipher.com/api/videos/${videoId}/otp`,
        ``, { ttl: 300 }, {
            headers: {
                Authorization: `Bearer ${process.env.VIMEO_ACCESS_TOKEN}`,
                "Content-Type": "application/json",
                Accept: "application/json",
            },
        });
        res.json(response.data);
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
});
