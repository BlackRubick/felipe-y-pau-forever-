export const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

export const formatDistance = (meters: number): string => {
  if (meters < 1000) {
    return `${meters.toFixed(1)} m`;
  }
  return `${(meters / 1000).toFixed(2)} km`;
};

export const formatVelocity = (meterPerSecond: number): string => {
  return `${meterPerSecond.toFixed(2)} m/s`;
};

export const formatHeartRate = (bpm: number): string => {
  return `${Math.round(bpm)} BPM`;
};

export const formatOxygen = (percent: number): string => {
  return `${Math.round(percent)} %`;
};

export const calculateDaysPostOp = (surgeryDate: string): number => {
  const surgery = new Date(surgeryDate);
  const today = new Date();
  const diffTime = Math.abs(today.getTime() - surgery.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

export const calculateBMI = (heightCm: number, weightKg: number): number => {
  const heightM = heightCm / 100;
  return weightKg / (heightM * heightM);
};

export const estimatedCalories = (
  durationSeconds: number,
  distanceMeters: number,
  ageYears: number,
  weightKg: number
): number => {
  const durationMinutes = durationSeconds / 60;
  const speedKmH = (distanceMeters / 1000 / durationMinutes) * 60;

  const met = speedKmH < 3 ? 2.0 : speedKmH < 4 ? 2.8 : speedKmH < 5 ? 3.5 : 4.0;
  return (met * weightKg * durationMinutes) / 60;
};

export const parseJWT = (token: string): any => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
};
