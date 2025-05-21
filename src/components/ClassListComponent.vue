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
import { ref, computed, watch } from 'vue'
import ClassServices from 'src/services/ClassServices'
import { useUserStore } from '../stores/userStore'

const searchTerm = ref('')
const teacherClasses = ref([])

const userStore = useUserStore()

// Wait until userInfo is available before trying to fetch teacher's classes
watch(
  () => userStore.userInfo,
  async (userInfo) => {
    if (userInfo?.uid) {
      teacherClasses.value = await ClassServices.fetchClassesByTeacher(userInfo.uid)
    } else {
      console.error('No teacher ID found')
    }
  },
  { immediate: true }, // Run immediately if userInfo is already available
)

const filteredClasses = computed(() => {
  if (!searchTerm.value) return teacherClasses.value

  const term = searchTerm.value.toLowerCase()
  return teacherClasses.value.filter(
    (item) =>
      item.classDay.toLowerCase().includes(term) || item.schedule.toLowerCase().includes(term),
  )
})
</script>
