// import User from "../../models/registrationTeamModels/User.js"; // Registration Team model
// import bcrypt from "bcryptjs";
// import jwt from "jsonwebtoken";

// export const signIn = async (req, res) => {
//   const { email, password } = req.body;

//   try {
//     const user = await User.findOne({ email });
//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     const isMatch = await bcrypt.compare(password, user.password);
//     if (!isMatch) {
//       return res.status(401).json({ message: "Invalid credentials" });
//     }

//     const token = jwt.sign({ id: user._id, role: "registrationTeam" }, process.env.JWT_SECRET, {
//       expiresIn: "10h",
//     });

//     res.status(200).json({ token, role: "registrationTeam" });
//   } catch (error) {
//     console.error("Sign-In Error:", error.message);
//     res.status(500).json({ message: "Server error" });
//   }
// };
