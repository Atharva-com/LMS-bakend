import express from "express";
export const app = express();
import cors from "cors";
import cookieParser from "cookie-parser";
import { ErrorMiddleware } from "./middleware/error";
import userRouter from "./routes/user.route";
require("dotenv").config();

// bodyParser
app.use(express.json({ limit: "50mb" }));

// cookieParser
app.use(cookieParser());

// cors => cross origin resource sharing
app.use(
  cors({
    origin: process.env.ORIGIN,
  })
);

// routes
app.use("/api/v1", userRouter)

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

// error handler
app.use(ErrorMiddleware)