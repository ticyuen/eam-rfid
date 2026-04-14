import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  typography: {
    fontSize: 14,
    fontFamily: 'Montserrat, Arial, sans-serif',
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          minHeight: 24, // Touch friendly
          fontSize: "0.9rem",
          textTransform: "none",
          paddingLeft: 12,
          paddingRight: 12
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          marginBottom: 12,
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
          root: {
            fontSize: "0.95rem",
            padding: "12px 16px",
          },
      },
    },
    MuiIcon: {
      styleOverrides: {
        root: {
          // Match 24px = 3 * 2 + 1.125 * 16
          boxSizing: 'content-box',
          padding: 3,
          fontSize: '1.125rem',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          height: 60,
          paddingTop: 0,
          paddingBottom: 0,
          fontSize: "0.9rem"
        },
        head: {
          fontWeight: "bold",
          backgroundColor: "#003c74",
          // backgroundColor: "#2c3e50",
          color: "#e7e7e7"
        }
      }
    },
  },
  // primary: 
  // secondary: #377fb1
  // tertiary: #9bb9dd
  palette: {
    primary: {
      main: '#004b8f',
      // light: '#63a4ff',
      // dark: '#004ba0',
      // contrastText: '#e7e7e7',
    },
    secondary: {
      main: '#377fb1',
    },
    tertiary: {
      main: '#9bb9dd'
    },
    success: {
      main: '#2e7d32',
    },
    error: {
      main: '#d32f2f',
    },
    warning: {
      main: '#ed6c02',
    },
    info: {
      main: '#0288d1',
    },
    inactive: {
      main: '#808080'
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
    text: {
      primary: '#000000',
      secondary: '#555555',
    },
  },
});

export default theme;

// default table and layout color: #2c3e50
// layout style = backgroundColor: "#2c3e50", color: "#e7e7e7"