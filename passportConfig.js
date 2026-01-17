export const passportConfigs = {
  US: {
    countryCode: "US",
    outputWidthPx: 600, // 2 inches at 300 DPI
    outputHeightPx: 600, // 2 inches at 300 DPI
    // Head size: 1 inch to 1 3/8 inches (25 mm to 35 mm)
    // In pixels (at 300 DPI, 1 inch = 300px): 300px to 412.5px
    headHeightMinPx: 300,
    headHeightMaxPx: 412.5,
    // Eye height: 1 1/8 inches to 1 3/8 inches (28 mm to 35 mm) from bottom
    // In pixels (at 300 DPI): 337.5px to 412.5px from bottom
    eyeHeightFromBottomMinPx: 337.5,
    eyeHeightFromBottomMaxPx: 412.5,
    background: "white",
  },
  UK: {
    countryCode: "UK",
    // Standard is 35mm x 45mm. Using a higher resolution for quality.
    // Aspect ratio: 35/45 = 0.777...
    outputWidthPx: 1050, // 35mm @ 762 DPI
    outputHeightPx: 1350, // 45mm @ 762 DPI
    // Head size: 29mm to 34mm from crown to chin.
    // 29mm @ 762 DPI = ~870px
    // 34mm @ 762 DPI = ~1020px
    headHeightMinPx: 870, 
    headHeightMaxPx: 1020, 
    eyeHeightFromBottomMinPx: 0, // UK spec does not define eye height, but head position.
    eyeHeightFromBottomMaxPx: 0, // This should be handled by the oval guide placement.
    background: "white",
  },
};

export const getPassportRequirements = (countryCode) => {
  const config = passportConfigs[countryCode];
  if (!config) {
    console.warn(`No passport configuration found for country code: ${countryCode}. Using US defaults.`);
    return passportConfigs.US; // Fallback to US defaults
  }
  return config;
};
