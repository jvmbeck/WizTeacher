// services/classes.js
import {
  doc,
  setDoc,
  getDoc,
  collection,
  getDocs,
  query,
  where,
  updateDoc,
  arrayRemove,
  arrayUnion,
} from 'firebase/firestore'
import { db } from '../key/configKey.js' // Adjust the path as necessary
//import { useUserStore } from '../stores/userStore.js' // Adjust the path as necessary

// helper to convert a class name into a Firestore-safe ID
function generateClassId(classDay, schedule, type) {
  const name = classDay + ' ' + schedule + ' - ' + type
  return name
}

const ClassServices = {
  async createClass({ classDay, schedule, teacherId, type }) {
    if (!classDay || !schedule || !teacherId || !type) {
      throw new Error('Missing required fields')
    }

    const classId = generateClassId(classDay, schedule, type)
    const classRef = doc(db, 'classes', classId)

    const existing = await getDoc(classRef)
    if (existing.exists()) {
      throw new Error('Class already exists')
    }

    const className = `${classDay} ${schedule} - ${type}`

    const classData = {
      className,
      classDay,
      schedule,
      teacherId,
      studentIds: [],
      type,
    }

    await setDoc(classRef, classData)
    return classId
  },

  async fetchAllClasses() {
    const snapshot = await getDocs(collection(db, 'classes'))
    const classes = []

    snapshot.forEach((doc) => {
      classes.push({ id: doc.id, ...doc.data() })
    })

    return classes
  },

  async fetchClassesByTeacher(teacherId) {
    const q = query(collection(db, 'classes'), where('teacherId', '==', teacherId))
    const snapshot = await getDocs(q)
    const classes = []

    snapshot.forEach((doc) => {
      classes.push({ id: doc.id, ...doc.data() })
    })

    return classes
  },
  async updateClassStudentRefs(oldClassId, newClassId, studentId) {
    if (oldClassId) {
      await updateDoc(doc(db, 'classes', oldClassId), {
        students: arrayRemove(studentId),
      })
    }
    if (newClassId) {
      await updateDoc(doc(db, 'classes', newClassId), {
        students: arrayUnion(studentId),
      })
    }
  },

  async addStudentToClass(classId, studentId) {
    const classRef = doc(db, 'classes', classId)
    await updateDoc(classRef, {
      studentIds: arrayUnion(studentId),
    })
  },

  async addStudentToClassAdmin(classId, studentId) {
    if (!classId || !studentId) throw new Error('Missing classId or studentId')

    const classRef = doc(db, 'classes', classId)
    const studentRef = doc(db, 'students', studentId)

    await updateDoc(classRef, {
      studentIds: arrayUnion(studentId),
    })

    await updateDoc(studentRef, {
      classId: classId,
    })
  },

  async removeStudentFromClass(classId, studentId) {
    const classRef = doc(db, 'classes', classId)
    await updateDoc(classRef, {
      studentIds: arrayRemove(studentId),
    })
  },
}

export default ClassServices
