<template>
  <q-dialog :model-value="modelValue" @update:model-value="emitClose" persistent>
    <q-card style="min-width: 400px">
      <q-card-section>
        <div class="text-h6">Criar novo aluno</div>
      </q-card-section>

      <q-form @submit="submitStudent">
        <q-card-section class="q-gutter-md">
          <q-input v-model="newStudent.name" label="Nome" outlined dense required />
          <q-input v-model="newStudent.book" label="Livro" outlined dense required />
          <q-input
            v-model="newStudent.currentLesson"
            label="Lição Atual"
            type="number"
            outlined
            dense
            required
          />
          <q-select
            v-model="selectedClassIds"
            :options="classes"
            option-label="name"
            option-value="id"
            emit-value
            map-options
            label="Selecionar Turmas"
            multiple
            outlined
          />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn type="submit" color="primary" label="Save" />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { useClassStore } from 'src/stores/classStore'
import { useStudentStore } from 'src/stores/studentStore'
import { storeToRefs } from 'pinia'

const props = defineProps({
  modelValue: Boolean,
})

const emit = defineEmits(['update:modelValue', 'create'])

const studentStore = useStudentStore()

const selectedClassIds = ref([])

const classStore = useClassStore()
const { classes } = storeToRefs(classStore)

onMounted(() => {
  classStore.fetchClasses()
})

const newStudent = ref({
  name: '',
  book: '',
  currentLesson: 1,
  classIds: [],
})

watch(
  () => props.modelValue,
  (val) => {
    if (val) {
      newStudent.value = {
        name: '',
        book: '',
        currentLesson: 1,
        classIds: [],
      }
      selectedClassIds.value = []
    }
  },
)

async function submitStudent() {
  newStudent.value.classIds = selectedClassIds.value
  await studentStore.createStudent(newStudent.value)
  emit('create', { ...newStudent.value })
  emit('update:modelValue', false)
}

function emitClose(val) {
  emit('update:modelValue', val)
}
</script>
