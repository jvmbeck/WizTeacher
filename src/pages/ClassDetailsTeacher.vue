<template>
  <div class="q-pa-md">
    <h5>{{ classInfo?.className }}</h5>
    <q-list bordered>
      <q-item v-for="student in students" :key="student.uid">
        <q-item-section>
          {{ student.name }}
        </q-item-section>
        <q-item-label>
          <div>
            {{ student.currentLesson }}
          </div>
          <div
            v-if="
              getNextLessonLabel(student.currentLesson, student.book) !== null &&
              student.currentLesson !== null
            "
          >
            / {{ getNextLessonLabel(student.currentLesson, student.book) }}
          </div>
        </q-item-label>
        <q-icon v-if="student.currentLesson == null" name="check_circle" color="green" size="md" />
        <q-item-section side> </q-item-section>
        <q-btn label="Edit Lesson" @click="openLessonForm(student.uid)" />
        <q-btn label="Mark Absent" color="negative" @click="markAbsent(student.uid)" />
      </q-item>
    </q-list>
    <q-dialog v-model="lessonDialog" seamless position="bottom">
      <q-card style="width: 350px">
        <q-card-section class="row items-center no-wrap">
          <div>
            <div>Nota adicionada com sucesso!</div>
          </div>

          <q-space />

          <q-btn flat round icon="close" v-close-popup />
        </q-card-section>
      </q-card>
    </q-dialog>
  </div>

  <q-btn to="/TeacherDashboard">To Teacher Dashboard</q-btn>

  <!-- Import the SaveLessonForm component -->
  <SaveLessonForm
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
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../key/configKey.js'
import StudentServices from '../services/StudentServices.js'
import SaveLessonForm from 'src/components/SaveLessonForm.vue'
import BookStructure from '../data/bookStructure.json'

const route = useRoute()
const classId = route.params.id

const lessonDialog = ref(false)
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
  lessonDialog.value = true
  setTimeout(() => {
    lessonDialog.value = false
  }, 2000)
  // refresh student data
  console.log('Refreshing student data...')
  setTimeout(() => {
    fetchStudentList()
  }, 1000)
}

const markAbsent = async (studentId) => {
  try {
    await StudentServices.markStudentAbsent(studentId, classId)
    console.log('Student marked absent!')
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

const getNextLessonLabel = (currentLesson, book) => {
  const bookLessons = BookStructure[book]
  if (!bookLessons) return currentLesson

  const index = bookLessons.indexOf(String(currentLesson))
  const next = bookLessons[index + 1]
  return next
}

onMounted(async () => {
  await fetchStudentList()
})
</script>
