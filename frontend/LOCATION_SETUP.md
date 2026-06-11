# Location & Maps Setup Guide

## Google Maps API Key Setup (Android)

To enable maps on Android, you need to configure a Google Maps API key:

### Steps:

1. **Create a Google Cloud Project**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one

2. **Enable Maps SDK for Android**
   - In the Google Cloud Console, navigate to "APIs & Services" > "Library"
   - Search for "Maps SDK for Android"
   - Click "Enable"

3. **Create an API Key**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "API Key"
   - Copy the generated API key

4. **Restrict the API Key (Recommended)**
   - Click on the API key you just created
   - Under "Application restrictions", select "Android apps"
   - Add your app's package name (e.g., `com.snehealapp`)
   - Add your SHA-1 fingerprint:
     ```bash
     # For debug builds:
     keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
     ```

5. **Add the API Key to app.json**
   - Open `frontend/app.json`
   - Replace `YOUR_GOOGLE_MAPS_API_KEY` with your actual API key:
     ```json
     "android": {
       "config": {
         "googleMaps": {
           "apiKey": "AIza..."
         }
       }
     }
     ```

6. **Rebuild the app**
   ```bash
   cd frontend
   npx expo prebuild --clean
   npx expo run:android
   ```

### iOS Setup

iOS uses Apple Maps and does not require a Google Maps API key. The location permissions are already configured in `app.json`.

## Testing Location Features

### Using Expo Go
- Expo Go supports `expo-location` and `react-native-maps` out of the box
- Grant location permissions when prompted
- On Android, you'll need to add the Google Maps API key to use maps

### Using Development Build
- Run `npx expo prebuild` to generate native folders
- Follow the Android API key setup above
- Build and run: `npx expo run:android` or `npx expo run:ios`

## Troubleshooting

### "Blank map on Android"
- Ensure your Google Maps API key is correctly configured
- Check that "Maps SDK for Android" is enabled in Google Cloud Console
- Verify the API key restrictions match your app's package name and SHA-1

### "Location permission denied"
- Check that permissions are declared in `app.json`
- Grant location permissions in device settings
- The app shows a "Open Settings" button when permission is denied

### "Address not detected"
- Ensure you have an internet connection (required for reverse geocoding)
- Check that location services are enabled on the device
- The app will show coordinates as a fallback if geocoding fails

## Features Implemented

✅ Live location detection with GPS
✅ Fixed center pin (Swiggy-style map interaction)
✅ Reverse geocoding (address detection from coordinates)
✅ "Current location" button to re-center map
✅ Address details form with validation
✅ Local storage with AsyncStorage
✅ iOS and Android compatibility
✅ Permission handling with fallback UI
