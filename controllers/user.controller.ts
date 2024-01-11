import { Request, Response, NextFunction } from "express";
import userModel, { IUser } from "../models/user.model";
import ErrorHandler from "../utils/ErrorHandler";
import { CatchAsyncError } from "../middleware/catchAsyncErrors";
import jwt, { Secret } from "jsonwebtoken";
import path from "path";
import ejs from "ejs";
import sendMail from "../utils/sendMail";
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
      const { name, email, password } = req.body;

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
          message:
            `Please check your email: ${user.email} to activate your account.`,
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
      const { activation_Code, activation_Token } = req.body;
      const newUser: {user: IUser; activationCode: string} = jwt.verify(
        activation_Token,
        process.env.ACTIVATION_SECRET as Secret
      ) as {user: IUser; activationCode: string}

      if(newUser.activationCode !== activation_Code){
        return next(new ErrorHandler("Invalid activation code", 400))
      }

      const {name, email, password} = newUser.user;

      const existUser = await userModel.findOne({email})

      if(existUser){
        return next(new ErrorHandler("Email already exists", 400))
      }

      const user = userModel.create({
        name,
        email,
        password
      })


      res.status(200).json({
        success: true,
        message: "Account activated successfully",
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

interface ILoginRequest{
  email: string;
  password: string;
}

export const loginUser = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  try {

    const {email, password} = req.body;

    if(!email || !password){
      return next(new ErrorHandler("Please enter email & password", 400))
    }

    const user = await userModel.findOne({ email });

    if(!user){
      return next(new ErrorHandler("Invalid email or password.", 400))
    }

    const isPasswordMatched = await user.comparePassword(password);

    if(!isPasswordMatched){
      return next(new ErrorHandler("Invalid email or password.", 400))
    }
    
  } catch (error) {
    
  }
})