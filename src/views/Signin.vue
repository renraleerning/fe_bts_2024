<script setup>
import { onBeforeUnmount, onBeforeMount, onMounted, ref, computed } from "vue";
import { useStore } from "vuex";
import { useRouter } from "vue-router";
import api, { getStorageUrl } from "@/api";

import bgSekolah from "@/assets/img/sekolah3.png";
import logoSmk from "@/assets/img/logosmk.png";
import logoBts from "@/assets/img/logo_gbr.png";

const router = useRouter();
const store = useStore();

const user = ref({
  username: "",
  password: "",
  rememberMe: false,
});

const validation = ref({});
const loginFailed = ref(false);
const loginErrorMessage = ref("");
const loading = ref(false);
const showPassword = ref(false);
const isCapsLockOn = ref(false);
const showHelpModal = ref(false);
const usernameInputRef = ref(null);
const activeEvent = ref(null);

// Dynamic Indonesian greeting based on time of day
const greeting = computed(() => {
  const hour = new Date().getHours();
  if (hour >= 4 && hour < 11) {
    return { text: "Selamat Pagi", icon: "☀️", sub: "Semoga harimu menyenangkan" };
  } else if (hour >= 11 && hour < 15) {
    return { text: "Selamat Siang", icon: "🌤️", sub: "Semangat menjalankan aktivitas" };
  } else if (hour >= 15 && hour < 18) {
    return { text: "Selamat Sore", icon: "🌇", sub: "Selamat melanjutkan tugas" };
  } else {
    return { text: "Selamat Malam", icon: "🌙", sub: "Pastikan sistem tetap terpantau" };
  }
});

// Current formatted date
const currentDate = computed(() => {
  try {
    return new Intl.DateTimeFormat("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date());
  } catch (e) {
    return "BTS 2024";
  }
});

const checkCapsLock = (event) => {
  if (event && typeof event.getModifierState === "function") {
    isCapsLockOn.value = event.getModifierState("CapsLock");
  }
};

const login = async () => {
  validation.value = {};
  loginFailed.value = false;
  loginErrorMessage.value = "";

  const errors = {};
  if (!user.value.username?.trim()) {
    errors.username = ["Username wajib diisi."];
  }
  if (!user.value.password) {
    errors.password = ["Password wajib diisi."];
  }

  if (Object.keys(errors).length > 0) {
    validation.value = errors;
    return;
  }

  loading.value = true;

  try {
    const response = await api.post(
      "/api/login",
      {
        username: user.value.username.trim(),
        password: user.value.password,
      }
    );

    if (response.data && response.data.success) {
      localStorage.setItem("token", response.data.token);
      if (response.data.user) {
        localStorage.setItem("user", JSON.stringify(response.data.user));
      }

      // Handle remember me
      if (user.value.rememberMe) {
        localStorage.setItem("bts_remember_me", "true");
        localStorage.setItem("bts_saved_username", user.value.username.trim());
        try {
          localStorage.setItem("bts_saved_password", btoa(user.value.password));
        } catch (e) {
          localStorage.setItem("bts_saved_password", user.value.password);
        }
      } else {
        localStorage.removeItem("bts_remember_me");
        localStorage.removeItem("bts_saved_username");
        localStorage.removeItem("bts_saved_password");
      }

      router.push({ name: "Data Tamu" });
    } else {
      loginFailed.value = true;
      loginErrorMessage.value =
        response.data?.message || "Username atau password yang Anda masukkan salah.";
    }
  } catch (error) {
    loginFailed.value = true;

    if (error.response?.status === 422) {
      validation.value = error.response.data?.errors || {};
      loginErrorMessage.value = "Silakan periksa kembali isian formulir Anda.";
    } else if (error.response?.status === 401) {
      loginErrorMessage.value = "Kredensial tidak valid. Periksa username dan password.";
    } else if (!error.response) {
      loginErrorMessage.value =
        "Tidak dapat terhubung ke server (Backend 8000). Pastikan server aktif.";
    } else {
      loginErrorMessage.value =
        error.response.data?.message || "Terjadi kesalahan saat masuk. Silakan coba lagi.";
    }
  } finally {
    loading.value = false;
  }
};

const onRememberMeChange = () => {
  if (!user.value.rememberMe) {
    localStorage.removeItem("bts_remember_me");
    localStorage.removeItem("bts_saved_username");
    localStorage.removeItem("bts_saved_password");
  } else {
    localStorage.setItem("bts_remember_me", "true");
    if (user.value.username?.trim()) {
      localStorage.setItem("bts_saved_username", user.value.username.trim());
    }
    if (user.value.password) {
      try {
        localStorage.setItem("bts_saved_password", btoa(user.value.password));
      } catch (e) {
        localStorage.setItem("bts_saved_password", user.value.password);
      }
    }
  }
};

const body = document.body;

onBeforeMount(() => {
  store.state.hideConfigButton = true;
  store.state.showNavbar = false;
  store.state.showSidenav = false;
  store.state.showFooter = false;
  body.classList.remove("bg-gray-100");
});

onMounted(async () => {
  // If user is already authenticated with a valid token, go directly to Data Tamu
  const token = localStorage.getItem("token");
  if (token) {
    router.push({ name: "Data Tamu" });
    return;
  }

  // Restore remembered credentials
  const isRemembered = localStorage.getItem("bts_remember_me") === "true";
  const savedUser = localStorage.getItem("bts_saved_username");
  const savedPass = localStorage.getItem("bts_saved_password");

  if (isRemembered || savedUser) {
    user.value.rememberMe = true;
    if (savedUser) {
      user.value.username = savedUser;
    }
    if (savedPass) {
      try {
        user.value.password = atob(savedPass);
      } catch (e) {
        user.value.password = savedPass;
      }
    }
  }

  // Auto focus to appropriate input
  if (!user.value.username && usernameInputRef.value) {
    usernameInputRef.value.focus();
  } else if (!user.value.password) {
    const pwInput = document.getElementById("password");
    if (pwInput) pwInput.focus();
  }

  // Check if an event is currently active
  try {
    const res = await api.get("/api/event/active");
    activeEvent.value = res.data?.data || null;
  } catch (e) {
    activeEvent.value = null;
  }
});

const getBannerUrl = (bannerPath) => {
  if (!bannerPath) return "";
  return getStorageUrl(`event_banner/${bannerPath}`);
};

onBeforeUnmount(() => {
  store.state.hideConfigButton = false;
  store.state.showNavbar = true;
  store.state.showSidenav = true;
  store.state.showFooter = true;
  body.classList.add("bg-gray-100");
});
</script>

<template>
  <main class="bts-login-container">
    <!-- Ambient Background Blobs -->
    <div class="ambient-glow glow-1" aria-hidden="true"></div>
    <div class="ambient-glow glow-2" aria-hidden="true"></div>

    <div class="login-wrapper">
      <div class="login-card-shell">
        
        <!-- LEFT: Showcase / Visual Side with clean background (no printed text) -->
        <section
          class="showcase-side"
          :style="{ backgroundImage: `url(${bgSekolah})` }"
        >
          <div class="showcase-overlay"></div>

          <!-- Showcase Header -->
          <div class="showcase-header">
            <div class="school-identity">
              <div class="school-logo-frame">
                <img :src="logoSmk" alt="Logo SMKN 2 Sumedang" class="school-logo-img" />
              </div>
              <div class="school-text">
                <span class="school-name">SMKN 2 SUMEDANG</span>
                <span class="school-tag">Sistem Informasi Buku Tamu</span>
              </div>
            </div>

            <div class="status-pill">
              <span class="pulse-dot"></span>
              <span class="status-text">BTS V.2 Aktif</span>
            </div>
          </div>

          <!-- Showcase Main Hero Text -->
          <div class="showcase-body">
            <div class="app-badge">
              <span class="badge-icon">📷</span>
              <span>Presensi Selfie & Kunjungan Digital</span>
            </div>

            <h1 class="showcase-title">
              B T S<br />
              <span class="highlight-text">Buku Tamu Selfie</span>
            </h1>

            <p class="showcase-desc">
              Pencatatan kunjungan tamu sekolah secara tertib dengan foto selfie,
              monitoring data kedatangan real-time, dan arsip digital yang rapi.
            </p>

            <!-- Feature Pills / Highlights -->
            <div class="feature-cards">
              <div class="feature-item">
                <div class="feature-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                    <circle cx="12" cy="13" r="4"></circle>
                  </svg>
                </div>
                <div class="feature-info">
                  <strong>Foto Selfie Tamu</strong>
                  <span>Validasi visual setiap kunjungan</span>
                </div>
              </div>

              <div class="feature-item">
                <div class="feature-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                  </svg>
                </div>
                <div class="feature-info">
                  <strong>Keamanan & Ketertiban</strong>
                  <span>Pendataan maksud dan tujuan terarsip</span>
                </div>
              </div>
            </div>

            
          </div>

          <!-- Showcase Footer -->
          <div class="showcase-footer">
            <div class="motto-box">
              <span class="motto-label">Motto Sekolah</span>
              <p class="motto-content">
                <strong>BERAKSI</strong> — Brakhlak Mulia, Kompetitif, Terus Berinovasi.
              </p>
            </div>
          </div>
        </section>

        <!-- RIGHT: Form Panel -->
        <section class="form-side">
          <div class="form-inner">
            
            <!-- Mobile Header Brand (Visible on mobile/tablet) -->
            <div class="mobile-header">
              <div class="mobile-logo-group">
                <img :src="logoSmk" alt="Logo SMKN 2 Sumedang" class="mobile-logo" />
                <img :src="logoBts" alt="Logo BTS" class="mobile-bts-logo" />
              </div>
              <div class="mobile-meta">
                <h2>SMKN 2 SUMEDANG</h2>
                <p>Buku Tamu Sekolah Digital (BTS)</p>
              </div>
            </div>

            <!-- Greeting & Title -->
            <div class="greeting-box">
              <div class="time-greeting-pill">
                <span class="greeting-emoji">{{ greeting.icon }}</span>
                <span class="greeting-text">{{ greeting.text }}</span>
                <span class="date-divider">•</span>
                <span class="date-text">{{ currentDate }}</span>
              </div>
              <h2 class="form-title">Selamat Datang Kembali</h2>
              <p class="form-subtitle">
                Masuk dengan akun petugas untuk mengakses dasbor buku tamu sekolah.
              </p>
            </div>

            <!-- Active Event Shortcut Callout (Hanya Muncul Jika Ada Event yang Sedang Aktif) -->
            <transition name="fade-slide">
              <router-link v-if="activeEvent" to="/" class="guest-mode-callout event-live-callout">
                <div class="guest-callout-icon event-icon overflow-hidden">
                  <img
                    v-if="activeEvent.banner"
                    :src="getBannerUrl(activeEvent.banner)"
                    class="callout-flyer-img"
                    alt="Flyer Acara"
                  />
                  <i v-else class="fas fa-calendar-star"></i>
                </div>
                <div class="guest-callout-info">
                  <div class="guest-callout-header">
                    <span class="guest-callout-title">{{ activeEvent.nama_event }}</span>
                    <span class="guest-callout-badge event-badge">Event Aktif</span>
                  </div>
                  <p class="guest-callout-desc">
                    <span v-if="activeEvent.lokasi">{{ activeEvent.lokasi }} &bull; </span>Klik di sini untuk mengisi presensi pengunjung event tanpa login
                  </p>
                </div>
                <div class="guest-callout-arrow">
                  <i class="fas fa-arrow-right"></i>
                </div>
              </router-link>
            </transition>

            <!-- Error Banner -->
            <transition name="fade-slide">
              <div v-if="loginFailed" class="alert-banner" role="alert">
                <div class="alert-icon-box">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                  </svg>
                </div>
                <div class="alert-content">
                  <strong>Gagal Masuk</strong>
                  <p>{{ loginErrorMessage }}</p>
                </div>
                <button
                  type="button"
                  class="alert-close-btn"
                  @click="loginFailed = false"
                  aria-label="Tutup notifikasi"
                >
                  &times;
                </button>
              </div>
            </transition>

            <!-- Login Form -->
            <form @submit.prevent="login" novalidate class="auth-form">
              
              <!-- Username Field -->
              <div class="input-group-custom">
                <label for="username" class="field-label">
                  <span>Username</span>
                  <span class="required-star">*</span>
                </label>
                <div
                  class="field-container"
                  :class="{ 'has-error': validation.username?.length }"
                >
                  <span class="field-prefix-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                  </span>
                  <input
                    id="username"
                    ref="usernameInputRef"
                    v-model="user.username"
                    type="text"
                    placeholder="Masukkan username Anda"
                    autocomplete="username"
                    spellcheck="false"
                    autocapitalize="none"
                    :disabled="loading"
                    required
                  />
                  <button
                    v-if="user.username && !loading"
                    type="button"
                    class="clear-input-btn"
                    @click="user.username = ''"
                    title="Hapus"
                  >
                    ✕
                  </button>
                </div>
                <p v-if="validation.username?.length" class="error-tip">
                  {{ validation.username[0] }}
                </p>
              </div>

              <!-- Password Field -->
              <div class="input-group-custom">
                <div class="label-row">
                  <label for="password" class="field-label">
                    <span>Password</span>
                    <span class="required-star">*</span>
                  </label>
                  <span v-if="isCapsLockOn" class="caps-warning">
                    ⚠️ Caps Lock aktif
                  </span>
                </div>

                <div
                  class="field-container"
                  :class="{ 'has-error': validation.password?.length }"
                >
                  <span class="field-prefix-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                  </span>
                  <input
                    id="password"
                    v-model="user.password"
                    :type="showPassword ? 'text' : 'password'"
                    placeholder="Masukkan password Anda"
                    autocomplete="current-password"
                    :disabled="loading"
                    @keydown="checkCapsLock"
                    @keyup="checkCapsLock"
                    required
                  />
                  <button
                    type="button"
                    class="visibility-toggle-btn"
                    :class="{ active: showPassword }"
                    @click="showPassword = !showPassword"
                    :aria-label="showPassword ? 'Sembunyikan password' : 'Lihat password'"
                    tabindex="-1"
                  >
                    <!-- Eye Icon -->
                    <svg v-if="!showPassword" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                    <!-- Eye Off Icon -->
                    <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                      <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                  </button>
                </div>
                <p v-if="validation.password?.length" class="error-tip">
                  {{ validation.password[0] }}
                </p>
              </div>

              <!-- Options Row: Remember Me & Help Trigger -->
              <div class="form-options">
                <label for="rememberMe" class="custom-checkbox">
                  <input
                    id="rememberMe"
                    v-model="user.rememberMe"
                    type="checkbox"
                    :disabled="loading"
                    @change="onRememberMeChange"
                  />
                  <span
                    class="checkbox-box"
                    :class="{ 'is-checked': user.rememberMe }"
                    aria-hidden="true"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </span>
                  <span class="checkbox-label">Ingat akun saya</span>
                </label>

                <button
                  type="button"
                  class="help-link-btn"
                  @click="showHelpModal = true"
                >
                  Butuh bantuan?
                </button>
              </div>

              <!-- Submit Button -->
              <button
                type="submit"
                class="submit-action-btn"
                :disabled="loading"
                :class="{ 'is-loading': loading }"
              >
                <span v-if="loading" class="spinner-circle" aria-hidden="true"></span>
                <span class="btn-text">
                  {{ loading ? "Memverifikasi Akun..." : "Masuk ke Sistem" }}
                </span>
                <svg
                  v-if="!loading"
                  class="btn-arrow-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.5"
                >
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </button>

            </form>

            <!-- Security Assurance Notice -->
            <div class="security-assurance">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="shield-icon">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              </svg>
              <span>Akses terproteksi & terenkripsi • Tim IT SMKN 2 Sumedang</span>
            </div>

            <!-- Panel Footer -->
            <footer class="form-panel-footer">
              <div class="footer-left">
                <strong>BTS</strong>
                <span>v2.0</span>
              </div>
              <div class="footer-right">
                <span>© 2024 SMKN 2 Sumedang</span>
              </div>
            </footer>

          </div>
        </section>

      </div>
    </div>

    <!-- Help Modal Dialog -->
    <transition name="modal-fade">
      <div v-if="showHelpModal" class="modal-backdrop" @click.self="showHelpModal = false">
        <div class="modal-dialog-box" role="dialog" aria-modal="true">
          <div class="modal-header">
            <div class="modal-title-group">
              <span class="modal-icon">ℹ️</span>
              <h3>Bantuan Masuk Sistem</h3>
            </div>
            <button
              type="button"
              class="modal-close"
              @click="showHelpModal = false"
              aria-label="Tutup"
            >
              ✕
            </button>
          </div>
          <div class="modal-body">
            <p>
              Aplikasi <strong>Buku Tamu Selfie 2024 (BTS)</strong> digunakan secara khusus oleh staf, guru piket, dan resepsionis SMKN 2 Sumedang.
            </p>
            <div class="help-steps">
              <div class="step-row">
                <span class="step-num">1</span>
                <div>
                  <strong>Lupa Username / Password</strong>
                  <p>Hubungi TIM IT sekolah untuk reset kredensial akun Anda.</p>
                </div>
              </div>
              <div class="step-row">
                <span class="step-num">2</span>
                <div>
                  <strong>Koneksi Server</strong>
                  <p>Pastikan koneksi internet atau jaringan lokal sekolah terhubung dan server backend beroperasi.</p>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button
              type="button"
              class="modal-ok-btn"
              @click="showHelpModal = false"
            >
              Mengerti
            </button>
          </div>
        </div>
      </div>
    </transition>

  </main>
</template>

<style scoped>
/* ----------------------------------------------------
   ROOT & BASE CONTAINER
----------------------------------------------------- */
.bts-login-container {
  position: relative;
  min-height: 100vh;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #0d1527;
  background: radial-gradient(circle at 15% 15%, #182848 0%, #0d1527 60%, #070c18 100%);
  font-family: "Open Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  color: #1e293b;
  padding: 30px 20px;
  overflow-x: hidden;
  box-sizing: border-box;
}

/* Ambient glow effects behind card */
.ambient-glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(100px);
  pointer-events: none;
  z-index: 0;
  opacity: 0.45;
}

.glow-1 {
  width: 500px;
  height: 500px;
  top: -100px;
  left: -100px;
  background: radial-gradient(circle, rgba(56, 189, 248, 0.5) 0%, rgba(37, 99, 235, 0) 70%);
}

.glow-2 {
  width: 600px;
  height: 600px;
  bottom: -150px;
  right: -100px;
  background: radial-gradient(circle, rgba(99, 102, 241, 0.4) 0%, rgba(30, 58, 138, 0) 70%);
}

.login-wrapper {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 1200px;
}

/* Main card shell */
.login-card-shell {
  display: grid;
  grid-template-columns: 1.15fr 0.95fr;
  min-height: 700px;
  background: #ffffff;
  border-radius: 28px;
  overflow: hidden;
  box-shadow:
    0 25px 70px -15px rgba(0, 0, 0, 0.45),
    0 0 0 1px rgba(255, 255, 255, 0.12);
  transition: all 0.3s ease;
}

/* ----------------------------------------------------
   LEFT SHOWCASE SIDE (CLEAN BACKGROUND)
----------------------------------------------------- */
.showcase-side {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 48px 44px;
  background-color: #0f2042;
  background-size: cover;
  background-position: center center;
  background-repeat: no-repeat;
  color: #ffffff;
  overflow: hidden;
}

.showcase-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    145deg,
    rgba(10, 25, 54, 0.88) 0%,
    rgba(14, 43, 92, 0.82) 45%,
    rgba(7, 20, 44, 0.95) 100%
  );
  backdrop-filter: blur(1.5px);
  z-index: 1;
}

.showcase-header,
.showcase-body,
.showcase-footer {
  position: relative;
  z-index: 2;
}

/* School identity top */
.showcase-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.school-identity {
  display: flex;
  align-items: center;
  gap: 14px;
}

.school-logo-frame {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 5px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
}

.school-logo-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.school-text {
  display: flex;
  flex-direction: column;
}

.school-name {
  font-size: 15px;
  font-weight: 800;
  letter-spacing: 0.8px;
  color: #ffffff;
}

.school-tag {
  font-size: 11px;
  color: #93c5fd;
  font-weight: 500;
}

/* Status Pill */
.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 30px;
  font-size: 12px;
  color: #e2e8f0;
  backdrop-filter: blur(8px);
}

.pulse-dot {
  width: 8px;
  height: 8px;
  background: #10b981;
  border-radius: 50%;
  box-shadow: 0 0 10px #10b981;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
  70% { transform: scale(1); box-shadow: 0 0 0 8px rgba(16, 185, 129, 0); }
  100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
}

/* Showcase Body */
.showcase-body {
  margin: 36px 0;
}

.app-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  background: rgba(59, 130, 246, 0.2);
  border: 1px solid rgba(147, 197, 253, 0.35);
  border-radius: 20px;
  color: #bfdbfe;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.4px;
  margin-bottom: 20px;
}

.showcase-title {
  font-size: 38px;
  font-weight: 800;
  line-height: 1.2;
  margin: 0 0 16px;
  color: #ffffff;
  letter-spacing: -0.8px;
}

.highlight-text {
  background: linear-gradient(120deg, #60a5fa, #38bdf8);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.showcase-desc {
  font-size: 14.5px;
  line-height: 1.7;
  color: #cbd5e1;
  max-width: 460px;
  margin: 0 0 32px;
}

/* Feature Cards */
.feature-cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  max-width: 500px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: rgba(255, 255, 255, 0.07);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 16px;
  backdrop-filter: blur(12px);
  transition: transform 0.25s ease, background 0.25s ease;
}

.feature-item:hover {
  transform: translateY(-2px);
  background: rgba(255, 255, 255, 0.12);
}

.feature-icon {
  width: 38px;
  height: 38px;
  flex-shrink: 0;
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
}

.feature-icon svg {
  width: 20px;
  height: 20px;
}

.feature-info {
  display: flex;
  flex-direction: column;
}

.feature-info strong {
  font-size: 12.5px;
  color: #ffffff;
  font-weight: 700;
}

.feature-info span {
  font-size: 11px;
  color: #94a3b8;
  line-height: 1.3;
}

/* Showcase Fast Guest Button */
.showcase-guest-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 18px;
  padding: 12px 16px;
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.4), rgba(79, 70, 229, 0.5));
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 14px;
  text-decoration: none;
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.showcase-guest-btn:hover {
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.7), rgba(79, 70, 229, 0.8));
  border-color: rgba(255, 255, 255, 0.45);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(37, 99, 235, 0.4);
}

.sg-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-size: 15px;
  flex-shrink: 0;
}

.sg-text {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.sg-text strong {
  font-size: 12.5px;
  color: #ffffff;
  font-weight: 700;
}

.sg-text small {
  font-size: 11px;
  color: #cbd5e1;
}

.sg-arrow {
  color: #93c5fd;
  font-size: 13px;
  transition: transform 0.2s ease;
}

.showcase-guest-btn:hover .sg-arrow {
  transform: translateX(4px);
  color: #ffffff;
}

/* Showcase Footer */
.showcase-footer {
  border-top: 1px solid rgba(255, 255, 255, 0.12);
  padding-top: 20px;
}

.motto-box {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.motto-label {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 1.2px;
  color: #60a5fa;
  font-weight: 700;
}

.motto-content {
  font-size: 11.5px;
  line-height: 1.6;
  color: #cbd5e1;
  margin: 0;
}

.motto-content strong {
  color: #ffffff;
}

/* ----------------------------------------------------
   RIGHT FORM SIDE
----------------------------------------------------- */
.form-side {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 48px;
  background: #ffffff;
  position: relative;
}

.form-inner {
  width: 100%;
  max-width: 410px;
}

/* Mobile Header (Hidden on Desktop) */
.mobile-header {
  display: none;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 1px solid #f1f5f9;
}

.mobile-logo-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.mobile-logo {
  width: 44px;
  height: 44px;
  object-fit: contain;
}

.mobile-bts-logo {
  width: 38px;
  height: 38px;
  object-fit: contain;
}

.mobile-meta h2 {
  font-size: 16px;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 2px;
}

.mobile-meta p {
  font-size: 12px;
  color: #64748b;
  margin: 0;
}

/* Greeting Box */
.greeting-box {
  margin-bottom: 28px;
}

.time-greeting-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  font-size: 11.5px;
  color: #334155;
  font-weight: 600;
  margin-bottom: 14px;
}

.greeting-emoji {
  font-size: 13px;
}

.date-divider {
  color: #cbd5e1;
}

.date-text {
  color: #64748b;
  font-weight: 500;
}

.form-title {
  font-size: 26px;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 8px;
  letter-spacing: -0.5px;
}

.form-subtitle {
  font-size: 13.5px;
  color: #64748b;
  line-height: 1.6;
  margin: 0;
}

/* Guest Mode Callout in Form Side */
.guest-mode-callout {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 18px;
  margin-bottom: 22px;
  padding: 12px 14px;
  background: linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%);
  border: 1.5px dashed #60a5fa;
  border-radius: 14px;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.25s ease;
}

.guest-mode-callout:hover {
  background: linear-gradient(135deg, #dbeafe 0%, #dcfce7 100%);
  border-color: #2563eb;
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(37, 99, 235, 0.12);
}

.event-live-callout {
  background: linear-gradient(135deg, #eff6ff 0%, #fdf4ff 100%);
  border: 1.5px dashed #a855f7;
}

.event-live-callout:hover {
  background: linear-gradient(135deg, #e0e7ff 0%, #fae8ff 100%);
  border-color: #9333ea;
  box-shadow: 0 6px 16px rgba(147, 51, 234, 0.15);
}

.event-icon {
  background: linear-gradient(135deg, #9333ea 0%, #7e22ce 100%) !important;
  box-shadow: 0 4px 10px rgba(147, 51, 234, 0.3) !important;
}

.event-badge {
  background: #9333ea !important;
}

.guest-callout-icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  background: #2563eb;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  flex-shrink: 0;
  box-shadow: 0 4px 10px rgba(37, 99, 235, 0.25);
}

.callout-flyer-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 9px;
  display: block;
}

.guest-callout-info {
  flex: 1;
}

.guest-callout-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 2px;
}

.guest-callout-title {
  font-size: 13px;
  font-weight: 700;
  color: #1e3a8a;
}

.guest-callout-badge {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 7px;
  background: #10b981;
  color: #ffffff;
  border-radius: 6px;
  text-transform: uppercase;
  letter-spacing: 0.4px;
}

.guest-callout-desc {
  font-size: 11.5px;
  color: #475569;
  margin: 0;
  line-height: 1.35;
}

.guest-callout-arrow {
  color: #2563eb;
  font-size: 14px;
  transition: transform 0.2s ease;
}

.guest-mode-callout:hover .guest-callout-arrow {
  transform: translateX(4px);
}

/* Alert Banner */
.alert-banner {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 16px;
  background: #fff1f2;
  border: 1px solid #fecdd3;
  border-radius: 14px;
  color: #9f1239;
  margin-bottom: 22px;
}

.alert-icon-box {
  width: 22px;
  height: 22px;
  flex-shrink: 0;
  margin-top: 2px;
  color: #e11d48;
}

.alert-icon-box svg {
  width: 100%;
  height: 100%;
}

.alert-content {
  flex: 1;
}

.alert-content strong {
  display: block;
  font-size: 13px;
  font-weight: 700;
  margin-bottom: 2px;
}

.alert-content p {
  font-size: 12px;
  margin: 0;
  line-height: 1.4;
}

.alert-close-btn {
  background: transparent;
  border: 0;
  color: #9f1239;
  font-size: 18px;
  font-weight: 700;
  line-height: 1;
  cursor: pointer;
  padding: 0 4px;
}

/* ----------------------------------------------------
   FORM INPUTS & CONTROLS
----------------------------------------------------- */
.auth-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.input-group-custom {
  display: flex;
  flex-direction: column;
}

.field-label {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12.5px;
  font-weight: 700;
  color: #334155;
  margin-bottom: 7px;
}

.label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.required-star {
  color: #ef4444;
}

.caps-warning {
  font-size: 11px;
  color: #d97706;
  font-weight: 600;
  background: #fef3c7;
  padding: 2px 8px;
  border-radius: 6px;
}

.field-container {
  position: relative;
  display: flex;
  align-items: center;
  background: #f8fafc;
  border: 1.5px solid #e2e8f0;
  border-radius: 12px;
  transition: all 0.2s ease;
}

.field-container:focus-within {
  border-color: #2563eb;
  background: #ffffff;
  box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.12);
}

.field-container.has-error {
  border-color: #ef4444;
  background: #fff5f5;
}

.field-container.has-error:focus-within {
  box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.12);
}

.field-prefix-icon {
  width: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  flex-shrink: 0;
  transition: color 0.2s ease;
}

.field-container:focus-within .field-prefix-icon {
  color: #2563eb;
}

.field-prefix-icon svg {
  width: 19px;
  height: 19px;
}

.field-container input {
  flex: 1;
  min-width: 0;
  height: 48px;
  border: 0;
  outline: 0;
  background: transparent;
  font-size: 14px;
  color: #0f172a;
  font-family: inherit;
  padding: 0 8px 0 0;
}

.field-container input::placeholder {
  color: #94a3b8;
  font-size: 13.5px;
}

.clear-input-btn {
  background: #e2e8f0;
  border: 0;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  font-size: 10px;
  color: #64748b;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  margin-right: 12px;
  transition: background 0.15s;
}

.clear-input-btn:hover {
  background: #cbd5e1;
  color: #1e293b;
}

.visibility-toggle-btn {
  background: transparent;
  border: 0;
  width: 44px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  cursor: pointer;
  transition: color 0.2s;
}

.visibility-toggle-btn:hover,
.visibility-toggle-btn.active {
  color: #2563eb;
}

.visibility-toggle-btn svg {
  width: 19px;
  height: 19px;
}

.error-tip {
  font-size: 11.5px;
  color: #dc2626;
  margin: 6px 0 0 2px;
  font-weight: 500;
}

/* Options: Remember Me & Help */
.form-options {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: -4px;
}

.custom-checkbox {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 9px;
  cursor: pointer;
  user-select: none;
}

/* Visually hidden accessible input - avoid display: none to guarantee click and keyboard activation */
.custom-checkbox input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
  margin: 0;
  pointer-events: none;
}

.checkbox-box {
  width: 19px;
  height: 19px;
  border-radius: 6px;
  border: 1.5px solid #cbd5e1;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  color: transparent;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.checkbox-box svg {
  width: 13px;
  height: 13px;
  pointer-events: none;
}

.custom-checkbox:hover .checkbox-box {
  border-color: #94a3b8;
}

.custom-checkbox input:focus-visible + .checkbox-box {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.2);
}

.custom-checkbox input:checked + .checkbox-box,
.checkbox-box.is-checked {
  background: #2563eb;
  border-color: #2563eb;
  color: #ffffff;
}

.checkbox-label {
  font-size: 13px;
  color: #475569;
  font-weight: 500;
  cursor: pointer;
}

.help-link-btn {
  background: transparent;
  border: 0;
  font-size: 12.5px;
  color: #2563eb;
  font-weight: 600;
  cursor: pointer;
  padding: 4px;
  transition: color 0.15s;
}

.help-link-btn:hover {
  color: #1d4ed8;
  text-decoration: underline;
}

/* Submit Action Button */
.submit-action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  height: 50px;
  padding: 0 20px;
  border: 0;
  border-radius: 12px;
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  color: #ffffff;
  font-size: 14.5px;
  font-weight: 700;
  font-family: inherit;
  cursor: pointer;
  box-shadow: 0 10px 20px -5px rgba(37, 99, 235, 0.4);
  transition: all 0.25s ease;
  margin-top: 6px;
}

.submit-action-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 14px 26px -6px rgba(37, 99, 235, 0.5);
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
}

.submit-action-btn:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: 0 6px 14px -3px rgba(37, 99, 235, 0.4);
}

.submit-action-btn:disabled {
  opacity: 0.75;
  cursor: not-allowed;
  transform: none;
}

.btn-arrow-icon {
  width: 18px;
  height: 18px;
  transition: transform 0.2s ease;
}

.submit-action-btn:hover:not(:disabled) .btn-arrow-icon {
  transform: translateX(4px);
}

/* Spinner */
.spinner-circle {
  width: 18px;
  height: 18px;
  border: 2.5px solid rgba(255, 255, 255, 0.3);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 0.75s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Security notice */
.security-assurance {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 26px;
  font-size: 11.5px;
  color: #64748b;
  text-align: center;
}

.shield-icon {
  width: 15px;
  height: 15px;
  color: #10b981;
  flex-shrink: 0;
}

/* Panel Footer */
.form-panel-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 36px;
  padding-top: 18px;
  border-top: 1px solid #f1f5f9;
  font-size: 11px;
  color: #94a3b8;
}

.footer-left {
  display: flex;
  align-items: center;
  gap: 6px;
}

.footer-left strong {
  color: #475569;
  font-weight: 700;
}

/* ----------------------------------------------------
   HELP MODAL
----------------------------------------------------- */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.7);
  backdrop-filter: blur(4px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.modal-dialog-box {
  background: #ffffff;
  width: 100%;
  max-width: 440px;
  border-radius: 20px;
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  animation: modalEnter 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes modalEnter {
  from { opacity: 0; transform: scale(0.94) translateY(10px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid #f1f5f9;
}

.modal-title-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.modal-icon {
  font-size: 20px;
}

.modal-header h3 {
  font-size: 16px;
  font-weight: 800;
  color: #0f172a;
  margin: 0;
}

.modal-close {
  background: transparent;
  border: 0;
  font-size: 18px;
  color: #94a3b8;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
}

.modal-close:hover {
  background: #f1f5f9;
  color: #0f172a;
}

.modal-body {
  padding: 20px 24px;
  font-size: 13.5px;
  color: #334155;
  line-height: 1.6;
}

.modal-body p {
  margin: 0 0 16px;
}

.help-steps {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.step-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  background: #f8fafc;
  padding: 12px;
  border-radius: 12px;
}

.step-num {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #2563eb;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  flex-shrink: 0;
  margin-top: 2px;
}

.step-row strong {
  display: block;
  font-size: 12.5px;
  color: #0f172a;
  margin-bottom: 2px;
}

.step-row p {
  font-size: 12px;
  color: #64748b;
  margin: 0;
  line-height: 1.4;
}

.modal-footer {
  padding: 16px 24px;
  background: #f8fafc;
  border-top: 1px solid #f1f5f9;
  display: flex;
  justify-content: flex-end;
}

.modal-ok-btn {
  padding: 8px 20px;
  background: #2563eb;
  color: #ffffff;
  border: 0;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}

.modal-ok-btn:hover {
  background: #1d4ed8;
}

/* ----------------------------------------------------
   TRANSITIONS
----------------------------------------------------- */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s ease;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(-8px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.25s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

/* ----------------------------------------------------
   RESPONSIVENESS (BREAKPOINTS)
----------------------------------------------------- */

/* Large Tablets & Medium Laptops (992px to 1199px) */
@media (max-width: 1199px) {
  .login-card-shell {
    grid-template-columns: 1fr 1fr;
    min-height: 650px;
  }

  .showcase-side {
    padding: 38px 32px;
  }

  .form-side {
    padding: 38px 36px;
  }

  .showcase-title {
    font-size: 32px;
  }

  .feature-cards {
    grid-template-columns: 1fr;
    gap: 10px;
  }
}

/* Tablets (768px to 991px) */
@media (max-width: 991px) {
  .bts-login-container {
    padding: 24px 16px;
  }

  .login-card-shell {
    grid-template-columns: 1fr;
    max-width: 560px;
    margin: 0 auto;
    min-height: auto;
    border-radius: 24px;
  }

  /* Compact banner on tablet instead of completely hiding */
  .showcase-side {
    padding: 32px 28px 26px;
    min-height: auto;
  }

  .showcase-header {
    margin-bottom: 16px;
  }

  .showcase-body {
    margin: 12px 0 20px;
  }

  .showcase-title {
    font-size: 26px;
    margin-bottom: 10px;
  }

  .showcase-desc {
    font-size: 13.5px;
    margin-bottom: 18px;
  }

  .feature-cards {
    grid-template-columns: 1fr 1fr;
  }

  .showcase-footer {
    display: none;
  }

  .form-side {
    padding: 36px 32px 40px;
  }

  .form-inner {
    max-width: 100%;
  }

  .mobile-header {
    display: none;
  }
}

/* Small Tablets and Mobile Phones (< 768px) */
@media (max-width: 767px) {
  .bts-login-container {
    padding: 16px 12px;
    align-items: flex-start;
    min-height: 100dvh;
  }

  .login-card-shell {
    max-width: 100%;
    border-radius: 22px;
    box-shadow: 0 15px 40px rgba(0, 0, 0, 0.4);
  }

  /* Hide the heavy showcase side on mobile to save vertical space & focus on user action */
  .showcase-side {
    display: none;
  }

  .form-side {
    padding: 28px 20px 32px;
  }

  /* Show dedicated, clean mobile branding header */
  .mobile-header {
    display: flex;
    align-items: center;
  }

  .form-title {
    font-size: 23px;
  }

  .form-subtitle {
    font-size: 13px;
  }

  /* Font size 16px on mobile prevents unwanted iOS Safari zoom */
  .field-container input {
    font-size: 16px;
  }

  .submit-action-btn {
    height: 52px;
    font-size: 15px;
  }
}

/* Very Small Mobile (< 400px) */
@media (max-width: 400px) {
  .bts-login-container {
    padding: 10px 8px;
  }

  .form-side {
    padding: 24px 16px 28px;
  }

  .time-greeting-pill {
    flex-wrap: wrap;
    font-size: 11px;
  }

  .date-divider {
    display: none;
  }

  .date-text {
    width: 100%;
    margin-top: 2px;
  }

  .form-options {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .help-link-btn {
    padding-left: 0;
  }
}
</style>