import express from "express";
import {
    createExpense,
    getExpenses,
    getExpenseDetails,
    editExpense,
    deleteExpense,
    getParticipantExpenses
} from "../controllers/expenses.js";

const router = express.Router();

// Expense endpoints
router.post("/", createExpense);
router.get("/group/:groupId", getExpenses);
router.get("/:expenseId", getExpenseDetails);
router.put("/:expenseId", editExpense);
router.delete("/:expenseId", deleteExpense);
router.get("/:groupId/participant/:participantId", getParticipantExpenses);

export default router;
