import mongoose, { mongo } from "mongoose";
require("dotenv").config();

const dbUrl:string = process.env.DB_URL || ''

const connectToDb = async () => {
    try {
        await mongoose.connect(dbUrl).then((data:any) => {
            console.log(`Database connected .`)
        })
    } catch (error:any) {
        console.log(error.message)
        setTimeout(connectToDb, 5000)
    }
}

export default connectToDb