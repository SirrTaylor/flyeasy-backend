// server.js - Backend for Fly Easy Website (Deployed on Render)

// Load environment variables from .env file for local development.
// On Render, these are automatically injected from the dashboard settings.
require('dotenv').config();

const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors'); // Import the CORS middleware

const app = express();
// Render automatically provides a PORT environment variable.
// We use 3000 as a fallback for local development if PORT is not set.
const port = process.env.PORT || 3000;

// Configure CORS to specifically allow your frontend domain.
// This is CRUCIAL for your frontend (e.g., on Vercel/Netlify) to communicate with this backend.
// IMPORTANT: Replace 'https://flyeasywebsite.netlify.app' with your ACTUAL FRONTEND URL.
// Ensure there is NO trailing slash in the origin URL!
const corsOptions = {
    origin: 'https://flyeasywebsite.netlify.app', // Your frontend domain (e.g., Vercel, Netlify URL)
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', // Allowed HTTP methods
    credentials: true, // Allow credentials (like cookies), though not strictly needed here
    optionsSuccessStatus: 204 // For preflight requests (successful OPTIONS request)
};
app.use(cors(corsOptions)); // Apply CORS with specific options

// Middleware to parse JSON request bodies
app.use(express.json());

// --- Nodemailer Transporter Setup ---
// Configure Nodemailer to use your SMTP settings from environment variables.
// This is more explicit and aligns with your .env file settings (e.g., port 587).
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST, // e.g., smtp.gmail.com
    port: parseInt(process.env.SMTP_PORT, 10), // Ensure port is parsed as an integer
    secure: process.env.SMTP_SECURE === 'true', // Convert string "true"/"false" to boolean
    auth: {
        user: process.env.EMAIL_USER, // Your email address (sender)
        pass: process.env.EMAIL_PASS  // Your email password or app password
    }
});

// --- API Endpoint to Handle Flight Inquiries ---
// This is the endpoint your frontend will call (e.g., https://your-render-backend.onrender.com/api/send-flight-inquiry)
app.post('/api/send-flight-inquiry', async (req, res) => {
    // Destructure common fields from the request body
    const { formType, userName, userEmail } = req.body;
    let subject = `New Inquiry from ${userName} (Fly Easy Website)`;
    let htmlContent = '';

    // Basic server-side validation for essential fields
    if (!userName || !userEmail || !formType) {
        return res.status(400).json({ message: 'Missing essential inquiry details (name, email, form type).' });
    }

    // Handle Detailed Inquiry form data
    if (formType === 'Detailed Inquiry') {
        const { inquiryDetails } = req.body;
        if (!inquiryDetails) {
            return res.status(400).json({ message: 'Missing detailed inquiry information.' });
        }
        subject = `New Detailed Inquiry from ${userName} (Fly Easy Website)`;
        htmlContent = `
            <p><strong>New Detailed Inquiry Details:</strong></p>
            <ul>
                <li><strong>Name:</strong> ${userName}</li>
                <li><strong>Email:</strong> ${userEmail}</li>
                <li><strong>Inquiry Type:</strong> Detailed Itinerary Request</li>
                <li><strong>Travel Plans:</strong><br>${inquiryDetails.replace(/\n/g, '<br>')}</li>
            </ul>
            <p>Please respond to the customer at ${userEmail} to craft their tailor-made itinerary.</p>
        `;
    }
    // Handle Simplified Inquiry form data
    else if (formType === 'Simplified Inquiry') {
        const { departurePlace, destinationPlace, travelDate, returnDate } = req.body;
        if (!departurePlace || !destinationPlace || !travelDate) {
            return res.status(400).json({ message: 'Missing simplified inquiry information (departure, destination, travel date).' });
        }
        subject = `New Simplified Inquiry from ${userName} (Fly Easy Website)`;
        htmlContent = `
            <p><strong>New Simplified Inquiry Details:</strong></p>
            <ul>
                <li><strong>Name:</strong> ${userName}</li>
                <li><strong>Email:</strong> ${userEmail}</li>
                <li><strong>Inquiry Type:</strong> Simplified Travel Request</li>
                <li><strong>Departure Place:</strong> ${departurePlace}</li>
                <li><strong>Destination Place:</strong> ${destinationPlace}</li>
                <li><strong>Date of Travel:</strong> ${travelDate}</li>
                <li><strong>Date of Return:</strong> ${returnDate || 'N/A'}</li>
            </ul>
            <p>Please respond to the customer at ${userEmail} with travel options.</p>
        `;
    }
    // Handle invalid form type
    else {
        return res.status(400).json({ message: 'Invalid form type provided.' });
    }

    // Construct the email content for Nodemailer
    const mailOptions = {
        from: process.env.EMAIL_USER, // Sender address from environment variables
        to: process.env.RECIPIENT_EMAIL, // Recipient address from environment variables
        subject: subject,
        html: htmlContent
    };

    try {
        // Send the email using the configured transporter
        await transporter.sendMail(mailOptions);
        console.log('Email sent successfully!');
        // Send a success response back to the frontend
        res.status(200).json({ message: 'Your inquiry has been sent successfully! We will get back to you shortly.' });
    } catch (error) {
        console.error('Error sending email:', error);
        // Send an error response back to the frontend
        res.status(500).json({ message: 'Failed to send inquiry. Please try again later.', error: error.message });
    }
});

// Basic root route for health check or info (optional, but good for testing Render URL)
app.get('/', (req, res) => {
    res.send('Fly Easy Backend API is running!');
});

// Start the server, listening on the port provided by Render (or 3000 locally)
app.listen(port, () => {
    console.log(`Server listening on port ${port}.`);
    // Log the actual process.env.PORT value for debugging on Render logs
    console.log(`process.env.PORT value: ${process.env.PORT}`);
});
