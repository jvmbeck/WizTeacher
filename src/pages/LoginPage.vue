<template>
  <q-page class="flex flex-center">
    <LoginComponent></LoginComponent>
  </q-page>
</template>

<script>
import LoginComponent from '../components/LoginComponent.vue'

export default {
  name: 'LoginPage',
  components: {
    LoginComponent,
  },
  data() {
    return {
      // Add any data properties you need here
    }
  },
  methods: {
    // Add any methods you need here
  },
}
</script>
