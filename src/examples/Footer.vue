<script setup>
import { useStore } from "vuex";
const store = useStore();
</script>
<template>
  <footer class="py-3 footer">
    <div class="container-fluid">
      <div class="row align-items-center justify-content-lg-between">
        <div class="mb-4 col-lg-6 mb-lg-0">
          <div
            class="text-sm text-center copyright text-muted"
            :class="store.state.isRTL ? 'text-lg-end' : 'text-lg-start'"
          >
            ©
            {{ new Date().getFullYear() }}, made with
            <i class="fa fa-heart"></i> by
            <a
              href="https://smkn2sumedang.sch.id/"
              class="font-weight-bold"
              target="_blank"
              >SMKN 2 Sumedang</a
            >
          </div>
        </div>
        <div class="col-lg-6">
          <ul
            class="nav nav-footer justify-content-center justify-content-lg-end"
          >
            
            
            
            <li class="nav-item">
              <a
                class="nav-link pe-0 text-muted"
                target="_blank"
                >Version 2.0</a
              >
            </li>
          </ul>
        </div>
      </div>
    </div>
  </footer>
</template>
