# Car Rental Website

A full-stack car rental website built with Node.js, Express, MongoDB, and vanilla JavaScript.

## Features

- Car listing and search functionality
- Image gallery for car photos
- Admin panel for managing cars
- Contact form with email notifications
- Responsive design
- WhatsApp integration for direct contact

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the server directory with the following variables:
```
MONGODB_URI=your_mongodb_connection_string
SESSION_SECRET=your_secure_session_secret
ADMIN_USERNAME=your_admin_username
ADMIN_PASSWORD=your_admin_password
EMAIL_USER=your_gmail_address
EMAIL_PASS=your_gmail_app_password
```

3. Start the server:
```bash
node server/server.js
```

## Technologies Used

- Backend: Node.js, Express
- Database: MongoDB
- Frontend: HTML, CSS, JavaScript
- Email: Nodemailer
- File Upload: Multer
- Authentication: Express Session

## License

MIT