import Expense from "../models/expense.js"
import ExpenseSplit from "../models/expenseSplit.js"
import Participant from "../models/participant.js"
import Group from "../models/group.js"
import mongoose from "mongoose"

/**
 * Calculate balances for all participants in a group
 * Returns:
 * - balances: { participantId -> { name, totalPaid, totalOwes, netBalance } }
 * - settlements: [ { from, fromId, to, toId, amount } ]
 */
export const calculateBalances = async (req, res) => {
    try {
        const { groupId } = req.params

        if (!mongoose.Types.ObjectId.isValid(groupId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid group ID"
            })
        }

        const group = await Group.findById(groupId).populate('participants')

        if (!group) {
            return res.status(404).json({
                success: false,
                message: "Group not found"
            })
        }

        // Get all expenses
        const expenses = await Expense.find({ group_id: groupId })

        // Initialize balances
        const balances = {}
        group.participants.forEach(p => {
            balances[p._id.toString()] = {
                name: p.name,
                participantId: p._id,
                totalPaid: 0,
                totalOwes: 0,
                netBalance: 0
            }
        })

        // Calculate total paid
        expenses.forEach(exp => {
            const payerId = exp.payer_id.toString()
            if (balances[payerId]) {
                balances[payerId].totalPaid += exp.amount
            }
        })

        // Calculate total owes (from splits)
        const splits = await ExpenseSplit.find({
            expense_id: { $in: expenses.map(e => e._id) }
        })

        splits.forEach(split => {
            const participantId = split.participant_id.toString()
            if (balances[participantId]) {
                balances[participantId].totalOwes += split.share_amount
            }
        })

        // Calculate net balance
        Object.keys(balances).forEach(key => {
            balances[key].totalPaid = parseFloat(balances[key].totalPaid.toFixed(2))
            balances[key].totalOwes = parseFloat(balances[key].totalOwes.toFixed(2))
            balances[key].netBalance = parseFloat(
                (balances[key].totalPaid - balances[key].totalOwes).toFixed(2)
            )
        })

        // Calculate settlements
        const settlements = calculateSettlements(balances)

        res.status(200).json({
            success: true,
            balances,
            settlements
        })
    } catch (err) {
        console.error(err)
        res.status(500).json({
            success: false,
            message: 'Error calculating balances',
            error: err.message
        })
    }
}

/**
 * Helper: Calculate minimal settlements using greedy algorithm
 */
const calculateSettlements = (balances) => {
    const debtors = []
    const creditors = []

    Object.entries(balances).forEach(([id, balance]) => {
        if (balance.netBalance < -0.01) {
            // Owes money (negative balance)
            debtors.push({
                id: balance.participantId,
                name: balance.name,
                amount: Math.abs(balance.netBalance)
            })
        } else if (balance.netBalance > 0.01) {
            // Gets money (positive balance)
            creditors.push({
                id: balance.participantId,
                name: balance.name,
                amount: balance.netBalance
            })
        }
    })

    // Sort for consistency
    debtors.sort((a, b) => b.amount - a.amount)
    creditors.sort((a, b) => b.amount - a.amount)

    // Generate settlements using greedy approach
    const settlements = []

    while (debtors.length > 0 && creditors.length > 0) {
        const debtor = debtors[0]
        const creditor = creditors[0]

        const amount = Math.min(debtor.amount, creditor.amount)

        settlements.push({
            from: debtor.name,
            fromId: debtor.id.toString(),
            to: creditor.name,
            toId: creditor.id.toString(),
            amount: parseFloat(amount.toFixed(2))
        })

        debtor.amount = parseFloat((debtor.amount - amount).toFixed(2))
        creditor.amount = parseFloat((creditor.amount - amount).toFixed(2))

        if (debtor.amount < 0.01) debtors.shift()
        if (creditor.amount < 0.01) creditors.shift()
    }

    return settlements
}

/**
 * Simplify debts to minimum transactions needed
 */
export const simplifyDebts = async (req, res) => {
    try {
        const { groupId } = req.params

        if (!mongoose.Types.ObjectId.isValid(groupId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid group ID"
            })
        }

        // Get balances first
        const group = await Group.findById(groupId).populate('participants')

        if (!group) {
            return res.status(404).json({
                success: false,
                message: "Group not found"
            })
        }

        const expenses = await Expense.find({ group_id: groupId })

        const balances = {}
        group.participants.forEach(p => {
            balances[p._id.toString()] = {
                name: p.name,
                participantId: p._id,
                netBalance: 0
            }
        })

        // Calculate net balances
        expenses.forEach(exp => {
            const payerId = exp.payer_id.toString()
            if (balances[payerId]) {
                balances[payerId].netBalance += exp.amount
            }
        })

        const splits = await ExpenseSplit.find({
            expense_id: { $in: expenses.map(e => e._id) }
        })

        splits.forEach(split => {
            const participantId = split.participant_id.toString()
            if (balances[participantId]) {
                balances[participantId].netBalance -= split.share_amount
            }
        })

        // Calculate settlements
        const settlements = calculateSettlements(balances)

        res.status(200).json({
            success: true,
            settlements
        })
    } catch (err) {
        console.error(err)
        res.status(500).json({
            success: false,
            message: 'Error simplifying debts',
            error: err.message
        })
    }
}

/**
 * Get balance summary for a specific participant
 */
export const getParticipantBalanceSummary = async (req, res) => {
    try {
        const { participantId, groupId } = req.params

        if (!mongoose.Types.ObjectId.isValid(participantId) || !mongoose.Types.ObjectId.isValid(groupId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid participant or group ID"
            })
        }

        const expenses = await Expense.find({ group_id: groupId })

        let totalSpent = 0
        let totalOwed = 0

        // Calculate total spent
        expenses.forEach(exp => {
            if (exp.payer_id.toString() === participantId) {
                totalSpent += exp.amount
            }
        })

        // Calculate total owed (from splits)
        const splits = await ExpenseSplit.find({
            participant_id: participantId,
            expense_id: { $in: expenses.map(e => e._id) }
        })

        splits.forEach(split => {
            totalOwed += split.share_amount
        })

        const netBalance = totalSpent - totalOwed

        res.status(200).json({
            success: true,
            summary: {
                totalSpent: parseFloat(totalSpent.toFixed(2)),
                totalOwed: parseFloat(totalOwed.toFixed(2)),
                netBalance: parseFloat(netBalance.toFixed(2))
            }
        })
    } catch (err) {
        console.error(err)
        res.status(500).json({
            success: false,
            message: 'Error fetching balance summary',
            error: err.message
        })
    }
}

/**
 * Get balance details between two participants
 */
export const getBilateralBalance = async (req, res) => {
    try {
        const { groupId, participantId1, participantId2 } = req.params

        if (!mongoose.Types.ObjectId.isValid(groupId) ||
            !mongoose.Types.ObjectId.isValid(participantId1) ||
            !mongoose.Types.ObjectId.isValid(participantId2)) {
            return res.status(400).json({
                success: false,
                message: "Invalid group or participant IDs"
            })
        }

        const expenses = await Expense.find({ group_id: groupId })

        let p1ToPay = 0  // P1 owes to P2
        let p2ToPay = 0  // P2 owes to P1

        // Check expenses where P1 paid and P2 is in split
        expenses.forEach(exp => {
            if (exp.payer_id.toString() === participantId1) {
                const split = [
                    ...exp.splitDetails || []
                ].find(s => s.participantId?.toString() === participantId2)

                if (split) {
                    // P1 paid for P2, so P2 owes P1 (p2ToPay increases)
                    p2ToPay += split.amount || 0
                }
            }

            if (exp.payer_id.toString() === participantId2) {
                const split = [
                    ...exp.splitDetails || []
                ].find(s => s.participantId?.toString() === participantId1)

                if (split) {
                    // P2 paid for P1, so P1 owes P2 (p1ToPay increases)
                    p1ToPay += split.amount || 0
                }
            }
        })

        // Get actual splits
        const splits = await ExpenseSplit.find({
            expense_id: { $in: expenses.map(e => e._id) }
        })

        p1ToPay = 0
        p2ToPay = 0

        expenses.forEach(exp => {
            if (exp.payer_id.toString() === participantId1) {
                const split = splits.find(s =>
                    s.expense_id.toString() === exp._id.toString() &&
                    s.participant_id.toString() === participantId2
                )
                if (split) {
                    p2ToPay += split.share_amount
                }
            }

            if (exp.payer_id.toString() === participantId2) {
                const split = splits.find(s =>
                    s.expense_id.toString() === exp._id.toString() &&
                    s.participant_id.toString() === participantId1
                )
                if (split) {
                    p1ToPay += split.share_amount
                }
            }
        })

        const netBalance = p2ToPay - p1ToPay

        res.status(200).json({
            success: true,
            bilateral: {
                participant1Id: participantId1,
                participant2Id: participantId2,
                participant1OwesParticipant2: Math.max(0, p1ToPay),
                participant2OwesParticipant1: Math.max(0, p2ToPay),
                netBalance: parseFloat(netBalance.toFixed(2))
            }
        })
    } catch (err) {
        console.error(err)
        res.status(500).json({
            success: false,
            message: 'Error calculating bilateral balance',
            error: err.message
        })
    }
}

