import mongoose from "mongoose";

const expenseSchema = new mongoose.Schema({
    group_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group',
        required: true
    },
    payer_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Participant',
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    split_type: {
        type: String,
        enum: ['equal', 'custom', 'percentage'],
        default: 'equal'
    },
    category: {
        type: String,
        trim: true,
        default: 'general'
    },
    currency: {
        type: String,
        default: 'INR'
    },
    status: {
        type: String,
        enum: ['pending', 'approved'],
        default: 'approved'
    }
}, { timestamps: true })

export default mongoose.model("Expense", expenseSchema)
