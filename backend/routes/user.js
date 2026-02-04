import express from "express";
import {addImg} from '../controllers/user.js'
import {authmiddleware} from "../middlewares/authMiddleware.js";

const router = express.Router();

//Routes for user api - Core features only
router.put("/addImg/:userId",addImg);

export default router;