# Digital Passport Photo App

This is a skeleton React Native Digital Passport Photo App built with Expo.

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

### Development

The app uses the Metro bundler. You can run the app in a simulator or on a physical device using the Expo Go app.

1. **Start the Metro bundler:**

```bash
npm start
```

This will open the Expo Dev Tools in your browser. You can then choose to run the app on an iOS simulator, Android emulator, or scan the QR code with the Expo Go app on your physical device.

### Custom Development Client

The app is configured with a custom URI scheme (`myapp://`) for use with a custom development client.

1. **Build the development client:**

```bash
eas build --profile development --platform ios
```

2. **Install the client on a simulator or device.**

3. **Start the Metro bundler:**

```bash
npm start
```

4. **Open the app in the development client.**

## Building for Production

You can build the app for production using EAS Build.

```bash
eas build --platform ios
```

## Permissions

The `app.json` file is configured with the necessary permissions for accessing the camera and photo library.

- **Camera:** `NSCameraUsageDescription`
- **Photo Library:** `NSPhotoLibraryUsageDescription`

## Debugging

You can debug the app using the standard React Native debugging tools.

- **Shake your device** or press `Cmd+D` (iOS simulator) or `Cmd+M` (Android emulator) to open the developer menu.
- **Enable "Debug JS Remotely"** to debug the app in Chrome.
- **Use Flipper** for more advanced debugging.
