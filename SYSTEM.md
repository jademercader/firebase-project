# System Architecture and Specifications

## Abstract

This document delineates the comprehensive system architecture for the "City Health Insights" platform. It provides a detailed specification of the software frameworks, libraries, external services, and underlying hardware infrastructure that constitute the project. The design prioritizes a modern, scalable, and maintainable technology stack to support its data analysis and visualization objectives.

---

## 1.0 Software Architecture

The application is architected as a modern web application, leveraging a serverless paradigm for hosting and backend functionalities. The core design principles are component-based UI, server-side rendering, and client-side data management, augmented by generative artificial intelligence for advanced data processing.

### 1.1 Core Technology Stack

The foundational layer of the application is built upon a curated set of industry-standard technologies:

*   **Execution Environment**: Node.js
*   **Primary Framework**: Next.js (v15.x), utilizing the App Router model for routing and Server Components.
*   **Programming Language**: TypeScript, for static typing and enhanced code quality.
*   **Package Management**: npm (Node Package Manager).

### 1.2 Frontend Subsystem

The user interface and client-side experience are constructed with the following technologies:

*   **UI Paradigm**: React (v18.x) for building declarative, stateful components.
*   **Component Toolkit**: `shadcn/ui`, providing a library of accessible and stylistically consistent UI primitives.
*   **Visual Styling**: Tailwind CSS, for a utility-first approach to styling.
*   **Data Visualization (Charts)**: `Recharts`, for rendering statistical charts and graphs.
*   **Geospatial Visualization (Maps)**: Google Maps JavaScript API, integrated via the `@react-google-maps/api` library.
*   **Client-Side State**: A combination of React Hooks (e.g., `useState`, `useEffect`) and the React Context API for managing local component and global UI state.

### 1.3 Data and Artificial Intelligence Subsystem

The system's data processing and analytical capabilities are powered by a combination of file handling utilities and a generative AI framework.

*   **Data Ingestion**: The `papaparse` library is employed for robust client-side parsing of Comma-Separated Values (CSV) files.
*   **AI Framework**: Google Genkit serves as the orchestration layer for all generative AI tasks.
*   **Foundation Models**: The system utilizes Google AI models, including Gemini 2.5 Pro for complex structured data generation and Gemini 2.5 Flash for faster, general-purpose tasks.
*   **AI-driven Capabilities**:
    *   **Automated Data Cleansing**: Identification of anomalies, missing values, and inconsistencies in uploaded datasets.
    *   **Cluster Analysis**: Algorithmic grouping of health records based on selected indicators.
    *   **Trend Identification**: Temporal analysis of cluster data to detect significant patterns.

### 1.4 Authentication and Data Persistence

*   **Authentication**: A mock authentication mechanism is implemented using the React Context API and browser Local Storage. This system simulates user login and registration for development and demonstration purposes and is not connected to a production authentication provider.
*   **Data Persistence**: Browser Local Storage is utilized for the client-side persistence of user session data, uploaded health records, and the results of cluster analysis, enabling session continuity.

---

## 2.0 Infrastructure and Deployment

### 2.1 Hosting and Operational Environment

*   **Cloud Provider**: Google Cloud
*   **Hosting Service**: Firebase App Hosting, which provides a managed, serverless environment for deploying the Next.js application.
*   **Scalability Configuration**: The `apphosting.yaml` file is configured for a `maxInstances` of 1, suitable for development, testing, and small-scale production use. This parameter can be adjusted to enable automatic scaling in response to increased traffic.

### 2.2 External and Backend Services

*   **Geocoding Service**: The Google Geocoding API is utilized for converting textual addresses into geographic coordinates (latitude and longitude). Access is managed through a dedicated server-side action to protect API credentials and centralize logic.

---

## 3.0 System Requirements

This section specifies the necessary prerequisites for the operation and development of the City Health Insights system.

### 3.1 End-User (Client) Prerequisites

To access and interact with the deployed web application, an end-user must possess the following:

*   **Web Browser**: A modern, standards-compliant web browser (e.g., Google Chrome, Mozilla Firefox, Apple Safari, Microsoft Edge) with support for JavaScript (ES6+) and CSS3.
*   **Network Connectivity**: An active and stable internet connection is mandatory for accessing the hosted application and its integrated cloud services, including Google Maps, Google Geocoding, and Google AI.

### 3.2 Development and Compilation Environment

To compile, run, and further develop the system locally, the following technical environment is required:

*   **Execution Environment**: Node.js runtime environment with the corresponding Node Package Manager (npm).
*   **API Credentials**:
    *   **Google Cloud Platform API Key**: A valid API key must be provisioned from the Google Cloud Console. This key must have both the **Maps JavaScript API** and the **Geocoding API** services enabled.
    *   **Google AI API Key**: A valid Gemini API key is required to enable the generative AI functionalities.
*   **Environment Configuration**: An environment file (`.env`) must be configured at the root of the project directory. This file must contain the aforementioned API keys in the specified format:
    ```
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
    GEMINI_API_KEY=your_gemini_api_key
    ```
*   **Dependency Installation**: All requisite software libraries and packages, as defined in the `package.json` file, must be installed by executing the `npm install` command from the project's root directory.
*   **Local Server Initiation**: The local development server is initiated by executing the `npm run dev` command.
