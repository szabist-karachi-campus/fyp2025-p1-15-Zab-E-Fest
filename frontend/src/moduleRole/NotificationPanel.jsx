import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Drawer,
  Box,
  Card,
  CardContent,
  Typography,
  Divider,
} from "@mui/material";

const NotificationPanel = ({ open, onClose, userRole }) => {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    // Fetch notifications only when the drawer opens
    if (open) {
      axios
        .get(`/api/notifications/role/${userRole}`)
        .then((res) => setNotifications((res.data || []).reverse()))
        .catch((err) => console.error(err));
    }
  }, [open, userRole]);

  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box sx={{ width: 350, p: 2 }}>
        <Typography variant="h5" gutterBottom>
          📢 Admin Notifications
        </Typography>
        {notifications.length > 0 ? (
          notifications.map((note) => (
            <Card key={note._id} sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="body1">{note.message}</Typography>
                <Typography variant="caption" color="text.secondary">
                  Sent: {new Date(note.date).toLocaleString()}
                </Typography>
                {note.replies && note.replies.length > 0 && (
                  <>
                    <Divider sx={{ my: 1 }} />
                    <Typography variant="subtitle2">Replies</Typography>
                    {note.replies.map((r, idx) => (
                      <Box key={idx} sx={{ pl: 1, py: 0.5 }}>
                        <Typography variant="body2">
                          <strong>{r.sender}</strong>: {r.message}
                        </Typography>
                      </Box>
                    ))}
                  </>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <Typography variant="body2" color="text.secondary">
            No notifications available.
          </Typography>
        )}
      </Box>
    </Drawer>
  );
};

export default NotificationPanel;


