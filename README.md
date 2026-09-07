# Digital Passport Photo App

Expo (SDK 57) app that prepares passport/ID photos: pick a country, capture or upload, position the face in an oval, then preview or buy a 6-up print sheet.

## Flow

1. Choose country (US, UK, CA, AU, DE)
2. Take Photo or Upload
3. Adjust — optional background removal, oval positioning, checklist
4. Gallery — Edit, free watermarked Preview (2), or Print sheet ($1 / 6)
5. Share or Print a 4×6 sheet

## Requirements

- Node.js LTS
- EAS CLI for device builds (`npx eas-cli`)
- Physical iOS device / TestFlight for camera, background removal, and IAP

This app needs a **dev client or EAS build** — it is not Expo Go compatible (native modules: IAP, background remover, etc.).

## Setup

```bash
npm install
npx expo start --dev-client
```

## Builds

```bash
# Ad-hoc / internal preview IPA
npx eas-cli build --platform ios --profile preview

# Production / TestFlight
npx eas-cli build --platform ios --profile production
```

OTA updates use EAS Update channels defined in `eas.json`.

## IAP

- Product ID: `com.rgapps.appname.6photos` (consumable)
- Library: `expo-iap`
- Keep the payment screen mounted until StoreKit finishes (do not `router.back()` right after `requestPurchase`)

## Key files

| Path | Role |
|------|------|
| `app/index.js` | Home, country chips, camera/upload |
| `app/adjust_photo.js` | Oval adjust + BG removal |
| `gallery.js` | Processed gallery |
| `app/payment.js` / `app/hooks/useIAP.js` | StoreKit purchase |
| `app/share_print.js` | Print / share sheet |
| `passportConfig.js` | Per-country pixel sizes |
| `app/theme.js` | Shared colors / step labels |

## Permissions

Configured in `app.json` / Info.plist:

- Camera — take passport photo
- Photo Library — upload existing photo
