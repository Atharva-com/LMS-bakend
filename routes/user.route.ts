import express from 'express'
import { activateUser, deleteUser, getAllUsers, getUserInfo, loginUser, logoutUser, register, socialAuth,  updatePassword, updateProfilePicture, updateUserInfo, updateUserRole } from '../controllers/user.controller'
import { authorizeRoles, isAuthenticated } from '../middleware/auth'
const UserRouter = express.Router()

UserRouter.post('/registration', register)

UserRouter.post('/activate-user', activateUser)

UserRouter.post('/login', loginUser)

UserRouter.get('/logout', isAuthenticated, logoutUser)

// UserRouter.get('/refresh', updateAccessToken)

UserRouter.get('/me', isAuthenticated, getUserInfo)

UserRouter.post('/social-auth', socialAuth)

UserRouter.put('/update-user-info', isAuthenticated, updateUserInfo)

UserRouter.put('/update-user-password', isAuthenticated, updatePassword)

UserRouter.put('/update-user-profile', isAuthenticated, updateProfilePicture)

UserRouter.get('/all-users', isAuthenticated, authorizeRoles('admin'), getAllUsers)

UserRouter.put('/update-user-role', isAuthenticated, authorizeRoles('admin'), updateUserRole)

UserRouter.delete('/delete-user/:id', isAuthenticated, authorizeRoles('admin'), deleteUser)

export default UserRouter