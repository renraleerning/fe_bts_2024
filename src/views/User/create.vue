<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import api from "../../api";

const router = useRouter();

// Form states
const name = ref("");
const jenkel = ref("Laki-laki");
const username = ref("");
const password = ref("");
const confirmPassword = ref("");
const email = ref("");
const nohp = ref("");
const status = ref("Aktif");
const level = ref("Petugas");
const photo = ref(null);
const photoPreview = ref("");
const errors = ref({});
const isSubmitting = ref(false);

// Safe error helper
const getError = (field) => {
  if (!errors.value) return null;
  const errObj = errors.value.errors || errors.value;
  if (errObj && errObj[field]) {
    return Array.isArray(errObj[field]) ? errObj[field][0] : errObj[field];
  }
  return null;
};

// Handle photo file change
const handleFileChange = (e) => {
  const file = e.target.files[0];
  if (file) {
    photo.value = file;
    const reader = new FileReader();
    reader.onload = (event) => {
      photoPreview.value = event.target.result;
    };
    reader.readAsDataURL(file);
  }
};

// Store user
const storeUser = async () => {
  errors.value = {};

  if (password.value !== confirmPassword.value) {
    errors.value = { confirmPassword: ["Konfirmasi password tidak cocok dengan password baru."] };
    return;
  }

  isSubmitting.value = true;

  try {
    let formData = new FormData();
    formData.append("name", name.value || "");
    formData.append("jenkel", jenkel.value || "");
    formData.append("username", username.value || "");
    formData.append("password", password.value || "");
    formData.append("email", email.value || "");
    formData.append("nohp", nohp.value || "");
    formData.append("status", status.value || "Aktif");
    formData.append("level", level.value || "Petugas");

    if (photo.value) {
      formData.append("photo", photo.value);
    }

    await api.post("/api/users", formData);
    router.push({ path: "/user" });
  } catch (error) {
    if (error.response && error.response.data) {
      errors.value = error.response.data;
    } else {
      console.error("Gagal menyimpan data user:", error);
    }
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <div class="py-4 container-fluid form-page-container">
    <!-- Page Header Card -->
    <div class="card border-0 shadow-sm mb-4 page-header-card">
      <div class="card-body p-3 p-sm-4 d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3">
        <div>
          
          <h4 class="mb-1 fw-bold header-title-text">Tambah Pengguna Baru</h4>
          <p class="header-subtitle-text mb-0">
            Daftarkan akun administrator atau staf petugas baru untuk mengakses sistem BTS.
          </p>
        </div>

        <div class="d-flex align-items-center gap-2 header-action-buttons">
          <router-link :to="{ name: 'Data User' }" class="btn-cancel px-3 py-2 rounded-3 text-sm">
            <i class="fas fa-times me-1 text-danger"></i> Batal
          </router-link>
          <button
            type="button"
            @click="storeUser"
            :disabled="isSubmitting"
            class="btn-primary-gradient text-white border-0 px-4 py-2 rounded-3 shadow-sm d-flex align-items-center fw-semibold text-sm"
          >
            <span v-if="isSubmitting" class="spinner-border spinner-border-sm me-2" role="status"></span>
            <i v-if="!isSubmitting" class="fas fa-save me-2"></i>
            {{ isSubmitting ? 'Menyimpan...' : 'Simpan Pengguna' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Main Form Grid -->
    <div class="row g-3 g-lg-4">
      <!-- Left Column: Identitas & Akses Login -->
      <div class="col-lg-7">
        <div class="card modern-form-card border-0 shadow-sm mb-4">
          <div class="card-header bg-white border-0 pb-0 pt-4 px-4">
            <div class="d-flex align-items-center gap-2">
              <div class="header-icon-circle bg-blue-light text-primary">
                <i class="fas fa-user-shield"></i>
              </div>
              <div>
                <h6 class="mb-0 fw-bold text-slate-900">Informasi Akun & Akses</h6>
                <small class="text-slate-400 text-xs">Identitas nama, kredensial login, dan kata sandi</small>
              </div>
            </div>
          </div>

          <div class="card-body px-4 pt-3 pb-4">
            <!-- Nama Lengkap -->
            <div class="mb-3">
              <label class="form-label text-xs fw-bold text-slate-700">
                Nama Lengkap <span class="text-danger">*</span>
              </label>
              <div class="input-with-icon">
                <i class="fas fa-user input-icon text-slate-400"></i>
                <input
                  type="text"
                  class="form-control modern-input"
                  v-model="name"
                  placeholder="Masukkan nama lengkap pengguna"
                />
              </div>
              <div v-if="getError('name')" class="form-error-msg mt-1">
                <i class="fas fa-exclamation-circle me-1"></i>{{ getError('name') }}
              </div>
            </div>

            <!-- Username & Email -->
            <div class="row g-3 mb-3">
              <div class="col-md-6">
                <label class="form-label text-xs fw-bold text-slate-700">
                  Username <span class="text-danger">*</span>
                </label>
                <div class="input-with-icon">
                  <i class="fas fa-at input-icon text-slate-400"></i>
                  <input
                    type="text"
                    class="form-control modern-input"
                    v-model="username"
                    placeholder="Contoh: admin_bts"
                    autocomplete="off"
                  />
                </div>
                <div v-if="getError('username')" class="form-error-msg mt-1">
                  <i class="fas fa-exclamation-circle me-1"></i>{{ getError('username') }}
                </div>
              </div>

              <div class="col-md-6">
                <label class="form-label text-xs fw-bold text-slate-700">
                  Alamat Email <span class="text-danger">*</span>
                </label>
                <div class="input-with-icon">
                  <i class="fas fa-envelope input-icon text-slate-400"></i>
                  <input
                    type="email"
                    class="form-control modern-input"
                    v-model="email"
                    placeholder="Contoh: user@smkn2sumedang.sch.id"
                  />
                </div>
                <div v-if="getError('email')" class="form-error-msg mt-1">
                  <i class="fas fa-exclamation-circle me-1"></i>{{ getError('email') }}
                </div>
              </div>
            </div>

            <!-- Password & Konfirmasi -->
            <div class="row g-3 mb-3">
              <div class="col-md-6">
                <label class="form-label text-xs fw-bold text-slate-700">
                  Kata Sandi / Password <span class="text-danger">*</span>
                </label>
                <div class="input-with-icon">
                  <i class="fas fa-lock input-icon text-slate-400"></i>
                  <input
                    type="password"
                    class="form-control modern-input"
                    v-model="password"
                    placeholder="Minimal 6 karakter"
                    autocomplete="new-password"
                  />
                </div>
                <div v-if="getError('password')" class="form-error-msg mt-1">
                  <i class="fas fa-exclamation-circle me-1"></i>{{ getError('password') }}
                </div>
              </div>

              <div class="col-md-6">
                <label class="form-label text-xs fw-bold text-slate-700">
                  Konfirmasi Kata Sandi <span class="text-danger">*</span>
                </label>
                <div class="input-with-icon">
                  <i class="fas fa-check-double input-icon text-slate-400"></i>
                  <input
                    type="password"
                    class="form-control modern-input"
                    v-model="confirmPassword"
                    placeholder="Ulangi kata sandi"
                    autocomplete="new-password"
                  />
                </div>
                <div v-if="getError('confirmPassword')" class="form-error-msg mt-1">
                  <i class="fas fa-exclamation-circle me-1"></i>{{ getError('confirmPassword') }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Column: Role, Kontak & Foto -->
      <div class="col-lg-5">
        <div class="card modern-form-card border-0 shadow-sm mb-4">
          <div class="card-header bg-white border-0 pb-0 pt-4 px-4">
            <div class="d-flex align-items-center gap-2">
              <div class="header-icon-circle bg-emerald-light text-emerald">
                <i class="fas fa-id-badge"></i>
              </div>
              <div>
                <h6 class="mb-0 fw-bold text-slate-900">Peran & Profil</h6>
                <small class="text-slate-400 text-xs">Tingkatan akses dan foto profil</small>
              </div>
            </div>
          </div>

          <div class="card-body px-4 pt-3 pb-4">
            <!-- Jenis Kelamin & Level -->
            <div class="row g-3 mb-3">
              <div class="col-6">
                <label class="form-label text-xs fw-bold text-slate-700">
                  Jenis Kelamin <span class="text-danger">*</span>
                </label>
                <select class="form-select modern-input" v-model="jenkel">
                  <option value="Laki-laki">Laki-laki</option>
                  <option value="Perempuan">Perempuan</option>
                </select>
              </div>

              <div class="col-6">
                <label class="form-label text-xs fw-bold text-slate-700">
                  Hak Akses / Level <span class="text-danger">*</span>
                </label>
                <select class="form-select modern-input" v-model="level">
                  <option value="Administrator">Administrator</option>
                  <option value="Petugas">Petugas</option>
                </select>
              </div>
            </div>

            <!-- No HP & Status -->
            <div class="row g-3 mb-3">
              <div class="col-6">
                <label class="form-label text-xs fw-bold text-slate-700">
                  Nomor HP / WA <span class="text-danger">*</span>
                </label>
                <div class="input-with-icon">
                  <i class="fab fa-whatsapp input-icon text-slate-400"></i>
                  <input
                    type="text"
                    class="form-control modern-input"
                    v-model="nohp"
                    placeholder="08xxxxxxxxxx"
                  />
                </div>
                <div v-if="getError('nohp')" class="form-error-msg mt-1">
                  <i class="fas fa-exclamation-circle me-1"></i>{{ getError('nohp') }}
                </div>
              </div>

              <div class="col-6">
                <label class="form-label text-xs fw-bold text-slate-700">
                  Status Akun <span class="text-danger">*</span>
                </label>
                <select class="form-select modern-input" v-model="status">
                  <option value="Aktif">Aktif</option>
                  <option value="Non Aktif">Non Aktif</option>
                </select>
              </div>
            </div>

            <!-- Foto Profil -->
            <div class="mb-3">
              <label class="form-label text-xs fw-bold text-slate-700">
                Foto Profil (Opsional)
              </label>
              <input
                type="file"
                class="form-control modern-input"
                accept="image/*"
                @change="handleFileChange($event)"
              />
              <div v-if="photoPreview" class="mt-2 text-center p-2 border rounded-3 bg-light">
                <img :src="photoPreview" alt="Preview Foto" class="rounded-circle shadow-sm" style="width: 70px; height: 70px; object-fit: cover;" />
                <small class="d-block text-success text-xxs mt-1 fw-bold">
                  <i class="fas fa-check-circle me-1"></i> Foto berhasil dipilih
                </small>
              </div>
              <div v-if="getError('photo')" class="form-error-msg mt-1">
                <i class="fas fa-exclamation-circle me-1"></i>{{ getError('photo') }}
              </div>
            </div>
          </div>
        </div>

        <!-- Bottom Actions (Mobile Sticky Bar) -->
        <div class="d-flex d-sm-none align-items-center gap-2 mobile-sticky-bottom-bar">
          <router-link :to="{ name: 'Data User' }" class="btn-cancel w-40 py-2 rounded-3 text-center">
            <i class="fas fa-times me-1 text-danger"></i> Batal
          </router-link>
          <button
            type="button"
            @click="storeUser"
            :disabled="isSubmitting"
            class="btn-primary-gradient text-white border-0 w-60 py-2 rounded-3 shadow-sm d-flex align-items-center justify-content-center fw-semibold text-sm"
          >
            <span v-if="isSubmitting" class="spinner-border spinner-border-sm me-2" role="status"></span>
            <i v-if="!isSubmitting" class="fas fa-save me-2"></i>
            {{ isSubmitting ? 'Menyimpan...' : 'Simpan User' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.form-page-container {
  max-width: 1200px;
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
.bg-emerald-light { background-color: #ecfdf5; }

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
.text-xxs { font-size: 11px; }
</style>
