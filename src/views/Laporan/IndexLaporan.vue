<script setup>
import { ref, computed, onMounted } from "vue";
import api from "../../api";
import { saveAs } from "file-saver";

// State
const tamus = ref([]);
const searchQuery = ref("");
const perPage = ref(10);
const currentPage = ref(1);
const fromDate = ref("");
const toDate = ref("");
const isFiltered = ref(false);
const isExporting = ref(false);
const loading = ref(true);

// Fetch guest data
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

// Filtered tamus based on search and date range
const filteredTamus = computed(() => {
  if (!isFiltered.value) return [];

  let filtered = tamus.value;

  // Search filter
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase().trim();
    filtered = filtered.filter((tamu) =>
      (tamu.nama && tamu.nama.toLowerCase().includes(q)) ||
      (tamu.keperluan && tamu.keperluan.toLowerCase().includes(q)) ||
      (tamu.tujuan && tamu.tujuan.toLowerCase().includes(q)) ||
      (tamu.nama_tujuan && tamu.nama_tujuan.toLowerCase().includes(q))
    );
  }

  // Date range filter
  if (fromDate.value && toDate.value) {
    filtered = filtered.filter((tamu) => {
      if (!tamu.tgl_datang) return false;
      const tamuDate = new Date(tamu.tgl_datang.split(" ")[0]);
      return tamuDate >= new Date(fromDate.value) && tamuDate <= new Date(toDate.value);
    });
  }

  return filtered;
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

// Paginated data
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

// Filter action
const applyFilter = () => {
  if (!fromDate.value || !toDate.value) {
    alert("Silakan pilih rentang tanggal (Dari & Ke Tanggal) terlebih dahulu.");
    return;
  }
  if (new Date(fromDate.value) > new Date(toDate.value)) {
    alert("Tanggal 'Dari' tidak boleh lebih baru daripada tanggal 'Ke'.");
    return;
  }
  isFiltered.value = true;
  currentPage.value = 1;
};

// Reset filter
const resetFilter = () => {
  fromDate.value = "";
  toDate.value = "";
  searchQuery.value = "";
  isFiltered.value = false;
  currentPage.value = 1;
};

// Export action
const exportData = async () => {
  if (!isFiltered.value || filteredTamus.value.length === 0) {
    alert("Silakan terapkan filter tanggal dan pastikan data tersedia sebelum mengekspor.");
    return;
  }

  isExporting.value = true;
  try {
    const response = await api.get(
      `/api/exportTamu?dari=${fromDate.value}&sampai=${toDate.value}`,
      { responseType: "arraybuffer" }
    );
    const blob = new Blob([response.data], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(blob, `Laporan_Data_Tamu_${fromDate.value}_sd_${toDate.value}.xlsx`);
  } catch (error) {
    console.error("Gagal mengekspor laporan:", error);
    alert("Gagal mengunduh file laporan dari server.");
  } finally {
    isExporting.value = false;
  }
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

// Image modal preview state
const previewPhoto = ref(null);
const openPhotoPreview = (url) => {
  if (url) previewPhoto.value = url;
};
const closePhotoPreview = () => {
  previewPhoto.value = null;
};

onMounted(() => {
  fetchDataTamus();
});
</script>

<template>
  <div class="card modern-table-card border-0 shadow-sm">
    <!-- Header with Filters -->
    <div class="card-header modern-card-header bg-white pb-4 pt-4 px-4 border-0">
      <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2 mb-4">
        <div>
          <div class="d-flex align-items-center gap-2">
            <h5 class="mb-0 fw-bold text-slate-900">Laporan Rekap Kunjungan</h5>
            <span v-if="isFiltered" class="badge-count-pill">
              {{ filteredTamus.length }} Data Terfilter
            </span>
          </div>
          <p class="text-slate-500 text-xs mb-0 mt-1">
            Filter rentang tanggal untuk menampilkan data kunjungan & unduh rekap format Excel
          </p>
        </div>
      </div>

      <!-- Filter Controls Grid -->
      <div class="filter-box-card p-3 rounded-4">
        <div class="row g-3 align-items-end">
          <!-- From Date -->
          <div class="col-12 col-sm-6 col-lg-3">
            <label for="fromDate" class="form-label text-xs fw-bold text-slate-700 mb-1">
              <i class="far fa-calendar-alt me-1 text-primary"></i> Dari Tanggal
            </label>
            <input
              type="date"
              id="fromDate"
              v-model="fromDate"
              class="form-control modern-input"
            />
          </div>

          <!-- To Date -->
          <div class="col-12 col-sm-6 col-lg-3">
            <label for="toDate" class="form-label text-xs fw-bold text-slate-700 mb-1">
              <i class="far fa-calendar-check me-1 text-primary"></i> Ke Tanggal
            </label>
            <input
              type="date"
              id="toDate"
              v-model="toDate"
              class="form-control modern-input"
            />
          </div>

          <!-- Search keyword (optional) -->
          <div class="col-12 col-sm-6 col-lg-3">
            <label class="form-label text-xs fw-bold text-slate-700 mb-1">
              <i class="fas fa-search me-1 text-slate-400"></i> Cari Nama / Keperluan
            </label>
            <input
              type="text"
              v-model="searchQuery"
              placeholder="Ketik kata kunci..."
              class="form-control modern-input"
            />
          </div>

          <!-- Action Buttons -->
          <div class="col-12 col-sm-6 col-lg-3">
            <div class="d-flex gap-2">
              <button
                type="button"
                @click="applyFilter"
                class="btn-primary-gradient text-white border-0 flex-grow-1 rounded-3 d-flex align-items-center justify-content-center text-xs fw-semibold"
              >
                <i class="fas fa-filter me-1"></i> Terapkan
              </button>
              <button
                v-if="isFiltered"
                type="button"
                @click="resetFilter"
                class="btn-cancel px-3 rounded-3 text-xs"
                title="Reset Filter"
              >
                <i class="fas fa-undo"></i>
              </button>
              <button
                type="button"
                @click="exportData"
                :disabled="!isFiltered || filteredTamus.length === 0 || isExporting"
                class="btn-export-excel text-white border-0 px-3 rounded-3 d-flex align-items-center justify-content-center text-xs fw-semibold"
                title="Ekspor ke Excel"
              >
                <span v-if="isExporting" class="spinner-border spinner-border-sm me-1"></span>
                <i v-if="!isExporting" class="fas fa-file-excel me-1"></i>
                Excel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Table Body -->
    <div class="card-body px-0 pt-0 pb-2">
      <!-- Initial State: Prompt to Filter -->
      <div v-if="!isFiltered" class="text-center py-5 px-3">
        <div class="empty-icon text-slate-300 mb-3">
          <i class="fas fa-calendar-day fa-3x"></i>
        </div>
        <h6 class="fw-bold text-slate-700 mb-1">Silakan Tentukan Rentang Tanggal</h6>
        <p class="text-slate-400 text-xs mb-0">
          Pilih tanggal "Dari" dan "Ke" di atas, lalu klik <b>Terapkan</b> untuk menampilkan laporan kunjungan.
        </p>
      </div>

      <!-- Filtered but Empty -->
      <div v-else-if="filteredTamus.length === 0" class="text-center py-5 px-3">
        <div class="empty-icon text-slate-300 mb-3">
          <i class="fas fa-folder-open fa-3x"></i>
        </div>
        <h6 class="fw-bold text-slate-700 mb-1">Tidak Ada Data Kunjungan</h6>
        <p class="text-slate-400 text-xs mb-0">
          Tidak ditemukan catatan buku tamu pada rentang tanggal {{ fromDate }} s/d {{ toDate }}.
        </p>
      </div>

      <!-- Table with Data -->
      <div v-else>
        <div class="table-responsive p-0">
          <table class="table modern-data-table align-items-center mb-0 table-fixed">
            <!-- Fixed Column Widths -->
            <colgroup>
              <col style="width: 50px" />       <!-- No -->
              <col style="width: 120px" />      <!-- Waktu Datang -->
              <col style="width: 70px" />       <!-- Foto -->
              <col style="width: 220px" />      <!-- Identitas Tamu -->
              <col style="width: 240px" />      <!-- Keperluan Bertamu -->
              <col style="width: 180px" />      <!-- Tujuan Kunjungan -->
              <col style="width: 100px" />      <!-- Lampiran -->
            </colgroup>
            <thead>
              <tr>
                <th class="text-center text-uppercase text-xxs font-weight-bolder text-slate-500 ps-4">No</th>
                <th class="text-uppercase text-xxs font-weight-bolder text-slate-500 ps-3">Waktu Datang</th>
                <th class="text-center text-uppercase text-xxs font-weight-bolder text-slate-500">Foto</th>
                <th class="text-uppercase text-xxs font-weight-bolder text-slate-500 ps-3">Identitas Tamu</th>
                <th class="text-uppercase text-xxs font-weight-bolder text-slate-500 ps-3">Keperluan Bertamu</th>
                <th class="text-uppercase text-xxs font-weight-bolder text-slate-500 ps-3">Tujuan Kunjungan</th>
                <th class="text-center text-uppercase text-xxs font-weight-bolder text-slate-500 pe-4">Lampiran</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(tamu, index) in paginatedTamus" :key="tamu.id || index" class="table-row-hover">
                <td class="text-center text-slate-500 text-xs fw-semibold ps-4">
                  {{ (currentPage - 1) * perPage + index + 1 }}
                </td>
                <td class="ps-3">
                  <div style="min-width: 0; max-width: 100%;">
                    <span class="d-block text-xs fw-bold text-slate-900 text-truncate">{{ tamu.tgl_datang ? tamu.tgl_datang.split(" ")[0] : '-' }}</span>
                    <span class="text-xs text-slate-500 text-truncate d-block">
                      <i class="far fa-clock me-1 text-slate-400"></i>
                      {{ tamu.created_at ? new Date(tamu.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-' }}
                    </span>
                  </div>
                </td>
                <td class="text-center py-2">
                  <div
                    v-if="tamu.photo"
                    class="avatar-preview-box cursor-pointer"
                    @click="openPhotoPreview(getPhotoUrl(tamu.photo))"
                    title="Klik untuk perbesar"
                  >
                    <img
                      :src="getPhotoUrl(tamu.photo)"
                      alt="Foto Tamu"
                      class="avatar-img-square"
                    />
                    <div class="avatar-hover-overlay">
                      <i class="fas fa-search-plus"></i>
                    </div>
                  </div>
                  <div v-else class="tamu-avatar-initials">
                    {{ tamu.nama ? tamu.nama.charAt(0).toUpperCase() : 'T' }}
                  </div>
                </td>
                <td class="ps-3">
                  <div style="min-width: 0; max-width: 100%;">
                    <span class="d-block text-xs fw-bold text-slate-900 text-truncate" :title="tamu.nama">{{ tamu.nama }}</span>
                    <span class="text-xs text-slate-500 d-block mt-0-5 text-truncate" :title="(tamu.jenkel || '-') + ' • ' + (tamu.no_hp || '-')">
                      <i class="fas fa-venus-mars me-1 text-slate-400"></i>{{ tamu.jenkel || '-' }} &bull; 
                      <i class="fas fa-phone-alt ms-1 me-1 text-slate-400"></i>{{ tamu.no_hp || '-' }}
                    </span>
                    <small v-if="tamu.alamat" class="text-slate-400 text-xxs d-block text-truncate" :title="tamu.alamat">
                      <i class="fas fa-map-marker-alt me-1"></i>{{ tamu.alamat }}
                    </small>
                  </div>
                </td>
                <td class="ps-3">
                  <div class="keperluan-box text-xs text-slate-700 fw-medium" :title="tamu.keperluan">
                    {{ tamu.keperluan || '-' }}
                  </div>
                </td>
                <td class="ps-3">
                  <div style="min-width: 0; max-width: 100%;">
                    <span class="badge-destination text-truncate d-inline-block" style="max-width: 100%;" :title="tamu.tujuan">
                      {{ tamu.tujuan || 'Sekolah' }}
                    </span>
                    <span v-if="tamu.nama_tujuan" class="d-block text-xs text-slate-500 mt-1 text-truncate" :title="'d/a ' + tamu.nama_tujuan">
                      d/a {{ tamu.nama_tujuan }}
                    </span>
                  </div>
                </td>
                <td class="text-center pe-4">
                  <a
                    v-if="getLampiranUrl(tamu)"
                    :href="getLampiranUrl(tamu)"
                    target="_blank"
                    class="btn-file-link text-truncate"
                    style="max-width: 90px;"
                    title="Buka Dokumen Lampiran"
                  >
                    <i class="fas fa-paperclip me-1 flex-shrink-0"></i> Dokumen
                  </a>
                  <span v-else class="text-slate-400 text-xs">-</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div v-if="filteredTamus.length > 0" class="d-flex justify-content-between align-items-center px-4 py-3 border-top flex-wrap gap-3">
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
              <li class="page-item" :class="{ disabled: currentPage === 1 }">
                <button class="page-link" @click="prevPage" aria-label="Sebelumnya">
                  <i class="fas fa-chevron-left text-xs"></i>
                </button>
              </li>
              <li class="page-item" :class="{ active: currentPage === 1 }">
                <button class="page-link" @click="setPage(1)">1</button>
              </li>
              <li v-if="currentPage > 3" class="page-item disabled">
                <span class="page-link">...</span>
              </li>
              <li
                v-for="page in dynamicPages"
                :key="page"
                class="page-item"
                :class="{ active: currentPage === page }"
              >
                <button class="page-link" @click="setPage(page)">{{ page }}</button>
              </li>
              <li v-if="currentPage < totalPages - 2" class="page-item disabled">
                <span class="page-link">...</span>
              </li>
              <li v-if="totalPages > 1" class="page-item" :class="{ active: currentPage === totalPages }">
                <button class="page-link" @click="setPage(totalPages)">{{ totalPages }}</button>
              </li>
              <li class="page-item" :class="{ disabled: currentPage === totalPages }">
                <button class="page-link" @click="nextPage" aria-label="Selanjutnya">
                  <i class="fas fa-chevron-right text-xs"></i>
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </div>
  </div>

  <!-- Photo Preview Modal -->
  <div v-if="previewPhoto" class="modal-backdrop-custom" @click="closePhotoPreview">
    <div class="photo-modal-box" @click.stop>
      <div class="photo-modal-header d-flex justify-content-between align-items-center">
        <span class="text-xs fw-bold text-slate-700">Foto Tamu</span>
        <button type="button" class="btn-close-preview" @click="closePhotoPreview">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div class="photo-modal-body text-center p-3">
        <img :src="previewPhoto" alt="Preview Foto" class="preview-full-img" />
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

.filter-box-card {
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
}

.modern-input {
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  padding: 8px 12px;
  font-size: 13px;
  color: #1e293b;
  background-color: #ffffff;
  min-height: 40px;
}

.modern-input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
  outline: none;
}

.btn-primary-gradient {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  padding: 9px 16px;
  min-height: 40px;
  transition: all 0.2s ease;
}

.btn-primary-gradient:hover {
  background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.35) !important;
}

.btn-export-excel {
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
  min-height: 40px;
  transition: all 0.2s ease;
}

.btn-export-excel:hover:not(:disabled) {
  background: linear-gradient(135deg, #047857 0%, #065f46 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(5, 150, 105, 0.35) !important;
}

.btn-export-excel:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-cancel {
  background-color: #ffffff;
  color: #334155 !important;
  border: 1px solid #cbd5e1;
  font-weight: 600;
  min-height: 40px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.btn-cancel:hover {
  background-color: #f1f5f9;
  border-color: #94a3b8;
}

.modern-data-table {
  border-collapse: separate;
  border-spacing: 0;
  width: 100%;
}

.table-fixed {
  table-layout: fixed !important;
  width: 100% !important;
  min-width: 980px;
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

.tamu-avatar-initials {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
  color: #ffffff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 700;
}

.badge-destination {
  background-color: #eff6ff;
  color: #1d4ed8;
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
}

.btn-file-link {
  font-size: 11px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 8px;
  background-color: #f1f5f9;
  color: #2563eb;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  transition: all 0.2s ease;
}

.btn-file-link:hover {
  background-color: #e2e8f0;
  color: #1d4ed8;
}

.modern-pagination .page-item .page-link {
  border-radius: 8px;
  margin: 0 2px;
  border: 1px solid #e2e8f0;
  color: #475569;
  font-size: 12px;
  min-width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modern-pagination .page-item.active .page-link {
  background-color: #2563eb;
  border-color: #2563eb;
  color: #ffffff;
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

/* Modal Photo Preview */
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

.text-slate-900 { color: #0f172a !important; }
.text-slate-700 { color: #334155 !important; }
.text-slate-500 { color: #64748b !important; }
.text-slate-400 { color: #94a3b8 !important; }
.text-slate-300 { color: #cbd5e1 !important; }
.cursor-pointer { cursor: pointer; }
.mt-0-5 { margin-top: 2px; }
.text-xxs { font-size: 10px; }
</style>
