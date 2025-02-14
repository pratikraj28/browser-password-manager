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

const VaultView = () => {
  const [passwords, setPasswords] = useState([]);
  const [newPassword, setNewPassword] = useState({ website: "", username: "", password: "" });
  const [showPasswordDialog, setShowPasswordDialogState] = useState(false);
  const [visiblePassword, setVisiblePassword] = useState({});
  const [isEditMode, setIsEditMode] = useState(false);
  const [editPasswordData, setEditPasswordData] = useState(null);
  const { logout, email } = useContext(AuthContext);

  useEffect(() => {
    setNewPassword({ website: "", username: "", password: "" });
    fetchPasswords();
  }, []);
  const fetchPasswords = async () => {
    try {
      const response = await fetch(`http://127.0.0.1:5000/get-passwords?email=${email}`);

      const data = await response.json();

      if (Array.isArray(data)) {
        setPasswords(data);
      } else {
        console.error("Expected an array, but received:", data);
      }
    } catch (error) {
      console.error("Error fetching passwords:", error);
    }
  };
  
  const deletePassword = async (website, username) => {
    try {


      const isConfirmed = window.confirm("Are you sure you want to delete this password?");

  if (!isConfirmed) {
    return;
  }

      const response = await fetch("http://127.0.0.1:5000/delete-password", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          website,
          username,
        }),
      });

      const result = await response.json();
      if (result.status === "success") {
        setPasswords(passwords.filter((pw) => pw.website !== website || pw.username !== username));
      } else {
        console.error(result.message);
      }
    } catch (error) {
      console.error("Error deleting password:", error);
    }
  };

  const addPassword = async () => {
    try {
      const response = await fetch("http://127.0.0.1:5000/add-password", {
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
      } else {
        console.error(result.message);
      }
    } catch (error) {
      console.error("Error adding password:", error);
    }
  };

  const editPassword = async () => {
    try {
      const response = await fetch("http://127.0.0.1:5000/edit-password", {
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
      .then(() => {
        alert("Password copied to clipboard!");
      })
      .catch((err) => {
        console.error("Failed to copy password: ", err);
      });
  };

  return (
    <>
      <Typography variant="h5" gutterBottom>
      <br></br>
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
            {Array.isArray(passwords) && passwords.map((pw) => (  // Check if passwords is an array before calling .map()
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
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
};

export default VaultView;
