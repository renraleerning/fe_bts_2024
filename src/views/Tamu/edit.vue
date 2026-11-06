<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from "vue";
import { useRouter, useRoute } from "vue-router";
import api, { getStorageUrl } from "../../api";

// Router & Route
const router = useRouter();
const route = useRoute();

// Loading states
const isLoadingData = ref(true);
const isSubmitting = ref(false);

// Form Fields
const nama = ref("");
const alamat = ref("");
const jenkel = ref("Laki-laki");
const no_hp = ref("");
const tujuan = ref("");
const nama_tujuan = ref("");
const keperluan = ref("");

// Existing data from server
const existingPhoto = ref("");
const existingLampiran = ref(null);

// New Photo & File states
const newPhoto = ref(null); // String (dataURL) or File
const newPhotoPreview = ref("");
const newFile = ref(null); // File attachment
const errors = ref({});

// Master Data Lists
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
const newFileInput = ref(null);

// Source name / description for newly selected photo
const newPhotoSourceName = computed(() => {
  if (!newPhoto.value) return "";
  if (typeof newPhoto.value === "object" && newPhoto.value.name) {
    return newPhoto.value.name;
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

// Safe Photo URL Resolver
const resolvePhotoUrl = (url) => {
  if (!url) return null;
  return getStorageUrl(url);
};

// Safe Lampiran URL Resolver
const resolveLampiranUrl = (item) => {
  if (!item) return null;
  const path = typeof item === "object" ? item.file : item;
  if (!path) return null;
  return getStorageUrl(path);
};

// File info helper
const getFileInfo = (item) => {
  const url = resolveLampiranUrl(item);
  if (!url) return { label: "Dokumen", icon: "fas fa-paperclip", color: "text-secondary" };
  const lower = url.toLowerCase();
  if (lower.endsWith(".pdf")) return { label: "Dokumen PDF", icon: "fas fa-file-pdf", color: "text-danger" };
  if (lower.endsWith(".xlsx") || lower.endsWith(".xls")) return { label: "Berkas Excel", icon: "fas fa-file-excel", color: "text-success" };
  if (lower.endsWith(".docx") || lower.endsWith(".doc")) return { label: "Dokumen Word", icon: "fas fa-file-word", color: "text-primary" };
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg") || lower.endsWith(".png")) return { label: "Berkas Foto/Gambar", icon: "fas fa-file-image", color: "text-info" };
  return { label: "Dokumen Terlampir", icon: "fas fa-paperclip", color: "text-secondary" };
};

// Extract filename from URL/path
const getFilename = (item) => {
  const url = resolveLampiranUrl(item);
  if (!url) return "";
  try {
    const parts = url.split("/");
    return parts[parts.length - 1];
  } catch (e) {
    return "Lampiran Dokumen";
  }
};

// Handle file changes for document attachment & direct photo file upload
const handleFileChange = (type, e) => {
  if (type === "file") {
    newFile.value = e.target.files[0] || null;
  } else if (type === "photo_file") {
    const selected = e.target.files[0];
    if (selected) {
      stopWebcam();
      newPhoto.value = selected;
      const reader = new FileReader();
      reader.onload = (event) => {
        newPhotoPreview.value = event.target.result;
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
    mediaStream.value.getTracks().forEach((track) => track.stop());
    mediaStream.value = null;
  }
  if (video.value) {
    video.value.srcObject = null;
  }
  isCameraActive.value = false;
};

// Capture Photo from video stream
const capture = () => {
  if (!video.value || !canvas.value) return;

  const width = video.value.videoWidth || 640;
  const height = video.value.videoHeight || 480;

  canvas.value.width = width;
  canvas.value.height = height;

  const context = canvas.value.getContext("2d");
  context.drawImage(video.value, 0, 0, width, height);

  const capturedDataUrl = canvas.value.toDataURL("image/jpeg", 0.9);
  newPhoto.value = capturedDataUrl;
  newPhotoPreview.value = capturedDataUrl;

  stopWebcam();
};

// Retake photo: clear new photo & reopen camera
const retakePhoto = () => {
  newPhoto.value = null;
  newPhotoPreview.value = "";
  startWebcam();
};

// Cancel photo changes and revert to original photo
const cancelPhotoChange = () => {
  stopWebcam();
  newPhoto.value = null;
  newPhotoPreview.value = "";
  cameraError.value = "";
  if (filePhotoInput.value) {
    filePhotoInput.value.value = "";
  }
};

// Load initial guest data and master options
const loadDetailData = async () => {
  isLoadingData.value = true;
  try {
    const [resTamu, resPegawai, resBagian] = await Promise.all([
      api.get(`/api/tamu/${route.params.id}`),
      api.get("/api/pegawai").catch(() => ({ data: { data: [] } })),
      api.get("/api/bagian").catch(() => ({ data: { data: [] } }))
    ]);

    const data = resTamu.data?.data || resTamu.data || {};
    nama.value = data.nama || "";
    alamat.value = data.alamat || "";
    jenkel.value = data.jenkel || "Laki-laki";
    no_hp.value = data.no_hp || "";
    tujuan.value = data.tujuan || "";
    nama_tujuan.value = data.nama_tujuan || "";
    keperluan.value = data.keperluan || "";
    existingPhoto.value = data.photo || "";
    existingLampiran.value = data.lampiran || data.file || null;

    pegawais.value = resPegawai.data?.data?.data || resPegawai.data?.data || [];
    bagians.value = resBagian.data?.data?.data || resBagian.data?.data || [];
  } catch (error) {
    console.error("Gagal memuat detail tamu:", error);
  } finally {
    isLoadingData.value = false;
  }
};

// Filter only active bagians or the currently selected item
const availableBagians = computed(() => {
  return bagians.value.filter(
    (b) =>
      !b.status ||
      b.status === "Aktif" ||
      String(b.status).toLowerCase() === "aktif" ||
      b.nama_bagian === tujuan.value
  );
});

// Filter only active pegawais or the currently selected item
const availablePegawais = computed(() => {
  return pegawais.value.filter(
    (p) =>
      !p.status ||
      p.status === "Aktif" ||
      String(p.status).toLowerCase() === "aktif" ||
      p.nama === nama_tujuan.value
  );
});

// Submit updated data
const updateTamu = async () => {
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
    formData.append("_method", "PATCH");

    // Only append new photo if user updated it
    if (newPhoto.value) {
      if (typeof newPhoto.value === "string" && newPhoto.value.startsWith("data:image")) {
        const photoBlob = dataURLToBlob(newPhoto.value);
        if (photoBlob) {
          formData.append("photo", photoBlob, "foto_tamu.jpg");
        }
      } else {
        formData.append("photo", newPhoto.value);
      }
    }

    // Only append new file if selected
    if (newFile.value) {
      formData.append("file", newFile.value);
    }

    await api.post(`/api/tamu/${route.params.id}`, formData);

    stopWebcam();
    router.push({ path: "/tamu" });
  } catch (error) {
    if (error.response && error.response.data) {
      errors.value = error.response.data;
    } else {
      console.error("Gagal memperbarui data tamu:", error);
    }
  } finally {
    isSubmitting.value = false;
  }
};

onMounted(() => {
  loadDetailData();
});

onBeforeUnmount(() => {
  stopWebcam();
});
</script>

<template>
  <div class="py-4 container-fluid edit-tamu-container">
    <!-- Top Breadcrumb & Page Header Card -->
    <div class="card border-0 shadow-sm mb-4 page-header-card">
      <div class="card-body p-3 p-sm-4">
        <h4 class="mb-1 fw-bold header-title-text">Ubah Data Tamu</h4>
        <p class="header-subtitle-text mb-0">
          Perbarui identitas, tujuan kunjungan, foto presensi, atau lampiran dokumen tamu.
        </p>
      </div>
    </div>

    <!-- Loading Skeleton / Spinner State -->
    <div v-if="isLoadingData" class="card border-0 shadow-sm p-5 text-center my-4">
      <div class="spinner-border text-primary mx-auto mb-3" role="status"></div>
      <h6 class="fw-bold text-slate-800">Memuat Detail Data Tamu...</h6>
      <p class="text-slate-400 text-xs mb-0">Mohon tunggu sebentar, data sedang diambil dari server.</p>
    </div>

    <!-- Main Form Grid -->
    <div v-else class="row g-3 g-lg-4">
      <!-- Left Column: Identitas & Tujuan -->
      <div class="col-lg-6 mb-3 mb-lg-4">
        <!-- Identitas Tamu Card -->
        <div class="card modern-form-card border-0 shadow-sm mb-3 mb-lg-4">
          <div class="card-header bg-white border-0 pb-0 pt-4 px-4">
            <div class="d-flex align-items-center gap-2">
              <div class="header-icon-circle bg-blue-light text-primary">
                <i class="fas fa-user-edit"></i>
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
                  <small class="text-slate-400 text-xs">Surat tugas, undangan, atau berkas pendukung</small>
                </div>
              </div>
              <span v-if="existingLampiran" class="badge-status-pill badge-active">
                <i class="fas fa-check-circle me-1"></i> Ada Berkas
              </span>
              <span v-else class="badge-status-pill badge-neutral">
                Tidak Ada Berkas
              </span>
            </div>
          </div>

          <div class="card-body px-4 pt-3 pb-4">
            <!-- Existing Attachment Box (Mobile-Responsive & Overflow-Safe) -->
            <div v-if="existingLampiran" class="existing-lampiran-box p-3 rounded-3 mb-3">
              <div class="lampiran-inner-row">
                <div class="lampiran-file-info">
                  <div class="lampiran-icon-wrap">
                    <i :class="[getFileInfo(existingLampiran).icon, getFileInfo(existingLampiran).color, 'fa-2x']"></i>
                  </div>
                  <div class="lampiran-meta-wrap">
                    <span class="lampiran-title" :title="getFilename(existingLampiran)">
                      {{ getFilename(existingLampiran) }}
                    </span>
                    <span class="lampiran-badge">
                      {{ getFileInfo(existingLampiran).label }}
                    </span>
                  </div>
                </div>

                <div class="lampiran-btn-wrap">
                  <a
                    :href="resolveLampiranUrl(existingLampiran)"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="btn-buka-file"
                    title="Buka atau Unduh Berkas Lampiran"
                  >
                    <i class="fas fa-external-link-alt me-1"></i> Buka File
                  </a>
                </div>
              </div>
            </div>

            <!-- New Attachment Input -->
            <div class="mb-2">
              <label class="form-label text-xs fw-bold text-slate-700">
                {{ existingLampiran ? 'Ganti dengan File Baru (Opsional)' : 'Unggah File Lampiran (Opsional)' }}
              </label>
              <input
                type="file"
                ref="newFileInput"
                class="form-control modern-input"
                @change="handleFileChange('file', $event)"
              />
              <div v-if="newFile" class="text-success text-xs mt-1 d-flex align-items-center flex-wrap">
                <i class="fas fa-check me-1"></i> File baru terpilih: <b class="ms-1 text-truncate" style="max-width: 250px;">{{ newFile.name }}</b>
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
                <small class="text-slate-400 text-xs">Bukti presensi visual kedatangan</small>
              </div>
            </div>

            <!-- Status Badge -->
            <span v-if="isCameraActive" class="badge-status-pill badge-camera-live">
              <span class="live-dot me-1"></span> Kamera Live
            </span>
            <span v-else-if="newPhoto" class="badge-status-pill badge-new-photo">
              <i class="fas fa-check-circle me-1 text-success"></i> Foto Baru Siap
            </span>
            <span v-else-if="existingPhoto" class="badge-status-pill badge-active">
              <i class="fas fa-check-circle me-1"></i> Foto Terdaftar
            </span>
            <span v-else class="badge-status-pill badge-neutral">
              Belum Ada Foto
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
                  <i class="fas fa-camera me-2"></i> Ambil Foto Baru
                </button>
                <button
                  type="button"
                  @click="stopWebcam"
                  class="photo-action-btn btn-outline-danger"
                >
                  <i class="fas fa-times me-2"></i> Batal / Matikan
                </button>
              </div>
              <small class="text-slate-400 d-block text-xxs mt-1">
                Kamera akan otomatis mati setelah foto diambil untuk menjaga laptop/HP tidak panas.
              </small>
            </div>

            <!-- View Mode 2: New Photo Replacement Preview -->
            <div v-else-if="newPhoto" class="photo-preview-box text-center">
              <div class="photo-container mb-3 position-relative">
                <img :src="newPhotoPreview" class="img-fluid rounded-3 photo-img" alt="Foto Baru Tamu" />
                <div class="photo-badge-overlay">
                  <i class="fas fa-check-circle text-success me-1"></i> Foto Baru Terpilih
                </div>
              </div>

              <!-- Tanda ceklis persis seperti pada ubah lampiran -->
              <div class="text-success text-xs fw-semibold mb-3 d-flex align-items-center justify-content-center flex-wrap gap-1">
                <i class="fas fa-check me-1"></i>
                <span>Foto baru terpilih:</span>
                <b class="text-truncate" style="max-width: 250px;">{{ newPhotoSourceName }}</b>
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
                  <i class="fas fa-folder-open me-1"></i> Ganti File Lain
                </button>
                <button
                  type="button"
                  @click="cancelPhotoChange"
                  class="photo-action-btn btn-outline-danger"
                  title="Batalkan penggantian dan gunakan foto asli yang tersimpan"
                >
                  <i class="fas fa-undo me-1"></i> Batalkan & Gunakan Foto Lama
                </button>
              </div>
              <small class="text-emerald fw-semibold d-block text-xxs mt-1">
                Foto baru siap disimpan saat Anda menekan tombol "Simpan Perubahan".
              </small>
            </div>

            <!-- View Mode 3: Existing Photo Display with Change Controls -->
            <div v-else-if="existingPhoto" class="existing-photo-view text-center">
              <div class="photo-container mb-3 position-relative">
                <img
                  :src="resolvePhotoUrl(existingPhoto)"
                  class="img-fluid rounded-3 photo-img"
                  alt="Foto Tamu Terdaftar"
                />
                <div class="photo-badge-overlay">
                  <i class="fas fa-id-badge me-1"></i> Foto Tamu Saat Ini
                </div>
              </div>

              <!-- Action Buttons to Trigger Photo Change -->
              <div class="d-flex justify-content-center flex-wrap gap-2 mb-2">
                <button
                  type="button"
                  @click="startWebcam"
                  :disabled="cameraLoading"
                  class="photo-action-btn btn-primary"
                >
                  <span v-if="cameraLoading" class="spinner-border spinner-border-sm me-2" role="status"></span>
                  <i v-if="!cameraLoading" class="fas fa-camera me-2"></i>
                  {{ cameraLoading ? 'Menghubungkan...' : 'Ganti Foto (Kamera)' }}
                </button>
                <button
                  type="button"
                  @click="$refs.filePhotoInput.click()"
                  class="photo-action-btn btn-cancel"
                >
                  <i class="fas fa-upload me-2"></i> Unggah Foto Baru
                </button>
              </div>
              <small class="text-slate-400 d-block text-xxs mt-1">
                Jika foto tidak diubah, foto yang tersimpan saat ini akan tetap dipertahankan.
              </small>
            </div>

            <!-- View Mode 4: No Photo Exists Yet -->
            <div v-else class="camera-idle-placeholder text-center p-4 rounded-3 mb-3">
              <div class="camera-icon-wrapper mx-auto mb-2">
                <i class="fas fa-user-circle fa-2x text-primary"></i>
              </div>
              <h6 class="text-slate-800 fw-bold mb-1 text-sm">Belum Ada Foto Tamu</h6>
              <p class="text-slate-400 text-xxs mb-3">
                Ambil foto menggunakan webcam atau unggah file foto dari perangkat.
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
                  <i class="fas fa-upload me-2"></i> Unggah Foto
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
          <router-link :to="{ name: 'Data Tamu' }" class="btn-cancel w-40 py-2 rounded-3 text-center">
            <i class="fas fa-times me-1 text-danger"></i> Batal
          </router-link>
          <button
            type="button"
            @click="updateTamu"
            :disabled="isSubmitting"
            class="btn-primary-gradient text-white border-0 w-60 py-2 rounded-3 shadow-sm d-flex align-items-center justify-content-center fw-semibold text-sm"
          >
            <span v-if="isSubmitting" class="spinner-border spinner-border-sm me-2" role="status"></span>
            <i v-if="!isSubmitting" class="fas fa-save me-2"></i>
            {{ isSubmitting ? 'Menyimpan...' : 'Simpan' }}
          </button>
        </div>

        <!-- Desktop Bottom Action Bar (Identik seperti di Tambah Tamu) -->
        <div class="d-none d-sm-flex justify-content-end align-items-center gap-2 mt-3 mb-4">
          <router-link :to="{ name: 'Data Tamu' }" class="btn-cancel px-4 py-2 rounded-3 text-sm">
            <i class="fas fa-times me-1 text-danger"></i> Batal
          </router-link>
          <button
            type="button"
            @click="updateTamu"
            :disabled="isSubmitting"
            class="btn-primary-gradient text-white border-0 px-4 py-2 rounded-3 shadow-sm d-flex align-items-center fw-semibold text-sm"
          >
            <span v-if="isSubmitting" class="spinner-border spinner-border-sm me-2" role="status"></span>
            <i v-if="!isSubmitting" class="fas fa-save me-2"></i>
            {{ isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan' }}
          </button>
        </div>

      </div>
    </div>
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

/* Lampiran preview (Strict Overflow Protection) */
.existing-lampiran-box {
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  max-width: 100%;
  overflow: hidden;
  box-sizing: border-box;
}

.lampiran-inner-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
}

.lampiran-file-info {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  flex: 1 1 auto;
  overflow: hidden;
}

.lampiran-icon-wrap {
  width: 44px;
  height: 44px;
  background: #ffffff;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  flex-shrink: 0;
}

.lampiran-meta-wrap {
  min-width: 0;
  flex: 1 1 auto;
  overflow: hidden;
}

.lampiran-title {
  display: block;
  font-weight: 700;
  color: #1e293b;
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.lampiran-badge {
  display: inline-block;
  background-color: #f1f5f9;
  color: #475569;
  font-size: 10px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
  margin-top: 4px;
  white-space: nowrap;
}

.lampiran-btn-wrap {
  flex-shrink: 0;
}

.btn-buka-file {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 7px 14px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  color: #2563eb !important;
  background-color: #eff6ff;
  border: 1px solid #bfdbfe;
  text-decoration: none;
  transition: all 0.2s ease;
  white-space: nowrap;
  min-height: 36px;
}

.btn-buka-file:hover {
  background-color: #2563eb;
  color: #ffffff !important;
  border-color: #2563eb;
  box-shadow: 0 2px 6px rgba(37, 99, 235, 0.2);
}

@media (max-width: 575.98px) {
  .lampiran-inner-row {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }
  .lampiran-btn-wrap {
    width: 100%;
  }
  .btn-buka-file {
    width: 100%;
  }
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
</style>
