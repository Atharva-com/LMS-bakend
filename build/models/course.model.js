"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
require("dotenv").config();
const reviewSchema = new mongoose_1.Schema({
    user: {
        type: Object,
    },
    rating: {
        type: Number,
        default: 0,
    },
    comment: String,
    commentReplies: [Object]
}, { timestamps: true });
const LinkSchema = new mongoose_1.Schema({
    title: String,
    url: String
});
const answerSchema = new mongoose_1.Schema({
    user: {
        type: Object,
    },
    answer: String
}, { timestamps: true });
const commentSchema = new mongoose_1.Schema({
    user: {
        type: Object,
    },
    question: String,
    questionReplies: [answerSchema]
}, { timestamps: true });
const courseDataSchema = new mongoose_1.Schema({
    title: String,
    description: String,
    videoUrl: String,
    videoSection: String,
    videoLength: Number,
    videoPlayer: String,
    links: [LinkSchema],
    suggestion: String,
    questions: [commentSchema],
});
const courseSchema = new mongoose_1.default.Schema({
    name: {
        type: String,
        required: [true, "Please enter your name"],
    },
    description: {
        type: String,
        required: [true, "Please enter your description"],
    },
    categories: {
        type: String,
        required: [true, "Please enter your categories"],
    },
    price: {
        type: Number,
        required: [true, "Please enter your price"],
        default: 0,
    },
    estimatedPrice: {
        type: Number,
        default: 0,
    },
    thumbnail: {
        public_id: {
            type: String,
            required: true,
        },
        url: {
            type: String,
            required: true,
        },
    },
    tags: {
        type: String,
        required: [true, "Please enter your tags"],
    },
    level: {
        type: String,
        required: [true, "Please enter your level"],
    },
    demoUrl: {
        type: String,
        required: [true, "Please enter your demoUrl"],
    },
    benefits: [{ title: String }],
    prerequisites: [{ title: String }],
    reviews: [reviewSchema],
    courseData: [courseDataSchema],
    ratings: {
        type: Number,
        default: 0,
    },
    purchased: {
        type: Number,
        default: 0,
    },
}, {
    timestamps: true,
});
const CourseModel = mongoose_1.default.model("Course", courseSchema);
exports.default = CourseModel;
