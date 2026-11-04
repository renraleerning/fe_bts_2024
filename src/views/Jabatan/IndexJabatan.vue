<script setup>
import { ref, onMounted, computed } from "vue";
import { useRoute } from "vue-router";
import api from "../../api";

const route = useRoute();

// State
const jabatans = ref([]);
const searchQuery = ref("");
const perPage = ref(10);
const currentPage = ref(1);
const loading = ref(true);

// Fetch data
const fetchDataJabatans = async () => {
  loading.value = true;
  try {
    const response = await api.get("/api/jabatan");
    jabatans.value = response.data?.data?.data || response.data?.data || response.data || [];
  } catch (error) {
    console.error("Gagal memuat data jabatan:", error);
    jabatans.value = [];
  } finally {
    loading.value = false;
  }
};

// Filtered jabatans
const filteredJabatans = computed(() => {
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase().trim();
    return jabatans.value.filter((jabatan) =>
      jabatan.nama_jabatan && jabatan.nama_jabatan.toLowerCase().includes(q)
    );
  }
  return jabatans.value;
});

// Total pages
const totalPages = computed(() => {
  return Math.ceil(filteredJabatans.value.length / perPage.value) || 1;
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

// Paginated jabatans
const paginatedJabatans = computed(() => {
  const start = (currentPage.value - 1) * perPage.value;
  const end = start + perPage.value;
  return filteredJabatans.value.slice(start, end);
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

// ==================== Modal Form State (Create & Edit) ====================
const showFormModal = ref(false);
const modalMode = ref("create"); // 'create' | 'edit'
const formId = ref(null);
const formNamaJabatan = ref("");
const formStatus = ref("Aktif");
const formErrors = ref({});
const isSubmitting = ref(false);

const openCreateModal = () => {
  modalMode.value = "create";
  formId.value = null;
  formNamaJabatan.value = "";
  formStatus.value = "Aktif";
  formErrors.value = {};
  showFormModal.value = true;
};

const openEditModal = (jabatan) => {
  modalMode.value = "edit";
  formId.value = jabatan.id;
  formNamaJabatan.value = jabatan.nama_jabatan || "";
  formStatus.value = jabatan.status || "Aktif";
  formErrors.value = {};
  showFormModal.value = true;
};

const closeFormModal = () => {
  showFormModal.value = false;
  formId.value = null;
  formNamaJabatan.value = "";
  formStatus.value = "Aktif";
  formErrors.value = {};
};

const getFormError = (field) => {
  if (!formErrors.value) return null;
  const errObj = formErrors.value.errors || formErrors.value;
  if (errObj && errObj[field]) {
    return Array.isArray(errObj[field]) ? errObj[field][0] : errObj[field];
  }
  return null;
};

const saveJabatan = async () => {
  if (isSubmitting.value) return;
  isSubmitting.value = true;
  formErrors.value = {};

  try {
    const formData = new FormData();
    formData.append("nama_jabatan", formNamaJabatan.value);
    formData.append("status", formStatus.value);

    if (modalMode.value === "create") {
      await api.post("/api/jabatan", formData);
    } else {
      formData.append("_method", "PATCH");
      await api.post(`/api/jabatan/${formId.value}`, formData);
    }

    await fetchDataJabatans();
    closeFormModal();
  } catch (error) {
    if (error.response && error.response.data) {
      formErrors.value = error.response.data;
    } else {
      console.error("Gagal menyimpan data jabatan:", error);
    }
  } finally {
    isSubmitting.value = false;
  }
};

// ==================== Delete Confirmation State ====================
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

const deleteJabatan = async () => {
  if (!itemId.value || isDeleting.value) return;
  isDeleting.value = true;
  try {
    await api.delete(`/api/jabatan/${itemId.value}`);
    await fetchDataJabatans();
    showConfirmDialog.value = false;
    itemId.value = null;
  } catch (error) {
    console.error("Terjadi kesalahan saat menghapus data jabatan:", error);
  } finally {
    isDeleting.value = false;
  }
};

onMounted(async () => {
  await fetchDataJabatans();
  if (route.query.action === "create") {
    openCreateModal();
  } else if (route.query.editId) {
    const item = jabatans.value.find((j) => String(j.id) === String(route.query.editId));
    if (item) {
      openEditModal(item);
    }
  }
});
</script>

<template>
  <div class="card modern-table-card border-0 shadow-sm">
    <!-- Card Header with Controls -->
    <div class="card-header modern-card-header bg-white pb-3 pt-4 px-4 border-0">
      <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
        <!-- Title & Counter -->
        <div>
          <div class="d-flex align-items-center gap-2">
            <h5 class="mb-0 fw-bold text-slate-900">Data Jabatan</h5>
            <span class="badge-count-pill">
              {{ filteredJabatans.length }} Jabatan
            </span>
          </div>
          <p class="text-slate-500 text-xs mb-0 mt-1">
            Daftar struktur &amp; formasi jabatan di lingkungan sekolah
          </p>
        </div>

        <!-- Search & Add Actions -->
        <div class="d-flex align-items-center flex-wrap gap-2">
          <div class="search-input-wrapper">
            <i class="fas fa-search search-icon text-slate-400"></i>
            <input
              type="text"
              class="form-control modern-search-input"
              placeholder="Cari nama jabatan..."
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

          <button
            type="button"
            @click="openCreateModal"
            class="btn-primary-gradient text-white border-0 shadow-sm d-flex align-items-center fw-semibold"
          >
            <i class="fas fa-plus me-2"></i>
            <span>Tambah Jabatan</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Table Body -->
    <div class="card-body px-0 pt-0 pb-2">
      <div class="table-responsive p-0">
        <table class="table modern-data-table align-items-center mb-0 table-fixed">
          <!-- Fixed Column Widths -->
          <colgroup>
            <col style="width: 54px" />       <!-- No -->
            <col style="width: auto" />       <!-- Nama Jabatan -->
            <col style="width: 140px" />      <!-- Status -->
            <col style="width: 110px" />      <!-- Aksi -->
          </colgroup>
          <thead>
            <tr>
              <th class="text-center text-uppercase text-xxs font-weight-bolder text-slate-500 ps-4">No</th>
              <th class="text-uppercase text-xxs font-weight-bolder text-slate-500 ps-3">Nama Jabatan</th>
              <th class="text-center text-uppercase text-xxs font-weight-bolder text-slate-500">Status</th>
              <th class="text-center text-uppercase text-xxs font-weight-bolder text-slate-500 pe-4">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="4" class="text-center py-5">
                <div class="spinner-border text-primary spinner-border-sm me-2" role="status"></div>
                <span class="text-slate-500 text-xs">Memuat data jabatan...</span>
              </td>
            </tr>
            <tr v-else-if="filteredJabatans.length === 0">
              <td colspan="4" class="text-center py-5">
                <div class="empty-state-box">
                  <div class="empty-icon text-slate-400 mb-2">
                    <i class="fas fa-briefcase fa-2x"></i>
                  </div>
                  <h6 class="fw-bold text-slate-700 mb-1">Data Jabatan Tidak Ditemukan</h6>
                  <p class="text-slate-400 text-xs mb-0">
                    {{ searchQuery ? 'Tidak ada hasil untuk pencarian tersebut.' : 'Belum ada data jabatan yang dibuat.' }}
                  </p>
                </div>
              </td>
            </tr>
            <tr
              v-else
              v-for="(jabatan, index) in paginatedJabatans"
              :key="jabatan.id || index"
              class="table-row-hover"
            >
              <td class="text-center text-slate-500 text-xs fw-semibold ps-4">
                {{ (currentPage - 1) * perPage + index + 1 }}
              </td>
              <td class="ps-3">
                <div class="d-flex align-items-center gap-2" style="min-width: 0; max-width: 100%;">
                  <div class="jabatan-icon-circle flex-shrink-0">
                    <i class="fas fa-briefcase text-primary" style="font-size:11px;"></i>
                  </div>
                  <span class="text-xs fw-bold text-slate-900 text-truncate" :title="jabatan.nama_jabatan">{{ jabatan.nama_jabatan }}</span>
                </div>
              </td>
              <td class="text-center">
                <span
                  class="badge-status-pill"
                  :class="jabatan.status === 'Aktif' ? 'status-active' : 'status-inactive'"
                >
                  <i class="fas fa-circle status-dot me-1"></i>
                  {{ jabatan.status || 'Aktif' }}
                </span>
              </td>
              <td class="text-center pe-4">
                <div class="d-flex justify-content-center align-items-center gap-1">
                  <button
                    type="button"
                    @click="openEditModal(jabatan)"
                    class="btn-action-icon btn-edit-action"
                    title="Ubah Data"
                  >
                    <i class="fas fa-pen text-xs"></i>
                  </button>
                  <button
                    type="button"
                    @click="confirmDelete(jabatan.id)"
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
      <div v-if="filteredJabatans.length > 0" class="d-flex justify-content-between align-items-center flex-wrap gap-3 px-4 py-3 border-top">
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
            Total <b>{{ filteredJabatans.length }}</b> data (Hal. <b>{{ currentPage }}</b> dari <b>{{ totalPages }}</b>)
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

  <!-- Form Modal (Tambah & Ubah Jabatan) -->
  <div v-if="showFormModal" class="modal-backdrop-custom" @click.self="closeFormModal">
    <div class="form-modal-box">
      <!-- Modal Header -->
      <div class="d-flex align-items-center justify-content-between pb-3 mb-3 border-bottom">
        <div class="d-flex align-items-center gap-2">
          <div class="header-icon-circle bg-blue-light text-primary">
            <i :class="modalMode === 'create' ? 'fas fa-plus' : 'fas fa-pen'"></i>
          </div>
          <div>
            <h6 class="mb-0 fw-bold text-slate-900">
              {{ modalMode === 'create' ? 'Tambah Jabatan Baru' : 'Ubah Data Jabatan' }}
            </h6>
            <small class="text-slate-400 text-xs">
              {{ modalMode === 'create' ? 'Masukkan informasi formasi jabatan baru' : 'Perbarui nama & status jabatan' }}
            </small>
          </div>
        </div>
        <button
          type="button"
          class="btn-close-modal"
          @click="closeFormModal"
          aria-label="Tutup"
        >
          <i class="fas fa-times"></i>
        </button>
      </div>

      <!-- Modal Body Form -->
      <form @submit.prevent="saveJabatan">
        <div class="mb-3 text-start">
          <label class="form-label text-xs fw-bold text-slate-700">
            Nama Jabatan <span class="text-danger">*</span>
          </label>
          <div class="input-with-icon">
            <i class="fas fa-briefcase input-icon text-slate-400"></i>
            <input
              type="text"
              class="form-control modern-input"
              v-model="formNamaJabatan"
              placeholder="Contoh: Kepala Sekolah / Guru / Staf"
              autofocus
            />
          </div>
          <div v-if="getFormError('nama_jabatan')" class="form-error-msg mt-1">
            <i class="fas fa-exclamation-circle me-1"></i>{{ getFormError('nama_jabatan') }}
          </div>
        </div>

        <div class="mb-4 text-start">
          <label class="form-label text-xs fw-bold text-slate-700">
            Status <span class="text-danger">*</span>
          </label>
          <div class="input-with-icon">
            <i class="fas fa-toggle-on input-icon text-slate-400"></i>
            <select class="form-select modern-input" v-model="formStatus">
              <option value="Aktif">Aktif</option>
              <option value="Non Aktif">Non Aktif</option>
            </select>
          </div>
          <div v-if="getFormError('status')" class="form-error-msg mt-1">
            <i class="fas fa-exclamation-circle me-1"></i>{{ getFormError('status') }}
          </div>
        </div>

        <!-- Modal Footer Actions -->
        <div class="d-flex justify-content-end align-items-center gap-2 pt-3 border-top">
          <button
            type="button"
            @click="closeFormModal"
            :disabled="isSubmitting"
            class="btn-cancel-modal fw-semibold"
          >
            Batal
          </button>
          <button
            type="submit"
            :disabled="isSubmitting"
            class="btn-primary-gradient text-white border-0 shadow-sm d-flex align-items-center fw-semibold"
          >
            <span v-if="isSubmitting" class="spinner-border spinner-border-sm me-1" role="status"></span>
            <i v-if="!isSubmitting" class="fas fa-check me-1"></i>
            {{ isSubmitting ? 'Menyimpan...' : (modalMode === 'create' ? 'Simpan Jabatan' : 'Perbarui Jabatan') }}
          </button>
        </div>
      </form>
    </div>
  </div>

  <!-- Confirm Delete Modal -->
  <div v-if="showConfirmDialog" class="modal-backdrop-custom">
    <div class="confirm-modal-box">
      <div class="confirm-modal-icon text-danger">
        <i class="fas fa-exclamation-triangle"></i>
      </div>
      <h6 class="fw-bold text-slate-900 mt-2 mb-1">Hapus Data Jabatan?</h6>
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
          @click="deleteJabatan"
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
/* === Table Card === */
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

.jabatan-icon-circle {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background-color: #eff6ff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
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

.btn-cancel-modal {
  background: transparent;
  border: 1px solid #cbd5e1;
  color: #475569;
  padding: 9px 18px;
  border-radius: 10px;
  font-size: 13px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 40px;
  transition: all 0.2s ease;
}

.btn-cancel-modal:hover {
  background-color: #f1f5f9;
  border-color: #94a3b8;
  color: #0f172a;
}

.btn-cancel-modal:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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
  min-width: 520px;
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

/* === Modal Styling === */
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

.form-modal-box {
  background: #ffffff;
  border-radius: 16px;
  padding: 24px;
  max-width: 480px;
  width: 100%;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1);
  animation: modalScale 0.2s ease-out;
}

.header-icon-circle {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  flex-shrink: 0;
}

.bg-blue-light { background-color: #eff6ff; }

.btn-close-modal {
  background: none;
  border: none;
  color: #94a3b8;
  font-size: 16px;
  cursor: pointer;
  padding: 4px;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.btn-close-modal:hover {
  color: #0f172a;
  background-color: #f1f5f9;
}

.input-with-icon {
  position: relative;
}

.input-icon {
  position: absolute;
  top: 50%;
  left: 12px;
  transform: translateY(-50%);
  font-size: 13px;
}

.modern-input {
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 9px 12px 9px 36px;
  font-size: 13px;
  background-color: #f8fafc;
  width: 100%;
  transition: all 0.2s ease;
}

.modern-input:focus {
  background-color: #ffffff;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
  outline: none;
}

.form-error-msg {
  color: #dc2626;
  font-size: 11px;
  font-weight: 500;
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

.empty-state-box {
  padding: 20px 0;
}

.text-slate-900 { color: #0f172a !important; }
.text-slate-700 { color: #334155 !important; }
.text-slate-500 { color: #64748b !important; }
.text-slate-400 { color: #94a3b8 !important; }
</style>
