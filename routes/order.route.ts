import express from "express";
import { authorizeRoles, isAuthenticated } from "../middleware/auth";
import { createOrder, getAllOrders, newPayment, sendStripePublishableKey } from "../controllers/order.controller";

const OrderRouter = express.Router();

OrderRouter.post('/create-order', isAuthenticated, createOrder)

OrderRouter.get('/all-orders', isAuthenticated, authorizeRoles("admin"), getAllOrders)

OrderRouter.get("/payment/stripepublishalblekey", sendStripePublishableKey)

OrderRouter.get("/payment", isAuthenticated, newPayment)

export default OrderRouter;