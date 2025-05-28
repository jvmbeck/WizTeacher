<template>
  <q-page padding>
    <q-card>
      <q-card-section>
        <div class="text-h5">Student Details</div>
        <div v-if="student">
          <p><strong>Name:</strong> {{ student.name }}</p>
          <p><strong>Book:</strong> {{ student.book }}</p>
          <p><strong>Current Lesson:</strong> {{ student.currentLesson }}</p>
          <p><strong>Class ID:</strong> {{ student.classId }}</p>
        </div>
      </q-card-section>

      <q-separator />

      <q-card-section>
        <div class="text-subtitle1 q-mb-sm">Lessons</div>
        <q-list bordered>
          <q-item v-for="lesson in lessons" :key="lesson.id" clickable>
            <q-item-section>
              <q-item-label><strong>ID:</strong> {{ lesson.id }}</q-item-label>
              <q-item-label caption>
                {{ lesson.date ? `Date: ${lesson.date}` : '' }}
              </q-item-label>
              <q-item-label caption>
                {{ lesson.notes ? `Notes: ${lesson.notes}` : '' }}
              </q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { doc, getDoc, collection, getDocs } from 'firebase/firestore'
import { db } from '../key/configKey.js' // adjust path if needed

const route = useRoute()
const studentId = route.params.id

const student = ref(null)
const lessons = ref([])

onMounted(async () => {
  // Fetch student data
  const studentRef = doc(db, 'students', studentId)
  const studentSnap = await getDoc(studentRef)
  if (studentSnap.exists()) {
    student.value = studentSnap.data()
  }

  // Fetch lessons subcollection
  const lessonsRef = collection(db, 'students', studentId, 'lessons')
  const lessonSnaps = await getDocs(lessonsRef)

  lessons.value = lessonSnaps.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }))
})
</script>
