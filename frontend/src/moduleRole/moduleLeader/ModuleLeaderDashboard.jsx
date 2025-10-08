import React, { useState, useEffect } from "react";
import { 
  Box, 
  Typography, 
  Button, 
  TextField, 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableRow, 
  TableContainer, 
  Paper, 
  CircularProgress,
  Card,
  CardContent,
  Grid,
  AppBar,
  Toolbar,
  IconButton,
  Tabs,
  Tab,
  Alert,
  Snackbar,
  Chip,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Tooltip,
  Switch,
  FormControlLabel,
  Checkbox
} from "@mui/material";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../../state/authSlice"; // Import logout action
import { useNavigate } from "react-router-dom";
import LogoutIcon from "@mui/icons-material/Logout";
import EventIcon from "@mui/icons-material/Event";
import PersonIcon from "@mui/icons-material/Person";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import DateRangeIcon from "@mui/icons-material/DateRange";
import GroupIcon from "@mui/icons-material/Group";
import FilterListIcon from "@mui/icons-material/FilterList";
import SearchIcon from "@mui/icons-material/Search";
import SortIcon from "@mui/icons-material/Sort";
import GradeIcon from "@mui/icons-material/Grade";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import NotificationPanel from "../NotificationPanel"; 
import NotificationsOutlined from "@mui/icons-material/NotificationsOutlined";

const axiosInstance = axios.create({
  baseURL: "http://localhost:5000/api/moduleRole",
  headers: {
    ...(localStorage.getItem("token") && {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    })
  }
});

const ModuleLeaderDashboard = () => {
  const [email, setEmail] = useState("");
  const [leaderName, setLeaderName] = useState("");
  const [events, setEvents] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [filteredParticipants, setFilteredParticipants] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [eventDetails, setEventDetails] = useState(null);
  const [tab, setTab] = useState(0);
  const [selected, setSelected] = useState(null);
  const [attendanceValue, setAttendanceValue] = useState(false);
  const [attendanceNotes, setAttendanceNotes] = useState("");
  const [bulkAttendance, setBulkAttendance] = useState([]);
  const [showBulkAttendance, setShowBulkAttendance] = useState(false);
  const [loading, setLoading] = useState({ profile: true, events: true, parts: false });
  const [actionLoading, setActionLoading] = useState({ save: false });
  const [alert, setAlert] = useState({ open: false, msg: "", sev: "info" });
  
  // Filter states
  const [filterOpen, setFilterOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [filterDepartment, setFilterDepartment] = useState("");
  const [filterUniversity, setFilterUniversity] = useState("");
  const [filterAttendance, setFilterAttendance] = useState("all");
  const [openNotifications, setOpenNotifications] = useState(false);

  const stages = ["Pre-Qualifier", "Final Round", "Winner"];
  
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);

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
        p.name.toLowerCase().includes(term) || 
        p.rollNumber.toLowerCase().includes(term) ||
        p.department.toLowerCase().includes(term) ||
        p.university.toLowerCase().includes(term)
      );
    }

    // Apply department filter
    if (filterDepartment) {
      filtered = filtered.filter(p => 
        p.department.toLowerCase() === filterDepartment.toLowerCase()
      );
    }

    // Apply university filter
    if (filterUniversity) {
      filtered = filtered.filter(p => 
        p.university.toLowerCase() === filterUniversity.toLowerCase()
      );
    }

    // Apply attendance filter
    if (filterAttendance !== "all") {
      const isPresent = filterAttendance === "present";
      filtered = filtered.filter(p => {
        if (p.attendance === "present") return isPresent;
        if (p.attendance === "absent") return !isPresent;
        return !isPresent; // If attendance is not set, consider as absent
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let valueA, valueB;
      
      switch (sortBy) {
        case "name":
          valueA = a.name.toLowerCase();
          valueB = b.name.toLowerCase();
          break;
        case "rollNumber":
          valueA = a.rollNumber.toLowerCase();
          valueB = b.rollNumber.toLowerCase();
          break;
        case "department":
          valueA = a.department.toLowerCase();
          valueB = b.department.toLowerCase();
          break;
        case "university":
          valueA = a.university.toLowerCase();
          valueB = b.university.toLowerCase();
          break;
        default:
          valueA = a.name.toLowerCase();
          valueB = b.name.toLowerCase();
      }
      
      if (sortOrder === "asc") {
        return valueA > valueB ? 1 : -1;
      } else {
        return valueA < valueB ? 1 : -1;
      }
    });

    setFilteredParticipants(filtered);
  }, [participants, tab, searchTerm, sortBy, sortOrder, filterDepartment, filterUniversity, filterAttendance]);

  // 1) Load email and leaderName
  useEffect(() => {
    const u = localStorage.getItem("user");
    if (!u) {
      setAlert({ open: true, msg: "Not logged in", sev: "error" });
      return;
    }
    const user = JSON.parse(u);
    setEmail(user.email);

    axiosInstance
      .get("/user", { params: { email: user.email } })
      .then(res => setLeaderName(res.data.name))
      .catch(err => console.error("Failed to load leader profile:", err))
      .finally(() => setLoading(l => ({ ...l, profile: false })));
  }, []);

  // 2) Load assigned events
  useEffect(() => {
    if (!email && !leaderName) return;
    setLoading(l => ({ ...l, events: true }));
    
    axiosInstance
      .get("/module-leader/events", { 
        params: { 
          email,
          name: leaderName 
        } 
      })
      .then(res => {
        const eventsData = res.data.events || [];
        setEvents(eventsData);
        if (eventsData.length > 0) {
          setAlert({ open: true, msg: `Found ${eventsData.length} assigned events`, sev: "success" });
        } else {
          setAlert({ open: true, msg: "No events assigned to you yet", sev: "info" });
        }
      })
      .catch(err => {
        console.error("Failed to load assigned events:", err);
        setAlert({ open: true, msg: err.response?.data?.message || err.message, sev: "error" });
      })
      .finally(() => setLoading(l => ({ ...l, events: false })));
  }, [email, leaderName]);

  // 3) Load participants for the selected event
  useEffect(() => {
    if (!selectedEvent) return;
    setLoading(l => ({ ...l, parts: true }));
    
    axiosInstance
      .get("/event/participants", { params: { eventTitle: selectedEvent.title } })
      .then(res => {
        const participantsData = res.data.participants || [];
        setParticipants(participantsData);
        setEventDetails(res.data.eventDetails);
        
        // Initialize bulk attendance array
        setBulkAttendance(
          participantsData.map(p => ({
            id: p._id,
            name: p.name,
            isPresent: p.attendance === "present",
            notes: ""
          }))
        );
      })
      .catch(err => {
        console.error("Failed to load participants:", err);
        setAlert({ open: true, msg: err.response?.data?.message || err.message, sev: "error" });
      })
      .finally(() => setLoading(l => ({ ...l, parts: false })));
  }, [selectedEvent]);

  // Extract unique departments and universities for filters
  const departments = [...new Set(participants.map(p => p.department))];
  const universities = [...new Set(participants.map(p => p.university))];

  const updateAttendance = async id => {
    if (!selected) return;
    
    setActionLoading(a => ({ ...a, save: true }));
    try {
      const { data } = await axiosInstance.put(`/attendance/${id}`, { 
        attendance: attendanceValue ? "present" : "absent",
        notes: attendanceNotes
      });
      
      setParticipants(ps => ps.map(p => (p._id === id ? {
        ...p,
        attendance: data.attendance
      } : p)));
      
      setAlert({ open: true, msg: "Attendance updated", sev: "success" });
      setSelected(null);
      setAttendanceValue(false);
      setAttendanceNotes("");
    } catch (err) {
      console.error("Save attendance error:", err);
      setAlert({ open: true, msg: "Update failed", sev: "error" });
    } finally {
      setActionLoading(a => ({ ...a, save: false }));
    }
  };

  const handleBulkAttendanceChange = (id, isPresent) => {
    setBulkAttendance(prev => 
      prev.map(item => 
        item.id === id ? { ...item, isPresent } : item
      )
    );
  };

  const handleBulkAttendanceNotes = (id, notes) => {
    setBulkAttendance(prev => 
      prev.map(item => 
        item.id === id ? { ...item, notes } : item
      )
    );
  };

  const saveBulkAttendance = async () => {
    setActionLoading(a => ({ ...a, save: true }));
    
    try {
      // Create an array of promises for each attendance update
      const updatePromises = bulkAttendance.map(item => 
        axiosInstance.put(`/attendance/${item.id}`, {
          attendance: item.isPresent ? "present" : "absent",
          notes: item.notes
        })
      );
      
      // Wait for all updates to complete
      const results = await Promise.all(updatePromises);
      
      // Update the participants state with new attendance values
      const updatedParticipants = [...participants];
      results.forEach((result, index) => {
        const participantId = bulkAttendance[index].id;
        const participantIndex = updatedParticipants.findIndex(p => p._id === participantId);
        if (participantIndex !== -1) {
          updatedParticipants[participantIndex].attendance = result.data.attendance;
        }
      });
      
      setParticipants(updatedParticipants);
      setAlert({ open: true, msg: "Bulk attendance updated successfully", sev: "success" });
      setShowBulkAttendance(false);
    } catch (err) {
      console.error("Bulk attendance update error:", err);
      setAlert({ open: true, msg: "Bulk update failed", sev: "error" });
    } finally {
      setActionLoading(a => ({ ...a, save: false }));
    }
  };

  // Logout function
  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    dispatch(logout());
    navigate("/login");
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const handleFilterReset = () => {
    setSearchTerm("");
    setSortBy("name");
    setSortOrder("asc");
    setFilterDepartment("");
    setFilterUniversity("");
    setFilterAttendance("all");
    setFilterOpen(false);
  };

  return (
    <Box>
      <AppBar position="static">
  <Toolbar sx={{ justifyContent: "space-between" }}>
    <Typography variant="h6">Module Leader Dashboard</Typography>
    <Box display="flex" alignItems="center" gap={2}>
      {loading.profile ? (
        <CircularProgress size={20} color="inherit" />
      ) : (
        <>
          <Typography>Hi, {leaderName}</Typography>
        </>
      )}
      {/* Bell icon opens the notifications drawer */}
      <IconButton
        color="inherit"
        onClick={() => setOpenNotifications(true)}
      >
        <NotificationsOutlined />
      </IconButton>
      <IconButton onClick={handleLogout} color="inherit">
        <LogoutIcon />
      </IconButton>
    </Box>
    {/* Notification drawer */}
    <NotificationPanel
      open={openNotifications}
      onClose={() => setOpenNotifications(false)}
      userRole="ModuleLeader"
    />
  </Toolbar>
</AppBar>


      <Box p={4} maxWidth={1200} mx="auto">
        <Typography variant="h4" gutterBottom>
          Your Assigned Events
        </Typography>

        {loading.events ? (
          <Box textAlign="center" my={4}><CircularProgress /></Box>
        ) : (
          <Grid container spacing={3} mb={4}>
            {events.length === 0 ? (
              <Grid item xs={12}>
                <Paper sx={{ p: 3, textAlign: 'center' }}>
                  <Typography variant="h6" color="text.secondary">No events assigned to you yet</Typography>
                </Paper>
              </Grid>
            ) : (
              events.map(event => (
                <Grid item xs={12} md={6} lg={4} key={event._id}>
                  <Card 
                    sx={{ 
                      cursor: 'pointer',
                      transition: 'all 0.3s',
                      transform: selectedEvent?._id === event._id ? 'scale(0.98)' : 'scale(1)',
                      boxShadow: selectedEvent?._id === event._id ? '0 0 0 2px #1976d2' : undefined,
                      '&:hover': { transform: 'translateY(-5px)' }
                    }}
                    onClick={() => setSelectedEvent(event)}
                  >
                    <CardContent>
                      <Box display="flex" alignItems="center" mb={1}>
                        <EventIcon sx={{ mr: 1, color: 'primary.main' }} />
                        <Typography variant="h6" component="div">
                          {event.title}
                        </Typography>
                      </Box>
                      <Box display="flex" alignItems="center" mb={1}>
                        <DateRangeIcon sx={{ mr: 1, fontSize: 'small', color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          {formatDate(event.date)}
                        </Typography>
                      </Box>
                      <Box display="flex" alignItems="center" mb={1}>
                        <LocationOnIcon sx={{ mr: 1, fontSize: 'small', color: 'text.secondary' }} />
                        <Typography variant="body2">
                          {event.location}
                        </Typography>
                      </Box>
                      <Box display="flex" alignItems="center">
                        <GroupIcon sx={{ mr: 1, fontSize: 'small', color: 'text.secondary' }} />
                        <Typography variant="body2">
                          Capacity: {event.cap} participants
                        </Typography>
                      </Box>
                      <Divider sx={{ my: 1.5 }} />
                      <Chip 
                        label={`You are Module Leader`} 
                        size="small" 
                        color="secondary" 
                        variant="outlined"
                      />
                    </CardContent>
                  </Card>
                </Grid>
              ))
            )}
          </Grid>
        )}

        {selectedEvent && eventDetails && (
          <>
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h5" gutterBottom>
                {eventDetails.title}
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <Box display="flex" alignItems="center">
                    <DateRangeIcon sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="body1">
                      Date: {formatDate(eventDetails.date)}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box display="flex" alignItems="center">
                    <LocationOnIcon sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="body1">
                      Location: {eventDetails.location}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box display="flex" alignItems="center">
                    <GroupIcon sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="body1">
                      Module Head: {eventDetails.moduleHead}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Paper>

            <Box mb={3}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h5">
                  Participants ({filteredParticipants.length})
                </Typography>
                <Box display="flex" gap={1}>
                  <TextField
                    placeholder="Search participants..."
                    size="small"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                  <Button 
                    startIcon={<FilterListIcon />}
                    variant="outlined"
                    onClick={() => setFilterOpen(true)}
                  >
                    Filter
                  </Button>
                  <Button 
                    variant="contained"
                    onClick={() => setShowBulkAttendance(true)}
                  >
                    Bulk Attendance
                  </Button>
                </Box>
              </Box>
              
              <Tabs
                value={tab}
                onChange={(_, v) => setTab(v)}
                centered
                sx={{ mb: 2 }}
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
            </Box>

            {/* Filter Dialog */}
            <Dialog open={filterOpen} onClose={() => setFilterOpen(false)}>
              <DialogTitle>Filter Participants</DialogTitle>
              <DialogContent sx={{ minWidth: 400 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                  <FormControl fullWidth>
                    <InputLabel>Sort By</InputLabel>
                    <Select
                      value={sortBy}
                      label="Sort By"
                      onChange={(e) => setSortBy(e.target.value)}
                      startAdornment={<SortIcon sx={{ mr: 1 }} />}
                    >
                      <MenuItem value="name">Name</MenuItem>
                      <MenuItem value="rollNumber">Roll Number</MenuItem>
                      <MenuItem value="department">Department</MenuItem>
                      <MenuItem value="university">University</MenuItem>
                    </Select>
                  </FormControl>
                  
                  <FormControl fullWidth>
                    <InputLabel>Sort Order</InputLabel>
                    <Select
                      value={sortOrder}
                      label="Sort Order"
                      onChange={(e) => setSortOrder(e.target.value)}
                    >
                      <MenuItem value="asc">Ascending</MenuItem>
                      <MenuItem value="desc">Descending</MenuItem>
                    </Select>
                  </FormControl>
                  
                  <FormControl fullWidth>
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
                  
                  <FormControl fullWidth>
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
                  
                  <FormControl fullWidth>
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
                </Box>
              </DialogContent>
              <DialogActions>
                <Button onClick={handleFilterReset}>Reset</Button>
                <Button onClick={() => setFilterOpen(false)} variant="contained">Apply</Button>
              </DialogActions>
            </Dialog>

            {/* Bulk Attendance Dialog */}
            <Dialog 
              open={showBulkAttendance} 
              onClose={() => setShowBulkAttendance(false)}
              maxWidth="md"
              fullWidth
            >
              <DialogTitle>Bulk Attendance Marking</DialogTitle>
              <DialogContent>
                <Box sx={{ pt: 1 }}>
                  <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                    <Table stickyHeader size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Name</TableCell>
                          <TableCell>Roll Number</TableCell>
                          <TableCell>Present</TableCell>
                          <TableCell>Notes</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {bulkAttendance.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>{item.name}</TableCell>
                            <TableCell>
                              {participants.find(p => p._id === item.id)?.rollNumber || ""}
                            </TableCell>
                            <TableCell>
                              <Checkbox
                                checked={item.isPresent}
                                onChange={(e) => handleBulkAttendanceChange(item.id, e.target.checked)}
                                color="primary"
                              />
                            </TableCell>
                            <TableCell>
                              <TextField
                                size="small"
                                placeholder="Optional notes"
                                value={item.notes}
                                onChange={(e) => handleBulkAttendanceNotes(item.id, e.target.value)}
                                fullWidth
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setShowBulkAttendance(false)}>Cancel</Button>
                <Button 
                  variant="contained" 
                  onClick={saveBulkAttendance}
                  disabled={actionLoading.save}
                >
                  {actionLoading.save ? "Saving..." : "Save All"}
                </Button>
              </DialogActions>
            </Dialog>

            {loading.parts ? (
              <Box textAlign="center"><CircularProgress /></Box>
            ) : (
              <TableContainer component={Paper}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Roll</TableCell>
                      <TableCell>Dept</TableCell>
                      <TableCell>Univ</TableCell>
                      <TableCell>Module</TableCell>
                      <TableCell>Attendance</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredParticipants.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center">
                          No participants for this event
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredParticipants.map(p => (
                        <TableRow key={p._id}>
                          <TableCell>{p.name}</TableCell>
                          <TableCell>{p.rollNumber}</TableCell>
                          <TableCell>{p.department}</TableCell>
                          <TableCell>{p.university}</TableCell>
                          <TableCell>
                            <Chip 
                              label={p.module} 
                              size="small" 
                              color="primary" 
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            {p.attendance === "present" ? (
                              <Chip 
                                icon={<CheckCircleIcon />} 
                                label="Present" 
                                color="success" 
                                size="small"
                              />
                            ) : p.attendance === "absent" ? (
                              <Chip 
                                icon={<CancelIcon />} 
                                label="Absent" 
                                color="error" 
                                size="small"
                              />
                            ) : (
                              <Chip 
                                label="Not marked" 
                                color="default" 
                                size="small"
                              />
                            )}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="small"
                              onClick={() => {
                                setSelected(p);
                                setAttendanceValue(p.attendance === "present");
                                setAttendanceNotes("");
                              }}
                            >
                              Mark Attendance
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </>
        )}

        {/* Attendance Dialog */}
        <Dialog open={!!selected} onClose={() => setSelected(null)} maxWidth="sm" fullWidth>
          <DialogTitle>Mark Attendance: {selected?.name}</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={attendanceValue}
                    onChange={(e) => setAttendanceValue(e.target.checked)}
                    color="primary"
                  />
                }
                label={attendanceValue ? "Present" : "Absent"}
              />
              <TextField
                label="Notes"
                value={attendanceNotes}
                onChange={e => setAttendanceNotes(e.target.value)}
                fullWidth
                multiline
                rows={3}
                placeholder="Optional attendance notes"
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSelected(null)}>Cancel</Button>
            <Button 
              variant="contained" 
              onClick={() => updateAttendance(selected._id)}
              disabled={actionLoading.save}
            >
              {actionLoading.save ? "Saving..." : "Save"}
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar
          open={alert.open}
          autoHideDuration={6000}
          onClose={() => setAlert(a => ({ ...a, open: false }))}
        >
          <Alert
            severity={alert.sev}
            onClose={() => setAlert(a => ({ ...a, open: false }))}
          >
            {alert.msg}
          </Alert>
        </Snackbar>
      </Box>
    </Box>
  );
};

export default ModuleLeaderDashboard;
