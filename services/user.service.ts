import { Response } from "express";
import { redis } from "../utils/redis";

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