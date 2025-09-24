# **App Name**: Barangay Health Insights

## Core Features:

- Data Upload & Processing: Allow upload of Barangay health records (formats: CSV, XLSX) and process to make it ready for analysis.
- Automated Data Cleansing: Identify and flag common errors in uploaded data such as missing values, outliers, and format inconsistencies. Provides tools to correct inconsistencies and missing data. Does not automatically change data.
- Cluster Analysis Tool: Analyzes processed data to identify clusters based on key health indicators (e.g., disease prevalence, vaccination rates). Includes a tool to select health indicators for clustering, and determine the number of clusters using metrics like the elbow method.
- Interactive Visualization: Visualize clusters on a map of the Barangay. Includes different chart options to display the cluster-specific aggregate metrics for each selected health indicator.
- Trend Identification: Analyze cluster data over time (using available historical data) to identify trends and anomalies for each cluster.
- Custom Report Generation: Generate detailed reports for selected clusters including the demographics of each cluster and the statistical analysis for each health indicator

## Style Guidelines:

- Primary color: Soft blue (#A0D2EB) for a sense of trust and health.
- Background color: Light gray (#F0F4F8) for clean and neutral interface.
- Accent color: Teal (#008080) for interactive elements and important information.
- Body and headline font: 'PT Sans' (sans-serif) for clear readability and a modern, but approachable style.
- Use clean, easily recognizable icons from a library like FontAwesome to represent different health indicators and functionalities.
- Implement a clear, logical layout with data visualizations as the focal point. Prioritize responsive design for accessibility across devices.
- Use subtle animations to provide feedback on user actions (e.g., loading data, generating reports) to improve user engagement and understanding.