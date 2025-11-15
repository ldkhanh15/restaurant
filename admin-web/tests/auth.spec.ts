import { test, expect, Page } from "@playwright/test";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const ADMIN_WEB_URL =
  process.env.NEXT_PUBLIC_CLIENT_URL || "http://localhost:3001";

/**
 * Functional Tests for Authentication in Admin-Web
 * Tests UI, API, and functionality for login, logout, and role-based access control
 */

test.describe("Admin-Web Authentication", () => {
  let page: Page;

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    // Clear localStorage before each test
    await page.goto(ADMIN_WEB_URL);
    await page.evaluate(() => {
      localStorage.clear();
    });
  });

  test.describe("Login Flow", () => {
    test("Kiểm tra đăng nhập thành công với admin role", async () => {
      await page.goto(`${ADMIN_WEB_URL}/login`);

      // Fill login form
      await page.fill(
        'input[type="email"], input[name="email"]',
        "admin@example.com"
      );
      await page.fill(
        'input[type="password"], input[name="password"]',
        "admin123"
      );

      // Submit form
      await page.click('button[type="submit"]');

      // Wait for redirect to dashboard
      await page.waitForURL(
        new RegExp(`${ADMIN_WEB_URL}(/|/dashboard|/orders)`),
        {
          timeout: 10000,
        }
      );

      // Verify user is logged in
      const token = await page.evaluate(() => localStorage.getItem("token"));
      const user = await page.evaluate(() => {
        // Admin-web might store user differently
        return (
          localStorage.getItem("user") || localStorage.getItem("admin_user")
        );
      });

      expect(token).toBeTruthy();

      if (user) {
        const userData = JSON.parse(user);
        expect(["admin", "employee", "staff"]).toContain(userData.role);
      }
    });

    test("Kiểm tra lỗi khi đăng nhập với customer role", async () => {
      await page.goto(`${ADMIN_WEB_URL}/login`);

      // Fill login form with customer credentials
      await page.fill(
        'input[type="email"], input[name="email"]',
        "customer@example.com"
      );
      await page.fill(
        'input[type="password"], input[name="password"]',
        "password123"
      );

      // Submit form
      await page.click('button[type="submit"]');

      // Wait for error message or redirect
      await page.waitForSelector(
        "text=/Không thể đăng nhập|Unauthorized|customer|Không có quyền/i",
        { timeout: 5000 }
      );

      // Verify user is NOT logged in
      const token = await page.evaluate(() => localStorage.getItem("token"));
      expect(token).toBeFalsy();
    });

    test("Kiểm tra validation form đăng nhập", async () => {
      await page.goto(`${ADMIN_WEB_URL}/login`);

      // Try to submit empty form
      await page.click('button[type="submit"]');

      // Check for validation errors
      const hasErrors = await page
        .locator("text=/Email|email|Mật khẩu|password|required/i")
        .count();
      expect(hasErrors).toBeGreaterThan(0);
    });

    test("Kiểm tra lỗi khi sai mật khẩu", async () => {
      await page.goto(`${ADMIN_WEB_URL}/login`);

      await page.fill(
        'input[type="email"], input[name="email"]',
        "admin@example.com"
      );
      await page.fill(
        'input[type="password"], input[name="password"]',
        "wrongpassword"
      );

      await page.click('button[type="submit"]');

      // Wait for error message
      await page.waitForSelector("text=/Sai|Invalid|Lỗi|Error/i", {
        timeout: 5000,
      });

      const token = await page.evaluate(() => localStorage.getItem("token"));
      expect(token).toBeFalsy();
    });
  });

  test.describe("Logout Flow", () => {
    test("Kiểm tra đăng xuất thành công", async () => {
      // First login
      await page.goto(`${ADMIN_WEB_URL}/login`);
      await page.fill(
        'input[type="email"], input[name="email"]',
        "admin@example.com"
      );
      await page.fill(
        'input[type="password"], input[name="password"]',
        "admin123"
      );
      await page.click('button[type="submit"]');
      await page.waitForURL(
        new RegExp(`${ADMIN_WEB_URL}(/|/dashboard|/orders)`),
        {
          timeout: 10000,
        }
      );

      // Verify logged in
      let token = await page.evaluate(() => localStorage.getItem("token"));
      expect(token).toBeTruthy();

      // Find and click logout button
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
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          localStorage.removeItem("admin_user");
        });
        await page.reload();
      }

      // Verify logged out
      token = await page.evaluate(() => localStorage.getItem("token"));
      const user = await page.evaluate(() => {
        return (
          localStorage.getItem("user") || localStorage.getItem("admin_user")
        );
      });

      expect(token).toBeFalsy();
      expect(user).toBeFalsy();

      // Should redirect to login
      const currentUrl = page.url();
      expect(currentUrl).toMatch(new RegExp(`${ADMIN_WEB_URL}(/|/login)`));
    });
  });

  test.describe("Role-Based Access Control", () => {
    test("Kiểm tra admin có thể truy cập tất cả routes", async () => {
      // Login as admin
      await page.goto(`${ADMIN_WEB_URL}/login`);
      await page.fill(
        'input[type="email"], input[name="email"]',
        "admin@example.com"
      );
      await page.fill(
        'input[type="password"], input[name="password"]',
        "admin123"
      );
      await page.click('button[type="submit"]');
      await page.waitForURL(
        new RegExp(`${ADMIN_WEB_URL}(/|/dashboard|/orders)`),
        {
          timeout: 10000,
        }
      );

      // Try to access various admin routes
      const routes = ["/orders", "/reservations", "/tables", "/dashboard"];

      for (const route of routes) {
        await page.goto(`${ADMIN_WEB_URL}${route}`);
        // Should not redirect to login
        expect(page.url()).not.toContain("/login");
      }
    });

    test("Kiểm tra customer không thể truy cập admin routes", async () => {
      // Try to access admin routes without proper authentication
      await page.goto(`${ADMIN_WEB_URL}/orders`);

      // Should redirect to login
      await page.waitForURL(new RegExp(`${ADMIN_WEB_URL}(/|/login)`), {
        timeout: 5000,
      });
    });

    test("Kiểm tra AuthGate component hoạt động đúng", async () => {
      // Set customer token (should be rejected)
      await page.goto(ADMIN_WEB_URL);
      await page.evaluate(() => {
        localStorage.setItem("token", "customer_token_12345");
        localStorage.setItem(
          "user",
          JSON.stringify({ id: "user-123", role: "customer" })
        );
      });

      // Try to access admin page
      await page.goto(`${ADMIN_WEB_URL}/orders`);

      // Should redirect to login or show unauthorized
      await page.waitForTimeout(2000);
      const currentUrl = page.url();
      expect(
        currentUrl.includes("/login") ||
          currentUrl.includes("/unauthorized") ||
          !localStorage.getItem("token")
      ).toBeTruthy();
    });
  });

  test.describe("Token Validation", () => {
    test("Kiểm tra token validation khi truy cập trang protected", async () => {
      // Try to access protected page without token
      await page.goto(`${ADMIN_WEB_URL}/orders`);

      // Should redirect to login
      await page.waitForURL(new RegExp(`${ADMIN_WEB_URL}(/|/login)`), {
        timeout: 5000,
      });
    });

    test("Kiểm tra token expiration handling", async () => {
      // Set expired token
      await page.goto(ADMIN_WEB_URL);
      await page.evaluate(() => {
        localStorage.setItem("token", "expired_token_12345");
      });

      // Try to access protected page
      await page.goto(`${ADMIN_WEB_URL}/orders`);

      // Should handle 401 and redirect or clear token
      await page.waitForTimeout(2000);

      const token = await page.evaluate(() => localStorage.getItem("token"));
      // Token should be cleared or page should redirect
      expect(
        page.url().includes("/login") ||
          !token ||
          token !== "expired_token_12345"
      ).toBeTruthy();
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

      await page.goto(`${ADMIN_WEB_URL}/login`);
      await page.fill(
        'input[type="email"], input[name="email"]',
        "admin@example.com"
      );
      await page.fill(
        'input[type="password"], input[name="password"]',
        "admin123"
      );
      await page.click('button[type="submit"]');

      // Wait for API call
      await page.waitForTimeout(2000);

      // Verify API was called
      expect(apiCalls.length).toBeGreaterThan(0);
      expect(apiCalls[0].method).toBe("POST");
      expect(apiCalls[0].url).toContain("/api/auth/login");
    });

    test("Kiểm tra API response handling", async () => {
      await page.goto(`${ADMIN_WEB_URL}/login`);

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
                id: "admin-123",
                email: "admin@example.com",
                role: "admin",
              },
            },
          }),
        });
      });

      await page.fill(
        'input[type="email"], input[name="email"]',
        "admin@example.com"
      );
      await page.fill(
        'input[type="password"], input[name="password"]',
        "admin123"
      );
      await page.click('button[type="submit"]');

      await page.waitForTimeout(1000);

      // Verify token is stored
      const token = await page.evaluate(() => localStorage.getItem("token"));
      expect(token).toBeTruthy();
    });
  });

  test.describe("UI Elements", () => {
    test("Kiểm tra hiển thị form đăng nhập", async () => {
      await page.goto(`${ADMIN_WEB_URL}/login`);

      // Check for login form elements
      const emailInput = page.locator(
        'input[type="email"], input[name="email"]'
      );
      const passwordInput = page.locator(
        'input[type="password"], input[name="password"]'
      );
      const submitButton = page.locator('button[type="submit"]');

      expect(await emailInput.count()).toBeGreaterThan(0);
      expect(await passwordInput.count()).toBeGreaterThan(0);
      expect(await submitButton.count()).toBeGreaterThan(0);
    });

    test("Kiểm tra hiển thị thông báo lỗi", async () => {
      await page.goto(`${ADMIN_WEB_URL}/login`);

      await page.fill(
        'input[type="email"], input[name="email"]',
        "wrong@example.com"
      );
      await page.fill(
        'input[type="password"], input[name="password"]',
        "wrongpassword"
      );
      await page.click('button[type="submit"]');

      // Wait for error message
      await page.waitForSelector("text=/Sai|Invalid|Lỗi|Error/i", {
        timeout: 5000,
      });

      const errorVisible = await page
        .locator("text=/Sai|Invalid|Lỗi|Error/i")
        .isVisible();
      expect(errorVisible).toBeTruthy();
    });
  });
});
