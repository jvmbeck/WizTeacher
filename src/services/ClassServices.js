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
function generateClassId(classDay, schedule) {
  const name = classDay + '_' + schedule
  return name
}

const ClassServices = {
  async createClass({ classDay, schedule, teacherId }) {
    if (!classDay || !schedule || !teacherId) {
      throw new Error('Missing required fields')
    }

    const classId = generateClassId(classDay, schedule)
    const classRef = doc(db, 'classes', classId)

    const existing = await getDoc(classRef)
    if (existing.exists()) {
      throw new Error('Class already exists')
    }

    const classData = {
      classDay,
      schedule,
      teacherId,
      studentIds: [],
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
}

export default ClassServices
