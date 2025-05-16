import { doc, getDoc, collection, getDocs } from 'firebase/firestore'
import { db } from '../key/configKey.js' // Adjust the path as necessary

const TeacherServices = {
  async getSignedInUserInfo(userId) {
    try {
      const docRef = doc(db, 'teachers', userId) // Adjust the collection name as necessary
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        return docSnap // Return the document snapshot
      } else {
        console.log('No such document!')
        return null
      }
    } catch (error) {
      console.error('Error fetching user info:', error)
      throw error
    }
  },

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
