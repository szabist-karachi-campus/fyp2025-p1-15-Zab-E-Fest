import express from 'express';
import { getAllParticipants,acceptApplication, addParticipant, updateParticipant,deleteParticipant } from '../../controllers/adminController/participantController.js';
import Student from '../../models/adminModels/participant.js';
import Participants from '../../models/adminModels/participant.js';
import { getMyResult } from '../../controllers/adminController/participantController.js';
import { protect } from '../../middlewares/authMiddleware.js'; // your JWT check


const router = express.Router();

// Routes
router.get('/', getAllParticipants); // GET: Fetch all participants
router.post('/', addParticipant);   // POST: Add a participant

// Accept an application (move participant data to participants collection)
router.put('/accept/:id', acceptApplication);
// In authController.js

router.put('/:id', updateParticipant);       // update participant
router.delete('/:id', deleteParticipant);    // delete participant + rollback application

// Admin: toggle result visibility per participant
router.put('/:id/result-visibility', async (req, res) => {
  try {
    const { visible } = req.body;
    const updated = await Student.findByIdAndUpdate(
      req.params.id,
      { resultVisible: !!visible },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: 'Participant not found' });
    res.json({ message: 'Result visibility updated', resultVisible: updated.resultVisible });
  } catch (e) {
    res.status(500).json({ message: 'Failed to update visibility' });
  }
});

// GET participants for a given module titlea
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



router.get('/my/result', protect, getMyResult);



export default router;
