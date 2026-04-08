import * as FileSystem from 'expo-file-system/legacy';
import { Bar, Review } from '../types';
import { getSupabaseClient } from './supabase/client';

const projectId = process.env.EXPO_PUBLIC_SUPABASE_PROJECT_ID!;
const publicAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;
const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-0b067e93`;

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

// Récupère le token user actuel (refresh si nécessaire)
async function getUserToken(): Promise<string | null> {
  try {
    const supabase = getSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;

    const now = Math.floor(Date.now() / 1000);
    if (session.expires_at && session.expires_at - now < 60) {
      const { data } = await supabase.auth.refreshSession();
      return data.session?.access_token ?? null;
    }

    return session.access_token;
  } catch (_) {
    return null;
  }
}

// Toujours utiliser la clé anon pour l'Authorization (acceptée par la gateway Supabase)
// Le token user est passé en header séparé X-User-Token pour les routes qui en ont besoin
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {},
  includeUserToken = false
): Promise<ApiResponse<T>> {
  try {
    const extraHeaders: Record<string, string> = {};

    if (includeUserToken) {
      const userToken = await getUserToken();
      if (userToken) extraHeaders['X-User-Token'] = userToken;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`,
        ...extraHeaders,
        ...options.headers,
      },
    });

    const text = await response.text();
    let data: any = {};
    try { data = JSON.parse(text); } catch { data = { raw: text }; }

    if (!response.ok) {
      console.error(`[API] ${endpoint} → ${response.status}`, data);
      return { error: data.error || `Erreur ${response.status}` };
    }

    return { data };
  } catch (error: any) {
    console.error(`[API] Network error on ${endpoint}:`, error?.message || error);
    return { error: 'Erreur de connexion au serveur' };
  }
}

// ==================== AUTH ====================

export async function signUp(email: string, password: string, firstName: string, lastName: string) {
  return apiCall<{ user: any }>('/signup', {
    method: 'POST',
    body: JSON.stringify({ email, password, firstName, lastName, name: `${firstName} ${lastName}`.trim() }),
  });
}

// ==================== BARS ====================

export async function getAllBars() {
  return apiCall<{ bars: Bar[] }>('/bars');
}

export async function getBar(id: string) {
  return apiCall<{ bar: Bar }>(`/bars/${id}`);
}

export async function createBar(barData: Omit<Bar, 'id' | 'rating' | 'reviewCount'>) {
  return apiCall<{ bar: Bar }>('/bars', {
    method: 'POST',
    body: JSON.stringify(barData),
  }, true);
}

export async function updateBar(id: string, updates: Partial<Bar>) {
  return apiCall<{ bar: Bar }>(`/bars/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  }, true);
}

export async function deleteBar(id: string) {
  return apiCall<{ success: boolean }>(`/bars/${id}`, {
    method: 'DELETE',
  }, true);
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
  }, true);
}

// ==================== GEOCODING ====================

export async function geocodeAddress(address: string): Promise<{ latitude: number; longitude: number } | null> {
  try {
    const encoded = encodeURIComponent(address);
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&limit=1&addressdetails=1`,
      { headers: { 'User-Agent': 'PlanB-App/1.0 (contact@planb.app)' } }
    );
    const results = await response.json();
    if (!results || results.length === 0) return null;
    return {
      latitude: parseFloat(results[0].lat),
      longitude: parseFloat(results[0].lon),
    };
  } catch {
    return null;
  }
}

// ==================== STORAGE ====================

// Converts a local image URI to base64, then uploads via Edge Function (service role)
export async function uploadBarPhoto(imageUri: string): Promise<string> {
  console.log('[uploadBarPhoto] Lecture du fichier:', imageUri);

  let base64: string;
  try {
    base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    console.log('[uploadBarPhoto] Base64 lu, longueur:', base64.length);
  } catch (e: any) {
    console.error('[uploadBarPhoto] Erreur lecture fichier:', e.message);
    throw new Error(`Impossible de lire l'image : ${e.message}`);
  }

  // Détecter le type MIME depuis l'extension (en ignorant les query strings)
  const cleanUri = imageUri.split('?')[0];
  const ext = cleanUri.split('.').pop()?.toLowerCase() ?? 'jpg';
  const mimeType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
  console.log('[uploadBarPhoto] MIME type détecté:', mimeType);

  const userToken = await getUserToken();
  if (!userToken) throw new Error('Vous devez être connecté pour uploader une photo');

  console.log('[uploadBarPhoto] Envoi vers Edge Function...');
  const uploadResponse = await fetch(`${API_URL}/upload-photo`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${publicAnonKey}`,
      'X-User-Token': userToken,
    },
    body: JSON.stringify({ base64, mimeType }),
  });

  const result = await uploadResponse.json();
  console.log('[uploadBarPhoto] Réponse Edge Function:', uploadResponse.status, result);
  if (!uploadResponse.ok || result.error) {
    throw new Error(result.error || `Erreur upload (HTTP ${uploadResponse.status})`);
  }
  return result.url;
}

// ==================== SEED ====================

export async function seedDatabase() {
  return apiCall<{ success: boolean; message: string }>('/seed', {
    method: 'POST',
  });
}
