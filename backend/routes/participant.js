import express from "express";
import {
    addParticipant,
    getParticipants,
    editParticipant,
    removeParticipant,
    getParticipantBalance
} from '../controllers/participant.js'

const router = express.Router();

// Participant routes
router.post("/", addParticipant);
router.get("/:groupId", getParticipants);
router.put("/:id", editParticipant);
router.delete("/:id", removeParticipant);
router.get("/:participantId/balance", getParticipantBalance);

export default router;
