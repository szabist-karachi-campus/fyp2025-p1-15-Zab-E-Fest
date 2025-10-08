import axios from "axios";

// Base API configuration
const API = axios.create({
  baseURL: "http://localhost:5000/api", // Adjust the baseURL to match your backend server
});

export const getStudents = async () => {
  const token = localStorage.getItem("token"); // Retrieve the token from localStorage
  if (!token) {
    throw new Error("Authorization token is missing. Please sign in again.");
  }

  const response = await API.get("/students", {
    headers: {
      Authorization: `Bearer ${token}`, // Add the token to the request header
    },
  });

  return response.data;
};

// Results management API endpoints
export const getEvents = async () => {
  const response = await axios.get('/api/admin/events');
  return response.data;
};

export const getEventParticipants = async (eventId) => {
  const response = await axios.get(`/api/admin/event-participants?eventId=${eventId}`);
  return response.data;
};