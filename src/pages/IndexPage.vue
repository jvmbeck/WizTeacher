<template>
  Welcome, teacher {{ teacherName }}!
  <q-btn @click="handleSignOut" class="q-mt-md">
    <q-icon name="logout" />
    <q-tooltip anchor="top middle" self="bottom middle"> Logout </q-tooltip>
  </q-btn>

  <q-btn to="/addNewClass">Create new class</q-btn>

  <ClassListComponent></ClassListComponent>
</template>

<script>
import AuthServices from 'src/services/AuthServices.js'
import ClassListComponent from 'src/components/ClassListComponent.vue'
import { useUserStore } from 'src/stores/userStore.js'

export default {
  name: 'IndexPage',
  computed: {
    // Access the userInfo from the store
    teacherName() {
      const userStore = useUserStore()
      return userStore.userInfo?.name || '' // Fallback to an empty string if userInfo is null
    },
  },
  components: {
    ClassListComponent,
  },
  methods: {
    async handleSignOut() {
      const userStore = useUserStore()
      AuthServices.handleSignOut().then(() => {
        userStore.clearUserInfo() // Clear user info from the store
        this.$router.push({ name: 'LoginPage' }) // Redirect to LoginPage
      })
    },
  },
  async beforeMount() {
    const userStore = useUserStore()
    if (!userStore.userInfo) {
      try {
        await userStore.loadUserInfo() // Attempt to load user info
        if (!userStore.userInfo) {
          console.warn('No user info found, redirecting to LoginPage.')
          this.$router.push({ name: 'LoginPage' }) // Redirect if still no user info
        }
      } catch (error) {
        console.error('Error loading user info:', error)
        this.$router.push({ name: 'LoginPage' }) // Redirect on error
      }
    }
  },
}
</script>
