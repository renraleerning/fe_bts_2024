<script setup>
/* eslint-disable */
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import api from "@/api";
import Swal from "sweetalert2";

const props = defineProps({
  event: {
    type: Object,
    required: true
  }
});

// Auth state check
const isLoggedIn = computed(() => !!localStorage.getItem("token"));

// Form state
const nama = ref("");
const no_hp = ref("");
const jenkel = ref("Laki-laki");
const customData = ref({});
const photo = ref("");
const signature = ref("");
const errors = ref({});
const isSubmitting = ref(false);
const showSuccessModal = ref(false);

// Pegawai Autocomplete State
const nip = ref("");
const jabatanAutofill = ref("");
const pegawaiSuggestions = ref([]);
const showSuggestions = ref(false);
const isSearchingPegawai = ref(false);
let pegawaiSearchTimer = null;

const isPegawaiEvent = computed(() => props.event?.target_peserta === 'pegawai');
const showNipField = computed(() => isPegawaiEvent.value && (props.event?.employee_fields || ['nip']).includes('nip'));
const showJabatanField = computed(() => isPegawaiEvent.value && (props.event?.employee_fields || []).includes('jabatan'));
const showNoHpField = computed(() => {
  if (!isPegawaiEvent.value) return true;
  return (props.event?.employee_fields || []).includes('no_hp');
});
const showJenkelField = computed(() => {
  if (!isPegawaiEvent.value) return true;
  return (props.event?.employee_fields || []).includes('jenkel');
});

const searchPegawai = async (val) => {
  if (!isPegawaiEvent.value) return;
  clearTimeout(pegawaiSearchTimer);
  if (!val || val.length < 2) {
    pegawaiSuggestions.value = [];
    showSuggestions.value = false;
    return;
  }
  isSearchingPegawai.value = true;
  pegawaiSearchTimer = setTimeout(async () => {
    try {
      const res = await api.get(`/api/pegawai-autocomplete?q=${encodeURIComponent(val)}`);
      pegawaiSuggestions.value = res.data?.data || [];
      showSuggestions.value = pegawaiSuggestions.value.length > 0;
    } catch (e) {
      pegawaiSuggestions.value = [];
    } finally {
      isSearchingPegawai.value = false;
    }
  }, 300);
};

const selectPegawai = (p) => {
  nama.value = p.nama;
  nip.value = p.nip || '';
  jabatanAutofill.value = p.jabatan || '';
  if (p.no_hp) {
    no_hp.value = p.no_hp;
  }
  if (p.jabatan) {
    customData.value['jabatan'] = p.jabatan;
  }
  pegawaiSuggestions.value = [];
  showSuggestions.value = false;
};

const onNamaInput = (e) => {
  const val = e.target.value;
  nama.value = val;
  // Reset NIP/jabatan jika nama diketik manual (bukan pilih dari autocomplete)
  nip.value = '';
  jabatanAutofill.value = '';
  searchPegawai(val);
};

const hideSuggestions = () => {
  setTimeout(() => { showSuggestions.value = false; }, 200);
};

// Auto-reset countdown
const countdown = ref(5);
let countdownTimer = null;

// Signature Pad state & methods
const signatureCanvas = ref(null);
const isDrawing = ref(false);
const hasSignature = ref(false);
let sigCtx = null;

const initSignaturePad = () => {
  if (!signatureCanvas.value) return;
  const c = signatureCanvas.value;
  // Set real canvas pixel dimensions
  const rect = c.getBoundingClientRect();
  c.width = rect.width > 0 ? rect.width : 500;
  c.height = 180;
  sigCtx = c.getContext("2d");
  sigCtx.lineWidth = 2.5;
  sigCtx.lineCap = "round";
  sigCtx.lineJoin = "round";
  sigCtx.strokeStyle = "#1e293b"; // Dark slate
};

const getCanvasPos = (evt) => {
  if (!signatureCanvas.value) return { x: 0, y: 0 };
  const rect = signatureCanvas.value.getBoundingClientRect();
  const clientX = evt.touches ? evt.touches[0].clientX : evt.clientX;
  const clientY = evt.touches ? evt.touches[0].clientY : evt.clientY;
  return {
    x: clientX - rect.left,
    y: clientY - rect.top
  };
};

const startDrawing = (e) => {
  if (!sigCtx) initSignaturePad();
  isDrawing.value = true;
  const pos = getCanvasPos(e);
  sigCtx.beginPath();
  sigCtx.moveTo(pos.x, pos.y);
};

const draw = (e) => {
  if (!isDrawing.value || !sigCtx) return;
  e.preventDefault(); // Prevent page scroll on touch
  const pos = getCanvasPos(e);
  sigCtx.lineTo(pos.x, pos.y);
  sigCtx.stroke();
  hasSignature.value = true;
  if (errors.value.signature) {
    delete errors.value.signature;
  }
};

const stopDrawing = () => {
  if (!isDrawing.value) return;
  isDrawing.value = false;
  if (hasSignature.value && signatureCanvas.value) {
    signature.value = signatureCanvas.value.toDataURL("image/png");
  }
};

const clearSignature = () => {
  if (!signatureCanvas.value || !sigCtx) return;
  sigCtx.clearRect(0, 0, signatureCanvas.value.width, signatureCanvas.value.height);
  hasSignature.value = false;
  signature.value = "";
};

onMounted(() => {
  setTimeout(() => {
    if (props.event?.require_signature) {
      initSignaturePad();
    }
  }, 300);
});

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

// Camera states
const video = ref(null);
const canvas = ref(null);
const mediaStream = ref(null);
const isCameraActive = ref(false);
const cameraLoading = ref(false);
const cameraError = ref("");
const filePhotoInput = ref(null);

// Start Webcam
const startWebcam = async () => {
  cameraError.value = "";
  cameraLoading.value = true;
  photo.value = "";

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: "user"
      },
      audio: false
    });

    mediaStream.value = stream;
    isCameraActive.value = true;

    setTimeout(() => {
      if (video.value) {
        video.value.srcObject = stream;
        video.value.play().catch((err) => {
          console.warn("Video play error:", err);
        });
      }
    }, 100);
  } catch (err) {
    console.error("Camera access error:", err);
    cameraError.value =
      "Tidak dapat mengakses kamera. Pastikan izin kamera telah diberikan atau gunakan tombol Unggah Foto.";
    isCameraActive.value = false;
  } finally {
    cameraLoading.value = false;
  }
};

// Stop Webcam
const stopWebcam = () => {
  if (mediaStream.value) {
    mediaStream.value.getTracks().forEach((track) => track.stop());
    mediaStream.value = null;
  }
  isCameraActive.value = false;
};

// Capture Photo from Webcam
const capturePhoto = () => {
  if (!video.value || !canvas.value) return;

  const v = video.value;
  const c = canvas.value;

  c.width = v.videoWidth || 640;
  c.height = v.videoHeight || 480;

  const ctx = c.getContext("2d");
  // Mirror preview effect
  ctx.translate(c.width, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(v, 0, 0, c.width, c.height);

  photo.value = c.toDataURL("image/jpeg", 0.85);
  stopWebcam();
};

// Handle file upload
const handleFileUpload = (e) => {
  const file = e.target.files[0];
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    Swal.fire({
      icon: "warning",
      title: "File Tidak Valid",
      text: "Harap pilih file gambar (JPG / PNG)."
    });
    return;
  }

  stopWebcam();
  const reader = new FileReader();
  reader.onload = (event) => {
    photo.value = event.target.result;
  };
  reader.readAsDataURL(file);
};

// Data URL to Blob Helper
const dataURLToBlob = (dataURL) => {
  try {
    const parts = dataURL.split(";base64,");
    const contentType = parts[0].split(":")[1];
    const raw = window.atob(parts[1]);
    const uInt8Array = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; ++i) {
      uInt8Array[i] = raw.charCodeAt(i);
    }
    return new Blob([uInt8Array], { type: contentType });
  } catch (e) {
    return null;
  }
};

// Submit Event Attendance
const submitEventAttendance = async () => {
  isSubmitting.value = true;
  errors.value = {};

  // Check required custom fields
  const fields = props.event.fields || [];
  for (const f of fields) {
    if (f.required && !customData.value[f.label]) {
      errors.value[f.label] = `${f.label} wajib diisi.`;
    }
  }

  if (!nama.value.trim()) {
    errors.value["nama"] = "Nama lengkap wajib diisi.";
  }

  // Validasi Tanda Tangan jika diwajibkan oleh event
  if (props.event?.require_signature && (!hasSignature.value || !signature.value)) {
    errors.value["signature"] = "Tanda tangan wajib dibubuhkan.";
  }

  if (Object.keys(errors.value).length > 0) {
    isSubmitting.value = false;
    Swal.fire({
      icon: "warning",
      title: "Mohon Lengkapi Isian",
      text: errors.value["signature"]
        ? "Mohon bubuhkan tanda tangan digital Anda pada kolom yang disediakan."
        : "Harap periksa kembali kolom yang bertanda bintang merah (*)."
    });
    return;
  }

  try {
    const formData = new FormData();
    formData.append("event_id", props.event.id);
    formData.append("nama", nama.value.trim());
    formData.append("no_hp", no_hp.value.trim());
    formData.append("jenkel", jenkel.value);
    formData.append("data_custom", JSON.stringify(customData.value));

    // Append NIP untuk event pegawai
    if (isPegawaiEvent.value && nip.value) {
      formData.append("nip", nip.value);
    }

    // Persistent Device Identifier untuk validasi perangkat
    let deviceId = localStorage.getItem("bts_device_identifier");
    if (!deviceId) {
      deviceId = "dev_" + Math.random().toString(36).substring(2, 10) + "_" + Date.now();
      localStorage.setItem("bts_device_identifier", deviceId);
    }
    formData.append("device_id", deviceId);

    if (photo.value && photo.value.startsWith("data:image")) {
      const blob = dataURLToBlob(photo.value);
      if (blob) {
        formData.append("photo", blob, "foto_event.jpg");
      }
    }

    if (signature.value) {
      formData.append("signature", signature.value);
    }

    await api.post("/api/tamu-event", formData);

    stopWebcam();
    showSuccessModal.value = true;
    startCountdown();
  } catch (err) {
    console.error(err);
    const msg = err.response?.data?.message || "Terjadi kesalahan saat menyimpan presensi event.";
    const isDuplicate = err.response?.status === 422 && (msg.includes("sudah pernah") || msg.includes("berkesempatan mengisi satu kali"));

    Swal.fire({
      icon: isDuplicate ? "info" : "error",
      title: isDuplicate ? "Presensi Sudah Tercatat" : "Gagal Mengirim",
      text: msg,
      confirmButtonText: "Mengerti",
      confirmButtonColor: "#2563eb"
    });
  } finally {
    isSubmitting.value = false;
  }
};

// Reset Form
const resetForm = () => {
  stopCountdown();
  nama.value = "";
  no_hp.value = "";
  nip.value = "";
  jabatanAutofill.value = "";
  jenkel.value = "Laki-laki";
  customData.value = {};
  photo.value = "";
  clearSignature();
  errors.value = {};
  showSuccessModal.value = false;
  stopWebcam();
  window.scrollTo({ top: 0, behavior: "smooth" });
};

// Flyer Preview Modal State
const showFlyerModal = ref(false);

const getBannerUrl = (bannerPath) => {
  if (!bannerPath) return "";
  if (bannerPath.startsWith("http://") || bannerPath.startsWith("https://")) {
    return bannerPath;
  }
  const base = api.defaults.baseURL || "http://localhost:8000";
  return `${base}/storage/event_banner/${bannerPath}`;
};

onMounted(() => {
  // If require photo is true, optionally prompt webcam
});

onBeforeUnmount(() => {
  stopCountdown();
  stopWebcam();
});
</script>

<template>
  <div class="event-presensi-wrapper">
    <!-- Event School Hero Banner (Tidak Terpotong) -->
    <div class="card border-0 shadow-sm mb-4 rounded-4 overflow-hidden event-hero-banner text-white">
      <div class="card-body p-4 p-md-5 position-relative">
        <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-4">
          <div class="d-flex align-items-center gap-3 gap-md-4 flex-wrap flex-sm-nowrap">
            <!-- Poster Flyer Event (Proporsional, Bebas Potong) -->
            <div
              v-if="event.banner"
              class="hero-flyer-poster-card flex-shrink-0 cursor-pointer shadow-sm"
              @click="showFlyerModal = true"
              title="Klik untuk melihat foto flyer lengkap"
            >
              <img :src="getBannerUrl(event.banner)" class="hero-flyer-poster-img" alt="Flyer Event" />
              <div class="flyer-zoom-badge">
                <i class="fas fa-search-plus"></i> Lihat Flyer
              </div>
            </div>

            <div>
              <div class="d-flex align-items-center gap-2 flex-wrap mb-2">
                <span class="badge bg-white text-primary text-xxs font-weight-bold px-3 py-1-5 rounded-pill shadow-xs">
                  ✨ PRESENSI EVENT AKTIF
                </span>
                <span v-if="event.lokasi" class="text-white-50 text-xs">
                  <i class="fas fa-map-marker-alt me-1 text-danger"></i> {{ event.lokasi }}
                </span>
              </div>
              <h2 class="text-white fw-bold mb-2 event-title-heading">{{ event.nama_event }}</h2>
              <p class="text-white-50 text-sm mb-0 event-desc-text">
                {{ event.deskripsi || "Selamat datang! Silakan lengkapi presensi kehadiran kunjungan Anda pada formulir di bawah ini." }}
              </p>
            </div>
          </div>

          <div class="text-md-end flex-shrink-0">
            <!-- Jika Petugas/Admin login: Tombol kembali ke Dashboard Event -->
            <router-link
              v-if="isLoggedIn"
              to="/event"
              class="btn btn-white btn-sm rounded-pill px-3 py-2 text-xs fw-semibold text-primary shadow-xs d-inline-flex align-items-center gap-1"
            >
              <i class="fas fa-arrow-left"></i>
              <span>Kembali ke Dashboard</span>
            </router-link>

            <!-- Jika Pengunjung Publik: Tampilkan Identitas Sekolah Resmi -->
            <div v-else class="event-school-badge d-inline-flex align-items-center gap-2 px-3 py-2 rounded-pill">
              <i class="fas fa-school text-white opacity-8"></i>
              <span class="text-xs fw-semibold text-white">SMKN 2 Sumedang</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Grid Form -->
    <div class="row g-3 g-lg-4">
      <!-- Left Column: Dynamic Fields Form -->
      <div :class="event.require_photo ? 'col-lg-7' : 'col-lg-8 mx-auto'">
        <div class="card border-0 shadow-sm rounded-4 overflow-hidden">
          <div class="card-header bg-white border-0 pt-4 pb-2 px-4 d-flex justify-content-between align-items-center flex-wrap gap-2">
            <div class="d-flex align-items-center gap-2">
              <div class="icon-circle bg-blue-light text-primary">
                <i class="fas fa-id-card"></i>
              </div>
              <div>
                <h6 class="fw-bold text-slate-800 mb-0">Formulir Presensi Pengunjung</h6>
                <small class="text-slate-400 text-xs">Isi data diri Anda secara lengkap dan benar</small>
              </div>
            </div>
          </div>

          <div class="card-body px-4 pt-3 pb-4">
            <!-- ===== BAGIAN NAMA: Autocomplete untuk Pegawai, Input Biasa untuk Umum ===== -->
            <div class="mb-3">
              <label class="form-label text-xs fw-bold text-slate-700">
                {{ isPegawaiEvent ? 'Nama Pegawai' : 'Nama Lengkap' }}
                <span class="text-danger">*</span>
                <span v-if="isPegawaiEvent" class="badge bg-success text-white text-xxs ms-1 rounded-pill">
                  <i class="fas fa-search me-1"></i> Cari dari Data Pegawai
                </span>
              </label>

              <!-- Autocomplete untuk Event Pegawai -->
              <div v-if="isPegawaiEvent" class="position-relative">
                <div class="input-with-icon">
                  <i class="fas fa-user-tie input-icon text-slate-400"></i>
                  <input
                    type="text"
                    :value="nama"
                    @input="onNamaInput"
                    @blur="hideSuggestions"
                    @focus="nama.length >= 2 && searchPegawai(nama)"
                    class="form-control modern-input"
                    placeholder="Ketik nama pegawai untuk mencari..."
                    autocomplete="off"
                  />
                  <span v-if="isSearchingPegawai" class="input-loading-spinner"></span>
                </div>

                <!-- Dropdown Suggestions -->
                <div v-if="showSuggestions && pegawaiSuggestions.length > 0" class="pegawai-dropdown shadow rounded-3">
                  <div
                    v-for="(p, idx) in pegawaiSuggestions"
                    :key="idx"
                    class="pegawai-suggestion-item"
                    @mousedown.prevent="selectPegawai(p)"
                  >
                    <div class="d-flex align-items-center gap-2">
                      <div class="pegawai-avatar-mini">
                        <i class="fas fa-user-circle fa-lg text-slate-400"></i>
                      </div>
                      <div>
                        <div class="text-xs fw-bold text-slate-800">{{ p.nama }}</div>
                        <div class="text-xxs text-slate-500 d-flex gap-2">
                          <span v-if="p.nip"><i class="fas fa-id-card me-1"></i>{{ p.nip }}</span>
                          <span v-if="p.jabatan"><i class="fas fa-briefcase me-1"></i>{{ p.jabatan }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Konfirmasi Pegawai Dipilih -->
                <div v-if="nama && nip" class="mt-2 px-3 py-2 rounded-3 bg-green-light border-success border d-flex align-items-center gap-2">
                  <i class="fas fa-check-circle text-success"></i>
                  <div class="text-xs">
                    <span class="fw-bold text-slate-800">{{ nama }}</span>
                    <span v-if="nip" class="text-slate-500 ms-2">NIP: {{ nip }}</span>
                    <span v-if="jabatanAutofill" class="text-slate-500 ms-2">— {{ jabatanAutofill }}</span>
                  </div>
                </div>
              </div>

              <!-- Input Biasa untuk Event Umum -->
              <div v-else class="input-with-icon">
                <i class="fas fa-user input-icon text-slate-400"></i>
                <input
                  type="text"
                  v-model="nama"
                  class="form-control modern-input"
                  placeholder="Masukkan nama lengkap Anda"
                />
              </div>

              <small v-if="errors.nama" class="text-danger text-xxs mt-1 d-block">
                {{ errors.nama }}
              </small>
            </div>

            <!-- NIP Field (hanya untuk event pegawai dengan field NIP dipilih) -->
            <div v-if="showNipField" class="mb-3">
              <label class="form-label text-xs fw-bold text-slate-700">
                NIP <span class="text-slate-400 fw-normal">(otomatis terisi dari pilihan pegawai)</span>
              </label>
              <div class="input-with-icon">
                <i class="fas fa-id-card input-icon text-slate-400"></i>
                <input
                  type="text"
                  v-model="nip"
                  class="form-control modern-input"
                  placeholder="NIP Pegawai"
                  :readonly="!!nip"
                  :class="{ 'bg-slate-50': !!nip }"
                />
              </div>
            </div>

            <!-- Jenis Kelamin & Nomor WhatsApp (Disesuaikan dengan pilihan kolom event) -->
            <div v-if="showJenkelField || showNoHpField" class="row g-2 mb-3">
              <!-- Jenis Kelamin -->
              <div v-if="showJenkelField" :class="showNoHpField ? 'col-md-6' : 'col-12'">
                <label class="form-label text-xs fw-bold text-slate-700">Jenis Kelamin</label>
                <div class="d-flex gap-3 pt-2">
                  <div class="form-check">
                    <input
                      class="form-check-input"
                      type="radio"
                      id="eventJkL"
                      value="Laki-laki"
                      v-model="jenkel"
                    />
                    <label class="form-check-label text-xs text-slate-700" for="eventJkL">Laki-laki</label>
                  </div>
                  <div class="form-check">
                    <input
                      class="form-check-input"
                      type="radio"
                      id="eventJkP"
                      value="Perempuan"
                      v-model="jenkel"
                    />
                    <label class="form-check-label text-xs text-slate-700" for="eventJkP">Perempuan</label>
                  </div>
                </div>
              </div>

              <!-- Nomor WhatsApp / HP -->
              <div v-if="showNoHpField" :class="showJenkelField ? 'col-md-6' : 'col-12'">
                <label class="form-label text-xs fw-bold text-slate-700">
                  Nomor WhatsApp / HP
                </label>
                <div class="input-with-icon">
                  <i class="fab fa-whatsapp input-icon text-success"></i>
                  <input
                    type="tel"
                    v-model="no_hp"
                    class="form-control modern-input"
                    placeholder="Contoh: 08123456789"
                  />
                </div>
              </div>
            </div>

            <!-- Dynamic Custom Fields from Event Schema -->
            <div
              v-for="(field, index) in event.fields || []"
              :key="'field-' + index"
              class="mb-3"
            >
              <label class="form-label text-xs fw-bold text-slate-700">
                {{ field.label }} <span v-if="field.required" class="text-danger">*</span>
              </label>

              <!-- Type 1: Text -->
              <input
                v-if="field.type === 'text'"
                type="text"
                v-model="customData[field.label]"
                :placeholder="field.placeholder || ('Masukkan ' + field.label)"
                class="form-control modern-input"
              />

              <!-- Type 2: Select Dropdown -->
              <select
                v-else-if="field.type === 'select'"
                v-model="customData[field.label]"
                class="form-select modern-input"
              >
                <option value="" disabled selected>:: Pilih {{ field.label }} ::</option>
                <option
                  v-for="(opt, optIdx) in field.options || []"
                  :key="optIdx"
                  :value="opt"
                >
                  {{ opt }}
                </option>
              </select>

              <!-- Type 3: Textarea -->
              <textarea
                v-else-if="field.type === 'textarea'"
                v-model="customData[field.label]"
                :placeholder="field.placeholder || ('Tuliskan ' + field.label)"
                rows="3"
                class="form-control modern-input"
              ></textarea>

              <small v-if="errors[field.label]" class="text-danger text-xxs mt-1 d-block">
                {{ errors[field.label] }}
              </small>
            </div>

            <!-- Tanda Tangan Digital (Jika Diwajibkan oleh Event) -->
            <div v-if="event.require_signature" class="mb-4 mt-3 pt-2 border-top">
              <div class="d-flex justify-content-between align-items-center mb-2">
                <label class="form-label text-xs fw-bold text-slate-800 mb-0 d-flex align-items-center gap-1">
                  <i class="fas fa-signature text-primary"></i>
                  <span>Tanda Tangan Pengunjung</span>
                  <span class="text-danger">*</span>
                </label>
                <button
                  type="button"
                  @click="clearSignature"
                  class="btn btn-xs btn-outline-danger rounded-pill px-2-5 py-1"
                  title="Hapus goresan tanda tangan"
                >
                  <i class="fas fa-eraser me-1"></i> Hapus / Ulangi
                </button>
              </div>

              <!-- Canvas Drawing Area -->
              <div
                class="signature-canvas-wrapper rounded-3 position-relative"
                :class="{ 'border-danger': errors.signature, 'has-sig': hasSignature }"
              >
                <canvas
                  ref="signatureCanvas"
                  class="signature-pad-canvas w-100"
                  @mousedown="startDrawing"
                  @mousemove="draw"
                  @mouseup="stopDrawing"
                  @mouseleave="stopDrawing"
                  @touchstart.passive="startDrawing"
                  @touchmove="draw"
                  @touchend="stopDrawing"
                ></canvas>

                <!-- Placeholder Hint -->
                <div v-if="!hasSignature" class="signature-hint-watermark">
                  <i class="fas fa-pen-nib me-1 opacity-6"></i>
                  <span>Bubuhkan tanda tangan Anda di sini (Gunakan Jari atau Mouse)</span>
                </div>
              </div>

              <small v-if="errors.signature" class="text-danger text-xxs mt-1 d-block fw-semibold">
                <i class="fas fa-exclamation-circle me-1"></i>{{ errors.signature }}
              </small>
              <small v-else class="text-slate-400 text-xxs mt-1 d-block">
                Tanda tangan ini akan dicatat sebagai bukti kehadiran resmi pada kegiatan ini.
              </small>
            </div>

            <!-- Submit Button (Jika tanpa foto) -->
            <div v-if="!event.require_photo" class="mt-4 pt-2">
              <button
                type="button"
                @click="submitEventAttendance"
                :disabled="isSubmitting"
                class="btn-primary-gradient text-white border-0 w-100 py-3 rounded-3 fw-bold text-sm shadow-sm d-flex align-items-center justify-content-center gap-2"
              >
                <span v-if="isSubmitting" class="spinner-border spinner-border-sm" role="status"></span>
                <i v-if="!isSubmitting" class="fas fa-paper-plane"></i>
                {{ isSubmitting ? "Mengirim Presensi..." : "Kirim Presensi Kehadiran" }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Column: Webcam / Selfie (Jika Event Mengaktifkan Foto) -->
      <div v-if="event.require_photo" class="col-lg-5">
        <div class="card border-0 shadow-sm rounded-4 overflow-hidden mb-3">
          <div class="card-header bg-white border-0 pt-4 pb-2 px-4 d-flex justify-content-between align-items-center">
            <div class="d-flex align-items-center gap-2">
              <div class="icon-circle bg-purple-light text-purple">
                <i class="fas fa-camera"></i>
              </div>
              <div>
                <h6 class="fw-bold text-slate-800 mb-0">Foto Selfie Pengunjung</h6>
                <small class="text-slate-400 text-xs">Kenang-kenangan kehadiran di event</small>
              </div>
            </div>

            <span v-if="photo" class="badge bg-success text-white text-xxs rounded-pill">
              <i class="fas fa-check me-1"></i> Foto Siap
            </span>
            <span v-else-if="isCameraActive" class="badge bg-danger text-white text-xxs rounded-pill">
              🔴 Live Kamera
            </span>
          </div>

          <div class="card-body px-4 pt-2 pb-4 text-center">
            <!-- Hidden Canvas & File Input -->
            <canvas ref="canvas" style="display: none;"></canvas>
            <input
              type="file"
              ref="filePhotoInput"
              accept="image/*"
              class="d-none"
              @change="handleFileUpload"
            />

            <!-- Error message -->
            <div v-if="cameraError" class="alert alert-warning text-dark text-xs py-2 px-3 rounded-3 mb-3">
              {{ cameraError }}
            </div>

            <!-- View 1: Live Webcam Feed -->
            <div v-if="isCameraActive" class="camera-stream-box mb-3">
              <div class="position-relative">
                <video ref="video" class="camera-video-feed" autoplay playsinline muted></video>
              </div>
              <div class="d-flex justify-content-center gap-2 mt-3">
                <button type="button" @click="capturePhoto" class="btn btn-primary btn-sm rounded-pill px-4">
                  <i class="fas fa-camera me-1"></i> Jepret Foto
                </button>
                <button type="button" @click="stopWebcam" class="btn btn-light btn-sm rounded-pill px-3">
                  Batal
                </button>
              </div>
            </div>

            <!-- View 2: Photo Captured Preview -->
            <div v-else-if="photo" class="photo-preview-box mb-3">
              <img :src="photo" class="img-captured rounded-3 shadow-sm mb-3" alt="Foto Tamu" />
              <div class="d-flex justify-content-center gap-2">
                <button type="button" @click="startWebcam" class="btn btn-outline-primary btn-xs rounded-pill">
                  <i class="fas fa-redo me-1"></i> Foto Ulang
                </button>
                <button type="button" @click="photo = ''" class="btn btn-outline-danger btn-xs rounded-pill">
                  <i class="fas fa-trash me-1"></i> Hapus
                </button>
              </div>
            </div>

            <!-- View 3: Idle Placeholder -->
            <div v-else class="camera-idle-placeholder p-4 rounded-3 border border-dashed mb-3">
              <div class="avatar-placeholder-circle mx-auto mb-2">
                <i class="fas fa-user-circle fa-3x text-slate-300"></i>
              </div>
              <h6 class="text-xs fw-bold text-slate-700 mb-1">Ambil Foto Selfie</h6>
              <p class="text-xxs text-slate-400 mb-3">
                Ambil foto menggunakan kamera perangkat Anda atau unggah file foto.
              </p>
              <div class="d-flex justify-content-center flex-wrap gap-2">
                <button
                  type="button"
                  @click="startWebcam"
                  :disabled="cameraLoading"
                  class="btn btn-primary btn-sm rounded-pill px-3"
                >
                  <span v-if="cameraLoading" class="spinner-border spinner-border-sm me-1" role="status"></span>
                  <i v-if="!cameraLoading" class="fas fa-camera me-1"></i>
                  {{ cameraLoading ? "Menghubungkan..." : "Buka Kamera" }}
                </button>
                <button
                  type="button"
                  @click="$refs.filePhotoInput.click()"
                  class="btn btn-outline-secondary btn-sm rounded-pill px-3"
                >
                  <i class="fas fa-upload me-1"></i> Unggah File
                </button>
              </div>
            </div>

            <!-- Submit Button (Jika dengan foto) -->
            <button
              type="button"
              @click="submitEventAttendance"
              :disabled="isSubmitting"
              class="btn-primary-gradient text-white border-0 w-100 py-3 rounded-3 fw-bold text-sm shadow-sm d-flex align-items-center justify-content-center gap-2 mt-2"
            >
              <span v-if="isSubmitting" class="spinner-border spinner-border-sm" role="status"></span>
              <i v-if="!isSubmitting" class="fas fa-paper-plane"></i>
              {{ isSubmitting ? "Mengirim Presensi..." : "Kirim Presensi Kehadiran" }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Celebration Success Modal -->
    <transition name="fade">
      <div v-if="showSuccessModal" class="custom-modal-backdrop">
        <div class="modal-card-celebration shadow-lg animate-scale-up text-center p-4 p-sm-5 rounded-4 bg-white">
          <div class="celebration-badge-circle mx-auto mb-3">
            <i class="fas fa-check fa-2x text-white"></i>
          </div>
          <h4 class="fw-bold text-slate-900 mb-1">Presensi Berhasil Dicatat!</h4>
          <p class="text-slate-500 text-sm mb-3">
            Terima kasih, <strong>{{ nama }}</strong>.<br />
            Kehadiran Anda di event <strong>{{ event.nama_event }}</strong> telah resmi tersimpan.
          </p>

          <div class="p-3 bg-slate-50 rounded-3 text-start mb-4 text-xs">
            <div class="d-flex justify-content-between mb-1">
              <span class="text-slate-500">Nama Pengunjung:</span>
              <span class="fw-bold text-slate-800">{{ nama }}</span>
            </div>
            <div v-if="event.lokasi" class="d-flex justify-content-between mb-1">
              <span class="text-slate-500">Lokasi:</span>
              <span class="fw-semibold text-slate-700">{{ event.lokasi }}</span>
            </div>
            <div class="d-flex justify-content-between">
              <span class="text-slate-500">Status:</span>
              <span class="fw-bold text-success">✓ Terverifikasi Hadir</span>
            </div>
          </div>

          <button
            type="button"
            @click="resetForm"
            class="btn-primary-gradient text-white border-0 py-2-5 w-100 rounded-3 fw-bold text-sm shadow-sm d-flex align-items-center justify-content-center gap-2"
          >
            <i class="fas fa-check-circle"></i>
            <span>Selesai</span>
            <span class="badge bg-white text-primary rounded-pill px-2 py-0-5 text-xxs ms-1">({{ countdown }}s)</span>
          </button>
          <p class="text-slate-400 text-xxs mt-2 mb-0">
            Halaman akan otomatis kembali dalam {{ countdown }} detik
          </p>
        </div>
      </div>
    </transition>

    <!-- Modal Preview Flyer Penuh (Tidak Terpotong) -->
    <transition name="fade">
      <div v-if="showFlyerModal && event.banner" class="custom-modal-backdrop" @click="showFlyerModal = false">
        <div class="modal-card-flyer p-3 rounded-4 bg-white shadow-lg text-center position-relative animate-scale-up" @click.stop>
          <div class="d-flex justify-content-between align-items-center pb-2 mb-2 border-bottom">
            <h6 class="fw-bold text-slate-800 mb-0 text-xs">
              <i class="fas fa-image text-primary me-1"></i> Flyer Acara: {{ event.nama_event }}
            </h6>
            <button type="button" class="btn-close" @click="showFlyerModal = false"></button>
          </div>
          <div class="flyer-full-container">
            <img :src="getBannerUrl(event.banner)" class="img-fluid rounded-3 flyer-full-img" alt="Flyer Lengkap" />
          </div>
        </div>
      </div>
    </transition>

    <!-- Portal Link Halus untuk Petugas di Kiosk Publik -->
    <div v-if="!isLoggedIn" class="text-center py-4 mt-2">
      <router-link
        to="/signin"
        class="text-decoration-none staff-portal-link d-inline-flex align-items-center gap-2 px-3 py-1-5 rounded-pill text-xs text-slate-500"
        title="Masuk ke Sistem Resepsionis / Admin"
      >
        <i class="fas fa-shield-alt text-slate-400"></i>
        <span>Portal Petugas & Administrator</span>
      </router-link>
    </div>
  </div>
</template>

<style scoped>
.event-presensi-wrapper {
  max-width: 1260px;
  margin: 0 auto;
}

.event-hero-banner {
  background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 50%, #3b82f6 100%);
}

.event-title-heading {
  font-size: 24px;
  letter-spacing: -0.3px;
}

.icon-circle {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.bg-blue-light {
  background: #dbeafe;
}

.bg-purple-light {
  background: #f3e8ff;
}

.text-purple {
  color: #7e22ce;
}

.input-with-icon {
  position: relative;
}

.input-icon {
  position: absolute;
  top: 50%;
  left: 14px;
  transform: translateY(-50%);
  font-size: 13px;
}

.input-with-icon input {
  padding-left: 38px;
}

.modern-input {
  border: 1px solid #cbd5e1;
  border-radius: 9px;
  font-size: 13px;
  padding: 10px 14px;
  transition: all 0.2s;
}

.modern-input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
}

.btn-primary-gradient {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  transition: all 0.2s;
}

.btn-primary-gradient:hover {
  background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%);
  transform: translateY(-1px);
}

.camera-video-feed {
  width: 100%;
  max-height: 260px;
  object-fit: cover;
  border-radius: 12px;
  transform: scaleX(-1);
  background: #000;
}

.img-captured {
  width: 100%;
  max-height: 260px;
  object-fit: cover;
  border-radius: 12px;
}

.custom-modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(15, 23, 42, 0.7);
  backdrop-filter: blur(6px);
  z-index: 1200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.modal-card-celebration {
  max-width: 440px;
  width: 100%;
}

.celebration-badge-circle {
  width: 68px;
  height: 68px;
  border-radius: 50%;
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10px 20px rgba(34, 197, 94, 0.35);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.event-school-badge {
  background: rgba(255, 255, 255, 0.18);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.staff-portal-link {
  transition: all 0.2s ease;
  background: rgba(241, 245, 249, 0.85);
  border: 1px solid #e2e8f0;
}

.staff-portal-link:hover {
  background: #ffffff;
  color: #2563eb !important;
  border-color: #cbd5e1;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

/* Hero Flyer Poster Card (Proporsional 3:4, Tidak Terpotong) */
.hero-flyer-poster-card {
  width: 72px;
  height: 98px;
  border-radius: 12px;
  overflow: hidden;
  border: 2px solid rgba(255, 255, 255, 0.45);
  background: rgba(0, 0, 0, 0.25);
  position: relative;
  transition: all 0.25s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.hero-flyer-poster-card:hover {
  transform: translateY(-2px) scale(1.04);
  border-color: #ffffff;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.35);
}

.hero-flyer-poster-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.flyer-zoom-badge {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(15, 23, 42, 0.85);
  backdrop-filter: blur(4px);
  color: #ffffff;
  font-size: 8.5px;
  font-weight: 700;
  text-align: center;
  padding: 3px 0;
  letter-spacing: 0.3px;
}

/* Modal Flyer Penuh */
.modal-card-flyer {
  max-width: 540px;
  width: 100%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

.flyer-full-container {
  overflow-y: auto;
  max-height: calc(90vh - 75px);
  display: flex;
  justify-content: center;
}

.flyer-full-img {
  max-height: 80vh;
  width: auto;
  object-fit: contain;
}

/* Signature Pad Canvas Styling */
.signature-canvas-wrapper {
  background: #f8fafc;
  border: 2px dashed #cbd5e1;
  cursor: crosshair;
  transition: all 0.2s ease;
  overflow: hidden;
  height: 180px;
}

.signature-canvas-wrapper:hover {
  border-color: #3b82f6;
  background: #ffffff;
}

.signature-canvas-wrapper.has-sig {
  border-style: solid;
  border-color: #2563eb;
  background: #ffffff;
}

.signature-pad-canvas {
  height: 180px;
  display: block;
  touch-action: none; /* Crucial for touch screens */
}

.signature-hint-watermark {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
  color: #94a3b8;
  font-size: 11px;
  font-weight: 500;
  text-align: center;
  white-space: nowrap;
}

/* Pegawai Autocomplete Dropdown */
.pegawai-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  z-index: 9999;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  overflow: hidden;
  max-height: 240px;
  overflow-y: auto;
}

.pegawai-suggestion-item {
  padding: 10px 14px;
  cursor: pointer;
  border-bottom: 1px solid #f1f5f9;
  transition: background 0.15s ease;
}

.pegawai-suggestion-item:last-child {
  border-bottom: none;
}

.pegawai-suggestion-item:hover {
  background-color: #f0fdf4;
}

.pegawai-avatar-mini {
  width: 32px;
  height: 32px;
  min-width: 32px;
  border-radius: 50%;
  background: #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.input-loading-spinner {
  position: absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  width: 16px;
  height: 16px;
  border: 2px solid #e2e8f0;
  border-top-color: #2563eb;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to { transform: translateY(-50%) rotate(360deg); }
}

.bg-green-light {
  background-color: #f0fdf4 !important;
}

.border-success {
  border-color: #16a34a !important;
}

.text-success {
  color: #16a34a !important;
}
</style>
