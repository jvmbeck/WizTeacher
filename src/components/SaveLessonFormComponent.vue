<template>
  <q-dialog v-model="isOpen">
    <q-card>
      <q-card-section>
        <div class="text-h6">Save Lesson Info</div>
      </q-card-section>

      <q-form @submit.prevent="submitLesson">
        <q-card-section>
          <q-input v-model="lesson.book" label="Book" />
          <q-input v-model="lesson.lessonNumber" label="Lesson #" />
          <q-input v-model="lesson.grade" label="Grade" />
          <q-input v-model="lesson.notes" label="Notes" type="textarea" />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn type="submit" label="Save" color="primary" />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, watch } from 'vue'
import StudentServices from '../services/StudentServices'
import books from '../data/bookStructure.json'

const props = defineProps({
  modelValue: Boolean,
  studentId: String,
  studentName: String,
  classId: String,
})

const emit = defineEmits(['update:modelValue', 'lessonSaved'])

const isOpen = ref(props.modelValue)
const lesson = ref({
  book: '',
  lessonNumber: '',
  grade: '',
  notes: '',
})

// Watch for dialog open and fetch student data
watch(
  () => props.modelValue,
  async (val) => {
    isOpen.value = val
    if (val && props.studentId) {
      const studentDoc = await StudentServices.fetchStudentById(props.studentId)
      if (studentDoc) {
        const book = studentDoc.book || ''
        const currentLesson = studentDoc.currentLesson ?? books[book]?.[0]

        lesson.value.book = book
        lesson.value.lessonNumber = currentLesson
      }
    }
  },
)

watch(isOpen, (val) => {
  emit('update:modelValue', val)
})
const submitLesson = async () => {
  if (!props.studentId) return

  // Save lesson info
  await StudentServices.saveLessonForStudent(props.studentId, {
    ...lesson.value,
    studentName: props.studentName,
    classId: props.classId,
  })

  emit('lessonSaved')
  isOpen.value = false
}
</script>
