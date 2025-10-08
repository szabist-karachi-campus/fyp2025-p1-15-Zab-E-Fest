import axios from "axios";

// Base API configuration
const API = axios.create({
  baseURL: "http://localhost:5000/api", // Adjust the baseURL to match your backend server
});

export const updateStudent = async (id, updatedData) => {
  const token = localStorage.getItem("token");

  const response = await API.put(`/students/${id}`, updatedData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};

export const deleteStudent = async (id) => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Authorization token is missing. Please sign in again.");

  const response = await API.delete(`/students/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};

// Register Student
export const registerStudent = async (studentData) => {
  const token = localStorage.getItem("token");
  if (!token) {
    console.error("No token found in localStorage.");
    throw new Error("Authorization token is missing. Please sign in again.");
  }

  console.log("Sending token:", token);

  try {
    const response = await API.post("/participants", studentData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error during student registration:", error.response || error);
    throw error;
  }
};

// Fetch Students
export const getStudents = async () => {
  const token = localStorage.getItem("token");
  if (!token) {
    throw new Error("Authorization token is missing. Please sign in again.");
  }

  const response = await API.get("/participants", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};
