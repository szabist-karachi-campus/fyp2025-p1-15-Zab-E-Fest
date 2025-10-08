import React, { useEffect, useState, useRef } from "react";
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Chip,
  Grid,
  IconButton,
  Tabs,
  Tab,
  Tooltip,
  CircularProgress,
  Card,
  CardContent,
  Divider,
  InputAdornment,
  Snackbar,
  Alert,
  useTheme,
  Avatar,
  Fade,
  Grow,
  Zoom
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import FilterListIcon from "@mui/icons-material/FilterList";
import SortIcon from "@mui/icons-material/Sort";
import DownloadIcon from "@mui/icons-material/Download";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import GradeIcon from "@mui/icons-material/Grade";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import Switch from "@mui/material/Switch";
import axios from "axios";
import { useReactToPrint } from 'react-to-print';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import EventBusyIcon from "@mui/icons-material/EventBusy";
import AddIcon from "@mui/icons-material/Add";
import EventIcon from "@mui/icons-material/Event";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import InfoIcon from "@mui/icons-material/Info";
import { Link } from "react-router-dom";

// API instance for results management
const axiosInstance = axios.create({
  baseURL: "http://localhost:5000/api",
  headers: {
    ...(localStorage.getItem("token") && {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    })
  }
});

// Add request interceptor for debugging
axiosInstance.interceptors.request.use(
  config => {
    console.log(`Request: ${config.method.toUpperCase()} ${config.baseURL}${config.url}`);
    return config;
  },
  error => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for debugging
axiosInstance.interceptors.response.use(
  response => {
    console.log(`Response from ${response.config.url}:`, response.status);
    return response;
  },
  error => {
    if (error.response) {
      console.error(`Response error ${error.response.status} from ${error.config.url}:`, error.response.data);
    } else {
      console.error('Response error:', error.message);
    }
    return Promise.reject(error);
  }
);

// API functions
const getEvents = async () => {
  try {
    console.log('Fetching events...');
    // Try both endpoints
    try {
      const response = await axiosInstance.get('/events');
      console.log('Events response:', response.data);
      return response.data;
    } catch (err) {
      console.log('Trying alternative endpoint...');
      const altResponse = await axiosInstance.get('/admin/events');
      console.log('Alternative events response:', altResponse.data);
      return altResponse.data;
    }
  } catch (error) {
    console.error('Error fetching events:', error);
    throw error;
  }
};

const getEventParticipants = async (eventId) => {
  try {
    console.log('Fetching participants for event:', eventId);
    const response = await axiosInstance.get(`/events/event-participants?eventId=${eventId}`);
    console.log('Participants response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching participants:', error);
    throw error;
  }
};

const ResultsManagement = () => {
  const theme = useTheme();
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [participants, setParticipants] = useState([]);
  const [filteredParticipants, setFilteredParticipants] = useState([]);
  const [loading, setLoading] = useState({ events: true, participants: false });
  const [tab, setTab] = useState(0);
  const [alert, setAlert] = useState({ open: false, message: "", severity: "info" });
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [filterDepartment, setFilterDepartment] = useState("");
  const [filterUniversity, setFilterUniversity] = useState("");
  const [filterGradeRange, setFilterGradeRange] = useState({ min: "", max: "" });
  const [filterAttendance, setFilterAttendance] = useState("all");
  
  // Result visibility states
  const [resultVisibility, setResultVisibility] = useState({});
  const [bulkVisibilityMode, setBulkVisibilityMode] = useState(false);
  const [selectedParticipants, setSelectedParticipants] = useState(new Set());
  
  // PDF export
  const printRef = useRef();
  
  // Memoize constants to prevent recreation on each render
  const stages = React.useMemo(() => ["Pre-Qualifier", "Final Round", "Winner"], []);
  
  // Load all events
  useEffect(() => {
    setLoading(prev => ({ ...prev, events: true }));
    
    getEvents()
      .then(data => {
        setEvents(data || []);
        if (data && data.length > 0) {
          setSelectedEvent(data[0]);
          setSelectedEventId(data[0]._id);
        }
      })
      .catch(err => {
        console.error("Error loading events:", err);
        setAlert({
          open: true,
          message: "Failed to load events. Please check the server connection.",
          severity: "error"
        });
        // Set empty events array to show no-data UI
        setEvents([]);
      })
      .finally(() => setLoading(prev => ({ ...prev, events: false })));
  }, []);
  
  // Handle event selection
  const handleEventChange = (e) => {
    const eventId = e.target.value;
    setSelectedEventId(eventId);
    const selected = events.find(event => event._id === eventId);
    setSelectedEvent(selected);
    // We don't need to fetch participants here as it will be triggered by the useEffect
    // that depends on selectedEvent
  };
  
  // Load participants when an event is selected
  useEffect(() => {
    if (!selectedEvent) return;
    
    setLoading(prev => ({ ...prev, participants: true }));
    
    getEventParticipants(selectedEvent._id)
      .then(data => {
        setParticipants(data || []);
        // Initialize result visibility state
        const visibilityState = {};
        (data || []).forEach(participant => {
          visibilityState[participant._id] = participant.resultVisible || false;
        });
        setResultVisibility(visibilityState);
      })
      .catch(err => {
        console.error("Error loading participants:", err);
        setAlert({
          open: true,
          message: "Failed to load participants",
          severity: "error"
        });
      })
      .finally(() => setLoading(prev => ({ ...prev, participants: false })));
  }, [selectedEvent?._id]); // Only depend on the ID, not the entire object
  
  // Apply filters and sorting to participants
  useEffect(() => {
    if (!participants.length) {
      setFilteredParticipants([]);
      return;
    }

    // First filter by stage
    let filtered = participants.filter(p => p.stage === stages[tab] || 
      (stages[tab] === "Pre-Qualifier" && !p.stage));

    // Apply search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(p => 
        p.name?.toLowerCase().includes(term) || 
        p.rollNumber?.toLowerCase().includes(term) ||
        p.department?.toLowerCase().includes(term) ||
        p.university?.toLowerCase().includes(term) ||
        p.email?.toLowerCase().includes(term)
      );
    }

    // Apply department filter
    if (filterDepartment) {
      filtered = filtered.filter(p => 
        p.department?.toLowerCase() === filterDepartment.toLowerCase()
      );
    }

    // Apply university filter
    if (filterUniversity) {
      filtered = filtered.filter(p => 
        p.university?.toLowerCase() === filterUniversity.toLowerCase()
      );
    }

    // Apply grade range filter
    if (filterGradeRange.min !== "") {
      filtered = filtered.filter(p => 
        p.grade && parseFloat(p.grade) >= parseFloat(filterGradeRange.min)
      );
    }
    if (filterGradeRange.max !== "") {
      filtered = filtered.filter(p => 
        p.grade && parseFloat(p.grade) <= parseFloat(filterGradeRange.max)
      );
    }

    // Apply attendance filter
    if (filterAttendance !== "all") {
      filtered = filtered.filter(p => {
        if (filterAttendance === "present") return p.attendance === "present";
        if (filterAttendance === "absent") return p.attendance === "absent";
        return true;
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let valueA, valueB;
      
      switch (sortBy) {
        case "name":
          valueA = a.name?.toLowerCase() || "";
          valueB = b.name?.toLowerCase() || "";
          break;
        case "rollNumber":
          valueA = a.rollNumber?.toLowerCase() || "";
          valueB = b.rollNumber?.toLowerCase() || "";
          break;
        case "department":
          valueA = a.department?.toLowerCase() || "";
          valueB = b.department?.toLowerCase() || "";
          break;
        case "university":
          valueA = a.university?.toLowerCase() || "";
          valueB = b.university?.toLowerCase() || "";
          break;
        case "grade":
          valueA = a.grade ? parseFloat(a.grade) : -1;
          valueB = b.grade ? parseFloat(b.grade) : -1;
          break;
        default:
          valueA = a.name?.toLowerCase() || "";
          valueB = b.name?.toLowerCase() || "";
      }
      
      if (sortOrder === "asc") {
        return valueA > valueB ? 1 : -1;
      } else {
        return valueA < valueB ? 1 : -1;
      }
    });

    setFilteredParticipants(filtered);
  }, [
    participants, 
    tab, 
    searchTerm, 
    sortBy, 
    sortOrder, 
    filterDepartment, 
    filterUniversity, 
    filterGradeRange.min, 
    filterGradeRange.max, 
    filterAttendance,
    stages
  ]);
  
  // Extract unique departments and universities for filters
  const departments = React.useMemo(() => 
    [...new Set(participants.filter(p => p.department).map(p => p.department))], 
    [participants]
  );
  
  const universities = React.useMemo(() => 
    [...new Set(participants.filter(p => p.university).map(p => p.university))], 
    [participants]
  );
  
  // Handle print to PDF
  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: `${selectedEvent?.title || 'Event'}_Results_${stages[tab]}`,
    onAfterPrint: () => setAlert({
      open: true,
      message: "Results printed successfully",
      severity: "success"
    })
  });
  
  // Generate and download PDF
  const generatePDF = () => {
    try {
      const doc = new jsPDF();
      
      // Add title
      doc.setFontSize(18);
      doc.text(`${selectedEvent?.title || 'Event'} - ${stages[tab]} Results`, 14, 22);
      
      // Add event details
      doc.setFontSize(12);
      doc.text(`Date: ${selectedEvent ? new Date(selectedEvent.date).toLocaleDateString() : 'N/A'}`, 14, 32);
      doc.text(`Location: ${selectedEvent?.location || 'N/A'}`, 14, 38);
      doc.text(`Module Head: ${selectedEvent?.moduleHead || 'N/A'}`, 14, 44);
      doc.text(`Module Leader: ${selectedEvent?.moduleLeader || 'N/A'}`, 14, 50);
      
      // Create table
      const tableColumn = ["Name", "Roll Number", "Department", "University", "Grade", "Attendance"];
      const tableRows = filteredParticipants.map(p => [
        p.name || '',
        p.rollNumber || '',
        p.department || '',
        p.university || '',
        p.grade || 'Not graded',
        p.attendance || 'Not marked'
      ]);
      
      // Add table to document using the imported autoTable function
      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 60,
        styles: { fontSize: 10, cellPadding: 3 },
        headStyles: { fillColor: [66, 66, 66] }
      });
      
      // Save the PDF
      doc.save(`${selectedEvent?.title || 'Event'}_${stages[tab]}_Results.pdf`);
      
      setAlert({
        open: true,
        message: "PDF downloaded successfully",
        severity: "success"
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      setAlert({
        open: true,
        message: "Failed to generate PDF: " + error.message,
        severity: "error"
      });
    }
  };
  
  // Handle individual result visibility toggle
  const handleToggleVisibility = async (participantId, isVisible) => {
    try {
      const response = await axiosInstance.put(`/participants/${participantId}/result-visibility`, {
        visible: isVisible
      });
      
      if (response.status === 200) {
        setResultVisibility(prev => ({
          ...prev,
          [participantId]: isVisible
        }));
        
        // Update participants state
        setParticipants(prev => 
          prev.map(p => 
            p._id === participantId ? { ...p, resultVisible: isVisible } : p
          )
        );
        
        setAlert({
          open: true,
          message: `Result visibility ${isVisible ? 'enabled' : 'disabled'} for participant`,
          severity: "success"
        });
      }
    } catch (error) {
      console.error("Error updating result visibility:", error);
      setAlert({
        open: true,
        message: "Failed to update result visibility",
        severity: "error"
      });
    }
  };

  // Handle bulk result visibility toggle
  const handleBulkVisibilityToggle = async (isVisible) => {
    try {
      const participantIds = Array.from(selectedParticipants);
      const promises = participantIds.map(id => 
        axiosInstance.put(`/participants/${id}/result-visibility`, {
          visible: isVisible
        })
      );
      
      await Promise.all(promises);
      
      // Update all selected participants
      const newVisibilityState = { ...resultVisibility };
      participantIds.forEach(id => {
        newVisibilityState[id] = isVisible;
      });
      setResultVisibility(newVisibilityState);
      
      // Update participants state
      setParticipants(prev => 
        prev.map(p => 
          selectedParticipants.has(p._id) ? { ...p, resultVisible: isVisible } : p
        )
      );
      
      setAlert({
        open: true,
        message: `Result visibility ${isVisible ? 'enabled' : 'disabled'} for ${participantIds.length} participants`,
        severity: "success"
      });
      
      // Clear selection
      setSelectedParticipants(new Set());
      setBulkVisibilityMode(false);
    } catch (error) {
      console.error("Error updating bulk result visibility:", error);
      setAlert({
        open: true,
        message: "Failed to update result visibility for some participants",
        severity: "error"
      });
    }
  };

  // Handle select all participants
  const handleSelectAll = () => {
    if (selectedParticipants.size === filteredParticipants.length) {
      setSelectedParticipants(new Set());
    } else {
      setSelectedParticipants(new Set(filteredParticipants.map(p => p._id)));
    }
  };

  // Handle individual participant selection
  const handleParticipantSelect = (participantId) => {
    const newSelected = new Set(selectedParticipants);
    if (newSelected.has(participantId)) {
      newSelected.delete(participantId);
    } else {
      newSelected.add(participantId);
    }
    setSelectedParticipants(newSelected);
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  return (
    <Box p={3}>
      <Fade in={true} timeout={800}>
        <Typography variant="h3" mb={2} fontWeight="bold">
          Results Management
        </Typography>
      </Fade>
      
      {/* Event Selection Section */}
      <Grow in={true} timeout={1000}>
        <Box mb={4}>
          <Paper sx={{ p: 3, borderRadius: '10px' }}>
            <Typography variant="h4" mb={3} fontWeight="bold" color="primary">
              Results Management
            </Typography>
            
            {loading.events ? (
              <Box display="flex" justifyContent="center" my={3}>
                <CircularProgress />
              </Box>
            ) : events.length === 0 ? (
              <Box 
                p={4} 
                textAlign="center" 
                border={1} 
                borderColor="divider" 
                borderRadius={2}
                bgcolor={theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)'}
              >
                <EventBusyIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  No events found
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={2}>
                  Create events first to manage their results
                </Typography>
                <Button 
                  variant="contained" 
                  component={Link} 
                  to="/event"
                  startIcon={<AddIcon />}
                >
                  Create Event
                </Button>
              </Box>
            ) : (
              <>
                <Grid container spacing={3} alignItems="center">
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel id="event-select-label">Select Event</InputLabel>
                      <Select
                        labelId="event-select-label"
                        value={selectedEventId}
                        label="Select Event"
                        onChange={handleEventChange}
                        startAdornment={<EventIcon sx={{ ml: 1, mr: 1, color: 'text.secondary' }} />}
                      >
                        {events.map(event => (
                          <MenuItem key={event._id} value={event._id}>
                            {event.title}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  {selectedEvent && (
                    <Grid item xs={12} md={6}>
                      <Card variant="outlined" sx={{ p: 2 }}>
                        <Box display="flex" alignItems="center" gap={2}>
                          <Avatar 
                            sx={{ 
                              bgcolor: theme.palette.primary.main,
                              width: 56,
                              height: 56
                            }}
                          >
                            <EventIcon />
                          </Avatar>
                          <Box>
                            <Typography variant="h6" fontWeight="bold">
                              {selectedEvent.title}
                            </Typography>
                            <Box display="flex" gap={2} mt={0.5}>
                              <Typography variant="body2" color="text.secondary" display="flex" alignItems="center">
                                <CalendarTodayIcon sx={{ fontSize: 16, mr: 0.5 }} />
                                {formatDate(selectedEvent.date)}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" display="flex" alignItems="center">
                                <LocationOnIcon sx={{ fontSize: 16, mr: 0.5 }} />
                                {selectedEvent.location}
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                      </Card>
                    </Grid>
                  )}
                </Grid>
                
                {selectedEvent && (
                  <Box mt={3} p={2} bgcolor={theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)'} borderRadius={1}>
                    <Typography variant="body2" color="text.secondary">
                      <InfoIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'text-bottom' }} />
                      Manage results for all participants in this event. You can filter by stage, grade, and attendance.
                    </Typography>
                  </Box>
                )}
              </>
            )}
          </Paper>
        </Box>
      </Grow>
      
      {selectedEvent && (
        <Fade in={true} timeout={1200}>
          <div>
            {/* Event Details */}
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h5" gutterBottom>
                {selectedEvent.title}
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={3}>
                  <Typography variant="body1">
                    <strong>Date:</strong> {formatDate(selectedEvent.date)}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Typography variant="body1">
                    <strong>Location:</strong> {selectedEvent.location}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Typography variant="body1">
                    <strong>Module Head:</strong> {selectedEvent.moduleHead}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Typography variant="body1">
                    <strong>Module Leader:</strong> {selectedEvent.moduleLeader}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
            
            {/* Participants Section */}
            <Box mb={3}>
              {/* Header with search and actions */}
              <Paper sx={{ p: 2, mb: 3 }}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} md={4}>
                    <Typography variant="h5">
                      {loading.participants ? (
                        <Box display="flex" alignItems="center" gap={1}>
                          <CircularProgress size={20} />
                          <span>Loading participants...</span>
                        </Box>
                      ) : (
                        `Participants (${filteredParticipants.length})`
                      )}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={8}>
                    <Box display="flex" gap={1} justifyContent="flex-end" flexWrap="wrap">
                      <TextField
                        placeholder="Search participants..."
                        size="small"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        sx={{ minWidth: 220 }}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <SearchIcon />
                            </InputAdornment>
                          ),
                        }}
                      />
                      <Button
                        variant="contained"
                        startIcon={<PictureAsPdfIcon />}
                        onClick={generatePDF}
                        color="primary"
                      >
                        Export PDF
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<DownloadIcon />}
                        onClick={handlePrint}
                      >
                        Print
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
              
              {/* Advanced Filters */}
              <Paper sx={{ p: 2, mb: 3 }}>
                <Box mb={2}>
                  <Typography variant="subtitle1" fontWeight="bold" display="flex" alignItems="center">
                    <FilterListIcon sx={{ mr: 1 }} />
                    Advanced Filters
                  </Typography>
                </Box>
                
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={6} md={2}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Sort By</InputLabel>
                      <Select
                        value={sortBy}
                        label="Sort By"
                        onChange={(e) => setSortBy(e.target.value)}
                        startAdornment={<SortIcon sx={{ mr: 1, ml: -0.5 }} />}
                      >
                        <MenuItem value="name">Name</MenuItem>
                        <MenuItem value="rollNumber">Roll Number</MenuItem>
                        <MenuItem value="department">Department</MenuItem>
                        <MenuItem value="university">University</MenuItem>
                        <MenuItem value="grade">Grade</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={2}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Order</InputLabel>
                      <Select
                        value={sortOrder}
                        label="Order"
                        onChange={(e) => setSortOrder(e.target.value)}
                      >
                        <MenuItem value="asc">Ascending</MenuItem>
                        <MenuItem value="desc">Descending</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={2}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Department</InputLabel>
                      <Select
                        value={filterDepartment}
                        label="Department"
                        onChange={(e) => setFilterDepartment(e.target.value)}
                      >
                        <MenuItem value="">All Departments</MenuItem>
                        {departments.map(dept => (
                          <MenuItem key={dept} value={dept}>{dept}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={2}>
                    <FormControl fullWidth size="small">
                      <InputLabel>University</InputLabel>
                      <Select
                        value={filterUniversity}
                        label="University"
                        onChange={(e) => setFilterUniversity(e.target.value)}
                      >
                        <MenuItem value="">All Universities</MenuItem>
                        {universities.map(univ => (
                          <MenuItem key={univ} value={univ}>{univ}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={2}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Attendance</InputLabel>
                      <Select
                        value={filterAttendance}
                        label="Attendance"
                        onChange={(e) => setFilterAttendance(e.target.value)}
                      >
                        <MenuItem value="all">All</MenuItem>
                        <MenuItem value="present">Present</MenuItem>
                        <MenuItem value="absent">Absent</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={2}>
                    <Box display="flex" gap={1}>
                      <TextField
                        label="Min Grade"
                        type="number"
                        size="small"
                        value={filterGradeRange.min}
                        onChange={(e) => setFilterGradeRange(prev => ({ ...prev, min: e.target.value }))}
                        sx={{ width: '50%' }}
                      />
                      <TextField
                        label="Max Grade"
                        type="number"
                        size="small"
                        value={filterGradeRange.max}
                        onChange={(e) => setFilterGradeRange(prev => ({ ...prev, max: e.target.value }))}
                        sx={{ width: '50%' }}
                      />
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} display="flex" justifyContent="flex-end">
                    <Button 
                      variant="outlined" 
                      color="secondary"
                      onClick={() => {
                        setSearchTerm("");
                        setSortBy("name");
                        setSortOrder("asc");
                        setFilterDepartment("");
                        setFilterUniversity("");
                        setFilterGradeRange({ min: "", max: "" });
                        setFilterAttendance("all");
                      }}
                      sx={{ mr: 1 }}
                    >
                      Reset Filters
                    </Button>
                  </Grid>
                </Grid>
              </Paper>
              
              {/* Result Visibility Controls */}
              <Paper sx={{ p: 2, mb: 3 }}>
                <Box mb={2}>
                  <Typography variant="subtitle1" fontWeight="bold" display="flex" alignItems="center">
                    <VisibilityIcon sx={{ mr: 1 }} />
                    Result Visibility Management
                  </Typography>
                </Box>
                
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} md={6}>
                    <Box display="flex" gap={2} alignItems="center">
                      <Button
                        variant={bulkVisibilityMode ? "contained" : "outlined"}
                        onClick={() => setBulkVisibilityMode(!bulkVisibilityMode)}
                        startIcon={<VisibilityIcon />}
                        color="primary"
                      >
                        {bulkVisibilityMode ? "Exit Bulk Mode" : "Bulk Visibility Control"}
                      </Button>
                      
                      {bulkVisibilityMode && (
                        <>
                          <Button
                            variant="contained"
                            color="success"
                            onClick={() => handleBulkVisibilityToggle(true)}
                            disabled={selectedParticipants.size === 0}
                            startIcon={<VisibilityIcon />}
                          >
                            Show Selected ({selectedParticipants.size})
                          </Button>
                          <Button
                            variant="contained"
                            color="error"
                            onClick={() => handleBulkVisibilityToggle(false)}
                            disabled={selectedParticipants.size === 0}
                            startIcon={<VisibilityOffIcon />}
                          >
                            Hide Selected ({selectedParticipants.size})
                          </Button>
                        </>
                      )}
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="text.secondary">
                      {bulkVisibilityMode 
                        ? "Select participants and use bulk actions to control result visibility"
                        : "Toggle individual switches or use bulk mode for multiple participants"
                      }
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
              
              <Tabs
                value={tab}
                onChange={(_, v) => setTab(v)}
                centered
                sx={{ 
                  mb: 2,
                  '& .MuiTabs-flexContainer': {
                    borderBottom: '1px solid #e0e0e0',
                  },
                  '& .MuiTab-root': {
                    fontWeight: 'bold',
                    fontSize: '0.9rem',
                    transition: 'all 0.2s',
                    '&:hover': {
                      backgroundColor: 'rgba(0, 0, 0, 0.04)',
                    },
                  },
                  '& .Mui-selected': {
                    color: theme.palette.primary.main,
                    fontWeight: 'bold',
                  }
                }}
              >
                {stages.map(s => (
                  <Tab 
                    key={s} 
                    label={s} 
                    icon={s === "Winner" ? <EmojiEventsIcon /> : null}
                    iconPosition="end"
                  />
                ))}
              </Tabs>
              
              {/* Results Table */}
              {loading.participants ? (
                <Box display="flex" justifyContent="center" my={4}>
                  <CircularProgress />
                </Box>
              ) : (
                <div ref={printRef}>
                  <Box p={2} mb={2} sx={{ display: 'none', '@media print': { display: 'block' } }}>
                    <Typography variant="h5" gutterBottom>
                      {selectedEvent.title} - {stages[tab]} Results
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      Date: {formatDate(selectedEvent.date)}
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      Location: {selectedEvent.location}
                    </Typography>
                  </Box>
                  
                  <Paper sx={{ 
                    borderRadius: '8px',
                    overflow: 'hidden',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
                  }}>
                    <TableContainer sx={{ maxHeight: 600 }}>
                      <Table stickyHeader>
                        <TableHead>
                          <TableRow sx={{ 
                            '& th': { 
                              backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[800] : theme.palette.primary.light,
                              color: theme.palette.mode === 'dark' ? 'white' : theme.palette.primary.contrastText,
                              fontWeight: 'bold',
                              fontSize: '0.875rem'
                            } 
                          }}>
                            {bulkVisibilityMode && (
                              <TableCell padding="checkbox">
                                <Switch
                                  checked={selectedParticipants.size === filteredParticipants.length && filteredParticipants.length > 0}
                                  indeterminate={selectedParticipants.size > 0 && selectedParticipants.size < filteredParticipants.length}
                                  onChange={handleSelectAll}
                                  color="primary"
                                />
                              </TableCell>
                            )}
                            <TableCell>Name</TableCell>
                            <TableCell>Roll Number</TableCell>
                            <TableCell>Email</TableCell>
                            <TableCell>Department</TableCell>
                            <TableCell>University</TableCell>
                            <TableCell align="center">Grade</TableCell>
                            <TableCell align="center">Attendance</TableCell>
                            <TableCell align="center">Result Visible</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {filteredParticipants.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={bulkVisibilityMode ? 8 : 7} align="center" sx={{ py: 6 }}>
                                <Box display="flex" flexDirection="column" alignItems="center" gap={1}>
                                  <Typography variant="h6" color="text.secondary">
                                    No participants found for this stage
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    Try adjusting your filters or select a different stage
                                  </Typography>
                                </Box>
                              </TableCell>
                            </TableRow>
                          ) : (
                            filteredParticipants.map((p, index) => (
                              <TableRow 
                                key={p._id}
                                sx={{ 
                                  backgroundColor: index % 2 === 0 ? 'inherit' : theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
                                  '&:hover': {
                                    backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.04)',
                                  }
                                }}
                              >
                                {bulkVisibilityMode && (
                                  <TableCell padding="checkbox">
                                    <Switch
                                      checked={selectedParticipants.has(p._id)}
                                      onChange={() => handleParticipantSelect(p._id)}
                                      color="primary"
                                    />
                                  </TableCell>
                                )}
                                <TableCell sx={{ fontWeight: 'medium' }}>{p.name}</TableCell>
                                <TableCell>{p.rollNumber}</TableCell>
                                <TableCell>{p.email}</TableCell>
                                <TableCell>{p.department}</TableCell>
                                <TableCell>{p.university}</TableCell>
                                <TableCell align="center">
                                  {p.grade ? (
                                    <Tooltip title={p.comments || "No comments"}>
                                      <Chip 
                                        icon={<GradeIcon />}
                                        label={p.grade} 
                                        color={
                                          parseFloat(p.grade) >= 80 ? "success" :
                                          parseFloat(p.grade) >= 60 ? "primary" :
                                          "warning"
                                        }
                                        size="small"
                                        sx={{ minWidth: 70 }}
                                      />
                                    </Tooltip>
                                  ) : (
                                    <Chip 
                                      label="Not graded" 
                                      color="default" 
                                      size="small"
                                      variant="outlined"
                                      sx={{ minWidth: 90 }}
                                    />
                                  )}
                                </TableCell>
                                <TableCell align="center">
                                  {p.attendance === "present" ? (
                                    <Tooltip title={p.notes || "No notes"}>
                                      <Chip 
                                        icon={<CheckCircleIcon />} 
                                        label="Present" 
                                        color="success" 
                                        size="small"
                                        sx={{ minWidth: 90 }}
                                      />
                                    </Tooltip>
                                  ) : p.attendance === "absent" ? (
                                    <Tooltip title={p.notes || "No notes"}>
                                      <Chip 
                                        icon={<CancelIcon />} 
                                        label="Absent" 
                                        color="error" 
                                        size="small"
                                        sx={{ minWidth: 90 }}
                                      />
                                    </Tooltip>
                                  ) : (
                                    <Chip 
                                      label="Not marked" 
                                      color="default" 
                                      size="small"
                                      variant="outlined"
                                      sx={{ minWidth: 90 }}
                                    />
                                  )}
                                </TableCell>
                                <TableCell align="center">
                                  <Switch
                                    checked={resultVisibility[p._id] || false}
                                    onChange={(e) => handleToggleVisibility(p._id, e.target.checked)}
                                    color="success"
                                    size="small"
                                  />
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                    {filteredParticipants.length > 0 && (
                      <Box p={2} display="flex" justifyContent="flex-end" alignItems="center" borderTop={1} borderColor="divider">
                        <Typography variant="body2" color="text.secondary">
                          Showing {filteredParticipants.length} {filteredParticipants.length === 1 ? 'participant' : 'participants'}
                        </Typography>
                      </Box>
                    )}
                  </Paper>
                </div>
              )}
            </Box>
          </div>
        </Fade>
      )}
      
      <Snackbar
        open={alert.open}
        autoHideDuration={6000}
        onClose={() => setAlert(prev => ({ ...prev, open: false }))}
        TransitionComponent={Zoom}
      >
        <Alert 
          onClose={() => setAlert(prev => ({ ...prev, open: false }))} 
          severity={alert.severity}
          variant="filled"
          elevation={6}
          sx={{ width: '100%' }}
        >
          {alert.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ResultsManagement;
