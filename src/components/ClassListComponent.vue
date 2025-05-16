<template>
  <div class="q-pa-md">
    <q-input v-model="searchTerm" label="Search by Day or Schedule" outlined class="q-mb-md" />

    <q-list bordered separator>
      <q-item
        v-for="classItem in filteredClasses"
        :key="classItem.id"
        clickable
        @click="$router.push({ name: 'ClassDetails', params: { id: classItem.id } })"
      >
        <q-item-section>
          <q-item-label><strong>Day:</strong> {{ classItem.classDay }}</q-item-label>
          <q-item-label><strong>Schedule:</strong> {{ classItem.schedule }}</q-item-label>
        </q-item-section>
      </q-item>
    </q-list>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import ClassServices from 'src/services/ClassServices'
import { useUserStore } from '../stores/userStore'

const searchTerm = ref('')
const teacherClasses = ref([])

onMounted(async () => {
  const userStore = useUserStore()
  const teacherId = userStore.userInfo?.uid

  if (!teacherId) {
    console.error('No teacher ID found')
    return
  }

  teacherClasses.value = await ClassServices.fetchClassesByTeacher(teacherId)
})

const filteredClasses = computed(() => {
  if (!searchTerm.value) return teacherClasses.value

  const term = searchTerm.value.toLowerCase()
  return teacherClasses.value.filter(
    (item) =>
      item.classDay.toLowerCase().includes(term) || item.schedule.toLowerCase().includes(term),
  )
})
</script>
