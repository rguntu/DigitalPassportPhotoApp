# Digital Passport Photo App Features

This document outlines the current features of the Digital Passport Photo App.

## Core Features

- **Take Photo:** Users can take a new photo using their device's camera.
- **Upload Photo:** Users can select an existing photo from their device's image library.
- **Resolution Check:** Uploaded photos are checked to ensure they meet a minimum resolution of 600x600 pixels. If the resolution is too low, the user is prompted to select a higher-quality image.
- **Photo Preview:** After taking or selecting a photo, a preview is displayed, allowing the user to confirm their selection before saving.
- **Save Photo:** Valid photos can be saved to the device's local storage for later use.

## Gallery and Image Processing

- **Photo Gallery:** All saved photos are displayed in a gallery view.
- **Background Removal:** Photos in the gallery can be processed to remove the background (this feature is only available on real devices, not simulators).
- **Cropping and Resizing:** After background removal, photos are automatically cropped to a square and resized to 600x600 pixels.
- **Processed Photo Storage:** Processed photos are saved as new images in the gallery.
