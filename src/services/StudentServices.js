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

  async saveLesson(studentId, lessonInfo) {
    const lessonId = `${lessonInfo.book}_${lessonInfo.lessonNumber}`

    const lessonRef = doc(db, 'students', studentId, 'lessons', lessonId)

    await setDoc(lessonRef, {
      ...lessonInfo,
      completedAt: serverTimestamp(),
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
}

export default StudentServices
