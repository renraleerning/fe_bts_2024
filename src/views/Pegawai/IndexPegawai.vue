<script setup>
//import ref and onMounted
import { ref, onMounted, computed } from "vue";

//import api
import api from "../../api";

//define state
const pegawais = ref([]);
const searchQuery = ref(""); // Search input
const perPage = ref(10); // Number of records per page
const currentPage = ref(1); // Current page
const loading = ref(true);

//method fetchDataPegawais
const fetchDataPegawais = async () => {
  //fetch data
  loading.value = true;
  await api
    .get("/api/pegawai")

    .then((response) => {
      //set response data to state "pegawai"
      pegawais.value = response.data.data.data;
      loading.value = false;
    });
};

// Filtered pegawais based on the search query
const filteredPegawais = computed(() => {
  if (searchQuery.value) {
    return pegawais.value.filter((pegawai) =>
      pegawai.nama.toLowerCase().includes(searchQuery.value.toLowerCase())
    );
  } else {
    return pegawais.value;
  }
});

// Get paginated guests for the current page based on filtered pegawais
const paginatedPegawais = computed(() => {
  const start = (currentPage.value - 1) * perPage.value;
  const end = start + perPage.value;
  return filteredPegawais.value.slice(start, end);
});

// Total pages calculated from filtered pegawais data
const totalPages = computed(() => {
  return Math.ceil(filteredPegawais.value.length / perPage.value);
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

const deletePegawai = async () => {
  try {
    await api.delete(`/api/pegawai/${itemId.value}`);
    fetchDataPegawais(); // Pastikan fungsi ini sudah didefinisikan
    console.log("Pegawai berhasil dihapus");
    showConfirmDialog.value = false;
  } catch (error) {
    console.error("Terjadi kesalahan saat menghapus pegawai:", error);
  }
};

//run hook "onMounted"
onMounted(() => {
  //call method "fetchDataPegawais"
  fetchDataPegawais();
});
</script>
<template>
  <div class="card">
    <div class="card-header pb-0">
      <h6>Pegawai Information</h6>
      <!-- Search Form -->
      <div class="card-header pb-0">
        <!-- Flexbox container for horizontal alignment -->
        <div class="d-flex justify-content-between align-items-center w-100">
          <!-- Add Pegawai Button -->
          <router-link
            :to="{ name: 'Create.Pegawai' }"
            class="btn btn-md btn-success rounded-sm shadow border-0"
          >
            <i class="fa fa-user-plus"></i> &nbsp;ADD PEGAWAI
          </router-link>

          <!-- Search Form -->
          <div class="input-group w-25">
            <span class="input-group-text text-body">
              <i class="fas fa-search" aria-hidden="true"></i>
            </span>
            <input
              type="text"
              class="form-control"
              placeholder="Cari nama pegawai..."
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
                Nip
              </th>
              <th
                class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7 ps-2"
              >
                Nama
              </th>
              <th
                class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7"
              >
                Jabatan
              </th>
              <th
                class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7"
              >
                Bagian
              </th>
              <th
                class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7"
              >
                No HP
              </th>

              <th
                class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7"
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
            <tr v-if="filteredPegawais.length == 0">
              <td v-if="loading" colspan="8" class="text-center">
                <div class="alert alert-light mb-0">Loading...</div>
              </td>
              <td v-else colspan="8" class="text-center">
                <div class="alert alert-danger mb-0">Data Belum Tersedia!</div>
              </td>
            </tr>
            <tr
              v-else
              v-for="(pegawai, index) in paginatedPegawais"
              :key="index"
            >
              <td class="ps-4 text-sm">
                {{ (currentPage - 1) * perPage + index + 1 }}
              </td>
              <td class="text-sm">{{ pegawai.nip }}</td>
              <td class="text-sm">{{ pegawai.nama }}</td>
              <td class="text-sm">{{ pegawai.jabatan }}</td>
              <td class="text-sm">{{ pegawai.bagian }}</td>
              <td class="text-sm">{{ pegawai.no_hp }}</td>
              <td class="text-sm">{{ pegawai.status }}</td>
              <td class="text-center">
                <router-link
                  :to="{ name: 'Edit.Pegawai', params: { id: pegawai.id } }"
                  class="btn btn-primary rounded-sm shadow border-0 me-2"
                  ><i class="fa fa-edit"></i
                ></router-link>

                <button
                  @click="confirmDelete(pegawai.id)"
                  class="btn btn-danger rounded-sm shadow border-0 me-2"
                >
                  <i class="fa fa-trash"></i>
                </button>

                <div>
                  <div v-if="showConfirmDialog" class="confirm-dialog card">
                    <p>Apakah Anda yakin ingin menghapus data pegawai ini?</p>
                    <div class="button-container">
                      <button
                        @click.prevent="deletePegawai(pegawai.id)"
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
