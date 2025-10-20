<template>
  <div class="q-pa-md">
    <q-btn to="/TeacherDashboard">To Teacher Dashboard</q-btn>

    <div class="class-header q-mb-md">
      <h5>{{ classInfo?.className }}</h5>
      <q-btn
        color="primary"
        icon="content_copy"
        label="Copy All"
        @click="copyAllStudentsInfo"
      />
      <q-btn
        color="primary"
        icon="content_copy"
        label="Send Email Report"
        @click="sendEmailReport"
      />
    </div>

    <q-list bordered>
      <q-item v-for="student in students" :key="student.uid">
        <q-item-section>
          {{ student.name }} -
          <span>
            <span v-if="student.hasCurrentLessonSaved" class="lesson-saved">
              {{ student.currentLesson }}
              <q-icon
                name="check_circle"
                color="green"
                size="xs"
                class="q-ml-xs"
                title="Primeira lição salva"
              />
            </span>

            <span v-else class="lesson-planned">
              {{ student.currentLesson }}
              <q-icon
                name="hourglass_empty"
                color="grey"
                size="xs"
                class="q-ml-xs"
                title="Próxima lição (não salva)"
              />
            </span>
            <span v-if="getNextLessonLabel(student.currentLesson, student.book)">
              /
              <span v-if="student.hasNextLessonSaved" class="lesson-saved">
                {{ getNextLessonLabel(student.currentLesson, student.book) }}
                <q-icon
                  name="check_circle"
                  color="green"
                  size="xs"
                  class="q-ml-xs"
                  title="Segunda lição salva"
                />
              </span>
              <span v-else class="lesson-planned">
                {{ getNextLessonLabel(student.currentLesson, student.book) }}
                <q-icon
                  name="hourglass_empty"
                  color="grey"
                  size="xs"
                  class="q-ml-xs"
                  title="Próxima lição (não salva)"
                />
              </span>
            </span>
            - {{ student.book }}
          </span>
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
  </div>

  <!-- Import the SaveLessonForm component -->
  <SaveLessonForm
    v-model="isFormOpen"
    :student-id="selectedStudentId"
    :student-name="selectedStudent?.name"
    :class-id="classId"
    @lessonSaved="onLessonSaved"
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
import emailServices from 'src/services/EmailServices.js'

const $q = useQuasar()

const route = useRoute()
const classId = route.params.id

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

const onLessonSaved = ({ studentId }) => {
  handleLessonSaved(studentId)
}

const handleLessonSaved = async (studentId) => {
  // Find the student in the local array
  const student = students.value.find((s) => s.uid === studentId)
  if (student) {
    // Do NOT update student.currentLesson here!

    // Always recalculate completion flags
    student.hasCurrentLessonSaved = await StudentServices.fetchLessonCompletion(
      student,
      student.book,
      student.currentLesson,
    )
    const nextLesson = getNextLessonLabel(student.currentLesson, student.book)
    student.hasNextLessonSaved = await StudentServices.fetchLessonCompletion(
      student,
      student.book,
      nextLesson,
    )
  }
  $q.notify({
    type: 'positive',
    message: 'Nota adicionada com sucesso!',
    icon: 'check_circle',
  })
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
    let sortedStudents = studentList.map((student) => ({
      ...student,
      isAbsentToday: absentStudentIds.includes(student.uid),
    }))

    // Custom sort: group (even, odd, 'R'), then lesson descending, then name
    sortedStudents = sortedStudents.sort((a, b) => {
      const getCategory = (student) => {
        if (typeof student.currentLesson === 'string' && student.currentLesson.startsWith('R')) {
          return 2 // 'R' lessons last
        }
        const lessonNum = parseInt(student.currentLesson, 10)
        if (!isNaN(lessonNum)) {
          return lessonNum % 2 === 0 ? 0 : 1 // Even first, then odd
        }
        return 3 // fallback (put at end)
      }

      const catA = getCategory(a)
      const catB = getCategory(b)
      if (catA !== catB) return catA - catB

      // Within group: sort by lesson number descending (higher first)
      const getLessonNum = (student) => {
        if (typeof student.currentLesson === 'string' && student.currentLesson.startsWith('R'))
          return -1
        const n = parseInt(student.currentLesson, 10)
        return isNaN(n) ? -1 : n
      }
      const lessonDiff = getLessonNum(b) - getLessonNum(a)
      if (lessonDiff !== 0) return lessonDiff

      // If lesson is the same, sort by name
      return a.name.localeCompare(b.name)
    })

    students.value = sortedStudents

    for (const student of sortedStudents) {
      student.hasCurrentLessonSaved = await StudentServices.fetchLessonCompletion(
        student,
        student.book,
        student.currentLesson,
      )
      const nextLesson = getNextLessonLabel(student.currentLesson, student.book)
      student.hasNextLessonSaved = await StudentServices.fetchLessonCompletion(
        student,
        student.book,
        nextLesson,
      )
    }
  }
}

const getNextLessonLabel = (currentLesson, book) => {
  const bookLessons = BookStructure[book]
  if (!bookLessons) return currentLesson

  const index = bookLessons.indexOf(String(currentLesson))
  const next = bookLessons[index + 1]
  return next
}

const sendEmailReport = async () => {
  try {
    await emailServices.sendAttendanceEmail(classId)
    $q.notify({ type: 'positive', message: 'Email report sent successfully!' })
  } catch (error) {
    console.error('Error sending email report:', error)
    $q.notify({ type: 'negative', message: 'Failed to send email report.' })
  }
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

.lesson-saved {
  color: #21ba45; /* Quasar green */
  font-weight: bold;
}
</style>
