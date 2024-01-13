import { Response } from "express";
import { redis } from "../utils/redis";
import userModel from "../models/user.model";

// Get user by id
export const getUserById = async (id: string, res: Response) => {
    const userJson = await redis.get(id);
    if (!userJson) {
        return res.status(404).json({
            success: false,
            msg: 'User not found'
        });
    } else {
        const user = JSON.parse(userJson);
        return res.status(200).json({
            success: true,
            user
        });
    }
}

// get all users
export const getAllUsersService = async (res: Response) => {
    const users = await userModel.find().sort({createdAt: -1});
    return res.status(200).json({
        success: true,
        users
    });
}

// update user role
export const updateUserRoleService = async (res: Response, id: string, role: string) => {
    const user = await userModel.findByIdAndUpdate(id, {role}, {new: true})
    return res.status(200).json({
        success: true,
        user
    });
}