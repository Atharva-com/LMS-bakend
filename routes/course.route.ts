import express from 'express'
import { createCourse } from '../services/course.service'
import { authorizeRoles, isAuthenticated } from '../middleware/auth'

const CourseRouter = express.Router()

CourseRouter.post('/create-course', isAuthenticated, authorizeRoles('admin'), createCourse)

export default CourseRouter