import express from "express";
export const app = express();
import cors from "cors";
import cookieParser from "cookie-parser";
import { ErrorMiddleware } from "./middleware/error";
import UserRouter from "./routes/user.route";
import CourseRouter from "./routes/course.route";
import OrderRouter from "./routes/order.route";
import NotificationRouter from "./routes/notification.route";
import analyticsRouter from "./routes/analytics.route";
import layoutRoute from "./routes/layout.route";
import { rateLimit } from 'express-rate-limit'
require("dotenv").config();



// bodyParser
app.use(express.json({ limit: "50mb" }));

// cookieParser
app.use(cookieParser());

// cors => cross origin resource sharing
app.use(
  cors({
    origin: ['https://lms-frontend-xi-bice.vercel.app'],
    credentials: true,
  })
);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});


// routes
app.use("/api/v1", UserRouter, CourseRouter, OrderRouter, NotificationRouter, analyticsRouter, layoutRoute)

// testing api
app.get("/test", (req, res) => {
  //   res.send("Hello World!")
  res.status(200).json({
    message: "Hello World!",
  });
});

// unknwon routes
app.all("*", (req, res, next) => {
  const err = new Error("Unknwon routes");
  res.status(404).json({
    message: err.message,
  });
  next(err);
});

app.use(limiter)

// error handler
app.use(ErrorMiddleware)