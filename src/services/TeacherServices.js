import { collection, getDocs } from 'firebase/firestore'
import { db } from '../key/configKey.js' // Adjust the path as necessary

const TeacherServices = {
  async fetchAllTeachers() {
    const snapshot = await getDocs(collection(db, 'users'))
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
  },
}

export default TeacherServices
