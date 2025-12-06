# Playwright Fixtures Guide 🎭

A complete beginner-friendly guide to understanding and using Playwright fixtures in API testing.

---

## 📚 Table of Contents

1. [What are Fixtures?](#what-are-fixtures)
2. [Why Use Fixtures?](#why-use-fixtures)
3. [Understanding Our Fixtures](#understanding-our-fixtures)
4. [How to Use Fixtures](#how-to-use-fixtures)
5. [Real Examples](#real-examples)
6. [Best Practices](#best-practices)

---

## 🤔 What are Fixtures?

**Fixtures** are like "helpers" or "setup tools" that Playwright automatically provides to your tests. Think of them as pre-configured objects that are ready to use in your tests without manual setup.

### Simple Analogy:

Imagine you're cooking:

- **Without Fixtures**: Every time you cook, you need to get ingredients, prepare tools, heat the pan, etc.
- **With Fixtures**: Everything is already prepared and handed to you - you just start cooking!

---

## 💡 Why Use Fixtures?

### ❌ **Old Way (Without Fixtures)**

```typescript
test("Get user data", async () => {
  // You need to create ApiHelper every time
  const apiHelper = new ApiHelper();

  // You need to login manually
  const loginResponse = await apiHelper.postRequest(/*...*/);
  const token = loginResponse.accessToken;

  // Now finally you can test
  const response = await apiHelper.getRequest("https://api.example.com/user", {
    Authorization: `Bearer ${token}`,
  });
});
```

### ✅ **New Way (With Fixtures)**

```typescript
test("Get user data", async ({ authenticatedApiHelper }) => {
  // Everything is ready! Just use it
  const response = await authenticatedApiHelper.helper.getRequest(
    "https://api.example.com/user",
    { Authorization: `Bearer ${authenticatedApiHelper.accessToken}` }
  );
});
```

### Benefits:

- ✅ **Less Code**: No repetitive setup in every test
- ✅ **Cleaner Tests**: Focus on testing, not setup
- ✅ **Automatic Cleanup**: Fixtures handle initialization and cleanup
- ✅ **Test Isolation**: Each test gets fresh instances
- ✅ **Reusability**: Write setup once, use everywhere

---

## 🛠️ Understanding Our Fixtures

We have created **2 custom fixtures** in this project:

### 📁 Location: `fixtures/api-fixture.ts`

---

### 1️⃣ **`apiHelper` Fixture**

**Purpose**: Provides a fresh `ApiHelper` instance for making API requests.

**When to Use**:

- Testing **public/unauthenticated** endpoints
- Endpoints that don't require login
- Testing login functionality itself

**What it Provides**:

```typescript
apiHelper: ApiHelper; // Instance to make API calls
```

**Structure in Code**:

```typescript
export const test = base.extend<ApiFixtures>({
  apiHelper: async ({}, use) => {
    const apiHelper = new ApiHelper(); // Create instance
    await use(apiHelper); // Give it to test
    // Automatic cleanup happens here
  },
});
```

---

### 2️⃣ **`authenticatedApiHelper` Fixture**

**Purpose**: Automatically handles login and provides both `ApiHelper` instance and authentication tokens.

**When to Use**:

- Testing endpoints that **require authentication**
- When you need access tokens
- Avoid manual login in every test

**What it Provides**:

```typescript
authenticatedApiHelper: {
  helper: ApiHelper,       // Instance to make API calls
  accessToken: string,     // JWT access token
  refreshToken: string     // JWT refresh token
}
```

**Structure in Code**:

```typescript
authenticatedApiHelper: async ({}, use) => {
  const apiHelper = new ApiHelper();

  // Automatically login before test starts
  const response = await apiHelper.postRequest(
    "https://dummyjson.com/auth/login",
    { "Content-Type": "application/json" },
    loginData
  );

  // Provide helper + tokens to the test
  await use({
    helper: apiHelper,
    accessToken: response.accessToken,
    refreshToken: response.refreshToken,
  });

  // Automatic cleanup happens here
},
```

---

## 📖 How to Use Fixtures

### Step 1: Import from Fixture File

Instead of importing from `@playwright/test`, import from your fixture file:

```typescript
// ❌ Old way
import { test, expect } from "@playwright/test";

// ✅ New way
import { test, expect } from "../fixtures/api-fixture";
```

### Step 2: Use Fixtures in Test Function

Add the fixture as a **parameter** in your test function:

```typescript
test("Test name", async ({ fixtureName }) => {
  // Use fixtureName here
});
```

### Step 3: Access Fixture Properties

Different fixtures have different properties:

#### Using `apiHelper`:

```typescript
test("Example", async ({ apiHelper }) => {
  // apiHelper is ready to use
  const response = await apiHelper.getRequest("https://api.example.com/data");
});
```

#### Using `authenticatedApiHelper`:

```typescript
test("Example", async ({ authenticatedApiHelper }) => {
  // Access the helper
  authenticatedApiHelper.helper;

  // Access tokens
  authenticatedApiHelper.accessToken;
  authenticatedApiHelper.refreshToken;
});
```

---

## 🎯 Real Examples

### Example 1: Testing Login (Using `apiHelper`)

```typescript
test("Login user and get tokens", async ({ apiHelper }) => {
  const response = await apiHelper.postRequest(
    "https://dummyjson.com/auth/login",
    { "Content-Type": "application/json" },
    { username: "emilys", password: "emilyspass" }
  );

  expect(response).toHaveProperty("accessToken");
  expect(response.accessToken).not.toBeNull();
});
```

**Why `apiHelper`?** → Because we're testing the login itself, we don't need to be authenticated yet.

---

### Example 2: Getting Authenticated User Data (Using `authenticatedApiHelper`)

```typescript
test("Get current auth user", async ({ authenticatedApiHelper }) => {
  const response = await authenticatedApiHelper.helper.getRequest(
    "https://dummyjson.com/auth/me",
    { Authorization: `Bearer ${authenticatedApiHelper.accessToken}` }
  );

  expect(response.username).toEqual("emilys");
});
```

**Why `authenticatedApiHelper`?** → This endpoint requires authentication. The fixture automatically logs in and provides the token.

---

### Example 3: Refreshing Auth Token (Using `authenticatedApiHelper`)

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

---

### Example 4: Public Endpoint (Using `apiHelper`)

```typescript
test("Get all carts", async ({ apiHelper }) => {
  const response = await apiHelper.getRequest("https://dummyjson.com/carts");

  expect(response).toHaveProperty("carts");
  expect(response.carts).toBeInstanceOf(Array);
});
```

**Why `apiHelper`?** → Public endpoint, no authentication needed.

---

## 🎓 Best Practices

### 1. **Choose the Right Fixture**

| Scenario                        | Use This Fixture         |
| ------------------------------- | ------------------------ |
| Public/unauthenticated endpoint | `apiHelper`              |
| Authenticated endpoint          | `authenticatedApiHelper` |
| Testing login functionality     | `apiHelper`              |
| Need access tokens              | `authenticatedApiHelper` |

---

### 2. **No Shared State Between Tests**

#### ❌ **Bad (Old Way)**

```typescript
let accessToken: string; // Shared state - BAD!

test("Login", async () => {
  accessToken = await login();
});

test("Get user", async () => {
  await getUser(accessToken); // Depends on previous test
});
```

#### ✅ **Good (With Fixtures)**

```typescript
test("Get user", async ({ authenticatedApiHelper }) => {
  // Each test is independent!
  await authenticatedApiHelper.helper.getRequest(/*...*/);
});
```

---

### 3. **Use Multiple Fixtures**

You can use **multiple fixtures** in one test:

```typescript
test("Compare auth vs public", async ({
  apiHelper,
  authenticatedApiHelper,
}) => {
  // Use both!
  const publicData = await apiHelper.getRequest("https://api.com/public");
  const privateData = await authenticatedApiHelper.helper.getRequest(
    "https://api.com/private"
  );

  // Compare results
  expect(publicData).not.toEqual(privateData);
});
```

---

### 4. **Fixture Execution Flow**

Understanding when fixtures run:

```typescript
test("Example", async ({ authenticatedApiHelper }) => {
  // 1. authenticatedApiHelper fixture setup runs (login happens)
  // 2. Test code runs
  console.log("Test running");
  // 3. Test finishes
  // 4. Fixture cleanup runs automatically
});
```

---

## 🔍 Common Questions

### Q1: Do I need to close/cleanup fixtures?

**A**: No! Playwright automatically handles cleanup after each test.

### Q2: Can I modify the fixture during a test?

**A**: Yes, but it won't affect other tests. Each test gets a fresh fixture.

### Q3: What if I need custom login credentials?

**A**: You can create additional fixtures or pass parameters. Example:

```typescript
// In api-fixture.ts
authenticatedApiHelperCustom: async ({ }, use) => {
  // Custom login logic
},
```

### Q4: Can I use fixtures in `beforeEach`?

**A**: Yes!

```typescript
test.beforeEach(async ({ authenticatedApiHelper }) => {
  // Setup using fixture
});
```

---

## 🚀 Quick Reference

### Import Statement

```typescript
import { test, expect } from "../fixtures/api-fixture";
```

### Using `apiHelper`

```typescript
test("Test name", async ({ apiHelper }) => {
  await apiHelper.getRequest(url);
  await apiHelper.postRequest(url, headers, body);
  await apiHelper.putRequest(url, headers, body);
  await apiHelper.patchRequest(url, headers, body);
  await apiHelper.deleteRequest(url, headers, body);
});
```

### Using `authenticatedApiHelper`

```typescript
test("Test name", async ({ authenticatedApiHelper }) => {
  // Make requests
  await authenticatedApiHelper.helper.getRequest(url, {
    Authorization: `Bearer ${authenticatedApiHelper.accessToken}`,
  });

  // Access tokens
  const token = authenticatedApiHelper.accessToken;
  const refresh = authenticatedApiHelper.refreshToken;
});
```

---

## 📝 Summary

- **Fixtures** = Pre-configured helpers for your tests
- **`apiHelper`** = For unauthenticated API calls
- **`authenticatedApiHelper`** = For authenticated API calls (auto-login)
- Import from `../fixtures/api-fixture` instead of `@playwright/test`
- Add fixtures as **parameters** in test functions: `async ({ fixtureName })`
- Each test gets **fresh fixtures** - no shared state!

---

## 🎉 Congratulations!

You now understand Playwright fixtures! Start using them to write cleaner, more maintainable tests.

**Next Steps**:

1. Try converting your old tests to use fixtures
2. Create custom fixtures for other scenarios
3. Explore Playwright's built-in fixtures like `page`, `context`, `request`

Happy Testing! 🧪✨
