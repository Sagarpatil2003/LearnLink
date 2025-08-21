import './App.css'
import { Route, Router, Routes } from 'react-router'
import { UserLogin } from './components/UserLogin'
import { PageNotFound } from './components/PageNotFound'
import { SignUp } from './components/SignUp'
import { StudentDashboard } from './components/StudentDashboard'
import { TeacherDashboard } from './components/TeacherDashboard'

function App() {
  

  return (
    <>
      <Routes>
          <Route path='/' element={<UserLogin/>}></Route>
          <Route path='/signup' element={<SignUp/>}></Route>
          <Route path='/student-dashboard' element={<StudentDashboard/>}></Route>
          <Route path='/teacher-dashboard' element={<TeacherDashboard/>}></Route>
          <Route path='*' element={<PageNotFound/>}></Route>
          
      </Routes>
    </>
  )
}

export default App
