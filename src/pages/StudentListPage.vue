<template>
  <q-page padding>
    <div class="buttons-container">
      <q-btn to="/AdminDashboard" label="Início" />
      <q-input
        v-model="searchQuery"
        label="Search by name, book, or class"
        outlined
        debounce="300"
        rounded
        class="q-mt-sm list-query"
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
        <div class="text-h6">Student List</div>
      </q-card-section>

      <q-table
        :rows="filteredStudents"
        :columns="columns"
        row-key="id"
        flat
        bordered
        :filter="searchQuery"
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
    </q-card>

    <AddStudentDialog v-model="isDialogOpen"></AddStudentDialog>
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
import AddStudentDialog from '../components/AddStudentDialog.vue'
import UpdateStudentDialog from '../components/UpdateStudentDialog.vue'
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

const handleUpdateStudent = async (updatedStudent) => {
  try {
    const oldClassId = selectedStudent.value.classId
    await StudentServices.updateStudent(updatedStudent.uid, updatedStudent, oldClassId)
    $q.notify({ type: 'positive', message: 'Student updated successfully' })
    await studentStore.fetchStudents()
  } catch (err) {
    console.error(err)
    $q.notify({ type: 'negative', message: 'Failed to update student' })
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

  console.log('Classes:', classes.value)
  console.log('ClassMap:', classMap.value)
  console.log('Students:', students.value)
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
  { name: 'name', label: 'Name', field: 'name', sortable: true },
  { name: 'book', label: 'Book', field: 'book', sortable: true },
  { name: 'currentLesson', label: 'Lição Atual', field: 'currentLesson', sortable: true },
  {
    name: 'class',
    label: 'Class',
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
