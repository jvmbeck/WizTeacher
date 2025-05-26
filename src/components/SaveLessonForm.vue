<template>
  <q-dialog v-model="isOpen">
    <q-card>
      <q-card-section>
        <div class="text-h6">Save Lesson Info</div>
      </q-card-section>

      <q-form v-if="!endOfBook" @submit.prevent="submitLesson">
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
import { onAuthStateChanged } from '../key/configKey.js'

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
        grade: '',
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

  onAuthStateChanged(auth, (user) => {
    if (user) {
      console.log('✅ Auth ready. UID:', user.uid)
      // now it's safe to call saveLessonForStudent or Firestore writes
      StudentServices.saveLessonForStudent(props.studentId, {
        ...lesson.value,
        studentName: props.studentName,
        classId: props.classId,
      })
    } else {
      console.warn('❌ User not logged in.')
    }
  })

  emit('lessonSaved')
  isOpen.value = false
}
</script>
