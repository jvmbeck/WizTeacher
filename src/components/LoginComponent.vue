<template>
  <div class="login-component">
    <h2>Login</h2>
    <form @submit.prevent="handleSubmit">
      <div class="form-group">
        <label for="email">Email:</label>
        <input type="email" id="email" v-model="email" placeholder="Enter your email" required />
      </div>
      <div class="form-group">
        <label for="password">Password:</label>
        <input
          type="password"
          id="password"
          v-model="password"
          placeholder="Enter your password"
          required
        />
      </div>
      <div class="form-actions">
        <button type="button" @click="resetPassword">Reset Password</button>
        <button type="submit" @click="handlePasswordAuth">Login</button>
      </div>
    </form>
    <div class="social-login">
      <h3>Or login with:</h3>
      <button type="button" @click="handleGoogleLogin">Google</button>
    </div>

    <!-- Quasar Dialog -->
    <q-dialog v-model="showDialog" backdrop-filter="hue-rotate(120deg) blur(5px)">
      <q-card>
        <q-card-section>
          <div class="text-h6">{{ dialogMessage }}</div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="OK" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script>
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  getAuth,
} from 'firebase/auth'
import { auth, db } from '../key/configKey.js' // Adjust the import path as necessary
import { doc, getDoc } from 'firebase/firestore'

export default {
  name: 'LoginComponent',
  data() {
    return {
      email: '',
      password: '',
      showDialog: false, // Controls the visibility of the popup
      dialogMessage: '', // Message to display in the popup
    }
  },
  methods: {
    async handlePasswordAuth() {
      try {
        console.log('Email:', this.email)
        console.log('Password:', this.password)
        const authInstance = getAuth()
        const userCredential = await signInWithEmailAndPassword(
          authInstance,
          this.email,
          this.password,
        )
        const user = userCredential.user

        console.log('User signed in:', user.uid)
        this.dialogMessage = `Welcome, ${user.email}! You have signed in successfully.`
        this.showDialog = true
        // Redirect or handle successful login here
        console.log('Loading user info...')
        const docRef = doc(db, 'teachers', user.uid)
        const docSnap = await getDoc(docRef)

        if (docSnap.exists()) {
          const data = docSnap.data()
          console.log('Teacher name:', data.name)
        } else {
          console.log('No such document!')
        }
        this.$router.push({ name: 'IndexPage' }) // Adjust the route as necessary
      } catch (error) {
        console.error('Error signing in:', error.message)
        this.dialogMessage = `Login failed: ${error.message}`
        this.showDialog = true
      }
    },
    resetPassword() {
      // Handle reset password logic here
      alert('Reset password functionality not implemented yet.')
    },
    async handleGoogleLogin() {
      try {
        const provider = new GoogleAuthProvider()
        const result = await signInWithPopup(auth, provider)
        console.log('Google login successful:', result.user)
        // Redirect or handle successful login here
      } catch (error) {
        console.error('Error with Google login:', error.message)
        alert('Google login failed: ' + error.message)
      }
    },
  },
}
</script>

<style scoped>
.login-component {
  max-width: 400px;
  margin: 0 auto;
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 8px;
  background-color: #f9f9f9;
}

.form-group {
  margin-bottom: 15px;
}

label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

input {
  width: 100%;
  padding: 8px;
  box-sizing: border-box;
}

.form-actions {
  display: flex;
  justify-content: space-between;
}

button {
  padding: 10px 15px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button[type='submit'] {
  background-color: #007bff;
  color: white;
}

button[type='button'] {
  background-color: #6c757d;
  color: white;
}

.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.dialog {
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.dialog button {
  margin-top: 10px;
  padding: 10px 15px;
  border: none;
  border-radius: 4px;
  background-color: #007bff;
  color: white;
  cursor: pointer;
}
</style>
