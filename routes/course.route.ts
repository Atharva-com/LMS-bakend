import express from 'express'
import { authorizeRoles, isAuthenticated } from '../middleware/auth'
import { uploadCourse, editCourse, getSingleCourse } from '../controllers/course.controller'

const CourseRouter = express.Router()

CourseRouter.post('/create-course', isAuthenticated, authorizeRoles("admin"), uploadCourse)
CourseRouter.put('/edit-course/:id', isAuthenticated, authorizeRoles("admin"), editCourse)
CourseRouter.get('/get-course/:id', getSingleCourse)

export default CourseRouter