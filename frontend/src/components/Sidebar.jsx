import React, { useEffect, useState } from "react";

import {
  Box,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import {
  HomeOutlined,
  ChevronLeft,
  EventOutlined,
  SecurityOutlined,
  PaymentsOutlined,
  NotificationsOutlined,
  ChevronRightOutlined,
  PeopleOutlined,
  GradeOutlined,
  ViewModuleOutlined
} from "@mui/icons-material";
import { useLocation, useNavigate } from "react-router-dom";
import FlexBetween from "./FlexBetween";

export const navItems = [
  { text: "Dashboard", icon: <HomeOutlined />, route: "/dashboard" },
  { text: "Event", icon: <EventOutlined />, route: "/events" },
  { text: "Modules", icon: <ViewModuleOutlined />, route: "/modules" },
  { text: "Participant Management",icon: <PeopleOutlined />, route: "/participants"},
  { text: "Permission Management", icon: <SecurityOutlined />, route: "/permissions" },
  { text: "Payments Processing", icon: <PaymentsOutlined />, route: "/payments" },
  { text: "Results", icon: <GradeOutlined />, route: "/results" },
  { text: "Notifications", icon: <NotificationsOutlined />, route: "/notifications" },
];

const Sidebar = ({ drawerWidth, isSidebarOpen, setIsSidebarOpen, isNonMobile }) => {
  const { pathname } = useLocation();
  const [active, setActive] = useState("");
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down("md")); // Check for mobile screen size

  useEffect(() => {
    setActive(pathname.substring(1));
  }, [pathname]);

  return (
    <Box component="nav">
      {isSidebarOpen && (
        <Drawer
          open={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          variant={isMobile ? "temporary" : "persistent"}
          anchor="left"
          sx={{
            width: drawerWidth,
            "& .MuiDrawer-paper": {
              color: theme.palette.secondary[200],
              backgroundColor: theme.palette.background.alt,
              boxSizing: "border-box",
              borderWidth: isNonMobile ? 0 : "2px",
              width: drawerWidth,
            },
          }}
        >
          <Box width="100%">
            <Box m="1.5rem 2rem 2rem 3rem">
              <FlexBetween color={theme.palette.secondary.main}>
                <Typography variant="h4" fontWeight="bold">
                  Zab E-Fest
                </Typography>
                {!isNonMobile && (
                  <IconButton onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
                    <ChevronLeft />
                  </IconButton>
                )}
              </FlexBetween>
            </Box>
            <List>
              {navItems.map(({ text, icon, route }) => {
                const lcText = text.toLowerCase();
                return (
                  <ListItem key={text} disablePadding>
                    <ListItemButton
                      onClick={() => {
                        navigate(route);
                        setActive(lcText);
                      }}
                      sx={{
                        backgroundColor:
                          active === lcText ? theme.palette.secondary[300] : "transparent",
                        color:
                          active === lcText
                            ? theme.palette.primary.main
                            : theme.palette.secondary[100],
                      }}
                    >
                      <ListItemIcon
                        sx={{
                          ml: "2rem",
                          color:
                            active === lcText
                              ? theme.palette.primary.main
                              : theme.palette.secondary[200],
                        }}
                      >
                        {icon}
                      </ListItemIcon>
                      <ListItemText primary={text} />
                      {active === lcText && <ChevronRightOutlined sx={{ ml: "auto" }} />}
                    </ListItemButton>
                  </ListItem>
                );
              })}
            </List>
          </Box>
        </Drawer>
      )}
    </Box>
  );
};

export default Sidebar;
