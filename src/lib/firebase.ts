export const firebaseNotConfigured = true;

export function getFirebaseStatus() {
  return {
    enabled: false,
    reason: "Firebase is intentionally not configured for v1. Local score services own persistence.",
  };
}
