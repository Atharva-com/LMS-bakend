import mongoose, { Document, Model, Schema } from "mongoose";
require("dotenv").config();
import bcryptjs from "bcryptjs";
import jwt, { Secret } from "jsonwebtoken";
import { IUser } from "./user.model";


interface IComment extends Document {
    user: IUser,
    question: string,
    questionReplies: IComment[]
}


interface IReview extends Document {
    user: IUser,
    rating: number,
    comment: string,
    commentReplies?: IComment[]
}

interface ILink extends Document {
    title: string,
    url: string
}

interface ICourseData extends Document {
    title: string,
    description: string,
    videoUrl: string,
    videoThumbnail: object,
    videoSection: string,
    videoLength: number,
    videoPlayer: string,
    links: ILink[],
    suggestion: string,
    questions: IComment[],
}

interface ICourse extends Document {
    name: string,
    description: string,
    price: number,
    estimatedPrice?: number,
    thumbnail: object,
    tags: string,
    level: string,
    demoUrl: string,
    benefits: {title: string}[],
    prerequisites: {title: string}[],
    reviews: IReview[],
    courseData: ICourseData[]
    ratings?: number,
    purchased?: number
}

const reviewSchema = new Schema<IReview>({
    user: {
        type: Object,
    },
    rating: {
        type: Number,
        default: 0,
    },
    comment: String,
    commentReplies: [Object]
});

const LinkSchema = new Schema<ILink>({
    title: String,
    url: String
})

const commentSchema = new Schema<IComment>({
    user: {
        type: Object,
    },
    question: String,
    questionReplies: [Object]
});

const courseDataSchema = new Schema<ICourseData>({
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

const courseSchema: Schema<ICourse> = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Please enter your name"],
            maxLength: [30, "Your name cannot exceed 30 characters"],
        },
        description: {
            type: String,
            required: [true, "Please enter your description"],
            maxLength: [500, "Your description cannot exceed 500 characters"],
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
        benefits: [{title: String}],
        prerequisites: [{title: String}],
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
    },
    {
        timestamps: true,
    }
);

const CourseModel: Model<ICourse> = mongoose.model("Course", courseSchema);

export default CourseModel;

