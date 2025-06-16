<template>
  <q-page padding>
    <div class="buttons-container">
      <q-btn to="/AdminDashboard" label="Início" />
      <q-input
        v-model="searchQuery"
        label="Pesquisar alunos, livros ou turmas"
        outlined
        debounce="300"
        rounded
        class="q-mt-sm query-input"
      >
        <template v-slot:append>
          <q-icon name="close" @click="searchQuery = ''" class="cursor-pointer" />
        </template>
        <template v-slot:before>
          <q-icon name="search" />
        </template>
      </q-input>
      <q-btn @click="isDialogOpen = true">Adicionar Aluno</q-btn>
    </div>

    <q-card>
      <q-card-section>
        <div class="text-h6">Lista de alunos</div>
      </q-card-section>

      <q-card-section>
        <q-table
          :rows="filteredStudents"
          :columns="columns"
          row-key="id"
          flat
          bordered
          :filter="searchQuery"
          :pagination="{ rowsPerPage: 0 }"
          separator="cell"
        >
          <template v-slot:body-cell-actions="props">
            <q-td class="text-right">
              <q-btn
                icon="info"
                color="secondary"
                round
                dense
                @click="goToStudentDetails(props.row.uid)"
                class="q-ml-xs"
              />
              <q-btn flat icon="edit" @click="openEditDialog(props.row)" class="q-ml-sm" />
              <q-btn
                flat
                icon="delete"
                color="negative"
                @click="confirmDelete(props.row)"
                class="q-ml-sm"
              />
            </q-td>
          </template>
        </q-table>
      </q-card-section>
    </q-card>

    <CreateStudentDialog v-model="isDialogOpen" @create="handleCreateStudent"></CreateStudentDialog>
    <UpdateStudentDialog
      v-model="isUpdateDialogOpen"
      :student="selectedStudent"
      @update="handleUpdateStudent"
    />
  </q-page>
</template>

<script setup>
import { useStudentStore } from 'src/stores/studentStore'
import { useClassStore } from 'src/stores/classStore'
import { onMounted, computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { storeToRefs } from 'pinia'
import CreateStudentDialog from 'src/components/CreateStudentDialog.vue'
import UpdateStudentDialog from 'src/components/UpdateStudentDialog.vue'
import StudentServices from 'src/services/StudentServices'

const router = useRouter()

function goToStudentDetails(studentId) {
  router.push({ name: 'studentDetails', params: { studentId: studentId } })
}

const $q = useQuasar()

const isDialogOpen = ref(false)
const isUpdateDialogOpen = ref(false)
const selectedStudent = ref(null)

const openEditDialog = (student) => {
  console.log('Editing student:', student)
  selectedStudent.value = student
  isUpdateDialogOpen.value = true
}

const handleCreateStudent = async (newStudent) => {
  try {
    console.log('Creating student:', newStudent.name)
    $q.notify({ type: 'positive', message: 'Student added successfully' })
    isDialogOpen.value = false
    await studentStore.fetchStudents()
  } catch (err) {
    console.error(err)
    $q.notify({ type: 'negative', message: 'Failed to add student' })
  }
}

const handleUpdateStudent = async (updatedStudent) => {
  try {
    const oldClassIds = [...selectedStudent.value.classIds] // ✅ Backup previous classIds array

    await studentStore.updateStudent(selectedStudent.value.id, updatedStudent, oldClassIds)

    $q.notify({ type: 'positive', message: 'Aluno atualizado com sucesso' })
    await studentStore.fetchStudents()
  } catch (err) {
    console.error(err)
    $q.notify({ type: 'negative', message: 'Falha ao atualizar aluno' })
  }
}
const confirmDelete = (student) => {
  console.log('Student to delete:', student) // ✅ check if student is defined
  console.log('Student ID:', student.uid) // ✅ check if id exists

  $q.dialog({
    title: 'Confirm Deletion',
    message: `Are you sure you want to delete ${student.name}?`,
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    try {
      await StudentServices.deleteStudent(student.uid)
      $q.notify({ type: 'positive', message: 'Student deleted successfully' })
      await studentStore.fetchStudents()
    } catch (error) {
      console.error(error)
      $q.notify({ type: 'negative', message: 'Failed to delete student' })
    }
  })
}

const studentStore = useStudentStore()
const classStore = useClassStore()

const { students } = storeToRefs(studentStore)
const { classes } = storeToRefs(classStore)

onMounted(async () => {
  await classStore.fetchClasses()
  await studentStore.fetchStudents()
})

const classMap = computed(() => {
  const map = {}
  classes.value.forEach((cls) => {
    map[cls.id] = cls.name || 'sem nome'
  })
  return map
})

const searchQuery = ref('')

const filteredStudents = computed(() => {
  const query = searchQuery.value.toLowerCase()
  return students.value.filter((student) => {
    const name = student.name?.toLowerCase() || ''
    const book = student.book?.toLowerCase() || ''
    const className = classMap.value[student.classId]?.toLowerCase() || ''

    return name.includes(query) || book.includes(query) || className.includes(query)
  })
})

const columns = [
  { name: 'name', label: 'Nome', field: 'name', sortable: true },
  { name: 'book', label: 'Livro', field: 'book', sortable: true },
  { name: 'currentLesson', label: 'Lição Atual', field: 'currentLesson', sortable: true },
  {
    name: 'class',
    label: 'Turma',
    field: 'classId', // must be a key on student object
    format: (val) => classMap.value[val] || '—',
    sortable: true,
  },
  { name: 'actions', label: '', field: 'id' },
]
</script>

<style scoped>
.buttons-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 16px;
}

.list-query {
  width: 35vw;
}
</style>
