import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
  Paper,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
} from "@mui/material";
import axios from "axios";

/**
 * NotificationManagement Component
 *
 * This component provides a full CRUD interface for notifications.
 * Admins can create, view, update, and delete notifications.
 * Additional filters allow users to narrow down notifications by recipient and search term.
 */
export const NotificationManagement = () => {
  // Notifications list loaded from the backend
  const [notifications, setNotifications] = useState([]);
  // Form state for creating a new notification
  const [newNotification, setNewNotification] = useState({
    title: "",
    message: "",
    recipient: "Everyone",
    type: "announcement",
    priority: "medium",
    module: "",
    image: null,
  });
  // Selected notification for editing
  const [editNotification, setEditNotification] = useState(null);
  // Controls visibility of the edit dialog
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  // Filter state: filter by recipient and search term
  const [filterRecipient, setFilterRecipient] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");

  /**
   * Fetch notifications from the backend and transform recipient roles.
   * This is called on component mount and whenever a CRUD action completes.
   */
  const fetchNotifications = async () => {
    try {
      const res = await axios.get("/api/notifications");
      const data = res.data || [];
      // Transform roles into a recipient string for display
      const transformed = data.map((n) => {
        const roles = n.role || n.roles || [];
        let recipient;
        if (
          roles.includes("Participant") &&
          roles.includes("ModuleHead") &&
          roles.includes("ModuleLeader")
        ) {
          recipient = "Everyone";
        } else if (roles.length === 1 && roles[0] === "Participant") {
          recipient = "Participants";
        } else if (
          roles.includes("ModuleHead") &&
          !roles.includes("ModuleLeader")
        ) {
          recipient = "Module Heads";
        } else if (
          roles.includes("ModuleLeader") &&
          !roles.includes("ModuleHead")
        ) {
          recipient = "Module Leaders";
        } else {
          recipient = roles.join(", ");
        }
        // Provide an id property if not present
        const id = n._id || n.id;
        return { ...n, recipient, id };
      });
      // Reverse to show latest notifications first
      setNotifications(transformed.reverse());
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    }
  };

  // Load notifications on mount
  useEffect(() => {
    fetchNotifications();
  }, []);

  /**
   * Handle creation of a new notification.
   * Sends a POST request then refreshes the notification list.
   */
  const handleSendNotification = async () => {
    if (!newNotification.title.trim() || !newNotification.message.trim()) {
      alert("❌ Title and message are required");
      return;
    }

    const formData = new FormData();
    formData.append("title", newNotification.title);
    formData.append("message", newNotification.message);
    formData.append("type", newNotification.type);
    formData.append("priority", newNotification.priority);
    
    if (newNotification.module) {
      formData.append("module", newNotification.module);
    }

    // Determine targetRole array based on recipient string
    const targetRoles =
      newNotification.recipient === "Everyone"
        ? ["Participant", "ModuleHead", "ModuleLeader"]
        : newNotification.recipient === "Participants"
        ? ["Participant"]
        : newNotification.recipient === "Module Heads"
        ? ["ModuleHead"]
        : ["ModuleLeader"];
    targetRoles.forEach((role) => formData.append("targetRole", role));

    // Add sender information
    const adminInfo = {
      name: localStorage.getItem("userName") || localStorage.getItem("adminName") || "Admin",
      role: localStorage.getItem("userRole") || localStorage.getItem("adminRole") || "Administrator"
    };
    formData.append("sender", JSON.stringify(adminInfo));
    
    // Log sender info for debugging
    console.log("Sending notification with sender:", adminInfo);

    if (newNotification.image) {
      formData.append("image", newNotification.image);
    }

    try {
      await axios.post("/api/notifications/send", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert("✅ Notification Sent Successfully");
      // Reload notifications from backend
      fetchNotifications();
      // Reset form
      setNewNotification({
        title: "",
        message: "",
        recipient: "Everyone",
        type: "announcement",
        priority: "medium",
        module: "",
        image: null,
      });
    } catch (err) {
      console.error("Failed to send notification:", err);
      alert(`❌ Failed to send notification: ${err.response?.data?.error || err.message}`);
    }
  };

  /**
   * Select a notification for editing and open the edit dialog.
   *
   * @param {object} notification The notification to edit
   */
  const handleEdit = (notification) => {
    setEditNotification(notification);
    setIsEditDialogOpen(true);
  };

  /**
   * Save changes to an existing notification.
   * Sends a PUT request with updated data.
   */
  const handleSaveEdit = async () => {
    if (!editNotification) return;
    try {
      const updateData = new FormData();
      updateData.append("message", editNotification.message);
      // Map recipient string back to roles array
      let roles;
      switch (editNotification.recipient) {
        case "Everyone":
          roles = ["Participant", "ModuleHead", "ModuleLeader"];
          break;
        case "Participants":
          roles = ["Participant"];
          break;
        case "Module Heads":
          roles = ["ModuleHead"];
          break;
        case "Module Leaders":
          roles = ["ModuleLeader"];
          break;
        default:
          roles = [editNotification.recipient];
      }
      roles.forEach((r) => updateData.append("role", r));
      // Attach image if it is a File (ignore existing image strings)
      if (editNotification.image && editNotification.image instanceof File) {
        updateData.append("image", editNotification.image);
      }
      const notifId = editNotification._id || editNotification.id;
      await axios.put(`/api/notifications/${notifId}`, updateData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      await fetchNotifications();
      setIsEditDialogOpen(false);
      setEditNotification(null);
    } catch (err) {
      console.error("Failed to update notification", err);
      alert("❌ Failed to update notification");
    }
  };

  /**
   * Delete a notification on the server.
   *
   * @param {string} id The ID of the notification to delete
   */
  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/notifications/${id}`);
      await fetchNotifications();
    } catch (err) {
      console.error("Failed to delete notification", err);
      alert("❌ Failed to delete notification");
    }
  };

  return (
    <Box p={4}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Notification Management
      </Typography>

      {/* Filters for recipient and search term */}
      <Box mb={3} display="flex" flexWrap="wrap" gap={2} alignItems="center">
        <FormControl sx={{ minWidth: 180 }}>
          <InputLabel id="filter-recipient-label">Filter by Recipient</InputLabel>
          <Select
            labelId="filter-recipient-label"
            value={filterRecipient}
            label="Filter by Recipient"
            onChange={(e) => setFilterRecipient(e.target.value)}
          >
            <MenuItem value="All">All</MenuItem>
            <MenuItem value="Everyone">Everyone</MenuItem>
            <MenuItem value="Participants">Participants</MenuItem>
            <MenuItem value="Module Heads">Module Heads</MenuItem>
            <MenuItem value="Module Leaders">Module Leaders</MenuItem>
          </Select>
        </FormControl>
        <TextField
          label="Search Message"
          variant="outlined"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ minWidth: 200 }}
        />
      </Box>

      {/* Form for sending new notifications */}
      <Box mb={3}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Notification Title"
              variant="outlined"
              value={newNotification.title}
              onChange={(e) =>
                setNewNotification({ ...newNotification, title: e.target.value })
              }
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Notification Message"
              variant="outlined"
              multiline
              rows={3}
              value={newNotification.message}
              onChange={(e) =>
                setNewNotification({ ...newNotification, message: e.target.value })
              }
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel id="recipient-label">Recipient</InputLabel>
              <Select
                labelId="recipient-label"
                value={newNotification.recipient}
                onChange={(e) =>
                  setNewNotification({
                    ...newNotification,
                    recipient: e.target.value,
                  })
                }
              >
                <MenuItem value="Everyone">Everyone</MenuItem>
                <MenuItem value="Participants">Participants</MenuItem>
                <MenuItem value="Module Heads">Module Heads</MenuItem>
                <MenuItem value="Module Leaders">Module Leaders</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel id="type-label">Type</InputLabel>
              <Select
                labelId="type-label"
                value={newNotification.type}
                onChange={(e) =>
                  setNewNotification({
                    ...newNotification,
                    type: e.target.value,
                  })
                }
              >
                <MenuItem value="announcement">Announcement</MenuItem>
                <MenuItem value="schedule">Schedule</MenuItem>
                <MenuItem value="payment">Payment</MenuItem>
                <MenuItem value="results">Results</MenuItem>
                <MenuItem value="event">Event</MenuItem>
                <MenuItem value="deadline">Deadline</MenuItem>
                <MenuItem value="feedback">Feedback</MenuItem>
                <MenuItem value="warning">Warning</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel id="priority-label">Priority</InputLabel>
              <Select
                labelId="priority-label"
                value={newNotification.priority}
                onChange={(e) =>
                  setNewNotification({
                    ...newNotification,
                    priority: e.target.value,
                  })
                }
              >
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="high">High</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Related Module (Optional)"
              variant="outlined"
              value={newNotification.module}
              onChange={(e) =>
                setNewNotification({ ...newNotification, module: e.target.value })
              }
              placeholder="e.g., Web Development"
            />
          </Grid>
          <Grid item xs={12}>
            <Grid container spacing={2} alignItems="center">
              <Grid item>
                <Button variant="contained" component="label">
                  Upload Image
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={(e) =>
                      setNewNotification({
                        ...newNotification,
                        image: e.target.files[0],
                      })
                    }
                  />
                </Button>
              </Grid>
              <Grid item>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSendNotification}
                  disabled={!newNotification.title || !newNotification.message}
                >
                  Send Notification
                </Button>
              </Grid>
              {newNotification.image && (
                <Grid item>
                  <Typography variant="body2" color="textSecondary">
                    {newNotification.image.name}
                  </Typography>
                </Grid>
              )}
            </Grid>
          </Grid>
        </Grid>
      </Box>

      {/* Notifications list */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Title & Message</TableCell>
              <TableCell>Type & Priority</TableCell>
              <TableCell>Recipients</TableCell>
              <TableCell>Module</TableCell>
              <TableCell>Sent By</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {notifications
              .filter((notification) => {
                const matchesRecipient =
                  filterRecipient === "All" ||
                  notification.recipient === filterRecipient;
                const matchesSearch = (
                  notification.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  notification.message?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  notification.module?.toLowerCase().includes(searchTerm.toLowerCase())
                );
                return matchesRecipient && matchesSearch;
              })
              .map((notification) => (
                <TableRow key={notification._id || notification.id}>
                  <TableCell>
                    <Typography variant="subtitle2" gutterBottom>
                      {notification.title || "Untitled"}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {notification.message}
                    </Typography>
                    {notification.image && (
                      <Box mt={1}>
                        <Typography variant="caption" color="primary">
                          📎 Has attachment
                        </Typography>
                      </Box>
                    )}
                  </TableCell>
                  <TableCell>
                    <Box display="flex" flexDirection="column" gap={1}>
                      <Box>
                        <Typography
                          component="span"
                          variant="body2"
                          sx={{
                            px: 1,
                            py: 0.5,
                            borderRadius: 1,
                            backgroundColor: (theme) => {
                              switch (notification.type) {
                                case 'warning': return theme.palette.warning.light;
                                case 'schedule': return theme.palette.info.light;
                                case 'results': return theme.palette.success.light;
                                case 'payment': return theme.palette.secondary.light;
                                default: return theme.palette.primary.light;
                              }
                            },
                            color: (theme) => {
                              switch (notification.type) {
                                case 'warning': return theme.palette.warning.dark;
                                case 'schedule': return theme.palette.info.dark;
                                case 'results': return theme.palette.success.dark;
                                case 'payment': return theme.palette.secondary.dark;
                                default: return theme.palette.primary.dark;
                              }
                            }
                          }}
                        >
                          {notification.type || 'announcement'}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography
                          component="span"
                          variant="body2"
                          sx={{
                            px: 1,
                            py: 0.5,
                            borderRadius: 1,
                            backgroundColor: (theme) => {
                              switch (notification.priority) {
                                case 'high': return theme.palette.error.light;
                                case 'low': return theme.palette.grey[200];
                                default: return theme.palette.warning.light;
                              }
                            },
                            color: (theme) => {
                              switch (notification.priority) {
                                case 'high': return theme.palette.error.dark;
                                case 'low': return theme.palette.grey[800];
                                default: return theme.palette.warning.dark;
                              }
                            }
                          }}
                        >
                          {notification.priority || 'medium'}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>{notification.recipient}</TableCell>
                  <TableCell>
                    {notification.module || '-'}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {notification.sender?.name || 'Admin'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {notification.sender?.role || 'Administrator'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {new Date(notification.date || notification.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Button
                      color="secondary"
                      onClick={() => handleEdit(notification)}
                      size="small"
                    >
                      Edit
                    </Button>
                    <Button
                      color="error"
                      onClick={() =>
                        handleDelete(notification._id || notification.id)
                      }
                      size="small"
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Edit dialog for modifying a notification */}
      <Dialog
        open={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        fullWidth
      >
        <DialogTitle>Edit Notification</DialogTitle>
        <DialogContent>
          {editNotification && (
            <>
              <TextField
                fullWidth
                label="Notification Message"
                variant="outlined"
                value={editNotification.message}
                onChange={(e) =>
                  setEditNotification({
                    ...editNotification,
                    message: e.target.value,
                  })
                }
                sx={{ mb: 2 }}
              />
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel id="edit-recipient-label">Recipient</InputLabel>
                <Select
                  labelId="edit-recipient-label"
                  value={editNotification.recipient}
                  onChange={(e) =>
                    setEditNotification({
                      ...editNotification,
                      recipient: e.target.value,
                    })
                  }
                >
                  <MenuItem value="Everyone">Everyone</MenuItem>
                  <MenuItem value="Participants">Participants</MenuItem>
                  <MenuItem value="Module Heads">Module Heads</MenuItem>
                  <MenuItem value="Module Leaders">Module Leaders</MenuItem>
                </Select>
              </FormControl>
              <Button variant="contained" component="label">
                Upload Image
                <input
                  type="file"
                  hidden
                  onChange={(e) =>
                    setEditNotification({
                      ...editNotification,
                      image: e.target.files[0],
                    })
                  }
                />
              </Button>
              {editNotification.image && (
                <Typography variant="body2" gutterBottom>
                  {typeof editNotification.image === "string"
                    ? editNotification.image
                    : editNotification.image.name}
                </Typography>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsEditDialogOpen(false)} color="secondary">
            Cancel
          </Button>
          <Button onClick={handleSaveEdit} color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default NotificationManagement;