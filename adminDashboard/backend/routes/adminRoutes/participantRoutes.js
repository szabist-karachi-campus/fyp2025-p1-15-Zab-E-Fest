import express from 'express';
import { getAllParticipants,acceptApplication, addParticipant, updateParticipant,deleteParticipant } from '../../controllers/adminController/participantController.js';
import Participants from '../../models/adminModels/participant.js';


const router = express.Router();

// Routes
router.get('/', getAllParticipants); // GET: Fetch all participants
router.post('/', addParticipant);   // POST: Add a participant

// Accept an application (move participant data to participants collection)
router.put('/accept/:id', acceptApplication);
// In authController.js

router.put('/:id', updateParticipant);       // update participant
router.delete('/:id', deleteParticipant);    // delete participant + rollback application

// GET participants for a given module title
router.get('/', async (req, res) => {
  const { module } = req.query;
  if (!module) return res.status(400).json({ message: "module query required" });
  try {
    const list = await Participants.find({ module });
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch participants" });
  }
});



export default router;
