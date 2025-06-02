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
        component: () => import('src/pages/TeacherDashboard.vue'),
      },
      {
        path: 'addNewClass',
        name: 'NewClassPage',
        component: () => import('src/pages/NewClassPage.vue'),
      },
      {
        path: 'class/:id',
        name: 'ClassDetails',
        component: () => import('src/pages/ClassDetailsTeacher.vue'),
      },
      {
        path: 'classList',
        name: 'ClassListTeacher',
        component: () => import('src/pages/ClassListPage.vue'),
      },
    ],
  },

  {
    path: '/AdminDashboard',
    component: () => import('layouts/MainLayout.vue'),
    meta: { requiresAuth: true, role: 'admin' },
    children: [
      { path: '', name: 'AdminDashboard', component: () => import('src/pages/AdminDashboard.vue') },
      {
        path: 'studentList',
        name: 'StudentList',
        component: () => import('src/pages/StudentListPage.vue'),
      },
      {
        path: 'studentDetails/:studentId',
        name: 'studentDetails',
        component: () => import('src/pages/StudentDetailsPage.vue'),
      },
      {
        path: 'classList',
        name: 'classList',
        component: () => import('src/pages/ClassListPage.vue'),
      },
      {
        path: 'classDetails/:classId',
        name: 'classDetailsAdmin',
        component: () => import('src/pages/ClassDetailsAdmin.vue'),
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
