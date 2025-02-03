import express from "express"

// Use cors to determine which applications can access your API
// Run npm i cors to install it
import cors from "cors"

// Handling cookies using cookie parser
import cookieParser from "cookie-parser";

const app = express()

// Define your middleware
app.use(
    cors(
        {
            origin: process.env.CORS_ORIGIN,
            Credential: true
        }
    )
)

// Allow epress json data middleware
app.use(express.json({ limit: "16kb" }))
app.use(express.urlencoded({ extended: true, limit: "16kb" }))
// Serve assets
app.use(express.static("public"))
// Add cookie-parser middleware
app.use(cookieParser())

// Import Routes
import registerUserRouter from "./routes/user.routes.js";
import loginUserRouter from "./routes/user.routes.js";

// Routes
// create its middleware
app.use("/api/v1/users", registerUserRouter)
// Now go to Postman and test it type http://localhost:7000/api/v1/users/register its a POST request

app.use("/api/v1/users", loginUserRouter)
// Now go to Postman and test it type http://localhost:7000/api/v1/users/login its a POST request

export { app }
