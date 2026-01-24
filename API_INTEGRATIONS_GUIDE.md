# API Integrations Setup Guide

## Overview
Each pharmacy can configure their own API keys for third-party integrations. These keys are stored securely in the database and used by the system to communicate with external services.

## Available Integrations

### 1. Mobile Money API
**Purpose:** Process mobile money payments (MTN, Airtel, etc.)
**Endpoint:** `/api/integrations/mobile-money`
**Required API Key Name:** `Mobile Money API`

**Setup Steps:**
1. Go to Settings → Integrations tab
2. Click "Add New API Key"
3. Enter:
   - Name: `Mobile Money API`
   - API Key: Your provider's API key
   - Description: e.g., "MTN Mobile Money Production"
4. Click "Add API Key"

**Usage:**
```javascript
POST /api/integrations/mobile-money
{
  "amount": 5000,
  "phone": "+250788123456",
  "provider": "MTN"
}
```

### 2. RRA EBM API
**Purpose:** Submit invoices to Rwanda Revenue Authority Electronic Billing Machine
**Endpoint:** `/api/integrations/rra-ebm`
**Required API Key Name:** `RRA EBM API`

**Setup Steps:**
1. Go to Settings → Integrations tab
2. Click "Add New API Key"
3. Enter:
   - Name: `RRA EBM API`
   - API Key: Your RRA EBM credentials
   - Description: e.g., "RRA Production Environment"
4. Click "Add API Key"

**Usage:**
```javascript
POST /api/integrations/rra-ebm
{
  "invoice": "INV-001",
  "items": [{ "name": "Product", "price": 1000 }],
  "customer": { "name": "John Doe" }
}
```

### 3. Insurance Provider API (Coming Soon)
**Purpose:** Submit insurance claims automatically
**Required API Key Name:** `Insurance Provider API`

### 4. Supplier Integration API (Coming Soon)
**Purpose:** Auto-sync inventory with suppliers
**Required API Key Name:** `Supplier Integration API`

### 5. SMS Notification API (Coming Soon)
**Purpose:** Send customer alerts via SMS
**Required API Key Name:** `SMS Notification API`

## How It Works

1. **Pharmacy Owner adds API key** via Settings → Integrations
2. **System stores key** in `api_keys` table with pharmacy_id
3. **When integration is called**, system:
   - Authenticates the user
   - Fetches the pharmacy's API key from database
   - Uses the key to call external service
   - Returns response to pharmacy

## Security

- API keys are stored per pharmacy (isolated)
- Only pharmacy users can view/edit their own keys
- Keys are protected by Row Level Security (RLS)
- Each pharmacy controls their own integrations

## Database Schema

```sql
api_keys (
  id UUID PRIMARY KEY,
  pharmacy_id UUID REFERENCES pharmacies(id),
  name TEXT NOT NULL,
  key TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'Active',
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
```

## Next Steps

To enable real integrations:
1. Obtain API credentials from service providers
2. Update TODO sections in integration endpoints
3. Replace mock responses with actual API calls
4. Add error handling and retry logic
5. Implement webhooks for async responses
