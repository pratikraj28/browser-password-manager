import { Drawer, List, ListItem, ListItemIcon, ListItemText, Box, Toolbar } from "@mui/material"
import DashboardIcon from "@mui/icons-material/Dashboard"
import VpnKeyIcon from "@mui/icons-material/VpnKey"
import AddIcon from "@mui/icons-material/Add"
import SaveIcon from "@mui/icons-material/Save"
import SettingsIcon from "@mui/icons-material/Settings"

const Sidebar = ({ drawerOpen, handleDrawerToggle, setCurrentView, isMobile }) => {
  const menuItems = [
    { text: "Dashboard", icon: <DashboardIcon />, view: "dashboard" },
    { text: "Password Vault", icon: <VpnKeyIcon />, view: "vault" },
    { text: "Password Generator", icon: <AddIcon />, view: "generator" },
    { text: "Backup & Restore", icon: <SaveIcon />, view: "backup" },
    { text: "Settings", icon: <SettingsIcon />, view: "settings" },
  ]

  return (
    <Drawer
      variant={isMobile ? "temporary" : "permanent"}
      open={drawerOpen}
      onClose={handleDrawerToggle}
      ModalProps={{
        keepMounted: true,
      }}
      sx={{
        "& .MuiDrawer-paper": {
          boxSizing: "border-box",
          width: drawerOpen ? 240 : 72,
          transition: (theme) =>
            theme.transitions.create("width", {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
          overflowX: "hidden",
          background: "linear-gradient(180deg, #6a00ff 0%, #00e5ff 100%)",
          color: "white",
        },
      }}
    >
      <Toolbar />
      <Box>
        <List>
          {menuItems.map((item) => (
            <ListItem
              button
              key={item.text}
              onClick={() => {
                setCurrentView(item.view)
                if (isMobile) handleDrawerToggle()
              }}
              sx={{
                minHeight: 48,
                justifyContent: drawerOpen ? "initial" : "center",
                px: 2.5,
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: drawerOpen ? 3 : "auto",
                  justifyContent: "center",
                  color: "white",
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} sx={{ opacity: drawerOpen ? 1 : 0 }} />
            </ListItem>
          ))}
        </List>
      </Box>
    </Drawer>
  )
}

export default Sidebar

