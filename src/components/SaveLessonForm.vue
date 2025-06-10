<template>
  <q-dialog v-model="isOpen">
    <q-card class="q-pa-md" style="min-width: 450px; max-width: 600px">
      <q-card-section>
        <div class="text-h6">Save Lesson Info</div>
      </q-card-section>

      <q-form v-if="!endOfBook" @submit.prevent="submitLesson">
        <q-card-section>
          <q-input v-model="lesson.book" label="Book" />
          <q-input v-model="lesson.lessonNumber" label="Lesson #" />
          <div class="row q-col-gutter-md">
            <q-select
              v-for="field in gradeFields"
              :key="field.key"
              v-model="lesson[field.key]"
              :options="gradeOptions"
              :label="field.label"
              emit-value
              map-options
              class="col"
              placeholder="Selecionar nota"
            />
          </div>

          <q-input v-model="lesson.notes" label="Notes" type="textarea" />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn type="submit" label="Save" color="primary" />
        </q-card-actions>
      </q-form>
      <div v-else class="q-pa-md text-red text-bold">
        This book has ended. Please check the student's homework before assigning a new book.
      </div>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, watch } from 'vue'
import StudentServices from '../services/StudentServices'
import books from '../data/bookStructure.json'
import { getAuth } from 'firebase/auth'

const props = defineProps({
  modelValue: Boolean,
  studentId: String,
  studentName: String,
  classId: String,
})

const emit = defineEmits(['update:modelValue', 'lessonSaved'])

const endOfBook = ref(false)
const isOpen = ref(props.modelValue)
const lesson = ref({
  book: '',
  lessonNumber: '',
  gradeF: '',
  gradeA: '',
  gradeL: '',
  gradeE: ' ',
  notes: '',
})

const gradeOptions = [
  { label: 'O', value: 'O' },
  { label: 'MB', value: 'MB' },
  { label: 'B', value: 'B' },
  { label: 'R', value: 'R' },
  { label: '', value: ' ' },
]

const gradeFields = [
  { key: 'gradeF', label: 'F' },
  { key: 'gradeA', label: 'A' },
  { key: 'gradeL', label: 'L' },
  { key: 'gradeE', label: 'E' },
]

// Watch for dialog open and fetch student data
watch(
  () => props.modelValue,
  async (val) => {
    isOpen.value = val

    if (val && props.studentId) {
      const studentDoc = await StudentServices.fetchStudentById(props.studentId)
      if (!studentDoc) return

      const book = studentDoc.book || ''
      const bookLessons = books[book]

      if (!bookLessons) {
        console.warn(`Book "${book}" not found in books structure`)
        lesson.value = null
        endOfBook.value = true
        return
      }

      const currentLesson = studentDoc.currentLesson

      const currentIndex = bookLessons.indexOf(String(currentLesson))

      // If currentLesson is not in list OR it's beyond the last index => book finished
      const isEndOfBook = currentIndex === -1 || currentIndex >= bookLessons.length

      if (isEndOfBook) {
        lesson.value = null
        endOfBook.value = true
        return
      }

      // Otherwise, load current lesson for grading
      lesson.value = {
        book,
        lessonNumber: String(currentLesson),
        notes: '',
      }
      endOfBook.value = false
    }
  },
)

watch(isOpen, (val) => {
  emit('update:modelValue', val)
})
const submitLesson = async () => {
  if (!props.studentId) return

  const auth = getAuth()
  const user = auth.currentUser

  if (!user) {
    console.warn('User not authenticated')
    return
  }

  // Save lesson info

  StudentServices.saveLessonForStudent(props.studentId, {
    ...lesson.value,
    studentName: props.studentName,
    classId: props.classId,
  })

  emit('lessonSaved', { studentId: props.studentId, newLessonNumber: lesson.value.lessonNumber })
  isOpen.value = false
}
</script>
