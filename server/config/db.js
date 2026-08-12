import mongoose from "mongoose";

const connectDB = async () => {
    mongoose.connection.on("connected",()=> console.log("MongoDB Connected"));
    await mongoose.connect(process.env.MONGODB_URI);
    // mongoose.connection.on("error", (err) => console.log("MongoDB connection error:", err));
}

export default connectDB;