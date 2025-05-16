const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [{ path: '', name: 'IndexPage', component: () => import('src/pages/IndexPage.vue') }],
  },
  {
    path: '/login',
    component: () => import('layouts/MainLayout.vue'),
    children: [{ path: '', name: 'LoginPage', component: () => import('src/pages/LoginPage.vue') }],
  },
  {
    path: '/addNewClass',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', name: 'NewClassPage', component: () => import('src/pages/NewClassPage.vue') },
    ],
  },
  {
    path: '/class/:id',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        name: 'ClassDetails',
        component: () => import('src/pages/ClassDetailsPage.vue'),
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
