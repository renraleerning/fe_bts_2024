<script setup>
/* eslint-disable */
import { ref, computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import api, { getStorageUrl, getApiUrl } from "@/api";
import Swal from "sweetalert2";
import QRCode from "qrcode";

const route = useRoute();
const eventId = route.params.id;

const event = ref(null);
const tamuList = ref([]);
const isLoading = ref(true);
const searchQuery = ref("");

const perPage = ref(10);
const currentPage = ref(1);

// Fetch visitors
const fetchTamu = async () => {
  isLoading.value = true;
  try {
    const res = await api.get(`/api/event/${eventId}/tamu`);
    event.value = res.data?.event || null;
    tamuList.value = res.data?.data || [];
  } catch (err) {
    console.error(err);
    Swal.fire({
      icon: "error",
      title: "Gagal Memuat Data",
      text: "Data tamu event tidak dapat diambil dari server."
    });
  } finally {
    isLoading.value = false;
  }
};

// Filtered guests
const filteredTamu = computed(() => {
  if (!searchQuery.value.trim()) return tamuList.value;
  const q = searchQuery.value.toLowerCase().trim();
  return tamuList.value.filter((t) => {
    const matchNama = (t.nama || "").toLowerCase().includes(q);
    const matchHp = (t.no_hp || "").toLowerCase().includes(q);
    const customValues = Object.values(t.data_custom || {}).join(" ").toLowerCase();
    const matchCustom = customValues.includes(q);
    return matchNama || matchHp || matchCustom;
  });
});

// Employee Event Helpers
const isPegawaiEvent = computed(() => event.value?.target_peserta === 'pegawai');
const empFields = computed(() => event.value?.employee_fields || ['nip', 'jabatan']);
const showNip = computed(() => isPegawaiEvent.value && empFields.value.includes('nip'));
const showJabatan = computed(() => isPegawaiEvent.value && empFields.value.includes('jabatan'));
const showNoHp = computed(() => {
  if (!isPegawaiEvent.value) return true;
  return empFields.value.includes('no_hp');
});
const showJenkel = computed(() => {
  if (!isPegawaiEvent.value) return false;
  return empFields.value.includes('jenkel');
});

// Total pages
const totalPages = computed(() => {
  return Math.ceil(filteredTamu.value.length / perPage.value) || 1;
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

// Paginated guests
const paginatedTamu = computed(() => {
  const start = (currentPage.value - 1) * perPage.value;
  const end = start + perPage.value;
  return filteredTamu.value.slice(start, end);
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

// Download Excel
const downloadExcel = () => {
  window.open(getApiUrl(`/api/event/${eventId}/export-excel`), "_blank");
};

// QR Code Stand State & Methods
const showQrModal = ref(false);
const qrCodeDataUrl = ref("");
const qrEventUrl = ref("");
const isCopied = ref(false);

const openQrModal = async () => {
  if (!event.value) return;
  const origin = window.location.origin;
  qrEventUrl.value = `${origin}/event/${event.value.id}/presensi`;
  try {
    qrCodeDataUrl.value = await QRCode.toDataURL(qrEventUrl.value, {
      width: 600,
      margin: 2,
      color: {
        dark: "#0f172a",
        light: "#ffffff",
      },
    });
  } catch (err) {
    console.error("Gagal generate QR Code:", err);
  }
  showQrModal.value = true;
};

const closeQrModal = () => {
  showQrModal.value = false;
  qrCodeDataUrl.value = "";
  isCopied.value = false;
};

const copyQrUrl = async () => {
  try {
    await navigator.clipboard.writeText(qrEventUrl.value);
    isCopied.value = true;
    setTimeout(() => {
      isCopied.value = false;
    }, 2000);
  } catch (e) {
    const el = document.createElement("textarea");
    el.value = qrEventUrl.value;
    document.body.appendChild(el);
    el.select();
    document.execCommand("copy");
    document.body.removeChild(el);
    isCopied.value = true;
    setTimeout(() => {
      isCopied.value = false;
    }, 2000);
  }
};

const downloadQrCode = () => {
  if (!qrCodeDataUrl.value) return;
  const link = document.createElement("a");
  const slugName = (event.value?.nama_event || "Event").replace(/[^a-zA-Z0-9]/g, "_");
  link.download = `QRCode_Presensi_${slugName}.png`;
  link.href = qrCodeDataUrl.value;
  link.click();
};

const printQrStand = () => {
  if (!qrCodeDataUrl.value) return;

  const eventName = event.value?.nama_event || "Event Presensi";
  const eventLoc = event.value?.lokasi
    ? `<div style="font-size: 15px; color: #dc2626; margin-bottom: 6px; font-weight: 600;">📍 ${event.value.lokasi}</div>`
    : "";
  const eventDate = event.value?.tgl_mulai
    ? `<div style="font-size: 15px; color: #2563eb; margin-bottom: 8px; font-weight: 600;">📅 ${event.value.tgl_mulai}</div>`
    : "";
  const targetBadge =
    event.value?.target_peserta === "pegawai"
      ? `<span style="background: #22c55e; color: #fff; font-size: 13px; padding: 4px 16px; border-radius: 9999px; font-weight: 700;">Internal Pegawai</span>`
      : `<span style="background: #0ea5e9; color: #fff; font-size: 13px; padding: 4px 16px; border-radius: 9999px; font-weight: 700;">Terbuka Untuk Umum</span>`;

  // Hapus iframe print lama jika ada
  const existingFrame = document.getElementById("qr-print-frame");
  if (existingFrame) existingFrame.remove();

  const iframe = document.createElement("iframe");
  iframe.id = "qr-print-frame";
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title></title>
      <style>
        @page {
          margin: 0;
          size: auto;
        }
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          background: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          padding: 24px;
        }
        .stand-card {
          width: 100%;
          max-width: 620px;
          border: 3px dashed #334155;
          border-radius: 28px;
          padding: 44px 36px;
          text-align: center;
          background: #ffffff;
        }
        .title {
          font-size: 26px;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: 1px;
          margin-bottom: 6px;
        }
        .event-name {
          font-size: 24px;
          font-weight: 700;
          color: #2563eb;
          margin-bottom: 12px;
        }
        .meta-box {
          margin-bottom: 22px;
        }
        .qr-wrapper {
          display: inline-block;
          padding: 16px;
          background: #ffffff;
          border: 2px solid #cbd5e1;
          border-radius: 24px;
          margin-bottom: 22px;
          box-shadow: 0 4px 16px rgba(0,0,0,0.06);
        }
        .qr-img {
          width: 350px;
          height: 350px;
          display: block;
        }
        .instruction-title {
          font-size: 16px;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 6px;
        }
        .instruction-desc {
          font-size: 12px;
          color: #64748b;
          line-height: 1.5;
        }
      </style>
    </head>
    <body>
      <div class="stand-card">
        <h2 class="title">PRESENSI KEHADIRAN</h2>
        <h3 class="event-name">${eventName}</h3>
        <div class="meta-box">
          ${eventLoc}
          ${eventDate}
          ${targetBadge}
        </div>
        <div class="qr-wrapper">
          <img src="${qrCodeDataUrl.value}" class="qr-img" alt="QR Code" />
        </div>
        <div class="instruction-title">📷 Arahkan Kamera Smartphone ke Kode QR di Atas</div>
        <div class="instruction-desc">Buka aplikasi Kamera atau Pemindai QR di HP Anda untuk langsung membuka formulir presensi.</div>
      </div>
    </body>
    </html>
  `);
  doc.close();

  setTimeout(() => {
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
    setTimeout(() => {
      iframe.remove();
    }, 2000);
  }, 350);
};

// Format Date
const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }) + " WIB";
};

// Photo Modal
const activePhoto = ref(null);
const openPhoto = (url) => {
  activePhoto.value = url;
};
const closePhoto = () => {
  activePhoto.value = null;
};

// Signature Modal
const activeSignature = ref(null);
const openSignature = (url) => {
  activeSignature.value = url;
};
const closeSignature = () => {
  activeSignature.value = null;
};

// Resolve Photo URL
const getPhotoUrl = (fileName) => {
  if (!fileName) return null;
  return getStorageUrl(`tamu_event/${fileName}`);
};

// Resolve Signature URL
const getSignatureUrl = (fileName) => {
  if (!fileName) return null;
  return getStorageUrl(`tamu_event/${fileName}`);
};

onMounted(() => {
  fetchTamu();
});
</script>

<template>
  <div class="py-4 container-fluid detail-event-container">
    <!-- Header Card -->
    <div class="card border-0 shadow-sm mb-4 page-header-card">
      <div class="card-body p-3 p-sm-4 d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3">
        <div>
          <div class="d-flex align-items-center gap-2 mb-1">
            <router-link :to="{ name: 'Data Event' }" class="text-xs text-primary text-decoration-none fw-bold">
              <i class="fas fa-arrow-left me-1"></i> Kembali ke Daftar Event
            </router-link>
            <span class="text-slate-300">/</span>
            <span class="badge bg-blue-light text-primary text-xxs fw-bold">Rekap Data Tamu</span>
          </div>
          <h4 class="mb-1 fw-bold header-title-text">{{ event?.nama_event || "Detail Tamu Event" }}</h4>
          <p class="header-subtitle-text mb-0">
            <span v-if="event?.lokasi" class="me-3">
              <i class="fas fa-map-marker-alt text-danger me-1"></i> {{ event.lokasi }}
            </span>
            <span>
              <i class="fas fa-users text-primary me-1"></i> Total Hadir: <strong>{{ tamuList.length }} Orang</strong>
            </span>
          </p>
        </div>

        <div class="d-flex align-items-center gap-2 flex-wrap">
          <button
            type="button"
            @click="openQrModal"
            class="btn btn-outline-info px-3 py-2 rounded-3 shadow-xs d-flex align-items-center gap-2 fw-semibold text-sm mb-0"
            title="Tampilkan & Cetak QR Code Meja Registrasi"
          >
            <i class="fas fa-qrcode"></i> QR Code Stand
          </button>
          <button
            type="button"
            @click="downloadExcel"
            :disabled="tamuList.length === 0"
            class="btn btn-success text-white border-0 px-4 py-2 rounded-3 shadow-sm d-flex align-items-center gap-2 fw-semibold text-sm mb-0"
          >
            <i class="fas fa-file-excel"></i> Unduh Rekap Excel
          </button>
        </div>
      </div>
    </div>

    <!-- Table Card -->
    <div class="card border-0 shadow-sm rounded-4 overflow-hidden">
      <!-- Search Bar & Counter -->
      <div class="card-header bg-white border-0 pt-4 pb-2 px-4 d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3">
        <div class="d-flex align-items-center gap-2">
          <h6 class="fw-bold text-slate-800 mb-0">Daftar Pengunjung</h6>
          <span class="badge bg-slate-100 text-slate-600 rounded-pill text-xs">
            {{ filteredTamu.length }} dari {{ tamuList.length }}
          </span>
        </div>

        <div class="search-box">
          <i class="fas fa-search search-icon text-slate-400"></i>
          <input
            type="text"
            v-model="searchQuery"
            placeholder="Cari nama, WhatsApp, asal instansi..."
            class="form-control form-control-sm search-input"
          />
        </div>
      </div>

      <div class="card-body p-0">
        <!-- Loading State -->
        <div v-if="isLoading" class="p-5 text-center">
          <div class="spinner-border text-primary mb-2" role="status"></div>
          <p class="text-slate-400 text-xs mb-0">Memuat data pengunjung event...</p>
        </div>

        <!-- Empty State -->
        <div v-else-if="filteredTamu.length === 0" class="p-5 text-center">
          <div class="empty-icon-circle mx-auto mb-3">
            <i class="fas fa-user-friends fa-2x text-slate-400"></i>
          </div>
          <h6 class="fw-bold text-slate-700 mb-1">
            {{ searchQuery ? "Tidak Ada Data yang Cocok" : "Belum Ada Pengunjung Hadir" }}
          </h6>
          <p class="text-slate-400 text-xs mb-0">
            {{ searchQuery ? "Coba kata kunci pencarian yang lain." : "Presensi pengunjung yang mengisi form akan tampil di sini secara real-time." }}
          </p>
        </div>

        <!-- Table View -->
        <div v-else class="table-responsive">
          <table class="table align-items-center mb-0 modern-table">
            <thead>
              <!-- Header Khusus Event Pegawai -->
              <tr v-if="isPegawaiEvent">
                <th class="text-uppercase text-slate-400 text-xxs font-weight-bolder ps-4" style="width: 50px;">No</th>
                <th v-if="showNip" class="text-uppercase text-slate-400 text-xxs font-weight-bolder ps-3">NIP</th>
                <th class="text-uppercase text-slate-400 text-xxs font-weight-bolder ps-3">Nama Pegawai</th>
                <th v-if="showJabatan" class="text-uppercase text-slate-400 text-xxs font-weight-bolder ps-3">Jabatan</th>
                <th v-if="showNoHp" class="text-uppercase text-slate-400 text-xxs font-weight-bolder ps-3">No. HP</th>
                <th v-if="showJenkel" class="text-uppercase text-slate-400 text-xxs font-weight-bolder ps-3">L/P</th>
                <th v-if="event?.require_signature" class="text-uppercase text-slate-400 text-xxs font-weight-bolder ps-3" style="width: 100px;">TTD</th>
                <th class="text-uppercase text-slate-400 text-xxs font-weight-bolder ps-3">Waktu Presensi</th>
              </tr>

              <!-- Header Standar Event Umum -->
              <tr v-else>
                <th class="text-uppercase text-slate-400 text-xxs font-weight-bolder ps-4" style="width: 50px;">No</th>
                <th v-if="event?.require_photo" class="text-uppercase text-slate-400 text-xxs font-weight-bolder ps-3" style="width: 80px;">Foto</th>
                <th v-if="event?.require_signature" class="text-uppercase text-slate-400 text-xxs font-weight-bolder ps-3" style="width: 100px;">TTD</th>
                <th class="text-uppercase text-slate-400 text-xxs font-weight-bolder ps-3">Waktu Presensi</th>
                <th class="text-uppercase text-slate-400 text-xxs font-weight-bolder ps-3">Nama Pengunjung</th>
                <th class="text-uppercase text-slate-400 text-xxs font-weight-bolder ps-3">No. WhatsApp</th>
                <!-- Dynamic Columns from Event Fields -->
                <th
                  v-for="(field, fIdx) in event?.fields || []"
                  :key="'th-' + fIdx"
                  class="text-uppercase text-slate-400 text-xxs font-weight-bolder ps-3"
                >
                  {{ field.label }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(guest, idx) in paginatedTamu" :key="guest.id">
                <!-- No -->
                <td class="ps-4 text-xs font-weight-bold text-slate-500">
                  {{ (currentPage - 1) * perPage + idx + 1 }}
                </td>

                <!-- Baris Khusus Pegawai -->
                <template v-if="isPegawaiEvent">
                  <!-- NIP -->
                  <td v-if="showNip" class="ps-3 text-xs fw-semibold text-slate-700">
                    <span v-if="guest.nip" class="badge bg-slate-100 text-slate-700 font-monospace">{{ guest.nip }}</span>
                    <span v-else class="text-slate-400 text-xxs">-</span>
                  </td>

                  <!-- Nama Pegawai -->
                  <td class="ps-3">
                    <h6 class="mb-0 text-xs fw-bold text-slate-800">{{ guest.nama }}</h6>
                  </td>

                  <!-- Jabatan -->
                  <td v-if="showJabatan" class="ps-3 text-xs text-slate-600">
                    {{ (guest.data_custom && guest.data_custom['jabatan']) || '-' }}
                  </td>

                  <!-- No. HP -->
                  <td v-if="showNoHp" class="ps-3 text-xs font-weight-semibold text-slate-700">
                    <span v-if="guest.no_hp" class="text-nowrap">
                      <i class="fab fa-whatsapp text-success me-1"></i> {{ guest.no_hp }}
                    </span>
                    <span v-else class="text-slate-400 text-xxs">-</span>
                  </td>

                  <!-- L/P -->
                  <td v-if="showJenkel" class="ps-3 text-xs text-slate-700">
                    <span v-if="guest.jenkel">
                      {{ guest.jenkel.toLowerCase().startsWith('l') ? 'L' : (guest.jenkel.toLowerCase().startsWith('p') ? 'P' : guest.jenkel) }}
                    </span>
                    <span v-else class="text-slate-400 text-xxs">-</span>
                  </td>

                  <!-- TTD -->
                  <td v-if="event?.require_signature" class="ps-3">
                    <div v-if="guest.signature" class="signature-cell" @click="openSignature(getSignatureUrl(guest.signature))" title="Klik untuk perbesar tanda tangan">
                      <img
                        :src="getSignatureUrl(guest.signature)"
                        class="signature-img shadow-sm"
                        alt="TTD Tamu"
                      />
                    </div>
                    <span v-else class="text-slate-300 text-xxs">-</span>
                  </td>

                  <!-- Waktu -->
                  <td class="ps-3 text-xs text-slate-500">
                    {{ formatDate(guest.created_at) }}
                  </td>
                </template>

                <!-- Baris Standar Event Umum -->
                <template v-else>
                  <!-- Foto Selfie -->
                  <td v-if="event?.require_photo" class="ps-3">
                    <div v-if="guest.photo" class="avatar-cell">
                      <img
                        :src="getPhotoUrl(guest.photo)"
                        @click="openPhoto(getPhotoUrl(guest.photo))"
                        class="avatar-img shadow-sm"
                        alt="Foto Tamu"
                      />
                    </div>
                    <span v-else class="text-slate-300 text-xxs">-</span>
                  </td>

                  <!-- Tanda Tangan Digital -->
                  <td v-if="event?.require_signature" class="ps-3">
                    <div v-if="guest.signature" class="signature-cell" @click="openSignature(getSignatureUrl(guest.signature))" title="Klik untuk perbesar tanda tangan">
                      <img
                        :src="getSignatureUrl(guest.signature)"
                        class="signature-img shadow-sm"
                        alt="TTD Tamu"
                      />
                    </div>
                    <span v-else class="text-slate-300 text-xxs">-</span>
                  </td>

                  <!-- Waktu -->
                  <td class="ps-3 text-xs text-slate-500">
                    {{ formatDate(guest.created_at) }}
                  </td>

                  <!-- Nama & Email -->
                  <td class="ps-3">
                    <h6 class="mb-0 text-xs fw-bold text-slate-800">{{ guest.nama }}</h6>
                    <small v-if="guest.email" class="text-slate-400 text-xxs d-block">{{ guest.email }}</small>
                  </td>

                  <!-- No WhatsApp -->
                  <td class="ps-3 text-xs font-weight-semibold text-slate-700">
                    <span v-if="guest.no_hp" class="text-nowrap">
                      <i class="fab fa-whatsapp text-success me-1"></i> {{ guest.no_hp }}
                    </span>
                    <span v-else class="text-slate-400 text-xxs">-</span>
                  </td>

                  <!-- Dynamic Custom Columns -->
                  <td
                    v-for="(field, fIdx) in event?.fields || []"
                    :key="'td-' + fIdx"
                    class="ps-3 text-xs text-slate-700"
                  >
                    <span v-if="guest.data_custom && guest.data_custom[field.label]">
                      {{ Array.isArray(guest.data_custom[field.label]) ? guest.data_custom[field.label].join(", ") : guest.data_custom[field.label] }}
                    </span>
                    <span v-else class="text-slate-300">-</span>
                  </td>
                </template>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination Controls -->
        <div v-if="filteredTamu.length > 0" class="d-flex justify-content-between align-items-center flex-wrap gap-3 px-4 py-3 border-top">
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
              Total <b>{{ filteredTamu.length }}</b> data (Hal. <b>{{ currentPage }}</b> dari <b>{{ totalPages }}</b>)
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
                <span class="page-link border-0">...</span>
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
                <span class="page-link border-0">...</span>
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

    <!-- Photo Modal Preview -->
    <div v-if="activePhoto" class="photo-modal-backdrop" @click="closePhoto">
      <div class="photo-modal-content" @click.stop>
        <button class="btn-close-modal" @click="closePhoto">
          <i class="fas fa-times"></i>
        </button>
        <img :src="activePhoto" class="img-fluid rounded-4 shadow-lg" alt="Foto Tamu Besar" />
      </div>
    </div>

    <!-- Signature Modal Preview -->
    <div v-if="activeSignature" class="photo-modal-backdrop" @click="closeSignature">
      <div class="photo-modal-content bg-white p-4 rounded-4 shadow-lg text-center" @click.stop style="max-width: 480px; width: 90%;">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h6 class="mb-0 fw-bold text-slate-800 text-sm">
            <i class="fas fa-signature text-primary me-2"></i>Tanda Tangan Pengunjung
          </h6>
          <button class="btn btn-sm btn-light rounded-circle" @click="closeSignature" style="width: 32px; height: 32px; padding: 0;">
            <i class="fas fa-times text-slate-500"></i>
          </button>
        </div>
        <div class="p-3 bg-slate-50 rounded-3 border">
          <img :src="activeSignature" class="img-fluid" alt="Tanda Tangan Pengunjung" style="max-height: 200px; object-fit: contain;" />
        </div>
      </div>
    </div>

    <!-- Modal QR Code Stand Registrasi -->
    <div v-if="showQrModal && event" class="modal-backdrop-custom qr-modal-backdrop" @click="closeQrModal">
      <div class="modal-dialog-custom qr-modal-dialog" @click.stop>
        <div class="card border-0 shadow-lg rounded-4 overflow-hidden bg-white">
          <!-- Header Modal (Sembunyi saat cetak) -->
          <div class="qr-modal-header p-3 p-sm-4 d-flex justify-content-between align-items-center no-print">
            <div class="d-flex align-items-center gap-2">
              <div class="qr-header-icon-box shadow-xs">
                <i class="fas fa-qrcode text-primary"></i>
              </div>
              <div>
                <h6 class="mb-0 text-white fw-bold qr-header-title">QR Code Presensi Event</h6>
                <small class="text-slate-300 text-xs">Pindai atau cetak sebagai stand meja registrasi</small>
              </div>
            </div>
            <button
              type="button"
              @click="closeQrModal"
              class="qr-close-btn"
              aria-label="Close"
              title="Tutup Modal"
            >
              <i class="fas fa-times"></i>
            </button>
          </div>

          <!-- Printable Card -->
          <div class="card-body p-3 p-sm-4 text-center printable-qr-card qr-modal-body">
            <div class="qr-stand-header mb-2 pb-2 border-bottom">
              <h4 class="fw-bold text-slate-900 mb-1 qr-stand-title">
                PRESENSI KEHADIRAN
              </h4>
              <h5 class="fw-bold text-primary mb-1 qr-event-name">
                {{ event.nama_event }}
              </h5>
              <div class="d-flex align-items-center justify-content-center gap-2 text-xs text-slate-600 flex-wrap">
                <span v-if="event.lokasi">
                  <i class="fas fa-map-marker-alt text-danger me-1"></i> {{ event.lokasi }}
                </span>
                <span v-if="event.tgl_mulai">
                  <i class="fas fa-calendar-alt text-primary me-1"></i> {{ event.tgl_mulai }}
                </span>
                <span class="badge" :class="event.target_peserta === 'pegawai' ? 'bg-success text-white' : 'bg-info text-white'">
                  {{ event.target_peserta === 'pegawai' ? 'Internal Pegawai' : 'Terbuka Untuk Umum' }}
                </span>
              </div>
            </div>

            <!-- QR Image (Bisa diklik langsung untuk unduh) -->
            <div
              class="qr-image-wrapper p-2 bg-white rounded-4 border shadow-xs d-inline-block mx-auto mb-2 cursor-pointer position-relative"
              @click="downloadQrCode"
              title="Klik gambar untuk langsung mengunduh QR Code (PNG)"
            >
              <img
                v-if="qrCodeDataUrl"
                :src="qrCodeDataUrl"
                alt="QR Code Presensi Event"
                class="qr-main-img"
              />
              <div v-else class="spinner-border text-primary my-4" role="status"></div>
              <div class="text-xxs text-slate-500 mt-1 no-print fw-medium">
                <i class="fas fa-download text-success me-1"></i> Klik gambar untuk unduh PNG
              </div>
            </div>

            <!-- Petunjuk -->
            <div class="qr-scan-instruction max-w-400 mx-auto mb-3">
              <p class="text-xs fw-semibold text-slate-800 mb-1">
                <i class="fas fa-camera text-primary me-1"></i> Arahkan Kamera Smartphone ke Kode QR di Atas
              </p>
              <small class="text-slate-500 text-xxs d-block">
                Buka aplikasi Kamera atau Pemindai QR di HP Anda untuk langsung membuka formulir presensi.
              </small>
            </div>

            <!-- URL Copy Box -->
            <div class="url-copy-box p-2 rounded-3 bg-slate-50 border d-flex align-items-center justify-content-between gap-2 max-w-500 mx-auto no-print">
              <div class="text-start flex-grow-1 ps-2 overflow-hidden">
                <small class="text-xxs text-slate-500 d-block fw-semibold">Tautan Langsung Presensi:</small>
                <span class="text-xs font-monospace text-slate-800 d-block text-break user-select-all">{{ qrEventUrl }}</span>
              </div>
              <button
                type="button"
                @click="copyQrUrl"
                class="btn btn-sm btn-white text-primary border rounded-3 px-3 py-1-5 mb-0 text-xs fw-semibold flex-shrink-0 shadow-xs"
              >
                <i class="fas" :class="isCopied ? 'fa-check text-success' : 'fa-copy'"></i>
                {{ isCopied ? 'Tersalin!' : 'Salin' }}
              </button>
            </div>
          </div>

          <!-- Footer Actions -->
          <div class="card-footer bg-white border-top py-3 px-4 d-flex justify-content-between align-items-center flex-wrap gap-2 no-print">
            <button
              type="button"
              @click="closeQrModal"
              class="btn btn-light px-3 py-2 rounded-3 text-xs mb-0"
            >
              Tutup
            </button>
            <div class="d-flex gap-2">
              <a
                :href="qrEventUrl"
                target="_blank"
                class="btn btn-outline-primary px-3 py-2 rounded-3 text-xs mb-0 d-inline-flex align-items-center gap-1"
              >
                <i class="fas fa-external-link-alt"></i> Buka Form
              </a>
              <button
                type="button"
                @click="downloadQrCode"
                class="btn btn-outline-success px-3 py-2 rounded-3 text-xs mb-0 d-inline-flex align-items-center gap-1"
              >
                <i class="fas fa-download"></i> Unduh PNG
              </button>
              <button
                type="button"
                @click="printQrStand"
                class="btn btn-primary text-white border-0 px-3 py-2 rounded-3 text-xs fw-semibold mb-0 d-inline-flex align-items-center gap-1 shadow-xs"
              >
                <i class="fas fa-print"></i> Cetak Stand Meja
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.detail-event-container {
  max-width: 1260px;
  margin: 0 auto;
}

.header-title-text {
  font-size: 22px;
  color: #0f172a;
}

.header-subtitle-text {
  font-size: 13px;
  color: #64748b;
}

.search-box {
  position: relative;
  width: 100%;
  max-width: 320px;
}

.search-icon {
  position: absolute;
  top: 50%;
  left: 12px;
  transform: translateY(-50%);
  font-size: 13px;
}

.search-input {
  padding-left: 34px;
  border-radius: 9999px;
  border: 1px solid #cbd5e1;
  font-size: 13px;
}

.search-input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
}

.avatar-cell {
  width: 44px;
  height: 44px;
  cursor: pointer;
}

.avatar-img {
  width: 44px;
  height: 44px;
  object-fit: cover;
  border-radius: 8px;
  transition: transform 0.2s;
}

.avatar-img:hover {
  transform: scale(1.08);
}

.signature-cell {
  width: 70px;
  height: 38px;
  cursor: pointer;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 2px 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.signature-cell:hover {
  border-color: #2563eb;
  background: #eff6ff;
}

.signature-img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.photo-modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(15, 23, 42, 0.85);
  backdrop-filter: blur(6px);
  z-index: 1100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.photo-modal-content {
  position: relative;
  max-width: 600px;
  width: 100%;
  text-align: center;
}

.btn-close-modal {
  position: absolute;
  top: -40px;
  right: 0;
  background: transparent;
  border: none;
  color: white;
  font-size: 24px;
  cursor: pointer;
}

/* Pagination */
.modern-pagination .page-item {
  margin: 0 2px;
}

.modern-pagination .page-link {
  width: 34px;
  height: 34px;
  border-radius: 8px !important;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
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

/* Modal Backdrop & Dialog for QR Stand */
.modal-backdrop-custom {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(15, 23, 42, 0.65);
  backdrop-filter: blur(4px);
  z-index: 1050;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.qr-modal-backdrop {
  align-items: flex-start !important;
  padding: 24px 16px !important;
  overflow-y: auto !important;
}

.qr-modal-dialog {
  max-width: 540px;
  width: 100%;
  margin: auto !important;
}

.qr-modal-header {
  background: #0f172a !important;
  color: #ffffff !important;
  border-bottom: 1px solid #1e293b;
}

.qr-header-title {
  color: #ffffff !important;
}

.qr-header-icon-box {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background-color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
}

.qr-close-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.12);
  border: none;
  color: #ffffff !important;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  transition: all 0.2s ease;
  cursor: pointer;
}

.qr-close-btn:hover {
  background: rgba(255, 255, 255, 0.25);
  transform: rotate(90deg);
}

.qr-modal-body {
  max-height: calc(88vh - 140px);
  overflow-y: auto !important;
}

.qr-main-img {
  width: 190px;
  height: 190px;
  display: block;
}

.cursor-pointer {
  cursor: pointer;
}

.text-break {
  word-break: break-all !important;
}

.user-select-all {
  user-select: all;
}

/* Slate Color Utilities */
.bg-slate-50 {
  background-color: #f8fafc !important;
}
.bg-slate-100 {
  background-color: #f1f5f9 !important;
}
.bg-slate-900 {
  background-color: #0f172a !important;
}
.text-slate-300 {
  color: #cbd5e1 !important;
}
.text-slate-400 {
  color: #94a3b8 !important;
}
.text-slate-500 {
  color: #64748b !important;
}
.text-slate-600 {
  color: #475569 !important;
}
.text-slate-700 {
  color: #334155 !important;
}
.text-slate-800 {
  color: #1e293b !important;
}
.text-slate-900 {
  color: #0f172a !important;
}

.max-w-400 {
  max-width: 400px;
}

.max-w-500 {
  max-width: 500px;
}

.qr-stand-title {
  letter-spacing: 0.5px;
}

.qr-event-name {
  font-size: 1.15rem;
}

/* Print Rules for Stand Meja Registrasi */
@media print {
  @page {
    margin: 10mm;
    size: auto;
  }
  body, html {
    background: #ffffff !important;
    margin: 0 !important;
    padding: 0 !important;
  }
  body * {
    visibility: hidden !important;
  }
  .printable-qr-card,
  .printable-qr-card * {
    visibility: visible !important;
  }
  .printable-qr-card {
    position: fixed !important;
    top: 50% !important;
    left: 50% !important;
    transform: translate(-50%, -50%) !important;
    width: 90% !important;
    max-width: 500px !important;
    padding: 28px !important;
    border: 2px dashed #64748b !important;
    border-radius: 20px !important;
    background: #ffffff !important;
    box-shadow: none !important;
    max-height: none !important;
    overflow: visible !important;
  }
  .no-print,
  .qr-modal-header,
  .card-footer,
  .navbar,
  .sidenav,
  .modal-backdrop-custom:before {
    display: none !important;
    visibility: hidden !important;
  }
  .qr-main-img {
    width: 270px !important;
    height: 270px !important;
  }
}
</style>
