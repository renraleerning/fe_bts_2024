<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import { useRoute } from "vue-router";
import { useStore } from "vuex";
import { getStoredUser } from "@/utils/auth";
import api from "@/api";

import SidenavItem from "./SidenavItem.vue";

const store = useStore();
const isRTL = computed(() => store.state.isRTL);

const route = useRoute();
const getRoute = () => {
  const routeArr = route.path.split("/");
  return routeArr[1];
};

// Role & Permission State
const currentUser = ref(getStoredUser());

const updateUserData = () => {
  currentUser.value = getStoredUser();
};

const isAdmin = computed(() => {
  const level = (currentUser.value?.level || "").toLowerCase().trim();
  return level === "admin" || level === "administrator";
});

// Active Event State for 1 Orang = 1x Presensi indicator
const activeEvent = ref(null);

const fetchActiveEvent = async () => {
  try {
    const res = await api.get("/api/event/active");
    activeEvent.value = res.data?.data || null;
  } catch (err) {
    activeEvent.value = null;
  }
};

watch(
  () => route.path,
  () => {
    updateUserData();
    fetchActiveEvent();
  }
);

onMounted(() => {
  updateUserData();
  fetchActiveEvent();
  window.addEventListener("storage", updateUserData);
});

onUnmounted(() => {
  window.removeEventListener("storage", updateUserData);
});
</script>
<template>
  <div
    class="collapse navbar-collapse w-auto h-auto h-100"
    id="sidenav-collapse-main"
  >
    <ul class="navbar-nav">
      <!-- Tamu (Akses: Admin & Petugas) -->
      <li class="nav-item">
        <sidenav-item
          to="/tamu"
          :class="getRoute() === 'tamu' ? 'active' : ''"
          :navText="isRTL ? 'لوحة القيادة' : 'Daftar Tamu'"
        >
          <template v-slot:icon>
            <i class="ni ni-tv-2 text-primary text-sm opacity-10"></i>
          </template>
        </sidenav-item>
      </li>

      <!-- Data Master Section (Khusus Admin / Administrator) -->
      <template v-if="isAdmin">
        <li class="mt-3 nav-item">
          <h6
            v-if="isRTL"
            class="text-xs ps-4 text-uppercase font-weight-bolder opacity-6"
            :class="isRTL ? 'me-4' : 'ms-2'"
          >
            صفحات المرافق
          </h6>

          <h6
            v-else
            class="text-xs ps-4 text-uppercase font-weight-bolder opacity-6"
            :class="isRTL ? 'me-4' : 'ms-2'"
          >
            Data Master
          </h6>
        </li>

        <li class="nav-item">
          <sidenav-item
            to="/user"
            :class="getRoute() === 'user' ? 'active' : ''"
            :navText="isRTL ? 'حساب تعريفي' : 'User'"
          >
            <template v-slot:icon>
              <i class="ni ni-single-02 text-dark text-sm opacity-10"></i>
            </template>
          </sidenav-item>
        </li>

        <li class="nav-item">
          <sidenav-item
            to="/bagian"
            :class="getRoute() === 'bagian' ? 'active' : ''"
            :navText="isRTL ? 'الواقع الافتراضي' : 'Bagian/Department'"
          >
            <template v-slot:icon>
              <i class="ni ni-app text-info text-sm opacity-10"></i>
            </template>
          </sidenav-item>
        </li>

        <li class="nav-item">
          <sidenav-item
            to="/jabatan"
            :class="getRoute() === 'jabatan' ? 'active' : ''"
            :navText="isRTL ? 'تسجيل الدخول' : 'Master Jabatan'"
          >
            <template v-slot:icon>
              <i class="ni ni-single-copy-04 text-danger text-sm opacity-10"></i>
            </template>
          </sidenav-item>
        </li>

        <li class="nav-item">
          <sidenav-item
            to="/pegawai"
            :class="getRoute() === 'pegawai' ? 'active' : ''"
            :navText="isRTL ? 'اشتراك' : 'Pegawai'"
          >
            <template v-slot:icon>
              <i class="ni ni-collection text-info text-sm opacity-10"></i>
            </template>
          </sidenav-item>
        </li>

        <!-- Buku Tamu Event (Eksklusif Admin) -->
        <li class="nav-item">
          <sidenav-item
            to="/event"
            :class="getRoute() === 'event' ? 'active' : ''"
            :navText="isRTL ? 'الأحداث' : 'Buku Tamu Event'"
          >
            <template v-slot:icon>
              <i class="ni ni-calendar-grid-58 text-warning text-sm opacity-10"></i>
            </template>
          </sidenav-item>
        </li>
      </template>

      <!-- Laporan Section (Akses: Admin & Petugas) -->
      <li class="mt-3 nav-item">
        <h6 class="text-xs ps-4 text-uppercase font-weight-bolder opacity-6 ms-2">
          Laporan
        </h6>
      </li>

      <li class="nav-item">
        <sidenav-item
          to="/laporan"
          :class="getRoute() === 'laporan' ? 'active' : ''"
          :navText="isRTL ? 'تقرير' : 'Laporan'"
        >
          <template v-slot:icon>
            <i class="ni ni-paper-diploma text-success text-sm opacity-10"></i>
          </template>
        </sidenav-item>
      </li>
    </ul>

    <!-- Info Aturan Event di Sidebar (Hanya 1 Saja Sesuai Permintaan) -->
    <router-link
      v-if="activeEvent && activeEvent.limit_one_response"
      :to="isAdmin ? '/event' : '/detail-event/' + activeEvent.id"
      class="sidebar-limit-box mx-3 mt-4 mb-2 p-2-5 rounded-3 border text-decoration-none"
      title="Aturan Event: 1 Orang = 1x Presensi"
    >
      <div class="d-flex align-items-center gap-2">
        <div class="sidebar-limit-icon flex-shrink-0">
          <i class="fas fa-shield-alt text-warning"></i>
        </div>
        <div class="overflow-hidden">
          <div class="sidebar-limit-title">1 Orang = 1x Presensi</div>
          <small class="sidebar-limit-event text-truncate d-block" :title="activeEvent.nama_event">
            {{ activeEvent.nama_event }}
          </small>
        </div>
      </div>
    </router-link>
  </div>
</template>

<style scoped>
.sidebar-limit-box {
  background: #fffbeb;
  border: 1px solid #fde68a !important;
  box-shadow: 0 2px 6px rgba(180, 83, 9, 0.08);
  transition: all 0.2s ease;
  display: block;
}

.sidebar-limit-box:hover {
  background: #fef3c7;
  border-color: #fcd34d !important;
  transform: translateY(-1px);
}

.sidebar-limit-icon {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #fef3c7;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
}

.sidebar-limit-title {
  font-size: 0.74rem;
  font-weight: 700;
  color: #92400e;
  line-height: 1.2;
}

.sidebar-limit-event {
  font-size: 0.68rem;
  color: #b45309;
  font-weight: 500;
}
</style>
