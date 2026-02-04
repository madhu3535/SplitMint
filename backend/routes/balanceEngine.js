import express from "express";
import {calculateBalances, simplifyDebts, getParticipantBalanceSummary, getBilateralBalance} from '../controllers/balanceEngine.js'

const router = express.Router();

// Balance calculation routes
router.get("/calculate/:groupId", calculateBalances);
router.get("/simplify/:groupId", simplifyDebts);
router.get("/summary/:groupId/:participantId", getParticipantBalanceSummary);
router.get("/bilateral/:groupId/:participantId1/:participantId2", getBilateralBalance);

export default router;
