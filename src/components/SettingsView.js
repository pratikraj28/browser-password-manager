import { useState, useEffect, useContext } from "react";
import {
  Typography, List, ListItem, ListItemIcon, ListItemText,
  Button, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, MenuItem, Select, IconButton,
  LinearProgress, Snackbar, Alert
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
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordStrength, setPasswordStrength] = useState("Weak");

  const [autoLogoutOptions] = useState([0.5, 1, 5, 10, 15, 30, 60]);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const handleCloseSnackbar = () => setSnackbar({ ...snackbar, open: false });

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

  const evaluatePasswordStrength = (password) => {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[\W_]/.test(password)) score++;

    if (score >= 4) return "Strong";
    if (score >= 3) return "Good";
    return "Weak";
  };

  const getStrengthColor = () => {
    if (passwordStrength === "Strong") return "success";
    if (passwordStrength === "Good") return "warning";
    return "error";
  };

  useEffect(() => {
    setPasswordStrength(evaluatePasswordStrength(newPassword));
  }, [newPassword]);

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      setSnackbar({ open: true, message: "New password and confirm password do not match.", severity: "error" });
      return;
    }

    const strength = evaluatePasswordStrength(newPassword);
    if (strength === "Weak") {
      setSnackbar({
        open: true,
        message: "Please choose a stronger password (at least 8 characters, mix of uppercase, numbers, symbols).",
        severity: "warning"
      });
      return;
    }

    try {
      const response = await fetch("http://127.0.0.1:5000/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email, old_password: oldPassword, new_password: newPassword })
      });

      const data = await response.json();
      setSnackbar({ open: true, message: data.message, severity: data.status === "success" ? "success" : "error" });

      if (data.status === "success") {
        setOpenPasswordDialog(false);
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (error) {
      console.error("Error changing password:", error);
      setSnackbar({ open: true, message: "Failed to change password. Please try again.", severity: "error" });
    }
  };

  return (
    <>
      <br />
      <Typography variant="h5" gutterBottom>Settings</Typography>
      <List>
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

        <ListItem>
          <ListItemIcon><VpnKeyIcon /></ListItemIcon>
          <ListItemText primary="Change Master Password" />
          <Button variant="contained" color="secondary" onClick={() => setOpenPasswordDialog(true)}>Change</Button>
        </ListItem>
      </List>

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
            helperText={`Password Strength: ${passwordStrength}`}
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

          <LinearProgress
            variant="determinate"
            value={passwordStrength === "Strong" ? 100 : passwordStrength === "Good" ? 60 : 30}
            sx={{ my: 1 }}
            color={getStrengthColor()}
          />

          <TextField
            label="Confirm New Password"
            type={showConfirmPassword ? "text" : "password"}
            fullWidth
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            margin="dense"
            InputProps={{
              endAdornment: (
                <IconButton
                  position="end"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  edge="end"
                >
                  {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
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

      <Snackbar
  open={snackbar.open}
  autoHideDuration={4000}
  onClose={handleCloseSnackbar}
  anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
>
  <Alert
    severity={snackbar.severity}
    onClose={handleCloseSnackbar}
    sx={{ width: '100%' }}
  >
    {snackbar.message}
  </Alert>
</Snackbar>
    </>
  );
};

export default SettingsView;
