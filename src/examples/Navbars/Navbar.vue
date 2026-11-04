<script setup>
import { computed, onMounted, onBeforeUnmount, ref } from "vue";
import { useStore } from "vuex";
import { useRoute, useRouter } from "vue-router";
import axios from "axios";
import Breadcrumbs from "../Breadcrumbs.vue";
import { activateDarkMode, deactivateDarkMode } from "@/assets/js/dark-mode";

const router = useRouter();
const route = useRoute();
const store = useStore();

const isRTL = computed(() => store.state.isRTL);
const isNavFixed = computed(() => store.state.isNavFixed);
const darkMode = computed(() => store.state.darkMode);
const currentRouteName = computed(() => {
  if (route.name === "Create.Tamu" || route.path === "/createtamu") {
    return "Tambah Data Tamu";
  }
  const token = localStorage.getItem("token");
  if (route.path === "/" && token) {
    return "Tambah Data Tamu";
  }
  if (route.meta?.title) {
    return route.meta.title;
  }
  if (typeof route.name === "string") {
    if (route.name.startsWith("Create.")) {
      return `Tambah Data ${route.name.replace("Create.", "")}`;
    }
    if (route.name.startsWith("Edit.")) {
      return `Edit Data ${route.name.replace("Edit.", "")}`;
    }
    return route.name;
  }
  return "";
});

// State untuk user & dropdown
const user = ref(null);
const showMenu = ref(false);
const loggingOut = ref(false);
const imageError = ref(false);
const profileDropdownRef = ref(null);

// Live Date & Time display
const currentTime = ref("");
let clockInterval = null;

const updateClock = () => {
  try {
    const now = new Date();
    currentTime.value = new Intl.DateTimeFormat("id-ID", {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(now);
  } catch (e) {
    currentTime.value = "";
  }
};

// Global axios interceptor untuk menangani token kadaluarsa
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("token");
      return router.push({ name: "Signin" });
    }
    return Promise.reject(error);
  }
);

// Fetch data profil user saat ini
const fetchCurrentUser = async () => {
  const token = localStorage.getItem("token");
  if (!token) {
    router.push({ name: "Signin" });
    return;
  }

  try {
    const response = await axios.get("http://localhost:8000/api/user", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (response && response.data) {
      user.value = response.data;
      localStorage.setItem("user", JSON.stringify(response.data));
      imageError.value = false;
    }
  } catch (error) {
    console.error("Gagal memuat data user:", error?.response?.data || error.message);
  }
};

// Initials fallback jika foto tidak ada / error
const userInitials = computed(() => {
  if (!user.value || !user.value.name) return "U";
  const parts = user.value.name.trim().split(" ");
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
});

// Method logout yang 100% handal & tidak akan hang
const logout = async () => {
  if (loggingOut.value) return;
  loggingOut.value = true;

  const token = localStorage.getItem("token");

  try {
    if (token) {
      await axios.post(
        "http://localhost:8000/api/logout",
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          timeout: 3000,
        }
      );
    }
  } catch (error) {
    console.warn("Backend logout info:", error?.response?.data || error.message);
  } finally {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    delete axios.defaults.headers.common["Authorization"];
    user.value = null;
    showMenu.value = false;
    loggingOut.value = false;

    router.push({ name: "Signin" });
  }
};

// Toggle menu profile dropdown
const toggleMenu = (event) => {
  event?.stopPropagation();
  showMenu.value = !showMenu.value;
};

// Handle klik di luar dropdown untuk menutup menu
const handleClickOutside = (event) => {
  if (profileDropdownRef.value && !profileDropdownRef.value.contains(event.target)) {
    showMenu.value = false;
  }
};

// Sidebar toggler
const minimizeSidebar = () => store.commit("sidebarMinimize");

// Smart Auto-Hide state & scroll listener
const isNavbarHidden = ref(false);
const isScrolled = ref(false);
let lastScrollPosition = 0;
let scrollTicking = false;

const handleScroll = () => {
  if (!scrollTicking) {
    window.requestAnimationFrame(() => {
      const currentScroll = window.scrollY || document.documentElement.scrollTop || 0;

      if (currentScroll <= 30) {
        isNavbarHidden.value = false;
        isScrolled.value = false;
      } else {
        isScrolled.value = true;

        // Scroll down threshold (>80px dari atas & bergeser >10px ke bawah) -> sembunyikan navbar
        if (currentScroll > 80 && currentScroll > lastScrollPosition + 10) {
          isNavbarHidden.value = true;
          if (showMenu.value) {
            showMenu.value = false;
          }
        }
        // Scroll up threshold (bergeser >8px ke atas) -> tampilkan kembali
        else if (currentScroll < lastScrollPosition - 8) {
          isNavbarHidden.value = false;
        }
      }

      lastScrollPosition = Math.max(0, currentScroll);
      scrollTicking = false;
    });
    scrollTicking = true;
  }
};

onMounted(() => {
  const savedTheme = localStorage.getItem("bts_theme_mode");
  if (savedTheme === "dark" && !store.state.darkMode) {
    store.state.darkMode = true;
    store.commit("sidebarType", "bg-default");
    activateDarkMode();
  } else if (savedTheme === "light" && store.state.darkMode) {
    store.state.darkMode = false;
    store.commit("sidebarType", "bg-white");
    deactivateDarkMode();
  }

  updateClock();
  clockInterval = setInterval(updateClock, 30000);
  fetchCurrentUser();
  document.addEventListener("click", handleClickOutside);
  window.addEventListener("scroll", handleScroll, { passive: true });
});

onBeforeUnmount(() => {
  if (clockInterval) clearInterval(clockInterval);
  document.removeEventListener("click", handleClickOutside);
  window.removeEventListener("scroll", handleScroll);
});
</script>

<template>
  <nav
    class="navbar navbar-main navbar-glassmorphic px-3 mx-4 my-3 border-radius-xl"
    :class="{
      'navbar-glass-dark': darkMode,
      'navbar-glass-light': !darkMode,
      'sticky-nav': isNavFixed,
      'rtl-nav': isRTL,
      'navbar-hidden': isNavbarHidden,
      'navbar-scrolled': isScrolled
    }"
    @focusin="isNavbarHidden = false"
    id="navbarBlur"
  >
    <div class="container-fluid px-1 py-1 d-flex align-items-center justify-content-between flex-wrap gap-2">
      <!-- Sisi Kiri: Hamburger Toggle & Breadcrumbs -->
      <div class="d-flex align-items-center gap-2 gap-sm-3">
        <!-- Sidebar Toggle Icon for Mobile -->
        <button
          type="button"
          @click="minimizeSidebar"
          class="nav-hamburger-btn d-xl-none"
          id="iconNavbarSidenav"
          aria-label="Toggle Sidebar"
        >
          <div class="sidenav-toggler-inner">
            <i class="sidenav-toggler-line"></i>
            <i class="sidenav-toggler-line"></i>
            <i class="sidenav-toggler-line"></i>
          </div>
        </button>

        <breadcrumbs
          :current-page="currentRouteName"
          :current-directory="currentRouteName"
        />
      </div>

      

      <!-- Sisi Kanan: Action & Profile Capsule -->
      <div class="d-flex align-items-center gap-2 gap-sm-3 ms-auto ms-md-0">
        <!-- Fast Action for Mobile (Icon Plus Button) -->
        <router-link
          to="/createtamu"
          class="btn-fast-action-mobile d-md-none text-white text-decoration-none shadow-sm"
          title="Tambah Tamu"
        >
          <i class="fas fa-plus"></i>
        </router-link>

        <!-- Live Clock Pill (Visible on lg+) -->
        <div v-if="currentTime" class="time-capsule d-none d-lg-flex align-items-center gap-2">
          <span class="status-live-dot" title="Sistem Aktif"></span>
          <i class="far fa-clock text-primary"></i>
          <span>{{ currentTime }}</span>
        </div>

        

        <!-- Profile Capsule & Dropdown -->
        <div class="profile-dropdown-wrapper" ref="profileDropdownRef">
          <!-- Capsule Trigger Button -->
          <button
            type="button"
            class="profile-capsule"
            :class="{ active: showMenu, 'dark-capsule': darkMode }"
            @click="toggleMenu"
            aria-label="Menu Pengguna"
            :aria-expanded="showMenu"
          >
            <!-- Avatar -->
            <div class="capsule-avatar-wrap">
              <img
                v-if="user?.photo && !imageError"
                :src="user.photo"
                @error="imageError = true"
                alt="Foto Profil"
                class="capsule-avatar-img"
              />
              <span v-else class="capsule-avatar-fallback">
                {{ userInitials }}
              </span>
              <span class="active-pulse-dot" title="Online"></span>
            </div>

            <!-- User Text info (Desktop) -->
            <div class="capsule-user-meta d-none d-sm-flex">
              <span class="capsule-user-name" :class="darkMode ? 'text-white' : 'text-slate-900'">
                {{ user?.name || "Memuat..." }}
              </span>
              <span class="capsule-user-role" :class="darkMode ? 'text-slate-400' : 'text-slate-500'">
                {{ user?.level || "Staf BTS" }}
              </span>
            </div>

            <!-- Chevron -->
            <i class="fas fa-chevron-down capsule-chevron" :class="{ 'rotate-180': showMenu }"></i>
          </button>

          <!-- Modern Floating Dropdown Card -->
          <transition name="dropdown-pop">
            <div 
              v-if="showMenu" 
              class="modern-profile-menu shadow-lg"
              :class="{ 'dropdown-dark': darkMode }"
            >
              <!-- Menu Header Card -->
              <div class="menu-user-header">
                <div class="header-avatar-box">
                  <img
                    v-if="user?.photo && !imageError"
                    :src="user.photo"
                    @error="imageError = true"
                    alt="Foto Profil"
                    class="header-avatar-img"
                  />
                  <div v-else class="header-avatar-fallback">
                    {{ userInitials }}
                  </div>
                  <span class="header-status-badge" title="Akun Aktif"></span>
                </div>

                <div class="header-info-box">
                  <h6 class="header-name" :class="darkMode ? 'text-white' : 'text-slate-900'">
                    {{ user?.name || "Pengguna BTS" }}
                  </h6>
                  <p class="header-username" :class="darkMode ? 'text-slate-400' : 'text-slate-500'">
                    @{{ user?.username || "user" }}
                  </p>
                  <div class="header-badge-row">
                    <span class="role-pill">
                      <i class="fas fa-shield-alt me-1"></i>
                      {{ user?.level || "Petugas" }}
                    </span>
                  </div>
                </div>
              </div>

              <div class="menu-divider" :class="{ 'divider-dark': darkMode }"></div>

              <!-- Menu Items -->
              <div class="menu-links-list">
                <!-- Edit Profil -->
                <router-link
                  v-if="user && user.id"
                  :to="{ name: 'Edit.User', params: { id: user.id } }"
                  @click="showMenu = false"
                  class="menu-link-item"
                  :class="{ 'link-dark': darkMode }"
                >
                  <div class="link-icon-box bg-blue-subtle">
                    <i class="fas fa-user-edit text-primary"></i>
                  </div>
                  <div class="link-text-box">
                    <span class="link-title" :class="darkMode ? 'text-slate-200' : 'text-slate-800'">Pengaturan Profil</span>
                    <span class="link-desc" :class="darkMode ? 'text-slate-400' : 'text-slate-500'">Ubah identitas & sandi</span>
                  </div>
                  <i class="fas fa-chevron-right link-arrow"></i>
                </router-link>

               

                <!-- Laporan Quick Link -->
                <router-link
                  to="/laporan"
                  @click="showMenu = false"
                  class="menu-link-item"
                  :class="{ 'link-dark': darkMode }"
                >
                  <div class="link-icon-box bg-amber-subtle">
                    <i class="fas fa-file-invoice text-warning"></i>
                  </div>
                  <div class="link-text-box">
                    <span class="link-title" :class="darkMode ? 'text-slate-200' : 'text-slate-800'">Laporan</span>
                    <span class="link-desc" :class="darkMode ? 'text-slate-400' : 'text-slate-500'">Rekapitulasi kunjungan</span>
                  </div>
                  <i class="fas fa-chevron-right link-arrow"></i>
                </router-link>
              </div>

              <div class="menu-divider" :class="{ 'divider-dark': darkMode }"></div>

              <!-- Logout Button Action -->
              <div class="menu-footer">
                <button
                  type="button"
                  @click="logout"
                  :disabled="loggingOut"
                  class="btn-logout-action"
                >
                  <span v-if="loggingOut" class="spinner-border spinner-border-sm me-2"></span>
                  <i v-else class="fas fa-sign-out-alt me-2 text-danger"></i>
                  <span>{{ loggingOut ? "Sedang Keluar..." : "Keluar (Logout)" }}</span>
                </button>
              </div>
            </div>
          </transition>
        </div>
      </div>
    </div>
  </nav>
</template>

<style scoped>
/* ----------------------------------------------------
   GLASSMORPHIC NAVBAR CONTAINER (SMART AUTO-HIDE)
----------------------------------------------------- */
.navbar-glassmorphic {
  position: sticky !important;
  top: 1rem !important;
  z-index: 1020 !important;
  backdrop-filter: blur(16px) saturate(180%);
  -webkit-backdrop-filter: blur(16px) saturate(180%);
  border-radius: 16px;
  transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1),
              opacity 0.25s ease,
              box-shadow 0.25s ease !important;
  will-change: transform, opacity;
}

.navbar-glassmorphic.navbar-hidden {
  transform: translateY(-135%) scale(0.98);
  opacity: 0;
  pointer-events: none;
}

.navbar-glassmorphic.navbar-scrolled {
  box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.08), 0 2px 6px -1px rgba(0, 0, 0, 0.03) !important;
}

.navbar-glass-dark.navbar-scrolled {
  box-shadow: 0 12px 36px 0 rgba(0, 0, 0, 0.45) !important;
}

@media (max-width: 575.98px) {
  .navbar-glassmorphic {
    margin-left: 0.75rem !important;
    margin-right: 0.75rem !important;
    top: 0.5rem !important;
    padding-left: 0.75rem !important;
    padding-right: 0.75rem !important;
  }
}

.navbar-glass-light {
  background: rgba(255, 255, 255, 0.92) !important;
  border: 1px solid rgba(255, 255, 255, 0.95) !important;
  box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.05), 0 2px 6px -1px rgba(0, 0, 0, 0.02) !important;
}

.navbar-glass-dark {
  background: rgba(24, 24, 27, 0.90) !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.35) !important;
}

.sticky-nav {
  position: sticky;
  top: 1rem;
  z-index: 1020;
}

/* ----------------------------------------------------
   FAST ACTION BUTTON ("+ TAMBAH TAMU")
----------------------------------------------------- */
.btn-fast-action {
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  padding: 8px 18px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 0.84rem;
  display: inline-flex;
  align-items: center;
  transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);
  letter-spacing: 0.01em;
}

.btn-fast-action:hover {
  background: linear-gradient(135deg, #1d4ed8, #1e40af);
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(37, 99, 235, 0.38);
}

.btn-fast-action-mobile {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  transition: transform 0.2s ease;
}

.btn-fast-action-mobile:hover {
  transform: scale(1.05);
}

/* ----------------------------------------------------
   LIVE TIME CAPSULE
----------------------------------------------------- */
.time-capsule {
  font-size: 12px;
  font-weight: 600;
  padding: 6px 14px;
  border-radius: 10px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  color: #334155;
  user-select: none;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
}

.navbar-glass-dark .time-capsule {
  background: rgba(39, 39, 42, 0.8);
  border-color: rgba(63, 63, 70, 0.8);
  color: #e2e8f0;
}

.status-live-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #10b981;
  box-shadow: 0 0 8px #10b981;
  animation: liveBlink 1.8s infinite ease-in-out;
}

@keyframes liveBlink {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(0.85); }
}

/* ----------------------------------------------------
   SIDEBAR HAMBURGER BUTTON (MOBILE)
----------------------------------------------------- */
.nav-hamburger-btn {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  color: #334155;
  width: 38px;
  height: 38px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  padding: 0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
}

.navbar-glass-dark .nav-hamburger-btn {
  background: rgba(39, 39, 42, 0.8);
  border-color: rgba(63, 63, 70, 0.8);
  color: #f1f5f9;
}

.sidenav-toggler-inner {
  width: 18px;
}

.sidenav-toggler-line {
  display: block;
  width: 100%;
  height: 2px;
  background-color: currentColor;
  margin-bottom: 3px;
  border-radius: 2px;
}

.sidenav-toggler-line:last-child {
  margin-bottom: 0;
}

/* ----------------------------------------------------
   THEME TOGGLE BUTTON (DARK / LIGHT MODE)
----------------------------------------------------- */
.theme-toggle-btn {
  background: rgba(255, 255, 255, 0.55);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(226, 232, 240, 0.8);
  color: #475569;
  width: 38px;
  height: 38px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14.5px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  padding: 0;
}

.theme-toggle-btn:hover {
  background: rgba(255, 255, 255, 0.85);
  transform: translateY(-1px);
}

.theme-toggle-btn.is-dark {
  background: rgba(30, 41, 59, 0.6);
  border-color: rgba(51, 65, 85, 0.6);
  color: #f59e0b;
}

.theme-toggle-btn.is-dark:hover {
  background: rgba(51, 65, 85, 0.85);
}

.theme-icon-sun {
  color: #f59e0b;
  font-size: 15px;
}

.theme-icon-moon {
  color: #3b82f6;
  font-size: 14px;
}

.theme-rotate-enter-active,
.theme-rotate-leave-active {
  transition: all 0.2s ease-in-out;
}

.theme-rotate-enter-from {
  opacity: 0;
  transform: rotate(-60deg) scale(0.7);
}

.theme-rotate-leave-to {
  opacity: 0;
  transform: rotate(60deg) scale(0.7);
}

/* ----------------------------------------------------
   PROFILE CAPSULE
----------------------------------------------------- */
.profile-dropdown-wrapper {
  position: relative;
}

.profile-capsule {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 14px 4px 5px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 9999px;
  color: #0f172a;
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.profile-capsule:hover,
.profile-capsule.active {
  background: #f8fafc;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
}

.profile-capsule.dark-capsule {
  background: rgba(39, 39, 42, 0.85);
  border-color: rgba(63, 63, 70, 0.8);
  color: #f1f5f9;
}

.profile-capsule.dark-capsule:hover,
.profile-capsule.dark-capsule.active {
  background: rgba(63, 63, 70, 0.95);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
}

.capsule-avatar-wrap {
  position: relative;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  flex-shrink: 0;
}

.capsule-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
  border: 2px solid #ffffff;
}

.capsule-avatar-fallback {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
  border: 2px solid #ffffff;
}

.active-pulse-dot {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #10b981;
  border: 2px solid #ffffff;
}

.capsule-user-meta {
  flex-direction: column;
  text-align: left;
  line-height: 1.25;
}

.capsule-user-name {
  font-size: 13px;
  font-weight: 700;
  max-width: 120px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.capsule-user-role {
  font-size: 10.5px;
  font-weight: 500;
  text-transform: capitalize;
}

.capsule-chevron {
  font-size: 11px;
  opacity: 0.7;
  margin-left: 2px;
  transition: transform 0.2s ease;
}

.capsule-chevron.rotate-180 {
  transform: rotate(180deg);
}

/* ----------------------------------------------------
   MODERN FLOATING DROPDOWN CARD
----------------------------------------------------- */
.modern-profile-menu {
  position: absolute;
  right: 0;
  top: calc(100% + 10px);
  width: 285px;
  background: #ffffff;
  border-radius: 18px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 20px 45px -10px rgba(15, 23, 42, 0.18), 0 0 0 1px rgba(0, 0, 0, 0.04);
  z-index: 1050;
  overflow: hidden;
  padding: 14px;
}

.dropdown-dark {
  background: #0f172a !important;
  border-color: #334155 !important;
  box-shadow: 0 20px 45px -10px rgba(0, 0, 0, 0.6) !important;
}

.menu-user-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 6px 4px 10px;
}

.header-avatar-box {
  position: relative;
  width: 48px;
  height: 48px;
  border-radius: 14px;
  flex-shrink: 0;
}

.header-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 14px;
  border: 2px solid #e2e8f0;
}

.header-avatar-fallback {
  width: 100%;
  height: 100%;
  border-radius: 14px;
  background: linear-gradient(135deg, #2563eb, #1e40af);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 17px;
  font-weight: 800;
}

.header-status-badge {
  position: absolute;
  bottom: -2px;
  right: -2px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #10b981;
  border: 2px solid #ffffff;
}

.header-info-box {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.header-name {
  font-size: 14px;
  font-weight: 800;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.header-username {
  font-size: 11.5px;
  margin: 1px 0 5px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.header-badge-row {
  display: flex;
}

.role-pill {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  background: rgba(37, 99, 235, 0.12);
  color: #2563eb;
  border-radius: 6px;
  font-size: 10.5px;
  font-weight: 700;
  text-transform: capitalize;
}

.menu-divider {
  height: 1px;
  background: #f1f5f9;
  margin: 6px 0;
}

.divider-dark {
  background: #334155 !important;
}

.menu-links-list {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.menu-link-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 10px;
  border-radius: 12px;
  text-decoration: none;
  transition: all 0.15s ease;
}

.menu-link-item:hover {
  background: #f8fafc;
}

.menu-link-item.link-dark:hover {
  background: #1e293b;
}

.link-icon-box {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  flex-shrink: 0;
}

.bg-blue-subtle { background: #eff6ff; }
.bg-emerald-subtle { background: #ecfdf5; }
.bg-amber-subtle { background: #fffbeb; }

.link-text-box {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.link-title {
  font-size: 12.5px;
  font-weight: 700;
}

.link-desc {
  font-size: 10.5px;
}

.link-arrow {
  font-size: 10px;
  color: #94a3b8;
  transition: transform 0.15s;
}

.menu-link-item:hover .link-arrow {
  transform: translateX(2px);
  color: #3b82f6;
}

.menu-footer {
  padding-top: 4px;
}

.btn-logout-action {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 9px 12px;
  border-radius: 12px;
  border: 1px solid #fee2e2;
  background: #fef2f2;
  color: #ef4444;
  font-size: 12.5px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-logout-action:hover:not(:disabled) {
  background: #fee2e2;
  border-color: #fca5a5;
  color: #dc2626;
  transform: translateY(-1px);
}

.btn-logout-action:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

/* Dropdown Animation */
.dropdown-pop-enter-active,
.dropdown-pop-leave-active {
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.dropdown-pop-enter-from,
.dropdown-pop-leave-to {
  opacity: 0;
  transform: scale(0.96) translateY(-8px);
}

.text-slate-200 { color: #e2e8f0 !important; }
.text-slate-400 { color: #94a3b8 !important; }
.text-slate-500 { color: #64748b !important; }
.text-slate-800 { color: #1e293b !important; }
.text-slate-900 { color: #0f172a !important; }
</style>
