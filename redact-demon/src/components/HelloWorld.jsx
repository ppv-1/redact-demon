import { useState } from 'react'
import App from '../content/views/App.jsx'

export default function HelloWorld(props) {
  const [count, setCount] = useState(0)

  return (
    <>
      <App />
    </>
  )
}