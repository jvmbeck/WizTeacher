// stores/classStore.js
import { defineStore } from 'pinia'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../key/configKey' // adjust path as needed

export const useClassStore = defineStore('classStore', {
  state: () => ({
    classes: [],
  }),
  actions: {
    async fetchClasses() {
      const snapshot = await getDocs(collection(db, 'classes'))
      this.classes = snapshot.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().className || 'Unnamed Class',
      }))
    },
  },
})
