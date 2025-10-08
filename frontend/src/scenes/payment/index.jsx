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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import axios from "axios";

const PaymentProcessing = () => {
  const [applications, setApplications] = useState([]);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [feedbackDialog, setFeedbackDialog] = useState({ open: false, message: "", success: false });

  const [pendingApps, setPendingApps] = useState([]);
  const [acceptedApps, setAcceptedApps] = useState([]);
  const [rejectedApps, setRejectedApps] = useState([]);

  const fetchApplications = () => {
    axios
      .get("http://localhost:5000/api/apply-module")
      .then((response) => {
        const apps = response.data;
        setApplications(apps);
        setPendingApps(apps.filter((app) => app.status === "Pending"));
        setAcceptedApps(apps.filter((app) => app.status === "Accepted"));
        setRejectedApps(apps.filter((app) => app.status === "Rejected"));
      })
      .catch((error) => {
        console.error("Error fetching applications", error);
      });
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleView = (application) => {
    setSelectedApplication(application);
    setIsViewDialogOpen(true);
  };

  const handleCloseViewDialog = () => {
    setSelectedApplication(null);
    setIsViewDialogOpen(false);
  };

  const handleAccept = (applicationId) => {
    axios
      .put(`http://localhost:5000/api/participants/accept/${applicationId}`)
      .then(() => {
        fetchApplications();
        setFeedbackDialog({
          open: true,
          message: "Application accepted successfully.",
          success: true,
        });
        handleCloseViewDialog();
      })
      .catch((error) => {
        const msg = error.response?.data?.message || "Failed to accept application.";
        setFeedbackDialog({ open: true, message: msg, success: false });
      });
  };

  const handleReject = (applicationId) => {
    console.log("Rejecting application:", applicationId);

    axios
      .put(`http://localhost:5000/api/apply-module/reject/${applicationId}`)
      .then((response) => {
        fetchApplications();
        const emailStatus = response.data.emailStatus;
        let message = "Application rejected successfully.";
        
        if (emailStatus) {
          message += `\n\nEmail Status:\n- Total emails sent: ${emailStatus.totalEmails}\n- Successful: ${emailStatus.successfulEmails}\n- Failed: ${emailStatus.failedEmails}`;
        }
        
        setFeedbackDialog({
          open: true,
          message: message,
          success: true,
        });
        handleCloseViewDialog();
      })
      .catch((error) => {
        const msg = error.response?.data?.message || "Failed to reject application.";
        setFeedbackDialog({ open: true, message: msg, success: false });
      });
  };

  const renderTable = (title, apps, showActions = false) => (
    <Box mb={4}>
      <Typography variant="h6" gutterBottom>
        {title} Applications
      </Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Registration Token</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Roll Number</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Department</TableCell>
              <TableCell>University</TableCell>
              <TableCell>Contact Number</TableCell>
              <TableCell>Participant Type</TableCell>
              <TableCell>Module Name</TableCell>
              <TableCell>Module Fee</TableCell>
              {showActions && <TableCell>Actions</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {apps.map((application, index) =>
              (application.participants || []).map((participant, pIndex) => (
                <TableRow key={`${index}-${pIndex}`}>
                  {pIndex === 0 ? (
                    <TableCell rowSpan={application.participants.length} style={{ fontWeight: 'bold', color: '#1976d2' }}>
                      {application.registrationToken || 'N/A'}
                    </TableCell>
                  ) : null}
                  <TableCell>{participant.name}</TableCell>
                  <TableCell>{participant.rollNumber}</TableCell>
                  <TableCell>{participant.email}</TableCell>
                  <TableCell>{participant.department}</TableCell>
                  <TableCell>{participant.university}</TableCell>
                  <TableCell>{participant.contactNumber}</TableCell>
                  <TableCell>{application.participationType}</TableCell>
                  <TableCell>{application.moduleTitle}</TableCell>
                  <TableCell>{application.totalFee}</TableCell>
                  {showActions && pIndex === 0 && (
                    <TableCell rowSpan={application.participants.length}>
                      <Button color="primary" onClick={() => handleView(application)}>
                        View Details
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  return (
    <Box p={4}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Application Processing
      </Typography>

      <Box mb={4} display="flex" justifyContent="space-between">
        <Typography variant="h6">Pending: {pendingApps.length}</Typography>
        <Typography variant="h6">Accepted: {acceptedApps.length}</Typography>
        <Typography variant="h6">Rejected: {rejectedApps.length}</Typography>
      </Box>

      {renderTable("Pending", pendingApps, true)}
      {renderTable("Accepted", acceptedApps)}
      {renderTable("Rejected", rejectedApps)}
      <div>
    <h1>Applications</h1>
    <ul>
      {applications.map((application) => (
        <li key={application.id}>{application.name}</li>
      ))}
    </ul>
  </div>
      {/* View Application Dialog */}
      <Dialog open={isViewDialogOpen} onClose={handleCloseViewDialog} fullWidth maxWidth="sm">
        <DialogTitle>Application Details</DialogTitle>
        <DialogContent>
          {selectedApplication?.participants.map((participant, index) => (
            <Box key={index} mb={2}>
              <Typography>
                <strong>Name:</strong> {participant.name}
              </Typography>
              <Typography>
                <strong>Roll Number:</strong> {participant.rollNumber}
              </Typography>
              <Typography>
                <strong>Email:</strong> {participant.email}
              </Typography>
              <Typography>
                <strong>Contact:</strong> {participant.contactNumber}
              </Typography>
              <Typography>
                <strong>Department:</strong> {participant.department}
              </Typography>
              <Typography>
                <strong>University:</strong> {participant.university}
              </Typography>
            </Box>
          ))}
          <Typography>
            <strong>Module:</strong> {selectedApplication?.moduleTitle}
          </Typography>
          <Typography>
            <strong>Fee:</strong> {selectedApplication?.totalFee}
          </Typography>
          <Typography 
            sx={{ 
              mt: 1, 
              bgcolor: "#f0f4ff", 
              p: 1, 
              border: "1px solid #1976d2",
              borderRadius: 1,
              fontWeight: "bold"
            }}
          >
            <strong>Registration Token:</strong> {selectedApplication?.registrationToken || "N/A"}
          </Typography>
          {selectedApplication?.paymentScreenshot && (
            <Box mt={2}>
              <Typography>
                <strong>Payment Screenshot:</strong>
              </Typography>
              <img
                src={`http://localhost:5000/${selectedApplication.paymentScreenshot}`}
                alt="Payment"
                style={{ width: "100%", maxHeight: "400px", objectFit: "cover" }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseViewDialog} color="primary">
            Close
          </Button>
          <Button onClick={() => handleAccept(selectedApplication._id)} color="success">
            Accept
          </Button>
          <Button onClick={() => handleReject(selectedApplication._id)} color="error">
            Reject
          </Button>
        </DialogActions>
      </Dialog>

      {/* Feedback Dialog */}
      <Dialog open={feedbackDialog.open} onClose={() => setFeedbackDialog({ ...feedbackDialog, open: false })}>
        <DialogTitle>{feedbackDialog.success ? "Success" : "Error"}</DialogTitle>
        <DialogContent>
          <Typography style={{ whiteSpace: 'pre-line' }}>{feedbackDialog.message}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFeedbackDialog({ ...feedbackDialog, open: false })} color="primary">
            OK
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
    
  );
};

export default PaymentProcessing;
