import { Typography, Button, List, ListItem, ListItemText } from "@mui/material"
import { Save as SaveIcon, Refresh as RefreshIcon } from "@mui/icons-material"

const BackupView = () => {
  return (
    <>
      <Typography variant="h5" gutterBottom>
        <br></br>
        Backup & Restore
      </Typography>
      <Button variant="contained" color="secondary" startIcon={<SaveIcon />} sx={{ mr: 2 }}>
        Backup Data
      </Button>
      <Button variant="contained" color="primary" startIcon={<RefreshIcon />}>
        Restore Data
      </Button>
      <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
        Backup History
      </Typography>
      <List>
        <ListItem>
          <ListItemText primary="Latest Backup" secondary="2023-06-15 14:30" />
        </ListItem>
        <ListItem>
          <ListItemText primary="Previous Backup" secondary="2023-06-01 09:15" />
        </ListItem>
      </List>
    </>
  )
}

export default BackupView

