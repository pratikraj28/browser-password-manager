import {
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material"
import { Lock as LockIcon, Add as AddIcon, Security as SecurityIcon, Share as ShareIcon } from "@mui/icons-material"

const DashboardView = () => {
  return (
    <>
      <Typography variant="h4" gutterBottom>
        <br></br>
        Welcome to Your Password Manager
      </Typography>
      <Grid container spacing={5}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Password Strength
              </Typography>
              <Typography variant="body1">
                Your overall password strength is: <strong>Good</strong>
              </Typography>
            </CardContent>
            <CardActions>
              <Button size="small" color="primary">
                View Details
              </Button>
            </CardActions>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Activity
              </Typography>
              <List>
                <ListItem>
                  <ListItemIcon>
                    <LockIcon />
                  </ListItemIcon>
                  <ListItemText primary="Password changed for example.com" secondary="2 days ago" />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <AddIcon />
                  </ListItemIcon>
                  <ListItemText primary="New password added for github.com" secondary="1 week ago" />
                </ListItem>
              </List>
            </CardContent>
            <CardActions>
              <Button size="small" color="primary">
                View All Activity
              </Button>
            </CardActions>
          </Card>
        </Grid>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Actions
              </Typography>
              <Grid container spacing={2}>
                <Grid item>
                  <Button variant="contained" color="primary" startIcon={<AddIcon />}>
                    Add New Password
                  </Button>
                </Grid>
                <Grid item>
                  <Button variant="contained" color="secondary" startIcon={<SecurityIcon />}>
                    Security Check
                  </Button>
                </Grid>
                <Grid item>
                  <Button variant="contained" color="info" startIcon={<ShareIcon />}>
                    Share Password
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </>
  )
}

export default DashboardView

