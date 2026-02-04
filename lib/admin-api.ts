// Mock API functions for admin dashboard
// These will be replaced with actual API calls later

// Use deployed Vercel API by default
// For local development, set NEXT_PUBLIC_API_URL=http://localhost:5001 in .env.local
function getApiBaseUrl(): string {
  // If explicitly set in env, use it
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  // Default to production URL
  return 'https://sukiyaapi.vercel.app';
}

const API_BASE_URL = getApiBaseUrl();

// Request timeout for serverless functions (30 seconds - Vercel Pro plan limit)
const REQUEST_TIMEOUT = 30000;

// Maximum number of retries for transient failures
const MAX_RETRIES = 2;

// Retry delay in milliseconds
const RETRY_DELAY = 1000;

/**
 * Fetch with timeout and retry logic
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout: number = REQUEST_TIMEOUT,
  retries: number = MAX_RETRIES
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);

    // Handle timeout/abort errors
    if (error instanceof Error && error.name === 'AbortError') {
      if (retries > 0) {
        // Retry on timeout
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        return fetchWithTimeout(url, options, timeout, retries - 1);
      }
      throw new Error(`Request timeout: The server took too long to respond. This may be due to a cold start. Please try again.`);
    }

    // Handle network errors
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      if (retries > 0) {
        // Retry on network errors
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        return fetchWithTimeout(url, options, timeout, retries - 1);
      }
      throw new Error(`Network error: Cannot connect to backend server at ${API_BASE_URL}. Please check your internet connection and try again.`);
    }

    throw error;
  }
}

/**
 * Handle API response errors with better error messages
 */
async function handleApiError(response: Response, defaultMessage: string): Promise<never> {
  let errorMessage = defaultMessage;

  // Handle specific status codes
  if (response.status === 504 || response.status === 502) {
    errorMessage = 'Gateway timeout: The server took too long to respond. This may be due to a cold start. Please try again in a few seconds.';
  } else if (response.status === 503) {
    errorMessage = 'Service unavailable: The backend service is temporarily unavailable. Please try again later.';
  } else if (response.status === 500) {
    errorMessage = 'Internal server error: The server encountered an error. Please try again or contact support.';
  } else {
    // Try to parse error response
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorData.message || defaultMessage;

      // Add details if available
      if (errorData.details && process.env.NODE_ENV === 'development') {
        errorMessage += ` (Details: ${errorData.details})`;
      }
    } catch {
      // If JSON parsing fails, use status text
      errorMessage = `Server error: ${response.status} ${response.statusText}`;
    }
  }

  throw new Error(errorMessage);
}

export type OrderStatus = "Received" | "Preparing" | "Ready" | "Completed";

export interface Order {
  _id: string;
  orderId: string;
  userId: string;
  displayName: string;
  tableNumber: string;
  paymentMethod?: 'paypay' | 'manual';
  paymentStatus?: 'pending' | 'paid' | null;
  items: Array<{
    itemId: string;
    name: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
}

export interface MenuItem {
  _id: string;
  nameEn: string;
  nameJp: string;
  price: number;
  imageUrl: string;
  category: string;
  subcategory?: string | null;
  isActive: boolean;
  isAddon?: boolean;
  allowedAddons?: string[];
  createdAt: string;
  updatedAt: string;
}

export type UserRole = "customer" | "staff" | "admin" | "manager";

export interface User {
  _id: string;
  userId: string;
  displayName: string;
  email?: string;
  phone?: string;
  role: UserRole;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate?: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  lineUserId?: string;
}

export interface AuthUser {
  _id: string;
  id: string;
  userId: string;
  displayName: string;
  email?: string;
  phone?: string;
  pictureUrl?: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lineUserId?: string;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

export interface LineLoginResponse {
  loginUrl: string;
  state: string;
}

// Authentication API functions
export async function login(userId: string, password: string): Promise<LoginResponse> {
  try {
    // Validate inputs before sending
    if (!userId || !password) {
      throw new Error('User ID and password are required');
    }

    const requestBody = { userId: userId.trim(), password: password.trim() };

    const response = await fetchWithTimeout(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      await handleApiError(response, 'Failed to login');
    }

    return response.json();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to login');
  }
}

export async function verifyToken(token: string): Promise<{ valid: boolean; user: AuthUser }> {
  try {
    const response = await fetchWithTimeout(`${API_BASE_URL}/api/auth/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      await handleApiError(response, 'Failed to verify token');
    }

    return response.json();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to verify token');
  }
}

export async function setPassword(userId: string, password: string): Promise<void> {
  try {
    const response = await fetchWithTimeout(`${API_BASE_URL}/api/auth/set-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, password }),
    });

    if (!response.ok) {
      await handleApiError(response, 'Failed to set password');
    }
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to set password');
  }
}

// LINE Login API functions
export async function getLineLoginUrl(): Promise<LineLoginResponse> {
  try {
    const response = await fetchWithTimeout(`${API_BASE_URL}/api/auth/line/login`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      await handleApiError(response, 'Failed to get LINE login URL');
    }

    return response.json();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to get LINE login URL');
  }
}

// LIFF Login API function
export async function liffLogin(profile: { userId: string; displayName: string; pictureUrl?: string }): Promise<LoginResponse> {
  try {
    const response = await fetchWithTimeout(`${API_BASE_URL}/api/auth/liff`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(profile),
    });

    if (!response.ok) {
      await handleApiError(response, 'Failed to authenticate with LIFF');
    }

    return response.json();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to authenticate with LIFF');
  }
}


// Helper function to get auth token from localStorage
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('admin_token');
}

// Helper function to set auth token in localStorage
export function setAuthToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('admin_token', token);
}

// Helper function to remove auth token from localStorage
export function removeAuthToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('admin_token');
}

// Helper function to get auth headers
export function getAuthHeaders(): HeadersInit {
  const token = getAuthToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

// Order API functions - Fetch from MongoDb
export async function getOrders(): Promise<Order[]> {
  try {
    const response = await fetchWithTimeout(`${API_BASE_URL}/api/orders`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      await handleApiError(response, 'Failed to fetch orders');
    }

    return response.json();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to fetch orders');
  }
}

export async function updateOrderStatus(
  orderId: string,
  status: Order["status"]
): Promise<Order> {
  try {
    const response = await fetchWithTimeout(`${API_BASE_URL}/api/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      await handleApiError(response, 'Failed to update order status');
    }

    return response.json();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to update order status');
  }
}

/**
 * Update payment status for an order (e.g. mark after-dining payments as paid).
 */
export async function updateOrderPaymentStatus(
  orderId: string,
  paymentStatus: 'pending' | 'paid'
): Promise<Order> {
  try {
    const response = await fetchWithTimeout(`${API_BASE_URL}/api/orders/${orderId}/payment`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ paymentStatus }),
    });

    if (!response.ok) {
      await handleApiError(response, 'Failed to update payment status');
    }

    return response.json();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to update payment status');
  }
}

// Menu API functions - Fetch from MongoDB via backend only
export async function getMenuItems(): Promise<MenuItem[]> {
  try {
    const response = await fetchWithTimeout(`${API_BASE_URL}/api/menu`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      await handleApiError(response, 'Failed to fetch menu items');
    }

    return response.json();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to fetch menu items');
  }
}

export async function createMenuItem(item: Omit<MenuItem, "_id" | "createdAt" | "updatedAt">): Promise<MenuItem> {
  try {
    const response = await fetchWithTimeout(`${API_BASE_URL}/api/menu`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(item),
    });

    if (!response.ok) {
      // Log response details for debugging
      console.error('Backend error - Status:', response.status, response.statusText);

      let errorMessage = 'Failed to create menu item';
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;

        // If there are missing fields, include them in the error
        if (errorData.missingFields && Array.isArray(errorData.missingFields)) {
          errorMessage = `${errorMessage} (Missing: ${errorData.missingFields.join(', ')})`;
        }
      } catch {
        // If JSON parsing fails, use handleApiError
        await handleApiError(response, errorMessage);
      }

      throw new Error(errorMessage);
    }

    return response.json();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to create menu item');
  }
}

export async function updateMenuItem(id: string, updates: Partial<MenuItem>): Promise<MenuItem> {
  try {
    const response = await fetchWithTimeout(`${API_BASE_URL}/api/menu/${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      await handleApiError(response, 'Failed to update menu item');
    }

    return response.json();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to update menu item');
  }
}

export async function deleteMenuItem(id: string): Promise<void> {
  try {
    const response = await fetchWithTimeout(`${API_BASE_URL}/api/menu/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      await handleApiError(response, 'Failed to delete menu item');
    }

    // Read the response body to ensure the request is fully processed
    try {
      await response.json();
    } catch {
      // Response might be empty, which is fine
    }
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to delete menu item');
  }
}

// User Management API Functions
export async function getUsers(): Promise<User[]> {
  try {
    const response = await fetchWithTimeout(`${API_BASE_URL}/api/users`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      await handleApiError(response, 'Failed to fetch users');
    }

    return response.json();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to fetch users');
  }
}

export async function getUserById(id: string): Promise<User> {
  try {
    // Try to fetch directly by ID first
    const response = await fetchWithTimeout(`${API_BASE_URL}/api/users/${id}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (response.ok) {
      return response.json();
    }

    // If endpoint doesn't exist (404), fall back to fetching all users and filtering
    if (response.status === 404) {
      const users = await getUsers();
      const user = users.find((u) => u._id === id);
      if (user) {
        return user;
      }
      throw new Error('User not found');
    }

    // For other errors, use handleApiError (always throws)
    await handleApiError(response, 'Failed to fetch user');
    // This line will never execute, but satisfies TypeScript's return type check
    throw new Error('Failed to fetch user');
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to fetch user');
  }
}

export async function getUserByUserId(userId: string): Promise<User> {
  try {
    const response = await fetchWithTimeout(`${API_BASE_URL}/api/users/userId/${userId}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      await handleApiError(response, 'Failed to fetch user');
    }

    return response.json();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to fetch user');
  }
}

export async function createUser(user: Omit<User, "_id" | "createdAt" | "updatedAt" | "totalOrders" | "totalSpent" | "lastOrderDate">): Promise<User> {
  try {
    const response = await fetchWithTimeout(`${API_BASE_URL}/api/users`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(user),
    });

    if (!response.ok) {
      let errorMessage = 'Failed to create user';
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
        if (errorData.missingFields) {
          errorMessage += `: ${errorData.missingFields.join(', ')}`;
        }
      } catch {
        await handleApiError(response, errorMessage);
      }
      throw new Error(errorMessage);
    }

    return response.json();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to create user');
  }
}

export async function updateUser(id: string, updates: Partial<User>): Promise<User> {
  try {
    const response = await fetchWithTimeout(`${API_BASE_URL}/api/users/${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      await handleApiError(response, 'Failed to update user');
    }

    return response.json();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to update user');
  }
}

export async function deleteUser(id: string): Promise<void> {
  try {
    const response = await fetchWithTimeout(`${API_BASE_URL}/api/users/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      await handleApiError(response, 'Failed to delete user');
    }

    // Read the response body to ensure the request is fully processed
    try {
      await response.json();
    } catch {
      // Response might be empty, which is fine
    }
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to delete user');
  }
}

