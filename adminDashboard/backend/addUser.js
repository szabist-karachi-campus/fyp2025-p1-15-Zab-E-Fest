import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import User from "./models/registrationTeamModels/User.js";

dotenv.config();

const addUser = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const plainPassword = "password123"; // Replace with your desired password
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    const user = new User({
      email: "admin@example.com", // Replace with your desired email
      password: hashedPassword,
    });

    await user.save();
    console.log("User added successfully:", user);

    mongoose.disconnect();
  } catch (error) {
    console.error("Error adding user:", error.message);
  }
};

addUser();