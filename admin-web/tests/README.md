# Functional Tests for Admin-Web

## Setup

1. Install dependencies:

```bash
npm install
npx playwright install
```

2. Set environment variables (optional):

```bash
export NEXT_PUBLIC_CLIENT_URL=http://localhost:3001
export NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Running Tests

### Run all tests:

```bash
npm run test:e2e
```

### Run tests in UI mode:

```bash
npm run test:e2e:ui
```

### Run tests in headed mode (see browser):

```bash
npm run test:e2e:headed
```

### Run specific test file:

```bash
npx playwright test auth.spec.ts
```

## Test Coverage

- Login flow (success, validation, errors, role restrictions)
- Logout flow
- Token validation
- Role-based access control (admin/staff only)
- AuthGate component functionality
- API integration
- UI element validation

## Notes

- Tests require the backend API to be running
- Tests require the frontend to be running (or use webServer config)
- Tests use real browser automation (Chromium, Firefox, WebKit)
