<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import api from "../../api";

const router = useRouter();

// Form state
const nip = ref("");
const nama = ref("");
const jabatan = ref("");
const bagian = ref("");
const no_hp = ref("");
const status = ref("Aktif");
const errors = ref({});
const isSubmitting = ref(false);

const bagians = ref([]);
const jabatans = ref([]);

// Filter only active bagians and jabatans
const availableBagians = computed(() => {
  return bagians.value.filter(
    (b) => !b.status || b.status === "Aktif" || String(b.status).toLowerCase() === "aktif"
  );
});

const availableJabatans = computed(() => {
  return jabatans.value.filter(
    (j) => !j.status || j.status === "Aktif" || String(j.status).toLowerCase() === "aktif"
  );
});

// Safe error helper
const getError = (field) => {
  if (!errors.value) return null;
  const errObj = errors.value.errors || errors.value;
  if (errObj && errObj[field]) {
    return Array.isArray(errObj[field]) ? errObj[field][0] : errObj[field];
  }
  return null;
};

// Fetch master options
const fetchData = async () => {
  try {
    const [resBagian, resJabatan] = await Promise.all([
      api.get("/api/bagian?status=Aktif").catch(() => ({ data: { data: [] } })),
      api.get("/api/jabatan?status=Aktif").catch(() => ({ data: { data: [] } }))
    ]);
    bagians.value = resBagian.data?.data?.data || resBagian.data?.data || [];
    jabatans.value = resJabatan.data?.data?.data || resJabatan.data?.data || [];
  } catch (error) {
    console.error("Gagal memuat master data:", error);
  }
};

// Store pegawai
const storePegawai = async () => {
  isSubmitting.value = true;
  errors.value = {};

  try {
    let formData = new FormData();
    formData.append("nip", nip.value || "");
    formData.append("nama", nama.value || "");
    formData.append("jabatan", jabatan.value || "");
    formData.append("bagian", bagian.value || "");
    formData.append("no_hp", no_hp.value || "");
    formData.append("status", status.value || "Aktif");

    await api.post("/api/pegawai", formData);
    router.push({ path: "/pegawai" });
  } catch (error) {
    if (error.response && error.response.data) {
      errors.value = error.response.data;
    } else {
      console.error("Gagal menyimpan data pegawai:", error);
    }
  } finally {
    isSubmitting.value = false;
  }
};

onMounted(() => {
  fetchData();
});
</script>

<template>
  <div class="py-4 container-fluid form-page-container">
    <!-- Page Header Card -->
    <div class="card border-0 shadow-sm mb-4 page-header-card">
      <div class="card-body p-3 p-sm-4 d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3">
        <div>
          
          <h4 class="mb-1 fw-bold header-title-text">Tambah Data Pegawai</h4>
          <p class="header-subtitle-text mb-0">
            Daftarkan pegawai atau staf baru di lingkungan SMKN 2 Sumedang.
          </p>
        </div>

        <div class="d-flex align-items-center gap-2 header-action-buttons">
          <router-link :to="{ name: 'Data Pegawai' }" class="btn-cancel px-3 py-2 rounded-3 text-sm">
            <i class="fas fa-times me-1 text-danger"></i> Batal
          </router-link>
          <button
            type="button"
            @click="storePegawai"
            :disabled="isSubmitting"
            class="btn-primary-gradient text-white border-0 px-4 py-2 rounded-3 shadow-sm d-flex align-items-center fw-semibold text-sm"
          >
            <span v-if="isSubmitting" class="spinner-border spinner-border-sm me-2" role="status"></span>
            <i v-if="!isSubmitting" class="fas fa-save me-2"></i>
            {{ isSubmitting ? 'Menyimpan...' : 'Simpan Pegawai' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Main Form Card -->
    <div class="row justify-content-center">
      <div class="col-12 col-xl-10">
        <div class="card modern-form-card border-0 shadow-sm mb-4">
          <div class="card-header bg-white border-0 pb-0 pt-4 px-4">
            <div class="d-flex align-items-center gap-2">
              <div class="header-icon-circle bg-blue-light text-primary">
                <i class="fas fa-user-tie"></i>
              </div>
              <div>
                <h6 class="mb-0 fw-bold text-slate-900">Formulir Pegawai</h6>
                <small class="text-slate-400 text-xs">Lengkapi data NIP, identitas, bagian, dan jabatan</small>
              </div>
            </div>
          </div>

          <div class="card-body px-4 pt-3 pb-4">
            <form @submit.prevent="storePegawai">
              <!-- NIP & Nama -->
              <div class="row g-3 mb-3">
                <div class="col-md-6">
                  <label class="form-label text-xs fw-bold text-slate-700">
                    NIP (Nomor Induk Pegawai) <span class="text-danger">*</span>
                  </label>
                  <div class="input-with-icon">
                    <i class="fas fa-id-card input-icon text-slate-400"></i>
                    <input
                      type="text"
                      class="form-control modern-input"
                      v-model="nip"
                      placeholder="Masukkan NIP pegawai"
                    />
                  </div>
                  <div v-if="getError('nip')" class="form-error-msg mt-1">
                    <i class="fas fa-exclamation-circle me-1"></i>{{ getError('nip') }}
                  </div>
                </div>

                <div class="col-md-6">
                  <label class="form-label text-xs fw-bold text-slate-700">
                    Nama Lengkap <span class="text-danger">*</span>
                  </label>
                  <div class="input-with-icon">
                    <i class="fas fa-user input-icon text-slate-400"></i>
                    <input
                      type="text"
                      class="form-control modern-input"
                      v-model="nama"
                      placeholder="Nama lengkap beserta gelar"
                    />
                  </div>
                  <div v-if="getError('nama')" class="form-error-msg mt-1">
                    <i class="fas fa-exclamation-circle me-1"></i>{{ getError('nama') }}
                  </div>
                </div>
              </div>

              <!-- Jabatan & Bagian -->
              <div class="row g-3 mb-3">
                <div class="col-md-6">
                  <label class="form-label text-xs fw-bold text-slate-700">
                    Jabatan <span class="text-danger">*</span>
                  </label>
                  <select class="form-select modern-input" v-model="jabatan">
                    <option disabled value="">:: Pilih Jabatan ::</option>
                    <option
                      v-for="(jbt, index) in availableJabatans"
                      :value="jbt.nama_jabatan"
                      :key="index"
                    >
                      {{ jbt.nama_jabatan }}
                    </option>
                  </select>
                  <div v-if="getError('jabatan')" class="form-error-msg mt-1">
                    <i class="fas fa-exclamation-circle me-1"></i>{{ getError('jabatan') }}
                  </div>
                </div>

                <div class="col-md-6">
                  <label class="form-label text-xs fw-bold text-slate-700">
                    Bagian / Unit Kerja <span class="text-danger">*</span>
                  </label>
                  <select class="form-select modern-input" v-model="bagian">
                    <option disabled value="">:: Pilih Bagian ::</option>
                    <option
                      v-for="(bgn, index) in availableBagians"
                      :value="bgn.nama_bagian"
                      :key="index"
                    >
                      {{ bgn.nama_bagian }}
                    </option>
                  </select>
                  <div v-if="getError('bagian')" class="form-error-msg mt-1">
                    <i class="fas fa-exclamation-circle me-1"></i>{{ getError('bagian') }}
                  </div>
                </div>
              </div>

              <!-- Nomor HP & Status -->
              <div class="row g-3 mb-3">
                <div class="col-md-6">
                  <label class="form-label text-xs fw-bold text-slate-700">
                    Nomor WhatsApp / HP <span class="text-danger">*</span>
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

                <div class="col-md-6">
                  <label class="form-label text-xs fw-bold text-slate-700">
                    Status Kepegawaian <span class="text-danger">*</span>
                  </label>
                  <select class="form-select modern-input" v-model="status">
                    <option value="Aktif">Aktif</option>
                    <option value="Non Aktif">Non Aktif</option>
                  </select>
                  <div v-if="getError('status')" class="form-error-msg mt-1">
                    <i class="fas fa-exclamation-circle me-1"></i>{{ getError('status') }}
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>

        <!-- Bottom Actions (Mobile Sticky Bar) -->
        <div class="d-flex d-sm-none align-items-center gap-2 mobile-sticky-bottom-bar">
          <router-link :to="{ name: 'Data Pegawai' }" class="btn-cancel w-40 py-2 rounded-3 text-center">
            <i class="fas fa-times me-1 text-danger"></i> Batal
          </router-link>
          <button
            type="button"
            @click="storePegawai"
            :disabled="isSubmitting"
            class="btn-primary-gradient text-white border-0 w-60 py-2 rounded-3 shadow-sm d-flex align-items-center justify-content-center fw-semibold text-sm"
          >
            <span v-if="isSubmitting" class="spinner-border spinner-border-sm me-2" role="status"></span>
            <i v-if="!isSubmitting" class="fas fa-save me-2"></i>
            {{ isSubmitting ? 'Menyimpan...' : 'Simpan Pegawai' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.form-page-container {
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 10px;
}

@media (min-width: 768px) {
  .form-page-container {
    padding: 0 16px;
  }
}

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

.modern-form-card {
  border-radius: 16px;
  background-color: #ffffff;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.modern-form-card:hover {
  box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.05), 0 8px 10px -6px rgba(15, 23, 42, 0.03) !important;
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

.text-slate-900 { color: #0f172a !important; }
.text-slate-700 { color: #334155 !important; }
.text-slate-400 { color: #94a3b8 !important; }
</style>
