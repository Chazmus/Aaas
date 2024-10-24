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

#### Clone the Repository

```sh
git clone https://github.com/your-repo/AaaS.git
```

#### Deploy Google App Scripts using clasp:

The Google App scripts located in the aaas-app folder are deployed using the `clasp` CLI tool.
• Follow the Google Apps Script documentation to set up and authenticate clasp.
• Deploy the scripts by running:

```
clasp push
```

#### Configure Google Sheets:

* Create a new Google Sheets document.
* Ensure that the google sheets document ID is listed correctly in the `config.js` file.
* Configure user roles and permissions as needed.

#### Running the Demo App

1 Ensure Node.js is installed on your machine.
2 Navigate to the test-app directory:

    cd test-app

3 Install dependencies:

    npm install

4 Run the demo app:

    node app.js

-----
Feel free to reach out if you have any questions or need further assistance with deploying and using AaaS!
