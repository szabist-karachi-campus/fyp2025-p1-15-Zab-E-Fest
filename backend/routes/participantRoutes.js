import express from 'express';
import ModuleApplication from '../models/ModuleApplication.js';
import { authenticateParticipant, authenticateAdmin } from '../middlewares/auth.js';

const router = express.Router();

// Participant applies for a module
router.post('/modules/apply', authenticateParticipant, async (req, res) => {
  try {
    const { moduleId } = req.body;
    const participantId = req.user.id;
    const application = new ModuleApplication({ participantId, moduleId });
    await application.save();
    res.status(201).json(application);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Participant retrieves all applied/enrolled modules
router.get('/modules', authenticateParticipant, async (req, res) => {
  try {
    const participantId = req.user.id;
    const apps = await ModuleApplication.find({ participantId })
      .populate('moduleId', 'title fee')
      .exec();
    res.json(apps.map(app => ({
      id: app._id,
      title: app.moduleId?.title,
      fee: app.moduleId?.fee,
      paymentStatus: app.paymentStatus,
      status: app.status,
      appliedAt: app.appliedAt
    })));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin updates application status/payment
router.put('/applications/:id/status', authenticateAdmin, async (req, res) => {
  try {
    const { status, paymentStatus } = req.body;
    const updated = await ModuleApplication.findByIdAndUpdate(
      req.params.id,
      { status, paymentStatus, updatedAt: Date.now() },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: 'Application not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
