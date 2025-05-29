<template>
  Welcome, teacher {{ teacherName }}!
  <SignOutButton></SignOutButton>

  <q-btn to="/addNewClass">Create new class</q-btn>

  <ClassListComponent></ClassListComponent>
</template>

<script>
import ClassListComponent from 'src/components/ClassListComponent.vue'
import { useUserStore } from 'src/stores/userStore.js'
import SignOutButton from 'src/components/SignOutButton.vue'

export default {
  name: 'TeacherDashboard',
  computed: {
    // Access the userInfo from the store
    teacherName() {
      const userStore = useUserStore()
      return userStore.userInfo?.name || '' // Fallback to an empty string if userInfo is null
    },
  },
  components: {
    ClassListComponent,
    SignOutButton,
  },
  methods: {},
}
</script>
