const routes = [
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
    ],
  },

  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [{ path: '', name: 'LoginPage', component: () => import('src/pages/LoginPage.vue') }],
  },
  {
    path: '/addNewClass',
    component: () => import('layouts/MainLayout.vue'),
    meta: { requiresAuth: true, role: 'teacher' },
    children: [
      { path: '', name: 'NewClassPage', component: () => import('src/pages/NewClassPage.vue') },
    ],
  },
  {
    path: '/class/:id',
    component: () => import('layouts/MainLayout.vue'),
    meta: { requiresAuth: true, role: 'teacher' },
    children: [
      {
        path: '',
        name: 'ClassDetails',
        component: () => import('src/pages/ClassDetailsPage.vue'),
      },
    ],
  },

  {
    path: '/AdminDashboard',
    component: () => import('layouts/MainLayout.vue'),
    meta: { requiresAuth: true, role: 'admin' },
    children: [
      { path: '', name: 'AdminDashboard', component: () => import('src/pages/AdminDashboard.vue') },
    ],
  },
  {
    path: '/studentList',
    component: () => import('layouts/MainLayout.vue'),
    meta: { requiresAuth: true, role: 'admin' },
    children: [
      { path: '', name: 'StudentList', component: () => import('src/pages/StudentListPage.vue') },
    ],
  },
  {
    path: '/studentDetails/:studentId',
    component: () => import('layouts/MainLayout.vue'),
    meta: { requiresAuth: true, role: 'admin' },
    children: [
      {
        path: '',
        name: 'studentDetails',
        component: () => import('src/pages/StudentDetailsPage.vue'),
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
