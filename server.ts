import { app } from "./app";
import connectToDb from "./utils/db";
require("dotenv").config()
import http from "http"
import {v2 as cloudinary} from "cloudinary"
// import { initSocketServer } from "./SocketServer";
const server = http.createServer(app)

// cloudinary configuration
cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY, 
    api_secret: process.env.CLOUD_SECRET_KEY

})

// // connect with socketio
// initSocketServer(server)

// create server
server.listen(process.env.PORT, () => {
    console.log("server listening on port " + process.env.PORT)
    connectToDb()
})