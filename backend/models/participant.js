import mongoose from "mongoose";

const participantSchema = new mongoose.Schema({
    group_id:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group',
        required: true
    },
    name:{
        type: String,
        required: true,
        trim: true
    },
    email:{
        type: String,
        trim: true
    },
    color:{
        type: String,
        default: '#3498db'
    },
    avatar:{
        type: String,
        default: null
    },
    balance:{
        type: Number,
        default: 0
    }
},{timestamps: true})

export default mongoose.model("Participant", participantSchema)
