<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import api, { getStorageUrl } from "../../api";
import { getStoredUser, setStoredUser } from "@/utils/auth";

const router = useRouter();
const route = useRoute();

// User auth state
const currentUser = ref(getStoredUser());
const isAdmin = computed(() => {
  const lvl = (currentUser.value?.level || "").toLowerCase().trim();
  return lvl === "admin" || lvl === "administrator";
});
const isSelfEdit = computed(() => {
  return currentUser.value && String(currentUser.value.id) === String(route.params.id);
});

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
const existingPhoto = ref("");
const newPhoto = ref(null);
const newPhotoPreview = ref("");
const errors = ref({});
const generalError = ref("");
const isLoading = ref(true);
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
    newPhoto.value = file;
    const reader = new FileReader();
    reader.onload = (event) => {
      newPhotoPreview.value = event.target.result;
    };
    reader.readAsDataURL(file);
  }
};

// Safe Photo URL Resolver
const resolvePhotoUrl = (url) => {
  if (!url) return null;
  return getStorageUrl(url);
};

// Load detail data
const loadDetailData = async () => {
  isLoading.value = true;
  try {
    const response = await api.get(`/api/users/${route.params.id}`);
    const data = response.data?.data || {};
    name.value = data.name || "";
    jenkel.value = data.jenkel || "Laki-laki";
    username.value = data.username || "";
    email.value = data.email || "";
    nohp.value = data.nohp || "";
    status.value = data.status || "Aktif";
    level.value = data.level || "Petugas";
    existingPhoto.value = data.photo || "";
  } catch (error) {
    console.error("Gagal memuat data user:", error);
    generalError.value = "Gagal memuat data pengguna dari server.";
  } finally {
    isLoading.value = false;
  }
};

// Update user
const updateUser = async () => {
  errors.value = {};
  generalError.value = "";

  if (password.value && password.value !== confirmPassword.value) {
    errors.value = { confirmPassword: ["Konfirmasi kata sandi tidak cocok."] };
    return;
  }

  isSubmitting.value = true;

  try {
    let formData = new FormData();
    formData.append("name", name.value || "");
    formData.append("jenkel", jenkel.value || "");
    formData.append("username", username.value || "");
    if (password.value) {
      formData.append("password", password.value);
    }
    formData.append("email", email.value || "");
    formData.append("nohp", nohp.value || "");
    formData.append("status", status.value || "Aktif");
    formData.append("level", level.value || "Petugas");
    formData.append("_method", "PATCH");

    if (newPhoto.value instanceof File) {
      formData.append("photo", newPhoto.value);
    }

    const response = await api.post(`/api/users/${route.params.id}`, formData);

    // Jika user mengedit akun miliknya sendiri, perbarui data lokal & sinkronisasi
    if (isSelfEdit.value) {
      const updatedUser = response.data?.data || null;
      if (updatedUser) {
        setStoredUser(updatedUser);
      } else {
        setStoredUser({
          ...currentUser.value,
          name: name.value,
          username: username.value,
          email: email.value,
          nohp: nohp.value,
          jenkel: jenkel.value,
        });
      }
      window.dispatchEvent(new Event("storage"));
    }

    if (isAdmin.value) {
      router.push({ path: "/user" });
    } else {
      router.push({ path: "/tamu" });
    }
  } catch (error) {
    if (error.response && error.response.data) {
      errors.value = error.response.data;
      if (error.response.data.message && !error.response.data.errors) {
        generalError.value = error.response.data.message;
      }
    } else {
      generalError.value = "Terjadi kendala koneksi saat menyimpan data user.";
      console.error("Gagal memperbarui data user:", error);
    }
  } finally {
    isSubmitting.value = false;
  }
};

onMounted(() => {
  loadDetailData();
});
</script>

<template>
  <div class="py-4 container-fluid form-page-container">
    <!-- Page Header Card -->
    <div class="card border-0 shadow-sm mb-4 page-header-card">
      <div class="card-body p-3 p-sm-4 d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3">
        <div>
          
          <h4 class="mb-1 fw-bold header-title-text">
            {{ isSelfEdit && !isAdmin ? 'Pengaturan Profil Akun' : 'Ubah Data Pengguna' }}
          </h4>
          <p class="header-subtitle-text mb-0">
            {{ isSelfEdit && !isAdmin ? 'Perbarui data identitas pribadi, kontak WhatsApp, dan kata sandi akun Anda.' : 'Perbarui data profil, peran akses, atau ganti kata sandi akun pengguna.' }}
          </p>
        </div>

        <div class="d-flex align-items-center gap-2 header-action-buttons">
          <router-link
            :to="isAdmin ? { name: 'Data User' } : { path: '/tamu' }"
            class="btn-cancel px-3 py-2 rounded-3 text-sm text-decoration-none"
          >
            <i class="fas fa-times me-1 text-danger"></i> {{ isAdmin ? 'Batal' : 'Kembali ke Buku Tamu' }}
          </router-link>
          <button
            type="button"
            @click="updateUser"
            :disabled="isSubmitting || isLoading"
            class="btn-primary-gradient text-white border-0 px-4 py-2 rounded-3 shadow-sm d-flex align-items-center fw-semibold text-sm"
          >
            <span v-if="isSubmitting" class="spinner-border spinner-border-sm me-2" role="status"></span>
            <i v-if="!isSubmitting" class="fas fa-save me-2"></i>
            {{ isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Loading Skeleton -->
    <div v-if="isLoading" class="card border-0 shadow-sm p-5 text-center my-4">
      <div class="spinner-border text-primary mx-auto mb-3" role="status"></div>
      <h6 class="fw-bold text-slate-800">Memuat Data Pengguna...</h6>
      <p class="text-slate-400 text-xs mb-0">Mohon tunggu sebentar, data sedang diambil dari server.</p>
    </div>

    <!-- General Error Alert -->
    <div v-if="!isLoading && generalError" class="alert alert-danger text-white border-0 shadow-sm rounded-3 py-3 px-3 mb-4 d-flex align-items-center">
      <i class="fas fa-exclamation-circle me-2 fs-5"></i>
      <span class="text-xs fw-semibold">{{ generalError }}</span>
    </div>

    <!-- Main Form Grid -->
    <div v-if="!isLoading" class="row g-3 g-lg-4">
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

            <!-- Password & Konfirmasi (Opsional saat Edit) -->
            <div class="row g-3 mb-3">
              <div class="col-md-6">
                <label class="form-label text-xs fw-bold text-slate-700">
                  Kata Sandi Baru <span class="text-muted fw-normal">(Kosongkan jika tidak diubah)</span>
                </label>
                <div class="input-with-icon">
                  <i class="fas fa-lock input-icon text-slate-400"></i>
                  <input
                    type="password"
                    class="form-control modern-input"
                    v-model="password"
                    placeholder="Masukkan sandi baru jika ingin ganti"
                    autocomplete="new-password"
                  />
                </div>
                <div v-if="getError('password')" class="form-error-msg mt-1">
                  <i class="fas fa-exclamation-circle me-1"></i>{{ getError('password') }}
                </div>
              </div>

              <div class="col-md-6">
                <label class="form-label text-xs fw-bold text-slate-700">
                  Konfirmasi Kata Sandi Baru
                </label>
                <div class="input-with-icon">
                  <i class="fas fa-check-double input-icon text-slate-400"></i>
                  <input
                    type="password"
                    class="form-control modern-input"
                    v-model="confirmPassword"
                    placeholder="Ulangi kata sandi baru"
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
                <select class="form-select modern-input" v-model="level" :disabled="!isAdmin">
                  <option value="Administrator">Administrator</option>
                  <option value="Petugas">Petugas</option>
                </select>
                <small v-if="!isAdmin" class="text-slate-400 text-xxs mt-1 d-block">
                  <i class="fas fa-lock me-1"></i>Hanya Admin yang dapat mengubah level akun.
                </small>
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
                <select class="form-select modern-input" v-model="status" :disabled="!isAdmin">
                  <option value="Aktif">Aktif</option>
                  <option value="Non Aktif">Non Aktif</option>
                </select>
                <small v-if="!isAdmin" class="text-slate-400 text-xxs mt-1 d-block">
                  <i class="fas fa-lock me-1"></i>Status akun dikelola oleh Admin.
                </small>
              </div>
            </div>

            <!-- Foto Profil -->
            <div class="mb-3">
              <label class="form-label text-xs fw-bold text-slate-700">
                Foto Profil Pengguna
              </label>
              
              <!-- Existing or New Preview -->
              <div class="d-flex align-items-center gap-3 mb-2 p-2 border rounded-3 bg-light">
                <img
                  v-if="newPhotoPreview"
                  :src="newPhotoPreview"
                  alt="Foto Baru"
                  class="rounded-circle shadow-sm"
                  style="width: 55px; height: 55px; object-fit: cover;"
                />
                <img
                  v-else-if="existingPhoto"
                  :src="resolvePhotoUrl(existingPhoto)"
                  alt="Foto Saat Ini"
                  class="rounded-circle shadow-sm"
                  style="width: 55px; height: 55px; object-fit: cover;"
                />
                <div v-else class="rounded-circle bg-secondary text-white d-flex align-items-center justify-content-center" style="width: 55px; height: 55px;">
                  <i class="fas fa-user fa-lg"></i>
                </div>
                <div>
                  <span class="d-block text-xs fw-bold text-slate-800">
                    {{ newPhoto ? 'Foto baru dipilih' : (existingPhoto ? 'Foto saat ini tersimpan' : 'Belum ada foto') }}
                  </span>
                  <span v-if="newPhoto" class="text-success text-xxs fw-semibold">
                    <i class="fas fa-check-circle me-1"></i> Siap disimpan
                  </span>
                  <span v-else class="text-slate-400 text-xxs">
                    Format: JPG, PNG (Maks 2MB)
                  </span>
                </div>
              </div>

              <input
                type="file"
                class="form-control modern-input"
                accept="image/*"
                @change="handleFileChange($event)"
              />
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
            @click="updateUser"
            :disabled="isSubmitting || isLoading"
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
