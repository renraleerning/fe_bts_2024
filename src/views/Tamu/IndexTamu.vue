<script setup>
/* eslint-disable */
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import api from "../../api";

const route = useRoute();
const router = useRouter();
const showDeniedAlert = ref(false);

// State variables
const tamus = ref([]);
const searchQuery = ref("");
const perPage = ref(10);
const currentPage = ref(1);
const loading = ref(true);

// Fetch guest data (tamu)
const fetchDataTamus = async () => {
  loading.value = true;
  try {
    const response = await api.get("/api/tamu");
    tamus.value = response.data?.data?.data || response.data?.data || response.data || [];
  } catch (error) {
    console.error("Gagal memuat data tamu:", error);
    tamus.value = [];
  } finally {
    loading.value = false;
  }
};

// Filtered tamus based on the search query
const filteredTamus = computed(() => {
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase().trim();
    return tamus.value.filter((tamu) =>
      (tamu.nama && tamu.nama.toLowerCase().includes(q)) ||
      (tamu.keperluan && tamu.keperluan.toLowerCase().includes(q)) ||
      (tamu.tujuan && tamu.tujuan.toLowerCase().includes(q)) ||
      (tamu.nama_tujuan && tamu.nama_tujuan.toLowerCase().includes(q))
    );
  }
  return tamus.value;
});

// Total pages
const totalPages = computed(() => {
  return Math.ceil(filteredTamus.value.length / perPage.value) || 1;
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

// Get paginated guests for current page
const paginatedTamus = computed(() => {
  const start = (currentPage.value - 1) * perPage.value;
  const end = start + perPage.value;
  return filteredTamus.value.slice(start, end);
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

const deleteTamu = async () => {
  if (!itemId.value || isDeleting.value) return;
  isDeleting.value = true;
  try {
    await api.delete(`/api/tamu/${itemId.value}`);
    await fetchDataTamus();
    showConfirmDialog.value = false;
    itemId.value = null;
  } catch (error) {
    console.error("Terjadi kesalahan saat menghapus tamu:", error);
  } finally {
    isDeleting.value = false;
  }
};

// Image modal preview state
const previewPhoto = ref(null);
const openPhotoPreview = (url) => {
  previewPhoto.value = url;
};
const closePhotoPreview = () => {
  previewPhoto.value = null;
};

// Safe Photo URL Resolver
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

// Safe Lampiran URL Resolver
const getLampiranUrl = (tamu) => {
  if (!tamu) return null;
  const fileUrl =
    tamu.lampiran?.file ||
    (typeof tamu.lampiran === "string" ? tamu.lampiran : null) ||
    tamu.file;
  if (!fileUrl) return null;
  if (fileUrl.startsWith("http://") || fileUrl.startsWith("https://")) {
    return fileUrl;
  }
  if (fileUrl.startsWith("/")) {
    return `http://localhost:8000${fileUrl}`;
  }
  return `http://localhost:8000/storage/${fileUrl}`;
};

// Helper for file type info & badge label
const getFileInfo = (tamu) => {
  const url = getLampiranUrl(tamu);
  if (!url) return { label: "Dokumen", icon: "fas fa-paperclip", color: "text-secondary" };
  const lower = url.toLowerCase();
  if (lower.endsWith(".pdf")) {
    return { label: "PDF", icon: "fas fa-file-pdf", color: "text-danger" };
  }
  if (lower.endsWith(".xlsx") || lower.endsWith(".xls")) {
    return { label: "Excel", icon: "fas fa-file-excel", color: "text-success" };
  }
  if (lower.endsWith(".docx") || lower.endsWith(".doc")) {
    return { label: "Word", icon: "fas fa-file-word", color: "text-primary" };
  }
  if (
    lower.endsWith(".jpg") ||
    lower.endsWith(".jpeg") ||
    lower.endsWith(".png")
  ) {
    return { label: "Foto", icon: "fas fa-file-image", color: "text-info" };
  }
  return { label: "Dokumen", icon: "fas fa-paperclip", color: "text-secondary" };
};

onMounted(() => {
  if (route.query.accessDenied === "1") {
    showDeniedAlert.value = true;
    router.replace({ path: "/tamu" });
    setTimeout(() => {
      showDeniedAlert.value = false;
    }, 6000);
  }
  fetchDataTamus();
});
</script>

<template>
  <div class="card modern-table-card border-0 shadow-sm">
    <!-- Access Denied Banner for Petugas -->
    <transition name="fade">
      <div
        v-if="showDeniedAlert"
        class="alert alert-warning alert-dismissible fade show mx-4 mt-3 mb-0 d-flex align-items-center gap-3 border-0 shadow-sm rounded-3 text-xs"
        role="alert"
      >
        <div class="d-flex align-items-center justify-content-center bg-white rounded-circle p-2 shadow-xs">
          <i class="fas fa-shield-alt text-warning fs-6"></i>
        </div>
        <div>
          <strong class="d-block fw-bold text-slate-800">Akses Dibatasi</strong>
          <span class="text-slate-600">Akun dengan hak akses <b>Petugas</b> hanya dapat mengelola data <b>Buku Tamu</b> dan <b>Laporan</b>. Halaman master hanya untuk Administrator.</span>
        </div>
        <button
          type="button"
          class="btn-close ms-auto p-2"
          @click="showDeniedAlert = false"
          aria-label="Tutup"
        ></button>
      </div>
    </transition>

    <!-- Card Header with Controls -->
    <div class="card-header modern-card-header bg-white pb-3 pt-4 px-4 border-0">
      <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
        <!-- Title & Badges -->
        <div>
          <div class="d-flex align-items-center gap-2">
            <h5 class="mb-0 fw-bold text-slate-900">Daftar Buku Tamu</h5>
            <span class="badge-count-pill">
              {{ filteredTamus.length }} Data
            </span>
          </div>
          <p class="text-slate-500 text-xs mb-0 mt-1">
            Catatan presensi tamu & kunjungan resmi di SMKN 2 Sumedang
          </p>
        </div>

        <!-- Action & Search Controls -->
        <div class="d-flex align-items-center flex-wrap gap-2">
          <!-- Search Input -->
          <div class="search-input-wrapper">
            <i class="fas fa-search search-icon text-slate-400"></i>
            <input
              type="text"
              class="form-control modern-search-input"
              placeholder="Cari nama, tujuan, keperluan..."
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

          <!-- Add Tamu Button (Modern Royal Blue Gradient) -->
          <router-link
            :to="{ name: 'Create.Tamu' }"
            class="btn-primary-gradient text-white text-decoration-none shadow-sm"
          >
            <i class="fas fa-user-plus me-2"></i>
            <span>Tambah Tamu</span>
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
            <col style="width: 72px" />       <!-- Foto -->
            <col style="width: 220px" />      <!-- Identitas -->
            <col style="width: 240px" />      <!-- Keperluan -->
            <col style="width: 200px" />      <!-- Tujuan -->
            <col style="width: 100px" />      <!-- Lampiran -->
            <col style="width: 88px" />       <!-- Aksi -->
          </colgroup>
          <thead>
            <tr>
              <th class="text-center text-uppercase text-xxs font-weight-bolder text-slate-500 ps-4">No</th>
              <th class="text-uppercase text-xxs font-weight-bolder text-slate-500 ps-3">Foto</th>
              <th class="text-uppercase text-xxs font-weight-bolder text-slate-500 ps-3">Identitas Tamu</th>
              <th class="text-uppercase text-xxs font-weight-bolder text-slate-500 ps-3">Keperluan Bertamu</th>
              <th class="text-uppercase text-xxs font-weight-bolder text-slate-500 ps-3">Tujuan Kunjungan</th>
              <th class="text-center text-uppercase text-xxs font-weight-bolder text-slate-500">Lampiran</th>
              <th class="text-center text-uppercase text-xxs font-weight-bolder text-slate-500 pe-4">Aksi</th>
            </tr>
          </thead>

          <tbody>
            <!-- Loading State -->
            <tr v-if="loading">
              <td colspan="7" class="text-center py-5">
                <div class="d-flex flex-column align-items-center justify-content-center">
                  <div class="spinner-border text-primary mb-2" role="status"></div>
                  <span class="text-slate-500 text-sm">Memuat data buku tamu...</span>
                </div>
              </td>
            </tr>

            <!-- Empty State -->
            <tr v-else-if="filteredTamus.length === 0">
              <td colspan="7" class="text-center py-5">
                <div class="empty-state-box text-center py-4">
                  <div class="empty-icon-circle mx-auto mb-3">
                    <i class="fas fa-users-slash fa-2x text-slate-400"></i>
                  </div>
                  <h6 class="fw-bold text-slate-800 mb-1">Data Tamu Belum Ada</h6>
                  <p class="text-slate-500 text-xs mb-3">
                    {{ searchQuery ? 'Tidak ada data tamu yang cocok dengan pencarian Anda.' : 'Belum ada tamu yang tercatat hari ini.' }}
                  </p>
                  <router-link :to="{ name: 'Create.Tamu' }" class="btn-primary-gradient btn-sm text-white text-decoration-none shadow-sm">
                    <i class="fas fa-plus me-1"></i> Tambah Tamu Sekarang
                  </router-link>
                </div>
              </td>
            </tr>

            <!-- Data Rows -->
            <tr v-else v-for="(tamu, index) in paginatedTamus" :key="tamu.id || index" class="table-row-hover">
              <!-- Number -->
              <td class="text-center ps-4">
                <span class="row-number-badge">
                  {{ (currentPage - 1) * perPage + index + 1 }}
                </span>
              </td>

              <!-- Photo -->
              <td class="ps-3">
                <div class="photo-thumbnail-wrap" @click="tamu.photo && openPhotoPreview(getPhotoUrl(tamu.photo))">
                  <img
                    v-if="tamu.photo"
                    :src="getPhotoUrl(tamu.photo)"
                    alt="Foto Tamu"
                    class="photo-thumbnail"
                  />
                  <div v-else class="photo-fallback">
                    <i class="fas fa-user text-slate-400"></i>
                  </div>
                  <div v-if="tamu.photo" class="photo-zoom-hint" title="Klik untuk perbesar">
                    <i class="fas fa-search-plus"></i>
                  </div>
                </div>
              </td>

              <!-- Identity -->
              <td class="ps-3">
                <div class="d-flex flex-column" style="min-width: 0; max-width: 100%;">
                  <div class="d-flex align-items-center gap-2 mb-1" style="min-width: 0;">
                    <span class="fw-bold text-slate-900 text-sm text-truncate" :title="tamu.nama">{{ tamu.nama }}</span>
                    <span
                      class="gender-pill flex-shrink-0"
                      :class="tamu.jenkel === 'Perempuan' ? 'gender-female' : 'gender-male'"
                    >
                      {{ tamu.jenkel || 'L' }}
                    </span>
                  </div>

                  <span class="text-xs text-slate-500 mb-1 d-block text-truncate" :title="tamu.alamat">
                    <i class="fas fa-map-marker-alt text-slate-400 me-1"></i>
                    {{ tamu.alamat || 'Alamat tidak diisi' }}
                  </span>

                  <div v-if="tamu.no_hp" class="d-flex align-items-center gap-1 text-xs text-slate-600 text-truncate" :title="tamu.no_hp">
                    <i class="fab fa-whatsapp text-success me-1 flex-shrink-0"></i>
                    <span class="text-truncate">{{ tamu.no_hp }}</span>
                  </div>
                </div>
              </td>

              <!-- Keperluan -->
              <td class="ps-3">
                <div class="keperluan-box text-sm text-slate-700" :title="tamu.keperluan">
                  {{ tamu.keperluan || '-' }}
                </div>
              </td>

              <!-- Tujuan -->
              <td class="ps-3">
                <div class="d-flex flex-column gap-1" style="min-width: 0; max-width: 100%;">
                  <span class="department-badge text-truncate d-inline-flex" style="max-width: 100%;" :title="tamu.tujuan">
                    <i class="fas fa-building me-1 flex-shrink-0"></i>
                    <span class="text-truncate">{{ tamu.tujuan || 'Umum' }}</span>
                  </span>
                  <span v-if="tamu.nama_tujuan" class="text-xs text-slate-700 fw-semibold text-truncate d-block" :title="tamu.nama_tujuan">
                    <i class="fas fa-user-tie text-primary me-1 flex-shrink-0"></i>
                    <span>{{ tamu.nama_tujuan }}</span>
                  </span>
                </div>
              </td>

              <!-- Lampiran File -->
              <td class="text-center">
                <a
                  v-if="getLampiranUrl(tamu)"
                  :href="getLampiranUrl(tamu)"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="btn-file-link shadow-none text-truncate"
                  style="max-width: 90px;"
                  :title="'Unduh / Buka file lampiran (' + getFileInfo(tamu).label + ')'"
                >
                  <i :class="[getFileInfo(tamu).icon, getFileInfo(tamu).color, 'me-1 flex-shrink-0']"></i>
                  <span class="text-truncate">{{ getFileInfo(tamu).label }}</span>
                </a>
                <span v-else class="text-slate-400 text-xs">-</span>
              </td>

              <!-- Actions -->
              <td class="text-center pe-4">
                <div class="d-flex justify-content-center align-items-center gap-1">
                  <!-- Edit Button -->
                  <router-link
                    :to="{ name: 'Edit.Tamu', params: { id: tamu.id } }"
                    class="btn-action-icon btn-action-edit"
                    title="Ubah Data Tamu"
                  >
                    <i class="fas fa-pen text-xs"></i>
                  </router-link>

                  <!-- Delete Button -->
                  <button
                    type="button"
                    @click="confirmDelete(tamu.id)"
                    class="btn-action-icon btn-action-delete"
                    title="Hapus Data Tamu"
                  >
                    <i class="fas fa-trash-alt text-xs"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Modern Pagination Controls -->
      <div v-if="filteredTamus.length > 0" class="d-flex justify-content-between align-items-center flex-wrap gap-3 px-4 py-3 border-top">
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
            Total <b>{{ filteredTamus.length }}</b> data (Hal. <b>{{ currentPage }}</b> dari <b>{{ totalPages }}</b>)
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

  <!-- Modern Delete Confirmation Dialog Modal -->
  <transition name="fade">
    <div v-if="showConfirmDialog" class="modal-backdrop-custom">
      <div class="modal-card-custom shadow-lg">
        <div class="modal-warning-icon mx-auto mb-3">
          <i class="fas fa-exclamation-triangle fa-2x text-danger"></i>
        </div>
        <h5 class="fw-bold text-slate-900 mb-2">Hapus Data Tamu?</h5>
        <p class="text-slate-500 text-sm mb-4">
          Data tamu yang dihapus tidak dapat dipulihkan kembali. Apakah Anda yakin ingin melanjutkan?
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
            @click="deleteTamu"
            :disabled="isDeleting"
            class="btn btn-danger btn-sm px-4 rounded-3 d-flex align-items-center"
          >
            <span v-if="isDeleting" class="spinner-border spinner-border-sm me-2"></span>
            <i v-else class="fas fa-trash-alt me-2"></i>
            {{ isDeleting ? 'Menghapus...' : 'Ya, Hapus' }}
          </button>
        </div>
      </div>
    </div>
  </transition>

  <!-- Photo Modal Zoom Preview -->
  <transition name="fade">
    <div v-if="previewPhoto" class="modal-backdrop-custom" @click="closePhotoPreview">
      <div class="photo-modal-card" @click.stop>
        <button type="button" class="btn-close-photo" @click="closePhotoPreview">
          <i class="fas fa-times"></i>
        </button>
        <img :src="previewPhoto" class="img-fluid rounded-3" alt="Foto Tamu Full Preview" />
      </div>
    </div>
  </transition>
</template>

<style scoped>
/* Card Container */
.modern-table-card {
  border-radius: 18px;
  background: #ffffff;
  overflow: hidden;
}

/* Header */
.badge-count-pill {
  font-size: 0.72rem;
  font-weight: 700;
  padding: 3px 9px;
  border-radius: 20px;
  background: #eff6ff;
  color: #2563eb;
  border: 1px solid rgba(37, 99, 235, 0.2);
}

/* Search Bar */
.search-input-wrapper {
  position: relative;
  min-width: 260px;
}

.search-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 0.85rem;
  pointer-events: none;
}

.modern-search-input {
  padding-left: 38px;
  padding-right: 32px;
  height: 40px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  font-size: 0.84rem;
  background: #f8fafc;
  transition: all 0.2s ease;
}

.modern-search-input:focus {
  background: #ffffff;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
}

.btn-clear-search {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 4px;
}

/* Primary Gradient Button (Replaces green button) */
.btn-primary-gradient {
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  padding: 9px 18px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 0.84rem;
  display: inline-flex;
  align-items: center;
  border: none;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);
}

.btn-primary-gradient:hover {
  background: linear-gradient(135deg, #1d4ed8, #1e40af);
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(37, 99, 235, 0.35);
}

/* Table */
.modern-data-table {
  border-collapse: separate;
  border-spacing: 0;
  width: 100%;
}

.table-fixed {
  table-layout: fixed !important;
  width: 100% !important;
  min-width: 970px;
}

.table-fixed th,
.table-fixed td {
  vertical-align: middle;
}

.keperluan-box {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.45;
  word-break: break-word;
  white-space: normal;
}

.modern-data-table thead tr th {
  background-color: #f8fafc;
  border-bottom: 1px solid #edf2f7;
  padding-top: 12px;
  padding-bottom: 12px;
  letter-spacing: 0.04em;
}

.table-row-hover {
  transition: background-color 0.15s ease;
}

.table-row-hover:hover {
  background-color: #f8fafc;
}

.row-number-badge {
  font-size: 0.78rem;
  font-weight: 700;
  color: #64748b;
}

/* Photo Thumbnail */
.photo-thumbnail-wrap {
  width: 54px;
  height: 54px;
  border-radius: 12px;
  overflow: hidden;
  position: relative;
  cursor: pointer;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
}

.photo-thumbnail {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.2s ease;
}

.photo-fallback {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8fafc;
}

.photo-zoom-hint {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-size: 0.8rem;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.photo-thumbnail-wrap:hover .photo-zoom-hint {
  opacity: 1;
}

/* Gender Pills */
.gender-pill {
  font-size: 0.65rem;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 6px;
}

.gender-male {
  background: #eff6ff;
  color: #2563eb;
}

.gender-female {
  background: #fdf2f8;
  color: #db2777;
}

/* Department Badge */
.department-badge {
  display: inline-flex;
  align-items: center;
  font-size: 0.72rem;
  font-weight: 600;
  padding: 3px 8px;
  background: #f1f5f9;
  color: #334155;
  border-radius: 6px;
  width: fit-content;
}

/* File Link Button */
.btn-file-link {
  display: inline-flex;
  align-items: center;
  font-size: 0.72rem;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 6px;
  background: #e0f2fe;
  color: #0284c7;
  text-decoration: none;
  transition: all 0.15s ease;
}

.btn-file-link:hover {
  background: #0284c7;
  color: #ffffff;
}

/* Action Icon Buttons */
.btn-action-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  text-decoration: none;
  transition: all 0.18s ease;
}

.btn-action-edit {
  background: #eff6ff;
  color: #2563eb;
}

.btn-action-edit:hover {
  background: #2563eb;
  color: #ffffff;
  transform: translateY(-1px);
}

.btn-action-delete {
  background: #fef2f2;
  color: #ef4444;
}

.btn-action-delete:hover {
  background: #ef4444;
  color: #ffffff;
  transform: translateY(-1px);
}

/* Pagination */
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

/* Modal Backdrops */
.modal-backdrop-custom {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.55);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 16px;
}

.modal-card-custom {
  background: #ffffff;
  border-radius: 20px;
  width: 100%;
  max-width: 400px;
  padding: 28px 24px;
  text-align: center;
}

.modal-warning-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: #fef2f2;
  display: flex;
  align-items: center;
  justify-content: center;
}

.photo-modal-card {
  max-width: 500px;
  position: relative;
  background: #0f172a;
  border-radius: 16px;
  overflow: hidden;
  padding: 6px;
}

.btn-close-photo {
  position: absolute;
  top: 12px;
  right: 12px;
  background: rgba(0, 0, 0, 0.6);
  color: #ffffff;
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.text-slate-400 { color: #94a3b8 !important; }
.text-slate-500 { color: #64748b !important; }
.text-slate-600 { color: #475569 !important; }
.text-slate-700 { color: #334155 !important; }
.text-slate-800 { color: #1e293b !important; }
.text-slate-900 { color: #0f172a !important; }
</style>
