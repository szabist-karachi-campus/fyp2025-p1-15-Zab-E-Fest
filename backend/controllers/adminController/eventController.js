import Event from "../../models/adminModels/event.js";
import Student from "../../models/adminModels/participant.js";
import fs from "fs";
import path from "path";

// CREATE
export const createEvent = async (req, res) => {
  try {
    const {
      title,
      date,
      location,
      cap,
      moduleHead,
      moduleLeader,
      description,
      fee,
      discount,
      partnerGroup,
      finalFee, // ✅ set calculated value

    } = req.body;

    const imageUrl = req.file
      ? `${req.protocol}://${req.get("host")}/${req.file.path.replace(/\\/g, "/")}`
      : null;

    const newEvent = new Event({
      title,
      date,
      location,
      cap,
      moduleHead,
      moduleLeader, 
      description,
      fee,
      discount,
      partnerGroup,
      image: imageUrl,
    });

    await newEvent.save();
    res.status(201).json(newEvent);
  } catch (err) {
    console.error("Error creating event:", err);
    res.status(500).json({ error: "Failed to create event" });
  }
};


// UPDATE
export const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      date,
      location,
      cap,
      moduleHead,
      moduleLeader,
      description,
      fee,
      discount,
      partnerGroup
    } = req.body;

    const event = await Event.findById(id);
    if (!event) return res.status(404).json({ error: "Event not found" });
      

    //discount
    event.fee = fee;
event.discount = discount;
event.partnerGroup = partnerGroup;

// Calculate new finalFee
event.finalFee = fee - (fee * discount / 100);


    // Delete old image if a new one is uploaded
    if (req.file && event.image) {
      try {
        // Extract file path only if it's a full URL
        const oldImagePath = event.image.replace(`${req.protocol}://${req.get("host")}/`, "");
        fs.unlinkSync(oldImagePath); // delete from /uploads
      } catch (err) {
        console.warn("Previous image not found:", err.message);
      }
    }

    // Update fields
    event.title = title;
    event.date = date;
    event.location = location;
    event.cap = cap;
    event.moduleHead = moduleHead;
    event.moduleLeader = moduleLeader;
    event.description = description;
    event.fee = fee;
    event.discount = discount;
    event.partnerGroup = partnerGroup;

    // Save full image URL if new image is uploaded
    if (req.file) {
      event.image = `${req.protocol}://${req.get("host")}/${req.file.path.replace(/\\/g, "/")}`;
    }

    await event.save();
    res.status(200).json(event);
  } catch (err) {
    console.error("Error updating event:", err);
    res.status(500).json({ error: "Failed to update event" });
  }
};


// GET ALL
export const getAllEvents = async (req, res) => {
  try {
    const events = await Event.find();
    res.status(200).json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get participants for a specific event
export const getEventParticipants = async (req, res) => {
  try {
    const { eventId } = req.query;
    
    if (!eventId) {
      return res.status(400).json({ message: "Event ID is required" });
    }
    
    // Find the event
    const event = await Event.findById(eventId);
    
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }
    
    // Find participants for this event
    const participants = await Student.find({ 
      $or: [
        { event: eventId },
        { module: event.title }
      ]
    });
    
    res.status(200).json(participants);
  } catch (error) {
    console.error("Error fetching event participants:", error);
    res.status(500).json({ message: error.message });
  }
};

// DELETE
export const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const event = await Event.findById(id);
    if (!event) return res.status(404).json({ error: "Event not found" });

    if (event.image) {
      try {
        fs.unlinkSync(event.image);
      } catch (err) {
        console.warn("Image not found during deletion:", err.message);
      }
    }

    await Event.findByIdAndDelete(id);
    res.status(200).json({ message: "Event deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete event" });
  }
};




