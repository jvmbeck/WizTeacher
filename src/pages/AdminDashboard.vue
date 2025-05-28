<template>
  <div class="admin-dashboard">
    <q-btn to="/studentList">Student</q-btn>
    <q-btn to="/teacherList">Teacher</q-btn>
    <q-btn to="/classList">Classes</q-btn>
  </div>
</template>

<script setup>
// No script logic needed for simple buttons
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
