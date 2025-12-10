export interface Bar {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  photo: string;
  happyHourStart: string;
  happyHourEnd: string;
  prices: {
    beer: number;
    cocktail: number;
  };
  rating: number;
  type: string;
  reviewCount?: number;
}

export interface Review {
  id: string;
  barId?: string;
  userId: string;
  userName: string;
  userAvatar: string;
  rating: number;
  comment: string;
  date: string;
  photo?: string;
}