# Plan B - Bar Finder App (React Native)

A React Native mobile application for finding the best happy hours in Paris. Built with Expo, TypeScript, and NativeWind (Tailwind CSS for React Native).

## 🚀 Features

- **Browse Bars**: View bars in list or map view
- **Happy Hour Tracking**: Filter bars by active happy hour status
- **Real-time Location**: Find bars near you using GPS
- **User Authentication**: Sign up and login with Supabase
- **Reviews & Ratings**: Add and view bar reviews
- **Smart Filtering**: Sort by rating, price, or distance
- **Beautiful UI**: Modern design with NativeWind styling

## 📱 Tech Stack

- **Framework**: React Native with Expo
- **Navigation**: Expo Router (file-based routing)
- **Styling**: NativeWind (Tailwind CSS for React Native)
- **Backend**: Supabase (Auth & Database)
- **Maps**: React Native Maps
- **Language**: TypeScript
- **Storage**: AsyncStorage

## 🛠️ Setup Instructions

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Expo CLI
- iOS Simulator (Mac) or Android Emulator
- Expo Go app on your physical device (optional)

### Installation

1. **Install dependencies**:
```bash
npm install
```

2. **Configure Supabase**:
   - Update `src/utils/supabase/info.tsx` with your Supabase credentials:
     ```typescript
     export const projectId = 'YOUR_PROJECT_ID';
     export const publicAnonKey = 'YOUR_ANON_KEY';
     ```

3. **Configure Google Maps** (for Android):
   - Get a Google Maps API key from [Google Cloud Console](https://console.cloud.google.com/)
   - Update `app.json`:
     ```json
     "android": {
       "config": {
         "googleMaps": {
           "apiKey": "YOUR_GOOGLE_MAPS_API_KEY"
         }
       }
     }
     ```

### Running the App

**Start Expo development server**:
```bash
npm start
```

**Run on iOS Simulator** (Mac only):
```bash
npm run ios
```

**Run on Android Emulator**:
```bash
npm run android
```

**Run on physical device**:
1. Install Expo Go from App Store or Play Store
2. Scan the QR code from the terminal

## 📁 Project Structure

```
├── app/                    # Expo Router screens
│   ├── _layout.tsx        # Root layout
│   ├── index.tsx          # Home screen (list/map view)
│   └── bar/
│       └── [id].tsx       # Bar detail screen
├── src/
│   ├── components/        # React Native components
│   │   ├── BarCard.tsx
│   │   ├── MapView.tsx
│   │   ├── FilterBar.tsx
│   │   ├── AuthModal.tsx
│   │   └── AddReviewModal.tsx
│   ├── types/            # TypeScript types
│   ├── utils/            # Utilities
│   │   ├── api.ts       # API functions
│   │   └── supabase/    # Supabase client
│   ├── data/            # Mock data
│   └── styles/          # Global styles
├── app.json             # Expo configuration
├── package.json
└── tsconfig.json        # TypeScript configuration
```

## 🎨 Key Components

### Home Screen (`app/index.tsx`)
- Toggle between list and map view
- Filter by happy hour status
- Sort bars by various criteria
- User authentication

### Bar Detail Screen (`app/bar/[id].tsx`)
- Full bar information
- Happy hour pricing
- User reviews
- Add review functionality

### Map View (`src/components/MapView.tsx`)
- Interactive map with markers
- Color-coded for happy hour status
- Marker clustering
- User location

## 🔑 Environment Variables

Create assets for your app:

### Required Assets (place in `assets/` folder)
- `icon.png` - App icon (1024x1024)
- `splash.png` - Splash screen (2048x2048)
- `adaptive-icon.png` - Android adaptive icon (1024x1024)
- `favicon.png` - Web favicon (48x48)

## 🌐 API Integration

The app uses a Supabase backend with the following endpoints:

- `GET /bars` - Get all bars
- `GET /bars/:id` - Get single bar
- `GET /bars/:id/reviews` - Get bar reviews
- `POST /bars/:id/reviews` - Add review
- `POST /seed` - Seed database with mock data
- `POST /signup` - User registration

## 📝 Development Notes

### NativeWind Setup
This project uses NativeWind v4 for styling. All Tailwind classes work directly in React Native components using the `className` prop.

### Navigation
File-based routing with Expo Router. Each file in the `app/` directory becomes a route automatically.

### State Management
Uses React hooks (useState, useEffect) and AsyncStorage for persistence.

### Authentication
Supabase Auth with email/password. Session stored in AsyncStorage.

## 🐛 Troubleshooting

**Metro bundler issues**:
```bash
npx expo start --clear
```

**iOS build issues**:
```bash
cd ios && pod install && cd ..
```

**TypeScript errors**:
```bash
rm -rf node_modules
npm install
```

## 📱 Building for Production

### iOS
```bash
expo build:ios
```

### Android
```bash
expo build:android
```

Or use EAS Build for modern workflow:
```bash
eas build --platform ios
eas build --platform android
```

## 📄 License

This project is private and proprietary.

## 👥 Contributing

This is a private project. Contact the maintainer for contribution guidelines.

## 📧 Support

For support, email your-email@example.com or open an issue in the repository.

---

Built with ❤️ using React Native and Expo
