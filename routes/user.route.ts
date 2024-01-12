import express from 'express'
import { activateUser, getUserInfo, loginUser, logoutUser, register, socialAuth, updateAccessToken, updateUserInfo } from '../controllers/user.controller'
import { isAuthenticated } from '../middleware/auth'
const UserRouter = express.Router()

UserRouter.post('/registration', register)

UserRouter.post('/activate-user', activateUser)

UserRouter.post('/login', loginUser)

UserRouter.get('/logout', isAuthenticated, logoutUser)

UserRouter.get('/refresh', updateAccessToken)

UserRouter.get('/me', isAuthenticated, getUserInfo)

UserRouter.post('/social-auth', socialAuth)

UserRouter.post('/update-user-info', isAuthenticated, updateUserInfo)

export default UserRouter