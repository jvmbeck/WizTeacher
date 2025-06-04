const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [{ path: '', name: 'LoginPage', component: () => import('src/pages/LoginPage.vue') }],
  },

  {
    path: '/TeacherDashboard',
    component: () => import('layouts/MainLayout.vue'),
    meta: { requiresAuth: true, role: 'teacher' },
    children: [
      {
        path: '',
        name: 'TeacherDashboard',
        component: () => import('src/pages/teacher/TeacherDashboard.vue'),
      },
      {
        path: 'class/:id',
        name: 'ClassDetails',
        component: () => import('src/pages/teacher/ClassDetails.vue'),
      },
      {
        path: 'classList',
        name: 'ClassListTeacher',
        component: () => import('src/pages/admin/classes/ClassListPage.vue'),
      },
    ],
  },

  {
    path: '/AdminDashboard',
    component: () => import('layouts/MainLayout.vue'),
    meta: { requiresAuth: true, role: 'admin' },
    children: [
      {
        path: '',
        name: 'AdminDashboard',
        component: () => import('src/pages/admin/AdminDashboard.vue'),
      },
      {
        path: 'studentList',
        name: 'StudentList',
        component: () => import('src/pages/admin/students/StudentListPage.vue'),
      },
      {
        path: 'studentDetails/:studentId',
        name: 'studentDetails',
        component: () => import('src/pages/admin/students/StudentDetailsPage.vue'),
      },
      {
        path: 'classList',
        name: 'classList',
        component: () => import('src/pages/admin/classes/ClassListPage.vue'),
      },
      {
        path: 'classDetails/:classId',
        name: 'classDetailsAdmin',
        component: () => import('src/pages/admin/classes/ClassDetailsAdmin.vue'),
      },
    ],
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
]

export default routes
