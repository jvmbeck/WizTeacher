import { getDoc, doc, setDoc, serverTimestamp, updateDoc } from 'firebase/firestore'
import { db } from '../key/configKey.js'
import bookStructure from '../data/bookStructure.json'

const StudentServices = {
  async fetchStudentsByIds(studentIds) {
    const promises = studentIds.map((id) => getDoc(doc(db, 'students', id)))
    const snapshots = await Promise.all(promises)

    return snapshots
      .filter((snap) => snap.exists())
      .map((snap) => ({ uid: snap.id, ...snap.data() }))
  },

  async fetchStudentById(studentId) {
    const docRef = doc(db, 'students', studentId)
    const docSnap = await getDoc(docRef)
    return docSnap.exists() ? docSnap.data() : null
  },

  async saveLessonForStudent(studentId, lessonData) {
    const studentRef = doc(db, 'students', studentId)
    const studentSnap = await getDoc(studentRef)
    if (!studentSnap.exists()) throw new Error('Student not found')

    const studentData = studentSnap.data()
    const book = lessonData.book || studentData.book
    const currentLesson = studentData.currentLesson

    const lessonNumber = lessonData.lessonNumber
    const lessonId = `${book}_${lessonNumber}`

    const fullLessonInfo = {
      ...lessonData,
      book,
      lessonNumber,
      studentId,
      completedAt: serverTimestamp(),
    }

    // Save to student's personal lessons
    await setDoc(doc(db, 'students', studentId, 'lessons', lessonId), fullLessonInfo)

    // Save to global lessonsCompleted
    await setDoc(doc(db, 'lessonsCompleted', `${lessonId}_${studentId}`), fullLessonInfo)

    if (lessonNumber === studentData.currentLesson) {
      const { nextLesson } = this.getNextLesson(currentLesson, book)
      // Update student's current lesson if it's not the same as the completed lesson
      await updateDoc(studentRef, {
        currentLesson: nextLesson,
      })
    }
  },

  getNextLesson(currentLesson, book) {
    const lessons = bookStructure[book]
    if (!lessons) throw new Error(`Book "${book}" not found in structure`)

    const index = lessons.indexOf(String(currentLesson))

    if (index === -1) {
      throw new Error(`Lesson "${currentLesson}" not found in book "${book}"`)
    }
    const isLastLesson = index === lessons.length - 1
    const nextLesson = isLastLesson ? null : lessons[index + 1]

    return {
      nextLesson,
      isEndOfBook: isLastLesson,
    }
  },

  async markStudentAbsent(studentId, classId) {
    const today = new Date().toISOString().split('T')[0]
    const docId = `${studentId}_${classId}_${today}`
    const ref = doc(db, 'absences', docId)

    const exists = await getDoc(ref)
    if (exists.exists()) {
      throw new Error('Absence already recorded for today.')
    }

    await setDoc(ref, {
      studentId,
      classId,
      date: today,
      reason: 'Absent',
      markedAt: serverTimestamp(),
    })
  },
}

export default StudentServices
