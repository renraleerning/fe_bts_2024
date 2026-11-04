<script setup>
import { computed } from "vue";
import { useStore } from "vuex";
import SidenavList from "./SidenavList.vue";
import logoBts from "@/assets/img/logo_bts.png";
import bgSekolah from "@/assets/img/sekolah3.png";

const store = useStore();
const isRTL = computed(() => store.state.isRTL);
const layout = computed(() => store.state.layout);
const sidebarType = computed(() => store.state.sidebarType);
const darkMode = computed(() => store.state.darkMode);
</script>

<template>
  <!-- Modern Translucent School Hero Banner (Replaces harsh solid royal blue) -->
  <div
    v-show="layout === 'default'"
    class="min-height-300 position-absolute w-100 top-hero-banner"
    :class="{ 'dark-hero': darkMode }"
  >
    <!-- Layer 1: Background Foto Sekolah SMKN 2 Sumedang (Transparan Halus) -->
    <div
      class="hero-bg-layer"
      :style="{ backgroundImage: `url(${bgSekolah})` }"
      aria-hidden="true"
    ></div>

    <!-- Layer 2: Overlay Gradien Navy Glassmorphism seperti Showcase Menu Login -->
    <div class="hero-overlay-layer" aria-hidden="true"></div>

    <!-- Layer 3: Ambient Glow Lighting (Aksen Pencahayaan Mewah) -->
    <div class="hero-ambient-glow glow-1" aria-hidden="true"></div>
    <div class="hero-ambient-glow glow-2" aria-hidden="true"></div>

    <!-- Layer 4: Fade Gradien Bawah ke Konten Halaman -->
    <div class="hero-bottom-fade" aria-hidden="true"></div>
  </div>

  <aside
    class="my-3 overflow-auto border-0 sidenav navbar navbar-vertical navbar-expand-xs border-radius-xl shadow-sm"
    :class="`${isRTL ? 'me-3 rotate-caret fixed-end' : 'fixed-start ms-3'}    
      ${layout === 'landing' ? 'bg-transparent shadow-none' : ''} ${sidebarType}`"
    id="sidenav-main"
    data-color="primary"
  >
    <div class="sidenav-header position-relative py-3 px-3">
      <i
        class="top-0 p-3 cursor-pointer fas fa-times text-secondary opacity-5 position-absolute end-0 d-none d-xl-none"
        aria-hidden="true"
        id="iconSidenav"
      ></i>

      <router-link class="navbar-brand d-flex align-items-center m-0 p-0 text-decoration-none" to="/tamu">
        <div class="logo-box-wrapper me-2 shadow-sm">
          <img
            :src="logoBts"
            class="brand-logo-img"
            alt="Logo BTS - Buku Tamu Selfie"
          />
        </div>

        <div class="brand-text-wrapper d-flex flex-column">
          <span class="brand-title fw-bold" :class="darkMode || sidebarType === 'bg-default' ? 'text-white' : 'text-slate-900'">
            BTS Digital
          </span>
          <span class="brand-subtitle text-xs" :class="darkMode || sidebarType === 'bg-default' ? 'text-slate-400' : 'text-slate-500'">
            SMKN 2 Sumedang
          </span>
        </div>
      </router-link>
    </div>

    <hr class="mt-0 mb-2 horizontal dark opacity-2" />

    <sidenav-list />
  </aside>
</template>

<style scoped>
.top-hero-banner {
  min-height: 290px;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  overflow: hidden;
  background-color: #0b1528;
  z-index: 0;
  transition: all 0.35s ease-in-out;
}

/* School Photo Background Layer */
.hero-bg-layer {
  position: absolute;
  inset: -12px;
  background-size: cover;
  background-position: center 32%;
  background-repeat: no-repeat;
  opacity: 0.38;
  filter: blur(1px) saturate(1.15) brightness(0.95);
  transform: scale(1.02);
  transition: opacity 0.35s ease;
}

/* Translucent Gradient Overlay like Login Showcase */
.hero-overlay-layer {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    140deg,
    rgba(10, 25, 54, 0.88) 0%,
    rgba(15, 38, 80, 0.82) 42%,
    rgba(20, 55, 115, 0.74) 75%,
    rgba(10, 25, 54, 0.86) 100%
  );
  backdrop-filter: blur(1.5px);
  -webkit-backdrop-filter: blur(1.5px);
}

/* Ambient Glow Blobs */
.hero-ambient-glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(85px);
  pointer-events: none;
  opacity: 0.45;
}

.glow-1 {
  width: 480px;
  height: 320px;
  top: -90px;
  left: 8%;
  background: radial-gradient(circle, rgba(56, 189, 248, 0.38) 0%, rgba(37, 99, 235, 0) 70%);
}

.glow-2 {
  width: 520px;
  height: 340px;
  top: -100px;
  right: 5%;
  background: radial-gradient(circle, rgba(99, 102, 241, 0.32) 0%, rgba(30, 58, 138, 0) 70%);
}

/* Smooth Fade to Page Content at the bottom */
.hero-bottom-fade {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 95px;
  background: linear-gradient(
    to bottom,
    rgba(248, 249, 250, 0) 0%,
    rgba(248, 249, 250, 0.55) 45%,
    rgba(248, 249, 250, 1) 100%
  );
  pointer-events: none;
}

/* Dark Mode Support */
.top-hero-banner.dark-hero {
  background-color: #060a12 !important;
}

.top-hero-banner.dark-hero .hero-bg-layer {
  opacity: 0.22;
  filter: blur(1.5px) saturate(0.9) brightness(0.7);
}

.top-hero-banner.dark-hero .hero-overlay-layer {
  background: linear-gradient(
    140deg,
    rgba(6, 11, 20, 0.94) 0%,
    rgba(10, 18, 33, 0.90) 50%,
    rgba(15, 23, 42, 0.95) 100%
  ) !important;
}

.top-hero-banner.dark-hero .hero-ambient-glow {
  opacity: 0.25;
}

.top-hero-banner.dark-hero .hero-bottom-fade {
  background: linear-gradient(
    to bottom,
    rgba(17, 24, 39, 0) 0%,
    rgba(17, 24, 39, 0.65) 45%,
    rgba(17, 24, 39, 1) 100%
  ) !important;
}

.logo-box-wrapper {
  height: 42px;
  min-width: 68px;
  max-width: 80px;
  border-radius: 12px;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  padding: 4px 6px;
  border: 1px solid rgba(226, 232, 240, 0.85);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.logo-box-wrapper:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08) !important;
}

.brand-logo-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.brand-text-wrapper {
  line-height: 1.2;
}

.brand-title {
  font-size: 0.95rem;
  letter-spacing: -0.01em;
}

.brand-subtitle {
  font-size: 0.72rem;
  font-weight: 500;
  letter-spacing: 0.02em;
}

.text-slate-400 { color: #94a3b8 !important; }
.text-slate-500 { color: #64748b !important; }
.text-slate-900 { color: #0f172a !important; }
</style>
