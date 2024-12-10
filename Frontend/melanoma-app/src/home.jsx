import React, { useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { styled } from "@mui/material/styles";
import {
  AppBar,
  Toolbar,
  Typography,
  Avatar,
  Container,
  Card,
  CardContent,
  Paper,
  CardActionArea,
  CardMedia,
  Grid,
  TableContainer,
  Table,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  Button,
  CircularProgress,
  TextField,
} from "@mui/material";
import ClearIcon from "@mui/icons-material/Clear";
import axios from "axios";
import bgImage from "./assets/bg.avif";
import lauLogo from "./assets/lau-logo-social-media.jpg";

// Styled button with custom hover effect
const ColorButton = styled(Button)(({ theme }) => ({
  color: theme.palette.getContrastText(theme.palette.common.white),
  backgroundColor: theme.palette.common.white,
  "&:hover": {
    backgroundColor: "#ffffff7a",
  },
}));

// Main container for background and centering
const MainContainer = styled(Container)(() => ({
  backgroundImage: `url(${bgImage})`,
  backgroundRepeat: "no-repeat",
  backgroundPosition: "center",
  backgroundSize: "cover",
  height: "100vh",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  flexDirection: "column",
}));

// Card container for the login form
const LoginContainer = styled(Card)(() => ({
  width: "400px",
  padding: "20px",
  boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
  borderRadius: "10px",
  backgroundColor: "#ffffff",
  textAlign: "center",
}));

const Home = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const [selectedFile, setSelectedFile] = useState();
  const [preview, setPreview] = useState();
  const [data, setData] = useState();
  const [image, setImage] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  let confidence = 0;

  const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

  const handleLogin = async () => {
    try {
      const response = await axios.post(
        `${API_URL}/token`,
        new URLSearchParams({ username, password }),
        {
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        }
      );
      localStorage.setItem("token", response.data.access_token);
      setIsLoggedIn(true);
      setLoginError("");
    } catch (error) {
      setLoginError("Invalid username or password.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
    setSelectedFile(null);
    setPreview(null);
    setData(null);
  };

  const sendFile = async () => {
    if (image) {
      let formData = new FormData();
      formData.append("file", selectedFile);

      try {
        const token = localStorage.getItem("token");
        const response = await axios.post(`${API_URL}/predict`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        });
        setData(response.data);
      } catch (error) {
        console.error("Error uploading file:", error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const clearData = () => {
    setData(null);
    setImage(false);
    setSelectedFile(null);
    setPreview(null);
  };

  useEffect(() => {
    if (!selectedFile) {
      setPreview(undefined);
      return;
    }
    const objectUrl = URL.createObjectURL(selectedFile);
    setPreview(objectUrl);
  }, [selectedFile]);

  useEffect(() => {
    if (!preview) return;
    setIsLoading(true);
    sendFile();
  }, [preview]);

  const onSelectFile = (files) => {
    if (!files || files.length === 0) {
      setSelectedFile(undefined);
      setImage(false);
      setData(undefined);
      return;
    }
    setSelectedFile(files[0]);
    setData(undefined);
    setImage(true);
  };

  if (data) {
    confidence = (parseFloat(data.confidence) * 100).toFixed(2);
  }

  return (
    <React.Fragment>
      <AppBar position="static" sx={{ background: "#6a8abe", padding: "0 20px" }}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Melanoma Detection
            <Avatar src={lauLogo} sx={{ marginLeft: "10px" }} />
          </Typography>
          {isLoggedIn && (
            <Button color="inherit" onClick={handleLogout}>
              Logout
            </Button>
          )}
        </Toolbar>
      </AppBar>

      {!isLoggedIn ? (
        <MainContainer>
          <LoginContainer>
            <Typography variant="h5" align="center" gutterBottom>
              Admin Login
            </Typography>
            <TextField
              label="Username"
              fullWidth
              margin="normal"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <TextField
              label="Password"
              type="password"
              fullWidth
              margin="normal"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {loginError && <Typography color="error">{loginError}</Typography>}
            <Button variant="contained" color="primary" fullWidth onClick={handleLogin}>
              Login
            </Button>
            <Typography variant="body2" align="center" sx={{ marginTop: "20px" }}>
              Abdul Rahman Al Zaatari & Tamim Eter
            </Typography>
          </LoginContainer>
        </MainContainer>
      ) : (
        <MainContainer>
          <Grid container justifyContent="center" spacing={2}>
            <Grid item xs={12}>
              <Card sx={{ maxWidth: 400, margin: "auto", boxShadow: 3 }}>
                {image ? (
                  <CardActionArea>
                    <CardMedia
                      component="img"
                      height="400"
                      image={preview}
                      alt="Selected Image Preview"
                    />
                  </CardActionArea>
                ) : (
                  <CardContent>
                    <Dropzone onDrop={(acceptedFiles) => onSelectFile(acceptedFiles)} />
                  </CardContent>
                )}
                {data && (
                  <CardContent>
                    <TableContainer component={Paper}>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell><strong>Label</strong></TableCell>
                            <TableCell align="right"><strong>Confidence</strong></TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          <TableRow>
                            <TableCell>{data.class}</TableCell>
                            <TableCell align="right">{confidence}%</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                )}
                {isLoading && (
                  <CardContent sx={{ textAlign: "center" }}>
                    <CircularProgress />
                    <Typography>Processing</Typography>
                  </CardContent>
                )}
              </Card>
            </Grid>
            {data && (
              <Grid item>
                <ColorButton variant="contained" onClick={clearData} startIcon={<ClearIcon />}>
                  Clear
                </ColorButton>
              </Grid>
            )}
          </Grid>
        </MainContainer>
      )}
    </React.Fragment>
  );
};

export default Home;
