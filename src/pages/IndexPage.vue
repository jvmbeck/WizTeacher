<template>
  Welcome, teacher {{ teacherName }}!
  <q-btn @click="handleSignOut" class="q-mt-md">
    <q-icon name="logout" />
    <q-tooltip anchor="top middle" self="bottom middle"> Logout </q-tooltip>
  </q-btn>
</template>

<script>
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { auth, db } from '../key/configKey.js' // Adjust the import path as necessary
import { doc, getDoc } from 'firebase/firestore'

export default {
  name: 'IndexPage',
  data() {
    return {
      teacherName: '', // Initialize teacherName
    }
  },
  methods: {
    async loadUserInfo() {
      const user = auth.currentUser
      if (user) {
        console.log('User is signed in:', user.uid)
        // User is signed in, you can access user information here
        const docRef = doc(db, 'teachers', user.uid)
        const docSnap = await getDoc(docRef)

        if (docSnap.exists()) {
          const data = docSnap.data()
          this.teacherName = data.name // Set the teacherName from Firestore
          console.log('Teacher name:', this.teacherName)
        } else {
          console.log('No such document!')
        }
      }
    },

    async handleSignOut() {
      try {
        await signOut(auth)
        console.log('User signed out.')
        this.$router.push({ name: 'LoginPage' }) // Redirect to login page
      } catch (error) {
        console.error('Error signing out:', error.message)
      }
    },
  },
  beforeMount() {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log('User is signed in:', user.uid)
        // User is signed in, you can access user information here
        this.loadUserInfo()
        // Optionally, you can also call this.loadUserInfo() here
        // to load user info immediately after authentication state changes
        // this.loadUserInfo()
      } else {
        console.log('No user is signed in.')
        // No user is signed in, redirect to login page
        this.$router.push({ name: 'LoginPage' })
      }
    })
  },
}
</script>
