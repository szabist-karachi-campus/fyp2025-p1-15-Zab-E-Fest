import Module from "../../models/adminModels/module.js";
import Event from "../../models/adminModels/event.js";
import Participant from "../../models/adminModels/participant.js";

// Create a new module
const createModule = async (req, res) => {
  try {
    const { title, date, location, head, cap } = req.body;
    const image = req.file?.filename;

    const module = new Module({
      title,
      date,
      location,
      head,
      cap,
      image,
    });

    await module.save();
    res.status(201).json(module);
  } catch (err) {
    console.error("Error creating module:", err);
    res.status(500).json({ error: "Failed to create module" });
  }
};

// Get all modules
const getAllModules = async (req, res) => {
  try {
    const modules = await Module.find();
    res.status(200).json(modules);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch modules" });
  }
};

// Get module details + events and participants
const getModuleDetails = async (req, res) => {
  try {
    const moduleId = req.params.id;

    const module = await Module.findById(moduleId);
    if (!module) return res.status(404).json({ error: "Module not found" });

    const events = await Event.find({ module: module.title });
    const participants = await Participant.find({ module: module.title });

    res.status(200).json({ module, events, participants });
  } catch (err) {
    console.error("Error fetching module details:", err);
    res.status(500).json({ error: "Failed to load module details" });
  }
};

// Update a module
const updateModule = async (req, res) => {
  try {
    const { title, date, location, head, cap } = req.body;
    const image = req.file?.filename;

    const updated = await Module.findByIdAndUpdate(
      req.params.id,
      {
        title,
        date,
        location,
        head,
        cap,
        ...(image && { image }),
      },
      { new: true }
    );

    res.status(200).json(updated);
  } catch (err) {
    console.error("Error updating module:", err);
    res.status(500).json({ error: "Failed to update module" });
  }
};

// Delete a module
const deleteModule = async (req, res) => {
  try {
    await Module.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Module deleted successfully" });
  } catch (err) {
    console.error("Error deleting module:", err);
    res.status(500).json({ error: "Failed to delete module" });
  }
};

export {
  createModule,
  getAllModules,
  getModuleDetails,
  updateModule,
  deleteModule,
};
