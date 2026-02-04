import mongoose from "mongoose";

const expenseSplitSchema = new mongoose.Schema({
    expense_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Expense',
        required: true
    },
    participant_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Participant',
        required: true
    },
    share_amount: {
        type: Number,
        required: true,
        min: 0
    },
    percentage: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    }
}, { timestamps: true })

export default mongoose.model("ExpenseSplit", expenseSplitSchema)
