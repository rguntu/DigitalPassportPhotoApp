
const sharp = require('sharp');

sharp('assets/splash.png')
  .composite([{ input: 'assets/icon.png', gravity: 'center' }])
  .toFile('assets/splash.png', (err, info) => {
    if (err) {
      console.error(err);
    } else {
      console.log('Image composited successfully:', info);
    }
  });
