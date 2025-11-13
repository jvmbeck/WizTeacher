import {
  getDoc,
  getDocs,
  doc,
  serverTimestamp,
  updateDoc,
  addDoc,
  collection,
  arrayUnion,
  arrayRemove,
  deleteDoc,
  runTransaction,
  writeBatch,
} from 'firebase/firestore'
import { db } from '../key/configKey.js'
import bookStructure from '../data/bookStructure.json'
import { getAuth } from 'firebase/auth'
import classServices from './ClassServices.js' // Adjust the path as necessary
import { useUserStore } from 'src/stores/userStore.js'
import { findNextClassDate, formatLocalDateKey } from 'src/utils/dateHelpers.js'

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
        classIds: data.classIds || null,
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
    if (!studentId) throw new Error('studentId is required')

    try {
      const docRef = doc(db, 'students', studentId)
      const docSnap = await getDoc(docRef)

      if (!docSnap.exists()) return null

      const data = docSnap.data() || {}

      return {
        uid: docSnap.id,
        ...data,
        // Provide sensible defaults for commonly-used fields
        name: data.name ?? '',
        book: data.book ?? '',
        currentLesson: data.currentLesson ?? '',
        classIds: data.classIds ?? [],
        totalAbsences: data.totalAbsences ?? 0,
      }
    } catch (error) {
      console.error('fetchStudentById error:', error)
      throw error
    }
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

    let fullLessonInfo = {}

    const lessonRef = doc(db, 'students', studentId, 'lessons', lessonId)
    const lessonSnap = await getDoc(lessonRef)

    if (lessonData.pendingCheck == false) {
      fullLessonInfo = {
        ...lessonData,
        checkedAt: serverTimestamp(),
        status: 'completed',
        studentId,
        teacherId: user.uid,
        teacherName: userStore.userInfo?.name || 'Unknown Teacher',
      }

      if (lessonSnap.exists()) {
        // Preserve the existing completedAt timestamp
        const existingData = lessonSnap.data()
        if (existingData.completedAt) {
          fullLessonInfo.completedAt = existingData.completedAt
        }
      } else {
        // Only add new completedAt for new lessons
        fullLessonInfo.completedAt = serverTimestamp()
      }
    } else {
      fullLessonInfo = {
        ...lessonData,
        studentId,
        completedAt: serverTimestamp(),
        checkedAt: 'pending',
        teacherId: user.uid,
        teacherName: userStore.userInfo?.name || 'Unknown Teacher',
        status: 'pending',
      }
    }

    const batch = writeBatch(db)

    const studentLessonRef = doc(db, 'students', studentId, 'lessons', lessonId)
    const globalLessonRef = doc(db, 'lessonsCompleted', `${lessonId}_${studentId}`)

    batch.set(studentLessonRef, fullLessonInfo)
    batch.set(globalLessonRef, fullLessonInfo)

    if (lessonNumber === currentLesson) {
      const { nextLesson } = this.getNextLesson(currentLesson, book)
      batch.update(studentRef, {
        currentLesson: nextLesson,
      })
    }

    //commit
    try {
      await batch.commit()
      //returns true so page can show success notification
      return true
    } catch (error) {
      console.error('❌ Batch write error:', error.code, error.message)
      return false
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

  async fetchLessonCompletion(student, book, lesson) {
    if (!book || !lesson) return false
    const lessonId = `${book}_${lesson}`
    const lessonRef = doc(db, 'students', student.uid, 'lessons', lessonId)
    const lessonSnap = await getDoc(lessonRef)
    return lessonSnap.exists()
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
        recordedAt: serverTimestamp(),
        type: 'absence',
        reason: 'Não estava presente na aula',
      })

      // Write: increment totalAbsences
      transaction.update(studentRef, {
        totalAbsences: currentAbsences + 1,
      })
    })
  },

  async createStudent(studentData) {
    const docRef = await addDoc(collection(db, 'students'), studentData)

    if (Array.isArray(studentData.classIds) && studentData.classIds.length > 0) {
      // Using a Firestore batch → So it updates all class documents in one network request.
      // Adds the new student’s ID to the studentIds array of each class.
      const batch = writeBatch(db)

      studentData.classIds.forEach((classId) => {
        const classRef = doc(db, 'classes', classId)
        batch.update(classRef, {
          studentIds: arrayUnion(docRef.id),
        })
      })

      await batch.commit()
    }

    return { id: docRef.id, ...studentData }
  },

  async updateStudent(studentId, updatedData, oldClassIds = []) {
    const studentRef = doc(db, 'students', studentId)

    const { name, book, currentLesson, classIds } = updatedData

    // ✅ Update student document with the new classIds array
    await updateDoc(studentRef, {
      name,
      book,
      currentLesson,
      classIds,
    })

    // ✅ Determine which classes the student was removed from
    const removedClasses = oldClassIds.filter((oldId) => !classIds.includes(oldId))

    // ✅ Determine which new classes the student was added to
    const addedClasses = classIds.filter((newId) => !oldClassIds.includes(newId))

    const batch = writeBatch(db)

    // ✅ Remove student from old classes
    removedClasses.forEach((classId) => {
      const classRef = doc(db, 'classes', classId)
      batch.update(classRef, {
        studentIds: arrayRemove(studentId),
      })
    })

    // ✅ Add student to new classes
    addedClasses.forEach((classId) => {
      const classRef = doc(db, 'classes', classId)
      batch.update(classRef, {
        studentIds: arrayUnion(studentId),
      })
    })

    await batch.commit()
  },

  async deleteStudent(id) {
    try {
      const studentRef = doc(db, 'students', id)

      // Fetch student to get all classIds
      const studentSnap = await getDoc(studentRef)
      if (!studentSnap.exists()) throw new Error('Student not found')

      const studentData = studentSnap.data()
      const classIds = studentData.classIds || []

      // Delete all documents inside 'lessons' subcollection
      const lessonsRef = collection(db, 'students', id, 'lessons')
      const lessonsSnapshot = await getDocs(lessonsRef)
      await Promise.all(lessonsSnapshot.docs.map((doc) => deleteDoc(doc.ref)))

      // Delete student document
      await deleteDoc(studentRef)

      // Remove student from all classes they were part of
      await Promise.all(
        classIds.map((classId) => classServices.removeStudentFromClass(classId, id)),
      )
    } catch (error) {
      console.error('Error deleting student:', error)
      throw error
    }
  },

  async removeStudentFromClass(classId, studentId) {
    if (!classId || !studentId) {
      throw new Error('Both classId and studentId are required')
    }

    const classRef = doc(db, 'classes', classId)

    // Remove studentId from the class's studentIds array
    await updateDoc(classRef, {
      studentIds: arrayRemove(studentId),
    })

    const studentRef = doc(db, 'students', studentId)

    // Also remove the classId from the student's classIds array
    await updateDoc(studentRef, {
      classIds: arrayRemove(classId),
    })
  },

  async unscheduleStudent(classId, studentId) {
    const classRef = doc(db, 'classes', classId)
    const classSnap = await getDoc(classRef)

    if (!classSnap.exists()) {
      return { success: false, reason: 'Class not found' }
    }

    const classData = classSnap.data()
    const classDays = classData.classDays || []
    const existingUnschedules = classData.unscheduledStudents || {} // keep field name consistent with your DB

    const today = new Date()
    const nextClassDate = findNextClassDate(today, classDays)

    if (!nextClassDate) {
      return { success: false, reason: 'Could not determine next class date' }
    }

    const dateKey = formatLocalDateKey(nextClassDate)
    const updatedUnschedules = { ...existingUnschedules }

    if (!Array.isArray(updatedUnschedules[dateKey])) {
      updatedUnschedules[dateKey] = []
    }

    const index = updatedUnschedules[dateKey].indexOf(studentId)

    if (index !== -1) {
      // 🔄 Student already unscheduled — remove them (toggle off)
      updatedUnschedules[dateKey].splice(index, 1)

      // If the array becomes empty, you can also optionally delete the key:
      if (updatedUnschedules[dateKey].length === 0) {
        delete updatedUnschedules[dateKey]
      }

      await updateDoc(classRef, { unscheduledStudents: updatedUnschedules })
      console.log(`🗑️ Removed ${studentId} from unscheduled list for ${dateKey}`)
      return { success: true, action: 'removed', dateKey }
    } else {
      // ➕ Student not unscheduled yet — add them
      updatedUnschedules[dateKey].push(studentId)
      await updateDoc(classRef, { unscheduledStudents: updatedUnschedules })
      console.log(`✅ Added ${studentId} to unscheduled list for ${dateKey}`)
    }

    // Add absence record
    await addDoc(collection(db, 'absences'), {
      studentId,
      classId,
      date: dateKey,
      recordedAt: new Date(),
      type: 'unschedule',
      reason: 'Desmarcou aula antecipadamente',
    })

    console.log(`✅ Unscheduled student ${studentId} for ${dateKey}`)
    return { success: true, dateKey }
  },

  async addReplenishmentStudent(classId, studentId) {
    const classRef = doc(db, 'classes', classId)
    const classSnap = await getDoc(classRef)

    if (!classSnap.exists()) {
      return { success: false, reason: 'Class not found' }
    }

    const classData = classSnap.data()
    const classDays = classData.classDays || []
    const existingReplenishments = classData.replenishmentStudents || {}

    const today = new Date()
    const nextClassDate = findNextClassDate(today, classDays)

    if (!nextClassDate) {
      return { success: false, reason: 'Could not determine next class date' }
    }

    const dateKey = formatLocalDateKey(nextClassDate)
    const updatedReplenishments = { ...existingReplenishments }

    // ✅ Check if the student already exists for this date
    if (
      Array.isArray(updatedReplenishments[dateKey]) &&
      updatedReplenishments[dateKey].includes(studentId)
    ) {
      return { success: false, reason: 'Already added for this date', dateKey }
    }

    // ✅ Add student to replenishment list for that date
    if (!updatedReplenishments[dateKey]) {
      updatedReplenishments[dateKey] = [studentId]
    } else {
      updatedReplenishments[dateKey].push(studentId)
    }

    await updateDoc(classRef, { replenishmentStudents: updatedReplenishments })

    console.log(`✅ Added replenishment student ${studentId} for ${dateKey}`)
    return { success: true, dateKey }
  },
}

export default StudentServices
