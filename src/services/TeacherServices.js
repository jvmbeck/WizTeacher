import { collection, getDocs } from 'firebase/firestore'
import { db } from '../key/configKey.js' // Adjust the path as necessary

const TeacherServices = {
  async fetchAllTeachers() {
    const snapshot = await getDocs(collection(db, 'teachers'))
    const teachers = []

    snapshot.forEach((doc) => {
      teachers.push({ uid: doc.id, ...doc.data() })
    })

    return teachers
  },
}

export default TeacherServices
