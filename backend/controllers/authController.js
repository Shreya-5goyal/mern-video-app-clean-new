import User from "../models/User.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const checkDbConnection = (res) => {
    if (mongoose.connection.readyState !== 1) {
        res.status(503).json({
            message: "Database connection is not established. Please check backend configuration (MONGO_URI)."
        });
        return false;
    }
    return true;
};

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || "default_secret", {
        expiresIn: "30d",
    });
};

// @desc    Register a new user
// @route   POST /api/auth/signup
export const registerUser = async (req, res) => {
    const { name, email, password } = req.body;
    console.log(`[AUTH] Signup attempt: ${email}`);

    if (!checkDbConnection(res)) return;

    try {
        const lowerEmail = email.toLowerCase().trim();
        const userExists = await User.findOne({ email: lowerEmail });

        if (userExists) {
            console.log(`[AUTH] Signup failed: User ${email} already exists`);
            return res.status(400).json({ message: "User already exists" });
        }

        const user = await User.create({
            name,
            email: lowerEmail,
            password,
        });

        if (user) {
            console.log(`[AUTH] Signup success: ${email}`);
            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                token: generateToken(user._id),
            });
        }
    } catch (error) {
        console.error(`[AUTH] Signup error: ${error.message}`);
        res.status(500).json({ message: "Server error during registration. Please check database connection." });
    }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
export const authUser = async (req, res) => {
    const { email, password } = req.body;
    console.log(`[AUTH] Login attempt: ${email}`);

    if (!checkDbConnection(res)) return;

    try {
        const lowerEmail = email.toLowerCase().trim();
        const user = await User.findOne({ email: lowerEmail });

        if (!user) {
            console.log(`[AUTH] Login failed: User ${email} not found`);
            return res.status(401).json({ message: "Invalid email or password" });
        }

        const isMatch = await user.matchPassword(password);
        if (isMatch) {
            console.log(`[AUTH] Login success: ${email}`);
            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                token: generateToken(user._id),
            });
        } else {
            console.log(`[AUTH] Login failed: Incorrect password for ${email}`);
            res.status(401).json({ message: "Invalid email or password" });
        }
    } catch (error) {
        console.error(`[AUTH] Login error: ${error.message}`);
        res.status(500).json({ message: "Connection to database failed. Please try again in a few seconds." });
    }
};
