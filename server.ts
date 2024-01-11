import { app } from "./app";
import connectToDb from "./utils/db";
require("dotenv").config()

// create server
app.listen(process.env.PORT, () => {
    console.log("server listening on port " + process.env.PORT)
    connectToDb()
})