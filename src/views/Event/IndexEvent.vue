<script setup>
/* eslint-disable */
import { ref, onMounted } from "vue";
import api, { getStorageUrl, getApiUrl } from "@/api";
import Swal from "sweetalert2";
import QRCode from "qrcode";

const events = ref([]);
const isLoading = ref(true);

// Modal State
const showModal = ref(false);
const isEditing = ref(false);
const editId = ref(null);
const isSaving = ref(false);

// Form State
const form = ref({
  nama_event: "",
  lokasi: "",
  deskripsi: "",
  tgl_mulai: "",
  tgl_selesai: "",
  status: "nonaktif",
  require_photo: false,
  require_signature: false,
  limit_one_response: true,
  unique_check_by: "no_hp",
  target_peserta: "umum",
  employee_fields: ["nip", "jabatan"],
  fields: []
});

// Load events
const fetchEvents = async () => {
  isLoading.value = true;
  try {
    const res = await api.get("/api/event");
    events.value = res.data?.data || [];
  } catch (err) {
    console.error(err);
    Swal.fire({
      icon: "error",
      title: "Gagal Memuat Data",
      text: "Tidak dapat mengambil daftar event dari server."
    });
  } finally {
    isLoading.value = false;
  }
};

// Preset Templates
const applyPreset = (presetType) => {
  if (presetType === "pameran") {
    form.value.fields = [
      {
        id: "f_" + Date.now() + "_1",
        label: "Kategori Pengunjung",
        type: "select",
        required: true,
        options: ["Siswa SMP", "Alumni SMKN 2", "Orang Tua Siswa", "Masyarakat Umum", "Instansi / Perusahaan"]
      },
      {
        id: "f_" + Date.now() + "_2",
        label: "Asal Sekolah / Instansi / Domisili",
        type: "text",
        required: true,
        placeholder: "Contoh: SMPN 1 Sumedang / PT Telkom"
      },
      {
        id: "f_" + Date.now() + "_3",
        label: "Jurusan yang Diminati",
        type: "select",
        required: false,
        options: [
          "Rekayasa Perangkat Lunak (RPL)",
          "Teknik Komputer & Jaringan (TKJ)",
          "Desain Komunikasi Visual (DKV)",
          "Akuntansi & Keuangan Lembaga (AKL)",
          "Manajemen Perkantoran (MPLB)",
          "Bisnis Daring & Pemasaran (BDP)"
        ]
      },
      {
        id: "f_" + Date.now() + "_4",
        label: "Kesan, Pesan & Saran",
        type: "textarea",
        required: false,
        placeholder: "Tuliskan kesan atau pesan Anda berkunjung ke stand kami..."
      }
    ];
    form.value.require_photo = true;
  } else if (presetType === "perpisahan") {
    form.value.fields = [
      {
        id: "f_" + Date.now() + "_1",
        label: "Status / Hubungan Tamu",
        type: "select",
        required: true,
        options: ["Orang Tua / Wali Siswa", "Keluarga Siswa", "Tamu Undangan Dinas", "Alumni", "Umum"]
      },
      {
        id: "f_" + Date.now() + "_2",
        label: "Nama Siswa yang Diwisuda",
        type: "text",
        required: true,
        placeholder: "Masukkan nama lengkap siswa"
      },
      {
        id: "f_" + Date.now() + "_3",
        label: "Kelas / Jurusan Siswa",
        type: "select",
        required: true,
        options: ["XII RPL", "XII TKJ", "XII DKV", "XII AKL", "XII MPLB", "XII BDP"]
      },
      {
        id: "f_" + Date.now() + "_4",
        label: "Ucapan & Doa untuk Lulusan",
        type: "textarea",
        required: false,
        placeholder: "Tuliskan ucapan selamat atau doa terbaik untuk lulusan..."
      }
    ];
    form.value.require_photo = true;
  } else if (presetType === "jobfair") {
    form.value.fields = [
      {
        id: "f_" + Date.now() + "_1",
        label: "Status Pencari Kerja",
        type: "select",
        required: true,
        options: ["Alumni SMKN 2 Sumedang", "Alumni SMK Lain", "Lulusan Universitas / Diploma", "Umum"]
      },
      {
        id: "f_" + Date.now() + "_2",
        label: "Pendidikan Terakhir & Jurusan",
        type: "text",
        required: true,
        placeholder: "Contoh: SMK Teknik Komputer / S1 Informatika"
      },
      {
        id: "f_" + Date.now() + "_3",
        label: "Perusahaan / Posisi yang Diminati",
        type: "text",
        required: false,
        placeholder: "Nama perusahaan atau posisi kerja yang dilamar"
      }
    ];
    form.value.require_photo = false;
    form.value.target_peserta = "umum";
  } else if (presetType === "internal") {
    // Preset untuk Rapat / Kombel / Seminar Internal Pegawai
    form.value.fields = [];
    form.value.require_photo = false;
    form.value.require_signature = true;
    form.value.target_peserta = "pegawai";
    form.value.employee_fields = ["nip", "jabatan", "no_hp"];
    form.value.limit_one_response = true;
    form.value.unique_check_by = "no_hp";
  }
};

// Flyer State
const bannerFile = ref(null);
const bannerPreviewUrl = ref("");
const bannerFileInput = ref(null);

const getBannerUrl = (bannerPath) => {
  if (!bannerPath) return "";
  return getStorageUrl(`event_banner/${bannerPath}`);
};

const handleBannerChange = (e) => {
  const file = e.target.files[0];
  if (file) {
    if (file.size > 3 * 1024 * 1024) {
      Swal.fire({
        icon: "warning",
        title: "Ukuran Terlalu Besar",
        text: "Maksimal ukuran foto flyer adalah 3MB."
      });
      e.target.value = "";
      return;
    }
    bannerFile.value = file;
    bannerPreviewUrl.value = URL.createObjectURL(file);
  }
};

const clearBanner = () => {
  bannerFile.value = null;
  bannerPreviewUrl.value = "";
  if (bannerFileInput.value) bannerFileInput.value.value = "";
};

// Open Modal for Create
const openCreateModal = () => {
  isEditing.value = false;
  editId.value = null;
  bannerFile.value = null;
  bannerPreviewUrl.value = "";
  if (bannerFileInput.value) bannerFileInput.value.value = "";
  form.value = {
    nama_event: "",
    lokasi: "",
    deskripsi: "",
    tgl_mulai: new Date().toISOString().split("T")[0],
    tgl_selesai: new Date().toISOString().split("T")[0],
    status: "nonaktif",
    require_photo: true,
    require_signature: false,
    limit_one_response: true,
    unique_check_by: "no_hp",
    target_peserta: "umum",
    employee_fields: ["nip", "jabatan", "no_hp"],
    fields: []
  };
  // Default to pameran preset
  applyPreset("pameran");
  showModal.value = true;
};

// Open Modal for Edit
const openEditModal = (event) => {
  isEditing.value = true;
  editId.value = event.id;
  bannerFile.value = null;
  bannerPreviewUrl.value = event.banner ? getBannerUrl(event.banner) : "";
  if (bannerFileInput.value) bannerFileInput.value.value = "";
  form.value = {
    nama_event: event.nama_event || "",
    lokasi: event.lokasi || "",
    deskripsi: event.deskripsi || "",
    tgl_mulai: event.tgl_mulai || "",
    tgl_selesai: event.tgl_selesai || "",
    status: event.status || "nonaktif",
    require_photo: !!event.require_photo,
    require_signature: !!event.require_signature,
    limit_one_response: !!event.limit_one_response,
    unique_check_by: event.unique_check_by || "no_hp",
    target_peserta: event.target_peserta || "umum",
    employee_fields: Array.isArray(event.employee_fields) ? [...event.employee_fields] : ["nip", "jabatan"],
    fields: Array.isArray(event.fields) ? JSON.parse(JSON.stringify(event.fields)) : []
  };
  showModal.value = true;
};

// Close Modal
const closeModal = () => {
  showModal.value = false;
};

// Field Builder Actions
const addField = () => {
  form.value.fields.push({
    id: "f_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
    label: "",
    type: "text",
    required: false,
    placeholder: "",
    options: []
  });
};

const removeField = (index) => {
  form.value.fields.splice(index, 1);
};

// Options helper for select types
const getOptionsText = (field) => {
  return Array.isArray(field.options) ? field.options.join("\n") : "";
};

const setOptionsText = (field, text) => {
  field.options = text
    .split("\n")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
};

// Toggle employee field column selection
const toggleEmpField = (fieldKey) => {
  const idx = form.value.employee_fields.indexOf(fieldKey);
  if (idx >= 0) {
    form.value.employee_fields.splice(idx, 1);
  } else {
    form.value.employee_fields.push(fieldKey);
  }
};

const formatEmpFields = (fields) => {
  if (!Array.isArray(fields) || fields.length === 0) return "Standar";
  const labelMap = { nip: "NIP", jabatan: "Jabatan", no_hp: "No. HP", jenkel: "L/P" };
  return fields.map((k) => labelMap[k] || k).join(", ");
};

// QR Code Modal State & Methods
const showQrModal = ref(false);
const selectedQrEvent = ref(null);
const qrCodeDataUrl = ref("");
const qrEventUrl = ref("");
const isCopied = ref(false);

const openQrModal = async (event) => {
  selectedQrEvent.value = event;
  const origin = window.location.origin;
  qrEventUrl.value = `${origin}/event/${event.id}/presensi`;
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
  selectedQrEvent.value = null;
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
  const slugName = (selectedQrEvent.value?.nama_event || "Event").replace(/[^a-zA-Z0-9]/g, "_");
  link.download = `QRCode_Presensi_${slugName}.png`;
  link.href = qrCodeDataUrl.value;
  link.click();
};

const printQrStand = () => {
  if (!qrCodeDataUrl.value) return;

  const eventName = selectedQrEvent.value?.nama_event || "Event Presensi";
  const eventLoc = selectedQrEvent.value?.lokasi
    ? `<div style="font-size: 15px; color: #dc2626; margin-bottom: 6px; font-weight: 600;">📍 ${selectedQrEvent.value.lokasi}</div>`
    : "";
  const eventDate = selectedQrEvent.value?.tgl_mulai
    ? `<div style="font-size: 15px; color: #2563eb; margin-bottom: 8px; font-weight: 600;">📅 ${selectedQrEvent.value.tgl_mulai}</div>`
    : "";
  const targetBadge =
    selectedQrEvent.value?.target_peserta === "pegawai"
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

// Save Event
const saveEvent = async () => {
  if (!form.value.nama_event.trim()) {
    Swal.fire({
      icon: "warning",
      title: "Nama Event Wajib Diisi",
      text: "Silakan masukkan nama acara / pameran terlebih dahulu."
    });
    return;
  }

  isSaving.value = true;
  try {
    const formData = new FormData();
    formData.append("nama_event", form.value.nama_event);
    if (form.value.lokasi) formData.append("lokasi", form.value.lokasi);
    if (form.value.deskripsi) formData.append("deskripsi", form.value.deskripsi);
    if (form.value.tgl_mulai) formData.append("tgl_mulai", form.value.tgl_mulai);
    if (form.value.tgl_selesai) formData.append("tgl_selesai", form.value.tgl_selesai);
    formData.append("status", form.value.status);
    formData.append("require_photo", form.value.require_photo ? "1" : "0");
    formData.append("require_signature", form.value.require_signature ? "1" : "0");
    formData.append("limit_one_response", form.value.limit_one_response ? "1" : "0");
    formData.append("unique_check_by", form.value.unique_check_by || "no_hp");
    formData.append("target_peserta", form.value.target_peserta || "umum");
    formData.append("employee_fields", JSON.stringify(form.value.employee_fields || ["nip", "jabatan"]));
    formData.append("fields", JSON.stringify(form.value.fields || []));
    if (bannerFile.value) {
      formData.append("banner", bannerFile.value);
    }

    if (isEditing.value) {
      formData.append("_method", "PUT");
      await api.post(`/api/event/${editId.value}`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      Swal.fire({
        icon: "success",
        title: "Berhasil Diperbarui",
        text: "Data event dan foto flyer telah berhasil disimpan.",
        timer: 1800,
        showConfirmButton: false
      });
    } else {
      await api.post("/api/event", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      Swal.fire({
        icon: "success",
        title: "Event Berhasil Dibuat!",
        text: "Event baru dan foto flyer siap digunakan.",
        timer: 1800,
        showConfirmButton: false
      });
    }

    closeModal();
    fetchEvents();
  } catch (err) {
    console.error(err);
    Swal.fire({
      icon: "error",
      title: "Gagal Menyimpan",
      text: err.response?.data?.message || "Terjadi kesalahan pada server."
    });
  } finally {
    isSaving.value = false;
  }
};

// Toggle Active Status
const toggleEventStatus = async (event) => {
  const isActivating = event.status !== "aktif";
  const confirmText = isActivating
    ? `Aktifkan event "${event.nama_event}"? Halaman presensi publik (/) akan otomatis memuat formulir event ini.`
    : `Nonaktifkan event "${event.nama_event}"? Halaman presensi publik (/) akan kembali ke mode buku tamu kedinasan normal.`;

  const result = await Swal.fire({
    title: isActivating ? "Aktifkan Event Ini?" : "Nonaktifkan Event?",
    text: confirmText,
    icon: "question",
    showCancelButton: true,
    confirmButtonText: isActivating ? "Ya, Aktifkan" : "Ya, Nonaktifkan",
    cancelButtonText: "Batal",
    confirmButtonColor: isActivating ? "#2563eb" : "#64748b"
  });

  if (!result.isConfirmed) return;

  try {
    const res = await api.post(`/api/event/${event.id}/toggle-status`);
    Swal.fire({
      icon: "success",
      title: "Status Berubah",
      text: res.data?.message || "Status event berhasil diperbarui.",
      timer: 1500,
      showConfirmButton: false
    });
    fetchEvents();
  } catch (err) {
    Swal.fire({
      icon: "error",
      title: "Gagal Mengubah Status",
      text: "Terjadi kesalahan pada server."
    });
  }
};

// Delete Event
const deleteEvent = async (event) => {
  const result = await Swal.fire({
    title: "Hapus Event Ini?",
    text: `Event "${event.nama_event}" beserta seluruh data presensi tamu di dalamnya akan dihapus permanen.`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Ya, Hapus Permanen",
    cancelButtonText: "Batal",
    confirmButtonColor: "#dc2626"
  });

  if (!result.isConfirmed) return;

  try {
    await api.delete(`/api/event/${event.id}`);
    Swal.fire({
      icon: "success",
      title: "Event Dihapus",
      timer: 1500,
      showConfirmButton: false
    });
    fetchEvents();
  } catch (err) {
    Swal.fire({
      icon: "error",
      title: "Gagal Menghapus",
      text: "Terjadi kesalahan pada server."
    });
  }
};

// Download Excel
const downloadExcel = (event) => {
  window.open(getApiUrl(`/api/event/${event.id}/export-excel`), "_blank");
};

onMounted(() => {
  fetchEvents();
});
</script>

<template>
  <div class="py-4 container-fluid event-management-container">
    <!-- Header Banner Card -->
    <div class="card border-0 shadow-sm mb-4 page-header-card">
      <div class="card-body p-3 p-sm-4 d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3">
        <div>
          <div class="d-flex align-items-center gap-2 mb-1">
            <span class="badge-role-pill">
              <i class="fas fa-calendar-alt text-warning me-1"></i> Khusus Administrator
            </span>
          </div>
          <h4 class="mb-1 fw-bold header-title-text">Kelola Buku Tamu Event & Pameran</h4>
          <p class="header-subtitle-text mb-0">
            Atur formulir khusus untuk acara sekolah, wisuda, pameran inovasi, atau stand promosi di luar sekolah.
          </p>
        </div>

        <div>
          <button
            type="button"
            @click="openCreateModal"
            class="btn-primary-gradient text-white border-0 px-4 py-2 rounded-3 shadow-sm d-flex align-items-center gap-2 fw-semibold text-sm"
          >
            <i class="fas fa-plus"></i> Buat Event Baru
          </button>
        </div>
      </div>
    </div>

    <!-- Active Event Notice -->
    <div
      v-for="ev in events.filter((e) => e.status === 'aktif')"
      :key="'active-' + ev.id"
      class="alert border-0 shadow-sm text-white mb-4 rounded-4 p-3 p-sm-4 active-event-banner"
    >
      <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
        <div class="d-flex align-items-center gap-3">
          <div class="active-icon-box">
            <i class="fas fa-broadcast-tower fa-2x"></i>
          </div>
          <div>
            <div class="d-flex align-items-center gap-2 mb-1">
              <span class="badge bg-white text-primary fw-bold text-xxs">SEDANG AKTIF DI HALAMAN DEPAN</span>
              <span v-if="ev.lokasi" class="text-white-50 text-xs">
                <i class="fas fa-map-marker-alt me-1"></i>{{ ev.lokasi }}
              </span>
            </div>
            <h5 class="text-white fw-bold mb-1">{{ ev.nama_event }}</h5>
            <p class="text-white-50 text-xs mb-0">
              Pengunjung yang membuka link presensi saat ini otomatis diarahkan ke formulir event ini.
            </p>
          </div>
        </div>

        <div class="d-flex align-items-center gap-2">
          <router-link
            :to="{ name: 'Detail.Event.Tamu', params: { id: ev.id } }"
            class="btn btn-light text-primary btn-sm rounded-3 fw-bold px-3 py-2 mb-0 shadow-xs"
          >
            <i class="fas fa-users me-1"></i> Rekap Tamu ({{ ev.tamu_events_count || 0 }})
          </router-link>
          <button
            type="button"
            @click="openQrModal(ev)"
            class="btn btn-white text-primary btn-sm rounded-3 fw-bold px-3 py-2 mb-0 shadow-xs"
            title="Tampilkan & Cetak QR Code Meja Registrasi"
          >
            <i class="fas fa-qrcode me-1"></i> QR Code Stand
          </button>
          <button
            type="button"
            @click="toggleEventStatus(ev)"
            class="btn btn-outline-light btn-sm rounded-3 fw-bold px-3 py-2 mb-0"
          >
            <i class="fas fa-power-off me-1"></i> Nonaktifkan
          </button>
        </div>
      </div>
    </div>

    <!-- Event List Card -->
    <div class="card border-0 shadow-sm rounded-4 overflow-hidden">
      <div class="card-header bg-white border-0 pt-4 pb-2 px-4 d-flex justify-content-between align-items-center">
        <div>
          <h6 class="fw-bold text-slate-800 mb-0">Daftar Event & Acara Sekolah</h6>
          <small class="text-slate-400 text-xs">Hanya 1 event yang dapat aktif dalam satu waktu</small>
        </div>
        <button @click="fetchEvents" class="btn btn-sm btn-link text-slate-500 p-0 text-decoration-none">
          <i class="fas fa-sync-alt me-1"></i> Segarkan
        </button>
      </div>

      <div class="card-body p-0">
        <!-- Loading State -->
        <div v-if="isLoading" class="p-5 text-center">
          <div class="spinner-border text-primary mb-2" role="status"></div>
          <p class="text-slate-400 text-xs mb-0">Memuat data event...</p>
        </div>

        <!-- Empty State -->
        <div v-else-if="events.length === 0" class="p-5 text-center">
          <div class="empty-icon-circle mx-auto mb-3">
            <i class="fas fa-calendar-times fa-2x text-slate-400"></i>
          </div>
          <h6 class="fw-bold text-slate-700 mb-1">Belum Ada Event Dibuat</h6>
          <p class="text-slate-400 text-xs mb-3">
            Klik tombol "Buat Event Baru" untuk menyiapkan formulir presensi pameran atau wisuda.
          </p>
          <button @click="openCreateModal" class="btn btn-primary btn-sm rounded-3 px-3">
            <i class="fas fa-plus me-1"></i> Buat Event Pertama
          </button>
        </div>

        <!-- Table View -->
        <div v-else class="table-responsive">
          <table class="table align-items-center mb-0 modern-table">
            <thead>
              <tr>
                <th class="text-uppercase text-slate-400 text-xxs font-weight-bolder ps-4">Event & Lokasi</th>
                <th class="text-uppercase text-slate-400 text-xxs font-weight-bolder ps-3">Pertanyaan Form</th>
                <th class="text-center text-uppercase text-slate-400 text-xxs font-weight-bolder">Status Presensi</th>
                <th class="text-center text-uppercase text-slate-400 text-xxs font-weight-bolder">Pengunjung</th>
                <th class="text-end text-uppercase text-slate-400 text-xxs font-weight-bolder pe-4">Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in events" :key="item.id" :class="{ 'row-active-event': item.status === 'aktif' }">
                <!-- Nama Event & Lokasi -->
                <td class="ps-4">
                  <div class="d-flex align-items-center gap-3">
                    <!-- Foto Flyer Event atau Placeholder (Pengganti Kotak Biru) -->
                    <div class="event-flyer-wrapper flex-shrink-0">
                      <img
                        v-if="item.banner"
                        :src="getBannerUrl(item.banner)"
                        class="event-flyer-img"
                        alt="Flyer Event"
                        title="Foto Flyer Event"
                      />
                      <div
                        v-else
                        class="event-avatar-box"
                        :class="item.status === 'aktif' ? 'bg-primary text-white' : 'bg-slate-100 text-slate-400'"
                        title="Belum ada foto flyer event"
                      >
                        <i class="fas fa-image"></i>
                      </div>
                    </div>
                    <div>
                      <h6 class="mb-0 text-sm fw-bold text-slate-800">{{ item.nama_event }}</h6>
                      <div class="d-flex align-items-center gap-2 mt-1 flex-wrap">
                        <small v-if="item.lokasi" class="text-slate-500 text-xxs">
                          <i class="fas fa-map-marker-alt text-danger me-1"></i>{{ item.lokasi }}
                        </small>
                        <small v-if="item.require_photo" class="badge-feature-pill">
                          <i class="fas fa-camera me-1"></i> Foto Aktif
                        </small>
                        <small v-if="item.require_signature" class="badge-feature-pill text-purple bg-purple-subtle">
                          <i class="fas fa-signature me-1"></i> TTD Wajib
                        </small>
                        <small v-if="item.target_peserta === 'pegawai'" class="badge-feature-pill text-success bg-green-subtle" :title="'Kolom laporan aktif: ' + formatEmpFields(item.employee_fields)">
                          <i class="fas fa-id-badge me-1"></i> Pegawai ({{ formatEmpFields(item.employee_fields) }})
                        </small>
                        <small v-if="item.limit_one_response" class="badge-feature-pill text-primary bg-blue-subtle" :title="'Dibatasi 1x presensi via ' + (item.unique_check_by === 'email' ? 'Email' : (item.unique_check_by === 'device' ? 'Perangkat' : 'No. HP'))">
                          <i class="fas fa-shield-alt me-1"></i> 1x Presensi ({{ item.unique_check_by === 'email' ? 'Email' : (item.unique_check_by === 'device' ? 'Perangkat' : 'HP') }})
                        </small>
                      </div>
                    </div>
                  </div>
                </td>

                <!-- Jumlah Pertanyaan Form -->
                <td class="ps-3">
                  <div class="text-xs text-slate-700 fw-semibold">
                    {{ (item.fields || []).length }} Pertanyaan Khusus
                  </div>
                  <div class="text-xxs text-slate-400 mt-0">
                    {{ (item.fields || []).map((f) => f.label).slice(0, 2).join(", ") }}
                    <span v-if="(item.fields || []).length > 2">...</span>
                  </div>
                </td>

                <!-- Status Aktif / Nonaktif Toggle -->
                <td class="text-center">
                  <button
                    type="button"
                    @click="toggleEventStatus(item)"
                    class="btn btn-sm rounded-pill px-3 py-1 mb-0 border-0 fw-bold text-xs"
                    :class="item.status === 'aktif' ? 'btn-success-soft text-success' : 'btn-slate-soft text-slate-500'"
                  >
                    <span class="status-dot" :class="item.status === 'aktif' ? 'bg-success' : 'bg-slate-400'"></span>
                    {{ item.status === 'aktif' ? 'Aktif (Berjalan)' : 'Nonaktif' }}
                  </button>
                </td>

                <!-- Pengunjung Count -->
                <td class="text-center">
                  <router-link
                    :to="{ name: 'Detail.Event.Tamu', params: { id: item.id } }"
                    class="badge bg-blue-light text-primary text-xs px-3 py-2 rounded-pill text-decoration-none fw-bold"
                  >
                    <i class="fas fa-user-check me-1"></i> {{ item.tamu_events_count || 0 }} Tamu
                  </router-link>
                </td>

                <!-- Aksi -->
                <td class="text-end pe-4">
                  <div class="btn-group gap-1">
                    <!-- Rekap Tamu -->
                    <router-link
                      :to="{ name: 'Detail.Event.Tamu', params: { id: item.id } }"
                      class="btn btn-sm btn-outline-primary px-3 py-1 rounded-3 text-xs mb-0"
                      title="Lihat Daftar Tamu Event"
                    >
                      <i class="fas fa-list me-1"></i> Tamu
                    </router-link>

                    <!-- QR Code Event -->
                    <button
                      type="button"
                      @click="openQrModal(item)"
                      class="btn btn-sm btn-outline-info px-2 py-1 rounded-3 text-xs mb-0 d-inline-flex align-items-center gap-1"
                      title="Lihat & Cetak QR Code Meja Presensi"
                    >
                      <i class="fas fa-qrcode"></i> QR
                    </button>

                    <!-- Export Excel -->
                    <button
                      type="button"
                      @click="downloadExcel(item)"
                      class="btn btn-sm btn-outline-success px-3 py-1 rounded-3 text-xs mb-0"
                      title="Unduh Rekap Excel"
                    >
                      <i class="fas fa-file-excel text-success me-1"></i> Excel
                    </button>

                    <!-- Edit Event -->
                    <button
                      type="button"
                      @click="openEditModal(item)"
                      class="btn btn-sm btn-outline-secondary px-2 py-1 rounded-3 text-xs mb-0"
                      title="Edit Event & Formulir"
                    >
                      <i class="fas fa-edit"></i>
                    </button>

                    <!-- Hapus -->
                    <button
                      type="button"
                      @click="deleteEvent(item)"
                      class="btn btn-sm btn-outline-danger px-2 py-1 rounded-3 text-xs mb-0"
                      title="Hapus Event"
                    >
                      <i class="fas fa-trash-alt"></i>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Modal Create / Edit Event & Dynamic Form Builder -->
    <div v-if="showModal" class="modal-backdrop-custom">
      <div class="modal-dialog-custom">
        <div class="card border-0 shadow-lg rounded-4 overflow-hidden">
          <!-- Modal Header -->
          <div class="card-header bg-slate-900 text-white p-3 p-sm-4 d-flex justify-content-between align-items-center">
            <div>
              <h5 class="mb-1 text-white fw-bold">
                {{ isEditing ? "Ubah Event & Formulir" : "Buat Event Baru" }}
              </h5>
              <small class="text-white-50 text-xs">
                Tentukan identitas acara dan atur pertanyaan khusus yang wajib diisi pengunjung.
              </small>
            </div>
            <button @click="closeModal" class="btn-close btn-close-white p-2" aria-label="Close"></button>
          </div>

          <!-- Modal Body -->
          <div class="card-body p-3 p-sm-4 modal-scrollable-body">
            <!-- Template Preset Shortcut -->
            <div class="preset-banner p-3 rounded-3 mb-4">
              <div class="d-flex align-items-center justify-content-between flex-wrap gap-2">
                <span class="text-xs fw-bold text-slate-700">
                  <i class="fas fa-magic text-primary me-1"></i> Pilih Template Cepat:
                </span>
                <div class="d-flex gap-2 flex-wrap">
                  <button
                    type="button"
                    @click="applyPreset('pameran')"
                    class="btn btn-xs btn-outline-primary mb-0 rounded-pill"
                  >
                    🎨 Pameran / Expo
                  </button>
                  <button
                    type="button"
                    @click="applyPreset('perpisahan')"
                    class="btn btn-xs btn-outline-info mb-0 rounded-pill"
                  >
                    🎓 Wisuda / Perpisahan
                  </button>
                  <button
                    type="button"
                    @click="applyPreset('jobfair')"
                    class="btn btn-xs btn-outline-warning mb-0 rounded-pill"
                  >
                    💼 Job Fair / BKK
                  </button>
                  <button
                    type="button"
                    @click="applyPreset('internal')"
                    class="btn btn-xs btn-outline-success mb-0 rounded-pill"
                  >
                    🏫 Rapat / Kombel / Seminar
                  </button>
                </div>
              </div>
            </div>

            <!-- Identitas Event -->
            <div class="row g-3 mb-4">
              <div class="col-12">
                <label class="form-label text-xs fw-bold text-slate-700">
                  Nama Event / Acara <span class="text-danger">*</span>
                </label>
                <input
                  type="text"
                  v-model="form.nama_event"
                  class="form-control modern-input"
                  placeholder="Contoh: Pameran Karya Siswa SMKN 2 Sumedang 2026"
                />
              </div>

              <div class="col-md-6">
                <label class="form-label text-xs fw-bold text-slate-700">Lokasi / Tempat Acara</label>
                <input
                  type="text"
                  v-model="form.lokasi"
                  class="form-control modern-input"
                  placeholder="Contoh: Stand Mall Asia Plaza / Lapangan Sekolah"
                />
              </div>

              <div class="col-md-6">
                <label class="form-label text-xs fw-bold text-slate-700">Kamera Selfie Pengunjung</label>
                <div class="form-check form-switch mt-2">
                  <input
                    class="form-check-input"
                    type="checkbox"
                    id="requirePhotoSwitch"
                    v-model="form.require_photo"
                  />
                  <label class="form-check-label text-xs text-slate-700 fw-semibold" for="requirePhotoSwitch">
                    {{ form.require_photo ? "Aktifkan Fitur Selfie Tamu" : "Tanpa Foto Selfie (Hanya Form Teks)" }}
                  </label>
                </div>
              </div>

              <!-- Toggle Tanda Tangan Digital (TTD) -->
              <div class="col-md-6">
                <label class="form-label text-xs fw-bold text-slate-700">
                  <i class="fas fa-signature text-purple me-1"></i> Tanda Tangan Digital (TTD)
                </label>
                <div class="form-check form-switch mt-2">
                  <input
                    class="form-check-input"
                    type="checkbox"
                    id="requireSignatureSwitch"
                    v-model="form.require_signature"
                  />
                  <label class="form-check-label text-xs text-slate-700 fw-semibold" for="requireSignatureSwitch">
                    {{ form.require_signature ? "Wajib Tanda Tangan (Seminar/Rapat)" : "Tanpa Tanda Tangan" }}
                  </label>
                </div>
              </div>

              <!-- Target Peserta (Umum / Pegawai Internal) -->
              <div class="col-12">
                <div class="p-3 rounded-3 border" :class="form.target_peserta === 'pegawai' ? 'bg-green-light border-success' : 'bg-slate-50'">
                  <div class="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-2">
                    <div class="d-flex align-items-center gap-2">
                      <i class="fas fa-users" :class="form.target_peserta === 'pegawai' ? 'text-success' : 'text-slate-500'"></i>
                      <span class="text-xs fw-bold text-slate-800">Target Peserta Event</span>
                      <span v-if="form.target_peserta === 'pegawai'" class="badge bg-success text-white text-xxs rounded-pill">Pegawai Internal</span>
                    </div>
                  </div>
                  <div class="d-flex gap-3">
                    <div
                      class="target-choice-card flex-fill p-2-5 rounded-3 border cursor-pointer"
                      :class="{ 'selected-green': form.target_peserta === 'umum' }"
                      @click="form.target_peserta = 'umum'"
                    >
                      <div class="d-flex align-items-center gap-2">
                        <div class="target-radio-dot" :class="{ 'active-radio': form.target_peserta === 'umum' }"></div>
                        <div>
                          <strong class="d-block text-xs text-slate-800">👥 Tamu Umum / Pengunjung</strong>
                          <small class="text-xxs text-slate-500">Pameran, wisuda, job fair, dan acara publik lainnya.</small>
                        </div>
                      </div>
                    </div>
                    <div
                      class="target-choice-card flex-fill p-2-5 rounded-3 border cursor-pointer"
                      :class="{ 'selected-green': form.target_peserta === 'pegawai' }"
                      @click="form.target_peserta = 'pegawai'"
                    >
                      <div class="d-flex align-items-center gap-2">
                        <div class="target-radio-dot" :class="{ 'active-radio': form.target_peserta === 'pegawai' }"></div>
                        <div>
                          <strong class="d-block text-xs text-slate-800">🏫 Pegawai Sekolah</strong>
                          <small class="text-xxs text-slate-500">Rapat, kombel, IHT, seminar, atau kegiatan internal.</small>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Opsi Kolom Pegawai (muncul jika target = pegawai) -->
                  <div v-if="form.target_peserta === 'pegawai'" class="mt-3 pt-3 border-top">
                    <label class="form-label text-xs fw-bold text-slate-700 mb-2 d-block">
                      <i class="fas fa-table me-1 text-success"></i> Kolom Laporan yang Ditampilkan:
                    </label>
                    <div class="row g-2">
                      <div class="col-6 col-md-3">
                        <div class="emp-col-check-card p-2 rounded-3 border d-flex align-items-center gap-2 cursor-pointer"
                          :class="{ 'emp-col-selected': form.employee_fields.includes('nip') }"
                          @click="toggleEmpField('nip')"
                        >
                          <div class="emp-col-dot" :class="{ 'emp-col-dot-active': form.employee_fields.includes('nip') }"></div>
                          <span class="text-xs fw-semibold text-slate-700">🪪 NIP</span>
                        </div>
                      </div>
                      <div class="col-6 col-md-3">
                        <div class="emp-col-check-card p-2 rounded-3 border d-flex align-items-center gap-2 cursor-pointer"
                          :class="{ 'emp-col-selected': form.employee_fields.includes('jabatan') }"
                          @click="toggleEmpField('jabatan')"
                        >
                          <div class="emp-col-dot" :class="{ 'emp-col-dot-active': form.employee_fields.includes('jabatan') }"></div>
                          <span class="text-xs fw-semibold text-slate-700">💼 Jabatan</span>
                        </div>
                      </div>
                      <div class="col-6 col-md-3">
                        <div class="emp-col-check-card p-2 rounded-3 border d-flex align-items-center gap-2 cursor-pointer"
                          :class="{ 'emp-col-selected': form.employee_fields.includes('no_hp') }"
                          @click="toggleEmpField('no_hp')"
                        >
                          <div class="emp-col-dot" :class="{ 'emp-col-dot-active': form.employee_fields.includes('no_hp') }"></div>
                          <span class="text-xs fw-semibold text-slate-700">📱 No. HP</span>
                        </div>
                      </div>
                      <div class="col-6 col-md-3">
                        <div class="emp-col-check-card p-2 rounded-3 border d-flex align-items-center gap-2 cursor-pointer"
                          :class="{ 'emp-col-selected': form.employee_fields.includes('jenkel') }"
                          @click="toggleEmpField('jenkel')"
                        >
                          <div class="emp-col-dot" :class="{ 'emp-col-dot-active': form.employee_fields.includes('jenkel') }"></div>
                          <span class="text-xs fw-semibold text-slate-700">⚧ L/P</span>
                        </div>
                      </div>
                    </div>
                    <small class="text-slate-400 text-xxs mt-2 d-block">
                      Kolom <strong>NO</strong> dan <strong>NAMA PEGAWAI</strong> selalu tampil di laporan.
                      Tanda Tangan muncul jika fitur TTD diaktifkan.
                    </small>
                  </div>
                </div>
              </div>

              <!-- Upload Foto / Flyer Acara -->
              <div class="col-12">
                <label class="form-label text-xs fw-bold text-slate-700 d-flex justify-content-between align-items-center mb-1">
                  <span>Foto Flyer / Banner Acara (Pengganti Ikon di Tabel)</span>
                  <small class="text-slate-400 fw-normal">Format: JPG, PNG, WebP (Maks 3MB)</small>
                </label>
                <div class="p-2-5 rounded-3 border bg-white d-flex align-items-center gap-3">
                  <!-- Thumbnail Preview -->
                  <div class="banner-preview-box flex-shrink-0">
                    <img
                      v-if="bannerPreviewUrl"
                      :src="bannerPreviewUrl"
                      class="banner-preview-img"
                      alt="Preview Flyer"
                    />
                    <div v-else class="banner-placeholder-box">
                      <i class="fas fa-image text-slate-300 fs-4"></i>
                    </div>
                  </div>

                  <!-- File Input & Actions -->
                  <div class="flex-grow-1">
                    <input
                      type="file"
                      ref="bannerFileInput"
                      class="form-control modern-input form-control-sm"
                      accept="image/*"
                      @change="handleBannerChange"
                    />
                    <div class="d-flex align-items-center justify-content-between mt-1">
                      <small class="text-xxs text-slate-500">
                        Foto flyer akan ditampilkan di tabel event dan formulir presensi pengunjung.
                      </small>
                      <button
                        v-if="bannerPreviewUrl"
                        type="button"
                        class="btn btn-link text-danger p-0 text-xxs font-weight-bold text-decoration-none"
                        @click="clearBanner"
                      >
                        <i class="fas fa-trash-alt me-1"></i> Hapus Foto
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Pengaturan Pembatasan Presensi (Anti Duplikasi Data) -->
              <div class="col-12">
                <div class="p-3 rounded-3 border bg-slate-50 shadow-xs">
                  <div class="d-flex justify-content-between align-items-center flex-wrap gap-2">
                    <div>
                      <div class="d-flex align-items-center gap-2">
                        <i class="fas fa-user-shield text-primary"></i>
                        <span class="text-xs fw-bold text-slate-800">Batasi 1 Kali Presensi per Pengunjung</span>
                        <span class="badge bg-primary text-white text-xxs font-weight-bold px-2 py-0-5 rounded-pill">Anti Duplikat</span>
                      </div>
                      <p class="text-slate-500 text-xxs mb-0 mt-1">
                        Cegah pengunjung mengisi formulir lebih dari satu kali agar data rekap kehadiran akurat.
                      </p>
                    </div>

                    <div class="form-check form-switch m-0">
                      <input
                        class="form-check-input"
                        type="checkbox"
                        id="limitOneResponseSwitch"
                        v-model="form.limit_one_response"
                      />
                    </div>
                  </div>

                  <!-- Sub-pilihan Metode Pengecekan jika toggle aktif -->
                  <div v-if="form.limit_one_response" class="mt-3 pt-3 border-top">
                    <label class="form-label text-xs fw-bold text-slate-700 mb-2 d-block">
                      Kunci Identifikasi Keunikan Pengunjung:
                    </label>
                    <div class="row g-2">
                      <div class="col-md-4">
                        <div
                          class="unique-check-card p-2-5 rounded-3 border d-flex align-items-start gap-2 cursor-pointer h-100"
                          :class="{ 'selected': form.unique_check_by === 'no_hp' }"
                          @click="form.unique_check_by = 'no_hp'"
                        >
                          <div class="check-box-indicator flex-shrink-0 mt-0.5" :class="{ 'checked': form.unique_check_by === 'no_hp' }">
                            <i v-if="form.unique_check_by === 'no_hp'" class="fas fa-check"></i>
                          </div>
                          <div>
                            <strong class="d-block text-xs text-slate-800">Nomor WhatsApp / HP</strong>
                            <small class="text-xxs text-slate-500 d-block mt-1">Direkomendasikan. Aman untuk tablet bersama & HP pribadi.</small>
                          </div>
                        </div>
                      </div>

                      <div class="col-md-4">
                        <div
                          class="unique-check-card p-2-5 rounded-3 border d-flex align-items-start gap-2 cursor-pointer h-100"
                          :class="{ 'selected': form.unique_check_by === 'email' }"
                          @click="form.unique_check_by = 'email'"
                        >
                          <div class="check-box-indicator flex-shrink-0 mt-0.5" :class="{ 'checked': form.unique_check_by === 'email' }">
                            <i v-if="form.unique_check_by === 'email'" class="fas fa-check"></i>
                          </div>
                          <div>
                            <strong class="d-block text-xs text-slate-800">Alamat Email</strong>
                            <small class="text-xxs text-slate-500 d-block mt-1">Cocok jika form acara meminta isian email.</small>
                          </div>
                        </div>
                      </div>

                      <div class="col-md-4">
                        <div
                          class="unique-check-card p-2-5 rounded-3 border d-flex align-items-start gap-2 cursor-pointer h-100"
                          :class="{ 'selected': form.unique_check_by === 'device' }"
                          @click="form.unique_check_by = 'device'"
                        >
                          <div class="check-box-indicator flex-shrink-0 mt-0.5" :class="{ 'checked': form.unique_check_by === 'device' }">
                            <i v-if="form.unique_check_by === 'device'" class="fas fa-check"></i>
                          </div>
                          <div>
                            <strong class="d-block text-xs text-slate-800">Perangkat / Browser Ini</strong>
                            <small class="text-xxs text-warning-dark d-block mt-1">⚠️ Khusus jika tamu scan QR di HP pribadi (bukan tablet bersama).</small>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="col-12">
                <label class="form-label text-xs fw-bold text-slate-700">Deskripsi / Keterangan Event (Opsional)</label>
                <textarea
                  v-model="form.deskripsi"
                  class="form-control modern-input"
                  rows="2"
                  placeholder="Catatan tambahan seputar acara..."
                ></textarea>
              </div>
            </div>

            <!-- Dynamic Form Field Builder Section -->
            <div class="builder-section border rounded-4 p-3 p-sm-4 bg-slate-50">
              <div class="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <h6 class="fw-bold text-slate-800 mb-0">
                    <i class="fas fa-sliders-h text-primary me-1"></i> Form Isian Dinamis untuk Pengunjung
                  </h6>
                  <small class="text-slate-500 text-xs">
                    (Nama Lengkap & Nomor WhatsApp sudah otomatis disediakan di form utama)
                  </small>
                </div>
                <button
                  type="button"
                  @click="addField"
                  class="btn btn-sm btn-primary mb-0 rounded-3 d-flex align-items-center gap-1 text-xs"
                >
                  <i class="fas fa-plus"></i> Tambah Pertanyaan
                </button>
              </div>

              <!-- Empty Fields Notice -->
              <div v-if="form.fields.length === 0" class="text-center p-4 bg-white rounded-3 border border-dashed">
                <p class="text-slate-400 text-xs mb-2">Belum ada pertanyaan khusus untuk event ini.</p>
                <button type="button" @click="addField" class="btn btn-xs btn-outline-primary mb-0">
                  + Tambah Kolom Isian
                </button>
              </div>

              <!-- List of Custom Fields -->
              <div v-else class="d-flex flex-column gap-3">
                <div
                  v-for="(field, index) in form.fields"
                  :key="field.id"
                  class="card border border-slate-200 shadow-none rounded-3 p-3 bg-white"
                >
                  <div class="d-flex justify-content-between align-items-center mb-2">
                    <span class="badge bg-slate-100 text-slate-700 text-xxs fw-bold">
                      Pertanyaan #{{ index + 1 }}
                    </span>
                    <button
                      type="button"
                      @click="removeField(index)"
                      class="btn btn-link text-danger p-0 m-0 text-xs text-decoration-none"
                    >
                      <i class="fas fa-trash-alt me-1"></i> Hapus
                    </button>
                  </div>

                  <div class="row g-2">
                    <!-- Label Pertanyaan -->
                    <div class="col-md-6">
                      <label class="form-label text-xxs fw-bold text-slate-600 mb-1">Judul Pertanyaan / Kolom</label>
                      <input
                        type="text"
                        v-model="field.label"
                        class="form-control form-control-sm modern-input"
                        placeholder="Contoh: Asal Sekolah / Minat Jurusan"
                      />
                    </div>

                    <!-- Tipe Input -->
                    <div class="col-md-3">
                      <label class="form-label text-xxs fw-bold text-slate-600 mb-1">Tipe Isian</label>
                      <select v-model="field.type" class="form-select form-select-sm modern-input">
                        <option value="text">Teks Singkat</option>
                        <option value="select">Pilihan Dropdown</option>
                        <option value="textarea">Teks Panjang (Kesan/Pesan)</option>
                      </select>
                    </div>

                    <!-- Wajib Diisi -->
                    <div class="col-md-3 d-flex align-items-center pt-3">
                      <div class="form-check">
                        <input
                          class="form-check-input"
                          type="checkbox"
                          :id="'req-' + index"
                          v-model="field.required"
                        />
                        <label class="form-check-label text-xs text-slate-700" :for="'req-' + index">
                          Wajib Diisi
                        </label>
                      </div>
                    </div>

                    <!-- Opsi Dropdown jika tipe = select -->
                    <div v-if="field.type === 'select'" class="col-12 mt-2">
                      <label class="form-label text-xxs fw-bold text-slate-600 mb-1">
                        Pilihan Jawaban (Tulis satu pilihan per baris):
                      </label>
                      <textarea
                        class="form-control form-control-sm modern-input"
                        rows="3"
                        :value="getOptionsText(field)"
                        @input="setOptionsText(field, $event.target.value)"
                        placeholder="Siswa SMP&#10;Alumni&#10;Orang Tua&#10;Umum"
                      ></textarea>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Modal Footer -->
          <div class="card-footer bg-white border-0 p-3 p-sm-4 d-flex justify-content-end align-items-center gap-2">
            <button type="button" @click="closeModal" class="btn btn-light px-4 py-2 rounded-3 text-sm mb-0">
              Batal
            </button>
            <button
              type="button"
              @click="saveEvent"
              :disabled="isSaving"
              class="btn-primary-gradient text-white border-0 px-4 py-2 rounded-3 fw-semibold text-sm mb-0 d-flex align-items-center gap-2"
            >
              <span v-if="isSaving" class="spinner-border spinner-border-sm" role="status"></span>
              <i v-if="!isSaving" class="fas fa-save"></i>
              {{ isSaving ? "Menyimpan..." : isEditing ? "Simpan Perubahan" : "Simpan & Buat Event" }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal QR Code Event & Stand Meja Registrasi -->
    <div v-if="showQrModal && selectedQrEvent" class="modal-backdrop-custom qr-modal-backdrop" @click="closeQrModal">
      <div class="modal-dialog-custom qr-modal-dialog" @click.stop>
        <div class="card border-0 shadow-lg rounded-4 overflow-hidden bg-white">
          <!-- Modal Header (Sembunyi saat cetak) -->
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

          <!-- Printable Stand Display Card -->
          <div class="card-body p-3 p-sm-4 text-center printable-qr-card qr-modal-body">
            <!-- Header Stand Meja Registrasi -->
            <div class="qr-stand-header mb-2 pb-2 border-bottom">
              <h4 class="fw-bold text-slate-900 mb-1 qr-stand-title">
                PRESENSI KEHADIRAN
              </h4>
              <h5 class="fw-bold text-primary mb-1 qr-event-name">
                {{ selectedQrEvent.nama_event }}
              </h5>
              <div class="d-flex align-items-center justify-content-center gap-2 text-xs text-slate-600 flex-wrap">
                <span v-if="selectedQrEvent.lokasi">
                  <i class="fas fa-map-marker-alt text-danger me-1"></i> {{ selectedQrEvent.lokasi }}
                </span>
                <span v-if="selectedQrEvent.tgl_mulai">
                  <i class="fas fa-calendar-alt text-primary me-1"></i> {{ selectedQrEvent.tgl_mulai }}
                </span>
                <span class="badge" :class="selectedQrEvent.target_peserta === 'pegawai' ? 'bg-success text-white' : 'bg-info text-white'">
                  {{ selectedQrEvent.target_peserta === 'pegawai' ? 'Internal Pegawai' : 'Terbuka Untuk Umum' }}
                </span>
              </div>
            </div>

            <!-- QR Code Image Box (Bisa Diklik Langsung untuk Download) -->
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

            <!-- Petunjuk Pengunjung -->
            <div class="qr-scan-instruction max-w-400 mx-auto mb-3">
              <p class="text-xs fw-semibold text-slate-800 mb-1">
                <i class="fas fa-camera text-primary me-1"></i> Arahkan Kamera Smartphone ke Kode QR di Atas
              </p>
              <small class="text-slate-500 text-xxs d-block">
                Buka aplikasi Kamera atau Pemindai QR di HP Anda untuk langsung membuka formulir presensi.
              </small>
            </div>

            <!-- Tautan Langsung / Copy Link Box (Sembunyi saat cetak) -->
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

          <!-- Modal Actions Footer (Sembunyi saat cetak) -->
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
.event-management-container {
  max-width: 1260px;
  margin: 0 auto;
}

.badge-role-pill {
  display: inline-flex;
  align-items: center;
  font-size: 11px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 9999px;
  background: #fef3c7;
  color: #92400e;
}

.header-title-text {
  font-size: 22px;
  color: #0f172a;
}

.header-subtitle-text {
  font-size: 13px;
  color: #64748b;
}

.active-event-banner {
  background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%);
}

.active-icon-box {
  width: 54px;
  height: 54px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
}

.event-avatar-box {
  width: 42px;
  height: 42px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
}

.btn-primary-gradient {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  transition: all 0.2s;
}

.btn-primary-gradient:hover {
  background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%);
  transform: translateY(-1px);
}

.badge-feature-pill {
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 9999px;
  background: #e0e7ff;
  color: #3730a3;
  font-weight: 600;
}

.bg-purple-subtle {
  background: #f3e8ff !important;
}

.text-purple {
  color: #7e22ce !important;
}

.btn-success-soft {
  background: #dcfce7;
}

.btn-slate-soft {
  background: #f1f5f9;
}

.status-dot {
  display: inline-block;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  margin-right: 4px;
}

.preset-banner {
  background: #eff6ff;
  border: 1px dashed #bfdbfe;
}

/* Modal Custom Styling */
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
  padding: 16px;
}

.modal-dialog-custom {
  max-width: 780px;
  width: 100%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

.modal-scrollable-body {
  overflow-y: auto;
  max-height: calc(90vh - 160px);
}

.modern-input {
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 13px;
  padding: 9px 13px;
}

.modern-input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
}

/* Card Selection with Checkmark */
.unique-check-card {
  background: #ffffff;
  border: 1.5px solid #e2e8f0 !important;
  transition: all 0.2s ease-in-out;
  user-select: none;
}

.unique-check-card:hover {
  border-color: #cbd5e1 !important;
  background-color: #f8fafc;
}

.unique-check-card.selected {
  background-color: #eff6ff !important;
  border-color: #2563eb !important;
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.12);
}

.check-box-indicator {
  width: 20px;
  height: 20px;
  min-width: 20px;
  min-height: 20px;
  border-radius: 6px;
  border: 2px solid #cbd5e1;
  background-color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  color: transparent;
  font-size: 11px;
  transition: all 0.2s ease;
}

.check-box-indicator.checked {
  background-color: #2563eb;
  border-color: #2563eb;
  color: #ffffff;
  box-shadow: 0 2px 4px rgba(37, 99, 235, 0.3);
}

/* Flyer Thumbnail in Table */
.event-flyer-wrapper {
  width: 46px;
  height: 46px;
  min-width: 46px;
  min-height: 46px;
  border-radius: 12px;
  overflow: hidden;
  background-color: #f1f5f9;
  border: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.event-flyer-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.25s ease;
}

.event-flyer-img:hover {
  transform: scale(1.1);
}

/* Flyer Preview in Modal */
.banner-preview-box {
  width: 58px;
  height: 58px;
  border-radius: 12px;
  overflow: hidden;
  border: 1.5px dashed #cbd5e1;
  background: #f8fafc;
  display: flex;
  align-items: center;
  justify-content: center;
}

.banner-preview-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.banner-placeholder-box {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Target Peserta Selector */
.target-choice-card {
  background: #ffffff;
  border: 1.5px solid #e2e8f0 !important;
  transition: all 0.2s ease;
  cursor: pointer;
  user-select: none;
}

.target-choice-card:hover {
  border-color: #86efac !important;
  background-color: #f0fdf4;
}

.target-choice-card.selected-green {
  background-color: #f0fdf4 !important;
  border-color: #16a34a !important;
  box-shadow: 0 2px 8px rgba(22, 163, 74, 0.12);
}

.target-radio-dot {
  width: 18px;
  height: 18px;
  min-width: 18px;
  border-radius: 50%;
  border: 2px solid #cbd5e1;
  background: #fff;
  transition: all 0.2s;
  flex-shrink: 0;
}

.target-radio-dot.active-radio {
  background: #16a34a;
  border-color: #16a34a;
  box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.18);
}

.bg-green-light {
  background-color: #f0fdf4 !important;
}

.bg-green-subtle {
  background: #dcfce7 !important;
}

/* Employee Column Selector Cards */
.emp-col-check-card {
  background: #fff;
  border: 1.5px solid #e2e8f0 !important;
  cursor: pointer;
  user-select: none;
  transition: all 0.18s ease;
}

.emp-col-check-card:hover {
  border-color: #86efac !important;
  background: #f0fdf4;
}

.emp-col-check-card.emp-col-selected {
  background: #f0fdf4 !important;
  border-color: #16a34a !important;
  box-shadow: 0 1px 6px rgba(22, 163, 74, 0.15);
}

.emp-col-dot {
  width: 14px;
  height: 14px;
  min-width: 14px;
  border-radius: 3px;
  border: 2px solid #cbd5e1;
  background: #fff;
  transition: all 0.18s;
  flex-shrink: 0;
}

.emp-col-dot.emp-col-dot-active {
  background: #16a34a;
  border-color: #16a34a;
}

/* QR Code Modal & Stand Styles */
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
.bg-blue-light {
  background-color: #dbeafe !important;
}
.bg-blue-subtle {
  background-color: #eff6ff !important;
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
  .page-header-card,
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
