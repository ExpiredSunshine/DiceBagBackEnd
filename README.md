# DiceBag Backend 🎲

The server-side API for DiceBag, a true random dice rolling application powered by RANDOM.ORG's atmospheric noise API. This backend provides secure authentication, dice rolling services, and user management for tabletop gamers who demand authentic randomness.

## 🌟 Architecture Overview

The DiceBag backend is built with modern web technologies to provide a robust, scalable API that handles user authentication, dice rolling requests, and data persistence while maintaining the security and performance requirements of a gaming application.

## ✨ Features

### Core API Services
- **User Authentication**: JWT-based authentication with secure password hashing
- **Dice Rolling Engine**: Integration with RANDOM.ORG's atmospheric noise API
- **User Management**: Profile creation, updates, and account management
- **Roll History**: Persistent storage of user dice roll history
- **Rate Limiting**: API rate limiting to prevent abuse and ensure fair usage

### Security Features
- **JWT Tokens**: Secure stateless authentication
- **Password Hashing**: bcrypt-based password security
- **Input Validation**: Comprehensive request validation and sanitization
- **CORS Configuration**: Proper cross-origin resource sharing setup
- **Environment Variables**: Secure configuration management

### Data Management
- **User Profiles**: Store and manage user information
- **Roll History**: Track and retrieve user dice roll history
- **Trial Management**: Handle free trial limitations and upgrades
- **Statistics**: User roll statistics and analytics

## 🛠️ Technology Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcrypt
- **Validation**: Joi or express-validator
- **Environment**: dotenv for configuration
- **CORS**: Express CORS middleware
- **Testing**: Jest and Supertest

## 📋 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Dice Rolling
- `POST /api/dice/roll` - Roll dice with specified parameters
- `POST /api/dice/batch` - Roll multiple dice types in one request
- `GET /api/dice/history` - Get user's roll history
- `GET /api/dice/stats` - Get user's rolling statistics

### User Management
- `GET /api/users/profile` - Get current user profile
- `PUT /api/users/profile` - Update user profile
- `DELETE /api/users/account` - Delete user account

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- RANDOM.ORG API key

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd DiceBagBackEnd
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   ```
   
   Configure the following environment variables:
   ```
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/dicebag
   JWT_SECRET=your-super-secret-jwt-key
   RANDOM_ORG_API_KEY=your-random-org-api-key
   CORS_ORIGIN=http://localhost:3000
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

### Production Deployment

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Start production server**
   ```bash
   npm start
   ```

## 🧪 Testing

Run the test suite:
```bash
npm test
```

Run tests with coverage:
```bash
npm run test:coverage
```

## 📊 Database Schema

### User Model
```javascript
{
  username: String (required, unique),
  email: String (required, unique),
  password: String (required, hashed),
  avatar: String (optional),
  trialRollsRemaining: Number (default: 10),
  isPremium: Boolean (default: false),
  createdAt: Date,
  updatedAt: Date
}
```

### Roll History Model
```javascript
{
  userId: ObjectId (ref: User),
  diceType: String (e.g., "d20", "d6"),
  quantity: Number,
  results: [Number],
  total: Number,
  timestamp: Date,
  isTrialRoll: Boolean
}
```

## 🔧 Configuration

### Environment Variables
- `NODE_ENV`: Application environment (development/production)
- `PORT`: Server port number
- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: Secret key for JWT token signing
- `RANDOM_ORG_API_KEY`: API key for RANDOM.ORG service
- `CORS_ORIGIN`: Allowed origin for CORS
- `JWT_EXPIRES_IN`: JWT token expiration time

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions, please open an issue in the GitHub repository or contact the development team.

---

**Built with ❤️ for the tabletop gaming community** 