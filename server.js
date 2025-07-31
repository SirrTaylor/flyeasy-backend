// Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors'); // Import cors

const app = express();
const port = process.env.PORT || 3000; // Use port 3000 or specified by environment

// Configure CORS to specifically allow your Netlify frontend domain
// IMPORTANT: Replace 'https://flyeasywebsite.netlify.app' with YOUR ACTUAL NETLIFY URL
// Ensure there is NO trailing slash here in the origin URL!
const corsOptions = {
    origin: 'https://flyeasywebsite.netlify.app', // <-- REMOVED TRAILING SLASH HERE
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true, // Allow cookies to be sent
    optionsSuccessStatus: 204 // For preflight requests
};
app.use(cors(corsOptions)); // Apply CORS with specific options

app.use(express.json()); // To parse JSON request bodies

// Create a Nodemailer transporter using your email service details
const transporter = nodemailer.createTransport({
    service: 'gmail', // Or 'smtp', host, port, secure for other services
    auth: {
        user: process.env.EMAIL_USER, // Your email address from .env
        pass: process.env.EMAIL_PASS  // Your email password/app password from .env
    }
});

// API endpoint to handle flight inquiries
app.post('/api/send-flight-inquiry', async (req, res) => {
    const { formType, userName, userEmail } = req.body;
    let subject = `New Inquiry from ${userName} (Fly Easy Website)`;
    let htmlContent = '';

    // Basic server-side validation for common fields
    if (!userName || !userEmail || !formType) {
        return res.status(400).json({ message: 'Missing essential inquiry details (name, email, form type).' });
    }

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
    } else if (formType === 'Simplified Inquiry') {
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
    } else {
        return res.status(400).json({ message: 'Invalid form type provided.' });
    }

    // Construct the email content
    const mailOptions = {
        from: process.env.EMAIL_USER, // Sender address
        to: process.env.RECIPIENT_EMAIL, // Recipient address (btgobvu@gmail.com or whatever is in .env)
        subject: subject,
        html: htmlContent
    };

    try {
        // Send the email
        await transporter.sendMail(mailOptions);
        console.log('Email sent successfully!');
        res.status(200).json({ message: 'Your inquiry has been sent successfully! We will get back to you shortly.' });
    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).json({ message: 'Failed to send inquiry. Please try again later.', error: error.message });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
