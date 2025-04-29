import { useState } from "react"
import { ThemeProvider } from "@mui/material/styles"
import {
  CssBaseline,
  Box,
  useMediaQuery,
  Container,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  TextField,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material"
import { useTheme } from "@mui/material/styles"
import { motion, AnimatePresence } from "framer-motion"
import AppBar from './AppBar';
import Sidebar from './Sidebar';
import DashboardView from "./DashboardView";
import VaultView from "./VaultView";
import GeneratorView from "./GeneratorView";
import BackupView from "./BackupView";
import SettingsView from "./SettingsView";
import customTheme from "./theme"
import SecurityIcon from "@mui/icons-material/Security"
import PersonIcon from "@mui/icons-material/Person"

const Dashboard = () => {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [currentView, setCurrentView] = useState("dashboard")
  const [passwords, setPasswords] = useState([
    { id: 1, website: "example.com", username: "user@example.com", password: "password123" },
    { id: 2, website: "github.com", username: "devuser", password: "githubpass456" },
  ])
  const [newPassword, setNewPassword] = useState({ website: "", username: "", password: "" })
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [generatorOptions, setGeneratorOptions] = useState({
    length: 12,
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true,
  })
  const [generatedPassword, setGeneratedPassword] = useState("")
  const [anchorEl, setAnchorEl] = useState(null)
  const [showProfileDialog, setShowProfileDialog] = useState(false)
  const [showAccountDialog, setShowAccountDialog] = useState(false)

  // For profile picture
  const [profilePicture, setProfilePicture] = useState(null)

  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"))

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen)
  }

  const addPassword = () => {
    setPasswords([...passwords, { id: passwords.length + 1, ...newPassword }])
    setNewPassword({ website: "", username: "", password: "" })
    setShowPasswordDialog(false)
  }

  const deletePassword = (id) => {
    setPasswords(passwords.filter((pw) => pw.id !== id))
  }

  const generatePassword = () => {
    let charset = ""
    if (generatorOptions.uppercase) charset += "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    if (generatorOptions.lowercase) charset += "abcdefghijklmnopqrstuvwxyz"
    if (generatorOptions.numbers) charset += "0123456789"
    if (generatorOptions.symbols) charset += "!@#$%^&*()_+{}[]|:;<>,.?/~"

    let newPassword = ""
    for (let i = 0; i < generatorOptions.length; i++) {
      newPassword += charset.charAt(Math.floor(Math.random() * charset.length))
    }
    setGeneratedPassword(newPassword)
  }

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const handleProfileOpen = () => {
    setShowProfileDialog(true)
    handleMenuClose()
  }

  const handleAccountOpen = () => {
    setShowAccountDialog(true)
    handleMenuClose()
  }

  const handleProfilePictureUpload = (event) => {
    const file = event.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setProfilePicture(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const renderContent = () => {
    switch (currentView) {
      case "dashboard":
        return <DashboardView />
      case "vault":
        return (
          <VaultView
            passwords={passwords}
            setShowPasswordDialog={setShowPasswordDialog}
            deletePassword={deletePassword}
          />
        )
      case "generator":
        return (
          <GeneratorView
            generatorOptions={generatorOptions}
            setGeneratorOptions={setGeneratorOptions}
            generatedPassword={generatedPassword}
            generatePassword={generatePassword}
          />
        )
      case "backup":
        return <BackupView />
      case "settings":
        return <SettingsView />
      default:
        return null
    }
  }

  return (
    <ThemeProvider theme={customTheme}>
      <CssBaseline />
      <Box sx={{ display: "flex", minHeight: "100vh" }}>
        <AppBar
          handleDrawerToggle={handleDrawerToggle}
          handleMenuOpen={handleMenuOpen}
          handleMenuClose={handleMenuClose}
          handleProfileOpen={handleProfileOpen}
          handleAccountOpen={handleAccountOpen}
          anchorEl={anchorEl}
        />
        <Sidebar
          drawerOpen={drawerOpen}
          handleDrawerToggle={handleDrawerToggle}
          setCurrentView={setCurrentView}
          isMobile={isMobile}
        />
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 3,
            width: { sm: `calc(100% - ${drawerOpen ? 240 : 72}px)` },
            ml: { sm: `${drawerOpen ? 240 : 72}px` },
            transition: theme.transitions.create(["margin", "width"], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.leavingScreen,
            }),
          }}
        >
          <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentView}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                {renderContent()}
              </motion.div>
            </AnimatePresence>
          </Container>
        </Box>
      </Box>

      <Dialog open={showPasswordDialog} onClose={() => setShowPasswordDialog(false)}>
        <DialogTitle>Add New Password</DialogTitle>
        <DialogContent>
          <DialogContentText>Enter the details for the new password entry.</DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            id="website"
            label="Website"
            type="text"
            fullWidth
            variant="outlined"
            value={newPassword.website}
            onChange={(e) => setNewPassword({ ...newPassword, website: e.target.value })}
          />
          <TextField
            margin="dense"
            id="username"
            label="Username"
            type="text"
            fullWidth
            variant="outlined"
            value={newPassword.username}
            onChange={(e) => setNewPassword({ ...newPassword, username: e.target.value })}
          />
          <TextField
            margin="dense"
            id="password"
            label="Password"
            type="password"
            fullWidth
            variant="outlined"
            value={newPassword.password}
            onChange={(e) => setNewPassword({ ...newPassword, password: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPasswordDialog(false)}>Cancel</Button>
          <Button onClick={addPassword} variant="contained" color="primary">
            Add
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={showProfileDialog} onClose={() => setShowProfileDialog(false)}>
        <DialogTitle>User Profile</DialogTitle>
        <DialogContent>
          <DialogContentText>View and edit your profile information.</DialogContentText>

          <Box sx={{ textAlign: "center", mb: 2 }}>
            {profilePicture ? (
              <img
                src={profilePicture}
                alt="Profile"
                style={{ width: 100, height: 100, borderRadius: "50%", objectFit: "cover" }}
              />
            ) : (
              <Box sx={{ width: 100, height: 100, borderRadius: "50%", backgroundColor: "#ccc" }} />
            )}
            <input
              accept="image/*"
              style={{ display: "none" }}
              id="profile-picture-upload"
              type="file"
              onChange={handleProfilePictureUpload}
            />
            <label htmlFor="profile-picture-upload">
              <Button variant="contained" component="span" sx={{ mt: 1 }}>
                Upload Profile Picture
              </Button>
            </label>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowProfileDialog(false)}>Close</Button>
          <Button onClick={() => setShowProfileDialog(false)} variant="contained" color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={showAccountDialog} onClose={() => setShowAccountDialog(false)}>
        <DialogTitle>Account Settings</DialogTitle>
        <DialogContent>
          <DialogContentText>Manage your account settings.</DialogContentText>
          <List>
            <ListItem>
              <ListItemIcon>
                <SecurityIcon />
              </ListItemIcon>
              <ListItemText primary="Change Password" />
              <Button variant="outlined">Change</Button>
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <PersonIcon />
              </ListItemIcon>
              <ListItemText primary="Update Personal Information" />
              <Button variant="outlined">Update</Button>
            </ListItem>
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAccountDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </ThemeProvider>
  )
}

export default Dashboard