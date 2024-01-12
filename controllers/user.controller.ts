import { Request, Response, NextFunction } from "express";
import userModel, { IUser } from "../models/user.model";
import ErrorHandler from "../utils/ErrorHandler";
import { CatchAsyncError } from "../middleware/catchAsyncErrors";
import jwt, { JwtPayload, Secret } from "jsonwebtoken";
import path from "path";
import ejs from "ejs";
import sendMail from "../utils/sendMail";
import { accessTokenOptions, refreshTokenOptions, sendtoken } from "../utils/jwt";
import bcryptjs from "bcryptjs";
import { redis } from "../utils/redis";
import { getUserById } from "../services/user.service";
require("dotenv").config();

// register User
interface IRegistrationBody {
  name: string;
  email: string;
  password: string;
  avatar?: string;
}

export const register = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, email, password } = req.body as IRegistrationBody;

      const isEmailExist = await userModel.findOne({ email });
      if (isEmailExist) {
        return next(new ErrorHandler("Email already exists", 400));
      }
      const user: IRegistrationBody = {
        name,
        email,
        password,
      };

      const activationToken = createActivationToken(user);
      const activationCode = activationToken.activationCode;
      const data = { user: { name: user.name }, activationCode };
      const html = await ejs.renderFile(
        path.join(__dirname, "../mails/activation-mail.ejs"),
        data
      );

      try {
        await sendMail({
          email: user.email,
          subject: "Activate Your Account",
          template: "activation-mail.ejs",
          data,
        });

        res.status(200).json({
          success: true,
          message: `Please check your email: ${user.email} to activate your account.`,
          activationToken: activationToken.token,
        });
      } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
      }
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// create activation token

interface IActivationToken {
  token: string;
  activationCode: string;
}

export const createActivationToken = (user: any): IActivationToken => {
  const activationCode = Math.floor(1000 + Math.random() * 9000).toString();

  const token = jwt.sign(
    {
      user,
      activationCode,
    },
    process.env.ACTIVATION_SECRET as Secret,
    {
      expiresIn: "5m",
    }
  );

  return { token, activationCode };
};

// activate user account
interface IActivationRequest {
  activation_Code: string;
  activation_Token: string;
}

export const activateUser = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { activation_Code, activation_Token } =
        req.body as IActivationRequest;
      const newUser: { user: IUser; activationCode: string } = jwt.verify(
        activation_Token,
        process.env.ACTIVATION_SECRET as Secret
      ) as { user: IUser; activationCode: string };

      if (newUser.activationCode !== activation_Code) {
        return next(new ErrorHandler("Invalid activation code", 400));
      }

      const { name, email, password } = newUser.user;
      // const hashedPassword = bcryptjs.hashSync(password, 10)
      const existUser = await userModel.findOne({ email });

      if (existUser) {
        return next(new ErrorHandler("Email already exists", 400));
      }

      const user = userModel.create({
        name,
        email,
        password,
      });
      await (await user).save();

      res.status(200).json({
        success: true,
        message: "Account activated successfully",
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// Login User

interface ILoginRequest {
  email: string;
  password: string;
}

export const loginUser = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body as ILoginRequest;

      if (!email || !password) {
        return next(new ErrorHandler("Please enter email & password", 400));
      }

      const user = await userModel.findOne({ email }).select("+password");

      console.log(user);

      if (!user) {
        return next(new ErrorHandler("Invalid email or password.", 400));
      }

      const hashedPassword = bcryptjs.hashSync(password, 10);
      console.log(hashedPassword);
      console.log(user.password);
      const isPasswordMatched = user.comparePassword(password);

      console.log(isPasswordMatched);

      if (!isPasswordMatched) {
        return next(new ErrorHandler("Invalid password.", 400));
      }

      sendtoken(user, 200, res);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// logout user
export interface IGetUserAuthInfoRequest extends Request {
  user: IUser // or any other type
}

export const logoutUser = CatchAsyncError(
  async (req: IGetUserAuthInfoRequest, res: Response, next: NextFunction) => {
    try {
      res.clearCookie("access_token");
      res.clearCookie("refresh_token");
      const userId = req.user?._id || "";
      redis.del(userId);
      res.status(200).json({
        success: true,
        message: "Logged out successfully.",
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// update access token 
export const updateAccessToken = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const refresh_token = req.cookies.refresh_token as string;
      
      const decoded = jwt.verify(
        refresh_token,
        process.env.REFRESH_TOKEN as string
      ) as JwtPayload;

      const message = 'Could not refresh token.'
      if (!decoded) {
        return next(new ErrorHandler(message, 400));
      }

      const session = await redis.get(decoded.id as string)

      if (!session) {
        return next(new ErrorHandler(message, 400));
      }

      const user = JSON.parse(session);

      const accessToken = jwt.sign(
        { id: user._id },
        process.env.ACCESS_TOKEN as string,
        { expiresIn: "5m" }
      );

      const refreshToken = jwt.sign(
        { id: user._id },
        process.env.REFRESH_TOKEN as string,
        { expiresIn: "7d" }
      );

      res.cookie("access_token", accessToken, accessTokenOptions)
      res.cookie("refresh_token", refreshToken, refreshTokenOptions)
      
      res.status(200).json({
        success: true,
        accessToken,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// get user by id

export interface IGetUserById extends Request {
  user: IUser // or any other type
}

export const getUserInfo = CatchAsyncError(
  async (req: IGetUserById, res: Response, next: NextFunction) => {
    try {
      const userId  = req.user._id
      getUserById(userId, res)
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);


// social authorization

interface ISocialAuthBody {
  email: string;
  name: string;
  avatar: string;

}

export const socialAuth = CatchAsyncError(async (req:Request, res: Response, next: NextFunction) => {
  try {
    const { email, name, avatar } = req.body as ISocialAuthBody
    const user = await userModel.findOne({ email });
    if (!user) {
      const newUser = await userModel.create({
        name,
        email,
        avatar
      })
      await newUser.save()
      sendtoken(newUser, 200, res)
    } else {
      sendtoken(user, 200, res)
    }
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 400));
  }
})