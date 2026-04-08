import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import * as kv from './kv_store.ts';

const app = new Hono();
const BASE = '/make-server-0b067e93';

app.use('*', cors());

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

async function verifyAuth(c: any) {
  // Le token user est transmis via X-User-Token (l'Authorization contient la clé anon)
  const userToken = c.req.header('X-User-Token');
  if (!userToken) return null;
  const { data: { user }, error } = await supabase.auth.getUser(userToken);
  if (error || !user) return null;
  return user;
}

// ==================== AUTH ====================

app.post(`${BASE}/signup`, async (c) => {
  try {
    const { email, password, firstName, lastName, name } = await c.req.json();
    if (!email || !password) return c.json({ error: 'Email et password requis' }, 400);
    const displayName = name || `${firstName || ''} ${lastName || ''}`.trim() || 'Utilisateur';
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { firstName: firstName || '', lastName: lastName || '', name: displayName },
      email_confirm: true,
    });
    if (error) return c.json({ error: error.message }, 400);
    return c.json({ user: data.user });
  } catch (error) {
    return c.json({ error: "Erreur lors de l'inscription" }, 500);
  }
});

// ==================== BARS ====================

app.get(`${BASE}/bars`, async (c) => {
  try {
    const bars = await kv.getByPrefix('bar:');
    return c.json({ bars: bars.map((b: any) => b.value) });
  } catch (error) {
    return c.json({ error: 'Erreur lors de la récupération des bars' }, 500);
  }
});

app.get(`${BASE}/bars/:id`, async (c) => {
  try {
    const id = c.req.param('id');
    const bar = await kv.get(`bar:${id}`);
    if (!bar) return c.json({ error: 'Bar non trouvé' }, 404);
    const reviews = await kv.getByPrefix(`review:${id}:`);
    return c.json({ bar: { ...bar, reviews: reviews.map((r: any) => r.value) } });
  } catch (error) {
    return c.json({ error: 'Erreur lors de la récupération du bar' }, 500);
  }
});

app.post(`${BASE}/bars`, async (c) => {
  try {
    const barData = await c.req.json();
    const id = crypto.randomUUID();
    const bar = { id, ...barData, createdAt: new Date().toISOString() };
    await kv.set(`bar:${id}`, bar);
    return c.json({ bar });
  } catch (error) {
    return c.json({ error: 'Erreur lors de la création du bar' }, 500);
  }
});

app.put(`${BASE}/bars/:id`, async (c) => {
  try {
    const id = c.req.param('id');
    const updates = await c.req.json();
    const existingBar = await kv.get(`bar:${id}`);
    if (!existingBar) return c.json({ error: 'Bar non trouvé' }, 404);
    const updatedBar = { ...existingBar, ...updates, id, updatedAt: new Date().toISOString() };
    await kv.set(`bar:${id}`, updatedBar);
    return c.json({ bar: updatedBar });
  } catch (error) {
    return c.json({ error: 'Erreur lors de la mise à jour du bar' }, 500);
  }
});

app.delete(`${BASE}/bars/:id`, async (c) => {
  try {
    const id = c.req.param('id');
    await kv.del(`bar:${id}`);
    const reviews = await kv.getByPrefix(`review:${id}:`);
    for (const review of reviews) await kv.del(review.key);
    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: 'Erreur lors de la suppression du bar' }, 500);
  }
});

// ==================== REVIEWS ====================

app.get(`${BASE}/bars/:barId/reviews`, async (c) => {
  try {
    const barId = c.req.param('barId');
    const reviews = await kv.getByPrefix(`review:${barId}:`);
    return c.json({ reviews: reviews.map((r: any) => r.value) });
  } catch (error) {
    return c.json({ error: 'Erreur lors de la récupération des avis' }, 500);
  }
});

app.post(`${BASE}/bars/:barId/reviews`, async (c) => {
  try {
    const user = await verifyAuth(c);
    if (!user) return c.json({ error: 'Authentification requise' }, 401);

    const barId = c.req.param('barId');
    const { rating, comment, photo } = await c.req.json();
    if (!rating || rating < 1 || rating > 5) return c.json({ error: 'Note invalide (1-5)' }, 400);

    const reviewId = crypto.randomUUID();
    const review = {
      id: reviewId, barId, userId: user.id,
      userName: user.user_metadata?.name || user.email,
      userAvatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`,
      rating, comment: comment || '', photo: photo || null,
      date: new Date().toISOString(),
    };

    await kv.set(`review:${barId}:${reviewId}`, review);

    const bar = await kv.get(`bar:${barId}`);
    if (bar) {
      const allReviews = await kv.getByPrefix(`review:${barId}:`);
      const total = allReviews.reduce((sum: number, r: any) => sum + (r.value?.rating || 0), 0);
      await kv.set(`bar:${barId}`, { ...bar, rating: Math.round((total / allReviews.length) * 10) / 10, reviewCount: allReviews.length });
    }

    return c.json({ review });
  } catch (error) {
    return c.json({ error: "Erreur lors de la création de l'avis" }, 500);
  }
});

// ==================== SEED ====================

app.post(`${BASE}/seed`, async (c) => {
  try {
    const bordeauxBars = [
      { id: '1', name: 'HMS Victory', address: '3 Place Général Sarrail, 33000 Bordeaux', latitude: 44.8321599, longitude: -0.5726315, photo: 'https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=800', happyHourStart: '16:00', happyHourEnd: '19:00', prices: { beer: 4.0, cocktail: 6.5 }, rating: 4.6, type: 'Pub anglais', reviewCount: 3 },
      { id: '2', name: 'The Grizzly Pub', address: '12 Place de la Victoire, 33000 Bordeaux', latitude: 44.8304465, longitude: -0.5722539, photo: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800', happyHourStart: '18:00', happyHourEnd: '21:00', prices: { beer: 4.0, cocktail: 7.0 }, rating: 4.3, type: 'Pub éco-responsable', reviewCount: 2 },
      { id: '3', name: 'Balthazar', address: '8 Rue des Augustins, 33000 Bordeaux', latitude: 44.8324301, longitude: -0.5710858, photo: 'https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=800', happyHourStart: '16:00', happyHourEnd: '20:00', prices: { beer: 5.0, cocktail: 7.5 }, rating: 4.7, type: 'Bar à bières', reviewCount: 4 },
      { id: '4', name: 'Café Auguste', address: '3 Place de la Victoire, 33000 Bordeaux', latitude: 44.8312328, longitude: -0.5721801, photo: 'https://images.unsplash.com/photo-1543007630-9710e4a00a20?w=800', happyHourStart: '18:00', happyHourEnd: '21:00', prices: { beer: 3.5, cocktail: 6.0 }, rating: 4.4, type: 'Bar café', reviewCount: 2 },
      { id: '5', name: 'Le Lucifer', address: '35 Rue de Pessac, 33000 Bordeaux', latitude: 44.8304672, longitude: -0.5799719, photo: 'https://images.unsplash.com/photo-1566417713940-fe7c737a9ef2?w=800', happyHourStart: '18:00', happyHourEnd: '21:00', prices: { beer: 5.0, cocktail: 6.5 }, rating: 4.5, type: 'Bar à bières belges', reviewCount: 3 },
      { id: '6', name: 'Zig Zag', address: "73 Cours de l'Argonne, 33000 Bordeaux", latitude: 44.8283774, longitude: -0.5746145, photo: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800', happyHourStart: '17:00', happyHourEnd: '20:00', prices: { beer: 4.0, cocktail: 7.0 }, rating: 4.4, type: 'Bar festif', reviewCount: 2 },
    ];

    const existingBars = await kv.getByPrefix('bar:');
    for (const item of existingBars) await kv.del(item.key);
    const existingReviews = await kv.getByPrefix('review:');
    for (const item of existingReviews) await kv.del(item.key);

    for (const bar of bordeauxBars) await kv.set(`bar:${bar.id}`, bar);

    return c.json({ success: true, message: '6 bars de La Victoire ajoutés !' });
  } catch (error) {
    return c.json({ error: "Erreur lors de l'initialisation" }, 500);
  }
});

// Crée le bucket de stockage pour les photos de bars (appeler une seule fois)
app.post(`${BASE}/setup-storage`, async (c) => {
  try {
    const { data: existing } = await supabase.storage.getBucket('bar-photos');
    if (existing) return c.json({ success: true, message: 'Bucket déjà existant' });

    const { error } = await supabase.storage.createBucket('bar-photos', {
      public: true,
      fileSizeLimit: 5 * 1024 * 1024,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    });
    if (error) return c.json({ error: error.message }, 500);
    return c.json({ success: true, message: 'Bucket bar-photos créé' });
  } catch (err) {
    return c.json({ error: 'Erreur création bucket' }, 500);
  }
});

// Upload une photo de bar (reçoit base64, stocke dans Supabase Storage via service role)
app.post(`${BASE}/upload-photo`, async (c) => {
  try {
    const user = await verifyAuth(c);
    if (!user) return c.json({ error: 'Authentification requise' }, 401);

    const { base64, mimeType = 'image/jpeg' } = await c.req.json();
    if (!base64) return c.json({ error: 'Données image manquantes' }, 400);

    // Créer le bucket s'il n'existe pas encore
    const { data: existingBucket } = await supabase.storage.getBucket('bar-photos');
    if (!existingBucket) {
      const { error: bucketError } = await supabase.storage.createBucket('bar-photos', {
        public: true,
        fileSizeLimit: 5242880, // 5 MB
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
      });
      if (bucketError && bucketError.message !== 'The resource already exists') {
        return c.json({ error: `Impossible de créer le bucket: ${bucketError.message}` }, 500);
      }
    }

    const ext = mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : 'jpg';
    const fileName = `bar-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    // Décoder le base64 en binaire
    const binaryStr = atob(base64);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);

    const { error: uploadError } = await supabase.storage
      .from('bar-photos')
      .upload(fileName, bytes, { contentType: mimeType, upsert: false });

    if (uploadError) return c.json({ error: uploadError.message }, 500);

    const { data: { publicUrl } } = supabase.storage.from('bar-photos').getPublicUrl(fileName);
    return c.json({ url: publicUrl });
  } catch (err: any) {
    return c.json({ error: err.message || "Erreur lors de l'upload" }, 500);
  }
});

app.get(`${BASE}/health`, (c) => c.json({ status: 'ok' }));

app.all('*', (c) => c.json({ error: 'Route not found', path: c.req.path }, 404));

Deno.serve(app.fetch);
