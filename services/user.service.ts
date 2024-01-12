import { Response } from "express";
import userModel from "../models/user.model";

export const getUserById = async (id: string, res: Response) => {
    const user = await userModel.findById(id);
    if (!user) {
        return res.status(404).json({
            ok: false,
            msg: 'User not found'
        });
    }
    res.status(200).json({
        success: true,
        user
    })
}