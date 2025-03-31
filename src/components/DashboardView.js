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
} from "@mui/material";
import { Lock as LockIcon, Add as AddIcon, Security as SecurityIcon, Share as ShareIcon } from "@mui/icons-material";

const DashboardView = ({ passwordStrength, recentActivity = [] }) => {  // Add default value for recentActivity
  return (
    <>
      <Typography variant="h4" gutterBottom>
        <br />
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
                Your overall password strength is: <strong>{passwordStrength}</strong>
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
                {recentActivity.length > 0 ? (
                  recentActivity.map((activity, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <LockIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary={`${activity.action} for ${activity.website}`}
                        secondary={`${activity.time} by ${activity.username}`}
                      />
                    </ListItem>
                  ))
                ) : (
                  <ListItem>
                    <ListItemText primary="No recent activity" />
                  </ListItem>
                )}
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
  );
};

export default DashboardView;
