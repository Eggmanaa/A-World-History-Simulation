// Authentication handler for login and registration forms

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm')
  const registerForm = document.getElementById('registerForm')
  
  // Handle login
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault()
      
      const email = document.getElementById('email').value
      const password = document.getElementById('password').value
      
      // Determine if teacher or student based on URL
      const isTeacher = window.location.pathname.includes('teacher')
      const endpoint = isTeacher ? '/api/auth/teacher/login' : '/api/auth/student/login'
      
      try {
        const response = await axios.post(endpoint, { email, password })
        
        if (response.data.success) {
          // Store user data in sessionStorage
          if (isTeacher) {
            sessionStorage.setItem('teacher', JSON.stringify(response.data.teacher))
            window.location.href = '/teacher/dashboard'
          } else {
            sessionStorage.setItem('student', JSON.stringify(response.data.student))
            window.location.href = '/student/game'
          }
        }
      } catch (error) {
        alert(error.response?.data?.error || 'Login failed')
      }
    })
  }
  
  // Handle registration
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault()
      
      const isTeacher = window.location.pathname.includes('teacher')
      
      if (isTeacher) {
        const email = document.getElementById('email').value
        const password = document.getElementById('password').value
        const name = document.getElementById('name')?.value
        
        try {
          const response = await axios.post('/api/auth/teacher/register', {
            email,
            password,
            name
          })
          
          if (response.data.success) {
            alert('Registration successful! Please login.')
            window.location.href = '/teacher/login'
          }
        } catch (error) {
          alert(error.response?.data?.error || 'Registration failed')
        }
      } else {
        const email = document.getElementById('email').value
        const password = document.getElementById('password').value
        const name = document.getElementById('name').value
        const inviteCode = document.getElementById('inviteCode').value
        
        try {
          const response = await axios.post('/api/auth/student/register', {
            email,
            password,
            name,
            inviteCode
          })
          
          if (response.data.success) {
            alert('Registration successful! Please login.')
            window.location.href = '/student/login'
          }
        } catch (error) {
          alert(error.response?.data?.error || 'Registration failed')
        }
      }
    })
  }
})
