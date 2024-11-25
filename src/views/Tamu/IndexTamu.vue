<script setup>
/* eslint-disable */
import { ref, computed, onMounted } from "vue";
import api from "../../api";

// State variables
const tamus = ref([]); // Original data
const searchQuery = ref(""); // Search input
const perPage = ref(5); // Number of records per page
const currentPage = ref(1); // Current page
const loading = ref(true);

// Fetch guest data (tamu)
const fetchDataTamus = async () => {
  loading.value = true;
  const response = await api.get("/api/tamu");
  console.log(`asd`, response.data.data)
  // tamus.value = response.data.data.data;
  tamus.value = response.data.data || []
  loading.value = false;
  console.log(`tamus`, tamus.value)
};

// Filtered tamus based on the search query
const filteredTamus = computed(() => {
  if (searchQuery.value) {
    return tamus.value.filter((tamu) =>
      tamu.nama.toLowerCase().includes(searchQuery.value.toLowerCase())
    );
  } else {
    return tamus.value;
  }
});

// Get paginated guests for the current page based on filtered tamus
const paginatedTamus = computed(() => {
  const start = (currentPage.value - 1) * perPage.value;
  const end = start + perPage.value;
  return filteredTamus.value.slice(start, end);
});

// Total pages calculated from filtered tamus data
const totalPages = computed(() => {
  // return Math.ceil((filteredTamus.value || []).length / perPage.value);
  return Math.ceil(filteredTamus.value.length / perPage.value);
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

const deleteTamu = async () => {
  try {
    //await api.delete(`/api/tamu/${id}`);
    await api.delete(`/api/tamu/${itemId.value}`);
    fetchDataTamus(); // Pastikan fungsi ini sudah didefinisikan
    console.log("Tamu berhasil dihapus");
    showConfirmDialog.value = false;
  } catch (error) {
    console.error("Terjadi kesalahan saat menghapus tamu:", error);
  }
};

// Fetch data when component is mounted
onMounted(() => {
  fetchDataTamus();
});
</script>
<template>
  <div class="card">
    <div class="card-header pb-0">
      <h6>Daftar Tamu</h6>
      <!-- Search Form -->
      <div class="card-header pb-0">
        <!-- Flexbox container for horizontal alignment -->
        <div class="d-flex justify-content-between align-items-center w-100">
          <!-- Add Tamu Button -->
          <router-link
            :to="{ name: 'Create.Tamu' }"
            class="btn btn-md btn-success rounded-sm shadow border-0"
          >
            <i class="fa fa-user-plus"></i> &nbsp;ADD TAMU
          </router-link>

          <!-- Search Form -->
          <div class="input-group w-25">
            <span class="input-group-text text-body">
              <i class="fas fa-search" aria-hidden="true"></i>
            </span>
            <input
              type="text"
              class="form-control"
              placeholder="Cari tamu berdasarkan nama..."
              v-model="searchQuery"
            />
          </div>
        </div>
      </div>
    </div>

    <div class="card-body px-0 pt-0 pb-2">
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
                Photo
              </th>
              <th
                class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7 ps-2"
              >
                Identitas
              </th>
              <th
                class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7"
              >
                Keperluan
              </th>
              <th
                class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7"
              >
                Tujuan Ke
              </th>
              <th
                class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7"
              >
                Lampiran
              </th>
              <th
                class="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7"
              >
                Aksi
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="filteredTamus.length == 0">
              <td v-if="loading" colspan="7" class="text-center">
                <div class="alert alert-light mb-0">Loading...</div>
              </td>
              <td v-else colspan="7" class="text-center">
                <div class="alert alert-danger mb-0">Data Belum Tersedia!</div>
              </td>
            </tr>
            <tr v-else v-for="(tamu, index) in paginatedTamus" :key="index">
              <td class="ps-4 text-sm">
                {{ (currentPage - 1) * perPage + index + 1 }}
              </td>
              <td>
                <img
                  :src="tamu.photo" 
                  width="100"
                  height="100"
                  class="rounded-2"
                />
              </td>
              <td class="text-sm">
                <b>{{ tamu.nama }}</b> ({{ tamu.jenkel }})<br />{{ tamu.alamat
                }}<br />No HP: <b>{{ tamu.no_hp }}</b>
              </td>
              <td class="text-sm">{{ tamu.keperluan }}</td>
              <td class="text-sm">
                {{ tamu.tujuan }}<br />{{ tamu.nama_tujuan }}
              </td>
              <td v-if="tamu.lampiran" class="text-sm">
                <a :href="tamu.lampiran.file">File Lampiran</a>
              </td>
              <td v-else>-</td>
              <td class="text-center">
                <router-link
                  :to="{ name: 'Edit.Tamu', params: { id: tamu.id } }"
                  class="btn btn-primary rounded-sm shadow border-0 me-2"
                >
                  <i class="fa fa-edit"></i>
                </router-link>
               
                <button
                  @click="confirmDelete(tamu.id)"
                  class="btn btn-danger rounded-sm shadow border-0 me-2"
                >
                  <i class="fa fa-trash"></i>
                </button>

                <div>
                  <div v-if="showConfirmDialog" class="confirm-dialog card">
                    <p>Apakah Anda yakin ingin menghapus data tamu ini?</p>
                    <div class="button-container">
                      <button
                        @click.prevent="deleteTamu(tamu.id)"
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
            <button class="page-link no-rounded" @click="setPage(1)">1</button>
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
          <li v-if="currentPage < totalPages - 2" class="page-item disabled">
            <span class="page-link">...</span>
          </li>

          <!-- Last Page -->
          <li class="page-item" :class="{ active: currentPage === totalPages }">
            <button class="page-link no-rounded" @click="setPage(totalPages)">
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
