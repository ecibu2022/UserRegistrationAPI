import jwt from "jsonwebtoken"
import { User } from "../models/user.models.js"
import { APIError } from "../utils/APIError.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const verifyJWT = asyncHandler(async (Request, _, next) => {
    const token = Request.cookies.accessToken || Request.header("Authorization")?.replace("Bearer ", "")
    if (!token) {
        throw new APIError(401, "Unauthorized token")
    }

    // Decode token
    try {
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
        if (!user) {
            throw new APIError(401, "Unauthorized user")
        }

        Request.user = user

        next()
    } catch (error) {
        throw new APIError(401, error?.message || "Unauthorized access token")
    }
})

export {verifyJWT}
