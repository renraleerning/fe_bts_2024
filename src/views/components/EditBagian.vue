<script setup>
import { ref, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import api from "../../api";

const router = useRouter();
const route = useRoute();

const nama_bagian = ref("");
const status = ref("Aktif");
const errors = ref({});
const isSubmitting = ref(false);

const getError = (field) => {
  if (!errors.value) return null;
  const errObj = errors.value.errors || errors.value;
  if (errObj && errObj[field]) {
    return Array.isArray(errObj[field]) ? errObj[field][0] : errObj[field];
  }
  return null;
};

onMounted(async () => {
  try {
    const response = await api.get(`/api/bagian/${route.params.id}`);
    nama_bagian.value = response.data.data.nama_bagian || "";
    status.value = response.data.data.status || "Aktif";
  } catch (error) {
    console.error(error);
  }
});

const updatePost = async () => {
  isSubmitting.value = true;
  errors.value = {};

  try {
    let formData = new FormData();
    formData.append("nama_bagian", nama_bagian.value);
    formData.append("status", status.value);
    formData.append("_method", "PATCH");

    await api.post(`/api/bagian/${route.params.id}`, formData);
    router.push({ path: "/bagian" });
  } catch (error) {
    if (error.response && error.response.data) {
      errors.value = error.response.data;
    } else {
      console.error(error);
    }
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <div class="card modern-component-card border-0 shadow-sm">
    <div class="card-header bg-white border-0 pb-0 pt-4 px-4">
      <div class="d-flex align-items-center gap-2">
        <div class="header-icon-circle bg-blue-light text-primary">
          <i class="fas fa-edit"></i>
        </div>
        <div>
          <h6 class="mb-0 fw-bold text-slate-900">Ubah Bagian</h6>
          <small class="text-slate-400 text-xs">Perbarui nama unit & status</small>
        </div>
      </div>
    </div>

    <div class="card-body px-4 pt-3 pb-4">
      <form @submit.prevent="updatePost">
        <div class="mb-3">
          <label class="form-label text-xs fw-bold text-slate-700">
            Nama Bagian / Unit Kerja <span class="text-danger">*</span>
          </label>
          <div class="input-with-icon">
            <i class="fas fa-building input-icon text-slate-400"></i>
            <input
              type="text"
              class="form-control modern-input"
              v-model="nama_bagian"
              placeholder="Nama Bagian/Department"
            />
          </div>
          <div v-if="getError('nama_bagian')" class="form-error-msg mt-1">
            <i class="fas fa-exclamation-circle me-1"></i>{{ getError('nama_bagian') }}
          </div>
        </div>

        <div class="mb-3">
          <label class="form-label text-xs fw-bold text-slate-700">
            Status <span class="text-danger">*</span>
          </label>
          <select class="form-select modern-input" v-model="status">
            <option value="Aktif">Aktif</option>
            <option value="Non Aktif">Non Aktif</option>
          </select>
          <div v-if="getError('status')" class="form-error-msg mt-1">
            <i class="fas fa-exclamation-circle me-1"></i>{{ getError('status') }}
          </div>
        </div>

        <div class="d-flex align-items-center gap-2 mt-4">
          <button
            type="submit"
            :disabled="isSubmitting"
            class="btn-primary-gradient text-white border-0 flex-grow-1 py-2 rounded-3 shadow-sm d-flex align-items-center justify-content-center fw-semibold text-sm"
          >
            <span v-if="isSubmitting" class="spinner-border spinner-border-sm me-2" role="status"></span>
            <i v-if="!isSubmitting" class="fas fa-save me-2"></i>
            {{ isSubmitting ? 'Menyimpan...' : 'Simpan' }}
          </button>
          <router-link
            :to="{ name: 'Data Bagian' }"
            class="btn-cancel px-3 py-2 rounded-3 text-sm"
          >
            Batal
          </router-link>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.modern-component-card {
  border-radius: 16px;
  background-color: #ffffff;
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
  min-height: 38px;
}

.btn-cancel:hover {
  background-color: #f1f5f9;
  color: #0f172a !important;
  border-color: #94a3b8;
}

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
