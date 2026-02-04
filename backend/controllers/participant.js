import Participant from "../models/participant.js"
import Group from "../models/group.js"
import ExpenseSplit from "../models/expenseSplit.js"
import mongoose from "mongoose"

/**
 * Add a participant to a group
 * - Validates group doesn't exceed max 4 participants
 * - Validates avatar file size if provided
 */
export const addParticipant = async (req, res) => {
    try {
        const { groupId, group_id, name, email, color, avatar } = req.body

        const effectiveGroupId = groupId || group_id

        if (!effectiveGroupId || !name) {
            return res.status(400).json({
                success: false,
                message: 'Group ID and name are required'
            })
        }

        // Validate group exists
        const group = await Group.findById(effectiveGroupId)
        if (!group) {
            return res.status(404).json({
                success: false,
                message: 'Group not found'
            })
        }

        // Check if max participants reached (4 total: 3 additional + owner)
        if (group.participants.length >= group.maxParticipants) {
            return res.status(400).json({
                success: false,
                message: `Maximum ${group.maxParticipants} participants allowed in group`
            })
        }

        // Validate avatar size if provided
        if (avatar && avatar.length > 5000000) {
            return res.status(400).json({
                success: false,
                message: 'Avatar file size exceeds 5MB limit'
            })
        }

        const participant = new Participant({
            group_id: effectiveGroupId,
            name,
            email: email || '',
            color: color || '#3498db',
            avatar: avatar || null
        })

        await participant.save()

        // Add participant to group's participants array
        await Group.findByIdAndUpdate(
            effectiveGroupId,
            { $push: { participants: participant._id } },
            { new: true }
        )

        res.status(201).json({
            success: true,
            message: 'Participant added successfully',
            participant
        })
    } catch (err) {
        console.error(err)
        res.status(500).json({
            success: false,
            message: 'Error adding participant',
            error: err.message
        })
    }
}

/**
 * Get all participants in a group
 */
export const getParticipants = async (req, res) => {
    try {
        const { groupId } = req.params

        if (!mongoose.Types.ObjectId.isValid(groupId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid group ID'
            })
        }

        const participants = await Participant.find({ group_id: groupId })
        res.status(200).json({
            success: true,
            participants
        })
    } catch (err) {
        console.error(err)
        res.status(500).json({
            success: false,
            message: 'Error fetching participants',
            error: err.message
        })
    }
}

/**
 * Edit participant details
 */
export const editParticipant = async (req, res) => {
    try {
        const { id } = req.params
        const { name, email, color, avatar } = req.body

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid participant ID'
            })
        }

        if (!name) {
            return res.status(400).json({
                success: false,
                message: 'Participant name is required'
            })
        }

        // Validate avatar size if provided
        if (avatar && avatar.length > 5000000) {
            return res.status(400).json({
                success: false,
                message: 'Avatar file size exceeds 5MB limit'
            })
        }

        const participant = await Participant.findByIdAndUpdate(
            id,
            {
                name,
                email: email || '',
                color: color || '#3498db',
                avatar: avatar || null
            },
            { new: true }
        )

        if (!participant) {
            return res.status(404).json({
                success: false,
                message: 'Participant not found'
            })
        }

        res.status(200).json({
            success: true,
            message: 'Participant updated successfully',
            participant
        })
    } catch (err) {
        console.error(err)
        res.status(500).json({
            success: false,
            message: 'Error updating participant',
            error: err.message
        })
    }
}

/**
 * Remove participant from group
 * - Also removes all related expense splits
 */
export const removeParticipant = async (req, res) => {
    try {
        const { id } = req.params

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid participant ID'
            })
        }

        const participant = await Participant.findByIdAndDelete(id)

        if (!participant) {
            return res.status(404).json({
                success: false,
                message: 'Participant not found'
            })
        }

        // Remove all expense splits for this participant
        await ExpenseSplit.deleteMany({
            participant_id: id
        })

        // Remove participant from group
        await Group.findByIdAndUpdate(
            participant.group_id,
            { $pull: { participants: id } },
            { new: true }
        )

        res.status(200).json({
            success: true,
            message: 'Participant removed successfully'
        })
    } catch (err) {
        console.error(err)
        res.status(500).json({
            success: false,
            message: 'Error removing participant',
            error: err.message
        })
    }
}

/**
 * Get participant balance details
 */
export const getParticipantBalance = async (req, res) => {
    try {
        const { participantId } = req.params

        if (!mongoose.Types.ObjectId.isValid(participantId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid participant ID'
            })
        }

        const participant = await Participant.findById(participantId)

        if (!participant) {
            return res.status(404).json({
                success: false,
                message: 'Participant not found'
            })
        }

        res.status(200).json({
            success: true,
            participant
        })
    } catch (err) {
        console.error(err)
        res.status(500).json({
            success: false,
            message: 'Error fetching balance',
            error: err.message
        })
    }
}

