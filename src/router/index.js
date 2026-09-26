import { createRouter, createWebHistory } from 'vue-router'
import { getSession } from '../services/auth.service'
import LandingPage from '../views/LandingPage.vue'
import TeacherLogin from '../views/auth/TeacherLogin.vue'
import TeacherLayout from '../layouts/TeacherLayout.vue'
import DashboardHome from '../views/teacher/DashboardHome.vue'
import CoursesView from '../views/teacher/CoursesView.vue'
import MediaLibrary from '../views/teacher/MediaLibrary.vue'
import AssessmentList from '../views/teacher/AssessmentList.vue'
import AssessmentBuilder from '../views/teacher/AssessmentBuilder.vue'
import ClassManagement from '../views/teacher/ClassManagement.vue'
import SettingsView from '../views/teacher/SettingsView.vue'
import AnalyticsView from '../views/teacher/AnalyticsView.vue'
import VirtualLabView from '../views/teacher/VirtualLabView.vue'
import VirtualLabEditor from '../views/teacher/VirtualLabEditor.vue'

import CourseBuilder from '../views/teacher/CourseBuilder.vue'
import LessonEditor from '../views/teacher/LessonEditor.vue'
import QuestionBank from '../views/teacher/QuestionBank.vue'

import StudentLayout from '../layouts/StudentLayout.vue'
import StudentDashboard from '../views/student/StudentDashboard.vue'
import StudentLogin from '../views/student/StudentLogin.vue'
import StudentRegister from '../views/student/StudentRegister.vue'
import StudentMaterials from '../views/student/StudentMaterials.vue'
import StudentLab from '../views/student/StudentLab.vue'
import StudentTasks from '../views/student/StudentTasks.vue'
import StudentCourseView from '../views/student/StudentCourseView.vue'
import StudentLessonView from '../views/student/StudentLessonView.vue'

import PublicCourseView from '../views/PublicCourseView.vue'
import PublicLessonView from '../views/PublicLessonView.vue'
import PublicCourseList from '../views/PublicCourseList.vue'
import PublicLabList from '../views/PublicLabList.vue'
import PublicSyllabusView from '../views/PublicSyllabusView.vue'

const routes = [
  {
    path: '/',
    name: 'Landing',
    component: LandingPage
  },
  {
    path: '/student/login',
    name: 'StudentLogin',
    component: StudentLogin,
    meta: { requiresGuest: true }
  },
  {
    path: '/public/courses',
    name: 'PublicCourseList',
    component: PublicCourseList
  },
  {
    path: '/public/labs',
    name: 'PublicLabList',
    component: PublicLabList
  },
  {
    path: '/public/labs/:id',
    name: 'PublicLabView',
    component: () => import('../views/PublicLabView.vue')
  },
  {
    path: '/public/syllabus',
    name: 'PublicSyllabusView',
    component: PublicSyllabusView
  },
  {
    path: '/public/courses/:id',
    name: 'PublicCourseView',
    component: PublicCourseView
  },
  {
    path: '/public/courses/:id/lessons/:lessonId',
    name: 'PublicLessonView',
    component: PublicLessonView
  },
  {
    path: '/student/register',
    name: 'StudentRegister',
    component: StudentRegister,
    meta: { requiresGuest: true }
  },
  {
    path: '/student',
    component: StudentLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'StudentDashboard',
        component: StudentDashboard
      },
      {
        path: 'classes',
        name: 'StudentMaterials',
        component: StudentMaterials
      },
      {
        path: 'lab',
        name: 'StudentLab',
        component: StudentLab
      },
      {
        path: 'assessments',
        name: 'StudentTasks',
        component: StudentTasks
      },
      {
        path: 'courses/:id',
        name: 'StudentCourseView',
        component: StudentCourseView
      },
      {
        path: 'courses/:id/lessons/:lessonId',
        name: 'StudentLessonView',
        component: StudentLessonView
      }
    ]
  },
  {
    path: '/teacher/login',
    name: 'TeacherLogin',
    component: TeacherLogin,
    meta: { requiresGuest: true }
  },
  {
    path: '/teacher',
    component: TeacherLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'TeacherDashboard',
        component: DashboardHome
      },
      {
        path: 'classes',
        name: 'ClassManagement',
        component: ClassManagement
      },
      {
        path: 'settings',
        name: 'TeacherSettings',
        component: SettingsView
      },
      {
        path: 'analytics',
        name: 'TeacherAnalytics',
        component: AnalyticsView
      },
      {
        path: 'courses',
        name: 'TeacherCourses',
        component: CoursesView
      },
      {
        path: 'virtual-labs',
        name: 'TeacherVirtualLabs',
        component: VirtualLabView
      },
      {
        path: 'labs/:id/edit',
        name: 'VirtualLabEditor',
        component: VirtualLabEditor
      },
      {
        path: 'media',
        name: 'MediaLibrary',
        component: MediaLibrary
      },
      {
        path: 'assessments',
        name: 'AssessmentList',
        component: AssessmentList
      },
      {
        path: 'assessments/:id',
        name: 'AssessmentBuilder',
        component: AssessmentBuilder
      },
      {
        path: 'questions',
        name: 'QuestionBank',
        component: QuestionBank
      },
      {
        path: 'courses/:id',
        name: 'CourseBuilder',
        component: CourseBuilder
      },
      {
        path: 'courses/:id/lessons/:lessonId/edit',
        name: 'LessonEditor',
        component: LessonEditor
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Navigation Guard
import { getStudentSession } from '../services/student.service'

router.beforeEach(async (to, from, next) => {
  // Cek apakah route ini untuk siswa
  const isStudentRoute = to.path.startsWith('/student')
  
  if (isStudentRoute) {
    const studentSession = getStudentSession()
    const isStudentAuth = !!studentSession

    if (to.meta.requiresAuth && !isStudentAuth) {
      next('/student/login')
    } else if (to.meta.requiresGuest && isStudentAuth) {
      next('/student')
    } else {
      next()
    }
  } else {
    // Route untuk guru (default Supabase Auth)
    const session = await getSession()
    const isAuth = !!session

    if (to.meta.requiresAuth && !isAuth) {
      next('/teacher/login')
    } else if (to.meta.requiresGuest && isAuth) {
      next('/teacher')
    } else {
      next()
    }
  }
})

export default router
