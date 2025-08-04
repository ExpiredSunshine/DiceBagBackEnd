# Dual Pool System Testing Guide

## 🎯 Testing Overview

This guide covers comprehensive testing of the dual pool system:
- **Public Pool**: Anonymous users, 50 rolls/day limit per IP
- **User Pool**: Authenticated users, unlimited rolls

## 🚀 Quick Start Testing

### 1. Start the Server
```bash
npm start
```

### 2. Run Automated Tests
```bash
node test-pools.js
```

## 📋 Manual Testing Steps

### **Phase 1: Anonymous User Testing**

#### 1.1 Basic Anonymous Rolls
```bash
# Single d6 roll
curl -X POST http://localhost:3000/api/dice/roll \
  -H "Content-Type: application/json" \
  -d '{"diceQuantities": {"d6": 1}}'

# Multiple dice roll
curl -X POST http://localhost:3000/api/dice/roll \
  -H "Content-Type: application/json" \
  -d '{"diceQuantities": {"d6": 3, "d20": 2, "d4": 1}}'

# All die types
curl -X POST http://localhost:3000/api/dice/roll \
  -H "Content-Type: application/json" \
  -d '{"diceQuantities": {"d4": 2, "d6": 2, "d8": 2, "d10": 2, "d12": 2, "d20": 2, "d100": 2}}'
```

#### 1.2 Check Public Pool Status
```bash
curl -X GET http://localhost:3000/api/dice/pools/public
```

**Expected Response:**
```json
{
  "poolStatus": {
    "d4": {"remaining": 498, "lastRefill": "2024-01-15T10:30:00.000Z"},
    "d6": {"remaining": 497, "lastRefill": "2024-01-15T10:30:00.000Z"},
    // ... other die types
  },
  "usageStats": {
    "todayUsage": 3,
    "dailyLimit": 50,
    "remainingRolls": 47,
    "limitExceeded": false,
    "ipAddress": "::1"
  }
}
```

#### 1.3 Test Daily Limit (50 rolls)
```bash
# Run this script to test the 50 roll limit
for i in {1..55}; do
  echo "Roll $i:"
  curl -X POST http://localhost:3000/api/dice/roll \
    -H "Content-Type: application/json" \
    -d '{"diceQuantities": {"d6": 1}}' | jq '.grandTotal'
  sleep 0.1
done
```

**Expected Behavior:**
- Rolls 1-50: Success
- Roll 51+: Error with "Daily roll limit exceeded"

### **Phase 2: Authenticated User Testing**

#### 2.1 Register a Test User
```bash
curl -X POST http://localhost:3000/api/register \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "testpassword123"}'
```

#### 2.2 Login and Get Token
```bash
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "testpassword123"}'
```

**Save the token from the response for subsequent requests.**

#### 2.3 Test Authenticated Rolls (Unlimited)
```bash
# Replace YOUR_TOKEN with the actual token
TOKEN="YOUR_TOKEN"

# Single roll
curl -X POST http://localhost:3000/api/dice/roll \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"diceQuantities": {"d20": 1}}'

# Large roll (should work without limits)
curl -X POST http://localhost:3000/api/dice/roll \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"diceQuantities": {"d6": 50, "d20": 25}}'
```

#### 2.4 Check User Pool Status
```bash
curl -X GET http://localhost:3000/api/dice/pools/user \
  -H "Authorization: Bearer $TOKEN"
```

### **Phase 3: Advanced Testing**

#### 3.1 Test Pool Refill
```bash
# Make many rolls to trigger refill
for i in {1..100}; do
  curl -X POST http://localhost:3000/api/dice/roll \
    -H "Content-Type: application/json" \
    -d '{"diceQuantities": {"d6": 1}}' > /dev/null
  echo "Roll $i completed"
done

# Check pool status after refill
curl -X GET http://localhost:3000/api/dice/pools/public | jq '.poolStatus.d6'
```

#### 3.2 Test Concurrent Requests
```bash
# Test 10 concurrent rolls
for i in {1..10}; do
  curl -X POST http://localhost:3000/api/dice/roll \
    -H "Content-Type: application/json" \
    -d '{"diceQuantities": {"d6": 1}}' &
done
wait
```

#### 3.3 Check Usage Statistics
```bash
# Service stats
curl -X GET http://localhost:3000/api/dice/stats

# Monitor data
curl -X GET http://localhost:3000/api/dice/monitor
```

#### 3.4 Test IP-based Tracking
```bash
# Test from different IPs (if possible)
# Or test with different user agents
curl -X POST http://localhost:3000/api/dice/roll \
  -H "Content-Type: application/json" \
  -H "User-Agent: TestClient1" \
  -d '{"diceQuantities": {"d6": 1}}'

curl -X POST http://localhost:3000/api/dice/roll \
  -H "Content-Type: application/json" \
  -H "User-Agent: TestClient2" \
  -d '{"diceQuantities": {"d6": 1}}'
```

## 🔍 What to Look For

### **Success Indicators:**
- ✅ Anonymous rolls work up to 50 per day
- ✅ Authenticated rolls have no daily limit
- ✅ Pool status shows correct remaining numbers
- ✅ Usage stats show correct counts
- ✅ Pool refill happens automatically
- ✅ Different IPs have separate limits

### **Error Indicators:**
- ❌ Anonymous users exceed 50 rolls/day
- ❌ Authenticated users hit daily limits
- ❌ Pool status shows incorrect numbers
- ❌ Usage stats don't update
- ❌ Pool refill doesn't work
- ❌ All IPs share the same limit

## 🛠️ Troubleshooting

### **Common Issues:**

1. **"Daily roll limit exceeded" for authenticated users**
   - Check if token is valid
   - Verify user is properly authenticated

2. **Pool not refilling**
   - Check Random.org API key
   - Check server logs for refill errors

3. **Usage stats not updating**
   - Check database connection
   - Verify cleanup service is running

4. **Performance issues**
   - Check monitor endpoint for usage statistics
   - Verify cleanup service is working

### **Debug Commands:**
```bash
# Check server health
curl -X GET http://localhost:3000/api/health

# Check database connection
curl -X GET http://localhost:3000/api/dice/health

# View server logs
tail -f logs/app.log
```

## 📊 Performance Testing

### **Load Testing:**
```bash
# Install Apache Bench (ab)
# Test 1000 requests with 10 concurrent users
ab -n 1000 -c 10 -H "Content-Type: application/json" \
  -p test-data.json http://localhost:3000/api/dice/roll
```

### **Test Data File (test-data.json):**
```json
{"diceQuantities": {"d6": 1}}
```

## 🎯 Test Scenarios Summary

| Scenario | Expected Result |
|----------|----------------|
| Anonymous single roll | ✅ Success |
| Anonymous 50 rolls | ✅ Success |
| Anonymous 51st roll | ❌ Limit exceeded |
| Authenticated unlimited rolls | ✅ Success |
| Pool refill trigger | ✅ Automatic refill |
| Concurrent requests | ✅ All succeed |
| IP-based tracking | ✅ Separate limits |
| Pool status accuracy | ✅ Correct numbers |
| Usage statistics | ✅ Accurate counts |

## 🚨 Edge Cases to Test

1. **Server restart**: Pools should persist
2. **Database disconnection**: Graceful error handling
3. **Invalid dice quantities**: Proper validation
4. **Rate limiting**: Respects configured limits
5. **Cleanup service**: Removes old records
6. **Memory usage**: No memory leaks
7. **Concurrent refills**: No race conditions

## 📝 Test Results Template

```
Test Date: _____________
Server Version: _____________
Database: _____________

✅ Anonymous Rolls: ___/___ passed
✅ Authenticated Rolls: ___/___ passed
✅ Daily Limits: ___/___ passed
✅ Pool Refill: ___/___ passed
✅ Concurrent Requests: ___/___ passed
✅ IP Tracking: ___/___ passed
✅ Pool Status: ___/___ passed
✅ Usage Stats: ___/___ passed

Issues Found: _____________
Performance Notes: _____________
``` 