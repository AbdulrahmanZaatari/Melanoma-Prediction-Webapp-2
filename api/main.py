from fastapi import FastAPI, File, UploadFile, Depends, HTTPException, status
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
import torch
import torch.nn as nn
from torchvision import transforms, models
import uvicorn
from io import BytesIO
from PIL import Image
import os
from jose import JWTError, jwt

# Define paths and class names
MODEL_PATH = "saved_models/1.pth"  # Adjusted path for the model file
CLASS_NAMES = ['benign', 'malignant']  # Define your class names

# JWT configurations
SECRET_KEY = "supersecretkey"  # Use a secure key in production
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Hardcoded admin credentials
ADMIN_USERNAME = "medicalSociety"
ADMIN_PASSWORD = "medicalsociety1298!"

# Initialize OAuth2PasswordBearer
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def authenticate_user(username: str, password: str):
    print(f"Debug: Received username={username}, password={password}")
    if username == ADMIN_USERNAME and password == ADMIN_PASSWORD:
        return {"username": ADMIN_USERNAME}
    return None

def create_access_token(data: dict):
    """Create a new JWT token."""
    return jwt.encode(data, SECRET_KEY, algorithm=ALGORITHM)

# Initialize FastAPI app
app = FastAPI()

# Middleware for CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins or specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve static files for the React frontend
app.mount("/static", StaticFiles(directory="dist"), name="static")

@app.get("/")
async def serve_frontend():
    """Serve the React app's main entry file."""
    return FileResponse("dist/index.html")

# Device configuration (CPU/GPU)
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# Load the model architecture and weights
model = models.resnet18(pretrained=False)
num_ftrs = model.fc.in_features
model.fc = nn.Linear(num_ftrs, len(CLASS_NAMES))  # Adjust output layer to match the number of classes
model.load_state_dict(torch.load(MODEL_PATH, map_location=device))
model = model.to(device)
model.eval()  # Set the model to evaluation mode

# Define a transformation pipeline for preprocessing images
transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])  # Normalize to ImageNet mean/std
])

@app.get("/ping")
async def ping():
    """Health check endpoint."""
    return {"message": "Hello, I am alive!"}

def read_file_as_image(data) -> torch.Tensor:
    """Read an image file as a PyTorch tensor."""
    image = Image.open(BytesIO(data)).convert("RGB")
    image = transform(image).unsqueeze(0)  # Add batch dimension
    return image.to(device)

@app.post("/predict")
async def predict(file: UploadFile = File(...), token: str = Depends(oauth2_scheme)):
    """Predict the class of the uploaded image."""
    # Verify token
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None or username != ADMIN_USERNAME:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Read and preprocess the image
    image = read_file_as_image(await file.read())
    
    # Perform prediction
    with torch.no_grad():
        outputs = model(image)
        probabilities = torch.softmax(outputs[0], dim=0)
        predicted_class = CLASS_NAMES[probabilities.argmax().item()]
        confidence = probabilities.max().item()
    
    # Return prediction results
    return {"class": predicted_class, "confidence": confidence}

@app.post("/token")
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    """Login and issue a token."""
    user = authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(data={"sub": user["username"]})
    return {"access_token": access_token, "token_type": "bearer"}

#if __name__ == "__main__":
    #uvicorn.run(app, host="127.0.0.1", port=8000)  # Use localhost (127.0.0.1) and port 8000

# Uncomment the following block for deployment
if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))  # Default to 8000 if PORT is not set
    uvicorn.run(app, host="0.0.0.0", port=port)
# (For deployment use this)
