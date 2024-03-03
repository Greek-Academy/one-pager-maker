import { useState } from 'react'
import Markdown from 'react-markdown'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
  const [count, setCount] = useState(0)
  const [markdonwText, setMarkdonwText] = useState("a")
　
  const toMarkdownText = (rawText: string) => {
    setMarkdonwText(rawText);
  }

  return (
    <>
      <div>
        <a href="https://vitejs.dev" target="_blank" rel="noopener noreferrer">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank" rel="noopener noreferrer">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React + One Pager Maker3</h1>
      <textarea onChange={(e) => toMarkdownText(e.target.value)}>書き込むところ</textarea>
      <Markdown>{markdonwText}</Markdown>
      {/* <textarea value={markdonwText}></textarea> */}
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

export default App
