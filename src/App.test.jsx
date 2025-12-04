import React from 'react'
import { render, screen, within, fireEvent, act, waitFor } from '@testing-library/react'
import App from './App'

// ---- Mocks ----

// 1) Sound manager: silence + harmless methods
vi.mock('./utils/soundManager', () => ({
  default: {
    attachAutoUnlock: vi.fn(),
    preload: vi.fn(),
    play: vi.fn(),
    setMuted: vi.fn()
  }
}))

// 2) WASM gameAPI: initWasm resolves to a fake Module with tiny behavior
vi.mock('./wasm/gameAPI', () => {
  class FakeBoard {
    constructor(rows, cols) {
      this.rows = rows
      this.cols = cols
      this.marker = [Math.floor(rows / 2), Math.floor(cols / 2)]
      // grid of 1s
      this._grid = Array.from({ length: rows }, () => Array(cols).fill(1))
      // a couple of valid moves in the top-left
      this._valid = [
        [0, 0],
        [0, 1],
      ]
      this._terminal = false
      this._winner = null
    }
    getFlatGrid() {
      return this._grid.flat()
    }
    getValidMoves() {
      const self = this
      return {
        size: () => self._valid.length,
        get: (i) => ({
          get: (j) => (j === 0 ? self._valid[i][0] : self._valid[i][1]),
        }),
      }
    }
    getFlatValidMoves() {
      return this._valid.flat()
    }
    makeMove(move) {
      this.marker = move
      // after a human move, keep non-terminal for our tests
      this._terminal = false
    }
    isTerminal() {
      return this._terminal
    }
    getWinner() {
      return this._winner
    }
    switchPlayer() {
      // no-op needed for tests
    }
    setCurrentPlayerInt(_) { /* puzzle flow uses it; safe no-op for now */ }
    getMarker() {
      // mimic embind pair with .get
      const [r, c] = this.marker
      return {
        get: (i) => (i === 0 ? r : c),
        first: r,
        second: c,
      }
    }
    getRows() { return this.rows }
    getCols() { return this.cols }
    currentPlayerIsMax() { return true }
  }

  // A very small AI: always returns [0,0]
  const fakeAI = {
    chooseMove: (_board, _depth, _round) => [0, 0],
  }

  const Module = {
    initHeuristics: () => {},
    Board: FakeBoard,
    AI: function () { return fakeAI },
    createAIWithLevel: () => fakeAI,
  }

  return {
    initWasm: () => Promise.resolve(Module),
  }
})

// 3) (Optional) winHistory so no side-effects when winner happens
vi.mock('./utils/winHistory', () => ({
  MODES: { HUMAN_FIRST: 'human_first', AI_FIRST: 'ai_first' },
  recordAiVsGame: vi.fn(),
}))

// Support helpers
const flush = () => act(() => Promise.resolve())

describe('App integration (with reducer + mocked WASM)', () => {
  test('boot + start game renders a 7x7 board', async () => {
    render(<App />)

    // Let initWasm resolve and effects run
    await flush(); await flush()

    // Click "Iniciar" (Portuguese label)
    const startBtn = await screen.findByRole('button', { name: /iniciar/i })
    fireEvent.click(startBtn)

    // Wait until the board cells are rendered (class ".cell" in Board)
    await waitFor(() => {
      const cells = document.querySelectorAll('.cell')
      expect(cells.length).toBe(7 * 7)
    })
  })


  test('human move populates first round in MoveLog', async () => {
    render(<App />)
    await flush(); await flush()

    fireEvent.click(await screen.findByRole('button', { name: /iniciar/i }))

    // Click top-left cell (0,0) — valid in our mock
    const cells = document.querySelectorAll('.cell')
    fireEvent.click(cells[0])

    // Table should have header + at least 1 data row
    const rows = await screen.findAllByRole('row')
    expect(rows.length).toBeGreaterThan(1)

    const firstBodyRow = rows[1]
    const bodyCells = within(firstBodyRow).getAllByRole('cell')
    expect(bodyCells[1].textContent).not.toEqual('') // Jogador 1 column has a move
  })


  test('AI move button shows warning dialog in Humano vs IA', async () => {
    render(<App />)
    await flush(); await flush()

    // Set mode to “Humano vs IA”
    const modeSelect = screen.getByRole('combobox', {
      name: /modo de jogo/i,   // no colon
      hidden: true,            // find even if sidebar is closed
    })
    fireEvent.change(modeSelect, { target: { value: 'human_first' } })

    // Start game
    fireEvent.click(await screen.findByRole('button', { name: /iniciar/i }))

    // Open warning
    const aiBtn = await screen.findByRole('button', { name: /fazer jogada ia/i })
    fireEvent.click(aiBtn)

    // Find any dialog
    const dialog = await screen.findByRole('dialog')
    expect(dialog).toBeInTheDocument()

    // Close via "Cancelar"
    const cancel = within(dialog).getByRole('button', { name: /cancelar/i })
    fireEvent.click(cancel)

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull()
    })
  })

  test('Human vs AI: after human move, AI responds once (fills same round)', async () => {
    render(<App />)
    await flush(); await flush()

    fireEvent.click(await screen.findByRole('button', { name: /iniciar/i }))

    const cells = document.querySelectorAll('.cell')
    fireEvent.click(cells[0]) // human move

    // Wait for AI to fill the second column of the first round
    await waitFor(() => {
      const rows = screen.getAllByRole('row')
      expect(rows.length).toBeGreaterThan(1)
      const firstBodyRow = rows[1]
      const bodyCells = within(firstBodyRow).getAllByRole('cell')
      expect(bodyCells[1].textContent).not.toEqual('') // AI move present
      expect(bodyCells[0].textContent).not.toEqual('') // human move present
    })
  })

})
