import mongoose from "mongoose";

const groupSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    owner_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    participants: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Participant'
        }
    ],
    description: {
        type: String,
        default: ''
    },
    totalSpent: {
        type: Number,
        default: 0
    },
    // Legacy fields - kept for backwards compatibility
    groupCode: String,
    userId: String,
    members: [String],
    comments: [Object],
    title: String,
    billSplit: [Object],
    simplifyDebt: [Array],
    maxParticipants: {
        type: Number,
        default: 4  // max 3 participants + primary user (owner)
    }
}, { timestamps: true })

export default mongoose.model("Group", groupSchema)