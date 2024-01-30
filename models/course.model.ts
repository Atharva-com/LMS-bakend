import mongoose, { Document, Model, Schema } from "mongoose";
require("dotenv").config();
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

interface IQuestionReply extends Document {
    user: IUser,
    answer: string
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
    categories: string,
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
}, {timestamps: true});

const LinkSchema = new Schema<ILink>({
    title: String,
    url: String
})

const answerSchema = new Schema<IQuestionReply>({
    user: {
        type: Object,
    },
    answer: String
}, {timestamps: true});

const commentSchema = new Schema<IComment>({
    user: {
        type: Object,
    },
    question: String,
    questionReplies: [answerSchema]
}, {timestamps: true});

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

