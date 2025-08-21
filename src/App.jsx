import './App.css'
import { Route, Router, Routes } from 'react-router'
import { UserLogin } from './components/UserLogin'
import { PageNotFound } from './components/PageNotFound'

function App() {
  

  return (
    <>
      <Routes>
          <Route path='/' element={<UserLogin/>}>
           <Route path='*' element={<PageNotFound/>}></Route>
          </Route>
      </Routes>
    </>
  )
}

export default App
