<template>
  <q-page padding>
    <q-btn to="/AdminDashboard/classList" label="Voltar" color="primary" class="q-mb-md" />

    <q-card>
      <q-btn label="Editar Turma" icon="edit" @click="editDialog = true" class="q-mb-md" />
      <q-card-section>
        <div class="text-h5">Detalhes da Turma</div>
        <div v-if="classData">
          <p><strong>Dias:</strong> {{ classData.classDays.join(', ') }}</p>
          <p><strong>Horário:</strong> {{ classData.schedule }}</p>
          <p><strong>Duração:</strong> {{ classData.classDuration }} minutos</p>
          <p><strong>Professor:</strong> {{ teacherName }}</p>
          <p><strong>Tipo de Turma:</strong> {{ classData.classType }}</p>
          <p><strong>Quantidade de Alunos:</strong> {{ students.length }}</p>
        </div>
      </q-card-section>

      <q-separator />

      <q-btn
        label="Adicionar aluno à turma"
        color="primary"
        @click="openAddStudentDialog()"
        class="q-mb-md"
      />
      <q-btn
        label="Adicionar aluno de reposição à turma"
        color="primary"
        @click="openAddStudentDialog()"
        class="q-mb-md"
      />

      <q-card-section>
        <div class="text-subtitle1">Alunos</div>
        <q-list bordered>
          <q-item v-for="student in students" :key="student.id">
            <q-item-section>
              <q-item-label>{{ student.name }}</q-item-label>
              <q-item-label caption>ID: {{ student.id }}</q-item-label>
            </q-item-section>

            <q-item-section side>
              <div class="row q-gutter-sm">
                <q-btn
                label="Ver detalhes"
                  flat
                  color="primary"
                  icon="visibility"
                  @click="openStudentDialog(student.id)"
                >
                  <q-tooltip>Ver detalhes</q-tooltip>
                </q-btn>

                <q-btn
                label="Desmarcar próxima aula"
                  flat
                  color="negative"
                  icon="event_busy"
                  @click="StudentServices.unscheduleStudent(classId, student.id)"
                >
                  <q-tooltip>Desmarcar próxima aula</q-tooltip>
                </q-btn>
              </div>
            </q-item-section>
          </q-item>

          <q-item v-if="students.length === 0">
            <q-item-section>Nenhum aluno encontrado.</q-item-section>
          </q-item>
        </q-list>
      </q-card-section>
    </q-card>

    <!-- Student Details Dialog -->
    <q-dialog v-model="isDialogOpen" persistent>
      <q-card class="student-details-card">
        <q-card-section>
          <div class="text-h6">Detalhes do Aluno</div>
        </q-card-section>

        <q-btn
          icon="close"
          color="negative"
          flat
          dense
          @click="removeStudentFromClass(classId, selectedStudent.id)"
          title="Remover aluno"
        />

        <q-card-section v-if="selectedStudent">
          <p><strong>Nome:</strong> {{ selectedStudent.name }}</p>
          <p><strong>Livro:</strong> {{ selectedStudent.book }}</p>
          <p><strong>Lição Atual:</strong> {{ selectedStudent.currentLesson }}</p>
          <p v-if="classInfo"><strong>Nome da Turma:</strong> {{ classInfo.className }}</p>
        </q-card-section>

        <q-separator />

        <q-card-section>
          <div class="text-subtitle1 q-mb-sm">Faltas</div>
          <q-spinner v-if="loadingAbsences" />
          <q-list v-else>
            <q-item v-for="absence in absences" :key="absence.id">
              <q-item-section>
                <q-item-label>ID da turma: {{ absence.classId }}</q-item-label>
                <q-item-label>Data: {{ formatDate(absence.markedAt) }}</q-item-label>
                <q-item-label caption> Motivo: {{ absence.reason }} </q-item-label>
              </q-item-section>
            </q-item>
            <q-item v-if="absences.length === 0">
              <q-item-section>Nenhuma falta registrada.</q-item-section>
            </q-item>
          </q-list>
        </q-card-section>

        <q-separator />

        <q-card-section>
          <div class="text-subtitle1 q-mb-sm">Lições</div>
          <q-spinner v-if="loadingLessons" />
          <q-table
            :rows="lessons"
            :columns="columns"
            row-key="id"
            class="my-table"
            flat
            bordered
            dense
            :rows-per-page-options="[0]"
            separator="cell"
          >
            <template v-slot:body-cell-completedAt="props">
              <q-td :props="props">
                {{ formatDate(props.row.completedAt) }}
              </q-td>
            </template>
          </q-table>
          <q-item v-if="lessons.length === 0">
            <q-item-section>Nenhuma lição registrada.</q-item-section>
          </q-item>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Fechar" color="primary" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
    <!-- Add Student Dialog -->
    <q-dialog v-model="isAddDialogOpen">
      <q-card style="min-width: 500px">
        <q-card-section class="row items-center">
          <div class="text-h6">Selecionar Aluno</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section>
          <q-select
            v-model="selectedStudentId"
            :options="filteredStudents"
            label="Aluno"
            option-label="label"
            option-value="value"
            emit-value
            map-options
            dense
            filled
            use-input
            hide-selected
            fill-input
            input-debounce="0"
            @filter="filterStudents"
          >
            <template v-slot:no-option>
              <q-item>
                <q-item-section class="text-grey">
                  Nenhum aluno encontrado
                </q-item-section>
              </q-item>
            </template>
          </q-select>
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn
            flat
            label="Adicionar"
            color="primary"
            :disable="!selectedStudentId"
            @click="addStudentToClass"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
    <!-- Add Replenishment Student Dialog -->
     <q-dialog v-model="isAddDialogOpen">
      <q-card style="min-width: 500px">
        <q-card-section class="row items-center">
          <div class="text-h6">Selecionar Aluno</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section>
          <q-select
            v-model="selectedStudentId"
            :options="filteredStudents"
            label="Aluno"
            option-label="label"
            option-value="value"
            emit-value
            map-options
            dense
            filled
            use-input
            hide-selected
            fill-input
            input-debounce="0"
            @filter="filterStudents"
          >
            <template v-slot:no-option>
              <q-item>
                <q-item-section class="text-grey">
                  Nenhum aluno encontrado
                </q-item-section>
              </q-item>
            </template>
          </q-select>
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn
            flat
            label="Adicionar"
            color="primary"
            :disable="!selectedStudentId"
            @click="addReplenishmentStudentToClass()"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <UpdateClassDialog
      v-model="editDialog"
      :class-id="classId"
      :class-data="classData"
      @classUpdated="fetchClassDetails"
      @classDeleted="fetchClassDetails"
    />
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { useRoute } from 'vue-router'
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore'
import { db } from 'src/key/configKey.js'
import dayjs from 'dayjs'
import ClassServices from 'src/services/ClassServices.js'
import StudentServices from 'src/services/StudentServices.js'
import UpdateClassDialog from 'src/components/UpdateClassDialog.vue'

const route = useRoute()
const $q = useQuasar()
const classId = route.params.classId

const editDialog = ref(false)
const isAddDialogOpen = ref(false)
const isDialogOpen = ref(false)
const selectedStudent = ref(null)
const absences = ref([])
const lessons = ref([])
const loadingAbsences = ref(false)
const loadingLessons = ref(false)
const classData = ref(null)
const students = ref([])
const teacherName = ref('')
const selectedStudentId = ref(null)
const availableStudents = ref([]) // { label: 'Name', value: 'id' }
const classInfo = ref(null)
const filteredStudents = ref([])

function formatDate(timestamp) {
  if (!timestamp) return ''
  if (timestamp.toDate) {
    return dayjs(timestamp.toDate()).format('DD/MM/YYYY')
  }
}

async function openStudentDialog(studentId) {
  const docRef = doc(db, 'students', studentId)
  const docSnap = await getDoc(docRef)
  if (docSnap.exists()) {
    selectedStudent.value = docSnap.data()
    selectedStudent.value.id = docSnap.id // Add the document ID to the student object
    await fetchAbsences(studentId)
    await fetchLessons(studentId)
    classInfo.value = await ClassServices.fetchClassById(classId)
    isDialogOpen.value = true
  } else {
    console.error('Aluno não encontrado.')
  }
}

function openAddStudentDialog() {
  fetchAvailableStudents()
  isAddDialogOpen.value = true
  selectedStudentId.value = null
}

async function removeStudentFromClass(classId, studentId) {
  $q.dialog({
    title: 'Remover aluno',
    message: 'Tem certeza que deseja remover este aluno da turma?',
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    try {
      await StudentServices.removeStudentFromClass(classId, studentId)
      isDialogOpen.value = false
      selectedStudent.value = null
      await fetchClassDetails(classData.value.studentIds || [])
      $q.notify({
        type: 'positive',
        message: 'Aluno removido da turma com sucesso!',
      })
    } catch (err) {
      console.error('Erro ao remover aluno da turma:', err)
      $q.notify({
        type: 'negative',
        message: 'Erro ao remover aluno.',
      })
    }
  })
}

const addStudentToClass = async () => {
  if (!selectedStudentId.value) return

  try {
    await ClassServices.addStudentToClassAdmin(classId, selectedStudentId.value)
    isAddDialogOpen.value = false
    selectedStudentId.value = null
    await fetchAvailableStudents()
    await fetchClassDetails()
  } catch (err) {
    console.error('Erro ao adicionar aluno à turma:', err)
  }
}

const addReplenishmentStudentToClass = async () => {
  if (!selectedStudentId.value) return

  try {
    await ClassServices.addReplenishmentStudentToClassAdmin(classId, selectedStudentId.value)
    isAddDialogOpen.value = false
    selectedStudentId.value = null
    await fetchAvailableStudents()
    await fetchClassDetails()
  } catch (err) {
    console.error('Erro ao adicionar aluno de reposição à turma:', err)
  }
}

async function fetchAbsences(studentId) {
  loadingAbsences.value = true
  absences.value = []
  const absRef = collection(db, 'absences')
  const q = query(absRef, where('studentId', '==', studentId))
  const querySnap = await getDocs(q)
  absences.value = querySnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
  loadingAbsences.value = false
}

async function fetchLessons(studentId) {
  loadingLessons.value = true
  lessons.value = []
  const lessonsRef = collection(db, 'lessonsCompleted')
  const q = query(lessonsRef, where('studentId', '==', studentId))
  const querySnap = await getDocs(q)
  lessons.value = querySnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
  loadingLessons.value = false
}

async function fetchClassDetails() {
  const classRef = doc(db, 'classes', classId)
  const classSnap = await getDoc(classRef)

  if (classSnap.exists()) {
    classData.value = classSnap.data()
    await fetchTeacherName(classData.value.teacherId)
    await fetchStudents(classData.value.studentIds || [])
  } else {
    console.error('Turma não encontrada')
  }
}

async function fetchTeacherName(teacherId) {
  try {
    console.log('Buscando professor com ID:', teacherId)

    const teacherRef = doc(db, 'users', teacherId)
    const teacherSnap = await getDoc(teacherRef)
    if (teacherSnap.exists()) {
      teacherName.value = teacherSnap.data().name
    }
  } catch (error) {
    console.error('Erro ao buscar professor:', error)
  }
}

async function fetchStudents(ids) {
  const promises = ids.map(async (id) => {
    const studentRef = doc(db, 'students', id)
    const studentSnap = await getDoc(studentRef)
    return studentSnap.exists() ? { id, ...studentSnap.data() } : null
  })

  const results = await Promise.all(promises)
  students.value = results.filter((s) => s !== null)
}

const fetchAvailableStudents = async () => {
  try {
    const snapshot = await getDocs(collection(db, 'students'))

    const allStudents = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))

    console.log('All students:', allStudents)

    const filtered = allStudents.filter((student) => !student.classId)

    availableStudents.value = filtered.map((student) => ({
      label: student.name,
      value: student.id,
    }))

    console.log('Available students:', availableStudents.value)
  } catch (error) {
    console.error('Failed to fetch available students:', error)
  }
}
const columns = [
  { name: 'lessonNumber', label: 'Lição', align: 'left', field: 'lessonNumber' },
  { name: 'completedAt', label: 'Data', align: 'left', field: 'completedAt' },
  { name: 'notes', label: 'Anotações', align: 'left', field: 'notes' },
  { name: 'gradeF', label: 'F', align: 'center', field: 'gradeF' },
  { name: 'gradeA', label: 'A', align: 'center', field: 'gradeA' },
  { name: 'gradeL', label: 'L', align: 'center', field: 'gradeL' },
  { name: 'gradeE', label: 'E', align: 'center', field: 'gradeE' },
  { name: 'teacherName', label: 'Professor', align: 'left', field: 'teacherName' },
]

onMounted(() => {
  fetchClassDetails()
})

function filterStudents(val, update) {
  if (val === '') {
    update(() => {
      filteredStudents.value = availableStudents.value
    })
    return
  }

  update(() => {
    const needle = val.toLowerCase()
    filteredStudents.value = availableStudents.value.filter(
      student => student.label.toLowerCase().indexOf(needle) > -1
    )
  })
}
</script>

<style scoped>
.my-table {
  max-height: 300px;
  width: 30vw;
  overflow-y: auto;
  align-self: center;
  margin: 0 auto;
}

.student-details-card {
  display: flex;
  flex-direction: column;
  min-width: 35vw;
}
.grades-cell {
  display: flex;
  flex-direction: row;
}
.grades-cell > div {
  min-width: 32px;
  text-align: center;
  border-right: 1px solid #eee;
  margin-right: 8px;
}
.grades-cell > div:last-child {
  border-right: none;
  margin-right: 0;
}
</style>
