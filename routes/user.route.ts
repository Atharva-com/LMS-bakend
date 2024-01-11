import express from 'express'
import { activateUser, register } from '../controllers/user.controller'
const UserRouter = express.Router()

UserRouter.post('/registration', register)
UserRouter.post('/activate-user', activateUser)

export default UserRouter