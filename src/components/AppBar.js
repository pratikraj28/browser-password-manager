import { useEffect, useContext } from "react";
import { AppBar as MuiAppBar, Toolbar, Typography, IconButton, Avatar, Menu, MenuItem } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { AuthContext } from "../AuthContext";
import { useNavigate } from "react-router-dom";

const AppBar = ({
  handleDrawerToggle,
  handleMenuOpen,
  handleMenuClose,
  handleProfileOpen,
  anchorEl,
}) => {
  const { logout, timeout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout()
    navigate("/");
  };

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
    <MuiAppBar
      position="fixed"
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        background: "linear-gradient(45deg, #6a00ff 30%, #00e5ff 90%)",
      }}
    >
      <Toolbar>
        <IconButton color="inherit" aria-label="open drawer" edge="start" onClick={handleDrawerToggle} sx={{ mr: 2 }}>
          <MenuIcon />
        </IconButton>
        <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
          Password Manager
        </Typography>
        <IconButton color="inherit" onClick={handleMenuOpen}>
          <Avatar sx={{ width: 32, height: 32, bgcolor: "secondary.main" }}>U</Avatar>
        </IconButton>
        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
          <MenuItem onClick={handleProfileOpen}>Profile</MenuItem>
          <MenuItem onClick={handleLogout}>Logout</MenuItem>
        </Menu>
      </Toolbar>
    </MuiAppBar>
  );
};

export default AppBar;

