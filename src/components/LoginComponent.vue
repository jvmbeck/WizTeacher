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
        <button type="submit" @click="handleLogin">Login</button>
      </div>
    </form>

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
import AuthServices from 'src/services/AuthServices.js'
import { useUserStore } from 'src/stores/userStore.js'

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
    async handleLogin() {
      const userStore = useUserStore()
      try {
        await AuthServices.handlePasswordAuthentication(this.email, this.password) // Sign in the user
        await userStore.loadUserInfo() // Load user info into the store
        this.$router.push({ name: 'IndexPage' }) // Navigate to IndexPage
      } catch (error) {
        this.dialogMessage = 'Login failed: ' + error.message
        this.showDialog = true
      }
    },
    resetPassword() {
      // Handle reset password logic here
      alert('Reset password functionality not implemented yet.')
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
