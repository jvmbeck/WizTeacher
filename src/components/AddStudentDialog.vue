<template>
  <q-dialog :model-value="modelValue" @update:model-value="emitClose" persistent>
    <q-card style="min-width: 400px">
      <q-card-section>
        <div class="text-h6">Add New Student</div>
      </q-card-section>

      <q-form @submit="submitStudent">
        <q-card-section class="q-gutter-md">
          <q-input v-model="newStudent.name" label="Name" outlined dense required />
          <q-input v-model="newStudent.book" label="Book" outlined dense required />
          <q-input
            v-model="newStudent.currentLesson"
            label="Current Lesson"
            type="number"
            outlined
            dense
            required
          />
          <q-select
            v-model="selectedClassId"
            :options="classes"
            option-label="name"
            option-value="id"
            emit-value
            map-options
            label="Select Class"
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

const emit = defineEmits(['update:modelValue'])

const studentStore = useStudentStore()

const selectedClassId = ref(null)

const classStore = useClassStore()
const { classes } = storeToRefs(classStore)

onMounted(() => {
  classStore.fetchClasses()
})
const newStudent = ref({
  name: '',
  book: '',
  currentLesson: 1,
  classId: selectedClassId,
})

watch(
  () => props.modelValue,
  (val) => {
    if (val) {
      newStudent.value = {
        name: '',
        book: '',
        currentLesson: 1,
        classId: selectedClassId,
      }
    }
  },
)

async function submitStudent() {
  await studentStore.addStudent(newStudent.value)
  emit('update:modelValue', false)
}

function emitClose(val) {
  emit('update:modelValue', val)
}
</script>
