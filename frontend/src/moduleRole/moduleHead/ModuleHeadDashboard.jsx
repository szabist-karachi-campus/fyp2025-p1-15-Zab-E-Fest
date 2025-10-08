// src/components/ModuleHeadDashboard.jsx
import React, { useState, useEffect,useMemo } from "react";
import {
  Box,
  Button,
  Typography,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
  Paper,
  Tabs,
  Tab,
  AppBar,
  Toolbar,
  IconButton,
  Snackbar,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Grid,
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
  Tooltip
} from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import EventIcon from "@mui/icons-material/Event";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import DateRangeIcon from "@mui/icons-material/DateRange";
import GroupIcon from "@mui/icons-material/Group";
import FilterListIcon from "@mui/icons-material/FilterList";
import SearchIcon from "@mui/icons-material/Search";
import SortIcon from "@mui/icons-material/Sort";
import GradeIcon from "@mui/icons-material/Grade";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import NotificationPanel from "../NotificationPanel"; // Adjust path
import axios from "axios";
import NotificationsOutlined from "@mui/icons-material/NotificationsOutlined";

const axiosInstance = axios.create({
  baseURL: "http://localhost:5000/api/moduleRole",
  headers: {
    ...(localStorage.getItem("token") && {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    })
  }
});

export default function ModuleHeadDashboard() {
  const [email, setEmail] = useState("");
  const [headName, setHeadName] = useState("");
  const [events, setEvents] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [filteredParticipants, setFilteredParticipants] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [eventDetails, setEventDetails] = useState(null);
  const [tab, setTab] = useState(0);
  const [selected, setSelected] = useState(null);
  const [grade, setGrade] = useState("");
  const [comments, setComments] = useState("");
  const [minGradeRequired] = useState("60"); // <-- FIXED (remove setMinGradeRequired)
  const [loading, setLoading] = useState({ profile: true, events: true, parts: false });
  const [actionLoading, setActionLoading] = useState({ save: false, promote: false });
  const [alert, setAlert] = useState({ open: false, msg: "", sev: "info" });

  // Filter states
  const [filterOpen, setFilterOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [filterDepartment, setFilterDepartment] = useState("");
  const [filterUniversity, setFilterUniversity] = useState("");
  const [gradeRange, setGradeRange] = useState({ min: "", max: "" });
  const [openNotifications, setOpenNotifications] = useState(false);

const stages = useMemo(() => ["Pre-Qualifier", "Final Round", "Winner"], []);


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

    // Apply grade range filter
    if (gradeRange.min !== "") {
      filtered = filtered.filter(p =>
        p.grade && parseFloat(p.grade) >= parseFloat(gradeRange.min)
      );
    }
    if (gradeRange.max !== "") {
      filtered = filtered.filter(p =>
        p.grade && parseFloat(p.grade) <= parseFloat(gradeRange.max)
      );
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
        case "grade":
          valueA = a.grade ? parseFloat(a.grade) : -1;
          valueB = b.grade ? parseFloat(b.grade) : -1;
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
  // ---- FIXED: add 'stages' as dependency ----
  }, [participants, tab, searchTerm, sortBy, sortOrder, filterDepartment, filterUniversity, gradeRange, stages]);

  // 1) Load email and headName
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
      .then(res => setHeadName(res.data.name))
      .catch(err => console.error("Failed to load head profile:", err))
      .finally(() => setLoading(l => ({ ...l, profile: false })));
  }, []);

  // 2) Load assigned events
  useEffect(() => {
    if (!email && !headName) return;
    setLoading(l => ({ ...l, events: true }));

    axiosInstance
      .get("/module-head/events", {
        params: {
          email,
          name: headName
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
  }, [email, headName]);

  // 3) Load participants for the selected event
  useEffect(() => {
    if (!selectedEvent) return;
    setLoading(l => ({ ...l, parts: true }));

    axiosInstance
      .get("/event/participants", { params: { eventTitle: selectedEvent.title } })
      .then(res => {
        setParticipants(res.data.participants || []);
        setEventDetails(res.data.eventDetails);
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

  const updateGrade = async id => {
    if (!grade.trim()) {
      setAlert({ open: true, msg: "Enter grade", sev: "warning" });
      return;
    }
    setActionLoading(a => ({ ...a, save: true }));
    try {
      const { data } = await axiosInstance.put(`/grades/${id}`, {
        grade,
        comments
      });
      setParticipants(ps => ps.map(p => (p._id === id ? data : p)));
      setAlert({ open: true, msg: "Grade saved", sev: "success" });
      setSelected(null);
      setGrade("");
      setComments("");
    } catch (err) {
      console.error("Save grade error:", err);
      setAlert({ open: true, msg: "Save failed", sev: "error" });
    } finally {
      setActionLoading(a => ({ ...a, save: false }));
    }
  };

  const promote = async id => {
    setActionLoading(a => ({ ...a, promote: true }));
    try {
      const { data } = await axiosInstance.put(`/passToNextRound/${id}`, {
        minGradeRequired
      });

      // Update the local participant list
      setParticipants(prev =>
        prev.map(p => p._id === id ? data.participant : p)
      );

      setAlert({ open: true, msg: data.message, sev: "success" });
      setSelected(null);
      setGrade("");
      setComments("");
    } catch (err) {
      console.error("Promotion error:", err);
      setAlert({ open: true, msg: err.response?.data?.message || "Promotion failed", sev: "error" });
    } finally {
      setActionLoading(a => ({ ...a, promote: false }));
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
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
    setGradeRange({ min: "", max: "" });
    setFilterOpen(false);
  };

  return (
    <Box>
      <AppBar position="static">
  <Toolbar sx={{ justifyContent: "space-between" }}>
    <Typography variant="h6">Module Head Dashboard</Typography>
    <Box display="flex" alignItems="center" gap={2}>
      {loading.profile ? (
        <CircularProgress size={20} color="inherit" />
      ) : (
        <>
          <Typography>Hi, {headName}</Typography>
        </>
      )}
      {/* Bell icon opens the notifications drawer */}
      <IconButton
        color="inherit"
        onClick={() => setOpenNotifications(true)}
      >
        <NotificationsOutlined />
      </IconButton>
      <IconButton onClick={logout} color="inherit">
        <LogoutIcon />
      </IconButton>
    </Box>
    {/* Notification drawer */}
    <NotificationPanel
      open={openNotifications}
      onClose={() => setOpenNotifications(false)}
      userRole="ModuleHead"
    />
  </Toolbar>
</AppBar>


      <Box mx="auto" mt={3} maxWidth={1200} px={2}>
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
                        label={`You are Module Head`}
                        size="small"
                        color="primary"
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
                      Module Leader: {eventDetails.moduleLeader}
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
                      <MenuItem value="grade">Grade</MenuItem>
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

                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <TextField
                      label="Min Grade"
                      type="number"
                      value={gradeRange.min}
                      onChange={(e) => setGradeRange(prev => ({ ...prev, min: e.target.value }))}
                      fullWidth
                    />
                    <TextField
                      label="Max Grade"
                      type="number"
                      value={gradeRange.max}
                      onChange={(e) => setGradeRange(prev => ({ ...prev, max: e.target.value }))}
                      fullWidth
                    />
                  </Box>
                </Box>
              </DialogContent>
              <DialogActions>
                <Button onClick={handleFilterReset}>Reset</Button>
                <Button onClick={() => setFilterOpen(false)} variant="contained">Apply</Button>
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
                      <TableCell>Grade</TableCell>
                      {tab < stages.length - 1 && <TableCell>Actions</TableCell>}
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
                                />
                              </Tooltip>
                            ) : "—"}
                          </TableCell>
                          {tab < stages.length - 1 && (
                            <TableCell>
                              <Button
                                size="small"
                                onClick={() => {
                                  setSelected(p);
                                  setGrade(p.grade || "");
                                  setComments(p.comments || "");
                                }}
                              >
                                Grade
                              </Button>
                              <Button
                                size="small"
                                color="success"
                                onClick={() => promote(p._id)}
                                disabled={actionLoading.promote || !p.grade}
                                sx={{ ml: 1 }}
                              >
                                Promote
                              </Button>
                            </TableCell>
                          )}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </>
        )}

        {/* Grading Dialog */}
        <Dialog open={!!selected} onClose={() => setSelected(null)} maxWidth="sm" fullWidth>
          <DialogTitle>Grade Participant: {selected?.name}</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Grade (0-100)"
                type="number"
                inputProps={{ min: 0, max: 100 }}
                value={grade}
                onChange={e => setGrade(e.target.value)}
                fullWidth
              />
              <TextField
                label="Comments"
                value={comments}
                onChange={e => setComments(e.target.value)}
                fullWidth
                multiline
                rows={3}
              />
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Promotion Thresholds:
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  • Grades 80-100: Excellent (Recommended for promotion)
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  • Grades 60-79: Good (Eligible for promotion)
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  • Grades below 60: Needs improvement (Not eligible for promotion)
                </Typography>
              </Box>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSelected(null)}>Cancel</Button>
            <Button
              variant="contained"
              onClick={() => updateGrade(selected._id)}
              disabled={actionLoading.save}
            >
              {actionLoading.save ? "Saving..." : "Save Grade"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Promotion Settings Dialog */}
        <Dialog
          open={actionLoading.promote}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle>Promoting Participant</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
              <CircularProgress />
            </Box>
            <Typography align="center">
              Processing promotion...
            </Typography>
          </DialogContent>
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
}
