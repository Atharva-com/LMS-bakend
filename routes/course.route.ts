import express from 'express'
import { authorizeRoles, isAuthenticated } from '../middleware/auth'
import { uploadCourse, editCourse, getSingleCourse, getAllCourses, getCourseByUser, addQuestion, addAnswer } from '../controllers/course.controller'

const CourseRouter = express.Router()

CourseRouter.post('/create-course', isAuthenticated, authorizeRoles("admin"), uploadCourse)

CourseRouter.put('/edit-course/:id', isAuthenticated, authorizeRoles("admin"), editCourse)

CourseRouter.get('/get-course/:id', getSingleCourse)

CourseRouter.get('/create-courses', getAllCourses)

CourseRouter.get('/get-course-content/:id', isAuthenticated, getCourseByUser)

CourseRouter.put('/add-question', isAuthenticated, addQuestion)

CourseRouter.put('/add-answer', isAuthenticated, addAnswer)

export default CourseRouter