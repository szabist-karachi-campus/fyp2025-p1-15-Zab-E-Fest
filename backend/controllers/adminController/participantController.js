import Student from '../../models/adminModels/participant.js';
import Application from '../../models/participant_app/application.js'; // Assuming this is where the applications are stored
import Event from '../../models/adminModels/event.js';


// Get all participants
export const getAllParticipants = async (req, res) => {
  try {
    const students = await Student.find();
    res.status(200).json(students);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching participants' });
  }
};

// Add a participant
export const addParticipant = async (req, res) => {
  try {
    const { module: moduleTitle } = req.body;
    if (!moduleTitle) {
      return res.status(400).json({ message: 'Module is required' });
    }

    // Find the module/event to check capacity
    const event = await Event.findOne({ title: { $regex: new RegExp(`^${moduleTitle}$`, 'i') } });
    if (!event) {
      return res.status(404).json({ message: 'Module not found' });
    }

    // Count how many participants are already enrolled in this module
    const currentCount = await Student.countDocuments({ module: moduleTitle });

    // Check if adding another participant exceeds capacity
    if (currentCount >= event.cap) {
      return res.status(400).json({ message: `Registration failed: Module capacity (${event.cap}) is full.` });
    }

    // Capacity is available, create the participant
    const newParticipant = new Student(req.body);
    const savedParticipant = await newParticipant.save();
    res.status(201).json(savedParticipant);
  } catch (error) {
    console.error('Error adding participant:', error);
    res.status(400).json({ message: 'Error adding participant' });
  }
};

// Accept an application and add participants to the participant collection
export const acceptApplication = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    const moduleTitle = application.moduleTitle.trim();
    const event = await Event.findOne({ title: { $regex: new RegExp(`^${moduleTitle}$`, 'i') } });

    if (!event) return res.status(404).json({ message: "Module not found" });

    const currentCount = await Student.countDocuments({ module: moduleTitle });
    const incomingCount = application.participants.length;

    if (currentCount + incomingCount > event.cap) {
      return res.status(400).json({
        message: `Cannot accept application. Cap of ${event.cap} exceeded.`,
      });
    }

    // Prepare participant data and validate required fields for Student schema
    const participantData = application.participants.map((participant) => ({
      name: participant.name,
      rollNumber: participant.rollNumber,
      email: participant.email,
      contactNumber: participant.contactNumber,
      department: participant.department,
      university: participant.university,
      module: moduleTitle,
      fee: application.totalFee,
      registrationToken: application.registrationToken,
    }));

    // Validate required fields; return 400 with details instead of throwing 500 later
    const missing = [];
    participantData.forEach((p, idx) => {
      const missingFields = [];
      if (!p.name) missingFields.push('name');
      if (!p.rollNumber) missingFields.push('rollNumber');
      if (!p.email) missingFields.push('email');
      if (!p.contactNumber) missingFields.push('contactNumber');
      if (!p.department) missingFields.push('department');
      if (!p.university) missingFields.push('university');
      if (missingFields.length) {
        missing.push({ index: idx, missingFields });
      }
    });
    if (missing.length) {
      return res.status(400).json({ message: 'Missing required participant fields', details: missing });
    }

    // Upsert participants by email to avoid duplicate key errors on unique email
    const bulkOps = participantData.map((p) => ({
      updateOne: {
        filter: { email: p.email },
        update: { $set: p },
        upsert: true,
      }
    }));

    await Student.bulkWrite(bulkOps);
    await Application.findByIdAndUpdate(application._id, { status: "Accepted" });

    res.status(200).json({ message: "Application accepted." });
  } catch (error) {
    console.error("Error accepting application:", error);
    if (error && error.code === 11000) {
      return res.status(409).json({ message: 'Duplicate key error while saving participants', error });
    }
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Update participant
export const updateParticipant = async (req, res) => {
  try {
    const updatedParticipant = await Student.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedParticipant) {
      return res.status(404).json({ message: "Participant not found" });
    }
    res.json(updatedParticipant);
  } catch (error) {
    res.status(500).json({ message: "Error updating participant", error });
  }
};

// Delete participant and rollback application status
export const deleteParticipant = async (req, res) => {
  try {
    const participant = await Student.findById(req.params.id);
    if (!participant) {
      return res.status(404).json({ message: "Participant not found" });
    }

    // Delete participant
    await Student.findByIdAndDelete(req.params.id);

    // Rollback application status to Rejected
    if (participant.applicationId) {
      await Application.findByIdAndUpdate(participant.applicationId, { status: "Rejected" });
    }

    res.json({ message: "Participant deleted and application rejected" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting participant", error });
  }
};
export const getMyResult = async (req, res) => {
  try {
    // req.user should come from auth middleware (participant token)
    const email = req.user.email; 
    const participant = await Student.findOne({ email });
    
    if (!participant) {
      return res.status(404).json({ message: "Result not found" });
    }
    
    if (!participant.resultVisible) {
      return res.status(403).json({ message: "Results are not yet visible" });
    }
    
    const result = {
      name: participant.name,
      email: participant.email,
      module: participant.module,
      registrationToken: participant.registrationToken || undefined,
      stage: participant.stage,
      marks: participant.marks || participant.grade, // Use grade if marks is not set
      remark: participant.remark || participant.comments || '', // Use comments if remark is not set
      grade: participant.grade,
      comments: participant.comments,
      updatedAt: participant.updatedAt,
    };
    
    res.json(result);
  } catch (err) {
    console.error('getMyResult - Error:', err);
    res.status(500).json({ message: "Error fetching result" });
  }
};