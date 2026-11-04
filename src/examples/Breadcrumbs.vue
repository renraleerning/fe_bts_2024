<script setup>
import { computed } from "vue";
import { useStore } from "vuex";

const store = useStore();
const darkMode = computed(() => store.state.darkMode);

const props = defineProps({
  currentPage: {
    type: String,
    default: "",
  },
  currentDirectory: {
    type: String,
    default: "",
  },
});

const formattedCurrentPage = computed(() => {
  if (!props.currentPage) return "";
  if (props.currentPage.startsWith("Create.")) {
    return `Tambah Data ${props.currentPage.replace("Create.", "")}`;
  }
  if (props.currentPage.startsWith("Edit.")) {
    return `Edit Data ${props.currentPage.replace("Edit.", "")}`;
  }
  return props.currentPage;
});
</script>

<template>
  <nav aria-label="breadcrumb" class="custom-breadcrumb-nav">
    <ol class="breadcrumb mb-1 p-0 bg-transparent align-items-center">
      <li class="breadcrumb-item d-flex align-items-center">
        <router-link
          to="/tamu"
          class="breadcrumb-home-link"
          :class="darkMode ? 'text-slate-400' : 'text-slate-500'"
        >
          <i class="fas fa-home me-1 text-xs"></i>
          <span>BTS</span>
        </router-link>
      </li>
      <li class="breadcrumb-separator" :class="darkMode ? 'text-slate-600' : 'text-slate-400'">
        <i class="fas fa-chevron-right text-xxs mx-1"></i>
      </li>
      <li
        class="breadcrumb-item active fw-semibold"
        :class="darkMode ? 'text-white' : 'text-slate-900'"
        aria-current="page"
      >
        {{ formattedCurrentPage }}
      </li>
    </ol>
    <div class="d-flex align-items-center mt-1">
      <span class="badge-school-identity" :class="{ 'dark-badge': darkMode }">
        SMKN 2 Sumedang
      </span>
    </div>
  </nav>
</template>

<style scoped>
.custom-breadcrumb-nav {
  display: flex;
  flex-direction: column;
}

.text-xxs {
  font-size: 0.65rem;
}

.breadcrumb-home-link {
  text-decoration: none;
  font-size: 0.78rem;
  font-weight: 500;
  transition: color 0.15s ease-in-out;
}

.breadcrumb-home-link:hover {
  color: #3b82f6 !important;
}

.breadcrumb-separator {
  display: flex;
  align-items: center;
}

.breadcrumb-item.active {
  font-size: 0.78rem;
}

.page-title {
  font-size: 1.125rem;
  letter-spacing: -0.02em;
}

.badge-school-identity {
  font-size: 0.8125rem;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 6px;
  background: #dbeafe;
  color: #2563eb;
  border: 1px solid #bfdbfe;
  display: inline-flex;
  align-items: center;
  line-height: 1.4;
  box-shadow: 0 1px 2px rgba(37, 99, 235, 0.05);
}

.badge-school-identity.dark-badge {
  background: rgba(37, 99, 235, 0.2);
  color: #93c5fd;
  border-color: rgba(147, 197, 253, 0.3);
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
.text-slate-900 {
  color: #0f172a !important;
}
</style>
