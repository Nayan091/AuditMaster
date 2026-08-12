

import User from "../models/User.js";
import bcrypt from 'bcrypt';
import jwt from "jsonwebtoken";

// Generate jwt Token
const generateToken = (id)=>{
    return jwt.sign({id},process.env.JWT_SECRET,{expiresIn:"30d"})
}

// import { JsonWebTokenError } from "jsonwebtoken";

// Register User    *******************
export const register = async (req,res) => {
    try {
        const {name,email,password} = req.body;

        if(!name || !email || !password)
            return res.status(400).json({success:false,message:"All Fields are Required"});

        // check if ua=ser exists
        const existingUser = await User.findOne({email})
        if(existingUser)  return res.status(400).json({success:false,message:"User Already Exists"});

        // Hash Password
        const hashedPassword = await bcrypt.hash(password, await bcrypt.genSalt(10))

        // create User
        const user = await User.create({name,email,password:hashedPassword})

        const token = generateToken(user._id);

        res.status(200).json({success:true,token,user})
    } catch (error) {
        console.error("Register error:",error.message)
        res.status(500).json({success:false,message:"Server error"})
    }
}

// Login user   ****************
export const login = async (req,res) => {
    try {
        const {email,password} = req.body;

        if(!email || !password)
            return res.status(400).json({success:false,message:"All Fields are Required"});

        // find user
        const user = await User.findOne({email})
        if(!user)  return res.status(400).json({success:false,message:"Invalid Credentials"});

        // Check Password
        const isMatch = await bcrypt.compare(password,user.password)
        if(!isMatch) return res.status(400).json({success:false,message:"Invalid Credentials"});

        const token = generateToken(user._id);

        res.status(200).json({success:true,token,user})
    } catch (error) {
        console.error("Register error:",error.message)
        res.status(500).json({success:false,message:"Server error"})
    }
}

// Get Current User     **************
export const getUser = async (req,res) => {
    try {
        const user = await User.findById(req.userId).select("-password");
        if(!user) {
            return res.status(400).json({success:false,message:"User not found"})
        }

        res.json({success:true, user})
    } catch (error) {
        console.error("Get user error:",error.message)
        res.status(500).json({success:false,message:"Server error"})
    }
}