/**
 * GPS Extraction & Coordinate Parsing from EXIF Metadata
 */

export const parseGpsCoordinate = (coordinateVal, ref) => {
  if (coordinateVal === undefined || coordinateVal === null) return null;

  if (typeof coordinateVal === 'number') {
    let val = coordinateVal;
    if (ref && (ref.toUpperCase() === 'S' || ref.toUpperCase() === 'W')) {
      val = -Math.abs(val);
    }
    return val;
  }

  const str = String(coordinateVal).trim();
  if (!str) return null;

  // 1. Direct decimal string (e.g. "37.7749", "-122.4194", "33.8688 N")
  const pureDecimalMatch = str.match(/^([+-]?\d+(?:\.\d+)?)\s*([NSEW])?$/i);
  if (pureDecimalMatch) {
    let val = parseFloat(pureDecimalMatch[1]);
    const direction = pureDecimalMatch[2] || ref;
    if (direction && (direction.toUpperCase() === 'S' || direction.toUpperCase() === 'W')) {
      val = -Math.abs(val);
    }
    return val;
  }

  // 2. Rational format: e.g. "37/1, 46/1, 2986/100"
  if (str.includes('/')) {
    const parts = str.split(',').map((p) => {
      const [num, den] = p.trim().split('/').map(Number);
      return den ? num / den : Number(p);
    });
    if (parts.length >= 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
      let decimal = parts[0] + parts[1] / 60 + parts[2] / 3600;
      if (ref && (ref.toUpperCase() === 'S' || ref.toUpperCase() === 'W')) {
        decimal = -Math.abs(decimal);
      }
      return decimal;
    }
  }

  // 3. DMS string: e.g. "37 deg 46' 29.86\" N"
  const dmsMatch = str.match(/(\d+(?:\.\d+)?)\s*(?:deg|°)\s*(\d+(?:\.\d+)?)\s*['’′]\s*(\d+(?:\.\d+)?)\s*["”″]?\s*([NSEW])?/i);
  if (dmsMatch) {
    const deg = parseFloat(dmsMatch[1]);
    const min = parseFloat(dmsMatch[2]);
    const sec = parseFloat(dmsMatch[3]);
    const dir = dmsMatch[4] || ref;

    let decimal = deg + min / 60 + sec / 3600;
    if (dir && (dir.toUpperCase() === 'S' || dir.toUpperCase() === 'W')) {
      decimal = -Math.abs(decimal);
    }
    return decimal;
  }

  const fallback = parseFloat(str);
  if (!isNaN(fallback)) {
    if (ref && (ref.toUpperCase() === 'S' || ref.toUpperCase() === 'W')) {
      return -Math.abs(fallback);
    }
    return fallback;
  }

  return null;
};

export const extractGpsFromMetadata = (imageMetadata) => {
  if (!imageMetadata || typeof imageMetadata !== 'object') return null;

  const latRaw =
    imageMetadata.GPSLatitude ||
    imageMetadata.GPSLatitudeDec ||
    imageMetadata['[GPS] GPSLatitude'] ||
    imageMetadata.latitude;
  const latRef =
    imageMetadata.GPSLatitudeRef ||
    imageMetadata['[GPS] GPSLatitudeRef'];

  const lngRaw =
    imageMetadata.GPSLongitude ||
    imageMetadata.GPSLongitudeDec ||
    imageMetadata['[GPS] GPSLongitude'] ||
    imageMetadata.longitude;
  const lngRef =
    imageMetadata.GPSLongitudeRef ||
    imageMetadata['[GPS] GPSLongitudeRef'];

  const lat = parseGpsCoordinate(latRaw, latRef);
  const lng = parseGpsCoordinate(lngRaw, lngRef);

  if (lat !== null && lng !== null && !isNaN(lat) && !isNaN(lng)) {
    return {
      lat: Number(lat.toFixed(6)),
      lng: Number(lng.toFixed(6)),
      source: 'exif',
    };
  }

  // Check combined GPSPosition string
  const gpsPosition = imageMetadata.GPSPosition || imageMetadata['[GPS] GPSPosition'];
  if (gpsPosition && typeof gpsPosition === 'string') {
    const parts = gpsPosition.split(',').map((p) => p.trim());
    if (parts.length === 2) {
      const pLat = parseGpsCoordinate(parts[0]);
      const pLng = parseGpsCoordinate(parts[1]);
      if (pLat !== null && pLng !== null) {
        return {
          lat: Number(pLat.toFixed(6)),
          lng: Number(pLng.toFixed(6)),
          source: 'exif',
        };
      }
    }
  }

  return null;
};
