import mongoose from "mongoose";

import { DB_NAME } from "../constants.js";

// We use async because the database is in another continent
const connectToDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        console.log('MongoDB connected:', connectionInstance.connection.host);
    } catch (error) {
        console.log("Mongo DB connection ", error);
        process.exit(1);
    }
}

export default connectToDB
// Then go to your index.js to access the database

// To support pagination of your models install npm install mongoose-aggregate-paginate-v2