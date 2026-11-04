<script setup>
/* eslint-disable */
import { ref, onMounted, onBeforeMount, onBeforeUnmount } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useStore } from "vuex";
import api from "../../api";
import PublicEventPresensi from "./PublicEventPresensi.vue";

const route = useRoute();
const router = useRouter();
const store = useStore();

const eventId = route.params.id;
const event = ref(null);
const isLoading = ref(true);
const errorMessage = ref("");

// Sembunyikan navbar dan sidebar saat halaman presensi dibuka langsung via QR/link publik
onBeforeMount(() => {
  if (store && store.state) {
    store.state.showNavbar = false;
    store.state.showSidenav = false;
    store.state.showFooter = false;
  }
});

onMounted(async () => {
  isLoading.value = true;
  try {
    const res = await api.get(`/api/event/${eventId}`);
    event.value = res.data?.data || null;
    if (!event.value) {
      errorMessage.value = "Event tidak ditemukan.";
    }
  } catch (err) {
    console.error("Gagal memuat event:", err);
    errorMessage.value = err.response?.data?.message || "Event tidak ditemukan atau sudah ditutup.";
  } finally {
    isLoading.value = false;
  }
});

onBeforeUnmount(() => {
  if (store && store.state) {
    store.state.showNavbar = true;
    store.state.showSidenav = true;
    store.state.showFooter = true;
  }
});
</script>

<template>
  <div class="direct-event-wrapper py-3 py-sm-4 container-fluid public-mode-container">
    <!-- Loading State -->
    <div v-if="isLoading" class="min-vh-80 d-flex flex-column align-items-center justify-content-center py-5">
      <div class="spinner-border text-primary mb-3" role="status" style="width: 3rem; height: 3rem;"></div>
      <h6 class="fw-bold text-slate-700">Memuat Formulir Event...</h6>
      <p class="text-slate-400 text-xs">Mohon tunggu sebentar.</p>
    </div>

    <!-- Error State -->
    <div v-else-if="errorMessage || !event" class="min-vh-80 d-flex align-items-center justify-content-center py-5">
      <div class="card border-0 shadow-sm rounded-4 p-4 p-md-5 text-center max-w-500 mx-auto">
        <div class="icon-circle bg-red-light text-danger mx-auto mb-3" style="width: 60px; height: 60px; font-size: 24px;">
          <i class="fas fa-calendar-times"></i>
        </div>
        <h5 class="fw-bold text-slate-800 mb-2">Event Tidak Tersedia</h5>
        <p class="text-slate-500 text-xs mb-4">
          {{ errorMessage || "Formulir untuk event ini sedang tidak dapat diakses atau sudah selesai." }}
        </p>
        <div>
          <router-link to="/" class="btn btn-primary btn-sm rounded-pill px-4 py-2 text-xs">
            <i class="fas fa-home me-1"></i> Ke Halaman Utama
          </router-link>
        </div>
      </div>
    </div>

    <!-- Public Presensi Component -->
    <PublicEventPresensi v-else :event="event" />
  </div>
</template>

<style scoped>
.direct-event-wrapper {
  max-width: 1100px;
  margin: 0 auto;
}
.min-vh-80 {
  min-height: 70vh;
}
.max-w-500 {
  max-width: 500px;
}
.icon-circle {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}
.bg-red-light {
  background-color: #fee2e2;
}
</style>
