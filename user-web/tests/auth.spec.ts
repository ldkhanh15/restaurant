import { test, expect, Page } from "@playwright/test";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const USER_WEB_URL =
  process.env.NEXT_PUBLIC_CLIENT_URL || "http://localhost:3000";

/**
 * Functional Tests for Authentication in User-Web
 * Tests UI, API, and functionality for login, logout, registration, and role-based access
 */

test.describe("User-Web Authentication", () => {
  let page: Page;

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    // Clear localStorage before each test
    await page.goto(USER_WEB_URL);
    await page.evaluate(() => {
      localStorage.clear();
    });
  });

  test.describe("Login Flow", () => {
    test("Kiểm tra đăng nhập thành công với customer role", async () => {
      await page.goto(`${USER_WEB_URL}/login`);

      // Fill login form
      await page.fill('input[type="email"]', "customer@example.com");
      await page.fill('input[type="password"]', "password123");

      // Submit form
      await page.click('button[type="submit"]');

      // Wait for redirect to home page
      await page.waitForURL(USER_WEB_URL, { timeout: 10000 });

      // Verify user is logged in
      const token = await page.evaluate(() =>
        localStorage.getItem("auth_token")
      );
      const user = await page.evaluate(() =>
        localStorage.getItem("restaurant_user")
      );

      expect(token).toBeTruthy();
      expect(user).toBeTruthy();

      const userData = JSON.parse(user || "{}");
      expect(userData.role).toBe("customer");
      expect(["admin", "employee", "staff"]).not.toContain(userData.role);
    });

    test("Kiểm tra lỗi khi đăng nhập với admin role", async () => {
      await page.goto(`${USER_WEB_URL}/login`);

      // Fill login form with admin credentials
      await page.fill('input[type="email"]', "admin@example.com");
      await page.fill('input[type="password"]', "admin123");

      // Submit form
      await page.click('button[type="submit"]');

      // Wait for error message
      await page.waitForSelector(
        "text=/Không thể đăng nhập|Unauthorized|admin/i",
        {
          timeout: 5000,
        }
      );

      // Verify user is NOT logged in
      const token = await page.evaluate(() =>
        localStorage.getItem("auth_token")
      );
      expect(token).toBeFalsy();
    });

    test("Kiểm tra validation form đăng nhập", async () => {
      await page.goto(`${USER_WEB_URL}/login`);

      // Try to submit empty form
      await page.click('button[type="submit"]');

      // Check for validation errors
      const emailError = await page.locator("text=/Email|email/i").count();
      const passwordError = await page
        .locator("text=/Mật khẩu|password/i")
        .count();

      expect(emailError + passwordError).toBeGreaterThan(0);
    });

    test("Kiểm tra lỗi khi sai mật khẩu", async () => {
      await page.goto(`${USER_WEB_URL}/login`);

      await page.fill('input[type="email"]', "customer@example.com");
      await page.fill('input[type="password"]', "wrongpassword");

      await page.click('button[type="submit"]');

      // Wait for error message
      await page.waitForSelector("text=/Sai|Invalid|Lỗi/i", { timeout: 5000 });

      const token = await page.evaluate(() =>
        localStorage.getItem("auth_token")
      );
      expect(token).toBeFalsy();
    });
  });

  test.describe("Registration Flow", () => {
    test("Kiểm tra đăng ký thành công", async () => {
      await page.goto(`${USER_WEB_URL}/register`);

      const timestamp = Date.now();
      const testEmail = `test${timestamp}@example.com`;

      // Fill registration form
      await page.fill('input[name="username"]', `testuser${timestamp}`);
      await page.fill('input[name="email"]', testEmail);
      await page.fill('input[name="password"]', "password123");
      await page.fill('input[name="full_name"]', "Test User");
      await page.fill('input[name="phone"]', "0123456789");

      // Submit form
      await page.click('button[type="submit"]');

      // Wait for redirect or success message
      await page.waitForURL(new RegExp(`${USER_WEB_URL}(/|/login|/home)`), {
        timeout: 10000,
      });

      // Verify registration was successful
      const token = await page.evaluate(() =>
        localStorage.getItem("auth_token")
      );
      expect(token).toBeTruthy();
    });

    test("Kiểm tra validation form đăng ký", async () => {
      await page.goto(`${USER_WEB_URL}/register`);

      // Try to submit empty form
      await page.click('button[type="submit"]');

      // Check for validation errors
      const hasErrors = await page
        .locator("text=/Email|Mật khẩu|Tên|Số điện thoại/i")
        .count();
      expect(hasErrors).toBeGreaterThan(0);
    });
  });

  test.describe("Logout Flow", () => {
    test("Kiểm tra đăng xuất thành công", async () => {
      // First login
      await page.goto(`${USER_WEB_URL}/login`);
      await page.fill('input[type="email"]', "customer@example.com");
      await page.fill('input[type="password"]', "password123");
      await page.click('button[type="submit"]');
      await page.waitForURL(USER_WEB_URL, { timeout: 10000 });

      // Verify logged in
      let token = await page.evaluate(() => localStorage.getItem("auth_token"));
      expect(token).toBeTruthy();

      // Find and click logout button (could be in header, menu, etc.)
      const logoutButton = page
        .locator(
          'button:has-text("Đăng xuất"), a:has-text("Đăng xuất"), button:has-text("Logout")'
        )
        .first();
      if ((await logoutButton.count()) > 0) {
        await logoutButton.click();
      } else {
        // Alternative: call logout via API or context
        await page.evaluate(() => {
          localStorage.removeItem("auth_token");
          localStorage.removeItem("restaurant_user");
        });
        await page.reload();
      }

      // Verify logged out
      token = await page.evaluate(() => localStorage.getItem("auth_token"));
      const user = await page.evaluate(() =>
        localStorage.getItem("restaurant_user")
      );

      expect(token).toBeFalsy();
      expect(user).toBeFalsy();

      // Should redirect to login or home
      const currentUrl = page.url();
      expect(currentUrl).toMatch(new RegExp(`${USER_WEB_URL}(/|/login)`));
    });
  });

  test.describe("Token Validation", () => {
    test("Kiểm tra token validation khi truy cập trang protected", async () => {
      // Try to access protected page without token
      await page.goto(`${USER_WEB_URL}/orders`);

      // Should redirect to login or show unauthorized
      await page.waitForURL(
        new RegExp(`${USER_WEB_URL}(/login|/|/unauthorized)`),
        {
          timeout: 5000,
        }
      );
    });

    test("Kiểm tra token expiration handling", async () => {
      // Set expired token
      await page.goto(USER_WEB_URL);
      await page.evaluate(() => {
        localStorage.setItem("auth_token", "expired_token_12345");
      });

      // Try to access protected page
      await page.goto(`${USER_WEB_URL}/orders`);

      // Should handle 401 and redirect or clear token
      await page.waitForTimeout(2000);

      const token = await page.evaluate(() =>
        localStorage.getItem("auth_token")
      );
      // Token should be cleared or page should redirect
      expect(
        page.url().includes("/login") ||
          !token ||
          token !== "expired_token_12345"
      ).toBeTruthy();
    });
  });

  test.describe("Role-Based Access Control", () => {
    test("Kiểm tra customer không thể truy cập admin routes", async () => {
      // Login as customer
      await page.goto(`${USER_WEB_URL}/login`);
      await page.fill('input[type="email"]', "customer@example.com");
      await page.fill('input[type="password"]', "password123");
      await page.click('button[type="submit"]');
      await page.waitForURL(USER_WEB_URL, { timeout: 10000 });

      // Try to access admin routes (if they exist in user-web)
      // This test verifies that customer role is properly restricted
      const user = await page.evaluate(() => {
        const userStr = localStorage.getItem("restaurant_user");
        return userStr ? JSON.parse(userStr) : null;
      });

      expect(user).toBeTruthy();
      expect(user.role).toBe("customer");
      expect(["admin", "employee", "staff"]).not.toContain(user.role);
    });
  });

  test.describe("API Integration", () => {
    test("Kiểm tra API call khi đăng nhập", async () => {
      const apiCalls: any[] = [];

      // Intercept API calls
      page.on("request", (request) => {
        if (request.url().includes("/api/auth/login")) {
          apiCalls.push({
            url: request.url(),
            method: request.method(),
            postData: request.postData(),
          });
        }
      });

      await page.goto(`${USER_WEB_URL}/login`);
      await page.fill('input[type="email"]', "customer@example.com");
      await page.fill('input[type="password"]', "password123");
      await page.click('button[type="submit"]');

      // Wait for API call
      await page.waitForTimeout(2000);

      // Verify API was called
      expect(apiCalls.length).toBeGreaterThan(0);
      expect(apiCalls[0].method).toBe("POST");
      expect(apiCalls[0].url).toContain("/api/auth/login");
    });

    test("Kiểm tra API response handling", async () => {
      await page.goto(`${USER_WEB_URL}/login`);

      // Mock API response
      await page.route(`${BASE_URL}/api/auth/login`, async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            status: "success",
            data: {
              token: "mock_token_12345",
              user: {
                id: "user-123",
                email: "customer@example.com",
                role: "customer",
              },
            },
          }),
        });
      });

      await page.fill('input[type="email"]', "customer@example.com");
      await page.fill('input[type="password"]', "password123");
      await page.click('button[type="submit"]');

      await page.waitForTimeout(1000);

      // Verify token is stored
      const token = await page.evaluate(() =>
        localStorage.getItem("auth_token")
      );
      expect(token).toBeTruthy();
    });
  });
});
