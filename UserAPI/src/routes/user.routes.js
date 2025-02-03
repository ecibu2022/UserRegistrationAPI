// Call Router from express
import { Router } from "express";

// Call registerUser controller
import { registerUser, logoutUser, loginUser, refreshAccessToken, changeUserPassword, getCurrentUser, updateUserDetails, updateUserAvatar, getUsers, getUserById } from "../controllers/user.controllers.js";

// Include multer for uploading files
import { upload } from "../middlewares/multer.middlewares.js";

// Import auth middle to inject
import { verifyJWT } from "../middlewares/auth.middlewares.js";

// create the route
const router = Router()

// Unsecured routes
// Get all users
router.route("/").get(getUsers);

// Get a single user
router.route("/:id").get(getUserById);

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
// Go to app.js and call it to use it