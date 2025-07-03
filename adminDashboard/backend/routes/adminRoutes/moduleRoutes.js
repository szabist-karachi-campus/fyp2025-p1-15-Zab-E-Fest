import express from "express";
import multer from "multer";
import {
  createModule,
  getAllModules,
  getModuleDetails,
  updateModule,
  deleteModule,
} from "../../controllers/adminController/moduleController.js";

const router = express.Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage });

router.post("/", upload.single("image"), createModule);
router.get("/", getAllModules);
router.get("/:id", getModuleDetails);
router.get("/:id/details", async (req, res) => {
    try {
      const moduleId = req.params.id;
  
      // Fetch events under this module
      const events = await Event.find({ moduleId });
  
      // Fetch participants under this module
      const participants = await Participant.find({ module: moduleId });
  
      res.status(200).json({ events, participants });
    } catch (err) {
      res.status(500).json({ message: "Error fetching module details" });
    }
  });
  
router.put("/:id", upload.single("image"), updateModule);
router.delete("/:id", deleteModule);

export default router;
