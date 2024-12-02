'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Terminal } from 'lucide-react'
import { investors } from '../lib/investors'

type PitchPart = {
  overview: string;
  team: string;
  financials: string;
  progress: string;
  round: string;
}

export default function WallE() {
  const [page, setPage] = useState(1)
  const [input, setInput] = useState('')
  const [output, setOutput] = useState<string[]>([])
  const [selectedInvestor, setSelectedInvestor] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isExiting, setIsExiting] = useState(false)
  const [pitchParts, setPitchParts] = useState<PitchPart>({
    overview: '',
    team: '',
    financials: '',
    progress: '',
    round: ''
  })
  const [currentPitchPart, setCurrentPitchPart] = useState<keyof PitchPart>('overview')
  const inputRef = useRef<HTMLInputElement>(null)
  const terminalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [page, output])

  const clearTerminal = () => {
    setOutput([])
  }

  const resetApp = () => {
    setPage(1)
    setInput('')
    clearTerminal()
    setSelectedInvestor('')
    setIsLoading(false)
    setIsExiting(false)
    setPitchParts({
      overview: '',
      team: '',
      financials: '',
      progress: '',
      round: ''
    })
    setCurrentPitchPart('overview')
  }

  const handleCommand = async (command: string) => {
    setInput('')
    setOutput((prev) => [...prev, `$ ${command}`])

    if (command.toLowerCase() === 'reset') {
      setOutput((prev) => [...prev, 'Resetting the application...'])
      setTimeout(resetApp, 1000)
      return
    }

    if (command.toLowerCase() === 'exit') {
      setOutput((prev) => [...prev, 'Exiting the application...'])
      setIsExiting(true)
      return
    }

    if (page === 1 && command.toLowerCase() === 'start') {
      clearTerminal()
      setPage(2)
      setOutput([
        'Entering Wall-E app...',
        'Choose an investor to pitch to:',
        ...investors.map((investor, index) => `${index + 1}. ${investor.name}`),
        `${investors.length + 1}. Wall-E [Will Wall-E invest?]`,
        `${investors.length + 2}. Request for more!`
      ])
    } else if (page === 2) {
      const investorIndex = parseInt(command) - 1
      if (investorIndex >= 0 && investorIndex <= investors.length) {
        clearTerminal()
        setSelectedInvestor(investorIndex === investors.length ? 'Wall-E' : investors[investorIndex].handle)
        setPage(3)
        setOutput([
          `You selected ${investorIndex === investors.length ? 'Wall-E [Will Wall-E invest?]' : investors[investorIndex].name}`,
          'Please enter your pitch. We\'ll guide you through 5 parts:',
          '1. Overview/details of the pitch:'
        ])
      } else if (command === `${investors.length + 2}`) {
        window.open('https://x.ai', '_blank')
      } else {
        setOutput((prev) => [...prev, `Invalid selection. Please choose a number between 1 and ${investors.length + 2}.`])
      }
    } else if (page === 3) {
      handlePitchInput(command)
    }
  }

  const handlePitchInput = (input: string) => {
    setPitchParts(prev => ({ ...prev, [currentPitchPart]: input }))
    
    const nextParts: { [key in keyof PitchPart]: keyof PitchPart } = {
      overview: 'team',
      team: 'financials',
      financials: 'progress',
      progress: 'round',
      round: 'overview'
    }

    const nextPart = nextParts[currentPitchPart]
    setCurrentPitchPart(nextPart)

    if (nextPart === 'overview') {
      // All parts are filled, send the pitch
      const fullPitch = `
        1. Overview/details of the pitch:
        ${pitchParts.overview}

        2. The team background:
        ${pitchParts.team}

        3. Raise amount and valuation:
        ${pitchParts.financials}

        4. Progress so far (traction, MVP/product, links):
        ${pitchParts.progress}

        5. Which round (pre-seed, seed, series A, series B, etc.):
        ${pitchParts.round}
      `
      getPitchFeedback(fullPitch.trim())
    } else {
      const prompts = {
        team: '2. The team background:',
        financials: '3. Raise amount and valuation:',
        progress: '4. Progress so far (traction, MVP/product, links):',
        round: '5. Which round (pre-seed, seed, series A, series B, etc.):'
      }
      setOutput(prev => [...prev, prompts[nextPart]])
    }
  }

  const getPitchFeedback = async (pitch: string) => {
    setIsLoading(true)
    setOutput((prev) => [...prev, 'Processing your pitch...'])
    try {
      const response = await fetch('/api/grok-investor-bot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pitch, investor: selectedInvestor }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to get pitch feedback')
      }

      const data = await response.json()
      clearTerminal()
      setOutput([
        ...data.response.split('\n'),
        '',
        'Type "reset" to start over or "exit" to close the app.'
      ])
    } catch (error) {
      console.error('Error:', error)
      clearTerminal()
      setOutput([
        'An error occurred while processing your pitch. Please try again.',
        '',
        'Type "reset" to start over or "exit" to close the app.'
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value)
  }

  const handleInputSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim() && !isLoading) {
      handleCommand(input.trim())
    }
  }

  const handlePageClick = () => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }

  if (isExiting) {
    return (
      <div className="bg-black text-green-400 p-4 font-mono h-screen flex items-center justify-center">
        <p className="text-2xl">Thank you for using Wall-E. Goodbye!</p>
      </div>
    )
  }

  return (
    <div 
      className="bg-black text-green-400 p-4 font-mono h-screen flex flex-col"
      onClick={handlePageClick}
    >
      <div className="flex items-center mb-4 bg-gray-800 p-2 rounded-t-md">
        <Terminal className="inline-block mr-2 text-green-400" size={16} />
        <span className="text-sm font-semibold">Wall-E Terminal</span>
      </div>
      <div 
        ref={terminalRef}
        className="flex-grow overflow-auto mb-4 bg-black rounded-b-md p-2 scrollbar-thin scrollbar-thumb-green-400 scrollbar-track-gray-800"
      >
        {page === 1 && (
          <div className="mb-4">
            <p className="text-xl font-bold mb-2">Welcome to Wall-E</p>
            <p className="mb-2">Elevate your startup pitch with Wall-E, the AI-powered VC simulator. Hone your presentation skills and refine your ideas with personalized feedback from virtual versions of top investors.</p>
            <p className="mb-4">Gain invaluable insights, boost your confidence, and increase your chances of securing funding. Wall-E: Your secret weapon for pitch perfection.</p>
            <p className="mb-2">Type "start" to enter the app.</p>
          </div>
        )}
        {output.map((line, index) => (
          <div key={index} className="whitespace-pre-wrap">{line}</div>
        ))}
        <form onSubmit={handleInputSubmit} className="flex items-center bg-black mt-2">
          <span className="text-green-400 mr-2">$</span>
          <div className="relative flex-grow">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={handleInputChange}
              className="bg-transparent border-none outline-none w-full text-green-400 pr-2"
              aria-label="Terminal input"
              autoFocus
              disabled={isLoading}
            />
            <span className="absolute right-0 top-0 h-full w-2 bg-green-400 opacity-75 animate-pulse"></span>
          </div>
        </form>
      </div>
    </div>
  )
}