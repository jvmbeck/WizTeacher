import { defineStore } from 'pinia'
import AuthServices from 'src/services/AuthServices.js'
import DataServices from 'src/services/TeacherServices.js'

export const useUserStore = defineStore('user', {
  state: () => ({
    userInfo: null, // Store user information
  }),
  actions: {
    async loadUserInfo() {
      try {
        const user = AuthServices.getCurrentUser() // Get the currently signed-in user
        if (user) {
          const docSnap = await DataServices.getSignedInUserInfo(user.uid) // Fetch user data from Firestore
          if (docSnap) {
            this.userInfo = docSnap.data() // Save the user data in the store
            console.log('User info loaded:', this.userInfo)
          } else {
            console.warn('No user info found in Firestore.')
          }
        } else {
          console.warn('No user is signed in.')
        }
      } catch (error) {
        console.error('Error loading user info:', error)
        throw error
      }
    },
    clearUserInfo() {
      this.userInfo = null // Clear user info on logout
    },
  },
})
