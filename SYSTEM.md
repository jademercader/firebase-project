# System Specifications

This document outlines the hardware and software specifications for the Barangay Health Insights project.

## 1. Software Specifications

### Core Framework & Environment
- **Framework**: Next.js (v15.x with App Router)
- **Runtime Environment**: Node.js
- **Language**: TypeScript
- **Package Manager**: npm

### Frontend & UI
- **UI Library**: React (v18.x)
- **Component Library**: shadcn/ui
- **Styling**: Tailwind CSS
- **Charting**: Recharts
- **Mapping**: Google Maps JavaScript API, integrated via `@react-google-maps/api`
- **State Management**: React Hooks (`useState`, `useEffect`) and React Context API

### Artificial Intelligence (AI)
- **AI Framework**: Google Genkit
- **LLM Models**: Google AI (Gemini 2.5 Pro, Gemini 2.5 Flash)
- **Functionality**:
    - Data Cleansing Suggestions
    - Cluster Analysis
    - Trend Identification

### Data Handling
- **File Parsing**: `papaparse` for handling CSV uploads.
- **Client-Side Storage**: Browser Local Storage for persisting user data, uploaded records, and analysis results.

### Authentication
- **Method**: A mock authentication system using React Context and Local Storage. It is not connected to a production authentication service.

## 2. Hardware & Hosting Specifications

### Hosting Environment
- **Provider**: Firebase App Hosting
- **Architecture**: Serverless, managed environment.
- **Configuration**: The default configuration is set for a single instance (`maxInstances: 1`) as defined in `apphosting.yaml`, suitable for development and small-scale applications. This can be scaled up by modifying the configuration file.

### Backend Services
- **Geocoding**: Google Geocoding API (accessed via a server-side action).

### Client-Side (User) Requirements
- **Browser**: A modern web browser that supports current JavaScript (ES6+) and CSS3 standards (e.g., Chrome, Firefox, Safari, Edge).
- **Internet Connection**: An active internet connection is required to access the application, Google Maps services, and the AI models.
