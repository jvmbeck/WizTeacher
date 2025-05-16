<template>
  <div class="q-pa-md">
    <h5>Class: {{ classInfo?.classDay }} at {{ classInfo?.schedule }}</h5>
    <q-list bordered>
      <q-item v-for="student in students" :key="student.uid">
        <q-item-section
          >{{ student.name }} - {{ student.currentLesson }}/{{
            student.currentLesson + 1
          }}</q-item-section
        >
        <q-icon name="edit" @click="openLessonForm(student.uid)" />
      </q-item>
    </q-list>
  </div>

  <!-- Import the SaveLessonForm component -->
  <SaveLessonFormComponent
    v-model="isFormOpen"
    :student-id="selectedStudentId"
    @lessonSaved="handleLessonSaved"
  />
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { getDoc, doc } from 'firebase/firestore'
import { db } from '../key/configKey.js'
import StudentServices from '../services/StudentServices.js'
import SaveLessonFormComponent from 'src/components/SaveLessonFormComponent.vue'

const route = useRoute()
const classId = route.params.id

const classInfo = ref(null)
const students = ref([])
const selectedStudentId = ref(null)
const isFormOpen = ref(false)

const openLessonForm = (studentId) => {
  selectedStudentId.value = studentId
  isFormOpen.value = true
}

const handleLessonSaved = () => {
  console.log('Lesson saved!')
  // Optional: refresh student data if needed
  fetchStudentList()
}

const fetchStudentList = async () => {
  const classSnap = await getDoc(doc(db, 'classes', classId))
  if (!classSnap.exists()) return

  classInfo.value = classSnap.data()

  if (classInfo.value.studentIds?.length) {
    students.value = await StudentServices.fetchStudentsByIds(classInfo.value.studentIds)
  }
}

onMounted(async () => {
  await fetchStudentList()
})
</script>
