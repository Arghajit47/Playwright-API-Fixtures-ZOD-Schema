import { test, expect } from "../fixtures/api-fixture";
import loginData from "../testData/loginUser.json";
import { LOGIN_API_SCHEMA } from "../schemas/schema";

test.describe.configure({ mode: "serial" });

/**
 * Suite for testing private API endpoints that require authentication.
 * Tests run serially to maintain session state.
 */
test.describe.serial("API Testing serialization - Private API", () => {
  /**
   * Verifies that login succeeds and returns valid access and refresh tokens.
   * Validates the response against the expected schema.
   */
  test(
    "Login user and get tokens",
    { tag: "@API" },
    async ({ authenticatedApiHelper }) => {
      // authenticatedApiHelper already logged in for you!
      // You can access the response data directly
      expect(authenticatedApiHelper.accessToken).toBeDefined();
      expect(authenticatedApiHelper.refreshToken).toBeDefined();
      console.log("Access Token:", authenticatedApiHelper.accessToken);
      const response = authenticatedApiHelper.response;
      console.log(response, typeof response);
      expect(LOGIN_API_SCHEMA.parse(response)).toBeTruthy();
    }
  );

  /**
   * Retrieves the currently authenticated user and asserts that the username
   * matches the one provided in the test data.
   */
  test(
    "Get current auth user",
    { tag: "@API" },
    async ({ authenticatedApiHelper }) => {
      const response = await authenticatedApiHelper.helper.getRequest(
        "https://dummyjson.com/auth/me",
        { Authorization: `Bearer ${authenticatedApiHelper.accessToken}` }
      );
      console.log(response);
      expect(response.username).toEqual(loginData.username);
    }
  );

  /**
   * Refreshes the authentication session using the stored refresh token.
   * Ensures that new tokens are returned and are not null.
   */
  test(
    "Refresh auth session",
    { tag: "@API" },
    async ({ authenticatedApiHelper }) => {
      const response = await authenticatedApiHelper.helper.postRequest(
        "https://dummyjson.com/auth/refresh",
        { "Content-Type": "application/json" },
        { refreshToken: authenticatedApiHelper.refreshToken }
      );
      console.log(response);
      expect(response).toHaveProperty("refreshToken");
      expect(response).toHaveProperty("accessToken");
      expect(response.refreshToken).not.toBeNull();
      expect(response.accessToken).not.toBeNull();
    }
  );

  /**
   * Skipped test intended to verify error handling for a 404 response.
   * Currently not executed.
   */
  test("error API", { tag: "@API" }, async ({ authenticatedApiHelper }) => {
    const response = await authenticatedApiHelper.helper.getRequest(
      "https://dummyjson.com/http/404/Hello_Peter"
    );
    expect(response.status).toBe(404);
  });
});

/**
 * Suite for testing public API endpoints related to carts.
 * Tests run serially to avoid shared state conflicts.
 */
test.describe.serial("API Testing 'Carts' in dummyJSON - Public API", () => {
  /** Retrieves and logs all carts. */
  test("Get all carts", { tag: "@API" }, async ({ apiHelper }) => {
    const response = await apiHelper.getRequest("https://dummyjson.com/carts");
    console.log(response);
  });

  /** Retrieves and logs a single cart by ID. */
  test("Get a single cart", { tag: "@API" }, async ({ apiHelper }) => {
    const response = await apiHelper.getRequest(
      "https://dummyjson.com/carts/1"
    );
    console.log(response);
  });

  /** Retrieves and logs all carts belonging to a specific user. */
  test("Get carts by a user", { tag: "@API" }, async ({ apiHelper }) => {
    const response = await apiHelper.getRequest(
      "https://dummyjson.com/carts/user/11"
    );
    console.log(response);
  });
});
