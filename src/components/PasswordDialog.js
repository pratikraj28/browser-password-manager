import React, { useEffect } from 'react';
import { Dialog, DialogActions, DialogContent, DialogTitle, Button, TextField } from '@mui/material';

const PasswordDialog = ({ open, onClose, passwordData, setPasswordData, onSubmit, isEditMode }) => {

  useEffect(() => {
    if (isEditMode) {
      setPasswordData(passwordData);
    }
  }, [isEditMode, passwordData, setPasswordData]);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setPasswordData({ ...passwordData, [id]: value });
  };

  const handleSubmit = () => {
    onSubmit();
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{isEditMode ? 'Edit Password' : 'Add New Password'}</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          id="website"
          label="Website"
          type="text"
          fullWidth
          variant="outlined"
          value={passwordData.website}
          onChange={handleChange}
          InputProps={{
            readOnly: isEditMode,
          }}
        />
        <TextField
          margin="dense"
          id="username"
          label="Username"
          type="text"
          fullWidth
          variant="outlined"
          value={passwordData.username}
          onChange={handleChange}
          InputProps={{
            readOnly: isEditMode,
          }}
        />
        <TextField
          margin="dense"
          id="password"
          label="Password"
          type="password"
          fullWidth
          variant="outlined"
          value={passwordData.password}
          onChange={handleChange}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" color="primary">
          {isEditMode ? 'Save Changes' : 'Add'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PasswordDialog;
