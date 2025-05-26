import { defineStore } from 'pinia'
import StudentServices from 'src/services/StudentServices'

export const useStudentStore = defineStore('studentStore', {
  state: () => ({
    students: [],
  }),
  actions: {
    async fetchStudents() {
      this.students = await StudentServices.fetchAllStudents()
    },
    async addStudent(studentData) {
      const newStudent = await StudentServices.addStudent(studentData)
      this.students.push(newStudent)
    },
    async updateStudent(id, updatedData) {
      const existingStudent = this.students.find((s) => s.id === id)
      const oldClassId = existingStudent?.classId || null

      await StudentServices.updateStudent(id, updatedData, oldClassId)
      await this.fetchStudents()
    },
  },
})
