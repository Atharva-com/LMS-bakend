import express from 'express'
import { activateUser, loginUser, logoutUser, register } from '../controllers/user.controller'
import { isAuthenticated } from '../middleware/auth'
const UserRouter = express.Router()

UserRouter.post('/registration', register)
UserRouter.post('/activate-user', activateUser)
UserRouter.post('/login', loginUser)
UserRouter.get('/logout', isAuthenticated, logoutUser)


export default UserRouter