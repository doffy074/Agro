# PlantGuard AI

AI-Powered Plant Disease Detection System

## Overview

PlantGuard AI is a web application that helps farmers and agricultural officers detect plant diseases using AI. Upload a leaf image and get instant disease diagnosis with treatment recommendations.

## Tech Stack

### Frontend
- React + TypeScript
- Vite
- Tailwind CSS
- shadcn/ui

### Backend
- Python (FastAPI)
- TensorFlow/Keras for AI model
- SQLite database

## Getting Started

### Prerequisites
- Node.js (v18+)
- Python (v3.9+)

### Frontend Setup

```sh
# Clone the repository
git clone https://github.com/doffy074/Agro.git

# Navigate to project directory
cd Agro/plantwise-ai

# Install dependencies
npm install

# Start development server
npm run dev
```

### Backend Setup

```sh
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment (Windows)
.\venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start the backend server
uvicorn main:app --reload
```

## Features

- 🌱 AI-powered plant disease detection
- 👨‍🌾 Farmer dashboard for uploading images and viewing predictions
- 👮 Officer dashboard for reviewing and validating predictions
- 🔐 Role-based authentication (Admin, Officer, Farmer)
- 📊 Statistics and analytics

## Environment Variables

Create a `.env` file in the root directory with the following:

```
VITE_API_URL=http://localhost:8000
```
