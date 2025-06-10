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
  runTransaction,
} from 'firebase/firestore'
import { db } from '../key/configKey.js'
import bookStructure from '../data/bookStructure.json'
import { getAuth } from 'firebase/auth'
import classServices from './ClassServices.js' // Adjust the path as necessary
import { useUserStore } from 'src/stores/userStore.js'

const userStore = useUserStore()
// Ensure userStore is imported and used correctly
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

    const auth = getAuth()
    const user = auth.currentUser

    if (!user) {
      console.warn('No user signed in')
      return
    }

    const fullLessonInfo = {
      ...lessonData,
      studentId,
      completedAt: serverTimestamp(),
      teacherId: user.uid,
      teacherName: userStore.userInfo?.name || 'Unknown Teacher',
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

    console.log(`Lesson ${lessonNumber} saved for student ${studentId}.`)
    console.log('studentData.currentLesson:', studentData.currentLesson)

    if (lessonNumber === studentData.currentLesson) {
      const { nextLesson } = this.getNextLesson(currentLesson, book)
      console.log(
        `Lesson ${lessonNumber} already marked as completed for student ${studentId} and updating to ${nextLesson}.`,
      )
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
    const absenceId = `${studentId}_${classId}_${today}`
    const absenceRef = doc(db, 'absences', absenceId)
    const studentRef = doc(db, 'students', studentId)

    // transaction ensures absence marking and counter update happen together.

    await runTransaction(db, async (transaction) => {
      // Check if absence already exists
      const absenceDoc = await transaction.get(absenceRef)
      if (absenceDoc.exists()) {
        throw new Error('Aluno já foi marcado como ausente hoje.')
      }

      // Read student document
      const studentDoc = await transaction.get(studentRef)
      if (!studentDoc.exists()) {
        throw new Error('Aluno não encontrado.')
      }

      const currentAbsences = studentDoc.data().totalAbsences || 0

      // Write: mark the absence
      transaction.set(absenceRef, {
        studentId,
        classId,
        date: today,
        reason: 'Absent',
        markedAt: serverTimestamp(),
      })

      // Write: increment totalAbsences
      transaction.update(studentRef, {
        totalAbsences: currentAbsences + 1,
      })
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

  async updateStudent(studentId, updatedData, oldClassId = null) {
    console.log('Updating student:', studentId, updatedData)

    const studentRef = doc(db, 'students', studentId)

    // Save updated fields to the student document
    const { name, book, currentLesson, classId } = updatedData
    await updateDoc(studentRef, {
      name,
      book,
      currentLesson,
      classId,
    })

    // If class has changed, update class membership
    if (oldClassId && oldClassId !== classId) {
      await classServices.removeStudentFromClass(oldClassId, studentId)
      await classServices.addStudentToClass(classId, studentId)
    }
  },

  async deleteStudent(id, classId = null) {
    try {
      const studentRef = doc(db, 'students', id)

      // If classId not provided, fetch student data
      if (!classId) {
        const studentSnap = await getDoc(studentRef)
        if (!studentSnap.exists()) throw new Error('Student not found')
        classId = studentSnap.data().classId
      }

      // Delete 'lessons' subcollection
      const lessonsRef = collection(db, 'students', id, 'lessons')
      const lessonsSnapshot = await getDocs(lessonsRef)

      await Promise.all(lessonsSnapshot.docs.map((doc) => deleteDoc(doc.ref)))

      // Delete student document
      await deleteDoc(studentRef)

      // Remove student from class
      if (classId) {
        await classServices.removeStudentFromClass(classId, id)
      }
    } catch (error) {
      console.error('Error deleting student:', error)
      throw error
    }
  },

  async removeStudentFromClass(studentId) {
    // Ensure studentId is provided
    if (!studentId) {
      throw new Error('Student ID is required')
    }
    // Fetch student document to get classId
    const studentRef = doc(db, 'students', studentId)
    const studentSnap = await getDoc(studentRef)

    // Check if student exists
    if (!studentSnap.exists()) {
      throw new Error('Student not found')
    }

    const studentData = studentSnap.data()
    const classId = studentData.classId

    // Ensure student is enrolled in a class
    if (!classId) {
      throw new Error('Student is not enrolled in any class')
    }

    // Remove student from class
    await classServices.removeStudentFromClass(classId, studentId)

    // Update student's classId to null
    await updateDoc(studentRef, {
      classId: null,
    })
  },
}

export default StudentServices
