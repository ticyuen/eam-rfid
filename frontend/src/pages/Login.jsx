import { useState } from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper
} from "@mui/material";
import { useAuthStore, useUIStore } from "../store";
import { useNavigate } from "react-router-dom";

import Logo from "../assets/logo.png";
import api from "../api/axios";

import { useWorkOrderStore } from "../store";

export default function Login() {
  const navigate = useNavigate()
  const login = useAuthStore((state) => state.login);
  const showSnackbar = useUIStore((state) =>state.showSnackbar);
  const fetchWorkOrders = useWorkOrderStore((s) => s.fetchWorkOrders);

  const [username, setUsername] = useState("TEST");
  const [password, setPassword] = useState("asd");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) {
      showSnackbar("Username and password are required","error");
      return;
    }

    setLoading(true);

    try {
      const isDev = import.meta.env.VITE_NODE_ENV === "development";
      
      const mockAuth = {
        data: {
          data: {
            token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjM0IiwiaWF0IjoxNjg1NzY2MDAwfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
            username: "admin",
            description: "Admin"
          }
        }
      };
      
      const res = isDev ? mockAuth : await api.post("/auth/login", {
        username,
        password,
      });

      const data = res.data?.data;
      const user = { 
        username: data?.username,
        description: data?.description
      }

      if (!data?.token) {
        throw new Error("Invalid server response");
      }

      login(data?.token, user);

      await fetchWorkOrders();

      navigate("/work-orders", { replace: true });
    } catch (err) {
      console.error("Login error:", err);

      // Handle different error types
      if (err?.status === 401) {
        showSnackbar("Invalid username or password","error");
      } else if (err?.message) {
        showSnackbar(`Login Error: ${err?.message}`,"error");
        console.log("Login error: ", err.message);
      } else {
        showSnackbar("Login failed. Please try again.","error");
      }

    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #004b8f, #377fb1)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        pl: 2,
        pr: 2,
        flexDirection: "column"
      }}
    >
      <Box sx={{ display: "flex", textAlign: "center", justifyContent: "center", mb: 8 }}>
        <img 
          src={Logo} 
          width="30%" 
          style={{ 
            border: "0.5px solid rgba(255,255,255,0.8)", 
            objectFit: "cover",  
            boxShadow: "0 0 80px rgba(255,255,255,0.8), 0 0 80px rgba(255,255,255,0.6)"
          }} 
        />
      </Box>

      <Paper
        elevation={6}
        sx={{
          width: "100%",
          maxWidth: 400,
          p: 3,
          borderRadius: 3,
        }}
      >
        <Typography
          variant="h5"
          sx={{ fontSize: "1.65rem" }}
          mb={1}
          textAlign="center"
        >
          INVENTORY SYSTEM
        </Typography>

        <TextField
          label="Username"
          fullWidth
          size="medium"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          margin="normal"
        />

        <TextField
          label="Password"
          type="password"
          fullWidth
          size="medium"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          margin="normal"
        />

        <Button
          variant="contained"
          fullWidth
          size="large"
          sx={{
            mt: 2,
            height: 48,
            fontWeight: "bold"
          }}
          onClick={handleLogin}
          disabled={loading}
        >
          <Typography variant="body2" fontWeight="bold">
            {loading ? "LOGGING IN": "LOGIN"}
          </Typography>
        </Button>

        {/* <Typography
          variant="caption"
          display="block"
          textAlign="center"
          mt={3}
          color="text.secondary"
        >
          © {new Date().getFullYear()} Inventory System
        </Typography> */}
      </Paper>
    </Box>
  );
}