<template>
  <q-form @submit.prevent="handleClassCreation">
    <q-select
      v-model="selectedTeacher"
      :options="teacherOptions"
      option-value="uid"
      option-label="name"
      label="Select a teacher"
      emit-value
      map-options
    />

    <q-select
      v-model="classDay"
      :options="classDayOptions"
      label="Class Day"
      emit-value
      map-options
    />
    <q-input v-model="schedule" label="Schedule" />
    <q-btn type="submit" label="Create Class" />
  </q-form>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import TeacherServices from '../services/TeacherServices'
import ClassServices from '../services/ClassServices'

const router = useRouter()

const classDay = ref('')
const classDayOptions = [
  { label: 'Monday', value: '2a' },
  { label: 'Tuesday', value: '3a' },
  { label: 'Wednesday', value: '4a' },
  { label: 'Thursday', value: '5a' },
  { label: 'Friday', value: '6a' },
  { label: 'Saturday', value: '7a' },
]
const schedule = ref('')
const selectedTeacher = ref(null)
const teacherOptions = ref([])

onMounted(async () => {
  teacherOptions.value = await TeacherServices.fetchAllTeachers()
})

const handleClassCreation = async () => {
  try {
    if (!selectedTeacher.value) {
      throw new Error('Please select a teacher')
    }

    await ClassServices.createClass({
      classDay: classDay.value,
      schedule: schedule.value,
      teacherId: selectedTeacher.value,
    })

    console.log('Class created!')
    router.push({ name: 'IndexPage' })
  } catch (err) {
    console.error('Error creating class:', err.message)
  }
}
</script>
