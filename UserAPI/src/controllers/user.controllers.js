import { APIError } from "../utils/APIError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.models.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";
import { APIResponse } from "../utils/APIResponse.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

// Import dotenv
import dotenv from "dotenv";

// Add axios for making HTTP requests
import axios from "axios"; 

//Initialize dotenv to access environment variables
dotenv.config()

// Get all users
const getUsers = asyncHandler(async (Request, Response) => {
    try {
        const users = await User.find(); // Assuming 'User' is your Mongoose model for users
        return Response
            .status(200)
            .json(new APIResponse(200, users, "Available Users", true));
    } catch (error) {
        return Response
            .status(500)
            .json(new APIResponse(500, null, "Error fetching users", false));
    }
});

// Get User
const getUserById = asyncHandler(async (Request, Response) => {
    try {
        const userId = Request.params.id; // Assuming the user ID is passed in the URL like /users/:id
        const user = await User.findById(userId); // Find user by ID

        if (!user) {
            return Response
                .status(404)
                .json(new APIResponse(404, null, "User not found", false));
        }

        return Response
            .status(200)
            .json(new APIResponse(200, user, "User found", true));
    } catch (error) {
        return Response
            .status(500)
            .json(new APIResponse(500, null, "Error fetching user", false));
    }
});

// Generate access and refresh tokens
const generateAccessTokenandRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId)

        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken

        await user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }
    } catch (error) {
        throw new APIError(500, "Error generating access and refresh tokens")
    }
}

const registerUser = asyncHandler(async (Request, Response) => {
    // Accept request from front end
    const { fullname, email, username, password } = Request.body;

    // Do validation here
    if (fullname?.trim() === "")
        throw new APIError(400, "Fullname is empty");
    
    if ([email, username, password].some((field) => field?.trim() === "")) {
        throw new APIError(400, "All fields are required");
    }

    // Check if a user already exists by username or email
    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    });

    if (existedUser) {
        throw new APIError(409, "User already exists");
    }

    // Handle images (files are uploaded)
    const avatarLocalFilePath = Request.files?.avatar[0]?.path;
    const coverImageLocalFilePath = Request.files?.coverImage[0]?.path;

    if (!avatarLocalFilePath) {
        throw new APIError(409, "Avatar is required");
    }

    let avatar, coverImage;
    try {
        // Upload files to cloudinary
        avatar = await uploadToCloudinary(avatarLocalFilePath);
        coverImage = await uploadToCloudinary(coverImageLocalFilePath);
    } catch (error) {
        throw new APIError(500, "Failed to upload avatar or coverImage");
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
        });

        // Find user by id and exclude password and refreshToken
        const createdUser = await User.findById(user._id).select("-password -refreshToken");

        if (!createdUser) {
            throw new APIError(500, "Something went wrong while registering a user");
        }

        // Now, sync this data to Business Central (Make API call to BC)
        const bcUrl = process.env.BC_URL;

        // Set up Basic Authentication
        const usernameBC = process.env.BC_USERNAME;  // Business Central Username
        const passwordBC = process.env.BC_PASSWORD;  // Business Central Password

        const auth = 'Basic ' + Buffer.from(`${usernameBC}:${passwordBC}`).toString('base64');

        try {
            const response = await axios.post(bcUrl, {
                username: user.username,
                email: user.email,
                fullname: user.fullname
            }, {
                headers: {
                    'Authorization': auth,
                    'Content-Type': 'application/json',
                    'Accept': '*/*'
                }
            });

            if (response.status !== 200) {
                throw new APIError(401, "Error sending data to Business Central");
            }

            // Success response after everything
            return Response.status(201).json(
                new APIResponse(200, createdUser, "User has been registered successfully and synced with Business Central", true)
            );

        } catch (error) {
            // Log any errors with Business Central sync
            if (error.response) {
                console.error("Error response from Business Central:", error.response.data);
            } else if (error.request) {
                console.error("Error request made but no response:", error.request);
            } else {
                console.error("Error message:", error.message);
            }

            // Throw a custom error after sync failure
            throw new APIError(500, "Error while syncing data to Business Central");
        }

    } catch (error) {
        // If an error occurred, clean up the cloudinary uploads
        if (avatar) {
            await deleteFromCloudinary(avatar.public_id);
        }
        if (coverImage) {
            await deleteFromCloudinary(coverImage.public_id);
        }

        throw new APIError(500, "Something went wrong while registering a user");
    }
});

//Login a user
const loginUser = asyncHandler(async (Request, Response) => {
    // Get request data from the body
    const { email, username, password } = Request.body

    // Validation
    if (!email) {
        throw new APIError(400, "Email is required")
    }

    // Find a user (look for either username or email)
    const user = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (!user) {
        throw new APIError(404, "User not found")
    }

    // Validate password by comparing hashed password in database with the entered password
    const isPasswordCorrect = await bcrypt.compare(password, user.password)

    if (!isPasswordCorrect) {
        throw new APIError(404, "Invalid Password")
    }

    // If password is correct, generate access token and refresh token
    const { accessToken, refreshToken } = await generateAccessTokenandRefreshToken(user._id)

    // Select user details (excluding password and refresh token for security)
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    // Cookie options for security
    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production" // Use secure cookies in production
    }

    // Send success response along with the tokens and user info
    return Response
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(new APIResponse(
            200,
            { user: loggedInUser, accessToken, refreshToken },
            "User logged in successfully",
            true
        ))
})

//Logout a user
const logoutUser = asyncHandler(async (Request, Response) => {
    await User.findByIdAndUpdate(
        Request.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production"
    }

    return Response
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new APIResponse(
            200,
            {},
            "User logged out successfully",
            true
        ))
})

// Refresh Access Token
const refreshAccessToken = asyncHandler(async (Request, Response) => {
    const incomingRefreshAccessToken = Request.cookies.refreshToken || Request.body.refreshToken
    if (!incomingRefreshAccessToken) {
        throw new APIError(401, "Refresh Token is required")
    }

    // Decode Access Token
    try {
        const decodedToken = jwt.verify(
            incomingRefreshAccessToken,
            process.env.REFRESH_TOKEN_SECRET
        )

        const user = await User.findById(decodedToken?._id)

        if (!user) {
            throw new APIError(401, "Invalid Refresh Token")
        }

        if (incomingRefreshAccessToken !== user?.refreshToken) {
            throw new APIError(401, "Invalid Refresh Token")
        }

        const options = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production"
        }
        const { accessToken, refreshToken: newRefreshToken } = await generateAccessTokenandRefreshToken(user._id)

        return Response
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(new APIResponse(
                200,
                { accessToken, refreshToken: newRefreshToken },
                "Access Token refreshed successfully",
                true
            ))
    } catch (error) {
        throw new APIError(500, "Something went wrong while refreshing access token")
    }
})

// Change password
const changeUserPassword = asyncHandler(async (Request, Response) => {
    // Get old password and new password
    const { oldPassword, newPassword } = Request.body
    // Find user by id
    const user = await User.findById(Request.user?._id)

    const isPasswordValid = user.isPasswordCorrect(oldPassword)
    if (!isPasswordValid) {
        throw new APIError(500, "Invalid password")
    }

    user.password = newPassword
    // Save data
    await user.save({ validateBeforeSave: false })

    return Response
        .status(200)
        .json(new APIResponse(200, {}, "Password changed successfully", true))
})

const getCurrentUser = asyncHandler(async (Request, Response) => {
    return Response
        .status(200)
        .json(new APIResponse(200, Request.user, "Current user details", true))
})

const updateUserDetails = asyncHandler(async (Request, Response) => {
    // Define what to be updated
    const { fullname, email } = Request.body

    if (!fullname || !email) {
        throw new APIError(500, "Fill in name and email")
    }

    const user = await User.findByIdAndUpdate(
        Request.user?._id,
        {
            $set: { fullname, email }
        },
        {
            new: true
        }
    ).select("-password")

    return Response
        .status(200)
        .json(new APIResponse(200, user, "Account details updated successfully", true))
})

const updateUserAvatar = asyncHandler(async (Request, Response) => {
    const avatarLocalFilePath = Request.file?.path
    if (!avatarLocalFilePath) {
        throw new APIError(500, "Avatar file is required")
    }

    const avatar = await uploadToCloudinary(avatarLocalFilePath)
    if (!avatar.url) {
        throw new APIError(400, "No avatar file url specified")
    }

    const user = await User.findByIdAndUpdate(
        Request.user?._id,
        {
            $set: { avatar: avatar.url }
        },
        {
            new: true
        }
    ).select("-password")

    return Response
        .status(200)
        .json(new APIResponse(200, user, "Avatar updated successfully", true))
})

const updateUserCoverImage = asyncHandler(async (Request, Response) => {
    const coverImageLocalFilePath = Request.file?.path
    if (!coverImageLocalFilePath) {
        throw new APIError(500, "coverImage file is required")
    }

    const coverImage = await uploadToCloudinary(coverImageLocalFilePath)
    if (!coverImage.url) {
        throw new APIError(400, "No coverImage file url specified")
    }

    const user = await User.findByIdAndUpdate(
        Request.user?._id,
        {
            $set: { coverImage: coverImage.url }
        },
        {
            new: true
        }
    ).select("-password")

    return Response
        .status(200)
        .json(new APIResponse(200, user, "Cover Image updated successfully", true))
})

// use {} to export many constants or functions
export {
    getUsers,
    getUserById,
    registerUser,
    loginUser,
    refreshAccessToken,
    logoutUser,
    changeUserPassword,
    getCurrentUser,
    updateUserAvatar,
    updateUserCoverImage,
    updateUserDetails
}
// Go to Postman and test it