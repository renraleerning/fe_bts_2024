<script setup>
import { ref, computed, onMounted, onBeforeMount, onBeforeUnmount, nextTick } from "vue";
import { useRouter } from "vue-router";
import { useStore } from "vuex";
import api from "../../api";
import PublicEventPresensi from "../Event/PublicEventPresensi.vue";

// Active Event State for Public Visitors & Staff
const activeEvent = ref(null);
const showEventPresensi = ref(false);

// Router & Store instances
const router = useRouter();
const store = useStore();

// Auth check
const isLoggedIn = computed(() => !!localStorage.getItem("token"));

// Success modal state for public guests
const showSuccessModal = ref(false);
const submittedGuest = ref({
  name: "",
  time: "",
  tujuan: ""
});

// Auto-reset countdown for public visitors
const countdown = ref(5);
let countdownTimer = null;

const startCountdown = () => {
  countdown.value = 5;
  if (countdownTimer) clearInterval(countdownTimer);
  countdownTimer = setInterval(() => {
    countdown.value--;
    if (countdown.value <= 0) {
      clearInterval(countdownTimer);
      resetForm();
    }
  }, 1000);
};

const stopCountdown = () => {
  if (countdownTimer) {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }
};

// Form states
const nama = ref("");
const alamat = ref("");
const jenkel = ref("Laki-laki");
const no_hp = ref("");
const tujuan = ref("");
const nama_tujuan = ref("");
const keperluan = ref("");
const photo = ref("");
const file = ref(null);
const errors = ref({});
const isSubmitting = ref(false);

// Master data lists
const pegawais = ref([]);
const bagians = ref([]);

// Camera states & references
const video = ref(null);
const canvas = ref(null);
const mediaStream = ref(null);
const isCameraActive = ref(false);
const cameraLoading = ref(false);
const cameraError = ref("");
const filePhotoInput = ref(null);
const fileInputRef = ref(null);
const fileInputKey = ref(0);

// Clear document attachment
const clearLampiran = () => {
  file.value = null;
  fileInputKey.value++;
  if (fileInputRef.value) {
    fileInputRef.value.value = "";
  }
};

// Source name / description for newly selected photo
const photoSourceName = computed(() => {
  if (!photo.value) return "";
  if (filePhotoInput.value && filePhotoInput.value.files && filePhotoInput.value.files[0]) {
    return filePhotoInput.value.files[0].name;
  }
  return "Tangkapan Kamera (Webcam)";
});

// Safe error helper for Laravel responses
const getError = (field) => {
  if (!errors.value) return null;
  const errObj = errors.value.errors || errors.value;
  if (errObj && errObj[field]) {
    return Array.isArray(errObj[field]) ? errObj[field][0] : errObj[field];
  }
  return null;
};

// Handle file changes for document attachment & direct photo file upload
const handleFileChange = (type, e) => {
  if (type === "file") {
    file.value = e.target.files[0] || null;
  } else if (type === "photo_file") {
    const selected = e.target.files[0];
    if (selected) {
      stopWebcam();
      const reader = new FileReader();
      reader.onload = (event) => {
        photo.value = event.target.result;
      };
      reader.readAsDataURL(selected);
    }
  }
};

// Convert Base64 DataURL to Blob safely
const dataURLToBlob = (dataURL) => {
  if (!dataURL || typeof dataURL !== "string" || !dataURL.includes(",")) return null;
  try {
    const parts = dataURL.split(",");
    const byteString = atob(parts[1]);
    const mimeString = parts[0].split(":")[1].split(";")[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeString });
  } catch (e) {
    console.error("Gagal mengonversi dataURL ke Blob:", e);
    return null;
  }
};

// Start Webcam with lightweight resolution & framerate
const startWebcam = async () => {
  cameraError.value = "";
  cameraLoading.value = true;
  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error("Perangkat atau browser Anda tidak mendukung akses kamera.");
    }

    stopWebcam();

    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 640 },
        height: { ideal: 480 },
        frameRate: { ideal: 24, max: 30 },
        facingMode: "user"
      },
      audio: false
    });

    mediaStream.value = stream;
    isCameraActive.value = true;

    await nextTick();
    if (video.value) {
      video.value.srcObject = stream;
      video.value.play().catch(err => console.warn("Video play error:", err));
    }
  } catch (err) {
    console.error("Error accessing webcam: ", err);
    cameraError.value = err.message || "Gagal mengakses kamera. Pastikan izin kamera telah diberikan.";
    isCameraActive.value = false;
  } finally {
    cameraLoading.value = false;
  }
};

// Stop Webcam and turn off camera sensor immediately
const stopWebcam = () => {
  if (mediaStream.value) {
    mediaStream.value.getTracks().forEach((track) => {
      track.stop();
    });
    mediaStream.value = null;
  }
  if (video.value) {
    video.value.srcObject = null;
  }
  isCameraActive.value = false;
};

// Capture Photo from video stream and shut down the camera instantly
const capture = () => {
  if (!video.value || !canvas.value) return;

  const width = video.value.videoWidth || 640;
  const height = video.value.videoHeight || 480;

  canvas.value.width = width;
  canvas.value.height = height;

  const context = canvas.value.getContext("2d");
  context.drawImage(video.value, 0, 0, width, height);

  photo.value = canvas.value.toDataURL("image/jpeg", 0.9);
  stopWebcam();
};

// Retake photo: clear photo & reopen camera
const retakePhoto = () => {
  photo.value = "";
  startWebcam();
};

// Clear photo
const clearPhoto = () => {
  photo.value = "";
  stopWebcam();
  if (filePhotoInput.value) {
    filePhotoInput.value.value = "";
  }
};

// Submit form data
const storeTamu = async () => {
  isSubmitting.value = true;
  errors.value = {};

  try {
    let formData = new FormData();
    formData.append("nama", nama.value || "");
    formData.append("alamat", alamat.value || "");
    formData.append("jenkel", jenkel.value || "");
    formData.append("no_hp", no_hp.value || "");
    formData.append("tujuan", tujuan.value || "");
    formData.append("nama_tujuan", nama_tujuan.value || "");
    formData.append("keperluan", keperluan.value || "");
    formData.append("is_staff", isLoggedIn.value ? "1" : "0");

    if (photo.value) {
      if (typeof photo.value === "string" && photo.value.startsWith("data:image")) {
        const photoBlob = dataURLToBlob(photo.value);
        if (photoBlob) {
          formData.append("photo", photoBlob, "foto_tamu.jpg");
        }
      } else {
        formData.append("photo", photo.value);
      }
    }

    if (file.value) {
      formData.append("file", file.value);
    }

    await api.post("/api/tamu", formData);

    stopWebcam();
    submittedGuest.value = {
      name: nama.value,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      tujuan: tujuan.value || "SMKN 2 Sumedang"
    };

    if (isLoggedIn.value) {
      router.push({ path: "/tamu" });
    } else {
      showSuccessModal.value = true;
      startCountdown();
    }
  } catch (error) {
    if (error.response && error.response.data) {
      errors.value = error.response.data;
    } else {
      console.error("Gagal menyimpan data tamu:", error);
    }
  } finally {
    isSubmitting.value = false;
  }
};

// Reset form for next guest
const resetForm = () => {
  stopCountdown();
  nama.value = "";
  alamat.value = "";
  jenkel.value = "Laki-laki";
  no_hp.value = "";
  tujuan.value = "";
  nama_tujuan.value = "";
  keperluan.value = "";
  photo.value = "";
  file.value = null;
  errors.value = {};
  showSuccessModal.value = false;
  fileInputKey.value++;
  if (filePhotoInput.value) {
    filePhotoInput.value.value = "";
  }
  if (fileInputRef.value) {
    fileInputRef.value.value = "";
  }
  window.scrollTo({ top: 0, behavior: "smooth" });
};

// Filter only active bagians and active pegawais
const availableBagians = computed(() => {
  return bagians.value.filter(
    (b) => !b.status || b.status === "Aktif" || String(b.status).toLowerCase() === "aktif"
  );
});

const availablePegawais = computed(() => {
  return pegawais.value.filter(
    (p) => !p.status || p.status === "Aktif" || String(p.status).toLowerCase() === "aktif"
  );
});

// Hide sidebar and dashboard navbar when accessed by public guests without login
onBeforeMount(() => {
  if (!isLoggedIn.value && store && store.state) {
    store.state.showNavbar = false;
    store.state.showSidenav = false;
    store.state.showFooter = false;
  }
});

// Load master data pegawais and bagians simultaneously
onMounted(async () => {
  // Cek apakah ada event sekolah yang sedang aktif
  try {
    const resEvent = await api.get("/api/event/active");
    activeEvent.value = resEvent.data?.data || null;
  } catch (err) {
    console.warn("Gagal memuat event aktif:", err);
  }

  try {
    const [resPegawai, resBagian] = await Promise.all([
      api.get("/api/pegawai?status=Aktif").catch(() => ({ data: { data: [] } })),
      api.get("/api/bagian?status=Aktif").catch(() => ({ data: { data: [] } }))
    ]);
    pegawais.value = resPegawai.data?.data?.data || resPegawai.data?.data || [];
    bagians.value = resBagian.data?.data?.data || resBagian.data?.data || [];
  } catch (e) {
    console.error("Gagal memuat master data:", e);
  }
});

// Cleanly stop camera on unmount & restore dashboard layouts
onBeforeUnmount(() => {
  stopCountdown();
  if (store && store.state) {
    store.state.showNavbar = true;
    store.state.showSidenav = true;
    store.state.showFooter = true;
  }
  stopWebcam();
});
</script>

<template>
  <!-- Mode Presensi Event Khusus (Aktif saat ada event pameran/wisuda dan diakses tanpa login, atau saat staf memilih mode event) -->
  <div v-if="activeEvent && (!isLoggedIn || showEventPresensi)" class="py-3 py-sm-4 container-fluid edit-tamu-container public-mode-container">
    <div v-if="isLoggedIn" class="mb-3 d-flex justify-content-between align-items-center">
      <button
        type="button"
        class="btn btn-sm btn-white rounded-pill shadow-xs d-inline-flex align-items-center gap-2 px-3 py-2 text-xs fw-bold text-slate-700"
        @click="showEventPresensi = false"
      >
        <i class="fas fa-arrow-left text-primary"></i> Kembali ke Form Tamu Kedinasan
      </button>
      <span class="badge bg-primary text-white text-xxs px-2-5 py-1-5 rounded-pill">
        Mode Petugas / Admin
      </span>
    </div>
    <PublicEventPresensi :event="activeEvent" />
  </div>

  <!-- Mode Presensi Kedinasan Normal (Default jika tidak ada event, atau saat login Admin/Petugas) -->
  <div v-else class="py-3 py-sm-4 container-fluid edit-tamu-container" :class="{ 'public-mode-container': !isLoggedIn }">
    <!-- Public Mode Banner (Saat diakses tamu/peserta event tanpa login) -->
    <div v-if="!isLoggedIn" class="public-school-banner card border-0 shadow-sm mb-3 mb-sm-4 overflow-hidden">
      <div class="card-body p-3 p-sm-4 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
        <div class="d-flex align-items-center gap-3">
          <div class="school-logo-badge flex-shrink-0">
            <i class="fas fa-camera-retro text-primary fs-3"></i>
          </div>
          <div>
            <div class="d-flex align-items-center gap-2 flex-wrap mb-1">
              <span class="badge bg-primary text-white text-xxs font-weight-bold px-2 py-1 rounded-pill">
                Presensi Mandiri Tamu
              </span>
              <span class="text-xs text-slate-500 fw-semibold">&bull; SMKN 2 Sumedang</span>
            </div>
            <h4 class="mb-0 fw-bold header-title-text">BTS (Buku Tamu Selfie)</h4>
            <p class="header-subtitle-text mb-0 text-slate-500 text-xs">
              Selamat datang! Silakan lengkapi presensi kehadiran dan ambil foto selfie kunjungan Anda.
            </p>
          </div>
        </div>

        <div class="d-flex align-items-center gap-2 flex-wrap ms-auto ms-md-0">
          <router-link
            to="/signin"
            class="btn-staff-login text-decoration-none d-inline-flex align-items-center gap-2 px-3 py-2 rounded-3 text-xs fw-semibold shadow-xs"
            title="Masuk ke Sistem Resepsionis / Admin"
          >
            <i class="fas fa-lock text-primary"></i>
            <span>Login Petugas / Admin</span>
          </router-link>
        </div>
      </div>
    </div>

    <!-- Dashboard Mode Header Card (Saat diakses oleh Petugas / Admin yang sudah login) -->
    <template v-else>
      <div class="card border-0 shadow-sm mb-3 page-header-card">
        <div class="card-body p-3 p-sm-4 d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3">
          <div>
            <h4 class="mb-1 fw-bold header-title-text">Tambah Data Tamu</h4>
            <p class="header-subtitle-text mb-0">
              Catat identitas tamu, tujuan kunjungan, ambil foto presensi via webcam, dan lampirkan dokumen pendukung.
            </p>
          </div>
        </div>
      </div>

      <!-- Banner Acara Aktif jika ada Event yang sedang berlangsung -->
      <div v-if="activeEvent" class="card border-0 shadow-xs mb-4 rounded-4 overflow-hidden border-start border-4 border-primary bg-white">
        <div class="card-body p-3 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
          <div class="d-flex align-items-center gap-3">
            <div class="icon-circle bg-blue-light text-primary flex-shrink-0" style="width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; background: #eff6ff;">
              <i class="fas fa-calendar-check fs-5"></i>
            </div>
            <div>
              <div class="d-flex align-items-center gap-2 flex-wrap">
                <strong class="text-slate-800 text-sm">{{ activeEvent.nama_event }}</strong>
                <span class="badge bg-success-subtle text-success text-xxs font-weight-bold px-2 py-0.5 rounded-pill">
                  Event Sedang Aktif
                </span>
              </div>
              <p class="text-xs text-slate-500 mb-0 mt-0.5">
                Ada acara sekolah yang sedang berlangsung. Anda dapat menginput presensi khusus acara ini atau melihat rekap.
              </p>
            </div>
          </div>
          <div class="d-flex align-items-center gap-2 flex-wrap">
            <button
              type="button"
              class="btn btn-primary btn-sm mb-0 rounded-pill px-3 shadow-xs d-inline-flex align-items-center gap-1 text-xs"
              @click="showEventPresensi = true"
            >
              <i class="fas fa-id-card"></i> Buka Presensi Acara Ini
            </button>
            <router-link
              :to="'/detail-event/' + activeEvent.id"
              class="btn btn-outline-secondary btn-sm mb-0 rounded-pill px-3 text-xs"
            >
              <i class="fas fa-list me-1"></i> Rekap Tamu Event
            </router-link>
          </div>
        </div>
      </div>
    </template>

    <!-- Main Form Grid -->
    <div class="row g-3 g-lg-4">
      <!-- Left Column: Identitas & Tujuan -->
      <div class="col-lg-6 mb-3 mb-lg-4">
        <!-- Identitas Tamu Card -->
        <div class="card modern-form-card border-0 shadow-sm mb-3 mb-lg-4">
          <div class="card-header bg-white border-0 pb-0 pt-4 px-4">
            <div class="d-flex align-items-center gap-2">
              <div class="header-icon-circle bg-blue-light text-primary">
                <i class="fas fa-user-plus"></i>
              </div>
              <div>
                <h6 class="mb-0 fw-bold text-slate-900">Identitas Tamu</h6>
                <small class="text-slate-400 text-xs">Informasi pribadi tamu yang berkunjung</small>
              </div>
            </div>
          </div>

          <div class="card-body px-4 pt-3 pb-4">
            <!-- Nama -->
            <div class="mb-3">
              <label class="form-label text-xs fw-bold text-slate-700">
                Nama Lengkap <span class="text-danger">*</span>
              </label>
              <div class="input-with-icon">
                <i class="fas fa-user input-icon text-slate-400"></i>
                <input
                  type="text"
                  class="form-control modern-input"
                  v-model="nama"
                  placeholder="Masukkan nama lengkap tamu"
                />
              </div>
              <div v-if="getError('nama')" class="form-error-msg mt-1">
                <i class="fas fa-exclamation-circle me-1"></i>{{ getError('nama') }}
              </div>
            </div>

            <!-- Alamat -->
            <div class="mb-3">
              <label class="form-label text-xs fw-bold text-slate-700">
                Alamat / Asal Instansi <span class="text-danger">*</span>
              </label>
              <textarea
                class="form-control modern-input"
                v-model="alamat"
                rows="3"
                placeholder="Masukkan alamat domisili atau instansi asal tamu"
              ></textarea>
              <div v-if="getError('alamat')" class="form-error-msg mt-1">
                <i class="fas fa-exclamation-circle me-1"></i>{{ getError('alamat') }}
              </div>
            </div>

            <!-- Jenis Kelamin & No WhatsApp -->
            <div class="row">
              <div class="col-md-6 mb-3">
                <label class="form-label text-xs fw-bold text-slate-700">
                  Jenis Kelamin <span class="text-danger">*</span>
                </label>
                <select class="form-select modern-input" v-model="jenkel">
                  <option value="Laki-laki">Laki-laki</option>
                  <option value="Perempuan">Perempuan</option>
                </select>
                <div v-if="getError('jenkel')" class="form-error-msg mt-1">
                  <i class="fas fa-exclamation-circle me-1"></i>{{ getError('jenkel') }}
                </div>
              </div>

              <div class="col-md-6 mb-3">
                <label class="form-label text-xs fw-bold text-slate-700">
                  No WhatsApp / HP <span class="text-danger">*</span>
                </label>
                <div class="input-with-icon">
                  <i class="fab fa-whatsapp input-icon text-slate-400"></i>
                  <input
                    type="text"
                    class="form-control modern-input"
                    v-model="no_hp"
                    placeholder="Contoh: 08123456789"
                  />
                </div>
                <div v-if="getError('no_hp')" class="form-error-msg mt-1">
                  <i class="fas fa-exclamation-circle me-1"></i>{{ getError('no_hp') }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Tujuan Kunjungan Card -->
        <div class="card modern-form-card border-0 shadow-sm">
          <div class="card-header bg-white border-0 pb-0 pt-4 px-4">
            <div class="d-flex align-items-center gap-2">
              <div class="header-icon-circle bg-emerald-light text-emerald">
                <i class="fas fa-building"></i>
              </div>
              <div>
                <h6 class="mb-0 fw-bold text-slate-900">Tujuan Kunjungan</h6>
                <small class="text-slate-400 text-xs">Bagian, pegawai dituju, dan keperluan kunjungan</small>
              </div>
            </div>
          </div>

          <div class="card-body px-4 pt-3 pb-4">
            <!-- Bagian -->
            <div class="mb-3">
              <label class="form-label text-xs fw-bold text-slate-700">
                Bagian Dituju <span class="text-danger">*</span>
              </label>
              <select class="form-select modern-input" v-model="tujuan">
                <option disabled value="">:: Pilih Bagian Dituju ::</option>
                <option v-for="(bagian, index) in availableBagians" :value="bagian.nama_bagian" :key="index">
                  {{ bagian.nama_bagian }}
                </option>
              </select>
              <div v-if="getError('tujuan')" class="form-error-msg mt-1">
                <i class="fas fa-exclamation-circle me-1"></i>{{ getError('tujuan') }}
              </div>
            </div>

            <!-- Pegawai Dituju -->
            <div class="mb-3">
              <label class="form-label text-xs fw-bold text-slate-700">
                Nama Pegawai Yang Dituju <span class="text-danger">*</span>
              </label>
              <select class="form-select modern-input" v-model="nama_tujuan">
                <option disabled value="">:: Pilih Pegawai Dituju ::</option>
                <option v-for="(pegawai, index) in availablePegawais" :value="pegawai.nama" :key="index">
                  {{ pegawai.nama }}
                </option>
              </select>
              <div v-if="getError('nama_tujuan')" class="form-error-msg mt-1">
                <i class="fas fa-exclamation-circle me-1"></i>{{ getError('nama_tujuan') }}
              </div>
            </div>

            <!-- Keperluan -->
            <div class="mb-3">
              <label class="form-label text-xs fw-bold text-slate-700">
                Keperluan Bertamu <span class="text-danger">*</span>
              </label>
              <textarea
                class="form-control modern-input"
                v-model="keperluan"
                rows="3"
                placeholder="Jelaskan maksud atau agenda kedatangan tamu"
              ></textarea>
              <div v-if="getError('keperluan')" class="form-error-msg mt-1">
                <i class="fas fa-exclamation-circle me-1"></i>{{ getError('keperluan') }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Column: Lampiran & Foto Tamu -->
      <div class="col-lg-6 mb-3 mb-lg-4">
        <!-- Lampiran Dokumen Card -->
        <div class="card modern-form-card border-0 shadow-sm mb-3 mb-lg-4">
          <div class="card-header bg-white border-0 pb-0 pt-4 px-4">
            <div class="d-flex align-items-center justify-content-between flex-wrap gap-2">
              <div class="d-flex align-items-center gap-2">
                <div class="header-icon-circle bg-amber-light text-amber">
                  <i class="fas fa-file-alt"></i>
                </div>
                <div>
                  <h6 class="mb-0 fw-bold text-slate-900">Lampiran Dokumen</h6>
                  <small class="text-slate-400 text-xs">Surat tugas, undangan, atau berkas pendukung (opsional)</small>
                </div>
              </div>
              <span v-if="file" class="badge-status-pill badge-active">
                <i class="fas fa-check-circle me-1"></i> Ada Berkas
              </span>
              <span v-else class="badge-status-pill badge-neutral">
                Opsional
              </span>
            </div>
          </div>

          <div class="card-body px-4 pt-3 pb-4">
            <div class="mb-2">
              <label class="form-label text-xs fw-bold text-slate-700">
                Unggah File Lampiran
              </label>
              <input
                type="file"
                ref="fileInputRef"
                :key="fileInputKey"
                class="form-control modern-input"
                @change="handleFileChange('file', $event)"
              />
              <div v-if="file" class="text-success text-xs mt-2 d-flex align-items-center justify-content-between p-2 rounded-2 bg-emerald-50 border border-emerald-200">
                <div class="d-flex align-items-center text-truncate me-2">
                  <i class="fas fa-check-circle text-success me-1"></i>
                  <span class="text-slate-700">Berkas terpilih:</span>
                  <b class="ms-1 text-slate-900 text-truncate" style="max-width: 200px;">{{ file.name }}</b>
                </div>
                <button
                  type="button"
                  @click="clearLampiran"
                  class="btn btn-sm btn-link text-danger p-0 m-0 text-xxs text-decoration-none fw-bold"
                  title="Batalkan berkas ini"
                >
                  <i class="fas fa-times me-1"></i> Hapus Berkas
                </button>
              </div>
              <small class="text-slate-400 text-xxs d-block mt-1">
                Format yang didukung: PDF, DOCX, XLSX, JPG, PNG (Maksimal 5MB)
              </small>
              <div v-if="getError('file')" class="form-error-msg mt-1">
                <i class="fas fa-exclamation-circle me-1"></i>{{ getError('file') }}
              </div>
            </div>
          </div>
        </div>

        <!-- Foto Tamu Card -->
        <div class="card modern-form-card border-0 shadow-sm">
          <div class="card-header bg-white border-0 pb-0 pt-4 px-4 d-flex justify-content-between align-items-center flex-wrap gap-2">
            <div class="d-flex align-items-center gap-2">
              <div class="header-icon-circle bg-purple-light text-purple">
                <i class="fas fa-camera"></i>
              </div>
              <div>
                <h6 class="mb-0 fw-bold text-slate-900">Foto Tamu</h6>
                <small class="text-slate-400 text-xs">Bukti visual presensi kedatangan tamu</small>
              </div>
            </div>

            <!-- Status Badge -->
            <span v-if="isCameraActive" class="badge-status-pill badge-camera-live">
              <span class="live-dot me-1"></span> Kamera Live
            </span>
            <span v-else-if="photo" class="badge-status-pill badge-new-photo">
              <i class="fas fa-check-circle me-1 text-success"></i> Foto Siap
            </span>
            <span v-else class="badge-status-pill badge-neutral">
              Kamera Siaga
            </span>
          </div>

          <div class="card-body px-4 pt-3 pb-4">
            <!-- Hidden Canvas & File Input -->
            <canvas ref="canvas" style="display: none;"></canvas>
            <input
              type="file"
              ref="filePhotoInput"
              accept="image/*"
              class="d-none"
              @change="handleFileChange('photo_file', $event)"
            />

            <!-- Error Notice -->
            <div v-if="cameraError" class="alert alert-warning text-dark py-2 px-3 mb-3 text-xs rounded-3">
              <i class="fas fa-exclamation-triangle text-danger me-1"></i> {{ cameraError }}
            </div>

            <!-- View Mode 1: Live Webcam Feed -->
            <div v-if="isCameraActive" class="camera-stream-box text-center">
              <div class="video-container position-relative mb-3">
                <video ref="video" class="camera-video-feed" autoplay playsinline muted></video>
                <div class="camera-live-badge">
                  <span class="live-dot"></span> LIVE KAMERA
                </div>
              </div>
              <div class="d-flex justify-content-center flex-wrap gap-2 mb-2">
                <button
                  type="button"
                  @click="capture"
                  class="photo-action-btn btn-primary"
                >
                  <i class="fas fa-camera me-2"></i> Ambil Foto
                </button>
                <button
                  type="button"
                  @click="stopWebcam"
                  class="photo-action-btn btn-outline-danger"
                >
                  <i class="fas fa-times me-2"></i> Matikan Kamera
                </button>
              </div>
              <small class="text-slate-400 d-block text-xxs mt-1">
                Kamera akan otomatis mati setelah foto diambil untuk menjaga laptop/HP tidak panas.
              </small>
            </div>

            <!-- View Mode 2: Photo Preview (When Photo is taken/uploaded) -->
            <div v-else-if="photo" class="photo-preview-box text-center">
              <div class="photo-container mb-3 position-relative">
                <img :src="photo" class="img-fluid rounded-3 photo-img" alt="Foto Tamu Preview" />
                <div class="photo-badge-overlay">
                  <i class="fas fa-check-circle text-success me-1"></i> Foto Siap
                </div>
              </div>

              <!-- Tanda ceklis persis seperti pada lampiran -->
              <div class="text-success text-xs fw-semibold mb-3 d-flex align-items-center justify-content-center flex-wrap gap-1">
                <i class="fas fa-check me-1"></i>
                <span>Foto terpilih:</span>
                <b class="text-truncate" style="max-width: 250px;">{{ photoSourceName }}</b>
              </div>

              <div class="d-flex justify-content-center flex-wrap gap-2 mb-2">
                <button
                  type="button"
                  @click="retakePhoto"
                  class="photo-action-btn btn-outline-primary"
                >
                  <i class="fas fa-redo-alt me-1"></i> Ambil Ulang Kamera
                </button>
                <button
                  type="button"
                  @click="$refs.filePhotoInput.click()"
                  class="photo-action-btn btn-cancel"
                >
                  <i class="fas fa-folder-open me-1"></i> Ganti File
                </button>
                <button
                  type="button"
                  @click="clearPhoto"
                  class="photo-action-btn btn-outline-danger"
                >
                  <i class="fas fa-trash-alt me-1"></i> Hapus Foto
                </button>
              </div>
              <small class="text-emerald fw-semibold d-block text-xxs mt-1">
                Foto siap disimpan bersama identitas tamu.
              </small>
            </div>

            <!-- View Mode 3: Idle / Energy-Saving State -->
            <div v-else class="camera-idle-placeholder text-center p-4 rounded-3 mb-3">
              <div class="camera-icon-wrapper mx-auto mb-2">
                <i class="fas fa-camera fa-2x text-primary"></i>
              </div>
              <h6 class="text-slate-800 fw-bold mb-1 text-sm">Ambil Foto Presensi</h6>
              <p class="text-slate-400 text-xxs mb-3">
                Kamera dalam mode siaga hemat daya. Ambil foto menggunakan webcam atau unggah file foto dari perangkat.
              </p>
              <div class="d-flex justify-content-center flex-wrap gap-2">
                <button
                  type="button"
                  @click="startWebcam"
                  :disabled="cameraLoading"
                  class="photo-action-btn btn-primary"
                >
                  <span v-if="cameraLoading" class="spinner-border spinner-border-sm me-2" role="status"></span>
                  <i v-if="!cameraLoading" class="fas fa-camera me-2"></i>
                  {{ cameraLoading ? 'Menghubungkan...' : 'Ambil Foto (Kamera)' }}
                </button>
                <button
                  type="button"
                  @click="$refs.filePhotoInput.click()"
                  class="photo-action-btn btn-cancel"
                >
                  <i class="fas fa-upload me-2"></i> Unggah File Foto
                </button>
              </div>
            </div>

            <div v-if="getError('photo')" class="form-error-msg mt-2">
              <i class="fas fa-exclamation-circle me-1"></i>{{ getError('photo') }}
            </div>
          </div>
        </div>

        <!-- Bottom Actions (Mobile Sticky Bar) -->
        <div class="d-flex d-sm-none align-items-center gap-2 mobile-sticky-bottom-bar">
          <button
            v-if="!isLoggedIn"
            type="button"
            @click="resetForm"
            class="btn-cancel w-40 py-2 rounded-3 text-center"
          >
            <i class="fas fa-undo me-1 text-secondary"></i> Reset
          </button>
          <router-link
            v-else
            :to="{ name: 'Data Tamu' }"
            class="btn-cancel w-40 py-2 rounded-3 text-center text-decoration-none"
          >
            <i class="fas fa-times me-1 text-danger"></i> Batal
          </router-link>

          <button
            type="button"
            @click="storeTamu"
            :disabled="isSubmitting"
            class="btn-primary-gradient text-white border-0 w-60 py-2 rounded-3 shadow-sm d-flex align-items-center justify-content-center fw-semibold text-sm"
          >
            <span v-if="isSubmitting" class="spinner-border spinner-border-sm me-2" role="status"></span>
            <i v-if="!isSubmitting" :class="isLoggedIn ? 'fas fa-save me-2' : 'fas fa-paper-plane me-2'"></i>
            {{ isSubmitting ? 'Menyimpan...' : (isLoggedIn ? 'Simpan' : 'Kirim Presensi') }}
          </button>
        </div>

        <!-- Desktop Bottom Action Bar for Logged-In Admin / Petugas -->
        <div v-if="isLoggedIn" class="d-none d-sm-flex justify-content-end align-items-center gap-2 mt-3 mb-4">
          <router-link :to="{ name: 'Data Tamu' }" class="btn-cancel px-4 py-2 rounded-3 text-sm">
            <i class="fas fa-times me-1 text-danger"></i> Batal
          </router-link>
          <button
            type="button"
            @click="storeTamu"
            :disabled="isSubmitting"
            class="btn-primary-gradient text-white border-0 px-4 py-2 rounded-3 shadow-sm d-flex align-items-center fw-semibold text-sm"
          >
            <span v-if="isSubmitting" class="spinner-border spinner-border-sm me-2" role="status"></span>
            <i v-if="!isSubmitting" class="fas fa-save me-2"></i>
            {{ isSubmitting ? 'Menyimpan...' : 'Simpan Data Tamu' }}
          </button>
        </div>

        <!-- Desktop Bottom Action Card for Public Guests -->
        <div v-else class="card border-0 shadow-sm p-4 text-center mt-3 mb-4 rounded-4 bg-white d-none d-sm-block">
          <h6 class="fw-bold text-slate-900 mb-1">Sudah Selesai Mengisi Presensi?</h6>
          <p class="text-slate-500 text-xs mb-3">
            Pastikan foto selfie atau dokumen pendukung Anda sudah sesuai sebelum menekan tombol kirim.
          </p>
          <div class="d-flex justify-content-center align-items-center gap-2">
            <button
              type="button"
              @click="resetForm"
              class="btn-cancel px-4 py-2 rounded-3 text-sm"
            >
              <i class="fas fa-undo me-1"></i> Reset Isian
            </button>
            <button
              type="button"
              @click="storeTamu"
              :disabled="isSubmitting"
              class="btn-primary-gradient text-white border-0 px-4 py-2 rounded-3 shadow-sm d-flex align-items-center fw-semibold text-sm"
            >
              <span v-if="isSubmitting" class="spinner-border spinner-border-sm me-2" role="status"></span>
              <i v-if="!isSubmitting" class="fas fa-paper-plane me-2"></i>
              {{ isSubmitting ? 'Mengirim Presensi...' : 'Kirim Presensi Tamu Sekarang' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Celebration Success Modal for Public Guest Presensi -->
    <transition name="fade">
      <div v-if="showSuccessModal" class="custom-modal-backdrop">
        <div class="modal-card-celebration shadow-lg animate-scale-up">
          <div class="celebration-badge-circle mx-auto mb-3">
            <i class="fas fa-check fa-2x text-white"></i>
          </div>
          <h4 class="fw-bold text-slate-900 mb-1">Presensi Berhasil Dicatat!</h4>
          <p class="text-slate-500 text-sm mb-3">
            Terima kasih, Bapak/Ibu <strong class="text-slate-800">{{ submittedGuest.name }}</strong>.<br />
            Data kunjungan Anda telah resmi tersimpan di sistem Buku Tamu SMKN 2 Sumedang.
          </p>

          <div class="guest-recap-box p-3 rounded-3 text-start mb-4">
            <div class="d-flex justify-content-between mb-1 text-xs">
              <span class="text-slate-500">Waktu Presensi:</span>
              <span class="fw-bold text-slate-800">{{ submittedGuest.time }}</span>
            </div>
            <div class="d-flex justify-content-between text-xs">
              <span class="text-slate-500">Tujuan Kunjungan:</span>
              <span class="fw-bold text-primary">{{ submittedGuest.tujuan }}</span>
            </div>
          </div>

          <div class="d-flex flex-column gap-2">
            <button
              type="button"
              @click="resetForm"
              class="btn-primary-gradient text-white border-0 py-2-5 rounded-3 fw-semibold text-sm shadow-sm d-flex align-items-center justify-content-center gap-2"
            >
              <i class="fas fa-check-circle"></i>
              <span>Selesai</span>
              <span class="badge bg-white text-primary rounded-pill px-2 py-0-5 text-xxs ms-1">({{ countdown }}s)</span>
            </button>
            <p class="text-slate-400 text-xxs mt-1 mb-0 text-center">
              Halaman akan otomatis kembali dalam {{ countdown }} detik
            </p>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
/* Responsive Container */
.edit-tamu-container {
  max-width: 1260px;
  margin: 0 auto;
  padding: 0 10px;
}

@media (min-width: 768px) {
  .edit-tamu-container {
    padding: 0 16px;
  }
}

@media (min-width: 1200px) {
  .edit-tamu-container {
    padding: 0 20px;
    max-width: 1280px;
  }
}

/* Page Header Card */
.page-header-card {
  border-radius: 16px;
  background-color: #ffffff;
}

.header-title-text {
  color: #0f172a !important;
  font-weight: 800;
  font-size: 1.35rem;
  letter-spacing: -0.3px;
}

@media (max-width: 575.98px) {
  .header-title-text {
    font-size: 1.2rem;
  }
}

.header-subtitle-text {
  color: #334155 !important;
  font-size: 13px;
  font-weight: 500;
  line-height: 1.4;
}

@media (max-width: 575.98px) {
  .header-subtitle-text {
    font-size: 12px;
  }
}

.btn-back-link {
  color: #1e293b !important;
  background-color: #f8fafc;
  border: 1px solid #cbd5e1;
  padding: 6px 14px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}

.btn-back-link:hover {
  color: #2563eb !important;
  border-color: #93c5fd;
  background-color: #eff6ff;
  transform: translateX(-2px);
}

.btn-cancel {
  background-color: #ffffff;
  color: #334155 !important;
  border: 1px solid #cbd5e1;
  font-weight: 600;
  font-size: 13px;
  transition: all 0.2s ease;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  min-height: 38px;
}

.btn-cancel:hover {
  background-color: #f1f5f9;
  color: #0f172a !important;
  border-color: #94a3b8;
}

/* Header Action Buttons Responsive */
@media (max-width: 575.98px) {
  .header-action-buttons {
    width: 100%;
  }
  .header-action-buttons .btn-cancel {
    flex: 1 1 35%;
  }
  .header-action-buttons .btn-primary-gradient {
    flex: 1 1 65%;
    justify-content: center;
  }
}

/* Text color helpers */
.text-slate-900 { color: #0f172a !important; }
.text-slate-800 { color: #1e293b !important; }
.text-slate-700 { color: #334155 !important; }
.text-slate-600 { color: #475569 !important; }
.text-slate-500 { color: #64748b !important; }
.text-slate-400 { color: #94a3b8 !important; }

.modern-form-card {
  border-radius: 16px;
  background-color: #ffffff;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.modern-form-card:hover {
  box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.05), 0 8px 10px -6px rgba(15, 23, 42, 0.03) !important;
}

/* Card padding responsiveness for mobile */
@media (max-width: 575.98px) {
  .modern-form-card .card-header {
    padding-left: 1rem !important;
    padding-right: 1rem !important;
    padding-top: 1rem !important;
  }
  .modern-form-card .card-body {
    padding-left: 1rem !important;
    padding-right: 1rem !important;
    padding-top: 0.75rem !important;
    padding-bottom: 1rem !important;
  }
}

.header-icon-circle {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
}

.bg-blue-light { background-color: #eff6ff; }
.bg-emerald-light { background-color: #ecfdf5; }
.bg-amber-light { background-color: #fffbeb; }
.bg-purple-light { background-color: #faf5ff; }

.text-emerald { color: #059669; }
.text-amber { color: #d97706; }
.text-purple { color: #7c3aed; }

.input-with-icon {
  position: relative;
}

.input-icon {
  position: absolute;
  top: 50%;
  left: 14px;
  transform: translateY(-50%);
  font-size: 13px;
  pointer-events: none;
}

.input-with-icon .modern-input {
  padding-left: 38px;
}

.modern-input {
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 10px 14px;
  font-size: 13px;
  color: #1e293b;
  transition: all 0.2s ease;
  background-color: #f8fafc;
  min-height: 42px;
}

.modern-input:focus {
  background-color: #ffffff;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
  outline: none;
}

.form-error-msg {
  color: #ef4444;
  font-size: 12px;
  font-weight: 500;
}

/* Badges */
.badge-status-pill {
  font-size: 11px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 20px;
  display: inline-flex;
  align-items: center;
}

.badge-active {
  background-color: #eff6ff;
  color: #2563eb;
}

.badge-new-photo {
  background-color: #ecfdf5;
  color: #059669;
}

.badge-neutral {
  background-color: #f1f5f9;
  color: #64748b;
}

.badge-camera-live {
  background-color: #fef2f2;
  color: #ef4444;
}

/* Camera and Photo styling */
.camera-idle-placeholder {
  border: 2px dashed #cbd5e1;
  background-color: #f8fafc;
}

.camera-icon-wrapper {
  width: 56px;
  height: 56px;
  background-color: #eff6ff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.video-container {
  background-color: #0f172a;
  border-radius: 14px;
  overflow: hidden;
  position: relative;
  min-height: 220px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.camera-video-feed {
  width: 100%;
  max-height: 280px;
  object-fit: cover;
  display: block;
}

.camera-live-badge {
  position: absolute;
  top: 10px;
  left: 10px;
  background: rgba(0, 0, 0, 0.75);
  color: #ffffff;
  font-size: 10px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  gap: 5px;
  letter-spacing: 0.5px;
}

.live-dot {
  width: 7px;
  height: 7px;
  background-color: #ef4444;
  border-radius: 50%;
  box-shadow: 0 0 6px #ef4444;
  animation: liveDotPulse 1.2s infinite ease-in-out;
}

@keyframes liveDotPulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.3; transform: scale(0.8); }
}

.photo-container {
  background-color: #0f172a;
  border-radius: 14px;
  overflow: hidden;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 220px;
}

.photo-img {
  max-height: 280px;
  width: 100%;
  object-fit: contain;
}

@media (max-width: 575.98px) {
  .camera-video-feed, .photo-img {
    max-height: 240px;
  }
}

.photo-badge-overlay {
  position: absolute;
  bottom: 10px;
  left: 10px;
  background: rgba(15, 23, 42, 0.75);
  backdrop-filter: blur(4px);
  color: #ffffff;
  font-size: 11px;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 20px;
}

/* Photo action buttons responsive & completely uniform */
.photo-action-btn {
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  height: 40px !important;
  min-height: 40px !important;
  max-height: 40px !important;
  padding: 0 18px !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  line-height: 1 !important;
  border-radius: 10px !important;
  margin-bottom: 0 !important;
  box-sizing: border-box !important;
  flex: 1 1 auto;
  min-width: 140px;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
}

.photo-action-btn i {
  font-size: 13px !important;
}

/* Blue Primary Photo Button */
.photo-action-btn.btn-primary,
.photo-action-btn.photo-btn-primary {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%) !important;
  color: #ffffff !important;
  border: 1px solid #1d4ed8 !important;
  box-shadow: 0 2px 5px rgba(37, 99, 235, 0.22) !important;
}

.photo-action-btn.btn-primary:hover:not(:disabled),
.photo-action-btn.photo-btn-primary:hover:not(:disabled) {
  background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%) !important;
  border-color: #1e40af !important;
  transform: translateY(-1px);
  box-shadow: 0 4px 10px rgba(37, 99, 235, 0.32) !important;
}

/* White/Outline Cancel/Upload Photo Button */
.photo-action-btn.btn-cancel,
.photo-action-btn.photo-btn-secondary {
  background-color: #ffffff !important;
  color: #334155 !important;
  border: 1px solid #cbd5e1 !important;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04) !important;
}

.photo-action-btn.btn-cancel:hover,
.photo-action-btn.photo-btn-secondary:hover {
  background-color: #f8fafc !important;
  color: #0f172a !important;
  border-color: #94a3b8 !important;
  transform: translateY(-1px);
}

/* Outline Primary (Ambil Ulang) */
.photo-action-btn.btn-outline-primary {
  background-color: #ffffff !important;
  color: #2563eb !important;
  border: 1px solid #bfdbfe !important;
  box-shadow: 0 1px 3px rgba(37, 99, 235, 0.08) !important;
}

.photo-action-btn.btn-outline-primary:hover {
  background-color: #eff6ff !important;
  border-color: #3b82f6 !important;
  color: #1d4ed8 !important;
  transform: translateY(-1px);
}

/* Outline Danger (Hapus Foto / Matikan Kamera) */
.photo-action-btn.btn-outline-danger {
  background-color: #ffffff !important;
  color: #dc2626 !important;
  border: 1px solid #fecaca !important;
  box-shadow: 0 1px 3px rgba(220, 38, 38, 0.06) !important;
}

.photo-action-btn.btn-outline-danger:hover {
  background-color: #fef2f2 !important;
  border-color: #ef4444 !important;
  color: #b91c1c !important;
  transform: translateY(-1px);
}

@media (max-width: 480px) {
  .photo-action-btn {
    width: 100% !important;
    min-width: 100% !important;
  }
}

/* Mobile Sticky Bottom Bar */
.mobile-sticky-bottom-bar {
  position: sticky;
  bottom: 12px;
  z-index: 1020;
  background: rgba(255, 255, 255, 0.96);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-radius: 14px;
  padding: 10px 14px;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 0 1px rgba(0, 0, 0, 0.2);
  margin-top: 1.5rem;
  margin-bottom: 0.5rem;
}

.w-40 { width: 40% !important; }
.w-60 { width: 60% !important; }

/* Button gradients */
.btn-primary-gradient {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  transition: all 0.2s ease;
  min-height: 38px;
}

.btn-primary-gradient:hover:not(:disabled) {
  background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3) !important;
}

.text-xxs {
  font-size: 11px;
}

/* Public Mode & School Banner */
.public-mode-container {
  max-width: 1180px;
  margin: 0 auto;
}

.public-school-banner {
  border-radius: 20px;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border: 1px solid #e2e8f0 !important;
}

.school-logo-badge {
  width: 58px;
  height: 58px;
  border-radius: 16px;
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 10px rgba(37, 99, 235, 0.12);
}

.btn-staff-login {
  background: #ffffff;
  color: #1e293b;
  border: 1px solid #cbd5e1;
  transition: all 0.2s ease;
}

.btn-staff-login:hover {
  background: #f1f5f9;
  border-color: #3b82f6;
  color: #2563eb;
  transform: translateY(-1px);
}

/* Celebration Modal */
.custom-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.65);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 16px;
}

.modal-card-celebration {
  background: #ffffff;
  border-radius: 24px;
  width: 100%;
  max-width: 440px;
  padding: 36px 28px 28px;
  text-align: center;
}

.celebration-badge-circle {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 20px rgba(16, 185, 129, 0.35);
  animation: pulse-ring 2s infinite;
}

@keyframes pulse-ring {
  0% {
    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4);
  }
  70% {
    box-shadow: 0 0 0 14px rgba(16, 185, 129, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
  }
}

.guest-recap-box {
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
}

.animate-scale-up {
  animation: scaleUp 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes scaleUp {
  0% {
    opacity: 0;
    transform: scale(0.92) translateY(12px);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}
</style>
