import express from 'express'
import { activateUser, getAllUsers, getUserInfo, loginUser, logoutUser, register, socialAuth, updateAccessToken, updatePassword, updateProfilePicture, updateUserInfo } from '../controllers/user.controller'
import { authorizeRoles, isAuthenticated } from '../middleware/auth'
const UserRouter = express.Router()

UserRouter.post('/registration', register)

UserRouter.post('/activate-user', activateUser)

UserRouter.post('/login', loginUser)

UserRouter.get('/logout', isAuthenticated, logoutUser)

UserRouter.get('/refresh', updateAccessToken)

UserRouter.get('/me', isAuthenticated, getUserInfo)

UserRouter.post('/social-auth', socialAuth)

UserRouter.put('/update-user-info', isAuthenticated, updateUserInfo)

UserRouter.put('/update-user-password', isAuthenticated, updatePassword)

UserRouter.put('/update-user-profile', isAuthenticated, updateProfilePicture)

UserRouter.get('/all-users', isAuthenticated, authorizeRoles('admin'), getAllUsers)

export default UserRouter