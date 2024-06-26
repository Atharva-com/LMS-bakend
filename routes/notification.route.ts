import express from "express";
import { authorizeRoles, isAuthenticated } from "../middleware/auth";
import { getNotifications, updateNotification } from "../controllers/notification.controller";

const NotificationRouter = express.Router()

NotificationRouter.get('/get-all-notifications',  isAuthenticated, authorizeRoles('admin'), getNotifications )

NotificationRouter.put('/update-notification/:id',  isAuthenticated, authorizeRoles('admin'), updateNotification )

export default NotificationRouter;