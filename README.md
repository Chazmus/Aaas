# Authentication as a Service (AaaS)

## Description

Welcome to AaaS - an authentication platform designed to be easily deployed and hosted, making it accessible to any web
application. Our service leverages Google
AppScripts to host the platform securely with a Google Sheets backend for managing user roles and configurations.

## Features

- **Easy Deployment**: Deploy our service in minutes using Google Apps Script.
- **Role Management**: Configure user roles and permissions through Google Sheets.
- **Secure Authentication**: Utilizes modern security practices to protect your resources.
- **Demo App**: Included is a simple demo application (`test-app`) built with npm, which demonstrates the functionality
  of AaaS.

## Installation & Running Instructions

### Prerequisites

Before you begin, ensure you have the following installed:

- Node.js (for running the demo app)
- Google Apps Script account and `clasp` CLI tool for deploying the App Scripts.

### Deploying the Platform

1. **Clone the Repository**:
   ```sh
   git clone https://github.com/your-repo/AaaS.git
   cd AaaS

2 Install Dependencies (for demo app only):

    npm install

3 Deploy Google App Scripts using clasp:
• Follow the Google Apps Script documentation to set up and authenticate clasp.
• Deploy the scripts by running:

       clasp push

4 Configure Google Sheets:
• Open your Google Sheets document linked with AaaS.
• Configure user roles and permissions as needed.

                                                                           Running the Demo App

1 Ensure Node.js is installed on your machine.
2 Navigate to the test-app directory:

    cd test-app

3 Install dependencies:

    npm install

4 Run the demo app:
    node index.js

-----
Feel free to reach out if you have any questions or need further assistance with deploying and using AaaS!
