import express from "express";
import { authorizeRoles, isAuthenticated } from "../middleware/auth";
import { getNotifications, updateNotification } from "../controllers/notification.controller";
import { updateAccessToken } from "../controllers/user.controller";

const NotificationRouter = express.Router()

NotificationRouter.get('/get-all-notifications', updateAccessToken, isAuthenticated, authorizeRoles('admin'), getNotifications )

NotificationRouter.put('/update-notification/:id', updateAccessToken, isAuthenticated, authorizeRoles('admin'), updateNotification )

export default NotificationRouter;