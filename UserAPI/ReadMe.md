# API Documentation for VidTube API

This documentation will guide you through the structure, setup, and usage of the VidTube API. The project is built using **Node.js** with **Express** and uses **MongoDB** as the database. 

## Table of Contents
1. [File Structure](#file-structure)
2. [API Setup](#api-setup)
3. [Creating Controllers](#creating-controllers)
4. [Creating Routes](#creating-routes)
5. [Connecting Routes in App.js](#connecting-routes-in-appjs)
6. [Testing the API with Postman](#testing-the-api-with-postman)
7. [Running the API](#running-the-api)
8. [Installed Dependencies](#installed-dependencies)

---

## 1. File Structure

Here is the standard file structure for the VidTube API project:

```
src/
│
├── controllers/          # Contains all controller files for handling requests
├── routes/               # Contains route files for API endpoints
├── models/               # Contains all Mongoose model files
├── utils/                # Contains utility functions (e.g., helpers, constants)
├── middlewares/          # Contains middleware functions (e.g., authentication)
├── db/                   # Database connection file
├── public/               # Static assets (e.g., images)
│
├── .env                  # Environment variables (e.g., DB URI, JWT secret)
├── index.js              # Main entry point for the API
├── app.js                # Calling entry point for the API routes
├── prettier               # Prettier configuration file
└── package.json          # Project metadata and dependencies
```

---

## 2. API Setup

### Installing Dependencies

In order to set up the API, you will need to install dependencies using npm. Here is a list of the necessary packages and how to install them:

```bash
npm install bcrypt cloudinary cookie-parser cors dotenv express jsonwebtoken mongoose mongoose-aggregate-paginate-v2 multer
npm install --save-dev nodemon prettier
```

- **nodemon** - Automatically restarts the server when changes are made during development.
- **prettier** - A code formatter to ensure code consistency.
- **express** - Web framework for Node.js.
- **mongoose** - MongoDB object modeling tool for Node.js.
- **bcrypt** - Used for hashing passwords.
- **cloudinary** - For image upload and storage.
- **cookie-parser** - Parses cookies in incoming requests.
- **cors** - Cross-origin resource sharing middleware for handling requests from different origins.
- **dotenv** - For managing environment variables.
- **jsonwebtoken** - For creating and verifying JWT tokens.
- **multer** - For handling file uploads (avatars, cover images).

---

## 3. Creating Controllers

Each API route will have an associated controller. A controller contains the logic for handling incoming requests (e.g., creating a user, logging in).

### Example Controller (UserController.js)

1. Inside the `controllers/` folder, create a `userController.js` file:
   
```js
import User from "../models/User.js";
import bcrypt from "bcrypt";
import { APIError } from "../utils/APIError.js";
import { APIResponse } from "../utils/APIResponse.js";

const registerUser = asyncHandler(async (Request, Response) => {
    // Accept request from front end
    const { fullname, email, username, password } = Request.body

    // Do validation here
    if (fullname?.trim() === "")
        throw new APIError(400, "Fullname is empty")
    // or
    if ([
        email,
        username,
        password
    ].some((field) => field?.trim() === "")
    ) {
        throw new APIError(400, "All fields are required")
    }

    // Check if a user alredy exists by username or email
    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (existedUser) {
        throw new APIError(409, "User already exists")
    }

    // Handle images
    // They come from files
    const avatarLocalFilePath = Request.files?.avatar[0]?.path
    const coverImageLocalFilePath = Request.files?.coverImage[0]?.path

    if (!avatarLocalFilePath) {
        throw new APIError(409, "Avatar is required")
    }

    // Upload files to cloudinary professional way
    let avatar;
    try {
        avatar = await uploadToCloudinary(avatarLocalFilePath)
    } catch (error) {
        throw new APIError(500, "Failed to upload avatar")
    }

    let coverImage;
    try {
        coverImage = await uploadToCloudinary(coverImageLocalFilePath)
    } catch (error) {
        throw new APIError(500, "Failed to upload coverImage")
    }

    try {
        // Hash the password before saving to the database
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create the user
        const user = await User.create({
            fullname,
            avatar: avatar.url,
            coverImage: coverImage?.url || "",
            email,
            password: hashedPassword,
            username: username.toLowerCase()
        })

        // Find user by id use select to remove fields you do  not want to be queried
        const createdUser = await User.findById(user._id).select(
            "-password -refreshToken"
        )

        if (!createdUser) {
            throw new APIError(500, "Something went wrong while registering a user")
        }

        // Send response to front end if successfull
        return Response
            .status(201)
            .json(new APIResponse(200, createdUser, "User has been registered successfully", true))
    } catch (error) {
        // If an error occurred and avatar was uploaded delete it from cloudinary
        if (avatar) {
            await deleteFromCloudinary(avatar.public_id)
        }
        if (coverImage) {
            await deleteFromCloudinary(coverImage.public_id)
        }

        throw new APIError(500, "Something went wrong while registering a user")
    }
})
```

- **registerUser** handles the user registration by checking if the user already exists, hashing the password, and saving the user in the database.

---

## 4. Creating Routes

Once controllers are created, you need to define routes to map HTTP requests to the appropriate controller functions.

### Example Route (userRoutes.js)

2. Inside the `routes/` folder, create `userRoutes.js`:

```js
// Call Router from express
import { Router } from "express";

// Call registerUser controller
import { registerUser, logoutUser, loginUser, refreshAccessToken, changeUserPassword, getCurrentUser, updateUserDetails, updateUserAvatar } from "../controllers/user.controllers.js";

// Include multer for uploading files
import { upload } from "../middlewares/multer.middlewares.js";

// Import auth middle to inject
import { verifyJWT } from "../middlewares/auth.middlewares.js";

// create the route
const router = Router()

// Unsecured routes
// Register the user using POST request
router.route("/register").post(
    upload.fields(
        [
            {
                name: "avatar",
                maxCount: 1 //Allow only one avatar image
            },
            {
                name: "coverImage",
                maxCount: 1
            }
        ]
    ), //Allow uploading of many files like avatar, coverImage
    registerUser
)
// login a user
router.route("/login").post(loginUser)

router.route("/refresh-token").post(refreshAccessToken)

// Secured routes
router.route("/logout").post(verifyJWT, logoutUser)

router.route("/change-password").post(verifyJWT, changeUserPassword)

router.route("/current-user").get(verifyJWT, getCurrentUser)

router.route("/update-account/details").patch(verifyJWT, updateUserDetails)

router.route("/avatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar)

export default router
```

- This file defines the API route for user registration. The `/register` endpoint uses the `registerUser` controller function.

---

## 5. Connecting Routes in `app.js`

In your main `index.js` file (or `app.js`), you need to import and connect all the routes to the application:

### Example app.js

3. In your `src/index.js` (or `app.js`), set up the express app to use routes:

```js
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
import healthCheckRouter from "./routes/healthcheck.routes.js"
import registerUserRouter from "./routes/user.routes.js";
import loginUserRouter from "./routes/user.routes.js";

// Routes
// create its middleware
// When a user visits /api/v1/healthcheck healthcheckrouter will handle it
app.use("/api/v1/healthcheck", healthCheckRouter)
// Now go to postman and test it type http://localhost:7000/api/v1/healthcheck its a GET request

app.use("/api/v1/users", registerUserRouter)
// Now go to Postman and test it type http://localhost:7000/api/v1/users/register its a POST request

app.use("/api/v1/users", loginUserRouter)
// Now go to Postman and test it type http://localhost:7000/api/v1/users/login its a POST request

export { app }
```

- **app.js** initializes the express app and sets up middleware for parsing JSON and handling cookies. It then imports and uses the `userRoutes` for handling `/api/users/*` routes.

---

## 6. Testing the API with Postman

After setting up the API, you can use **Postman** to test your endpoints.

1. **Start your server**:
   - Run `npm run dev` to start the server using **nodemon**.

2. **Test the Registration Endpoint**:
   - Open Postman.
   - Set the method to **POST** and the URL to `http://localhost:7000/api/users/register`.
   - In the request body, use **form-data** for file uploads and provide JSON data for the user.
   
   Example of request body:
   - `fullname`: John Doe
   - `email`: johndoe@example.com
   - `username`: johndoe
   - `password`: secret123
   - `avatar`: (choose an image file)
   - `coverImage`: (optional image file)

3. **Check the response** for a successful user registration.

---

## 7. Running the API

To start your API:

1. **Start the server in development mode**:

```bash
npm run dev
```

- This will start the API using **nodemon** and automatically restart the server when changes are made.

2. **Access the API**:
   - The API will be accessible at `http://localhost:7000`.

---

## 8. Installed Dependencies

Here’s a list of the installed dependencies and their usage:

```json
"devDependencies": {
  "nodemon": "^3.1.9",  // Automatically restarts server during development
  "prettier": "^3.4.2"   // Code formatting
},
"dependencies": {
  "bcrypt": "^5.1.1",                      // For hashing passwords
  "cloudinary": "^2.5.1",                  // For image upload and storage
  "cookie-parser": "^1.4.7",               // For parsing cookies
  "cors": "^2.8.5",                        // For handling CORS requests
  "dotenv": "^16.4.7",                     // For managing environment variables
  "express": "^4.21.2",                    // Express framework for routing
  "jsonwebtoken": "^9.0.2",                // For creating and verifying JWT tokens
  "mongoose": "^8.9.2",                    // MongoDB ODM for interacting with MongoDB
  "mongoose-aggregate-paginate-v2": "^1.1.2", // For pagination with MongoDB aggregates
  "multer": "^1.4.5-lts.1"                 // For handling file uploads
}
```

---

This concludes the documentation for the VidTube API project. Following these steps will help you set up the API and test it efficiently with Postman.