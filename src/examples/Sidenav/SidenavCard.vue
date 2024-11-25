<script setup>
import { computed } from "vue";
import { useStore } from "vuex";
const store = useStore();

const isRTL = computed(() => store.state.isRTL);
const layout = computed(() => store.state.layout);
defineProps({
  card: {
    type: Object,
    required: true,
    title: String,
    description: String,
    links: {
      type: Array,
      label: String,
      route: String,
      color: String,
    },
  },
});
</script>
<template>
  <div
    v-show="layout !== 'landing'"
    class="card card-plain shadow-none"
    id="sidenavCard"
  >
    

    
    <a
      v-if="isRTL"
      href="https://www.creative-tim.com/product/vue-argon-dashboard-pro"
      target="_blank"
      class="mb-3 btn btn-success btn-sm w-100"
    > </a>

    
    
  </div>
</template>
