/**
 * Príklad unit testu pre React komponent
 * Ukazuje ako testovať komponenty s Testing Library
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Jednoduchý testovací komponent
function Counter({ initialValue = 0 }: { initialValue?: number }) {
  const [count, setCount] = useState(initialValue)

  return (
    <div>
      <span data-testid="count">{count}</span>
      <button onClick={() => setCount(c => c + 1)}>Increment</button>
      <button onClick={() => setCount(c => c - 1)}>Decrement</button>
    </div>
  )
}

import { useState } from 'react'

describe('Counter Component', () => {
  it('should render with initial value', () => {
    render(<Counter initialValue={5} />)

    const countElement = screen.getByTestId('count')
    expect(countElement).toHaveTextContent('5')
  })

  it('should increment count on button click', async () => {
    const user = userEvent.setup()
    render(<Counter />)

    const incrementButton = screen.getByText('Increment')
    await user.click(incrementButton)

    expect(screen.getByTestId('count')).toHaveTextContent('1')
  })

  it('should decrement count on button click', async () => {
    const user = userEvent.setup()
    render(<Counter initialValue={10} />)

    const decrementButton = screen.getByText('Decrement')
    await user.click(decrementButton)

    expect(screen.getByTestId('count')).toHaveTextContent('9')
  })

  it('should handle multiple clicks', async () => {
    const user = userEvent.setup()
    render(<Counter />)

    const incrementButton = screen.getByText('Increment')

    await user.click(incrementButton)
    await user.click(incrementButton)
    await user.click(incrementButton)

    expect(screen.getByTestId('count')).toHaveTextContent('3')
  })
})

// Test pre prázdny stav
describe('Empty State Handling', () => {
  it('should render with default value when no props provided', () => {
    render(<Counter />)
    expect(screen.getByTestId('count')).toHaveTextContent('0')
  })
})
