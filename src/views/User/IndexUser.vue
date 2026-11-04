<script setup>
import { ref, onMounted, computed } from "vue";
import api from "../../api";

// State
const users = ref([]);
const searchQuery = ref("");
const perPage = ref(10);
const currentPage = ref(1);
const loading = ref(true);

// Fetch data
const fetchDataUsers = async () => {
  loading.value = true;
  try {
    const response = await api.get("/api/users");
    users.value = response.data?.data?.data || response.data?.data || response.data || [];
  } catch (error) {
    console.error("Gagal memuat data user:", error);
    users.value = [];
  } finally {
    loading.value = false;
  }
};

// Filtered users based on search query
const filteredUsers = computed(() => {
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase().trim();
    return users.value.filter((user) =>
      (user.name && user.name.toLowerCase().includes(q)) ||
      (user.username && user.username.toLowerCase().includes(q)) ||
      (user.email && user.email.toLowerCase().includes(q)) ||
      (user.level && user.level.toLowerCase().includes(q)) ||
      (user.nohp && String(user.nohp).toLowerCase().includes(q))
    );
  }
  return users.value;
});

// Total pages
const totalPages = computed(() => {
  return Math.ceil(filteredUsers.value.length / perPage.value) || 1;
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

// Paginated users
const paginatedUsers = computed(() => {
  const start = (currentPage.value - 1) * perPage.value;
  const end = start + perPage.value;
  return filteredUsers.value.slice(start, end);
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

// Photo URL helper
const getPhotoUrl = (photoPath) => {
  if (!photoPath) return "";
  if (
    photoPath.startsWith("http://") ||
    photoPath.startsWith("https://") ||
    photoPath.startsWith("data:image")
  ) {
    return photoPath;
  }
  if (photoPath.startsWith("/")) {
    return `http://localhost:8000${photoPath}`;
  }
  return `http://localhost:8000/storage/${photoPath}`;
};

// Image modal preview state
const previewPhoto = ref(null);
const openPhotoPreview = (url) => {
  if (url) previewPhoto.value = url;
};
const closePhotoPreview = () => {
  previewPhoto.value = null;
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

const deleteUser = async () => {
  if (!itemId.value || isDeleting.value) return;
  isDeleting.value = true;
  try {
    await api.delete(`/api/users/${itemId.value}`);
    await fetchDataUsers();
    showConfirmDialog.value = false;
    itemId.value = null;
  } catch (error) {
    console.error("Terjadi kesalahan saat menghapus user:", error);
  } finally {
    isDeleting.value = false;
  }
};

onMounted(() => {
  fetchDataUsers();
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
            <h5 class="mb-0 fw-bold text-slate-900">Manajemen Pengguna</h5>
            <span class="badge-count-pill">
              {{ filteredUsers.length }} User
            </span>
          </div>
          <p class="text-slate-500 text-xs mb-0 mt-1">
            Daftar akun pengguna, hak akses, dan data kredensial sistem
          </p>
        </div>

        <!-- Search & Add Actions -->
        <div class="d-flex align-items-center flex-wrap gap-2">
          <div class="search-input-wrapper">
            <i class="fas fa-search search-icon text-slate-400"></i>
            <input
              type="text"
              class="form-control modern-search-input"
              placeholder="Cari nama, username, email..."
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
            :to="{ name: 'Create.User' }"
            class="btn-primary-gradient text-white text-decoration-none shadow-sm"
          >
            <i class="fas fa-user-plus me-2"></i>
            <span>Tambah User</span>
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
            <col style="width: 70px" />       <!-- Foto -->
            <col style="width: 220px" />      <!-- Identitas & Kontak -->
            <col style="width: 220px" />      <!-- Username & Email -->
            <col style="width: 130px" />      <!-- Hak Akses -->
            <col style="width: 90px" />       <!-- Aksi -->
          </colgroup>
          <thead>
            <tr>
              <th class="text-center text-uppercase text-xxs font-weight-bolder text-slate-500 ps-4">No</th>
              <th class="text-center text-uppercase text-xxs font-weight-bolder text-slate-500">Foto</th>
              <th class="text-uppercase text-xxs font-weight-bolder text-slate-500 ps-3">Identitas & Kontak</th>
              <th class="text-uppercase text-xxs font-weight-bolder text-slate-500 ps-3">Username & Email</th>
              <th class="text-center text-uppercase text-xxs font-weight-bolder text-slate-500">Hak Akses</th>
              <th class="text-center text-uppercase text-xxs font-weight-bolder text-slate-500 pe-4">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <!-- Loading State -->
            <tr v-if="loading">
              <td colspan="6" class="text-center py-5">
                <div class="spinner-border text-primary spinner-border-sm me-2" role="status"></div>
                <span class="text-slate-500 text-xs">Memuat data user...</span>
              </td>
            </tr>

            <!-- Empty State -->
            <tr v-else-if="filteredUsers.length === 0">
              <td colspan="6" class="text-center py-5">
                <div class="empty-state-box">
                  <div class="empty-icon text-slate-400 mb-2">
                    <i class="fas fa-users-cog fa-2x"></i>
                  </div>
                  <h6 class="fw-bold text-slate-700 mb-1">Data User Tidak Ditemukan</h6>
                  <p class="text-slate-400 text-xs mb-0">
                    {{ searchQuery ? 'Tidak ada hasil untuk kata kunci tersebut.' : 'Belum ada pengguna yang terdaftar di sistem.' }}
                  </p>
                </div>
              </td>
            </tr>

            <!-- Data Rows -->
            <tr v-else v-for="(user, index) in paginatedUsers" :key="user.id || index" class="table-row-hover">
              <td class="text-center text-slate-500 text-xs fw-semibold ps-4">
                {{ (currentPage - 1) * perPage + index + 1 }}
              </td>
              <td class="text-center py-2">
                <div
                  v-if="user.photo"
                  class="avatar-preview-box cursor-pointer"
                  @click="openPhotoPreview(getPhotoUrl(user.photo))"
                  title="Klik untuk perbesar"
                >
                  <img
                    :src="getPhotoUrl(user.photo)"
                    alt="Foto User"
                    class="avatar-img-square"
                  />
                  <div class="avatar-hover-overlay">
                    <i class="fas fa-search-plus"></i>
                  </div>
                </div>
                <div v-else class="user-avatar-initials">
                  {{ user.name ? user.name.charAt(0).toUpperCase() : 'U' }}
                </div>
              </td>
              <td class="ps-3">
                <div style="min-width: 0; max-width: 100%;">
                  <span class="d-block text-xs fw-bold text-slate-900 text-truncate" :title="user.name">{{ user.name }}</span>
                  <span class="text-xs text-slate-500 d-block mt-0-5 text-truncate" :title="(user.jenkel || '-') + ' • ' + (user.nohp || '-')">
                    <i class="fas fa-venus-mars me-1 text-slate-400"></i>{{ user.jenkel || '-' }} &bull; 
                    <i class="fas fa-phone-alt ms-1 me-1 text-slate-400"></i>{{ user.nohp || '-' }}
                  </span>
                </div>
              </td>
              <td class="ps-3">
                <div style="min-width: 0; max-width: 100%;">
                  <div class="d-flex align-items-center gap-1 mb-1">
                    <span class="badge-username text-truncate" :title="'@' + user.username">@{{ user.username }}</span>
                  </div>
                  <span class="text-xs text-slate-500 d-block text-truncate" :title="user.email">
                    <i class="fas fa-envelope me-1 text-slate-400"></i>{{ user.email }}
                  </span>
                </div>
              </td>
              <td class="text-center">
                <span
                  class="badge-level-pill"
                  :class="user.level === 'Admin' ? 'level-admin' : 'level-user'"
                >
                  <i :class="user.level === 'Admin' ? 'fas fa-shield-alt me-1' : 'fas fa-user me-1'"></i>
                  {{ user.level || 'User' }}
                </span>
              </td>
              <td class="text-center pe-4">
                <div class="d-flex justify-content-center align-items-center gap-1">
                  <router-link
                    :to="{ name: 'Edit.User', params: { id: user.id } }"
                    class="btn-action-icon btn-edit-action"
                    title="Ubah Data"
                  >
                    <i class="fas fa-pen text-xs"></i>
                  </router-link>
                  <button
                    type="button"
                    @click="confirmDelete(user.id)"
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
      <div v-if="filteredUsers.length > 0" class="d-flex justify-content-between align-items-center flex-wrap gap-3 px-4 py-3 border-top">
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
            Total <b>{{ filteredUsers.length }}</b> data (Hal. <b>{{ currentPage }}</b> dari <b>{{ totalPages }}</b>)
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

  <!-- Photo Preview Modal -->
  <div v-if="previewPhoto" class="modal-backdrop-custom" @click="closePhotoPreview">
    <div class="photo-modal-box" @click.stop>
      <div class="photo-modal-header d-flex justify-content-between align-items-center">
        <span class="text-xs fw-bold text-slate-700">Foto Profil Pengguna</span>
        <button type="button" class="btn-close-preview" @click="closePhotoPreview">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div class="photo-modal-body text-center p-3">
        <img :src="previewPhoto" alt="Preview Foto" class="preview-full-img" />
      </div>
    </div>
  </div>

  <!-- Confirm Delete Modal Backdrop & Dialog -->
  <div v-if="showConfirmDialog" class="modal-backdrop-custom">
    <div class="confirm-modal-box">
      <div class="confirm-modal-icon text-danger">
        <i class="fas fa-exclamation-triangle"></i>
      </div>
      <h6 class="fw-bold text-slate-900 mt-2 mb-1">Hapus Data User?</h6>
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
          @click="deleteUser"
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
  min-width: 780px;
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

.avatar-preview-box {
  position: relative;
  width: 44px;
  height: 44px;
  border-radius: 10px;
  overflow: hidden;
  display: inline-block;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
}

.avatar-img-square {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-hover-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(15, 23, 42, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  opacity: 0;
  transition: opacity 0.2s ease;
  font-size: 12px;
}

.avatar-preview-box:hover .avatar-hover-overlay {
  opacity: 1;
}

.user-avatar-initials {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
  color: #ffffff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 700;
}

.badge-username {
  background-color: #f1f5f9;
  color: #334155;
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  font-family: monospace;
}

.badge-level-pill {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
}

.level-admin {
  background-color: #fef3c7;
  color: #b45309;
}

.level-user {
  background-color: #eff6ff;
  color: #2563eb;
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

/* Modal Confirmation & Photo Preview */
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

.photo-modal-box {
  background: #ffffff;
  border-radius: 16px;
  max-width: 420px;
  width: 100%;
  overflow: hidden;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.25);
  animation: modalScale 0.2s ease-out;
}

.photo-modal-header {
  padding: 12px 16px;
  border-bottom: 1px solid #f1f5f9;
}

.btn-close-preview {
  background: none;
  border: none;
  color: #94a3b8;
  font-size: 14px;
  cursor: pointer;
}

.preview-full-img {
  max-width: 100%;
  max-height: 360px;
  border-radius: 10px;
  object-fit: contain;
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
.text-slate-700 { color: #334155 !important; }
.text-slate-500 { color: #64748b !important; }
.text-slate-400 { color: #94a3b8 !important; }
.cursor-pointer { cursor: pointer; }
.mt-0-5 { margin-top: 2px; }
</style>
