import express from "express";
import { authorizeRoles } from "../middleware/auth";
import { getNotifications } from "../controllers/notification.controller";

const NotificationRouter = express.Router()

NotificationRouter.get('/get-all-notifications', authorizeRoles('admin'), getNotifications )

export default NotificationRouter;