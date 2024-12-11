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
import Logo from "./assets/logo.jpg";

const ColorButton = styled(Button)(({ theme }) => ({
  color: theme.palette.getContrastText(theme.palette.common.white),
  backgroundColor: theme.palette.common.white,
  "&:hover": {
    backgroundColor: "#ffffff7a",
  },
}));

const MainContainer = styled("div")(() => ({
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  backgroundImage: `url(${bgImage})`,
  backgroundRepeat: "no-repeat",
  backgroundPosition: "center",
  backgroundSize: "cover",
  width: "100vw", // Full width of the viewport
  height: "100vh", // Full height of the viewport
  overflow: "hidden",
}));

const CenteredCard = styled(Card)(({ theme }) => ({
  width: "100%",
  maxWidth: "600px", // Adjust maximum width for responsiveness
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
  const [confidence, setConfidence] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

  const sendFile = async () => {
    if (!selectedFile) return;

    let formData = new FormData();
    formData.append("file", selectedFile);

    const token = localStorage.getItem("token");

    try {
      const res = await axios.post(`${API_URL}/predict`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.status === 200) {
        setData(res.data);
        setConfidence((parseFloat(res.data.confidence) * 100).toFixed(2));
      }
    } catch (error) {
      console.error("Error uploading file:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedFile) {
      setPreview(undefined);
      return;
    }
    const objectUrl = URL.createObjectURL(selectedFile);
    setPreview(objectUrl);
    setIsLoading(true);
    sendFile();
    return () => URL.revokeObjectURL(objectUrl);
  }, [selectedFile]);

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
    setConfidence(0);
  };

  const handleClear = () => {
    setSelectedFile(null);
    setPreview(null);
    setData(null);
    setConfidence(0);
  };

  const Dropzone = () => {
    const { getRootProps, getInputProps } = useDropzone({
      onDrop: (acceptedFiles) => {
        if (acceptedFiles && acceptedFiles.length > 0) {
          setSelectedFile(acceptedFiles[0]);
          setData(undefined);
          setConfidence(0);
        }
      },
      multiple: false,
      accept: "image/*",
    });

    return (
      <div
        {...getRootProps()}
        style={{ border: "2px dashed #ddd", padding: "20px", textAlign: "center" }}
      >
        <input {...getInputProps()} />
        <Typography>
          Drag and drop an image of your skin to test for melanoma, or click to select one
        </Typography>
      </div>
    );
  };

  return (
    <React.Fragment>
      <AppBar position="static" sx={{ background: "#6a8abe", padding: "0 20px" }}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Melanoma Detection Predictive webapp
            <Avatar src={Logo} sx={{ marginLeft: "10px" }} />
          </Typography>
          {isLoggedIn && (
            <Button color="inherit" onClick={handleLogout}>
              Logout
            </Button>
          )}
        </Toolbar>
      </AppBar>

      <MainContainer>
        {!isLoggedIn ? (
          <CenteredCard>
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
            <Typography sx={{ marginTop: "20px" }} variant="body2" align="center">
              LAU students: Abdul Rahman Al Zaatari & Tamim Eter
              <br />
              Under mentorship of: Dr. Seifedine Kadry
            </Typography>
          </CenteredCard>
        ) : (
          <CenteredCard>
            {preview && (
              <CardActionArea>
                <CardMedia
                  component="img"
                  height="400"
                  image={preview}
                  alt="Selected Image Preview"
                />
              </CardActionArea>
            )}
            {!preview && (
              <CardContent>
                <Dropzone />
              </CardContent>
            )}
            {data && (
              <CardContent>
                <TableContainer component={Paper}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>
                          <strong>Label</strong>
                        </TableCell>
                        <TableCell align="right">
                          <strong>Confidence</strong>
                        </TableCell>
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
            {(data || preview) && (
              <CardContent>
                <ColorButton
                  variant="contained"
                  onClick={handleClear}
                  startIcon={<ClearIcon />}
                >
                  Clear
                </ColorButton>
              </CardContent>
            )}
            <Typography sx={{ marginTop: "20px" }} variant="body2" align="center">
              LAU students: Abdul Rahman Al Zaatari & Tamim Eter
              <br />
              Under mentorship of: Dr. Seifedine Kadry
            </Typography>
          </CenteredCard>
        )}
      </MainContainer>
    </React.Fragment>
  );
};

export default Home;
