import {
  getDoc,
  getDocs,
  doc,
  setDoc,
  serverTimestamp,
  updateDoc,
  addDoc,
  collection,
  arrayUnion,
  deleteDoc,
} from 'firebase/firestore'
import { db } from '../key/configKey.js'
import bookStructure from '../data/bookStructure.json'
import { getAuth } from 'firebase/auth'
import classServices from './ClassServices.js' // Adjust the path as necessary

const StudentServices = {
  async fetchAllStudents() {
    const snapshot = await getDocs(collection(db, 'students'))
    const students = snapshot.docs.map((docSnap) => {
      const data = docSnap.data()
      return {
        uid: docSnap.id,
        name: data.name || '',
        book: data.book || '',
        currentLesson: data.currentLesson || '',
        classId: data.classId || null,
      }
    })
    return students
  },
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

    const auth = getAuth()
    const user = auth.currentUser

    if (!user) {
      console.warn('No user signed in')
      return
    }
    try {
      await setDoc(doc(db, 'students', studentId, 'lessons', lessonId), fullLessonInfo)
    } catch (error) {
      console.error('❌ StudentDoc write error:', error.code, error.message)
    }
    // Save to student's personal lessons

    // Save to global lessonsCompleted
    try {
      await setDoc(doc(db, 'lessonsCompleted', `${lessonId}_${studentId}`), fullLessonInfo)
    } catch (error) {
      console.error('❌ lessonsCompleted write error:', error.code, error.message)
    }

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

  async addStudent(studentData) {
    const docRef = await addDoc(collection(db, 'students'), studentData)

    if (studentData.classId) {
      const classRef = doc(db, 'classes', studentData.classId)
      await updateDoc(classRef, {
        studentIds: arrayUnion(docRef.id),
      })
    }

    return { id: docRef.id, ...studentData }
  },

  async updateStudent(id, updatedData, oldClassId = null) {
    console.log('Updating student ID:', id)
    console.log('Updated Data:', updatedData)
    if (!updatedData.classId) {
      console.error('updatedData.classId is undefined')
    }

    const docRef = doc(db, 'students', id)
    await updateDoc(docRef, updatedData)
    if (oldClassId && updatedData.classId && oldClassId !== updatedData.classId) {
      console.log('Moving student to new class:', {
        oldClassId,
        newClassId: updatedData.classId,
        studentId: id,
      })
      await classServices.updateClassStudentRefs(oldClassId, updatedData.classId, id)
    }
  },

  async deleteStudent(id, classId = null) {
    await deleteDoc(doc(db, 'students', id))

    if (classId) {
      await classServices.removeStudentFromClass(classId, id)
    }
  },
}

export default StudentServices
