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
    async fetchStudentById(id) {
      return await StudentServices.fetchStudentById(id)
    },
    async createStudent(studentData) {
      const newStudent = await StudentServices.createStudent(studentData)
      this.students.push(newStudent)
    },
    async updateStudent(id, updatedData) {
      const existingStudent = this.students.find((s) => s.id === id)
      const oldClassIds = existingStudent?.classIds ? [...existingStudent.classIds] : []

      await StudentServices.updateStudent(id, updatedData, oldClassIds)
      await this.fetchStudents()
    },
    async deleteStudent(id, classId) {
      await StudentServices.deleteStudent(id, classId)
      await this.fetchStudents()
    },
  },
})
