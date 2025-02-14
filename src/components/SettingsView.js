import { useState, useEffect, useContext } from "react";
import { 
  Typography, List, ListItem, ListItemIcon, ListItemText, 
  Button, Dialog, DialogTitle, DialogContent, 
  DialogActions, TextField, MenuItem, Select, IconButton 
} from "@mui/material";
import { 
  ExitToApp as ExitToAppIcon, 
  VpnKey as VpnKeyIcon, Visibility, VisibilityOff 
} from "@mui/icons-material";
import { AuthContext } from "../AuthContext";

const SettingsView = () => {
  const { email, timeout, updateTimeout } = useContext(AuthContext);

  const [autoLogout, setAutoLogout] = useState(timeout);
  const [openPasswordDialog, setOpenPasswordDialog] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [autoLogoutOptions] = useState([0.5, 1, 5, 10, 15, 30, 60]);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Fetch user settings from backend
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch("http://127.0.0.1:5000/get-user-settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email })
        });
        if (!response.ok) {
          throw new Error(`Failed to fetch settings: ${response.statusText}`);
        }

        const data = await response.json();
        setAutoLogout(data.auto_logout || 10);
      } catch (err) {
        console.error("Error fetching settings:", err);
      }
    };

    fetchSettings();
  }, [email]);

  const handleAutoLogoutChange = async (event) => {
    try {
      const newTimeout = event.target.value;
      setAutoLogout(newTimeout);
      updateTimeout(newTimeout);

      const response = await fetch("http://127.0.0.1:5000/set-auto-logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email, timeout: newTimeout })
      });

      if (!response.ok) throw new Error("Failed to update auto-logout setting");

      console.log("Auto-logout updated successfully");
    } catch (error) {
      console.error("Error updating Auto-Logout:", error);
    }
  };

  const handleChangePassword = async () => {
    try {
      const response = await fetch("http://127.0.0.1:5000/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email, old_password: oldPassword, new_password: newPassword })
      });

      const data = await response.json();
      alert(data.message);
      if (data.status === "success") {
        setOpenPasswordDialog(false);
        setOldPassword("");
        setNewPassword("");
      }
    } catch (error) {
      console.error("Error changing password:", error);
      alert("Failed to change password. Please try again.");
    }
  };

  return (
    <>
      <br />
      <Typography variant="h5" gutterBottom>Settings</Typography>
      <List>
        {/* Auto-Logout Duration Selection */}
        <ListItem>
          <ListItemIcon><ExitToAppIcon /></ListItemIcon>
          <ListItemText primary="Auto-Logout Duration" />
          <Select
            value={autoLogout}
            onChange={handleAutoLogoutChange} 
            style={{ marginLeft: "auto", minWidth: 100 }}
          >
            {autoLogoutOptions.map((option) => (
              <MenuItem key={option} value={option}>
                {option} min
              </MenuItem>
            ))}
          </Select>
        </ListItem>

        {/* Change Master Password */}
        <ListItem>
          <ListItemIcon><VpnKeyIcon /></ListItemIcon>
          <ListItemText primary="Change Master Password" />
          <Button variant="contained" color="secondary" onClick={() => setOpenPasswordDialog(true)}>Change</Button>
        </ListItem>
      </List>

      {/* Change Password Modal */}
      <Dialog open={openPasswordDialog} onClose={() => setOpenPasswordDialog(false)}>
        <DialogTitle>Change Password</DialogTitle>
        <DialogContent>
          <TextField 
            label="Old Password" 
            type={showOldPassword ? "text" : "password"} 
            fullWidth 
            value={oldPassword} 
            onChange={(e) => setOldPassword(e.target.value)} 
            margin="dense"
            InputProps={{
              endAdornment: (
                <IconButton
                  position="end"
                  onClick={() => setShowOldPassword(!showOldPassword)}
                  edge="end"
                >
                  {showOldPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              ),
            }}
          />
          <TextField 
            label="New Password" 
            type={showNewPassword ? "text" : "password"} 
            fullWidth 
            value={newPassword} 
            onChange={(e) => setNewPassword(e.target.value)} 
            margin="dense"
            InputProps={{
              endAdornment: (
                <IconButton
                  position="end"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  edge="end"
                >
                  {showNewPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              ),
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPasswordDialog(false)}>Cancel</Button>
          <Button onClick={handleChangePassword} variant="contained">Change</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default SettingsView;
