import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { connect } from "./db/db.js"
import transroutes from './routes/transactions.js'
import authroutes from './routes/auth.js';
import userroutes from './routes/user.js';
import grouproutes from './routes/groups.js'
import participantroutes from './routes/participant.js'
import expensesroutes from './routes/expenses.js'
import balanceEngineroutes from './routes/balanceEngine.js'

import bodyParser from 'body-parser'
import cookieParser from "cookie-parser";
import cors from "cors";

const app = express();
dotenv.config();

// Middleware
app.use(cors())
app.use(cookieParser())
app.use(express.json())
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.use("/api/transactions", transroutes)
app.use("/api/auth", authroutes)
app.use("/api/user", userroutes)
app.use("/api/group", grouproutes)
app.use("/api/participant", participantroutes)
app.use("/api/expenses", expensesroutes)
app.use("/api/balance", balanceEngineroutes)

// Error handling middleware
app.use((err, req, res, next) => {
    const status = err.status || 500;
    const message = err.message || "error";
    console.log(err);
    return res.status(status).json({
        success: false,
        status,
        message,
    })
})

// Server listens on port 3001
const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
    // Connecting to database
    connect()
    // Server running
    console.log(`Server connected on port ${PORT}`);
})