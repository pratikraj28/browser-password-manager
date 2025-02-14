import { createTheme } from "@mui/material/styles"

const customTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#6a00ff",
    },
    secondary: {
      main: "#00e5ff",
    },
    background: {
      default: "#121212",
      paper: "#1e1e1e",
    },
  },
  typography: {
    fontFamily: "'Roboto', 'Helvetica', 'Arial', sans-serif",
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: "none",
          fontWeight: 600,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
  },
})

export default customTheme

