# DiceBag Backend API 🎲

A high-performance, secure REST API for true random dice rolling powered by RANDOM.ORG's atmospheric noise API. Built for tabletop gamers who demand authentic randomness with enterprise-grade reliability and security.

## ✨ Features

### 🎯 Core Functionality

- **True Random Dice Rolling**: Powered by RANDOM.ORG's atmospheric noise API
- **Dual Pool System**: Separate pools for anonymous and authenticated users
- **Multiple Die Types**: Support for d4, d6, d8, d10, d12, d20, and d100
- **User Authentication**: JWT-based authentication with secure password hashing
- **Roll History**: Persistent roll history for authenticated users
- **Rate Limiting**: Configurable rate limits to prevent abuse

### 🔒 Security Features

- **Helmet.js**: Comprehensive security headers
- **CORS Protection**: Configurable cross-origin resource sharing
- **Input Validation**: Robust validation for all endpoints
- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt-based password security

### 🚀 Performance & Reliability

- **Pool Management**: Efficient random number caching system
- **Automatic Refill**: Seamless pool replenishment from RANDOM.ORG
- **Graceful Shutdown**: Proper cleanup on server termination
- **Error Handling**: Comprehensive error management
- **Monitoring**: Built-in performance monitoring and statistics
- **Cleanup Service**: Automatic cleanup of old usage records

### Key Components

- **Pool Manager**: Manages dual pool system (public/user)
- **Random.org Service**: Handles API communication with RANDOM.ORG
- **Usage Tracker**: Tracks and enforces usage limits
- **Pool Persistence**: Database operations for pool management
- **Cleanup Service**: Periodic cleanup of old records

- [DiceBag Frontend](https://github.com/your-org/dicebag-frontend) - React-based frontend application
- [RANDOM.ORG API](https://api.random.org/) - True random number generation service
