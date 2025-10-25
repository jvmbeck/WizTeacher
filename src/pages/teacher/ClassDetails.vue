<template>
  <div class="q-pa-md">
    <q-btn to="/TeacherDashboard">To Teacher Dashboard</q-btn>
    <h5 class="classTile">{{ classInfo?.className }}</h5>
    <div class="class-header q-mb-md">
      <q-btn
        v-if="$q.screen.gt.sm"
        color="primary"
        icon="content_copy"
        label="Copy All"
        @click="copyAllStudentsInfo"
      />
      <q-btn
        color="primary"
        icon="email"
        label="Send Email Report"
        @click="sendEmailReport"
        disabled
      />
      <q-btn color="primary" icon="rate_review" label="Grade Homework" class="q-mt-md" @click="isSaveHomeworkFormOpen = true"></q-btn>

    </div>

    <q-list bordered separator>
      <q-item v-for="student in students" :key="student.uid">
        <q-item-section side class="d-flex items-center justify-center">
          <q-avatar size="80" :color="student.isAbsentToday ? 'red-5' : 'blue-8'">
            <div class="full-center avatar-initials">
              {{ (student.name || '').split(' ').map(n => n[0]).slice(0,2).join('').toUpperCase() }}
            </div>
          </q-avatar>
        </q-item-section>

        <q-item-section>
          <q-item-label class="text-weight-bold q-mb-sm">{{ student.name }}</q-item-label>

          <div class="row items-center q-gutter-sm">
            <q-chip dense :color="student.hasCurrentLessonSaved ? 'green-6' : 'grey-10'" text-color="white" outline>
              <q-icon :name="student.hasCurrentLessonSaved ? 'check_circle' : 'hourglass_empty'" size="14" />
              <span class="q-ml-xs">{{ student.currentLesson ?? '—' }}</span>
            </q-chip>

            <q-chip dense v-if="getNextLessonLabel(student.currentLesson, student.book)" :color="student.hasNextLessonSaved ? 'green-6' : 'grey-10'" text-color="white" outline>
              <q-icon :name="student.hasNextLessonSaved ? 'check_circle' : 'hourglass_empty'" size="14" />
              <span class="q-ml-xs">{{ getNextLessonLabel(student.currentLesson, student.book) }}</span>
            </q-chip>

            <q-chip dense outline class="q-ml-sm" color="blue-8">{{ student.book }}</q-chip>

            <q-badge color="negative" v-if="student.isAbsentToday" class="q-ml-sm">Ausente</q-badge>
          </div>
        </q-item-section>

        <q-item-section side top style="display:flex; gap:8px; align-items:center;">
          <q-btn
            v-if="$q.screen.gt.sm"
            dense
            round
            flat
            icon="content_copy"
            color="primary"
            @click="copyStudentInfo(student)">
            <q-tooltip>Copiar info de {{ student.name }}</q-tooltip>
          </q-btn>

          <!-- Desktop version with label -->
          <q-btn
            v-if="$q.screen.gt.sm"
            flat
            color="primary"
            icon="edit"
            label="Edit Lesson"
            @click="openLessonForm(student.uid)"
          />
          <!-- Mobile version -->
          <q-btn
            v-else
            round
            flat
            icon="edit"
            color="primary"
            size="md"
            @click="openLessonForm(student.uid)"
          />

          <!-- Desktop version with label -->
          <q-btn
            v-if="$q.screen.gt.sm"
            flat
            color="negative"
            icon="event_busy"
            label="Mark Absent"
            @click="markAbsent(student.uid)"
          />
          <!-- Mobile version -->
          <q-btn
            v-else
            round
            flat
            icon="event_busy"
            color="negative"
            size="md"
            @click="markAbsent(student.uid)"
          />
        </q-item-section>
      </q-item>
    </q-list>
  </div>

  <!-- Import the SaveLessonForm component -->
  <SaveLessonForm
    v-model="isSaveLessonFormOpen"
    :student-id="selectedStudentId"
    :student-name="selectedStudent?.name"
    :class-id="classId"
    @lessonSaved="onLessonSaved"
  />
  <q-dialog v-model="isSaveHomeworkFormOpen" persistent>
        <HwGradingForm @close="isSaveHomeworkFormOpen = false" :students="students"/>
  </q-dialog>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
// changed import: add setDoc, deleteDoc, serverTimestamp
import { doc, getDoc, collection, query, where, getDocs, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../key/configKey.js'
import StudentServices from '../../services/StudentServices.js'
import SaveLessonForm from 'src/components/SaveLessonForm.vue'
import BookStructure from '../../data/bookStructure.json'
import { useQuasar } from 'quasar'
import emailServices from 'src/services/EmailServices.js'
import HwGradingForm from 'src/components/HwGradingForm.vue'

const $q = useQuasar()

const route = useRoute()
const classId = route.params.id


const classInfo = ref(null)
const students = ref([])
const selectedStudentId = ref(null)
const selectedStudent = ref(null)
const isSaveLessonFormOpen = ref(false)
const isSaveHomeworkFormOpen = ref(false)


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
  isSaveLessonFormOpen.value = true
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
  if (!studentId) return

  // confirmation dialog — perform toggle inside onOk so we can update UI immediately afterwards
  $q
    .dialog({
      title: 'Confirm absence',
      message: 'Mark this student as absent for today? (Toggling will unmark if already absent)',
      cancel: true,
      persistent: true,
    })
    .onOk(async () => {
      try {
        const today = new Date().toISOString().split('T')[0]
        const absenceDocId = `${classId}_${studentId}_${today}`
        const absenceRef = doc(db, 'absences', absenceDocId)
        const absenceSnap = await getDoc(absenceRef)

        if (absenceSnap.exists()) {
          // unmark absence
          await deleteDoc(absenceRef)
          $q.notify({ type: 'positive', message: 'Ausência removida.' })
        } else {
          // mark absence
          await setDoc(absenceRef, {
            studentId,
            classId,
            date: today,
            createdAt: serverTimestamp(),
          })
          $q.notify({ type: 'positive', message: 'Aluno marcado como ausente.' })
        }

        // Re-query today's absences for this class and update students in-place
        const todayQuery = query(
          collection(db, 'absences'),
          where('classId', '==', classId),
          where('date', '==', today)
        )
        const absSnap = await getDocs(todayQuery)
        const absentStudentIds = absSnap.docs.map((d) => d.data().studentId)

        // Update local students array without refetching everything
        students.value = students.value.map((s) => ({
          ...s,
          isAbsentToday: absentStudentIds.includes(s.uid),
        }))
      } catch (err) {
        console.error('Error toggling absence:', err)
        $q.notify({ type: 'negative', message: 'Erro ao atualizar ausência.' })
      }
    })
    .onCancel(() => {
      // cancelled
    })
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
.classTile {
  font-size: 1.5rem;
  font-weight: bold;
  width: 100%;
  text-align: center;
}
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

/* Improve touch targets on mobile */
@media (max-width: 599px) {
  .q-item-section[side] {
    gap: 20px !important;  /* increase spacing between buttons */
    padding: 10px;  /* add some padding around the buttons */
  }

  /* Make icons slightly larger on mobile */
  .q-btn ::v-deep(.q-icon) {
    font-size: 1.6rem;
  }
}

.full-center { display: flex; align-items: center; justify-content: center; height: 100%; }
.avatar-initials { font-weight: 600; color: white; }
</style>
