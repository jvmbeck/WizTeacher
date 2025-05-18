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
        <q-item-section side>
          <q-icon v-if="statusMap[student.uid] === 'lesson'" name="check_circle" color="green" />
          <q-icon v-else-if="statusMap[student.uid] === 'absence'" name="cancel" color="red" />
        </q-item-section>
        <q-btn label="Edit Lesson" @click="openLessonForm(student.uid)" />
        <q-btn label="Mark Absent" color="negative" @click="markAbsent(student.uid)" />
      </q-item>
    </q-list>
  </div>

  <!-- Import the SaveLessonForm component -->
  <SaveLessonFormComponent
    v-model="isFormOpen"
    :student-id="selectedStudentId"
    :student-name="selectedStudent?.name"
    :class-id="classId"
    @lessonSaved="handleLessonSaved"
  />
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../key/configKey.js'
import StudentServices from '../services/StudentServices.js'
import SaveLessonFormComponent from 'src/components/SaveLessonFormComponent.vue'
import dayjs from 'dayjs'

const route = useRoute()
const classId = route.params.id

const statusMap = ref({})
const classInfo = ref(null)
const students = ref([])
const selectedStudentId = ref(null)
const selectedStudent = ref(null)
const isFormOpen = ref(false)

const openLessonForm = (studentId) => {
  const student = students.value.find((s) => s.uid === studentId)
  if (!student) return

  selectedStudent.value = student
  selectedStudentId.value = student.uid
  isFormOpen.value = true
}

const handleLessonSaved = async () => {
  console.log('Lesson saved!')
  // Optional: refresh student data if needed
  fetchStudentList()
  const studentIds = students.value.map((s) => s.uid)
  statusMap.value = await fetchStudentStatusForToday(studentIds)
}

const markAbsent = async (studentId) => {
  try {
    await StudentServices.markStudentAbsent(studentId, classId)
    console.log('Student marked absent!')
    const studentIds = students.value.map((s) => s.uid)
    statusMap.value = await fetchStudentStatusForToday(studentIds)
  } catch (err) {
    console.error('Failed to mark absence:', err.message)
  }
}

const fetchStudentList = async () => {
  const classSnap = await getDoc(doc(db, 'classes', classId))
  if (!classSnap.exists()) return

  classInfo.value = classSnap.data()

  if (classInfo.value.studentIds?.length) {
    students.value = await StudentServices.fetchStudentsByIds(classInfo.value.studentIds)
  }
}

const fetchStudentStatusForToday = async (studentIds) => {
  const today = dayjs().format('YYYY-MM-DD')

  const statusMap = {}

  // 1. Fetch completed lessons
  const lessonsQuery = query(
    collection(db, 'lessonsCompleted'),
    where('classId', '==', classId),
    where('date', '==', today),
  )

  const lessonSnapshots = await getDocs(lessonsQuery)
  lessonSnapshots.forEach((doc) => {
    const data = doc.data()
    if (studentIds.includes(data.studentId)) {
      statusMap[data.studentId] = 'lesson'
    }
  })

  // 2. Fetch absences
  const absenceIds = studentIds.map((id) => `${id}_${classId}_${today}`)
  const absencePromises = absenceIds.map((absenceId) =>
    getDocs(query(collection(db, 'absences'), where('__name__', '==', absenceId))),
  )

  const absenceSnapshots = await Promise.all(absencePromises)
  absenceSnapshots.forEach((snapshot) => {
    snapshot.forEach((doc) => {
      const studentId = doc.id.split('_')[0]
      statusMap[studentId] = 'absence'
    })
  })

  return statusMap
}

onMounted(async () => {
  await fetchStudentList()
  const studentIds = students.value.map((s) => s.uid)
  statusMap.value = await fetchStudentStatusForToday(studentIds)
})
</script>
