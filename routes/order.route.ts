import express from "express";
import { authorizeRoles, isAuthenticated } from "../middleware/auth";
import { createOrder, getAllOrders } from "../controllers/order.controller";
import { updateAccessToken } from "../controllers/user.controller";

const OrderRouter = express.Router();

OrderRouter.post('/create-order',updateAccessToken, isAuthenticated, createOrder)

OrderRouter.get('/all-orders',updateAccessToken, isAuthenticated, authorizeRoles("admin"), getAllOrders)

export default OrderRouter;