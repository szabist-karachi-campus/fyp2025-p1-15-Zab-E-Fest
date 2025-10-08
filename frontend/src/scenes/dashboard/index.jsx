import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
  Paper,
  Badge,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  TableSortLabel,
  TablePagination,
} from "@mui/material";
import CountUp from "react-countup";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as ReTooltip,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from "recharts";

// Color palette for pie chart departments
const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#A569BD", "#CD6155"];

function descendingComparator(a, b, orderBy) {
  if (b[orderBy] < a[orderBy]) return -1;
  if (b[orderBy] > a[orderBy]) return 1;
  return 0;
}

function getComparator(order, orderBy) {
  return order === "desc"
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

function stableSort(array, comparator) {
  const stabilizedThis = array.map((el, index) => [el, index]);
  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });
  return stabilizedThis.map((el) => el[0]);
}

const Dashboard = () => {
  const [events, setEvents] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [order, setOrder] = useState("asc");
  const [orderBy, setOrderBy] = useState("name");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    async function fetchData() {
      try {
        const evRes = await fetch("http://localhost:5000/api/events");
        const evData = await evRes.json();
        setEvents(evData);

        const pRes = await fetch("http://localhost:5000/api/participants");
        const pData = await pRes.json();
        setParticipants(pData);

        setNotifications(
          pData
            .slice(-5)
            .reverse()
            .map((p) => ({
              id: p._id,
              message: `${p.name} registered for ${p.module}`,
              date: new Date(p.registrationDate).toLocaleString(),
            }))
        );
      } catch (err) {
        console.error(err);
      }
    }
    fetchData();
  }, []);

  // Total modules
  const totalModules = events.length;

  // Total participants
  const totalParticipants = participants.length;

  // Module map: fee, discount, capacity, enrolled count
  const moduleMap = events.reduce((acc, ev) => {
    acc[ev.title] = { fee: ev.fee || 0, discount: ev.discount || 0, cap: ev.cap || 1, enrolled: 0 };
    return acc;
  }, {});

  participants.forEach((p) => {
    if (p.module && moduleMap[p.module]) {
      moduleMap[p.module].enrolled++;
    }
  });

  // Total revenue PKR
  const totalRevenue = participants.reduce((acc, p) => {
    if (!p.module || !moduleMap[p.module]) return acc;
    const { fee, discount } = moduleMap[p.module];
    return acc + (fee - (fee * discount) / 100);
  }, 0);

  // Payment per module for Bar Chart and Capacity bars
  const paymentPerModule = events.map((ev, index) => {
    const enrolled = moduleMap[ev.title]?.enrolled || 0;
    const { fee, discount, cap } = moduleMap[ev.title];
    const netFee = fee - (fee * discount) / 100;
    const revenue = enrolled * netFee;
    const fillPercent = (enrolled / cap) * 100;
    return {
      id: ev._id || `module-${index}`,
      module: ev.title,
      revenue,
      enrolled,
      capacity: cap,
      fillPercent,
    };
  });

  // Participant distribution by department for Pie Chart
  const departmentCount = participants.reduce((acc, p) => {
    acc[p.department] = (acc[p.department] || 0) + 1;
    return acc;
  }, {});
  const pieData = Object.entries(departmentCount).map(([name, value], index) => ({ 
    id: `dept-${index}`,
    name, 
    value 
  }));

  // Registration trends monthly
  const monthlyTrends = participants.reduce((acc, p) => {
    const month = new Date(p.registrationDate).toLocaleString("default", {
      month: "short",
      year: "numeric",
    });
    acc[month] = (acc[month] || 0) + 1;
    return acc;
  }, {});
  const lineData = Object.entries(monthlyTrends).map(([month, registrations], index) => ({
    id: `month-${index}`,
    month,
    registrations,
  }));

  // Table sorting handlers
  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Box p={4}>
      {/* KPI Cards */}
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Dashboard Overview
      </Typography>
      <Grid container spacing={3}>
        {[
          { label: "Total Modules", value: totalModules, color: "primary.main" },
          { label: "Total Participants", value: totalParticipants, color: "secondary.main" },
          { label: "Total Revenue (PKR)", value: totalRevenue, color: "success.main", prefix: "₨ " },
        ].map(({ label, value, color, prefix }) => (
          <Grid item xs={12} md={4} key={label}>
            <Card>
              <CardContent>
                <Typography variant="h6">{label}</Typography>
                <Typography variant="h3" color={color}>
                  <CountUp end={value} duration={1.5} prefix={prefix || ""} separator="," decimals={0} />
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Charts */}
      <Grid container spacing={4} mt={2}>
        {/* Bar Chart */}
        <Grid item xs={12} md={6} style={{ height: 350 }}>
          <Typography variant="h6" gutterBottom>
            Payment Collected per Module
          </Typography>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={paymentPerModule}
              margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="module" />
              <YAxis />
              <ReTooltip formatter={(value) => `₨ ${value.toLocaleString()}`} />
              <Bar dataKey="revenue" fill="#1976d2" />
            </BarChart>
          </ResponsiveContainer>
        </Grid>

        {/* Pie Chart */}
        <Grid item xs={12} md={6} style={{ height: 350 }}>
          <Typography variant="h6" gutterBottom>
            Participant Distribution by Department
          </Typography>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label
              >
                {pieData.map((entry, index) => (
                  <Cell key={entry.id} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Legend />
              <ReTooltip />
            </PieChart>
          </ResponsiveContainer>
        </Grid>

        {/* Line Chart */}
        <Grid item xs={12} md={12} style={{ height: 300 }}>
          <Typography variant="h6" gutterBottom>
            Registration Trends (Monthly)
          </Typography>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={lineData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis allowDecimals={false} />
              <ReTooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="registrations"
                stroke="#82ca9d"
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Grid>
      </Grid>

      {/* Capacity Progress Bars */}
      <Box mt={6}>
        <Typography variant="h5" gutterBottom>
          Module Capacity Usage
        </Typography>
        {paymentPerModule.map(({ id, module, enrolled, capacity, fillPercent }) => (
          <Box key={id} mb={2}>
            <Typography variant="subtitle1" fontWeight="bold">
              {module} — {enrolled} / {capacity} participants
            </Typography>
            <LinearProgress
              variant="determinate"
              value={fillPercent > 100 ? 100 : fillPercent}
              sx={{
                height: 12,
                borderRadius: 6,
                backgroundColor: "#e0e0e0",
                "& .MuiLinearProgress-bar": {
                  backgroundColor: fillPercent > 90 ? "red" : "green",
                  transition: "width 1.5s ease-in-out",
                },
              }}
            />
          </Box>
        ))}
      </Box>

      {/* Participants Table */}
      <Box mt={6}>
        <Typography variant="h5" gutterBottom>
          Participants
        </Typography>
        <Paper sx={{ width: "100%", overflow: "hidden" }}>
          <TableContainer sx={{ maxHeight: 440 }}>
            <Table stickyHeader size="small" aria-label="participants table">
              <TableHead>
                <TableRow>
                  <TableCell>Avatar</TableCell>
                  <TableCell
                    sortDirection={orderBy === "name" ? order : false}
                    sx={{ cursor: "pointer" }}
                    onClick={() => handleRequestSort(null, "name")}
                  >
                    <TableSortLabel active={orderBy === "name"} direction={order}>
                      Name
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Module</TableCell>
                  <TableCell>Department</TableCell>
                  <TableCell>Fee (PKR)</TableCell>
                  <TableCell>Payment Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {stableSort(participants, getComparator(order, orderBy))
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((p) => (
                    <TableRow hover key={p._id}>
                      <TableCell>
                        <Avatar>
                          {p.name
                            ? p.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()
                            : "NA"}
                        </Avatar>
                      </TableCell>
                      <TableCell>{p.name}</TableCell>
                      <TableCell>{p.email}</TableCell>
                      <TableCell>{p.module}</TableCell>
                      <TableCell>{p.department}</TableCell>
                      <TableCell>{p.fee?.toLocaleString() || "N/A"}</TableCell>
                      <TableCell>
                        <Badge
                          badgeContent={p.feesPaid ? "Paid" : "Pending"}
                          color={p.feesPaid ? "success" : "warning"}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={participants.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Paper>
      </Box>

      {/* Notifications Feed */}
     {/* Notifications Feed */}
<Box mt={6}>
  <Typography variant="h5" gutterBottom color="white">
    Recent Activity
  </Typography>
  <List
    sx={{
      maxHeight: 250,
      overflowY: "auto",
      bgcolor: "black",
      borderRadius: 2,
      border: "1px solid #333",
      color: "white",
    }}
  >
    {notifications.length === 0 ? (
      <ListItem>
        <ListItemText
          primary="No recent activity"
          primaryTypographyProps={{ style: { color: "white" } }}
        />
      </ListItem>
    ) : (
      notifications.map(({ id, message, date }) => (
        <React.Fragment key={id}>
          <ListItem>
            <ListItemAvatar>
              <Avatar sx={{ bgcolor: "#1976d2" }}>🛎️</Avatar>
            </ListItemAvatar>
            <ListItemText
              primary={message}
              secondary={date}
              primaryTypographyProps={{ style: { color: "white" } }}
              secondaryTypographyProps={{ style: { color: "#ccc" } }}
            />
          </ListItem>
          <Divider
            variant="inset"
            component="li"
            sx={{ borderColor: "#444" }}
          />
        </React.Fragment>
      ))
    )}
  </List>
</Box>

    </Box>
  );
};

export default Dashboard;
