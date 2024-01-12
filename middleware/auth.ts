import { Request, Response, NextFunction } from "express";
import { CatchAsyncError } from "./catchAsyncErrors";
import jwt, { JwtPayload } from "jsonwebtoken";
import ErrorHandler from "../utils/ErrorHandler";
import { redis } from "../utils/redis";
import { IUser } from "../models/user.model";

export interface IAuthInfoRequest extends Request {
  user: IUser // or any other type
}

export const isAuthenticated = CatchAsyncError(async(req: IAuthInfoRequest, res: Response, next: NextFunction) => {
    const access_token = req.cookies.access_token;

    if (!access_token) {
        return next(new ErrorHandler("Login first to access this resource.", 401));
    }

    const decoded = jwt.verify(access_token, process.env.ACCESS_TOKEN as string) as JwtPayload;

    if(!decoded) {
        return next(new ErrorHandler("access token is not valid .", 400));
    }

    const user = await redis.get(decoded.id);

    if(!user) {
        return next(new ErrorHandler("User does not exist.", 404));
    }

    req.user = JSON.parse(user);
    next()
})

// validate user
export const authorizeRoles = (...roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!roles.includes('user' || "")) {
            return next(new ErrorHandler(`Role is not allowed to access this resource.`, 403));
        }
        next();
    }
}