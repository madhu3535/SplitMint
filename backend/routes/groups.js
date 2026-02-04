import express from "express";
import {
    createGroup,
    getUserGroups,
    getGroupDetails,
    editGroup,
    deleteGroup,
    getGroupSummary,
    // Legacy functions
    creategroup,
    getgroups,
    getgroup
} from "../controllers/groups.js";

const router = express.Router();

// New API endpoints
router.post("/", createGroup);
router.get("/user/:userId", getUserGroups);
router.get("/:groupId", getGroupDetails);
router.put("/:groupId", editGroup);
router.delete("/:groupId", deleteGroup);
router.get("/:groupId/summary", getGroupSummary);

// Legacy endpoints (for backwards compatibility)
router.post("/creategroup", creategroup);
router.get("/getgroups/:id", getgroups);
router.get("/getgroup/:id", getgroup);
router.delete("/deleteGroup/:id", deleteGroup);

export default router;