import { useEffect, useState, useContext } from "react";
import {
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  Divider,
  CircularProgress,
  Box
} from "@mui/material";
import { Save as SaveIcon, Refresh as RefreshIcon } from "@mui/icons-material";
import { AuthContext } from "../AuthContext";

const BackupView = () => {
  const { email } = useContext(AuthContext);
  const [backupHistory, setBackupHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [backupLoading, setBackupLoading] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [dotCount, setDotCount] = useState(0);
  const baseUrl = "https://password-manager-backend-298931957092.us-central1.run.app"

  useEffect(() => {
    if (!loading && !backupLoading && !restoreLoading) return;
    const interval = setInterval(() => {
      setDotCount((prev) => (prev + 1) % 4);
    }, 500);
    return () => clearInterval(interval);
  }, [loading, backupLoading, restoreLoading]);

  // Fetch backup history
  useEffect(() => {
    fetchBackupHistory();
  }, []);

  const fetchBackupHistory = async () => {
    setLoading(true);
    try {
      const response = await fetch(baseUrl + "/get-backup-history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      setBackupHistory(data.reverse());
    } catch (err) {
      console.error("Error fetching backup history:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleBackup = async () => {
    setBackupLoading(true);
    try {
      const response = await fetch(baseUrl + "/backup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      alert(data.message);
      if (data.status === "success") fetchBackupHistory();
    } catch (err) {
      console.error("Backup failed:", err);
      alert("Backup failed. Try again later.");
    } finally {
      setBackupLoading(false);
    }
  };

  const handleRestore = async () => {
    const confirmRestore = window.confirm("Are you sure you want to restore the latest backup?");
    if (!confirmRestore) return;

    setRestoreLoading(true);
    try {
      const response = await fetch(baseUrl + "/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      alert(data.message);
    } catch (err) {
      console.error("Restore failed:", err);
      alert("Restore failed. Try again later.");
    } finally {
      setRestoreLoading(false);
    }
  };

  return (
    <>
      <Typography variant="h5" gutterBottom>
        <br />
        Backup & Restore
      </Typography>

      {/* loading button for backup */}
      <Button
        variant="contained"
        color="secondary"
        startIcon={backupLoading ? <CircularProgress size={24} color="inherit" /> : <SaveIcon />}
        sx={{ mr: 2 }}
        onClick={handleBackup}
        disabled={backupLoading}
      >
        {backupLoading ? `Backing up${".".repeat(dotCount)}` : "Backup Data"}
      </Button>

      {/* loading Button for restore */}
      <Button
        variant="contained"
        color="primary"
        startIcon={restoreLoading ? <CircularProgress size={24} color="inherit" /> : <RefreshIcon />}
        onClick={handleRestore}
        disabled={restoreLoading}
      >
        {restoreLoading ? `Restoring${".".repeat(dotCount)}` : "Restore Data"}
      </Button>

      <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
        Backup History
      </Typography>

      {/* Show loading while fetching backup history */}
      {loading ? (
        <Box display="flex" flexDirection="column" alignItems="center" mt={4}>
          <CircularProgress color="primary" />
          <Typography variant="body1" sx={{ mt: 2, fontWeight: 500 }}>
            Loading backups{".".repeat(dotCount)}
          </Typography>
        </Box>
      ) : (
        <List>
          {backupHistory.length > 0 ? (
            backupHistory.map((timestamp, index) => (
              <div key={index}>
                <ListItem>
                  <ListItemText
                    primary={`Backup #${backupHistory.length - index}`}
                    secondary={`Timestamp: ${timestamp.timestamp.replace(/_/g, " ").replace(/-/g, ":")}`}
                  />
                </ListItem>
                <Divider />
              </div>
            ))
          ) : (
            <ListItem>
              <ListItemText primary="No backups available yet." />
            </ListItem>
          )}
        </List>
      )}
    </>
  );
};

export default BackupView;
