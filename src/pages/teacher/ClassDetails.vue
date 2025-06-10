<template>
  <div class="q-pa-md">
    <q-btn to="/TeacherDashboard">To Teacher Dashboard</q-btn>

    <div class="class-header q-mb-md">
      <h5>{{ classInfo?.className }}</h5>
      <q-btn
        color="primary"
        icon="content_copy"
        label="Copiar todos"
        @click="copyAllStudentsInfo"
      />
    </div>

    <q-list bordered>
      <q-item v-for="student in students" :key="student.uid">
        <q-item-section>
          {{ student.name }} - {{ student.currentLesson
          }}<span v-if="getNextLessonLabel(student.currentLesson, student.book)"
            >/{{ getNextLessonLabel(student.currentLesson, student.book) }}</span
          >
          - {{ student.book }}
        </q-item-section>
        <q-btn
          flat
          round
          icon="content_copy"
          size="sm"
          @click="copyStudentInfo(student)"
          :title="`Copiar info de ${student.name}`"
        />
        <q-icon v-if="student.currentLesson == null" name="check_circle" color="green" size="md" />
        <q-icon
          v-if="student.isAbsentToday"
          name="event_busy"
          color="red"
          size="sm"
          class="q-ml-xs"
          title="Ausente hoje"
        />
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
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../../key/configKey.js'
import StudentServices from '../../services/StudentServices.js'
import SaveLessonForm from 'src/components/SaveLessonForm.vue'
import BookStructure from '../../data/bookStructure.json'
import { useQuasar } from 'quasar'

const $q = useQuasar()

const route = useRoute()
const classId = route.params.id

const lessonDialog = ref(false)
const classInfo = ref(null)
const students = ref([])
const selectedStudentId = ref(null)
const selectedStudent = ref(null)
const isFormOpen = ref(false)

const copyStudentInfo = (student) => {
  const text = `${student.name} - ${student.currentLesson}/${getNextLessonLabel(student.currentLesson, student.book)} - ${student.book}`
  navigator.clipboard
    .writeText(text)
    .then(() => {
      $q.notify({ type: 'positive', message: 'Copiado para a área de transferência!' })
    })
    .catch(() => {
      $q.notify({ type: 'negative', message: 'Falha ao copiar.' })
    })
}

const copyAllStudentsInfo = () => {
  const text = students.value
    .map(
      (student) =>
        `${student.name} - ${student.currentLesson}/${getNextLessonLabel(student.currentLesson, student.book)} - ${student.book}`,
    )
    .join('\n')
  navigator.clipboard
    .writeText(text)
    .then(() => {
      $q.notify({ type: 'positive', message: 'Todos os alunos copiados!' })
    })
    .catch(() => {
      $q.notify({ type: 'negative', message: 'Falha ao copiar.' })
    })
}

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
  // Show confirmation dialog before marking absent
  const confirmed = $q
    .dialog({
      title: 'Confirmar Ausência',
      ok: 'Sim',
      cancel: 'Não',
      message: 'Tem certeza de que deseja marcar este aluno como ausente?',
      persistent: true,
    })
    .onOk(async () => {
      try {
        await StudentServices.markStudentAbsent(studentId, classId)
        $q.notify({
          type: 'positive',
          message: 'Aluno marcado como ausente com sucesso!',
        })
        await fetchStudentList() // Refresh to update absence icons
      } catch (err) {
        $q.notify({
          type: 'negative',
          message: `Erro ao marcar ausência: ${err.message}`,
        })
        console.error('Failed to mark absence:', err.message)
      }
    })
    .onOk(() => true)
    .onCancel(() => false)

  if (!confirmed) return
}

const fetchStudentList = async () => {
  const classSnap = await getDoc(doc(db, 'classes', classId))
  if (!classSnap.exists()) return

  classInfo.value = classSnap.data()

  if (classInfo.value.studentIds?.length) {
    // Fetch students
    const studentList = await StudentServices.fetchStudentsByIds(classInfo.value.studentIds)

    // Fetch today's absences for this class
    const today = new Date().toISOString().split('T')[0]
    const absencesQuery = query(
      collection(db, 'absences'),
      where('classId', '==', classId),
      where('date', '==', today),
    )
    const absencesSnap = await getDocs(absencesQuery)
    const absentStudentIds = absencesSnap.docs.map((doc) => doc.data().studentId)

    // Annotate students with absence status
    students.value = studentList.map((student) => ({
      ...student,
      isAbsentToday: absentStudentIds.includes(student.uid),
    }))
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

<style scoped>
.class-header {
  display: flex;
  flex-direction: row;
  align-items: baseline;
  gap: 10px;
}
</style>
