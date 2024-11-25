<script setup>
import { ref, onBeforeMount, onMounted, onBeforeUnmount, computed } from "vue";
import { useStore } from "vuex";

//import api
import api from "../../api";
import setTooltip from "@/assets/js/tooltip.js";
import CreateJabatan from "../components/CreateJabatan.vue";

const body = document.getElementsByTagName("body")[0];

const store = useStore();

//define state
const jabatans = ref([]);
const searchQuery = ref(""); // Search input
const perPage = ref(5); // Number of records per page
const currentPage = ref(1); // Current page
const loading = ref(true);

//method fetchDataJabatans
const fetchDataJabatans = async () => {
  //fetch data
  loading.value = true;
  await api
    .get("/api/jabatan")

    .then((response) => {
      //set response data to state "jabatan"
      jabatans.value = response.data.data.data;
      loading.value = false;
    });
};
// Filtered jabatans based on the search query
const filteredJabatans = computed(() => {
  if (searchQuery.value) {
    return jabatans.value.filter((jabatan) =>
      jabatan.nama_jabatan
        .toLowerCase()
        .includes(searchQuery.value.toLowerCase())
    );
  } else {
    return jabatans.value;
  }
});

// Get paginated guests for the current page based on filtered jabatans
const paginatedJabatans = computed(() => {
  const start = (currentPage.value - 1) * perPage.value;
  const end = start + perPage.value;
  return filteredJabatans.value.slice(start, end);
});

// Total pages calculated from filtered jabatans data
const totalPages = computed(() => {
  return Math.ceil(filteredJabatans.value.length / perPage.value);
});

// Set the current page
const setPage = (page) => {
  currentPage.value = page;
};

// Move to the next page
const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value += 1;
  }
};

// Move to the previous page
const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value -= 1;
  }
};

onMounted(() => {
  store.state.isAbsolute = true;
  setTooltip();
  fetchDataJabatans();
});
onBeforeMount(() => {
  store.state.imageLayout = "profile-overview";
  store.state.showNavbar = false;
  store.state.showFooter = true;
  store.state.hideConfigButton = true;
  body.classList.add("profile-overview");
});
onBeforeUnmount(() => {
  store.state.isAbsolute = false;
  store.state.imageLayout = "default";
  store.state.showNavbar = true;
  store.state.showFooter = true;
  store.state.hideConfigButton = false;
  body.classList.remove("profile-overview");
});
</script>
<template>
  <main>
    <div class="container-fluid">
      <div
        class="gambar-footer page-header min-height-300"
        style="margin-top: -24px; margin-right: -48px; margin-left: -34%"
      >
        <span class="mask bg-gradient-success opacity-6"></span>
      </div>
      <div class="card shadow-lg mt-n6">
        <div class="card-body p-3">
          <div class="row gx-4">
            <div class="col-auto">
              <div class="avatar avatar-xl position-relative">
                <img
                  src="../../assets/img/logo.png"
                  alt="profile_image"
                  class="shadow-sm w-70 border-radius-lg"
                />
              </div>
            </div>
            <div class="col-auto my-auto">
              <div class="h-100">
                <h5 class="mb-1">Buku Tamu Selfie</h5>
                <p class="mb-0 font-weight-bold text-sm">
                  SMK Negeri 2 Sumedang
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="py-4 container-fluid">
      <div class="row">
        <div class="col-md-8">
          <div class="card">
            <div class="card-header pb-0">
              <h6>Jabatan Information</h6>
              <!-- Search Form -->
              <div class="card-header pb-0">
                <!-- Flexbox container for horizontal alignment -->
                <div
                  class="d-flex justify-content-between align-items-center w-100"
                >
                  <!-- Search Form -->
                  <div class="input-group w-45">
                    <span class="input-group-text text-body">
                      <i class="fas fa-search" aria-hidden="true"></i>
                    </span>
                    <input
                      type="text"
                      class="form-control"
                      placeholder="Cari berdasarkan nama..."
                      v-model="searchQuery"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div class="table-responsive p-0">
              <table class="table align-items-center mb-0">
                <thead>
                  <tr>
                    <th
                      class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7"
                    >
                      No
                    </th>
                    <th
                      class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7 ps-2"
                    >
                      Nama Jabatan
                    </th>
                    <th
                      class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7 ps-2"
                    >
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="filteredJabatans.length == 0">
                    <td v-if="loading" colspan="7" class="text-center">
                      <div class="alert alert-light mb-0">Loading...</div>
                    </td>
                    <td v-else colspan="7" class="text-center">
                      <div class="alert alert-danger mb-0">
                        Data Belum Tersedia!
                      </div>
                    </td>
                  </tr>
                  <tr
                    v-else
                    v-for="(jabatan, index) in paginatedJabatans"
                    :key="index"
                  >
                    <td class="ps-4 text-sm">
                      {{ (currentPage - 1) * perPage + index + 1 }}
                    </td>

                    <td class="text-sm">{{ jabatan.nama_jabatan }}</td>
                    <td class="text-sm">{{ jabatan.status }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <!-- Pagination Controls -->
            <nav aria-label="Page navigation example">
              <ul class="pagination justify-content-center mt-3">
                <!-- Previous Button -->
                <li class="page-item" :class="{ disabled: currentPage === 1 }">
                  <button class="page-link no-rounded" @click="prevPage">
                    <span aria-hidden="true">&laquo;</span>
                  </button>
                </li>

                <!-- First Page -->
                <li class="page-item" :class="{ active: currentPage === 1 }">
                  <button class="page-link no-rounded" @click="setPage(1)">
                    1
                  </button>
                </li>

                <!-- Ellipsis Before Current Page Range -->
                <li v-if="currentPage > 3" class="page-item disabled">
                  <span class="page-link">...</span>
                </li>

                <!-- Dynamic Pages Around Current Page -->
                <li
                  v-for="page in dynamicPages"
                  :key="page"
                  :class="{ active: currentPage === page }"
                >
                  <button class="page-link no-rounded" @click="setPage(page)">
                    {{ page }}
                  </button>
                </li>

                <!-- Ellipsis After Current Page Range -->
                <li
                  v-if="currentPage < totalPages - 2"
                  class="page-item disabled"
                >
                  <span class="page-link">...</span>
                </li>

                <!-- Last Page -->
                <li
                  class="page-item"
                  :class="{ active: currentPage === totalPages }"
                >
                  <button
                    class="page-link no-rounded"
                    @click="setPage(totalPages)"
                  >
                    {{ totalPages }}
                  </button>
                </li>

                <!-- Next Button -->
                <li
                  class="page-item"
                  :class="{ disabled: currentPage === totalPages }"
                >
                  <button class="page-link no-rounded" @click="nextPage">
                    <span aria-hidden="true">&raquo;</span>
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        </div>
        <div class="col-md-4">
          <CreateJabatan />
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
.gambar-footer {
  background-image: url("../../assets/img/hero.png");
  background-size: 100% 100%;
}
</style>
