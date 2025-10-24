// Swagger API Test Utility
import swaggerClient from '../api/swaggerClient';
import type { LoginRequest, SignupRequest } from '../api/swaggerClient';

export const testSwaggerEndpoints = async () => {
  console.log('🧪 Testing All Swagger API Endpoints...');
  console.log('🔗 Base URL:', 'http://10.0.235.235:8000/api');
  
  const results = {
    health: false,
    auth: false,
    users: false,
    orders: false,
    employees: false,
    payments: false,
    dashboard: false,
    notifications: false,
  };

  try {
    // Test 1: Health Check (No auth required)
    console.log('\n🏥 Testing Health Check...');
    try {
      const healthResponse = await swaggerClient.health.check();
      console.log('✅ Health Check:', healthResponse.data);
      results.health = true;
    } catch (error: any) {
      console.log('❌ Health Check failed:', error.message);
    }

    // Test 2: Auth Endpoints (No auth required)
    console.log('\n🔑 Testing Auth Endpoints...');
    try {
      // Test with invalid credentials to check endpoint existence
      const loginRequest: LoginRequest = {
        email: 'test@example.com',
        password: 'testpassword'
      };
      
      await swaggerClient.auth.login(loginRequest);
    } catch (error: any) {
      if (error.response?.status === 400 || error.response?.status === 401) {
        console.log('✅ Auth Login endpoint exists (got expected auth error)');
        results.auth = true;
      } else {
        console.log('❌ Auth Login failed:', error.message);
      }
    }

    // Test 3: Protected Endpoints (Require auth)
    console.log('\n🛡️ Testing Protected Endpoints (will get 401 without token)...');
    
    // Users
    try {
      await swaggerClient.users.list();
    } catch (error: any) {
      if (error.response?.status === 401) {
        console.log('✅ Users endpoint exists (got expected 401)');
        results.users = true;
      } else {
        console.log('❌ Users endpoint failed:', error.message);
      }
    }

    // Orders
    try {
      await swaggerClient.orders.list();
    } catch (error: any) {
      if (error.response?.status === 401) {
        console.log('✅ Orders endpoint exists (got expected 401)');
        results.orders = true;
      } else {
        console.log('❌ Orders endpoint failed:', error.message);
      }
    }

    // Employees
    try {
      await swaggerClient.employees.list();
    } catch (error: any) {
      if (error.response?.status === 401) {
        console.log('✅ Employees endpoint exists (got expected 401)');
        results.employees = true;
      } else {
        console.log('❌ Employees endpoint failed:', error.message);
      }
    }

    // Payments
    try {
      await swaggerClient.payments.list();
    } catch (error: any) {
      if (error.response?.status === 401) {
        console.log('✅ Payments endpoint exists (got expected 401)');
        results.payments = true;
      } else {
        console.log('❌ Payments endpoint failed:', error.message);
      }
    }

    // Dashboard
    try {
      await swaggerClient.dashboard.stats();
    } catch (error: any) {
      if (error.response?.status === 401) {
        console.log('✅ Dashboard endpoint exists (got expected 401)');
        results.dashboard = true;
      } else {
        console.log('❌ Dashboard endpoint failed:', error.message);
      }
    }

    // Notifications
    try {
      await swaggerClient.notifications.list();
    } catch (error: any) {
      if (error.response?.status === 401) {
        console.log('✅ Notifications endpoint exists (got expected 401)');
        results.notifications = true;
      } else {
        console.log('❌ Notifications endpoint failed:', error.message);
      }
    }

  } catch (error: any) {
    console.error('❌ Test Suite Error:', error.message);
  }

  // Summary
  console.log('\n📊 Test Results Summary:');
  console.log('========================');
  
  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(Boolean).length;
  
  Object.entries(results).forEach(([endpoint, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${endpoint}: ${passed ? 'PASS' : 'FAIL'}`);
  });
  
  console.log(`\n🎯 Overall: ${passedTests}/${totalTests} endpoints accessible`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All Swagger API endpoints are working!');
  } else {
    console.log('⚠️ Some endpoints may have issues. Check backend server.');
  }

  return results;
};

// Test with authentication (after login)
export const testAuthenticatedEndpoints = async () => {
  console.log('\n🔐 Testing Authenticated Endpoints...');
  
  try {
    // Test auth validation
    const authValidation = await swaggerClient.auth.validateToken();
    console.log('✅ Token validation:', authValidation.data);

    // Test dashboard stats
    const dashboardStats = await swaggerClient.dashboard.stats();
    console.log('✅ Dashboard stats:', dashboardStats.data);

    // Test users list
    const usersList = await swaggerClient.users.list({ page: 1, limit: 5 });
    console.log('✅ Users list:', usersList.data);

    // Test orders list
    const ordersList = await swaggerClient.orders.list({ page: 1, limit: 5 });
    console.log('✅ Orders list:', ordersList.data);

    console.log('🎉 All authenticated endpoints working!');
    return true;

  } catch (error: any) {
    console.error('❌ Authenticated endpoints test failed:', {
      status: error.response?.status,
      message: error.message,
      data: error.response?.data
    });
    return false;
  }
};

// Quick connectivity test
export const quickConnectivityTest = async () => {
  console.log('⚡ Quick Connectivity Test...');
  
  try {
    const response = await swaggerClient.health.check();
    console.log('✅ Backend is reachable:', response.data);
    return true;
  } catch (error: any) {
    console.error('❌ Backend not reachable:', error.message);
    return false;
  }
};

// Auto-run tests in development
export const runSwaggerTests = () => {
  if (__DEV__) {
    setTimeout(() => {
      testSwaggerEndpoints();
    }, 2000); // Delay to allow app to initialize
  }
};