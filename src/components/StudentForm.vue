<template>
  <q-dialog :model-value="modelValue" @update:model-value="emitClose" persistent>
    <q-card style="min-width: 400px">
      <q-card-section>
        <div class="text-h6">Add New Student</div>
      </q-card-section>

      <q-form @submit="handleSubmit" class="q-gutter-md">
        <q-card-section class="q-gutter-md">
          <q-input v-model="form.name" label="Name" outlined dense required />
          <q-input v-model="form.book" label="Book" outlined dense required />
          <q-input
            v-model="form.currentLesson"
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
import { ref, watch, onMounted, reactive } from 'vue'
import { useClassStore } from 'src/stores/classStore'
import { useStudentStore } from 'src/stores/studentStore'
import { storeToRefs } from 'pinia'

const props = defineProps({
  modelValue: Boolean,
  studentToEdit: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['update:modelValue'])

const studentStore = useStudentStore()

const selectedClassId = ref(null)

const classStore = useClassStore()
const { classes } = storeToRefs(classStore)

onMounted(() => {
  classStore.fetchClasses()
})
const form = reactive({
  name: '',
  book: '',
  currentLesson: '',
  classId: '',
})

watch(
  () => props.studentToEdit,
  (newVal) => {
    if (newVal) {
      Object.assign(form, { ...newVal }) // populate with student's existing info
    } else {
      Object.assign(form, {
        name: '',
        book: '',
        currentLesson: '',
        classId: '',
      })
    }
  },
  { immediate: true },
)

const handleSubmit = async () => {
  if (props.studentToEdit.value) {
    await studentStore.updateStudent(props.studentToEdit.value.id, { ...form })
  } else {
    await studentStore.addStudent({ ...form })
  }
  emit('update:modelValue', false)
}
function emitClose(val) {
  emit('update:modelValue', val)
}
</script>
