import type { Companion, Booking, NewBooking, Review, NewReview } from './supabase';

// Demo data used when Supabase is not configured (no .env).
// This keeps the site fully browsable/usable without a backend.
export const demoCompanions: Companion[] = [
  {
    id: 'demo-amani',
    name: 'Amani',
    tagline: 'Sunset strolls & beach picnics',
    bio: 'Born and raised in Diani, Amani knows every hidden cove along the coast. Warm, easy-going, and a great storyteller — the perfect companion for a relaxed afternoon by the ocean.',
    age: 26,
    location: 'Diani Beach',
    languages: ['English', 'Swahili'],
    interests: ['Beach walks', 'Snorkeling', 'Sunset cruises', 'Photography'],
    price_per_hour: 2500,
    rating: 4.9,
    reviews: 37,
    verified: true,
    available: true,
    image_url: 'https://images.pexels.com/photos/1858175/pexels-photo-1858175.jpeg?auto=compress&cs=tinysrgb&w=800',
    gallery: [
      'https://images.pexels.com/photos/1457897/pexels-photo-1457897.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/189296/pexels-photo-189296.jpeg?auto=compress&cs=tinysrgb&w=800',
    ],
    created_at: new Date().toISOString(),
  },
  {
    id: 'demo-zawadi',
    name: 'Zawadi',
    tagline: 'Nightlife & live music nights',
    bio: 'Loves the Diani nightlife scene and knows the best beach bars and live music spots. High energy, great dancer, and always up for a fun evening out.',
    age: 24,
    location: 'Galu',
    languages: ['English', 'Swahili', 'French'],
    interests: ['Nightlife', 'Live music', 'Dining', 'Dancing'],
    price_per_hour: 3000,
    rating: 4.8,
    reviews: 29,
    verified: true,
    available: true,
    image_url: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=800',
    gallery: [
      'https://images.pexels.com/photos/2167673/pexels-photo-2167673.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/3787839/pexels-photo-3787839.jpeg?auto=compress&cs=tinysrgb&w=800',
    ],
    created_at: new Date().toISOString(),
  },
  {
    id: 'demo-jabari',
    name: 'Jabari',
    tagline: 'Safari & adventure guide',
    bio: 'Experienced in organising day trips to Shimba Hills and marine safaris at Kisite-Mpunguti. Calm, knowledgeable, and safety-first.',
    age: 31,
    location: 'Ukunda',
    languages: ['English', 'Swahili', 'Kikuyu'],
    interests: ['Safari', 'Snorkeling', 'Hiking', 'Wildlife'],
    price_per_hour: 3500,
    rating: 5.0,
    reviews: 52,
    verified: true,
    available: true,
    image_url: 'https://images.pexels.com/photos/2204573/pexels-photo-2204573.jpeg?auto=compress&cs=tinysrgb&w=800',
    gallery: [
      'https://images.pexels.com/photos/247431/pexels-photo-247431.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/3408353/pexels-photo-3408353.jpeg?auto=compress&cs=tinysrgb&w=800',
    ],
    created_at: new Date().toISOString(),
  },
  {
    id: 'demo-lina',
    name: 'Lina',
    tagline: 'Wellness & yoga retreats',
    bio: 'Certified yoga instructor offering sunrise sessions on the beach and wellness walks. Gentle, attentive, and deeply calming presence.',
    age: 28,
    location: 'Diani Beach',
    languages: ['English', 'Swahili', 'German'],
    interests: ['Yoga', 'Wellness', 'Beach walks', 'Meditation'],
    price_per_hour: 2800,
    rating: 4.7,
    reviews: 18,
    verified: true,
    available: false,
    image_url: 'https://images.pexels.com/photos/3865711/pexels-photo-3865711.jpeg?auto=compress&cs=tinysrgb&w=800',
    gallery: [
      'https://images.pexels.com/photos/3822906/pexels-photo-3822906.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/1051838/pexels-photo-1051838.jpeg?auto=compress&cs=tinysrgb&w=800',
    ],
    created_at: new Date().toISOString(),
  },
  {
    id: 'demo-kofi',
    name: 'Kofi',
    tagline: 'Dining & cultural tours',
    bio: 'Foodie and culture enthusiast. Knows the best Swahili kitchens in Ukunda and the history behind Diani. Great conversationist.',
    age: 30,
    location: 'Diani Beach',
    languages: ['English', 'Swahili'],
    interests: ['Dining', 'Culture', 'Shopping', 'Sightseeing'],
    price_per_hour: 2200,
    rating: 4.6,
    reviews: 14,
    verified: false,
    available: true,
    image_url: 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=800',
    gallery: [
      'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/696218/pexels-photo-696218.jpeg?auto=compress&cs=tinysrgb&w=800',
    ],
    created_at: new Date().toISOString(),
  },
  {
    id: 'demo-nia',
    name: 'Nia',
    tagline: 'Water sports & boat trips',
    bio: 'Loves the ocean. Organises dhow trips, kite surfing sessions, and reef snorkelling. Adventurous, fit, and always smiling.',
    age: 25,
    location: 'Galu',
    languages: ['English', 'Swahili', 'Italian'],
    interests: ['Kite surfing', 'Snorkeling', 'Dhow trips', 'Fishing'],
    price_per_hour: 3200,
    rating: 4.9,
    reviews: 41,
    verified: true,
    available: true,
    image_url: 'https://images.pexels.com/photos/2167394/pexels-photo-2167394.jpeg?auto=compress&cs=tinysrgb&w=800',
    gallery: [
      'https://images.pexels.com/photos/261383/pexels-photo-261383.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/1010657/pexels-photo-1010657.jpeg?auto=compress&cs=tinysrgb&w=800',
    ],
    created_at: new Date().toISOString(),
  },
];

export const demoReviews: Record<string, Review[]> = {
  'demo-amani': [
    {
      id: 'r1',
      companion_id: 'demo-amani',
      reviewer_name: 'Sarah M.',
      rating: 5,
      comment: 'Amani made our beach day unforgettable. Knows all the best spots!',
      created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    },
  ],
  'demo-jabari': [
    {
      id: 'r2',
      companion_id: 'demo-jabari',
      reviewer_name: 'Tom K.',
      rating: 5,
      comment: 'Incredible safari guide. Felt safe and learned so much.',
      created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    },
  ],
};

export function findDemoCompanion(id: string): Companion | undefined {
  return demoCompanions.find((c) => c.id === id);
}

// Demo booking/review sinks (kept in-memory so the flows still work).
export function demoInsertBooking(booking: NewBooking): Booking {
  return {
    ...booking,
    id: 'demo-bk-' + Math.random().toString(36).slice(2, 10),
    status: 'pending',
    created_at: new Date().toISOString(),
  };
}

export function demoInsertReview(review: NewReview): Review {
  return {
    ...review,
    id: 'demo-rv-' + Math.random().toString(36).slice(2, 10),
    created_at: new Date().toISOString(),
  };
}
