## 🚀 Getting Started

### Prerequisites

- **Node.js** (LTS version recommended)
- **npm** or **yarn** (npm recommended)

### Installation

1. **Clone the repository:**

```bash
git clone <repository-url>
cd Playwright-API-Repo
```

2. **Install dependencies:**

```bash
npm install
```

3. **Install Playwright browsers:**

```bash
npx playwright install
```

---

## 🧪 Running Tests

### Run All API Tests

```bash
npm run test:API
```

### Run Specific Test File

```bash
npx playwright test tests/api.test.spec.ts
```

### Run Tests in UI Mode (Interactive)

```bash
npx playwright test --ui
```

### Run Tests with Specific Tag

```bash
npx playwright test --grep @API
```

### Generate and View Test Report

```bash
npm run report-pulse
open pulse-report/playwright-pulse-static-report.html
```

---

## 🎯 Understanding Fixtures

This project uses **Playwright's powerful fixture system** for dependency injection and test setup.

### 📚 **[Read the Complete Fixtures Guide →](./fixtures.md)**

Our custom fixtures provide:

### 1. **`apiHelper` Fixture**

For unauthenticated/public API endpoints:

```typescript
test("Get all carts", async ({ apiHelper }) => {
  const response = await apiHelper.getRequest("https://dummyjson.com/carts");
  expect(response).toHaveProperty("carts");
});
```

### 2. **`authenticatedApiHelper` Fixture**

For authenticated endpoints (auto-login included):

```typescript
test("Get current user", async ({ authenticatedApiHelper }) => {
  const response = await authenticatedApiHelper.helper.getRequest(
    "https://dummyjson.com/auth/me",
    { Authorization: `Bearer ${authenticatedApiHelper.accessToken}` }
  );
  expect(response.username).toEqual("emilys");
});
```

**Learn More:** Check out [fixtures.md](./fixtures.md) for detailed usage, examples, and best practices!

---

## 🔧 API Helper

The `ApiHelper` class provides a unified interface for making HTTP requests.

### Available Methods

```typescript
const apiHelper = new ApiHelper();

// GET request
await apiHelper.getRequest(url, headers, queryParams);

// POST request
await apiHelper.postRequest(url, headers, body, queryParams);

// PUT request
await apiHelper.putRequest(url, headers, body, queryParams);

// PATCH request
await apiHelper.patchRequest(url, headers, body, queryParams);

// DELETE request
await apiHelper.deleteRequest(url, headers, body, queryParams);
```

### Example with Query Parameters

```typescript
await apiHelper.getRequest(
  "https://api.example.com/users",
  { "Content-Type": "application/json" },
  { page: 1, limit: 10 } // Query params
);
// Result: https://api.example.com/users?page=1&limit=10
```

---

## 🛡️ Schema Validation

This project uses **Zod** for runtime schema validation to ensure API responses match expected structures.

### Example Schema

```typescript
export const LOGIN_API_SCHEMA = z
  .object({
    accessToken: z.string(),
    refreshToken: z.string(),
    id: z.number(),
    username: z.string(),
    email: z.string().email(),
    firstName: z.string(),
    lastName: z.string(),
    gender: z.enum(["male", "female"]),
    image: z.string().url(),
  })
  .strict();
```

### Using Schema Validation in Tests

```typescript
import { LOGIN_API_SCHEMA } from "../schemas/schema";

test("Validate login response", async ({ apiHelper }) => {
  const response = await apiHelper.postRequest(
    "https://dummyjson.com/auth/login",
    { "Content-Type": "application/json" },
    { username: "emilys", password: "emilyspass" }
  );

  // Validate response structure
  expect(LOGIN_API_SCHEMA.parse(response)).toBeTruthy();
});
```

---

## 📝 Test Examples

### Example 1: Login Authentication

```typescript
test("Login user and get tokens", async ({ apiHelper }) => {
  const response = await apiHelper.postRequest(
    "https://dummyjson.com/auth/login",
    { "Content-Type": "application/json" },
    { username: "emilys", password: "emilyspass" }
  );

  expect(response).toHaveProperty("accessToken");
  expect(LOGIN_API_SCHEMA.parse(response)).toBeTruthy();
});
```

### Example 2: Authenticated Request

```typescript
test("Get current auth user", async ({ authenticatedApiHelper }) => {
  const response = await authenticatedApiHelper.helper.getRequest(
    "https://dummyjson.com/auth/me",
    { Authorization: `Bearer ${authenticatedApiHelper.accessToken}` }
  );

  expect(response.username).toEqual("emilys");
});
```

### Example 3: Token Refresh

```typescript
test("Refresh auth session", async ({ authenticatedApiHelper }) => {
  const response = await authenticatedApiHelper.helper.postRequest(
    "https://dummyjson.com/auth/refresh",
    { "Content-Type": "application/json" },
    { refreshToken: authenticatedApiHelper.refreshToken }
  );

  expect(response).toHaveProperty("refreshToken");
  expect(response).toHaveProperty("accessToken");
});
```

### Example 4: Public Endpoint

```typescript
test("Get all carts", async ({ apiHelper }) => {
  const response = await apiHelper.getRequest("https://dummyjson.com/carts");

  expect(response).toHaveProperty("carts");
  expect(response.carts).toBeInstanceOf(Array);
});
```

---

## 🔄 CI/CD Integration

This project includes **GitHub Actions** workflows for automated testing.

### API Testing Workflow

Located at: `.github/workflows/playwright-api.yml`

**Triggers:**

- Push to `main` or `master` branch
- Pull requests to `main` or `master` branch

**Features:**

- Runs API tests with `@API` tag
- Uploads HTML and Pulse reports as artifacts
- 10-minute timeout
- Runs on Ubuntu latest

### Running Locally Like CI

```bash
npm ci
npx playwright install --with-deps
npm run test:API
```

---

## 📊 Reporting

This project uses multiple reporters for comprehensive test insights:

### 1. **HTML Report** (Default)

```bash
npm run show-report
```

### 2. **JSON Report**

Generated at: `playwright-report/report.json`

### 3. **Pulse Report**

Custom Playwright reporter for advanced metrics.

Generated at: `pulse-report/`

---

## 🔑 Test Data

Test credentials are stored in `testData/loginUser.json`:

```json
{
  "username": "emilys",
  "password": "emilyspass"
}
```

**Note:** This uses DummyJSON's test API. In production, use environment variables for sensitive data.

---

## 📚 Documentation

- **[Fixtures Guide](./fixtures.md)** - Complete guide to understanding and using Playwright fixtures
- **[Playwright Docs](https://playwright.dev)** - Official Playwright documentation
- **[Zod Docs](https://zod.dev)** - Schema validation library

---

## 🛠️ Configuration

### Playwright Configuration

Key settings in `playwright.config.ts`:

- **Test Directory:** `./tests`
- **Parallel Execution:** Enabled
- **Retries:** 2 on CI, 0 locally
- **Browser:** Chromium (Desktop Chrome)
- **Reporters:** HTML, JSON, Pulse Report

### TypeScript Configuration

Configured for:

- ESNext target
- Node module resolution
- Strict type checking
- JSON module support

---

## 🎓 Best Practices

1. ✅ **Use fixtures** instead of manual setup in each test
2. ✅ **Validate schemas** to catch API contract changes early
3. ✅ **Tag tests** with `@API` or `@UI` for easy filtering
4. ✅ **Isolate tests** - Each test should be independent
5. ✅ **Use descriptive test names** that explain what's being tested
6. ✅ **Avoid shared state** between tests (fixtures handle this)
7. ✅ **Log responses** during development, remove in production

---

## 🤝 Contributing

1. Create a feature branch
2. Write tests following existing patterns
3. Ensure all tests pass: `npm run test:API`
4. Submit a pull request

---

## 📄 License

ISC

---

## 🎉 Quick Start Summary

```bash
# Install
npm install

# Run API tests
npm run test:API

# Generate Report
npm run report-pulse

# View Report
open pulse-report/playwright-pulse-static-report.html

# Learn about fixtures
cat fixtures.md
```

**Happy Testing!** 🧪✨

---

**Need Help?** Check out the [Fixtures Guide](./fixtures.md) for detailed examples and explanations!
