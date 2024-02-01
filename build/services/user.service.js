"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserRoleService = exports.getAllUsersService = exports.getUserById = void 0;
const redis_1 = require("../utils/redis");
const user_model_1 = __importDefault(require("../models/user.model"));
// Get user by id
const getUserById = async (id, res) => {
    const userJson = await redis_1.redis.get(id);
    if (!userJson) {
        return res.status(404).json({
            success: false,
            msg: 'User not found'
        });
    }
    else {
        const user = JSON.parse(userJson);
        return res.status(200).json({
            success: true,
            user
        });
    }
};
exports.getUserById = getUserById;
// get all users
const getAllUsersService = async (res) => {
    const users = await user_model_1.default.find().sort({ createdAt: -1 });
    return res.status(200).json({
        success: true,
        users
    });
};
exports.getAllUsersService = getAllUsersService;
// update user role
const updateUserRoleService = async (res, id, role) => {
    const user = await user_model_1.default.findByIdAndUpdate(id, { role }, { new: true });
    return res.status(200).json({
        success: true,
        user
    });
};
exports.updateUserRoleService = updateUserRoleService;
