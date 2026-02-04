import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema({
    groupId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group'
    },
    userId:{
        type:String,
    },
    paidBy:{
        type:String,
        required: true
    },
    type:{
        type:String,
    },
    amount:{
        type:Number,
        required: true
    },
    currency:{
        type:String,
        default: 'inr'
    },
    category:{
        type:String,
        trim: true
    },
    desc:{
        type:String,
    },
    date:{
        type: Date,
        default: Date.now
    },
    splitMode:{
        type: String,
        enum: ['equal', 'custom', 'percentage'],
        default: 'equal'
    },
    splitDetails: [
        {
            participantId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Participant'
            },
            participantName: String,
            amount: Number,
            percentage: Number
        }
    ],
    status:{
        type: String,
        enum: ['pending', 'approved'],
        default: 'pending'
    }
},{timestamps: true})

export default mongoose.model("Transaction", transactionSchema)