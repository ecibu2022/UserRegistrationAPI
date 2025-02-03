// First install it npm i cloudinary
import { v2 as cloudinary } from 'cloudinary';

// import inbuilt file storage method fs
import fs from "fs";

// Import dotenv
import dotenv from "dotenv";

dotenv.config()

// Configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadToCloudinary = async (localFilePath) => {
    try {
        // if there is no locafilepath don't proceed
        if (!localFilePath) return null
        // Upload the file
        const Response = await cloudinary.uploader.upload(
            localFilePath, {
            resource_type: "auto"
        }
        )
        console.log("File uplodaed to cloudinary File src: ", Response.url)
        // Delete it from our local storage
        fs.unlinkSync(localFilePath)
        return Response
    } catch (error) {
        fs.unlinkSync(localFilePath)
        return null
    }
}

// Delete file from cloudninary incase user was not created
const deleteFromCloudinary = async (publicId) => {
    try {
        const result = await cloudinary.uploader.destroy(publicId)
    } catch (error) {
        return null
    }
}

export { uploadToCloudinary, deleteFromCloudinary }
