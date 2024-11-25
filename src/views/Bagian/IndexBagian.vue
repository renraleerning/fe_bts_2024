<script setup>
import { ref, onBeforeMount, onMounted, onBeforeUnmount, computed } from "vue";
import { useStore } from "vuex";

//import api
import api from "../../api";
import setTooltip from "@/assets/js/tooltip.js";
import ProfileBagian from "../components/ProfileBagian.vue";

const body = document.getElementsByTagName("body")[0];

const store = useStore();

//define state
const bagians = ref([]);
const searchQuery = ref(""); // Search input
const perPage = ref(5); // Number of records per page
const currentPage = ref(1); // Current page
const loading = ref(true);

//method fetchDataPosts
const fetchDataBagians = async () => {
  //fetch data
  loading.value = true;
  await api
    .get("/api/bagian")

    .then((response) => {
      //set response data to state "posts"
      bagians.value = response.data.data.data;
      loading.value = false;
    });
};

// Filtered bagians based on the search query
const filteredBagians = computed(() => {
  if (searchQuery.value) {
    return bagians.value.filter((bagian) =>
      bagian.nama_bagian.toLowerCase().includes(searchQuery.value.toLowerCase())
    );
  } else {
    return bagians.value;
  }
});

// Get paginated guests for the current page based on filtered bagians
const paginatedbagians = computed(() => {
  const start = (currentPage.value - 1) * perPage.value;
  const end = start + perPage.value;
  return filteredBagians.value.slice(start, end);
});

// Total pages calculated from filtered bagians data
const totalPages = computed(() => {
  return Math.ceil(filteredBagians.value.length / perPage.value);
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

//delete
const showConfirmDialog = ref(false);
const itemId = ref(null);

const confirmDelete = (id) => {
  itemId.value = id;
  showConfirmDialog.value = true;
};

const cancelDelete = () => {
  showConfirmDialog.value = false;
  itemId.value = null;
};

const deleteBagian = async () => {
  try {
    await api.delete(`/api/bagian/${itemId.value}`);
    fetchDataBagians(); // Pastikan fungsi ini sudah didefinisikan
    console.log("Bagian berhasil dihapus");
    showConfirmDialog.value = false;
  } catch (error) {
    console.error("Terjadi kesalahan saat menghapus data bagian:", error);
  }
};

onMounted(() => {
  store.state.isAbsolute = true;
  //setNavPills();
  setTooltip();
  fetchDataBagians();
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
              <h6>Bagian Information</h6>
              <!-- Search Form -->
              <div class="card-header pb-0">
                <!-- Flexbox container for horizontal alignment -->
                <div
                  class="d-flex justify-content-between align-items-center w-100"
                >
                  <!-- Add Bagian Button -->
                  <router-link
                    :to="{ name: 'Create.Bagian' }"
                    class="btn btn-md btn-success rounded-sm shadow border-0"
                  >
                    <i class="fa fa-user-plus"></i> &nbsp;ADD BAGIAN
                  </router-link>

                  <!-- Search Form -->
                  <div class="input-group w-40">
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
                      Nama
                    </th>
                    <th
                      class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7 ps-2"
                    >
                      Status
                    </th>
                    <th
                      class="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7"
                    >
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="filteredBagians.length == 0">
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
                    v-for="(bagian, index) in paginatedbagians"
                    :key="index"
                  >
                    <td class="ps-4 text-sm">
                      {{ (currentPage - 1) * perPage + index + 1 }}
                    </td>

                    <td class="text-sm">{{ bagian.nama_bagian }}</td>
                    <td class="text-sm">{{ bagian.status }}</td>
                    <td class="text-center">
                      <router-link
                        :to="{ name: 'Edit.Bagian', params: { id: bagian.id } }"
                        class="btn btn-primary rounded-sm shadow border-0 me-2"
                        ><i class="fa fa-edit"></i
                      ></router-link>
                      <button
                        @click="confirmDelete(bagian.id)"
                        class="btn btn-danger rounded-sm shadow border-0 me-2"
                      >
                        <i class="fa fa-trash"></i>
                      </button>

                      <div>
                        <div
                          v-if="showConfirmDialog"
                          class="confirm-dialog card"
                        >
                          <p>
                            Apakah Anda yakin ingin menghapus data bagian ini?
                          </p>
                          <div class="button-container">
                            <button
                              @click.prevent="deleteBagian(bagian.id)"
                              class="btn btn-sm btn-primary rounded-sm shadow border-0 me-2"
                            >
                              Ya
                            </button>
                            <button
                              @click="cancelDelete"
                              class="btn btn-sm btn-outline-secondary rounded-sm shadow border-0"
                            >
                              Tidak
                            </button>
                          </div>
                        </div>
                      </div>
                    </td>
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
          <profile-bagian />
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
.confirm-dialog {
  background-color: #fff;
  border: 1px solid #ccc;
  padding: 20px;
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.button-container {
  display: flex; /* Mengatur tombol agar sejajar */
  gap: 5px; /* Jarak antara tombol */
  justify-content: center; /* Memusatkan tombol secara horizontal */
}
</style>

<style scoped>
.gambar-footer {
  background-image: url("../../assets/img/hero.png");
  background-size: 100% 100%;
}
</style>
