<template>
  <div v-if="!loading">
    <router-view />
    <!-- Render the app only after initialization -->
  </div>
  <div v-else>
    <q-spinner-dots size="50px" color="primary" />
    <!-- Show a loading spinner -->
  </div>
</template>

<script>
import { onAuthStateChanged } from 'firebase/auth'
import { useUserStore } from 'src/stores/userStore.js'
import { auth } from 'src/key/configKey.js'

export default {
  name: 'App',
  data() {
    return {
      loading: true, // Prevent rendering until initialization is complete
    }
  },
  async created() {
    const userStore = useUserStore()

    // Listen for authentication state changes
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Load user info into the store if a user is logged in
          await userStore.loadUserInfo()
        } catch (error) {
          console.error('Error loading user info during initialization:', error)
        }
      }
      this.loading = false // Allow the app to render
    })
  },
}
</script>
