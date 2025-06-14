<template>
  <q-page padding>
    <q-btn to="/AdminDashboard/studentList" label="Voltar" color="primary" class="q-mb-md" />
    <q-card>
      <q-card-section>
        <div class="text-h5">Detalhes do Aluno</div>
        <div v-if="student">
          <p><strong>Nome:</strong> {{ student.name }}</p>
          <p><strong>Livro:</strong> {{ student.book }}</p>
          <p><strong>Lição Atual:</strong> {{ student.currentLesson }}</p>
          <p><strong>Turma:</strong> {{ className || student.classId }}</p>
        </div>
      </q-card-section>

      <q-card-section>
        <div class="text-h6">Faltas: {{ absences.length }}</div>
        <q-spinner v-if="loadingAbsences" />
        <q-list v-else>
          <q-item v-for="absence in absences" :key="absence.id">
            <q-item-section>
              <q-item-label>{{ absence.date }}</q-item-label>
              <q-item-label caption>
                Turma: {{ classNamesMap[absence.classId] || absence.classId }} | Motivo:
                {{ absence.reason }}
              </q-item-label>
            </q-item-section>
          </q-item>
          <q-item v-if="absences.length === 0">
            <q-item-section>Nenhuma falta registrada.</q-item-section>
          </q-item>
        </q-list>
      </q-card-section>

      <q-separator />

      <q-card-section>
        <q-table
          class="excel-style-table"
          title="Lições do Aluno"
          :rows="lessons"
          :columns="columns"
          row-key="id"
          flat
          bordered
          dense
          separator="cell"
          :pagination="{ rowsPerPage: 0 }"
        >
        </q-table>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore'
import { db } from 'src/key/configKey.js'

const route = useRoute()

const student = ref(null)
const lessons = ref([])
const absences = ref([])
const loadingAbsences = ref(true)
const className = ref('')
const classNamesMap = ref({})

const columns = [
  { name: 'id', label: 'ID', field: 'id', align: 'left' },
  { name: 'lessonNumber', label: 'Lição', field: 'lessonNumber', align: 'left' },
  {
    name: 'completedAt',
    label: 'Concluído em',
    field: (row) =>
      row.completedAt?.toDate
        ? new Date(row.completedAt.toDate()).toLocaleDateString('pt-BR')
        : '—',
    align: 'left',
  },
  { name: 'notes', label: 'Anotações', field: 'notes', align: 'left' },
  { name: 'gradeF', label: 'F', field: 'gradeF', align: 'center' },
  { name: 'gradeA', label: 'A', field: 'gradeA', align: 'center' },
  { name: 'gradeL', label: 'L', field: 'gradeL', align: 'center' },
  { name: 'gradeE', label: 'E', field: 'gradeE', align: 'center' },
  { name: 'teacherName', label: 'Professor', field: 'teacherName', align: 'left' },
]

async function fetchClassNamesForAbsences(absencesArr) {
  const ids = [...new Set(absencesArr.map((a) => a.classId).filter(Boolean))]
  const map = {}
  for (const id of ids) {
    const classRef = doc(db, 'classes', id)
    const classSnap = await getDoc(classRef)
    map[id] = classSnap.exists() ? classSnap.data().className || id : id
  }
  classNamesMap.value = map
}

// Fetch Absences
async function fetchStudentAbsences(studentId) {
  try {
    console.log('Fetching absences for ID:', studentId)

    const absencesQuery = query(collection(db, 'absences'), where('studentId', '==', studentId))

    const querySnapshot = await getDocs(absencesQuery)
    absences.value = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))
    await fetchClassNamesForAbsences(absences.value)
    console.log('Absences:', absences.value)
  } catch (error) {
    console.error('Error fetching absences:', error)
  } finally {
    loadingAbsences.value = false
  }
}

// Fetch Student Info + Lessons
async function fetchStudentData(studentId) {
  try {
    console.log('Fetching student data for ID:', studentId)

    const studentRef = doc(db, 'students', studentId)
    const studentSnap = await getDoc(studentRef)

    if (studentSnap.exists()) {
      console.log('Student data:', studentSnap.data())
      student.value = studentSnap.data()

      // Fetch class name if classId exists
      if (student.value.classId) {
        const classRef = doc(db, 'classes', student.value.classId)
        const classSnap = await getDoc(classRef)
        if (classSnap.exists()) {
          className.value = classSnap.data().className || student.value.classId
        } else {
          className.value = student.value.classId
        }
      } else {
        className.value = ''
      }

      const lessonsRef = collection(db, 'students', studentId, 'lessons')
      const lessonSnaps = await getDocs(lessonsRef)

      lessons.value = lessonSnaps.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
    } else {
      console.error('No such student found in Firestore!')
    }
  } catch (error) {
    console.error('Error fetching student data:', error)
  }
}
// Watch for route change
watch(
  () => route.params.studentId,
  async (id) => {
    console.log('ROUTE PARAM studentId:', id)
    if (id) {
      await fetchStudentData(id)
      await fetchStudentAbsences(id)
    } else {
      console.warn('No studentId found in route params')
    }
  },
  { immediate: true },
)
</script>

<style scoped>
.excel-style-table {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.excel-style-table .q-td,
.excel-style-table .q-th {
  border: 1px solid #ccc;
  padding: 8px;
  background-color: #fdfdfd;
}

.excel-style-table .q-tr:hover {
  background-color: #e0f7fa;
}

.grades-cell {
  display: flex;
  flex-direction: row;
  gap: 8px; /* Controls the space between grades */
}

.grades-cell > div {
  min-width: 32px;
  text-align: center;
  border-right: 1px solid #eee;
}

.grades-cell > div:last-child {
  border-right: none;
}
</style>
