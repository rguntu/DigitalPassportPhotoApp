# Digital Passport Photo App

This is a React Native Digital Passport Photo App built with Expo. The app allows users to either take a photo using their device's camera or upload an existing photo from their media library.

## Features

- **Take a Photo:** Request camera permission and (in the future) open the camera to take a photo.
- **Upload a Photo:** Request media library permission and open the image picker to select a photo.

## Prerequisites

- Node.js (LTS version)
- Xcode (for iOS development)
- Android Studio (for Android development)
- Expo CLI

```bash
npm install -g expo-cli
```

## Setup

1. **Clone the repository:**

```bash
git clone <repository-url>
cd digital-passport-photo-app
```

2. **Install dependencies:**

```bash
npm install
```

## Running the App

The app uses the Metro bundler. You can run the app in a simulator or on a physical device using the Expo Go app.

1. **Start the Metro bundler:**

```bash
npm start
```

This will open the Expo Dev Tools in your browser. You can then choose to run the app on an iOS simulator, Android emulator, or scan the QR code with the Expo Go app on your physical device.

## Building for Production

You can build the app for production using EAS Build.

```bash
eas build --platform ios
```

## Permissions

The `app.json` file is configured with the necessary permissions for accessing the camera and photo library for iOS.

- **Camera:** `NSCameraUsageDescription`
- **Photo Library:** `NSPhotoLibraryUsageDescription`

## Project Structure

- `app/`: Contains the source code for the app.
  - `_layout.js`: Defines the root layout and navigation.
  - `index.js`: The main screen of the app.
- `assets/`: Contains static assets like images and fonts.
- `app.json`: The configuration file for the Expo app.
- `package.json`: Lists the project dependencies and scripts.