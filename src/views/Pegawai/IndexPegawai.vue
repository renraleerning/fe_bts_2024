<script setup>
import { ref, onMounted, computed } from "vue";
import api from "../../api";

// State
const pegawais = ref([]);
const searchQuery = ref("");
const perPage = ref(10);
const currentPage = ref(1);
const loading = ref(true);

// Fetch data
const fetchDataPegawais = async () => {
  loading.value = true;
  try {
    const response = await api.get("/api/pegawai");
    pegawais.value = response.data?.data?.data || response.data?.data || response.data || [];
  } catch (error) {
    console.error("Gagal memuat data pegawai:", error);
    pegawais.value = [];
  } finally {
    loading.value = false;
  }
};

// Filtered pegawais based on search query
const filteredPegawais = computed(() => {
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase().trim();
    return pegawais.value.filter((pegawai) =>
      (pegawai.nama && pegawai.nama.toLowerCase().includes(q)) ||
      (pegawai.nip && String(pegawai.nip).toLowerCase().includes(q)) ||
      (pegawai.jabatan && pegawai.jabatan.toLowerCase().includes(q)) ||
      (pegawai.bagian && pegawai.bagian.toLowerCase().includes(q)) ||
      (pegawai.no_hp && String(pegawai.no_hp).toLowerCase().includes(q))
    );
  }
  return pegawais.value;
});

// Total pages
const totalPages = computed(() => {
  return Math.ceil(filteredPegawais.value.length / perPage.value) || 1;
});

// Dynamic pagination range
const dynamicPages = computed(() => {
  const pages = [];
  const start = Math.max(2, currentPage.value - 1);
  const end = Math.min(totalPages.value - 1, currentPage.value + 1);
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }
  return pages;
});

// Paginated pegawais
const paginatedPegawais = computed(() => {
  const start = (currentPage.value - 1) * perPage.value;
  const end = start + perPage.value;
  return filteredPegawais.value.slice(start, end);
});

// Pagination handlers
const setPage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
  }
};

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value += 1;
  }
};

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value -= 1;
  }
};

// Delete Modal State
const showConfirmDialog = ref(false);
const itemId = ref(null);
const isDeleting = ref(false);

const confirmDelete = (id) => {
  itemId.value = id;
  showConfirmDialog.value = true;
};

const cancelDelete = () => {
  showConfirmDialog.value = false;
  itemId.value = null;
};

const deletePegawai = async () => {
  if (!itemId.value || isDeleting.value) return;
  isDeleting.value = true;
  try {
    await api.delete(`/api/pegawai/${itemId.value}`);
    await fetchDataPegawais();
    showConfirmDialog.value = false;
    itemId.value = null;
  } catch (error) {
    console.error("Terjadi kesalahan saat menghapus pegawai:", error);
  } finally {
    isDeleting.value = false;
  }
};

onMounted(() => {
  fetchDataPegawais();
});
</script>

<template>
  <div class="card modern-table-card border-0 shadow-sm">
    <!-- Header with Controls -->
    <div class="card-header modern-card-header bg-white pb-3 pt-4 px-4 border-0">
      <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
        <!-- Title & Counter -->
        <div>
          <div class="d-flex align-items-center gap-2">
            <h5 class="mb-0 fw-bold text-slate-900">Data Pegawai</h5>
            <span class="badge-count-pill">
              {{ filteredPegawais.length }} Pegawai
            </span>
          </div>
          <p class="text-slate-500 text-xs mb-0 mt-1">
            Daftar tenaga pendidik & kependidikan di lingkungan sekolah
          </p>
        </div>

        <!-- Search & Add Actions -->
        <div class="d-flex align-items-center flex-wrap gap-2">
          <div class="search-input-wrapper">
            <i class="fas fa-search search-icon text-slate-400"></i>
            <input
              type="text"
              class="form-control modern-search-input"
              placeholder="Cari nama, NIP, jabatan..."
              v-model="searchQuery"
            />
            <button
              v-if="searchQuery"
              @click="searchQuery = ''"
              type="button"
              class="btn-clear-search"
              aria-label="Bersihkan pencarian"
            >
              <i class="fas fa-times text-xs"></i>
            </button>
          </div>

          <router-link
            :to="{ name: 'Create.Pegawai' }"
            class="btn-primary-gradient text-white text-decoration-none shadow-sm"
          >
            <i class="fas fa-user-plus me-2"></i>
            <span>Tambah Pegawai</span>
          </router-link>
        </div>
      </div>
    </div>

    <!-- Table Body -->
    <div class="card-body px-0 pt-0 pb-2">
      <div class="table-responsive p-0">
        <table class="table modern-data-table align-items-center mb-0 table-fixed">
          <!-- Fixed Column Widths -->
          <colgroup>
            <col style="width: 50px" />       <!-- No -->
            <col style="width: 150px" />      <!-- NIP -->
            <col style="width: 210px" />      <!-- Nama Pegawai -->
            <col style="width: 160px" />      <!-- Jabatan -->
            <col style="width: 160px" />      <!-- Bagian -->
            <col style="width: 130px" />      <!-- No. HP -->
            <col style="width: 100px" />      <!-- Status -->
            <col style="width: 90px" />       <!-- Aksi -->
          </colgroup>
          <thead>
            <tr>
              <th class="text-center text-uppercase text-xxs font-weight-bolder text-slate-500 ps-4">No</th>
              <th class="text-uppercase text-xxs font-weight-bolder text-slate-500 ps-3">NIP</th>
              <th class="text-uppercase text-xxs font-weight-bolder text-slate-500 ps-3">Nama Pegawai</th>
              <th class="text-uppercase text-xxs font-weight-bolder text-slate-500 ps-3">Jabatan</th>
              <th class="text-uppercase text-xxs font-weight-bolder text-slate-500 ps-3">Bagian</th>
              <th class="text-uppercase text-xxs font-weight-bolder text-slate-500 ps-3">No. HP</th>
              <th class="text-center text-uppercase text-xxs font-weight-bolder text-slate-500">Status</th>
              <th class="text-center text-uppercase text-xxs font-weight-bolder text-slate-500 pe-4">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <!-- Loading State -->
            <tr v-if="loading">
              <td colspan="8" class="text-center py-5">
                <div class="spinner-border text-primary spinner-border-sm me-2" role="status"></div>
                <span class="text-slate-500 text-xs">Memuat data pegawai...</span>
              </td>
            </tr>

            <!-- Empty State -->
            <tr v-else-if="filteredPegawais.length === 0">
              <td colspan="8" class="text-center py-5">
                <div class="empty-state-box">
                  <div class="empty-icon text-slate-400 mb-2">
                    <i class="fas fa-id-card-alt fa-2x"></i>
                  </div>
                  <h6 class="fw-bold text-slate-700 mb-1">Data Pegawai Tidak Ditemukan</h6>
                  <p class="text-slate-400 text-xs mb-0">
                    {{ searchQuery ? 'Tidak ada hasil untuk kata kunci tersebut.' : 'Belum ada data pegawai yang terdaftar.' }}
                  </p>
                </div>
              </td>
            </tr>

            <!-- Data Rows -->
            <tr v-else v-for="(pegawai, index) in paginatedPegawais" :key="pegawai.id || index" class="table-row-hover">
              <td class="text-center text-slate-500 text-xs fw-semibold ps-4">
                {{ (currentPage - 1) * perPage + index + 1 }}
              </td>
              <td class="ps-3">
                <span class="text-xs fw-semibold text-slate-800 font-monospace text-truncate d-block" :title="pegawai.nip">
                  {{ pegawai.nip || '-' }}
                </span>
              </td>
              <td class="ps-3">
                <div class="d-flex align-items-center gap-2" style="min-width: 0; max-width: 100%;">
                  <div class="pegawai-avatar-circle flex-shrink-0">
                    {{ pegawai.nama ? pegawai.nama.charAt(0).toUpperCase() : 'P' }}
                  </div>
                  <div style="min-width: 0; overflow: hidden;">
                    <span class="d-block text-xs fw-bold text-slate-900 text-truncate" :title="pegawai.nama">{{ pegawai.nama }}</span>
                  </div>
                </div>
              </td>
              <td class="ps-3">
                <span class="text-xs text-slate-700 fw-medium text-truncate d-block" :title="pegawai.jabatan">
                  {{ pegawai.jabatan || '-' }}
                </span>
              </td>
              <td class="ps-3">
                <span class="badge-bagian text-truncate d-inline-block" style="max-width: 100%;" :title="pegawai.bagian">
                  {{ pegawai.bagian || '-' }}
                </span>
              </td>
              <td class="ps-3">
                <span class="text-xs text-slate-600 text-truncate d-block" :title="pegawai.no_hp">
                  {{ pegawai.no_hp || '-' }}
                </span>
              </td>
              <td class="text-center">
                <span
                  class="badge-status-pill"
                  :class="pegawai.status === 'Aktif' ? 'status-active' : 'status-inactive'"
                >
                  <i class="fas fa-circle status-dot me-1"></i>
                  {{ pegawai.status || 'Aktif' }}
                </span>
              </td>
              <td class="text-center pe-4">
                <div class="d-flex justify-content-center align-items-center gap-1">
                  <router-link
                    :to="{ name: 'Edit.Pegawai', params: { id: pegawai.id } }"
                    class="btn-action-icon btn-edit-action"
                    title="Ubah Data"
                  >
                    <i class="fas fa-pen text-xs"></i>
                  </router-link>
                  <button
                    type="button"
                    @click="confirmDelete(pegawai.id)"
                    class="btn-action-icon btn-delete-action"
                    title="Hapus Data"
                  >
                    <i class="fas fa-trash text-xs"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Modern Pagination Controls -->
      <div v-if="filteredPegawais.length > 0" class="d-flex justify-content-between align-items-center flex-wrap gap-3 px-4 py-3 border-top">
        <div class="d-flex align-items-center gap-2 flex-wrap">
          <span class="text-slate-500 text-xs">Tampilkan</span>
          <select
            v-model.number="perPage"
            @change="currentPage = 1"
            class="form-select form-select-sm per-page-select"
            aria-label="Pilih jumlah data per halaman"
          >
            <option :value="5">5</option>
            <option :value="10">10</option>
            <option :value="25">25</option>
            <option :value="50">50</option>
            <option :value="100">100</option>
          </select>
          <span class="text-slate-500 text-xs">data per halaman</span>
          <span class="text-slate-300 mx-1 d-none d-sm-inline">|</span>
          <span class="text-slate-500 text-xs">
            Total <b>{{ filteredPegawais.length }}</b> data (Hal. <b>{{ currentPage }}</b> dari <b>{{ totalPages }}</b>)
          </span>
        </div>

        <nav v-if="totalPages > 1" aria-label="Navigasi Halaman">
          <ul class="pagination modern-pagination mb-0">
            <!-- Prev Button -->
            <li class="page-item" :class="{ disabled: currentPage === 1 }">
              <button class="page-link" @click="prevPage" aria-label="Halaman Sebelumnya">
                <i class="fas fa-chevron-left text-xs"></i>
              </button>
            </li>

            <!-- Page 1 -->
            <li class="page-item" :class="{ active: currentPage === 1 }">
              <button class="page-link" @click="setPage(1)">1</button>
            </li>

            <!-- Ellipsis Before -->
            <li v-if="currentPage > 3" class="page-item disabled">
              <span class="page-link border-0">...</span>
            </li>

            <!-- Dynamic Middle Pages -->
            <li
              v-for="page in dynamicPages"
              :key="page"
              class="page-item"
              :class="{ active: currentPage === page }"
            >
              <button class="page-link" @click="setPage(page)">
                {{ page }}
              </button>
            </li>

            <!-- Ellipsis After -->
            <li v-if="currentPage < totalPages - 2" class="page-item disabled">
              <span class="page-link border-0">...</span>
            </li>

            <!-- Last Page -->
            <li v-if="totalPages > 1" class="page-item" :class="{ active: currentPage === totalPages }">
              <button class="page-link" @click="setPage(totalPages)">
                {{ totalPages }}
              </button>
            </li>

            <!-- Next Button -->
            <li class="page-item" :class="{ disabled: currentPage === totalPages }">
              <button class="page-link" @click="nextPage" aria-label="Halaman Selanjutnya">
                <i class="fas fa-chevron-right text-xs"></i>
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  </div>

  <!-- Confirm Delete Modal Backdrop & Dialog -->
  <div v-if="showConfirmDialog" class="modal-backdrop-custom">
    <div class="confirm-modal-box">
      <div class="confirm-modal-icon text-danger">
        <i class="fas fa-exclamation-triangle"></i>
      </div>
      <h6 class="fw-bold text-slate-900 mt-2 mb-1">Hapus Data Pegawai?</h6>
      <p class="text-slate-500 text-xs mb-4">
        Data yang telah dihapus tidak dapat dipulihkan kembali. Anda yakin ingin melanjutkan?
      </p>
      <div class="d-flex justify-content-center gap-2">
        <button
            type="button"
            @click="cancelDelete"
            :disabled="isDeleting"
            class="btn btn-outline-secondary btn-sm px-4 rounded-3"
          >
            Batal
          </button>
        <button
          type="button"
          @click="deletePegawai"
          :disabled="isDeleting"
          class="btn btn-danger px-3 py-2 rounded-3 text-xs fw-semibold border-0 shadow-sm"
        >
          <span v-if="isDeleting" class="spinner-border spinner-border-sm me-1"></span>
          {{ isDeleting ? 'Menghapus...' : 'Ya, Hapus' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modern-table-card {
  border-radius: 16px;
  background-color: #ffffff;
  overflow: hidden;
}

.modern-card-header {
  border-bottom: 1px solid #f1f5f9 !important;
}

.badge-count-pill {
  font-size: 11px;
  font-weight: 700;
  padding: 3px 10px;
  background-color: #eff6ff;
  color: #2563eb;
  border-radius: 20px;
}

.search-input-wrapper {
  position: relative;
  min-width: 240px;
}

@media (max-width: 576px) {
  .search-input-wrapper {
    width: 100%;
    min-width: 100%;
  }
}

.search-icon {
  position: absolute;
  top: 50%;
  left: 12px;
  transform: translateY(-50%);
  font-size: 12px;
}

.modern-search-input {
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 8px 32px 8px 34px;
  font-size: 13px;
  background-color: #f8fafc;
  min-height: 40px;
}

.modern-search-input:focus {
  background-color: #ffffff;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
  outline: none;
}

.btn-clear-search {
  position: absolute;
  top: 50%;
  right: 10px;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #94a3b8;
  padding: 4px;
  cursor: pointer;
}

.btn-primary-gradient {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  padding: 9px 18px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  min-height: 40px;
}

.btn-primary-gradient:hover {
  background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.35) !important;
}

@media (max-width: 576px) {
  .btn-primary-gradient {
    width: 100%;
  }
}

.modern-data-table {
  border-collapse: separate;
  border-spacing: 0;
  width: 100%;
}

.table-fixed {
  table-layout: fixed !important;
  width: 100% !important;
  min-width: 1050px;
}

.table-fixed th,
.table-fixed td {
  vertical-align: middle;
}

.modern-data-table thead th {
  background-color: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  padding: 12px 14px;
  letter-spacing: 0.5px;
}

.table-row-hover {
  transition: background-color 0.15s ease;
}

.table-row-hover:hover {
  background-color: #f8fafc;
}

.pegawai-avatar-circle {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  flex-shrink: 0;
}

.badge-bagian {
  background-color: #f1f5f9;
  color: #475569;
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
}

.badge-status-pill {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
}

.status-active {
  background-color: #ecfdf5;
  color: #059669;
}

.status-inactive {
  background-color: #fef2f2;
  color: #dc2626;
}

.status-dot {
  font-size: 7px;
}

.btn-action-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  text-decoration: none;
  transition: all 0.2s ease;
}

.btn-edit-action {
  background-color: #eff6ff;
  color: #2563eb;
}

.btn-edit-action:hover {
  background-color: #2563eb;
  color: #ffffff;
}

.btn-delete-action {
  background-color: #fef2f2;
  color: #dc2626;
}

.btn-delete-action:hover {
  background-color: #dc2626;
  color: #ffffff;
}

.modern-pagination .page-item {
  margin: 0 2px;
}

.modern-pagination .page-link {
  width: 36px;
  height: 36px;
  border-radius: 10px !important;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: 600;
  color: #475569;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  transition: all 0.15s ease;
}

.modern-pagination .page-link:hover {
  background: #e2e8f0;
  color: #0f172a;
}

.modern-pagination .page-item.active .page-link {
  background: linear-gradient(135deg, #2563eb, #1d4ed8) !important;
  color: #ffffff !important;
  border-color: #2563eb !important;
  box-shadow: 0 4px 10px rgba(37, 99, 235, 0.3);
}

.modern-pagination .page-item.disabled .page-link {
  opacity: 0.45;
  cursor: not-allowed;
}

.per-page-select {
  width: auto;
  min-width: 68px;
  display: inline-block;
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: #334155;
  background-color: #f8fafc;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.per-page-select:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.15);
  outline: none;
}

/* Modal Confirmation */
.modal-backdrop-custom {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(15, 23, 42, 0.55);
  backdrop-filter: blur(4px);
  z-index: 1050;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.confirm-modal-box {
  background: #ffffff;
  border-radius: 16px;
  padding: 24px;
  max-width: 380px;
  width: 100%;
  text-align: center;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1);
  animation: modalScale 0.2s ease-out;
}

@keyframes modalScale {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}

.confirm-modal-icon {
  font-size: 32px;
}

.btn-cancel {
  background-color: #ffffff;
  color: #334155 !important;
  border: 1px solid #cbd5e1;
  font-weight: 600;
  transition: all 0.2s ease;
  min-height: 36px;
}

.btn-cancel:hover {
  background-color: #f1f5f9;
  color: #0f172a !important;
  border-color: #94a3b8;
}

.text-slate-900 { color: #0f172a !important; }
.text-slate-800 { color: #1e293b !important; }
.text-slate-700 { color: #334155 !important; }
.text-slate-600 { color: #475569 !important; }
.text-slate-500 { color: #64748b !important; }
.text-slate-400 { color: #94a3b8 !important; }
</style>
