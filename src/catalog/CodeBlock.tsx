import { useState } from 'react'

export default function CodeBlock({ code, language = 'tsx' }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(code)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = code
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      ta.remove()
    }
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }

  return (
    <div className="codeblock">
      <div className="codeblock-bar">
        <span>{language}</span>
        <button onClick={() => void copy()}>{copied ? 'Copiado' : 'Copiar'}</button>
      </div>
      <pre><code>{code}</code></pre>
    </div>
  )
}
