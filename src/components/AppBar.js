import React, { useEffect, useState, useContext } from "react";
import {
  AppBar as MuiAppBar, Toolbar, Typography, IconButton,
  Avatar, Menu, MenuItem
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { AuthContext } from "../AuthContext";
import { useNavigate } from "react-router-dom";
import ProfileModal from "./ProfileModal";

const AppBar = ({
  handleDrawerToggle,
  handleMenuOpen,
  handleMenuClose,
  anchorEl
}) => {
  const { logout, email, timeout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [userData, setUserData] = useState({});
  const [profileOpen, setProfileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const fetchProfile = async () => {
    if (!email) return;
    try {
      const res = await fetch("https://password-manager-backend-298931957092.us-central1.run.app/get-user-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      // Debug log here
      console.log("User data updated:", data.user);
  
      // FIXED: proper check and set
      if (data.status === "success" && data.user) {
        setUserData(data.user);
      } else {
        console.error("Failed to fetch profile:", data.message);
      }
    } catch (err) {
      console.error("Profile fetch failed", err);
    }
  };
  
  

  useEffect(() => {
    if (email) {
      fetchProfile();
    }
  }, [email]);

  useEffect(() => {
    const refresh = () => fetchProfile();
    window.addEventListener("profile-updated", refresh);
    return () => window.removeEventListener("profile-updated", refresh);
  }, []);

  useEffect(() => {
    if (!timeout) return;
    const logoutTimeout = timeout * 60 * 1000;
    let timer = setTimeout(handleLogout, logoutTimeout);

    const resetTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(handleLogout, logoutTimeout);
    };

    window.addEventListener("mousemove", resetTimer);
    window.addEventListener("keypress", resetTimer);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("mousemove", resetTimer);
      window.removeEventListener("keypress", resetTimer);
    };
  }, [timeout]);

  return (
    <>
      <MuiAppBar
        position="fixed"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          background: "linear-gradient(45deg, #6a00ff 30%, #00e5ff 90%)",
        }}
      >
        <Toolbar>
          <IconButton color="inherit" edge="start" onClick={handleDrawerToggle} sx={{ mr: 2 }}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap sx={{ flexGrow: 1 }}>
            Password Manager
          </Typography>
          <IconButton color="inherit" onClick={handleMenuOpen}>
            <Avatar src={userData.profile_pic} sx={{ width: 32, height: 32 }}>
              {userData.username?.[0]?.toUpperCase() || "U"}
            </Avatar>
          </IconButton>
          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
            <MenuItem onClick={() => {
              setProfileOpen(true);
              handleMenuClose();
            }}>Profile</MenuItem>
            <MenuItem onClick={handleLogout}>Logout</MenuItem>
          </Menu>
        </Toolbar>
      </MuiAppBar>

      <ProfileModal
        open={profileOpen}
        handleClose={() => setProfileOpen(false)}
        user={userData}
        refreshProfile={fetchProfile}
      />

    </>
  );
};

export default AppBar;
