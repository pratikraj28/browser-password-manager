import {
  Typography,
  Button,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  IconButton,
  Paper,
  Modal,
  Box,
  TextField,
  MenuItem,
} from "@mui/material";
import {
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  FileCopy as FileCopyIcon,
  Add as AddIcon,
} from "@mui/icons-material";
import { useEffect, useState } from "react";
import React from "react";
import PasswordDialog from './PasswordDialog';
import { AuthContext } from "../AuthContext";
import { useContext } from "react";
import ShareIcon from "@mui/icons-material/Share";
import { Visibility, VisibilityOff } from "@mui/icons-material";

const VaultView = () => {
  const [passwords, setPasswords] = useState([]);
  const [newPassword, setNewPassword] = useState({ website: "", username: "", password: "" });
  const [showPasswordDialog, setShowPasswordDialogState] = useState(false);
  const [visiblePassword, setVisiblePassword] = useState({});
  const [isEditMode, setIsEditMode] = useState(false);
  const [editPasswordData, setEditPasswordData] = useState(null);
  const { logout, email } = useContext(AuthContext);
  const [passwordStrength, setPasswordStrength] = useState("Weak");
  const [showPassword, setShowPassword] = useState(false);

  const [loadingPasswords, setLoadingPasswords] = useState(false);

  const [showShareModal, setShowShareModal] = useState(false);
  const [shareDetails, setShareDetails] = useState({ email: "", expiry: 15 });
  const [selectedToShare, setSelectedToShare] = useState(null);
  const baseurl = "https://password-manager-backend-298931957092.us-central1.run.app"

  useEffect(() => {
    setNewPassword({ website: "", username: "", password: "" });
    fetchPasswords();
  }, []);

  const fetchPasswords = async () => {
    setLoadingPasswords(true);
    try {
      const response = await fetch(`${baseurl}/get-passwords?email=${email}`);
      const data = await response.json();
      if (Array.isArray(data)) {
        setPasswords(data);
      } else {
        console.error("Expected an array, but received:", data);
      }
    } catch (error) {
      console.error("Error fetching passwords:", error);
    } finally {
      setLoadingPasswords(false);
    }
  };

  const deletePassword = async (website, username) => {
    try {
      const isConfirmed = window.confirm("Are you sure you want to delete this password?");
      if (!isConfirmed) return;

      const response = await fetch(baseurl + "/delete-password", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, website, username }),
      });

      const result = await response.json();
      if (result.status === "success") {
        setPasswords(passwords.filter((pw) => pw.website !== website || pw.username !== username));
        logActivity('Deleted password', website);
      } else {
        console.error(result.message);
      }
    } catch (error) {
      console.error("Error deleting password:", error);
    }
  };

  const addPassword = async () => {
    try {
      const response = await fetch(baseurl + "/add-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "email": email,
        },
        body: JSON.stringify({
          email,
          website: newPassword.website,
          username: newPassword.username,
          password: newPassword.password,
        }),
      });

      const result = await response.json();
      if (result.status === "success") {
        setPasswords([...passwords, newPassword]);
        setNewPassword({ website: "", username: "", password: "" });
        setShowPasswordDialogState(false);
        logActivity('Added new password', newPassword.website);
      } else {
        console.error(result.message);
      }
    } catch (error) {
      console.error("Error adding password:", error);
    }
  };

  const editPassword = async () => {
    try {
      const response = await fetch(baseurl + "/edit-password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "email": email,
        },
        body: JSON.stringify({
          email,
          website: editPasswordData.website,
          username: editPasswordData.username,
          password: editPasswordData.password,
        }),
      });

      const result = await response.json();
      if (result.status === "success") {
        setPasswords(
          passwords.map((pw) =>
            pw.website === editPasswordData.website && pw.username === editPasswordData.username
              ? editPasswordData
              : pw
          )
        );
        setEditPasswordData(null);
        setIsEditMode(false);
        setShowPasswordDialogState(false);
        logActivity('Edited password', editPasswordData.website);
      } else {
        console.error(result.message);
      }
    } catch (error) {
      console.error("Error editing password:", error);
    }
  };

  const togglePasswordVisibility = (website, username) => {
    setVisiblePassword((prev) => ({
      ...prev,
      [`${website}-${username}`]: !prev[`${website}-${username}`],
    }));
  };

  const handleEditPassword = (website, username) => {
    const passwordToEdit = passwords.find((pw) => pw.website === website && pw.username === username);
    setEditPasswordData(passwordToEdit);
    setIsEditMode(true);
    setShowPasswordDialogState(true);
  };

  const handleCopyPassword = (password) => {
    navigator.clipboard.writeText(password)
      .then(() => alert("Password copied to clipboard!"))
      .catch((err) => console.error("Failed to copy password: ", err));
  };

  const handleOpenShareModal = (password) => {
    setSelectedToShare(password);
    setShowShareModal(true);
  };

  const handleShareSubmit = async () => {
    if (!shareDetails.email) {
      alert("Please enter an email.");
      return;
    }

    try {
      const response = await fetch(baseurl + "/share-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sender_email: email,
          recipient_email: shareDetails.email,
          website: selectedToShare.website,
          username: selectedToShare.username,
          password: selectedToShare.password,
          expiry: shareDetails.expiry,
        }),
      });

      const result = await response.json();
      if (result.status === "success") {
        alert("Password shared successfully via email!");
        setShowShareModal(false);
        setShareDetails({ email: "", expiry: 15 });
      } else {
        alert("Failed to share: " + result.message);
      }
    } catch (error) {
      console.error("Error sharing password:", error);
      alert("Something went wrong!");
    }
  };

  const logActivity = async (action, website) => {
    try {
      await fetch(baseurl + "/log-activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, action, website }),
      });
    } catch (err) {
      console.error("Error logging activity:", err);
    }
  };

  const calculatePasswordStrength = (passwords) => {
    if (!passwords || passwords.length === 0) return "Weak";

    let score = 0;
    passwords.forEach(({ password }) => {
      if (password.length >= 12) score += 3;
      else if (password.length >= 8) score += 2;
      else score += 1;
      if (/[A-Z]/.test(password)) score += 1;
      if (/[0-9]/.test(password)) score += 1;
      if (/[\W_]/.test(password)) score += 2;
    });

    const averageScore = score / passwords.length;
    if (averageScore >= 5) return "Strong";
    if (averageScore >= 3) return "Good";
    return "Weak";
  };

  useEffect(() => {
    setPasswordStrength(calculatePasswordStrength(passwords));
  }, [passwords]);

  return (
    <>
      <Typography variant="h5" gutterBottom sx={{ marginTop: 10 }}>
        Password Vault
      </Typography>

      <Button
        variant="contained"
        color="secondary"
        startIcon={<AddIcon />}
        onClick={() => {
          setIsEditMode(false);
          setShowPasswordDialogState(true);
        }}
        sx={{ mb: 2 }}
      >
        Add New Password
      </Button>

      <PasswordDialog
        open={showPasswordDialog}
        onClose={() => setShowPasswordDialogState(false)}
        passwordData={isEditMode ? editPasswordData : newPassword}
        setPasswordData={isEditMode ? setEditPasswordData : setNewPassword}
        onSubmit={isEditMode ? editPassword : addPassword}
        isEditMode={isEditMode}
      />

      {loadingPasswords ? (
        <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center' }}>
          Loading Password... <span className="bouncing-dots">...</span>
        </Typography>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Website</TableCell>
                <TableCell>Username</TableCell>
                <TableCell>Password</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {passwords.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    No passwords saved yet.
                  </TableCell>
                </TableRow>
              ) : (
                passwords.map((pw) => (
                  <TableRow key={pw.website + pw.username}>
                    <TableCell>{pw.website}</TableCell>
                    <TableCell>{pw.username}</TableCell>
                    <TableCell>
                      {visiblePassword[`${pw.website}-${pw.username}`] ? pw.password : '••••••••'}
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => togglePasswordVisibility(pw.website, pw.username)}
                      >
                        {visiblePassword[`${pw.website}-${pw.username}`] ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                      <IconButton
                        size="small"
                        color="secondary"
                        onClick={() => handleEditPassword(pw.website, pw.username)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => deletePassword(pw.website, pw.username)}
                      >
                        <DeleteIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleCopyPassword(pw.password)}
                      >
                        <FileCopyIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleOpenShareModal(pw)}
                      >
                        <ShareIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Modal open={showShareModal} onClose={() => setShowShareModal(false)}>
        <Box
          sx={{
            position: "absolute", top: "50%", left: "50%",
            transform: "translate(-50%, -50%)",
            bgcolor: "background.paper", p: 4, borderRadius: 2, width: 400,
            boxShadow: 24
          }}
        >
          <Typography variant="h6" gutterBottom>Share Password</Typography>
          <TextField
            label="Recipient Email"
            fullWidth
            value={shareDetails.email}
            onChange={(e) => setShareDetails({ ...shareDetails, email: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            label="Expiry (minutes)"
            select
            fullWidth
            value={shareDetails.expiry}
            onChange={(e) => setShareDetails({ ...shareDetails, expiry: parseInt(e.target.value) })}
            sx={{ mb: 2 }}
          >
            {[1, 5, 10, 15, 30, 60].map((val) => (
              <MenuItem key={val} value={val}>{val} minutes</MenuItem>
            ))}
          </TextField>
          <Button variant="contained" color="primary" fullWidth onClick={handleShareSubmit}>
            Share
          </Button>
        </Box>
      </Modal>
    </>
  );
};

export default VaultView;
