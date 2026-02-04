import Expense from "../models/expense.js";
import ExpenseSplit from "../models/expenseSplit.js";
import Group from "../models/group.js";
import Participant from "../models/participant.js";
import mongoose from "mongoose";

/**
 * Utility: Calculate shares based on split type
 */
const calculateShares = (amount, splitType, splitData, participantCount) => {
    const shares = [];
    let totalShared = 0;

    if (splitType === 'equal') {
        const share = amount / participantCount;
        let remaining = amount;

        splitData.forEach((pid, index) => {
            let shareAmount = share;
            if (index === participantCount - 1) {
                // Last participant gets remainder to handle rounding
                shareAmount = remaining;
            }
            shares.push({
                participant_id: pid,
                share_amount: parseFloat(shareAmount.toFixed(2))
            });
            remaining -= parseFloat(shareAmount.toFixed(2));
            totalShared += parseFloat(shareAmount.toFixed(2));
        });
    } else if (splitType === 'custom') {
        // splitData is array of {participantId, amount}
        let remaining = amount;
        splitData.forEach((split, index) => {
            let shareAmount = split.amount;
            if (index === splitData.length - 1) {
                shareAmount = remaining;
            }
            shares.push({
                participant_id: split.participantId,
                share_amount: parseFloat(shareAmount.toFixed(2))
            });
            remaining -= parseFloat(shareAmount.toFixed(2));
            totalShared += parseFloat(shareAmount.toFixed(2));
        });
    } else if (splitType === 'percentage') {
        // splitData is array of {participantId, percentage}
        let remaining = amount;
        splitData.forEach((split, index) => {
            let shareAmount = (amount * split.percentage) / 100;
            if (index === splitData.length - 1) {
                shareAmount = remaining;
            }
            shares.push({
                participant_id: split.participantId,
                share_amount: parseFloat(shareAmount.toFixed(2))
            });
            remaining -= parseFloat(shareAmount.toFixed(2));
            totalShared += parseFloat(shareAmount.toFixed(2));
        });
    }

    return shares;
};

/**
 * Create a new expense
 * Input:
 * - group_id
 * - payer_id (participant who paid)
 * - amount
 * - description
 * - date (optional, defaults to now)
 * - split_type: 'equal', 'custom', 'percentage'
 * - splitData: array of participant IDs (for equal), or [{participantId, amount}, ...] (for custom), or [{participantId, percentage}, ...] (for percentage)
 * - category (optional)
 */
export const createExpense = async (req, res) => {
    try {
        const {
            group_id,
            payer_id,
            amount,
            description,
            split_type = 'equal',
            splitData = [],
            category = 'general',
            date
        } = req.body;

        // Validation
        if (!group_id || !payer_id || !amount || !description) {
            return res.status(400).json({
                success: false,
                message: "group_id, payer_id, amount, and description are required"
            });
        }

        if (amount <= 0) {
            return res.status(400).json({
                success: false,
                message: "Amount must be greater than 0"
            });
        }

        if (!['equal', 'custom', 'percentage'].includes(split_type)) {
            return res.status(400).json({
                success: false,
                message: "split_type must be 'equal', 'custom', or 'percentage'"
            });
        }

        // Validate group and participants exist
        const group = await Group.findById(group_id);
        if (!group) {
            return res.status(404).json({
                success: false,
                message: "Group not found"
            });
        }

        const payer = await Participant.findById(payer_id);
        if (!payer) {
            return res.status(404).json({
                success: false,
                message: "Payer participant not found"
            });
        }

        // Create expense
        const newExpense = new Expense({
            group_id,
            payer_id,
            amount: parseFloat(amount.toFixed(2)),
            description: description.trim(),
            split_type,
            category,
            date: date ? new Date(date) : new Date()
        });

        await newExpense.save();

        // Calculate and create splits
        const shares = calculateShares(amount, split_type, splitData, splitData.length || 1);

        const splits = [];
        for (const share of shares) {
            const split = new ExpenseSplit({
                expense_id: newExpense._id,
                participant_id: share.participant_id,
                share_amount: share.share_amount
            });
            await split.save();
            splits.push(split);
        }

        // Update group total
        await Group.findByIdAndUpdate(
            group_id,
            { $inc: { totalSpent: amount } }
        );

        res.status(201).json({
            success: true,
            message: "Expense created successfully",
            expense: newExpense,
            splits
        });
    } catch (err) {
        console.error("Error creating expense:", err);
        res.status(500).json({
            success: false,
            message: "Error creating expense",
            error: err.message
        });
    }
};

/**
 * Get all expenses for a group
 */
export const getExpenses = async (req, res) => {
    try {
        const { groupId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(groupId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid group ID"
            });
        }

        const expenses = await Expense.find({ group_id: groupId })
            .populate({
                path: 'payer_id',
                select: 'name color avatar'
            })
            .sort({ date: -1 });

        // Fetch splits for each expense
        const expensesWithSplits = await Promise.all(
            expenses.map(async (exp) => {
                const splits = await ExpenseSplit.find({ expense_id: exp._id })
                    .populate({
                        path: 'participant_id',
                        select: 'name color'
                    });
                return {
                    ...exp.toObject(),
                    splits
                };
            })
        );

        res.status(200).json({
            success: true,
            expenses: expensesWithSplits
        });
    } catch (err) {
        console.error("Error fetching expenses:", err);
        res.status(500).json({
            success: false,
            message: "Error fetching expenses",
            error: err.message
        });
    }
};

/**
 * Get single expense with splits
 */
export const getExpenseDetails = async (req, res) => {
    try {
        const { expenseId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(expenseId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid expense ID"
            });
        }

        const expense = await Expense.findById(expenseId)
            .populate({
                path: 'payer_id',
                select: 'name color avatar'
            });

        if (!expense) {
            return res.status(404).json({
                success: false,
                message: "Expense not found"
            });
        }

        const splits = await ExpenseSplit.find({ expense_id: expenseId })
            .populate({
                path: 'participant_id',
                select: 'name color'
            });

        res.status(200).json({
            success: true,
            expense: {
                ...expense.toObject(),
                splits
            }
        });
    } catch (err) {
        console.error("Error fetching expense details:", err);
        res.status(500).json({
            success: false,
            message: "Error fetching expense details",
            error: err.message
        });
    }
};

/**
 * Edit expense - recalculates splits
 */
export const editExpense = async (req, res) => {
    try {
        const { expenseId } = req.params;
        const {
            amount,
            description,
            split_type,
            splitData,
            category,
            date
        } = req.body;

        if (!mongoose.Types.ObjectId.isValid(expenseId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid expense ID"
            });
        }

        const expense = await Expense.findById(expenseId);
        if (!expense) {
            return res.status(404).json({
                success: false,
                message: "Expense not found"
            });
        }

        const oldAmount = expense.amount;

        // Update expense
        if (amount) {
            if (amount <= 0) {
                return res.status(400).json({
                    success: false,
                    message: "Amount must be greater than 0"
                });
            }
            expense.amount = parseFloat(amount.toFixed(2));
        }

        if (description) {
            expense.description = description.trim();
        }

        if (split_type && ['equal', 'custom', 'percentage'].includes(split_type)) {
            expense.split_type = split_type;
        }

        if (category) {
            expense.category = category;
        }

        if (date) {
            expense.date = new Date(date);
        }

        await expense.save();

        // Delete old splits
        await ExpenseSplit.deleteMany({ expense_id: expenseId });

        // Create new splits
        const shares = calculateShares(expense.amount, expense.split_type, splitData || [], splitData?.length || 1);
        const splits = [];

        for (const share of shares) {
            const split = new ExpenseSplit({
                expense_id: expenseId,
                participant_id: share.participant_id,
                share_amount: share.share_amount
            });
            await split.save();
            splits.push(split);
        }

        // Update group total
        const amountDifference = expense.amount - oldAmount;
        await Group.findByIdAndUpdate(
            expense.group_id,
            { $inc: { totalSpent: amountDifference } }
        );

        res.status(200).json({
            success: true,
            message: "Expense updated successfully",
            expense,
            splits
        });
    } catch (err) {
        console.error("Error updating expense:", err);
        res.status(500).json({
            success: false,
            message: "Error updating expense",
            error: err.message
        });
    }
};

/**
 * Delete expense - removes splits automatically (cascade)
 */
export const deleteExpense = async (req, res) => {
    try {
        const { expenseId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(expenseId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid expense ID"
            });
        }

        const expense = await Expense.findById(expenseId);
        if (!expense) {
            return res.status(404).json({
                success: false,
                message: "Expense not found"
            });
        }

        // Delete all splits
        await ExpenseSplit.deleteMany({ expense_id: expenseId });

        // Update group total
        await Group.findByIdAndUpdate(
            expense.group_id,
            { $inc: { totalSpent: -expense.amount } }
        );

        // Delete expense
        await Expense.findByIdAndDelete(expenseId);

        res.status(200).json({
            success: true,
            message: "Expense deleted successfully"
        });
    } catch (err) {
        console.error("Error deleting expense:", err);
        res.status(500).json({
            success: false,
            message: "Error deleting expense",
            error: err.message
        });
    }
};

/**
 * Get expenses for a specific participant (paid or included in split)
 */
export const getParticipantExpenses = async (req, res) => {
    try {
        const { groupId, participantId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(groupId) || !mongoose.Types.ObjectId.isValid(participantId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid group ID or participant ID"
            });
        }

        // Get expenses paid by participant
        const paid = await Expense.find({
            group_id: groupId,
            payer_id: participantId
        }).sort({ date: -1 });

        // Get expenses where participant has a share
        const shared = await ExpenseSplit.find({
            participant_id: participantId
        }).distinct('expense_id');

        const splitExpenses = await Expense.find({
            _id: { $in: shared },
            group_id: groupId
        }).sort({ date: -1 });

        res.status(200).json({
            success: true,
            participantPaid: paid,
            participantShared: splitExpenses
        });
    } catch (err) {
        console.error("Error fetching participant expenses:", err);
        res.status(500).json({
            success: false,
            message: "Error fetching participant expenses",
            error: err.message
        });
    }
};
