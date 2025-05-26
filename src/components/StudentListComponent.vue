<template>
  <q-page padding>
    <div class="buttons-container">
      <q-input
        v-model="searchQuery"
        label="Search by name, book, or class"
        outlined
        dense
        debounce="300"
        rounded
        class="q-mt-sm list-query"
      >
        <template v-slot:append>
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
      />
    </q-card>

    <AddStudentDialog v-model="isDialogOpen"></AddStudentDialog>
  </q-page>
</template>

<script setup>
import { useStudentStore } from 'src/stores/studentStore'
import { useClassStore } from 'src/stores/classStore'
import { onMounted, computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import AddStudentDialog from './AddStudentDialog.vue'

const isDialogOpen = ref(false)

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
