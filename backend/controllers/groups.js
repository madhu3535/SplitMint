import Group from "../models/group.js";
import Participant from "../models/participant.js";
import Expense from "../models/expense.js";
import ExpenseSplit from "../models/expenseSplit.js";
import User from "../models/user.js";
import mongoose from "mongoose";


/**
 * Create a new group
 * - Automatically add owner as first participant
 * - Allow max 3 additional participants (4 total including owner)
 */
export const createGroup = async (req, res) => {
    try {
        const { name, owner_id, description } = req.body;

        if (!name || !owner_id) {
            return res.status(400).json({
                success: false,
                message: "Name and owner_id are required"
            });
        }

        // Create group
        const newGroup = new Group({
            name,
            owner_id,
            description: description || "",
            maxParticipants: 4
        });

        await newGroup.save();

        // Automatically add owner as first participant
        const ownerParticipant = new Participant({
            group_id: newGroup._id,
            name: "You",
            email: "",
            color: "#3498db",
            avatar: null
        });

        await ownerParticipant.save();

        // Add participant to group
        newGroup.participants.push(ownerParticipant._id);
        await newGroup.save();

        // Populate and return
        await newGroup.populate('participants owner_id');

        res.status(201).json(newGroup);
    } catch (err) {
        console.error("Error creating group:", err);
        res.status(500).json({
            success: false,
            message: "Error creating group",
            error: err.message
        });
    }
};

/**
 * Get all groups for a user
 */
export const getUserGroups = async (req, res) => {
    try {
        const { userId } = req.params;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "userId is required"
            });
        }

        // Find groups where user is owner
        const groups = await Group.find({
            owner_id: userId
        }).populate('participants owner_id').sort({ createdAt: -1 });

        res.json(groups);
    } catch (err) {
        console.error("Error fetching groups:", err);
        res.status(500).json({
            success: false,
            message: "Error fetching groups",
            error: err.message
        });
    }
};

/**
 * Get single group details
 */
export const getGroupDetails = async (req, res) => {
    try {
        const { groupId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(groupId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid group ID"
            });
        }

        const group = await Group.findById(groupId)
            .populate({
                path: 'participants',
                select: 'name email color avatar'
            })
            .populate('owner_id');

        if (!group) {
            return res.status(404).json({
                success: false,
                message: "Group not found"
            });
        }

        res.status(200).json({
            success: true,
            group
        });
    } catch (err) {
        console.error("Error fetching group details:", err);
        res.status(500).json({
            success: false,
            message: "Error fetching group details",
            error: err.message
        });
    }
};

/**
 * Edit group (rename only)
 */
export const editGroup = async (req, res) => {
    try {
        const { groupId } = req.params;
        const { name, description } = req.body;

        if (!mongoose.Types.ObjectId.isValid(groupId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid group ID"
            });
        }

        if (!name) {
            return res.status(400).json({
                success: false,
                message: "Group name is required"
            });
        }

        const group = await Group.findByIdAndUpdate(
            groupId,
            {
                name,
                description: description || ""
            },
            { new: true }
        ).populate('participants owner_id');

        if (!group) {
            return res.status(404).json({
                success: false,
                message: "Group not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Group updated successfully",
            group
        });
    } catch (err) {
        console.error("Error updating group:", err);
        res.status(500).json({
            success: false,
            message: "Error updating group",
            error: err.message
        });
    }
};

/**
 * Delete group with cascade delete
 */
export const deleteGroup = async (req, res) => {
    try {
        const { groupId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(groupId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid group ID"
            });
        }

        const group = await Group.findById(groupId);

        if (!group) {
            return res.status(404).json({
                success: false,
                message: "Group not found"
            });
        }

        // Delete all expense splits for this group's expenses
        const expenses = await Expense.find({ group_id: groupId });
        const expenseIds = expenses.map(e => e._id);

        if (expenseIds.length > 0) {
            await ExpenseSplit.deleteMany({ expense_id: { $in: expenseIds } });
        }

        // Delete all expenses
        await Expense.deleteMany({ group_id: groupId });

        // Delete all participants
        await Participant.deleteMany({ group_id: groupId });

        // Delete group
        await Group.findByIdAndDelete(groupId);

        res.status(200).json({
            success: true,
            message: "Group deleted successfully with all related data"
        });
    } catch (err) {
        console.error("Error deleting group:", err);
        res.status(500).json({
            success: false,
            message: "Error deleting group",
            error: err.message
        });
    }
};

/**
 * Get group summary (totals)
 */
export const getGroupSummary = async (req, res) => {
    try {
        const { groupId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(groupId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid group ID"
            });
        }

        const group = await Group.findById(groupId).populate('participants');

        if (!group) {
            return res.status(404).json({
                success: false,
                message: "Group not found"
            });
        }

        // Get all expenses
        const expenses = await Expense.find({ group_id: groupId });

        let totalSpent = 0;
        const participantTotals = {};

        // Initialize participant totals
        group.participants.forEach(p => {
            participantTotals[p._id.toString()] = {
                name: p.name,
                totalPaid: 0,
                totalOwes: 0,
                netBalance: 0
            };
        });

        // Calculate totals
        expenses.forEach(exp => {
            totalSpent += exp.amount;
            const payerId = exp.payer_id.toString();

            if (participantTotals[payerId]) {
                participantTotals[payerId].totalPaid += exp.amount;
            }
        });

        // Get expense splits to calculate what each person owes
        const splits = await ExpenseSplit.find({
            expense_id: { $in: expenses.map(e => e._id) }
        });

        splits.forEach(split => {
            const participantId = split.participant_id.toString();
            if (participantTotals[participantId]) {
                participantTotals[participantId].totalOwes += split.share_amount;
            }
        });

        // Calculate net balance
        Object.keys(participantTotals).forEach(id => {
            participantTotals[id].netBalance =
                participantTotals[id].totalPaid - participantTotals[id].totalOwes;
        });

        res.status(200).json({
            success: true,
            summary: {
                totalSpent: parseFloat(totalSpent.toFixed(2)),
                participants: participantTotals
            }
        });
    } catch (err) {
        console.error("Error fetching group summary:", err);
        res.status(500).json({
            success: false,
            message: "Error fetching group summary",
            error: err.message
        });
    }
};

// LEGACY FUNCTIONS (kept for backwards compatibility)
export const  creategroup= async(req,res)=>{
    const {userId,title} = req.body.groupInput
        const newgroup = new Group(
            req.body.groupInput
        );
    try {
        console.log(userId)
        newgroup.members?.push(userId)
        const updatedgroup = await Group.findByIdAndUpdate(
            newgroup._id,
            {$push:{members:userId}},
            {new:true}
        )
        const userr = await User.findByIdAndUpdate(
            userId,
            { $push: { groups: newgroup._id } },
            { new: true }
        );
        await newgroup.save()
        res.status(200).json({newgroup,updatedgroup,userr})
    }
    catch (err) {
    console.log(err);
    }
};

export const getgroups = async(req,res)=>{
    const userId= req.params.id;
    try{
        console.log(userId)
        const userr = await User.findById(userId)
        const allgroups = userr.groups
        const groupDetails = await Promise.all(allgroups.map(async groupId => {
            const groupDetail = await Group.findById(groupId);
            return groupDetail;
          }));
        res.json( groupDetails );
    }catch(err){
        console.log(err)
    }
}

export const getgroup = async(req,res)=>{
    const id=req.params.id
    try{
        const grp = await Group.findById(id)
        console.log(grp)
        res.json(grp)
    }catch(err){
      console.log(err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
}