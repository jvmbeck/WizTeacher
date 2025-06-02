<template>
  <q-page padding>
    <q-btn to="/AdminDashboard" label="Início" />

    <q-input
      v-model="searchQuery"
      label="Buscar por nome da turma ou professor"
      clearable
      outlined
      debounce="300"
      rounded
      class="q-mb-md query-input"
    >
      <template #append>
        <q-icon name="search" />
      </template>
    </q-input>

    <q-card>
      <q-card-section class="row items-center justify-between">
        <div class="text-h5">Lista de Turmas</div>
      </q-card-section>

      <q-separator />

      <q-card-section>
        <q-table
          title="Turmas"
          :rows="filteredClassList"
          :columns="columns"
          row-key="id"
          flat
          bordered
          :loading="loading"
          loading-label="Carregando turmas..."
          separator="cell"
          :pagination="{ rowsPerPage: 0 }"
        >
          <template v-slot:body-cell-actions="props">
            <q-td :props="props">
              <q-btn
                icon="info"
                color="secondary"
                round
                dense
                @click="goToClassDetailsPage(props.row.id)"
                class="q-ml-xs"
              />
            </q-td>
          </template>
        </q-table>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { db } from '../key/configKey'
import { collection, getDocs, doc, getDoc } from 'firebase/firestore'
import { useRouter } from 'vue-router'

const router = useRouter()
const classList = ref([])
const loading = ref(true)

const goToClassDetailsPage = (classId) => {
  router.push({ name: 'classDetailsAdmin', params: { classId: classId } })
}

const searchQuery = ref('')
const filteredClassList = computed(() => {
  if (!searchQuery.value) return classList.value

  const q = searchQuery.value.toLowerCase()

  return classList.value.filter(
    (c) => c.className?.toLowerCase().includes(q) || c.teacherName?.toLowerCase().includes(q),
  )
})

const columns = [
  { name: 'className', label: 'Nome da Turma', align: 'left', field: 'className' },
  { name: 'teacherName', label: 'Professor', align: 'left', field: 'teacherName' },
  { name: 'studentCount', label: 'Qtd. de Alunos', align: 'center', field: 'studentCount' },
  { name: 'actions', label: 'Ações', align: 'center', field: 'actions' },
]

onMounted(async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'classes'))
    const classPromises = querySnapshot.docs.map(async (docSnap) => {
      const data = docSnap.data()
      let teacherName = 'Desconhecido'

      // Get teacher name if available
      if (data.teacherId) {
        const teacherRef = doc(db, 'users', data.teacherId)
        const teacherSnap = await getDoc(teacherRef)
        if (teacherSnap.exists()) {
          teacherName = teacherSnap.data().name
        }
      }

      return {
        id: docSnap.id,
        ...data,
        teacherName,
        studentCount: Array.isArray(data.studentIds) ? data.studentIds.length : 0,
      }
    })

    classList.value = await Promise.all(classPromises)
  } catch (err) {
    console.error('Erro ao buscar turmas:', err)
  } finally {
    loading.value = false
  }
})
</script>
