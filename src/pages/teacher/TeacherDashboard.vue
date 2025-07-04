<template>
  <div class="dashboard q-pa-md">
    <div class="text-h3 text-center q-mt-md">Welcome, teacher {{ teacherName }}!</div>

    <div class="query-container">
      <q-input
        v-model="searchQuery"
        label="Pesquisar dias ou horários"
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
    </div>
    <q-card class="list-container shadow-16">
      <q-card-section>
        <div class="text-h3">Lista de Turmas</div>
      </q-card-section>
      <q-card-section>
        <div class="text-subtitle2 text-weight-regular text-grey-9">
          Você tem {{ teacherClasses.length }} turma(s) cadastrada(s).
        </div>
      </q-card-section>
      <q-card-section>
        <q-list bordered separator>
          <q-item
            v-for="classItem in filteredClasses"
            :key="classItem.id"
            clickable
            @click="$router.push({ name: 'ClassDetails', params: { id: classItem.id } })"
          >
            <q-item-section>
              <q-item-label
                ><strong> {{ classItem.className }}</strong>
              </q-item-label>
              <q-item-label class="text-subtitle2 text-weight-regular text-grey-9">
                Quantidade de alunos: {{ classItem.studentIds.length }}
              </q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useUserStore } from 'src/stores/userStore.js'
import ClassServices from 'src/services/ClassServices.js'

const userStore = useUserStore()
const teacherName = computed(() => userStore.userInfo?.name || '')
const searchQuery = ref('')
const teacherClasses = ref([])

watch(
  () => userStore.userInfo,
  async (userInfo) => {
    if (userInfo?.uid) {
      teacherClasses.value = await ClassServices.fetchClassesByTeacher(userInfo.uid)
    } else {
      console.error('No teacher ID found')
    }
  },
  { immediate: true }, // Run immediately if userInfo is already available
)

const filteredClasses = computed(() => {
  if (!searchQuery.value) return teacherClasses.value

  const query = searchQuery.value.toLowerCase()
  return teacherClasses.value.filter((classItem) => {
    const daysMatch = Array.isArray(classItem.classDays)
      ? classItem.classDays.some((day) => day.toLowerCase().includes(query))
      : false

    const scheduleMatch = classItem.schedule.toLowerCase().includes(query)

    return daysMatch || scheduleMatch
  })
})
</script>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.query-container {
  display: flex;
  justify-content: center;
  margin-top: 16px;
}
.list-container {
  display: flex;
  flex-direction: column;
  max-height: 70vh;
  width: 50vw;
  align-items: center;
  overflow-y: auto;
  margin-top: 16px;
  background: #fff;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  font-size: 1.5rem;
}
</style>
