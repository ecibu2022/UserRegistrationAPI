// Creating the user model ie a model is your database
// Import mongoose database
import mongoose, { Schema } from "mongoose";

// Import bcrypt to encrypt the password
import bcrypt from "bcrypt";

// Import jwt to generate tokens
import jwt from "jsonwebtoken";

// Create Schema instance
const userSchema = new Schema(
  {
    // Define your fields here for the table in mongo db
    // mongo db adds _id field as PK
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    fullname: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    avatar: {
      type: String,
      required: true
    },
    coverImage: {
      type: String
    },
    password: {
      type: String,
      required: [true, "Password is required"]
    },
    refreshToken: {
      type: String
    }
  },
  // capture timestamps
  {
    timestamps: true
  }
)

// Hash the password using bcrypt npm i bcrypt
// Use a pre save hook for that
userSchema.pre("save", async function (next) {
  // hash password only on saving
  if (!this.isModified("password")) return next();
  // use this keyword to access fields
  this.password = bcrypt.hash(this.password, 10);
  // Pass to he next middleware
  next()
})

// Compare the passwords if they are matching
userSchema.methods.isPasswordCorrect=async function (password) {
  return await bcrypt.compare(password, this.password) //await because it is a long process it will take some time doing it
}

// Get access and refresh tokens using JWT JSON Web Tokens for authentication of users
// Install using npm i jsonwebtoken
userSchema.methods.generateAccessToken = function () {
  // Short lived access token
 return jwt.sign(
    {
      // Store payload to user id
      _id: this._id,
      email: this.email //In production we get only id then other details we make database query to obtain them
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn:process.env.ACCESS_TOKEN_EXPIRY
    }
)
}

// Get refresh tokens using JWT JSON Web Tokens for authentication of users
// Install using npm i jsonwebtoken
userSchema.methods.generateRefreshToken = function () {
  // Short lived access token
  return jwt.sign(
    {
      // Store payload to user id
      _id: this._id
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY
    }
  )
}

// Export your model
export const User = mongoose.model("User", userSchema)