// calling port
import dotenv from "dotenv"

// Calling app.js
import { app } from "./app.js"
import connectToDB from "./db/index.js"

// loading environment variable
dotenv.config({
    path: "./.env"
})

const PORT = process.env.PORT || 7001

// Connect to database
connectToDB()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`The server is running on port ${PORT}`)
        })
    })
    .catch((error) => {
        console.log("Error ocured ", error)
    })
