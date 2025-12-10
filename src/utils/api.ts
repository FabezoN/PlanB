import AsyncStorage from '@react-native-async-storage/async-storage';
import { projectId, publicAnonKey } from './supabase/info';
import { Bar, Review } from '../types';

const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-0b067e93`;

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

// Helper function to make API calls
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const token = await AsyncStorage.getItem('access_token') || publicAnonKey;
    
    const url = `${API_URL}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return { error: data.error || 'Une erreur est survenue' };
    }

    return { data };
  } catch (error) {
    console.error(`Network error on ${endpoint}:`, error);
    return { error: 'Erreur de connexion au serveur' };
  }
}

// ==================== AUTH ====================

export async function signUp(email: string, password: string, name: string) {
  return apiCall<{ user: any }>('/signup', {
    method: 'POST',
    body: JSON.stringify({ email, password, name }),
  });
}

// ==================== BARS ====================

export async function getAllBars() {
  const response = await apiCall<{ bars: Bar[] }>('/bars');
  return response;
}

export async function getBar(id: string) {
  return apiCall<{ bar: Bar }>(`/bars/${id}`);
}

export async function createBar(barData: Omit<Bar, 'id' | 'rating' | 'reviewCount'>) {
  return apiCall<{ bar: Bar }>('/bars', {
    method: 'POST',
    body: JSON.stringify(barData),
  });
}

export async function updateBar(id: string, updates: Partial<Bar>) {
  return apiCall<{ bar: Bar }>(`/bars/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

export async function deleteBar(id: string) {
  return apiCall<{ success: boolean }>(`/bars/${id}`, {
    method: 'DELETE',
  });
}

// ==================== REVIEWS ====================

export async function getBarReviews(barId: string) {
  return apiCall<{ reviews: Review[] }>(`/bars/${barId}/reviews`);
}

export async function addReview(
  barId: string,
  rating: number,
  comment: string,
  photo?: string
) {
  return apiCall<{ review: Review }>(`/bars/${barId}/reviews`, {
    method: 'POST',
    body: JSON.stringify({ rating, comment, photo }),
  });
}

// ==================== SEED ====================

export async function seedDatabase() {
  return apiCall<{ success: boolean; message: string }>('/seed', {
    method: 'POST',
  });
}