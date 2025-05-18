import { getDoc, doc, setDoc, serverTimestamp, updateDoc } from 'firebase/firestore'
import { db } from '../key/configKey.js'

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

  async saveLessonForStudent(studentId, lessonInfo) {
    const lessonId = `${lessonInfo.book}_${lessonInfo.lessonNumber}`
    const studentLessonRef = doc(db, 'students', studentId, 'lessons', lessonId)

    const lessonData = {
      ...lessonInfo,
      completedAt: serverTimestamp(),
    }

    // Write to student's lessons subcollection
    await setDoc(studentLessonRef, lessonData)

    // === Create a meaningful ID for lessonsCompleted ===
    const today = new Date()
    const formattedDate = today.toISOString().split('T')[0] // YYYY-MM-DD
    const globalLessonId = `${studentId}_${lessonId}_${formattedDate}`

    const globalRef = doc(db, 'lessonsCompleted', globalLessonId)
    await setDoc(globalRef, {
      ...lessonData,
      studentId,
      classId: lessonInfo.classId || '',
      date: formattedDate,
    })
  },

  async updateStudentCurrentLesson(studentId) {
    const studentRef = doc(db, 'students', studentId)
    const snapshot = await getDoc(studentRef)

    if (!snapshot.exists()) {
      throw new Error('Student not found')
    }

    const currentLesson = snapshot.data().currentLesson || 0
    const nextLesson = currentLesson + 1

    await updateDoc(studentRef, {
      currentLesson: nextLesson,
    })

    return nextLesson
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
