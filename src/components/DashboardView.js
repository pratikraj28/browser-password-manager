import { AuthContext } from "../AuthContext";
import React, { useState, useEffect, useContext } from "react";
import ClearIcon from '@mui/icons-material/Clear';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import InfoIcon from '@mui/icons-material/Info';
import {
  Typography,
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  LinearProgress,
  Box
} from "@mui/material";
import {
  Lock as LockIcon
} from "@mui/icons-material";

// Password strength calculation
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

const getStrengthVisualProps = (strength) => {
  switch (strength) {
    case "Strong":
      return {
        value: 100,
        color: "success",
        bgColor: "#e8f5e9",
        textColor: "#388e3c",
        title: "All Good!",
        message: "✅ Excellent: Your passwords are strong. Continue using best practices to keep your data safe.",
        tip: "Great job! Regularly update passwords to maintain security."
      };
    case "Good":
      return {
        value: 66,
        color: "warning",
        bgColor: "#fff8e1",
        textColor: "#f57c00",
        title: "Caution",
        message: "⚠️ Some of your passwords could be stronger. Consider updating them to improve overall security.",
        tip: "Avoid reusing passwords and include special characters."
      };
    case "Weak":
    default:
      return {
        value: 33,
        color: "error",
        bgColor: "#ffebee",
        textColor: "#c62828",
        title: "Attention Required!",
        message: "🚨 Multiple weak passwords detected. This poses a security risk. Please update them immediately.",
        tip: "Use a mix of uppercase, lowercase, numbers, and symbols."
      };
  }
};

const DashboardView = () => {
  const { email, name } = useContext(AuthContext);
  const [passwords, setPasswords] = useState([]);
  const [passwordStrength, setPasswordStrength] = useState("Weak");
  const [recentActivities, setRecentActivities] = useState([]);
  

  useEffect(() => {
    if (!email) return;
    fetchActivity();
    fetchPasswords();
  }, [email]);

  const fetchPasswords = async () => {
    try {
      const response = await fetch(`https://password-manager-backend-298931957092.us-central1.run.app/get-passwords?email=${email}`);
      const data = await response.json();
      if (Array.isArray(data)) {
        setPasswords(data);
        setPasswordStrength(calculatePasswordStrength(data));
      } else {
        console.error("Expected array but got:", data);
      }
    } catch (error) {
      console.error("Error fetching passwords:", error);
    }
  };

  const fetchActivity = async () => {
    try {
      const response = await fetch("https://password-manager-backend-298931957092.us-central1.run.app/get-activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const result = await response.json();
      setRecentActivities(result.activities || []);
    } catch (err) {
      console.error("Error fetching activities:", err);
    }
  };

  const deleteActivity = async (id) => {
    try {
      await fetch("https://password-manager-backend-298931957092.us-central1.run.app/delete-activity", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      fetchActivity();
    } catch (err) {
      console.error("Error deleting activity:", err);
    }
  };

  const handleClearActivity = (index) => {
    const activityToDelete = recentActivities[index];
    if (activityToDelete && activityToDelete._id) {
      deleteActivity(activityToDelete._id);
    }
  };

  const username = name || (email ? email.split("@")[0] : "User");
  const strengthVisual = getStrengthVisualProps(passwordStrength);

  return (
    <Box sx={{ mt: 8 }}>
      <Typography variant="h4" gutterBottom>
        Hello, {username} 👋
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 4 }}>
        Welcome to your secure password manager dashboard.
      </Typography>


      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1">Total Passwords</Typography>
              <Typography variant="h4">{passwords.length}</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1">Password Strength</Typography>
              <LinearProgress
                variant="determinate"
                value={strengthVisual.value}
                color={strengthVisual.color}
                sx={{ height: 10, borderRadius: 5, mt: 2 }}
              />
              <Typography variant="body2" sx={{ mt: 1 }}>
                {passwordStrength}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Card sx={{ backgroundColor: strengthVisual.bgColor }}>
            <CardContent>
              <Typography
                variant="subtitle1"
                sx={{
                  display: "flex",
                  alignItems: "center",
                  mb: 1,
                  color: strengthVisual.textColor,
                }}
              >
                <WarningAmberIcon sx={{ mr: 1 }} />
                {strengthVisual.title}
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: strengthVisual.textColor }}
              >
                {strengthVisual.message}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>


      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Activity
              </Typography>
              <List
                sx={{
                  maxHeight: 220,
                  overflowY: "scroll",
                  pr: 1,
                  scrollbarWidth: "none",
                  "&::-webkit-scrollbar": { display: "none" }
                }}
              >
                {recentActivities.length === 0 ? (
                  <ListItem>
                    <ListItemText primary="No recent activity" />
                  </ListItem>
                ) : (
                  recentActivities.map((activity, index) => (
                    <ListItem
                      key={activity._id || index}
                      secondaryAction={
                        <IconButton edge="end" onClick={() => handleClearActivity(index)}>
                          <ClearIcon fontSize="small" />
                        </IconButton>
                      }
                    >
                      <ListItemIcon><LockIcon /></ListItemIcon>
                      <ListItemText
                        primary={`${activity.action} for ${activity.website}`}
                        secondary={activity.timestamp}
                      />
                    </ListItem>
                  ))
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ backgroundColor: "#e3f2fd" }}>
            <CardContent>
              <Typography
                variant="subtitle1"
                sx={{
                  display: "flex",
                  alignItems: "center",
                  color: "#1565c0",
                  mb: 1
                }}
              >
                <InfoIcon sx={{ mr: 1 }} />
                Security Tip
              </Typography>
              <Typography variant="body2" sx={{ color: "#1565c0" }}>
                {strengthVisual.tip}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardView;
