import React, { useState, useEffect } from "react";
import axios from "axios";
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  Alert,
  InputAdornment,
  IconButton,
  Chip,
  Stack,
  Grid,
  Card,
  CardContent,
  Divider,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import FilterListIcon from "@mui/icons-material/FilterList";
import ClearIcon from "@mui/icons-material/Clear";
import SortIcon from "@mui/icons-material/Sort";

const EventManagement = () => {
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [moduleLeaders, setModuleLeaders] = useState([]);
  const [moduleHead, setModuleHead] = useState([]);
  const [dateError, setDateError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    moduleHead: "",
    moduleLeader: "",
    location: "",
    minFee: "",
    maxFee: "",
    minDate: "",
    maxDate: "",
  });
  const [sortConfig, setSortConfig] = useState({
    key: "title",
    direction: "asc",
  });

  const [showDiscountDropdown, setShowDiscountDropdown] = useState(false);

  // Format today's date to YYYY-MM-DD for the min attribute
  const today = new Date().toISOString().split('T')[0];

  const [currentEvent, setCurrentEvent] = useState({
    id: null,
    title: "",
    date: "",
    location: "",
    image: null,
    cap: null,
    moduleHead: "",
    moduleLeader: "",
    description: "",
    fee: "",
    discount: "",
    partnerGroup: "",
  });

  const fetchEvents = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/events");
      setEvents(response.data);
      setFilteredEvents(response.data);
    } catch (error) {
      console.error("Error fetching events:", error);
    }
  };

  useEffect(() => {
    fetchEvents();

    // Fetch Module Leaders
    axios
      .get("http://localhost:5000/api/moduleRole/role/ModuleLeader")
      .then((res) => setModuleLeaders(res.data))
      .catch((err) => console.error("Error fetching module leaders", err));

    axios
      .get("http://localhost:5000/api/moduleRole/role/ModuleHead")
      .then((res) => setModuleHead(res.data))
      .catch((err) => console.error("Error fetching module heads", err)); 
  }, []);

  // Apply search and filters whenever they change
  useEffect(() => {
    applySearchAndFilters();
  }, [searchTerm, filters, events, sortConfig]);

  const applySearchAndFilters = () => {
    let result = [...events];

    // Apply search term
    if (searchTerm) {
      const lowerCaseSearch = searchTerm.toLowerCase();
      result = result.filter(
        (event) =>
          event.title?.toLowerCase().includes(lowerCaseSearch) ||
          event.location?.toLowerCase().includes(lowerCaseSearch) ||
          event.description?.toLowerCase().includes(lowerCaseSearch) ||
          event.moduleHead?.toLowerCase().includes(lowerCaseSearch) ||
          event.moduleLeader?.toLowerCase().includes(lowerCaseSearch)
      );
    }

    // Apply filters
    if (filters.moduleHead) {
      result = result.filter((event) => event.moduleHead === filters.moduleHead);
    }
    if (filters.moduleLeader) {
      result = result.filter((event) => event.moduleLeader === filters.moduleLeader);
    }
    if (filters.location) {
      result = result.filter((event) => 
        event.location?.toLowerCase().includes(filters.location.toLowerCase())
      );
    }
    if (filters.minFee) {
      result = result.filter((event) => 
        (event.fee - (event.fee * event.discount / 100)) >= Number(filters.minFee)
      );
    }
    if (filters.maxFee) {
      result = result.filter((event) => 
        (event.fee - (event.fee * event.discount / 100)) <= Number(filters.maxFee)
      );
    }
    if (filters.minDate) {
      result = result.filter((event) => new Date(event.date) >= new Date(filters.minDate));
    }
    if (filters.maxDate) {
      result = result.filter((event) => new Date(event.date) <= new Date(filters.maxDate));
    }

    // Apply sorting
    result.sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === "asc" ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === "asc" ? 1 : -1;
      }
      return 0;
    });

    setFilteredEvents(result);
  };

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const handleFilterChange = (name, value) => {
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const clearFilters = () => {
    setFilters({
      moduleHead: "",
      moduleLeader: "",
      location: "",
      minFee: "",
      maxFee: "",
      minDate: "",
      maxDate: "",
    });
    setSearchTerm("");
  };

  const handleOpenDialog = () => {
    setCurrentEvent({
      id: null,
      title: "",
      date: today, // Default to today's date
      location: "",
      image: null,
      cap: null,
      moduleHead: "",
      moduleLeader: "",
      description: "",
      fee: "",
      discount: "",
      partnerGroup: "",
    });
    setIsEditMode(false);
    setIsDialogOpen(true);
    setShowDiscountDropdown(false);
    setDateError("");
  };

  const handleEdit = (event) => {
    // Format the event date to YYYY-MM-DD
    const eventDate = event.date ? new Date(event.date).toISOString().split('T')[0] : "";
    
    setCurrentEvent({
      id: event._id, // capture MongoDB _id
      title: event.title || "",
      date: eventDate,
      location: event.location || "",
      image: event.image || null,
      cap: event.cap || 0,
      moduleHead: event.moduleHead || "",
      moduleLeader: event.moduleLeader || "",
      description: event.description || "",
      fee: event.fee || 0,
      discount: event.discount || 0,
      partnerGroup: event.partnerGroup || "Solo",
    });
    setIsEditMode(true);
    setIsDialogOpen(true);
    setShowDiscountDropdown(false);
    setDateError("");
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/events/${id}`);
      fetchEvents();
    } catch (error) {
      console.error("Error deleting event:", error);
    }
  };

  const handleDateChange = (e) => {
    const selectedDate = e.target.value;
    const currentDate = new Date().toISOString().split('T')[0];
    
    if (selectedDate < currentDate) {
      setDateError("Event date cannot be set to past dates");
    } else {
      setDateError("");
      setCurrentEvent({ ...currentEvent, date: selectedDate });
    }
  };

  const handleSave = async () => {
    // Validate date before submission
    if (dateError) {
      return; // Don't proceed if there's a date error
    }
    
    try {
      const formData = new FormData();
      formData.append("title", currentEvent.title);
      formData.append("date", currentEvent.date);
      formData.append("location", currentEvent.location);
      formData.append("cap", currentEvent.cap);
      formData.append("moduleHead", currentEvent.moduleHead);
      formData.append("moduleLeader", currentEvent.moduleLeader);
      formData.append("fee", currentEvent.fee);
      formData.append("discount", currentEvent.discount);
      formData.append("partnerGroup", currentEvent.partnerGroup);
      formData.append("description", currentEvent.description);
      if (currentEvent.image) {
        formData.append("image", currentEvent.image);
      }

      if (isEditMode) {
        await axios.put(`http://localhost:5000/api/events/${currentEvent.id}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        await axios.post("http://localhost:5000/api/events", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      fetchEvents();
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error saving event:", error);
    }
  };

  const handleImageUpload = (e) => {
    setCurrentEvent({ ...currentEvent, image: e.target.files[0] });
  };

  const handleCapChange = async (id, increment) => {
    const updatedEvent = events.find((event) => event._id === id);
    if (updatedEvent) {
      updatedEvent.cap = Math.max(0, updatedEvent.cap + (increment ? 1 : -1));
      await axios.put(`http://localhost:5000/api/events/${id}`, updatedEvent);
      fetchEvents();
    }
  };

  // Format dates for display in the table
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Get unique locations for filter dropdown
  const uniqueLocations = [...new Set(events.map((event) => event.location))].filter(Boolean);

  return (
    <Box p={4}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Event Management
      </Typography>

      {/* Search and Filter Section */}
      <Box mb={3}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Search modules by name, location, description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
                endAdornment: searchTerm && (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setSearchTerm("")}>
                      <ClearIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              variant="outlined"
            />
          </Grid>
          <Grid item xs={12} md={6} sx={{ display: "flex", justifyContent: "flex-end" }}>
            <Button
              variant="outlined"
              startIcon={<FilterListIcon />}
              onClick={() => setShowFilters(!showFilters)}
              sx={{ mr: 1 }}
            >
              {showFilters ? "Hide Filters" : "Show Filters"}
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleOpenDialog}
            >
              Add New Module
            </Button>
          </Grid>
        </Grid>
      </Box>

      {/* Filter Panel */}
      {showFilters && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <FilterListIcon sx={{ verticalAlign: "middle", mr: 1 }} />
              Filter Modules
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Module Head</InputLabel>
                  <Select
                    value={filters.moduleHead}
                    onChange={(e) => handleFilterChange("moduleHead", e.target.value)}
                    label="Module Head"
                  >
                    <MenuItem value="">All</MenuItem>
                    {moduleHead.map((head) => (
                      <MenuItem key={head._id} value={head.name}>
                        {head.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Module Leader</InputLabel>
                  <Select
                    value={filters.moduleLeader}
                    onChange={(e) => handleFilterChange("moduleLeader", e.target.value)}
                    label="Module Leader"
                  >
                    <MenuItem value="">All</MenuItem>
                    {moduleLeaders.map((leader) => (
                      <MenuItem key={leader._id} value={leader.name}>
                        {leader.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Location</InputLabel>
                  <Select
                    value={filters.location}
                    onChange={(e) => handleFilterChange("location", e.target.value)}
                    label="Location"
                  >
                    <MenuItem value="">All</MenuItem>
                    {uniqueLocations.map((location) => (
                      <MenuItem key={location} value={location}>
                        {location}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Min Date"
                  type="date"
                  size="small"
                  value={filters.minDate}
                  onChange={(e) => handleFilterChange("minDate", e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Max Date"
                  type="date"
                  size="small"
                  value={filters.maxDate}
                  onChange={(e) => handleFilterChange("maxDate", e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Min Fee (PKR)"
                  type="number"
                  size="small"
                  value={filters.minFee}
                  onChange={(e) => handleFilterChange("minFee", e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Max Fee (PKR)"
                  type="number"
                  size="small"
                  value={filters.maxFee}
                  onChange={(e) => handleFilterChange("maxFee", e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={3} sx={{ display: "flex", alignItems: "center" }}>
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={clearFilters}
                  startIcon={<ClearIcon />}
                >
                  Clear Filters
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Active Filters Display */}
      {(searchTerm || Object.values(filters).some(Boolean)) && (
        <Box mb={2}>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {searchTerm && (
              <Chip 
                label={`Search: ${searchTerm}`} 
                onDelete={() => setSearchTerm("")}
                color="primary"
                variant="outlined"
              />
            )}
            {filters.moduleHead && (
              <Chip 
                label={`Module Head: ${filters.moduleHead}`} 
                onDelete={() => handleFilterChange("moduleHead", "")}
                color="primary"
                variant="outlined"
              />
            )}
            {filters.moduleLeader && (
              <Chip 
                label={`Module Leader: ${filters.moduleLeader}`} 
                onDelete={() => handleFilterChange("moduleLeader", "")}
                color="primary"
                variant="outlined"
              />
            )}
            {filters.location && (
              <Chip 
                label={`Location: ${filters.location}`} 
                onDelete={() => handleFilterChange("location", "")}
                color="primary"
                variant="outlined"
              />
            )}
            {filters.minDate && (
              <Chip 
                label={`From: ${filters.minDate}`} 
                onDelete={() => handleFilterChange("minDate", "")}
                color="primary"
                variant="outlined"
              />
            )}
            {filters.maxDate && (
              <Chip 
                label={`To: ${filters.maxDate}`} 
                onDelete={() => handleFilterChange("maxDate", "")}
                color="primary"
                variant="outlined"
              />
            )}
            {filters.minFee && (
              <Chip 
                label={`Min Fee: ${filters.minFee} PKR`} 
                onDelete={() => handleFilterChange("minFee", "")}
                color="primary"
                variant="outlined"
              />
            )}
            {filters.maxFee && (
              <Chip 
                label={`Max Fee: ${filters.maxFee} PKR`} 
                onDelete={() => handleFilterChange("maxFee", "")}
                color="primary"
                variant="outlined"
              />
            )}
          </Stack>
        </Box>
      )}

      {/* Results Summary */}
      <Box mb={2}>
        <Typography variant="subtitle1" color="text.secondary">
          Showing {filteredEvents.length} of {events.length} modules
        </Typography>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell onClick={() => handleSort("title")} sx={{ cursor: "pointer" }}>
                Module Name
                {sortConfig.key === "title" && (
                  <SortIcon sx={{ fontSize: 16, ml: 0.5, transform: sortConfig.direction === "desc" ? "rotate(180deg)" : "none" }} />
                )}
              </TableCell>
              <TableCell onClick={() => handleSort("date")} sx={{ cursor: "pointer" }}>
                Date
                {sortConfig.key === "date" && (
                  <SortIcon sx={{ fontSize: 16, ml: 0.5, transform: sortConfig.direction === "desc" ? "rotate(180deg)" : "none" }} />
                )}
              </TableCell>
              <TableCell onClick={() => handleSort("location")} sx={{ cursor: "pointer" }}>
                Location
                {sortConfig.key === "location" && (
                  <SortIcon sx={{ fontSize: 16, ml: 0.5, transform: sortConfig.direction === "desc" ? "rotate(180deg)" : "none" }} />
                )}
              </TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Image</TableCell>
              <TableCell onClick={() => handleSort("cap")} sx={{ cursor: "pointer" }}>
                Cap
                {sortConfig.key === "cap" && (
                  <SortIcon sx={{ fontSize: 16, ml: 0.5, transform: sortConfig.direction === "desc" ? "rotate(180deg)" : "none" }} />
                )}
              </TableCell>
              <TableCell onClick={() => handleSort("moduleHead")} sx={{ cursor: "pointer" }}>
                Module Head
                {sortConfig.key === "moduleHead" && (
                  <SortIcon sx={{ fontSize: 16, ml: 0.5, transform: sortConfig.direction === "desc" ? "rotate(180deg)" : "none" }} />
                )}
              </TableCell>
              <TableCell onClick={() => handleSort("moduleLeader")} sx={{ cursor: "pointer" }}>
                Module Leader
                {sortConfig.key === "moduleLeader" && (
                  <SortIcon sx={{ fontSize: 16, ml: 0.5, transform: sortConfig.direction === "desc" ? "rotate(180deg)" : "none" }} />
                )}
              </TableCell>
              <TableCell onClick={() => handleSort("fee")} sx={{ cursor: "pointer" }}>
                Fee (PKR)
                {sortConfig.key === "fee" && (
                  <SortIcon sx={{ fontSize: 16, ml: 0.5, transform: sortConfig.direction === "desc" ? "rotate(180deg)" : "none" }} />
                )}
              </TableCell>
              <TableCell onClick={() => handleSort("discount")} sx={{ cursor: "pointer" }}>
                Discount (%)
                {sortConfig.key === "discount" && (
                  <SortIcon sx={{ fontSize: 16, ml: 0.5, transform: sortConfig.direction === "desc" ? "rotate(180deg)" : "none" }} />
                )}
              </TableCell>
              <TableCell>Final Fee</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredEvents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={12} align="center">
                  <Typography variant="subtitle1" py={3}>
                    No modules found matching your criteria
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredEvents.map((event) => (
                <TableRow key={event._id}>
                  <TableCell>{event.title}</TableCell>
                  <TableCell>{formatDate(event.date)}</TableCell>
                  <TableCell>{event.location}</TableCell>
                  <TableCell>
                    <Tooltip title={event.description || "No Description"} arrow>
                      <Typography noWrap maxWidth={150}>
                        {event.description ? event.description.slice(0, 40) + "..." : "No Description"}
                      </Typography>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    {event.image ? (
                      <img src={event.image} alt={event.title} width="50" />
                    ) : (
                      "No Image"
                    )}
                  </TableCell>
                  <TableCell>
                    {event.cap}
                    <Box sx={{ mt: 1 }}>
                      <Button size="small" onClick={() => handleCapChange(event._id, true)} variant="outlined" sx={{ mr: 1 }}>
                        +
                      </Button>
                      <Button size="small" onClick={() => handleCapChange(event._id, false)} variant="outlined">
                        -
                      </Button>
                    </Box>
                  </TableCell>
                  <TableCell>{event.moduleHead || "Not Assigned"}</TableCell>
                  <TableCell>{event.moduleLeader || "Not Assigned"}</TableCell>
                  <TableCell>{event.fee || 0}</TableCell>
                  <TableCell>{event.discount || 0}</TableCell>
                  <TableCell>
                  {event.fee - (event.fee * event.discount / 100)}
                  </TableCell>

                  <TableCell>
                    <Button color="secondary" onClick={() => handleEdit(event)}>
                      Edit
                    </Button>
                    <Button color="error" onClick={() => handleDelete(event._id)}>
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)}>
        <DialogTitle>{isEditMode ? "Edit Module" : "Add New Module"}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Module Name"
            variant="outlined"
            value={currentEvent.title}
            onChange={(e) => setCurrentEvent({ ...currentEvent, title: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Date"
            type="date"
            variant="outlined"
            value={currentEvent.date}
            onChange={handleDateChange}
            inputProps={{
              min: today // Restrict to today and future dates
            }}
            InputLabelProps={{ shrink: true }}
            sx={{ mb: 2 }}
            error={!!dateError}
            helperText={dateError}
          />
          <TextField
            fullWidth
            label="Location"
            variant="outlined"
            value={currentEvent.location}
            onChange={(e) => setCurrentEvent({ ...currentEvent, location: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Cap"
            type="number"
            variant="outlined"
            value={currentEvent.cap}
            onChange={(e) => setCurrentEvent({ ...currentEvent, cap: parseInt(e.target.value) || 0 })}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Description"
            variant="outlined"
            value={currentEvent.description}
            onChange={(e) => setCurrentEvent({ ...currentEvent, description: e.target.value })}
            sx={{ mb: 2 }}
            multiline
            rows={3}
          />
          <TextField
            fullWidth
            label="Module Fee (PKR)"
            type="number"
            variant="outlined"
            value={currentEvent.fee}
            onChange={(e) => setCurrentEvent({ ...currentEvent, fee: parseInt(e.target.value) || 0 })}
            sx={{ mb: 2 }}
          />
          

<Box sx={{ mb: 2 }}>
  <Typography variant="subtitle1" fontWeight="bold">
    Discount Settings
  </Typography>

  <Button
    variant="outlined"
    onClick={() => setShowDiscountDropdown(true)}
    sx={{ mt: 1, mb: 2 }}
  >
    Set Discount
  </Button>

  {showDiscountDropdown && (
    <>
      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>Select Partner Group</InputLabel>
        <Select
          value={currentEvent.partnerGroup}
          onChange={(e) =>
            setCurrentEvent({ ...currentEvent, partnerGroup: e.target.value })
          }
        >
          {["Solo", "Partner 2", "Partner 3", "Partner 4"].map((group) => (
            <MenuItem key={group} value={group}>
              {group}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <TextField
        fullWidth
        label="Discount (%)"
        type="number"
        value={currentEvent.discount}
        onChange={(e) =>
          setCurrentEvent({
            ...currentEvent,
            discount: parseInt(e.target.value) ,
          })
        }
        sx={{ mb: 2 }}
      />
    </>
  )}

  <TextField
    fullWidth
    label="Partner Group"
    value={currentEvent.partnerGroup || "Not Set"}
    disabled
    sx={{ mb: 2 }}
  />
</Box>


          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Module Head</InputLabel>
            <Select
              value={currentEvent.moduleHead}
              onChange={(e) => setCurrentEvent({ ...currentEvent, moduleHead: e.target.value })}
            >
              {moduleHead.map((head) => (
                <MenuItem key={head._id} value={head.name}>
                  {head.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth sx={{ mb: 2 }}>
  <InputLabel>Module Leader</InputLabel>
  <Select
    value={currentEvent.moduleLeader}
    onChange={(e) => setCurrentEvent({ ...currentEvent, moduleLeader: e.target.value })}
  >
    {moduleLeaders.map((leader) => (
      <MenuItem key={leader._id} value={leader.name}>
        {leader.name}
      </MenuItem>
    ))}
  </Select>
</FormControl>
          <Button variant="contained" component="label">
            Upload Image
            <input type="file" hidden onChange={handleImageUpload} />
          </Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDialogOpen(false)} color="secondary">
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            color="primary"
            disabled={!!dateError}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EventManagement;