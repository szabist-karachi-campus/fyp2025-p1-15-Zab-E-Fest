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
  TextField,
  InputAdornment,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Stack,
  Divider,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import FilterListIcon from "@mui/icons-material/FilterList";
import ClearIcon from "@mui/icons-material/Clear";
import SortIcon from "@mui/icons-material/Sort";

export const ParticipantManagement = () => {
  const [participants, setParticipants] = useState([]);
  const [filteredParticipants, setFilteredParticipants] = useState([]);
  const [events, setEvents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    module: "",
    department: "",
    university: "",
    minFee: "",
    maxFee: "",
  });
  const [sortConfig, setSortConfig] = useState({
    key: "name",
    direction: "asc",
  });

  useEffect(() => {
    const fetchParticipants = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/participants");
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        setParticipants(data);
        setFilteredParticipants(data);
      } catch (error) {
        console.error("Error fetching participants:", error);
      }
    };

    const fetchEvents = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/events");
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        setEvents(data);
      } catch (error) {
        console.error("Error fetching events:", error);
      }
    };

    fetchParticipants();
    fetchEvents();
  }, []);

  // Apply search and filters whenever they change
  useEffect(() => {
    applySearchAndFilters();
  }, [searchTerm, filters, participants, sortConfig]);

  const applySearchAndFilters = () => {
    let result = [...participants];

    // Apply search term
    if (searchTerm) {
      const lowerCaseSearch = searchTerm.toLowerCase();
      result = result.filter(
        (participant) =>
          participant.name?.toLowerCase().includes(lowerCaseSearch) ||
          participant.email?.toLowerCase().includes(lowerCaseSearch) ||
          participant.contactNumber?.toLowerCase().includes(lowerCaseSearch) ||
          participant.module?.toLowerCase().includes(lowerCaseSearch) ||
          participant.department?.toLowerCase().includes(lowerCaseSearch) ||
          participant.university?.toLowerCase().includes(lowerCaseSearch) ||
          participant.registrationToken?.toLowerCase().includes(lowerCaseSearch)
      );
    }

    // Apply filters
    if (filters.module) {
      result = result.filter((participant) => participant.module === filters.module);
    }
    if (filters.department) {
      result = result.filter((participant) => participant.department === filters.department);
    }
    if (filters.university) {
      result = result.filter((participant) => 
        participant.university?.toLowerCase().includes(filters.university.toLowerCase())
      );
    }
    if (filters.minFee) {
      result = result.filter((participant) => 
        participant.fee >= Number(filters.minFee)
      );
    }
    if (filters.maxFee) {
      result = result.filter((participant) => 
        participant.fee <= Number(filters.maxFee)
      );
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

    setFilteredParticipants(result);
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
      module: "",
      department: "",
      university: "",
      minFee: "",
      maxFee: "",
    });
    setSearchTerm("");
  };


  // Get unique values for filter dropdowns
  const uniqueModules = [...new Set(participants.map((p) => p.module))].filter(Boolean);
  const uniqueDepartments = [...new Set(participants.map((p) => p.department))].filter(Boolean);
  const uniqueUniversities = [...new Set(participants.map((p) => p.university))].filter(Boolean);

  return (
    <Box p={4}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Participant Management
      </Typography>

      {/* Search and Filter Section */}
      <Box mb={3}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={8}>
            <TextField
              fullWidth
              placeholder="Search by name, email, token, module, department..."
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
          <Grid item xs={12} md={4} sx={{ display: "flex", justifyContent: "flex-end" }}>
            <Button
              variant="outlined"
              startIcon={<FilterListIcon />}
              onClick={() => setShowFilters(!showFilters)}
            >
              {showFilters ? "Hide Filters" : "Show Filters"}
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
              Filter Participants
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Module</InputLabel>
                  <Select
                    value={filters.module}
                    onChange={(e) => handleFilterChange("module", e.target.value)}
                    label="Module"
                  >
                    <MenuItem value="">All</MenuItem>
                    {uniqueModules.map((module) => (
                      <MenuItem key={module} value={module}>
                        {module}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Department</InputLabel>
                  <Select
                    value={filters.department}
                    onChange={(e) => handleFilterChange("department", e.target.value)}
                    label="Department"
                  >
                    <MenuItem value="">All</MenuItem>
                    {uniqueDepartments.map((department) => (
                      <MenuItem key={department} value={department}>
                        {department}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>University</InputLabel>
                  <Select
                    value={filters.university}
                    onChange={(e) => handleFilterChange("university", e.target.value)}
                    label="University"
                  >
                    <MenuItem value="">All</MenuItem>
                    {uniqueUniversities.map((university) => (
                      <MenuItem key={university} value={university}>
                        {university}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Min Fee (PKR)"
                  type="number"
                  size="small"
                  value={filters.minFee}
                  onChange={(e) => handleFilterChange("minFee", e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Max Fee (PKR)"
                  type="number"
                  size="small"
                  value={filters.maxFee}
                  onChange={(e) => handleFilterChange("maxFee", e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={4} sx={{ display: "flex", alignItems: "center" }}>
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
            {filters.module && (
              <Chip 
                label={`Module: ${filters.module}`} 
                onDelete={() => handleFilterChange("module", "")}
                color="primary"
                variant="outlined"
              />
            )}
            {filters.department && (
              <Chip 
                label={`Department: ${filters.department}`} 
                onDelete={() => handleFilterChange("department", "")}
                color="primary"
                variant="outlined"
              />
            )}
            {filters.university && (
              <Chip 
                label={`University: ${filters.university}`} 
                onDelete={() => handleFilterChange("university", "")}
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
          Showing {filteredParticipants.length} of {participants.length} participants
        </Typography>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell onClick={() => handleSort("registrationToken")} sx={{ cursor: "pointer", fontWeight: "bold" }}>
                Registration Token
                {sortConfig.key === "registrationToken" && (
                  <SortIcon sx={{ fontSize: 16, ml: 0.5, transform: sortConfig.direction === "desc" ? "rotate(180deg)" : "none" }} />
                )}
              </TableCell>
              <TableCell onClick={() => handleSort("name")} sx={{ cursor: "pointer" }}>
                Name
                {sortConfig.key === "name" && (
                  <SortIcon sx={{ fontSize: 16, ml: 0.5, transform: sortConfig.direction === "desc" ? "rotate(180deg)" : "none" }} />
                )}
              </TableCell>
              <TableCell onClick={() => handleSort("email")} sx={{ cursor: "pointer" }}>
                Email
                {sortConfig.key === "email" && (
                  <SortIcon sx={{ fontSize: 16, ml: 0.5, transform: sortConfig.direction === "desc" ? "rotate(180deg)" : "none" }} />
                )}
              </TableCell>
              <TableCell onClick={() => handleSort("contactNumber")} sx={{ cursor: "pointer" }}>
                Contact Number
                {sortConfig.key === "contactNumber" && (
                  <SortIcon sx={{ fontSize: 16, ml: 0.5, transform: sortConfig.direction === "desc" ? "rotate(180deg)" : "none" }} />
                )}
              </TableCell>
              <TableCell onClick={() => handleSort("module")} sx={{ cursor: "pointer" }}>
                Module
                {sortConfig.key === "module" && (
                  <SortIcon sx={{ fontSize: 16, ml: 0.5, transform: sortConfig.direction === "desc" ? "rotate(180deg)" : "none" }} />
                )}
              </TableCell>
              <TableCell onClick={() => handleSort("department")} sx={{ cursor: "pointer" }}>
                Department
                {sortConfig.key === "department" && (
                  <SortIcon sx={{ fontSize: 16, ml: 0.5, transform: sortConfig.direction === "desc" ? "rotate(180deg)" : "none" }} />
                )}
              </TableCell>
              <TableCell onClick={() => handleSort("university")} sx={{ cursor: "pointer" }}>
                University
                {sortConfig.key === "university" && (
                  <SortIcon sx={{ fontSize: 16, ml: 0.5, transform: sortConfig.direction === "desc" ? "rotate(180deg)" : "none" }} />
                )}
              </TableCell>
              <TableCell onClick={() => handleSort("fee")} sx={{ cursor: "pointer" }}>
                Final Fee (PKR)
                {sortConfig.key === "fee" && (
                  <SortIcon sx={{ fontSize: 16, ml: 0.5, transform: sortConfig.direction === "desc" ? "rotate(180deg)" : "none" }} />
                )}
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredParticipants.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography variant="subtitle1" py={3}>
                    No participants found matching your criteria
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredParticipants.map((participant) => (
                <TableRow key={participant._id}>
                  <TableCell>
                    <Chip
                      label={participant.registrationToken || 'N/A'}
                      color="primary"
                      sx={{ fontWeight: 'bold' }}
                      onClick={() => {
                        if (participant.registrationToken) {
                          navigator.clipboard.writeText(participant.registrationToken);
                          alert('Registration token copied to clipboard');
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell>{participant.name}</TableCell>
                  <TableCell>{participant.email}</TableCell>
                  <TableCell>{participant.contactNumber}</TableCell>
                  <TableCell>{participant.module}</TableCell>
                  <TableCell>{participant.department}</TableCell>
                  <TableCell>{participant.university}</TableCell>
                  <TableCell>{participant.fee || 0}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};
