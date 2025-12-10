import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';
import { createClient } from 'npm:@supabase/supabase-js@2';
import * as kv from './kv_store.tsx';

const app = new Hono();

// Middleware
app.use('*', cors());
app.use('*', logger(console.log));

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

// Helper to verify user authentication
async function verifyAuth(authHeader: string | null) {
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.split(' ')[1];
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    return null;
  }
  return user;
}

// ==================== AUTH ROUTES ====================

// Sign up
app.post('/make-server-0b067e93/signup', async (c) => {
  try {
    const { email, password, name } = await c.req.json();
    
    if (!email || !password || !name) {
      return c.json({ error: 'Email, password et nom requis' }, 400);
    }

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name },
      // Automatically confirm the user's email since an email server hasn't been configured.
      email_confirm: true,
    });

    if (error) {
      console.log('Signup error:', error);
      return c.json({ error: error.message }, 400);
    }

    return c.json({ user: data.user });
  } catch (error) {
    console.log('Signup server error:', error);
    return c.json({ error: 'Erreur lors de l\'inscription' }, 500);
  }
});

// ==================== BAR ROUTES ====================

// Get all bars
app.get('/make-server-0b067e93/bars', async (c) => {
  try {
    const bars = await kv.getByPrefix('bar:');
    return c.json({ bars: bars.map(b => b.value) });
  } catch (error) {
    console.log('Error fetching bars:', error);
    return c.json({ error: 'Erreur lors de la récupération des bars' }, 500);
  }
});

// Get single bar
app.get('/make-server-0b067e93/bars/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const bar = await kv.get(`bar:${id}`);
    
    if (!bar) {
      return c.json({ error: 'Bar non trouvé' }, 404);
    }

    // Get reviews for this bar
    const reviews = await kv.getByPrefix(`review:${id}:`);
    
    return c.json({
      bar: {
        ...bar,
        reviews: reviews.map(r => r.value),
      },
    });
  } catch (error) {
    console.log('Error fetching bar:', error);
    return c.json({ error: 'Erreur lors de la récupération du bar' }, 500);
  }
});

// Create bar (no auth required for prototype)
app.post('/make-server-0b067e93/bars', async (c) => {
  try {
    const barData = await c.req.json();
    const id = crypto.randomUUID();
    
    const bar = {
      id,
      ...barData,
      createdAt: new Date().toISOString(),
    };

    await kv.set(`bar:${id}`, bar);
    return c.json({ bar });
  } catch (error) {
    console.log('Error creating bar:', error);
    return c.json({ error: 'Erreur lors de la création du bar' }, 500);
  }
});

// Update bar
app.put('/make-server-0b067e93/bars/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const updates = await c.req.json();
    
    const existingBar = await kv.get(`bar:${id}`);
    if (!existingBar) {
      return c.json({ error: 'Bar non trouvé' }, 404);
    }

    const updatedBar = {
      ...existingBar,
      ...updates,
      id, // Keep original ID
      updatedAt: new Date().toISOString(),
    };

    await kv.set(`bar:${id}`, updatedBar);
    return c.json({ bar: updatedBar });
  } catch (error) {
    console.log('Error updating bar:', error);
    return c.json({ error: 'Erreur lors de la mise à jour du bar' }, 500);
  }
});

// Delete bar
app.delete('/make-server-0b067e93/bars/:id', async (c) => {
  try {
    const id = c.req.param('id');
    
    // Delete bar
    await kv.del(`bar:${id}`);
    
    // Delete all reviews for this bar
    const reviews = await kv.getByPrefix(`review:${id}:`);
    for (const review of reviews) {
      await kv.del(review.key);
    }

    return c.json({ success: true });
  } catch (error) {
    console.log('Error deleting bar:', error);
    return c.json({ error: 'Erreur lors de la suppression du bar' }, 500);
  }
});

// ==================== REVIEW ROUTES ====================

// Get reviews for a bar
app.get('/make-server-0b067e93/bars/:barId/reviews', async (c) => {
  try {
    const barId = c.req.param('barId');
    const reviews = await kv.getByPrefix(`review:${barId}:`);
    return c.json({ reviews: reviews.map(r => r.value) });
  } catch (error) {
    console.log('Error fetching reviews:', error);
    return c.json({ error: 'Erreur lors de la récupération des avis' }, 500);
  }
});

// Add review (requires authentication)
app.post('/make-server-0b067e93/bars/:barId/reviews', async (c) => {
  try {
    const user = await verifyAuth(c.req.header('Authorization'));
    if (!user) {
      return c.json({ error: 'Authentification requise' }, 401);
    }

    const barId = c.req.param('barId');
    const { rating, comment, photo } = await c.req.json();

    if (!rating || rating < 1 || rating > 5) {
      return c.json({ error: 'Note invalide (1-5)' }, 400);
    }

    const reviewId = crypto.randomUUID();
    const review = {
      id: reviewId,
      barId,
      userId: user.id,
      userName: user.user_metadata?.name || user.email,
      userAvatar: user.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`,
      rating,
      comment: comment || '',
      photo: photo || null,
      date: new Date().toISOString(),
    };

    await kv.set(`review:${barId}:${reviewId}`, review);

    // Update bar rating
    const bar = await kv.get(`bar:${barId}`);
    if (bar) {
      const allReviews = await kv.getByPrefix(`review:${barId}:`);
      const reviews = allReviews.map(r => r.value);
      const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
      const avgRating = totalRating / reviews.length;

      await kv.set(`bar:${barId}`, {
        ...bar,
        rating: Math.round(avgRating * 10) / 10,
        reviewCount: reviews.length,
      });
    }

    return c.json({ review });
  } catch (error) {
    console.log('Error creating review:', error);
    return c.json({ error: 'Erreur lors de la création de l\'avis' }, 500);
  }
});

// ==================== SEED DATA ROUTE ====================

// Initialize database with mock data
app.post('/make-server-0b067e93/seed', async (c) => {
  try {
    const mockBars = [
      {
        id: '1',
        name: 'Le Comptoir Moderne',
        address: '15 Rue du Temple, 75004 Paris',
        latitude: 48.8566,
        longitude: 2.3522,
        photo: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800',
        happyHourStart: '17:00',
        happyHourEnd: '20:00',
        prices: { beer: 3.5, cocktail: 6.0 },
        rating: 4.5,
        type: 'Bar à cocktails',
        reviewCount: 2,
      },
      {
        id: '2',
        name: 'Le Sunset Lounge',
        address: '28 Avenue des Champs-Élysées, 75008 Paris',
        latitude: 48.8698,
        longitude: 2.3078,
        photo: 'https://images.unsplash.com/photo-1543007630-9710e4a00a20?w=800',
        happyHourStart: '18:00',
        happyHourEnd: '21:00',
        prices: { beer: 4.0, cocktail: 7.5 },
        rating: 4.2,
        type: 'Lounge bar',
        reviewCount: 1,
      },
      {
        id: '3',
        name: 'Chez Marcel',
        address: '42 Rue de Rivoli, 75004 Paris',
        latitude: 48.8572,
        longitude: 2.3556,
        photo: 'https://images.unsplash.com/photo-1566417713940-fe7c737a9ef2?w=800',
        happyHourStart: '17:30',
        happyHourEnd: '19:30',
        prices: { beer: 3.0, cocktail: 5.5 },
        rating: 4.7,
        type: 'Bar traditionnel',
        reviewCount: 2,
      },
      {
        id: '4',
        name: 'The Irish Pub',
        address: '8 Boulevard Saint-Germain, 75005 Paris',
        latitude: 48.8530,
        longitude: 2.3499,
        photo: 'https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=800',
        happyHourStart: '16:00',
        happyHourEnd: '19:00',
        prices: { beer: 3.5, cocktail: 6.5 },
        rating: 4.3,
        type: 'Pub irlandais',
        reviewCount: 1,
      },
      {
        id: '5',
        name: 'La Terrasse Parisienne',
        address: '55 Rue de la Roquette, 75011 Paris',
        latitude: 48.8553,
        longitude: 2.3752,
        photo: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800',
        happyHourStart: '18:00',
        happyHourEnd: '20:30',
        prices: { beer: 4.5, cocktail: 8.0 },
        rating: 4.6,
        type: 'Bar branché',
        reviewCount: 2,
      },
      {
        id: '6',
        name: 'Le Zinc',
        address: '12 Rue Montorgueil, 75001 Paris',
        latitude: 48.8634,
        longitude: 2.3467,
        photo: 'https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=800',
        happyHourStart: '17:00',
        happyHourEnd: '19:00',
        prices: { beer: 2.5, cocktail: 5.0 },
        rating: 4.8,
        type: 'Bar de quartier',
        reviewCount: 1,
      },
    ];

    const mockReviews = [
      { barId: '1', id: 'r1', userId: 'demo1', userName: 'Marie Dubois', userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100', rating: 5, comment: 'Ambiance géniale et prix imbattables pendant l\'happy hour !', date: '2025-11-15' },
      { barId: '1', id: 'r2', userId: 'demo2', userName: 'Thomas Martin', userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100', rating: 4, comment: 'Super rapport qualité/prix, les cocktails sont excellents.', date: '2025-11-10' },
      { barId: '2', id: 'r3', userId: 'demo3', userName: 'Sophie Leroy', userAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100', rating: 4, comment: 'Belle terrasse, parfait pour l\'apéro entre amis.', date: '2025-11-12' },
      { barId: '3', id: 'r4', userId: 'demo4', userName: 'Pierre Durand', userAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100', rating: 5, comment: 'Meilleur rapport qualité/prix du quartier ! Ambiance conviviale.', date: '2025-11-18' },
      { barId: '3', id: 'r5', userId: 'demo5', userName: 'Julie Bernard', userAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100', rating: 4, comment: 'Très bon accueil, prix corrects.', date: '2025-11-16' },
      { barId: '4', id: 'r6', userId: 'demo6', userName: 'Lucas Petit', userAvatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100', rating: 4, comment: 'Happy hour généreux, bonne ambiance pour regarder les matchs.', date: '2025-11-14' },
      { barId: '5', id: 'r7', userId: 'demo7', userName: 'Emma Rousseau', userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100', rating: 5, comment: 'Terrasse magnifique, cocktails créatifs et happy hour top !', date: '2025-11-17' },
      { barId: '5', id: 'r8', userId: 'demo8', userName: 'Alexandre Moreau', userAvatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100', rating: 4, comment: 'Un peu cher mais la qualité est au rendez-vous.', date: '2025-11-13' },
      { barId: '6', id: 'r9', userId: 'demo9', userName: 'Camille Dubois', userAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100', rating: 5, comment: 'Le meilleur bar du coin ! Prix imbattables et serveurs sympas.', date: '2025-11-19' },
    ];

    // Store bars
    for (const bar of mockBars) {
      await kv.set(`bar:${bar.id}`, bar);
    }

    // Store reviews
    for (const review of mockReviews) {
      await kv.set(`review:${review.barId}:${review.id}`, review);
    }

    return c.json({ success: true, message: 'Base de données initialisée avec succès' });
  } catch (error) {
    console.log('Error seeding database:', error);
    return c.json({ error: 'Erreur lors de l\'initialisation' }, 500);
  }
});

// Health check
app.get('/make-server-0b067e93/health', (c) => {
  return c.json({ status: 'ok' });
});

Deno.serve(app.fetch);
