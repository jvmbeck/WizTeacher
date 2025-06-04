<template>
  <div class="login-page">
    <q-card class="login-card">
      <div class="text-h4 q-ma-xl">Bem-vindo ao <span class="text-blue-10">WizTeacher</span></div>
      <div class="text-body1 text-weight-light">Faça login para continuar</div>

      <q-form @submit="handleLogin" @reset="onReset" class="q-gutter-md">
        <q-input
          v-model="email"
          type="email"
          label="Digite seu E-mail *"
          lazy-rules
          :rules="[(val) => (val && val.length > 0) || 'Por favor, digite seu e-mail']"
        />

        <q-input
          type="password"
          v-model="password"
          label="Digite sua Senha *"
          lazy-rules
          :rules="[(val) => (val && val.length > 0) || 'Por favor, digite sua senha']"
        />
        <div class="buttons-container">
          <q-btn label="Redefinir senha" type="reset" color="primary" flat class="q-ml-sm" />
          <q-btn label="Login" type="submit" color="primary" />
        </div>
      </q-form>
    </q-card>
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
    }
  },
  methods: {
    async handleLogin() {
      const userStore = useUserStore()
      try {
        await AuthServices.handlePasswordAuthentication(this.email, this.password)
        await userStore.loadUserInfo()

        const role = userStore.userInfo?.role

        if (role === 'admin') {
          this.$router.push({ name: 'AdminDashboard' })
        } else if (role === 'teacher') {
          this.$router.push({ name: 'TeacherDashboard' })
        } else {
          throw new Error('Unauthorized or missing role')
        }
      } catch (error) {
        this.dialogMessage = 'Login failed: ' + error.message
        this.showDialog = true
      }
    },
  },
}
</script>

<style scoped>
.login-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background-color: #f0f0f0;
}

.login-card {
  width: 28vw;
  padding: 20px;
  border-radius: 5%;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
}

.buttons-container {
  display: flex;
  align-items: center;
  justify-content: flex-end;
}
</style>
