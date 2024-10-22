const express = require('express');
const path = require('path');
const jwt = require('jsonwebtoken'); // For JWT validation (if using JWT)
const app = express();
const PORT = process.env.PORT || 3000;

// Dummy secret key for JWT signing/verification
const SECRET_KEY = 'your_secret_key';

// Middleware to check for a Bearer token in the Authorization header
function checkToken(req, res, next) {
    const authHeader = req.headers['authorization'];

    if (authHeader) {
        const token = authHeader.split(' ')[1]; // Bearer <token>
        
        if (!token) {
            return res.status(403).send('Access Denied: No Token Provided');
        }

        // If you are using JWT, verify the token
        jwt.verify(token, SECRET_KEY, (err, user) => {
            if (err) {
                return res.status(403).send('Access Denied: Invalid Token');
            }

            // If token is valid, store the user information in request
            req.user = user;
            next(); // Proceed to the admin route
        });
    } else {
        return res.status(403).send('Access Denied: No Token Provided');
    }
}

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Route for the home page (serves index.html)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Admin route - protected by the checkToken middleware
app.get('/admin', checkToken, (req, res) => {
    const adminContent = `
        <h1>Admin Page</h1>
        <p>This is the admin area. Only authorized users can see this.</p>
    `;
    res.send(adminContent); // Return the content for authorized users
});

// Catch-all route for 404 errors
app.use((req, res) => {
    res.status(404).send('404 - Page Not Found');
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

