<script setup>
import { computed, onMounted, ref } from "vue";
import { useStore } from "vuex";
import { useRoute, useRouter } from "vue-router";
import axios from "axios";
import Breadcrumbs from "../Breadcrumbs.vue";

// State token dari localStorage
const token = localStorage.getItem("token");

// Inisialisasi Vue Router pada Composition API
const router = useRouter();

// State untuk user
const user = ref("");

// Global axios interceptor untuk menangani error token kadaluarsa atau tidak valid
axios.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // Jika token kadaluarsa atau tidak valid, hapus token dari localStorage
      localStorage.removeItem("token");

      // Redirect ke halaman login
      return router.push({
        name: "Signin",
      });
    }
    return Promise.reject(error);
  }
);

// Cek apakah token ada saat komponen dimuat
onMounted(() => {
  if (!token) {
    // Jika token tidak ada, arahkan ke halaman login
    return router.push({
      name: "Signin",
    });
  }

  // Jika token ada, ambil data user
  axios.defaults.headers.common.Authorization = `Bearer ${token}`;
  axios
    .get("http://localhost:8000/api/user")
    .then((response) => {
      // Pastikan response dan response.data ada sebelum mengaksesnya
      if (response && response.data) {
        user.value = response.data;  // Set data user dari API response
      } else {
        console.error("Respons tidak valid: ", response);
      }
    })
    .catch((error) => {
      // Tangani error dengan lebih informatif
      if (error.response) {
        console.error("Error respons dari server: ", error.response);
      } else if (error.request) {
        console.error("Tidak ada respons dari server: ", error.request);
      } else {
        console.error("Error lainnya: ", error.message);
      }
    });
});

// Import api
import api from "../../api";

// State untuk daftar users
const users = ref([]);

// Method untuk fetch data users
const fetchDataUsers = async () => {
  await api
    .get("/api/users")
    .then((response) => {
      if (response && response.data && response.data.data) {
        users.value = response.data.data[0]; // Set data users dari API
      } else {
        console.error("Data tidak ditemukan dalam respons: ", response);
      }
    })
    .catch(() => {
      // Jika error (token tidak valid), hapus token dan redirect ke login
      localStorage.removeItem("token");
      router.push({
        name: "Signin",
      });
    });
};

// Fetch data users saat komponen dimuat
onMounted(() => {
  fetchDataUsers();
});

// Method logout
function logout() {
  // Mengatur Authorization header dengan token
  axios.defaults.headers.common.Authorization = `Bearer ${token}`;

  // Request API logout
  axios
    .post("http://localhost:8000/api/logout")
    .then((response) => {
      if (response.data.success) {
        // Hapus token dari localStorage
        localStorage.removeItem("token");

        // Redirect ke halaman login
        router.push({
          name: "Signin",
        });
      }
    })
    .catch((error) => {
      console.log(error.response.data);
    });
}

// State untuk kontrol tampilan menu
const showMenu = ref(false);
const store = useStore();
const isRTL = computed(() => store.state.isRTL);

const route = useRoute();
const currentRouteName = computed(() => route.name);

// Fungsi untuk meminimalkan sidebar
const minimizeSidebar = () => store.commit("sidebarMinimize");

// Fungsi untuk toggle configurator
const toggleConfigurator = () => store.commit("toggleConfigurator");

// Fungsi untuk menutup menu
const closeMenu = () => {
  setTimeout(() => {
    showMenu.value = false;
  }, 100);
};
</script>

<template>
  <nav
    class="navbar navbar-main navbar-expand-lg px-0 mx-4 shadow-none border-radius-xl"
    :class="isRTL ? 'top-0 position-sticky z-index-sticky' : ''"
    id="navbarBlur"
    data-scroll="true"
  >
    <div class="px-3 py-1 container-fluid">
      <breadcrumbs :current-page="currentRouteName" :current-directory="currentRouteName" />

      <div
        class="mt-2 collapse navbar-collapse mt-sm-0 me-md-0 me-sm-4"
        :class="isRTL ? 'px-0' : 'me-sm-4'"
        id="navbar"
      >
        <div class="pe-md-3 d-flex align-items-center" :class="isRTL ? 'me-md-auto' : 'ms-md-auto'"></div>

        <ul class="navbar-nav justify-content-end">
          <li class="nav-item dropdown d-flex align-items-center" :class="isRTL ? 'ps-2' : 'pe-2'">
            <a
              href="#"
              class="p-0 nav-link text-white"
              :class="[showMenu ? 'show' : '']"
              id="dropdownMenuButton"
              data-bs-toggle="dropdown"
              aria-expanded="false"
              @click="showMenu = !showMenu"
              @blur="closeMenu"
            >
              <img :src="user.photo" class="rounded-circle border border-2 border-white me-2" style="width: 30px; height: 30px" />
              <span class="d-sm-inline d-none">{{ user.level }}</span>
            </a>

            <ul
              class="px-3 py-2 dropdown-menu dropdown-menu-end me-sm-n4 mb-2"
              :class="showMenu ? 'show' : ''"
              aria-labelledby="dropdownMenuButton"
            >
              <div class="mt-2 d-flex justify-content-center align-items-center">
                <img :src="user.photo" width="100" height="100" class="rounded-2 center" />
              </div>
              <div class="mt-2 d-flex justify-content-center align-items-center">
                <b>{{ user.name }}</b>
              </div>
              <hr class="mt-2 horizontal dark" />
              <div class="d-flex justify-content-between align-items-center">
                <router-link
                  v-if="user && user.id"
                  :to="{ name: 'Edit.User', params: { id: user.id } }"
                  class="btn btn-primary rounded-sm shadow border-0"
                  ><i class="fa fa-edit"></i>
                </router-link>
                <button @click.prevent="logout" class="btn btn-danger rounded-sm shadow border-0 ms-3">
                  <i class="fa fa-sign-out-alt"></i>
                </button>
              </div>
            </ul>
          </li>

          <li class="nav-item d-xl-none ps-3 d-flex align-items-center">
            <a href="#" @click="minimizeSidebar" class="p-0 nav-link text-white" id="iconNavbarSidenav">
              <div class="sidenav-toggler-inner">
                <i class="sidenav-toggler-line bg-white"></i>
                <i class="sidenav-toggler-line bg-white"></i>
                <i class="sidenav-toggler-line bg-white"></i>
              </div>
            </a>
          </li>
          <li class="px-3 nav-item d-flex align-items-center">
            <a class="p-0 nav-link text-white" @click="toggleConfigurator">
              <i class="cursor-pointer fa fa-cog fixed-plugin-button-nav"></i>
            </a>
          </li>
        </ul>
      </div>
    </div>
  </nav>
</template>
