import React, { useState, useEffect } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Avatar, Box, Typography, Paper, Divider, Stack
} from "@mui/material";
import EmailIcon from "@mui/icons-material/Email";
import PersonIcon from "@mui/icons-material/Person";

const ProfileModal = ({ open, handleClose, user, refreshProfile }) => {
  const [profilePic, setProfilePic] = useState(null);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    if (user?.profile_pic) {
      setPreview(user.profile_pic);
    }
  }, [user]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result);

    if (file) {
      setProfilePic(file);
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!user?.email || !preview) {
      alert("Missing email or profile picture");
      return;
    }

    try {
      const response = await fetch("http://127.0.0.1:5000/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          profile_pic: preview,
        }),
      });

      const result = await response.json();
      if (result.status === "success") {
        alert("Profile updated!");
        refreshProfile && refreshProfile();
        handleClose();
      } else {
        alert("Error updating profile: " + result.message);
      }
    } catch (error) {
      alert("Error: " + error.message);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: "bold", textAlign: "center" }}>Your Profile</DialogTitle>

      <DialogContent>
        <Paper elevation={1} sx={{ p: 3, mb: 2, textAlign: "center" }}>
          <Avatar src={preview} sx={{ width: 90, height: 90, mx: "auto", mb: 1 }} />
          <Button variant="outlined" component="label">
            Upload New Picture
            <input hidden type="file" accept="image/*" onChange={handleImageChange} />
          </Button>
        </Paper>

        <Paper elevation={1} sx={{ p: 3 }}>
          <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
            <PersonIcon color="primary" />
            <Box>
              <Typography variant="caption" sx={{ fontWeight: "bold", color: "gray" }}>
                USERNAME
              </Typography>
              <Typography variant="body1">{user?.username || "N/A"}</Typography>
            </Box>
          </Stack>

          <Divider sx={{ my: 2 }} />

          <Stack direction="row" spacing={2} alignItems="center">
            <EmailIcon color="primary" />
            <Box>
              <Typography variant="caption" sx={{ fontWeight: "bold", color: "gray" }}>
                EMAIL
              </Typography>
              <Typography variant="body1">{user?.email || "N/A"}</Typography>
            </Box>
          </Stack>
        </Paper>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose}>Cancel</Button>
        <Button variant="contained" color="primary" onClick={handleUpload}>
          Save Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProfileModal;
