<template>
  <div class="admin-dashboard">
    <q-btn to="AdminDashboard/studentList">Student</q-btn>
    <q-btn to="AdminDashboard/teacherList">Teacher</q-btn>
    <q-btn to="AdminDashboard/classList">Classes</q-btn>
  </div>
  <SignOutButton></SignOutButton>
</template>

<script setup>
import SignOutButton from 'src/components/SignOutButton.vue'
</script>

<style scoped>
.admin-dashboard {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 2rem;
}

button {
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  cursor: pointer;
}
</style>
