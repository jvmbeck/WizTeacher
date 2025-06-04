<template>
  <q-dialog v-model="isOpen" persistent>
    <q-card style="min-width: 400px">
      <q-card-section>
        <div class="text-h6">Edit Student</div>
      </q-card-section>

      <q-card-section>
        <q-input v-model="editedData.name" label="Name" outlined class="q-mb-sm" />
        <q-input v-model="editedData.book" label="Book" outlined class="q-mb-sm" />
        <q-input
          v-model="editedData.currentLesson"
          label="Current Lesson"
          outlined
          class="q-mb-sm"
        />
        <q-select
          v-model="editedData.classId"
          :options="classOptions"
          label="Class"
          option-label="label"
          option-value="value"
          emit-value
          map-options
          outlined
        />
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Cancel" v-close-popup />
        <q-btn color="primary" label="Save" @click="submitEdit" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { useClassStore } from 'src/stores/classStore'

const props = defineProps({
  modelValue: Boolean,
  student: Object,
})

const emit = defineEmits(['update:modelValue', 'update'])

const isOpen = ref(false)
const editedData = ref({})
const classOptions = ref([])

const classStore = useClassStore()

// Load class options on mount
onMounted(async () => {
  await classStore.fetchClasses()
  classOptions.value = classStore.classes.map((cls) => ({
    label: cls.name || 'Unnamed Class',
    value: cls.id,
  }))
})

// Sync dialog visibility
watch(
  () => props.modelValue,
  (val) => {
    isOpen.value = val
    if (val && props.student) {
      editedData.value = { ...props.student } // Clone student data
    }
  },
)

watch(isOpen, (val) => {
  emit('update:modelValue', val)
})

const submitEdit = () => {
  emit('update', editedData.value)
  isOpen.value = false
}
</script>
