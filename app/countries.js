import { passportConfigs } from '../passportConfig';

const SIZE_INCH_LABELS = {
  US: '2×2 in @ 300 DPI',
  UK: '35×45 mm',
  CA: '50×70 mm',
  AU: '35×45 mm',
  DE: '35×45 mm',
};

export const COUNTRY_OPTIONS = Object.keys(passportConfigs).map((code) => ({
  value: code,
  label: code,
  sizeLabel: SIZE_INCH_LABELS[code] || `${passportConfigs[code].outputWidthPx}×${passportConfigs[code].outputHeightPx}px`,
}));

export const extractCountryFromUri = (uri) => {
  if (!uri) return 'US';
  const match = String(uri).match(/_([A-Z]{2})_processed/);
  return match ? match[1] : 'US';
};

export const getCountryMeta = (countryCode = 'US') => {
  const config = passportConfigs[countryCode] || passportConfigs.US;
  const option = COUNTRY_OPTIONS.find((o) => o.value === countryCode);
  return {
    code: countryCode,
    sizeLabel: option?.sizeLabel || `${config.outputWidthPx}×${config.outputHeightPx}px`,
    outputWidthPx: config.outputWidthPx,
    outputHeightPx: config.outputHeightPx,
  };
};

/** Cell aspect for print/share sheet based on passport output size. */
export const getPhotoAspect = (countryCode = 'US') => {
  const config = passportConfigs[countryCode] || passportConfigs.US;
  return config.outputWidthPx / config.outputHeightPx;
};
