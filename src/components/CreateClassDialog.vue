<template>
  <q-dialog v-model="isOpen" persistent>
    <q-card style="min-width: 400px">
      <q-card-section>
        <div class="text-h6">Create New Class</div>
      </q-card-section>

      <q-card-section class="q-gutter-md">
        <q-select
          v-model="form.day"
          label="Day of the Week"
          :options="daysOfWeek"
          emit-value
          map-options
        />
        <q-select
          v-model="form.type"
          label="Class Type"
          :options="classTypes"
          emit-value
          map-options
        />
        <q-time v-model="form.time" format24h label="Class Time" />
        <q-select
          v-model="form.teacherId"
          label="Teacher"
          :options="teacherOptions"
          option-label="name"
          option-value="id"
          emit-value
          map-options
        />
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Cancel" v-close-popup />
        <q-btn color="primary" label="Create" @click="handleCreate" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>
<script setup>
import { ref, watch, onMounted } from 'vue'
import { getDocs, collection } from 'firebase/firestore'
import { db } from '../key/configKey.js'
import ClassServices from '../services/ClassServices.js' // adjust the path if needed

const props = defineProps({
  modelValue: Boolean,
})
const emit = defineEmits(['update:modelValue', 'classCreated'])

const isOpen = ref(props.modelValue)
watch(
  () => props.modelValue,
  (val) => (isOpen.value = val),
)
watch(isOpen, (val) => emit('update:modelValue', val))

const form = ref({
  day: '',
  time: '',
  teacherId: '',
})

const daysOfWeek = [
  { label: 'Segunda', value: 'Segunda' },
  { label: 'Terça', value: 'Terça' },
  { label: 'Quarta', value: 'Quarta' },
  { label: 'Quinta', value: 'Quinta' },
  { label: 'Sexta', value: 'Sexta' },
  { label: 'Sábado', value: 'Sábado' },
]

const classTypes = [
  { label: 'Mista', value: 'Mista' },
  { label: 'Kids', value: 'Kids' },
  { label: 'Online', value: 'Online' },
]

const teacherOptions = ref([])

const fetchTeachers = async () => {
  const snapshot = await getDocs(collection(db, 'users'))
  teacherOptions.value = snapshot.docs.map((doc) => ({
    id: doc.id,
    name: doc.data().name,
  }))
}

const handleCreate = async () => {
  try {
    const newClass = {
      classDay: form.value.day,
      schedule: form.value.time,
      teacherId: form.value.teacherId,
      type: form.value.type,
    }

    await ClassServices.createClass(newClass)
    emit('classCreated') // notify parent
    isOpen.value = false // close dialog
  } catch (err) {
    console.error('Failed to create class:', err.message)
    // optionally show a toast or error message here
  }
}

onMounted(fetchTeachers)
</script>
