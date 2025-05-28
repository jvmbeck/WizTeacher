import { signInWithEmailAndPassword, getAuth, signOut, onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../key/configKey.js' // Adjust the import path as necessary
import { useUserStore } from '../stores/userStore.js' // Adjust the import path as necessary

const AuthServices = {
  async handlePasswordAuthentication(email, password) {
    try {
      const authInstance = getAuth()
      const userCredential = await signInWithEmailAndPassword(authInstance, email, password)
      const user = userCredential.user

      console.log('User signed in:', user.uid)
    } catch (error) {
      console.error('Error signing in:', error.message)
    }
  },

  async handleSignOut() {
    try {
      await signOut(auth)
      console.log('User signed out.')
    } catch (error) {
      console.error('Error signing out:', error.message)
    }
  },

  async getSignedInUserInfo(userId) {
    try {
      const docRef = doc(db, 'users', userId) // Adjust the collection name as necessary
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

  checkLoginStatus() {
    // Return a new Promise object
    return new Promise((resolve, reject) => {
      // Use Firebase's onAuthStateChanged to check the authentication state
      onAuthStateChanged(
        auth,
        (user) => {
          if (user) {
            const userStore = useUserStore()
            userStore.setUser({
              uid: user.uid,
              email: user.email,
              displayName: user.displayName,
            })
            // If a user is logged in, log their UID and resolve the Promise with 'true'
            console.log('User is signed in:', user.uid)
            resolve(true) // 'resolve' is used to indicate the Promise has succeeded
          } else {
            const userStore = useUserStore()

            userStore.clearUser()
            // If no user is logged in, log the message and resolve the Promise with 'false'
            console.log('No user is signed in.')
            resolve(false) // 'resolve' is used to indicate the Promise has succeeded with a different result
          }
        },
        (error) => {
          // If an error occurs while checking the authentication state, log the error
          console.error('Error checking login state:', error)
          reject(error) // 'reject' is used to indicate the Promise has failed
        },
      )
    })
  },

  getCurrentUser() {
    const authInstance = getAuth()
    return authInstance.currentUser // Returns the currently signed-in user or null
  },
}

export default AuthServices
