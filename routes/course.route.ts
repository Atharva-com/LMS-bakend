import express from 'express'
import { authorizeRoles, isAuthenticated } from '../middleware/auth'
import { uploadCourse, editCourse, getSingleCourse, getAllCourses, getCourseByUser, addQuestion, addAnswer, addReview, addReplyToReview } from '../controllers/course.controller'

const CourseRouter = express.Router()

CourseRouter.post('/create-course', isAuthenticated, authorizeRoles("admin"), uploadCourse)

CourseRouter.put('/edit-course/:id', isAuthenticated, authorizeRoles("admin"), editCourse)

CourseRouter.get('/get-course/:id', getSingleCourse)

CourseRouter.get('/get-courses', getAllCourses)

CourseRouter.get('/get-course-content/:id', isAuthenticated, getCourseByUser)

CourseRouter.put('/add-question', isAuthenticated, addQuestion)

CourseRouter.put('/add-answer', isAuthenticated, addAnswer)

CourseRouter.put('/add-review/:id', isAuthenticated, addReview)

CourseRouter.put('/add-reply', isAuthenticated, authorizeRoles("admin"), addReplyToReview)

export default CourseRouter