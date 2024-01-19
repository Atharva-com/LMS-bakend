import express from "express";
import { authorizeRoles, isAuthenticated } from "../middleware/auth";
import {
  uploadCourse,
  editCourse,
  getSingleCourse,
  getAllCourses,
  getCourseByUser,
  addQuestion,
  addAnswer,
  addReview,
  addReplyToReview,
  getAllCoursesAdmin,
  deleteCourse,
  generateVideoUrl,
} from "../controllers/course.controller";
import { updateAccessToken } from "../controllers/user.controller";

const CourseRouter = express.Router();

CourseRouter.post(
  "/create-course",
  updateAccessToken,
  isAuthenticated,
  authorizeRoles("admin"),
  uploadCourse
);

CourseRouter.put(
  "/edit-course/:id",
  updateAccessToken,
  isAuthenticated,
  authorizeRoles("admin"),
  editCourse
);

CourseRouter.get("/get-course/:id", getSingleCourse);

CourseRouter.get("/get-courses", getAllCourses);

CourseRouter.get("/get-course-content/:id",updateAccessToken, isAuthenticated, getCourseByUser);

CourseRouter.put("/add-question",updateAccessToken, isAuthenticated, addQuestion);

CourseRouter.put("/add-answer",updateAccessToken, isAuthenticated, addAnswer);

CourseRouter.put("/add-review/:id",updateAccessToken, isAuthenticated, addReview);

CourseRouter.put(
  "/add-reply",
  updateAccessToken,
  isAuthenticated,
  authorizeRoles("admin"),
  addReplyToReview
);

CourseRouter.get(
  "/get-all-courses",
  updateAccessToken,
  isAuthenticated,
  authorizeRoles("admin"),
  getAllCoursesAdmin
);

CourseRouter.delete(
  "/delete-course/:id",
  updateAccessToken,
  isAuthenticated,
  authorizeRoles("admin"),
  deleteCourse
);

CourseRouter.post("/getVdoCipherOTP", generateVideoUrl);

export default CourseRouter;
