/**
 * Auth & Role Helper Utilities
 * Standardized role handling for Admin vs Petugas
 */

export function getStoredUser() {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.error("Gagal membaca data user dari storage:", e);
    return null;
  }
}

export function setStoredUser(user) {
  if (!user) {
    localStorage.removeItem("user");
    return;
  }
  try {
    localStorage.setItem("user", JSON.stringify(user));
  } catch (e) {
    console.error("Gagal menyimpan data user ke storage:", e);
  }
}

export function clearAuthData() {
  localStorage.removeItem("user");
  localStorage.removeItem("token");
}

export function isAuthenticated() {
  return !!localStorage.getItem("token");
}

export function getUserLevel() {
  const user = getStoredUser();
  return (user?.level || "").toLowerCase().trim();
}

export function isAdmin() {
  const level = getUserLevel();
  return level === "admin" || level === "administrator";
}

export function isPetugas() {
  const level = getUserLevel();
  return level === "petugas";
}
