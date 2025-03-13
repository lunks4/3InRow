"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Gem, Star, Heart, Zap, Diamond, Droplet } from "lucide-react"
import { cn } from "@/lib/utils"

// Define tile types
const TILE_TYPES = [
  { id: 0, icon: Gem, color: "text-red-500" },
  { id: 1, icon: Star, color: "text-yellow-500" },
  { id: 2, icon: Heart, color: "text-pink-500" },
  { id: 3, icon: Zap, color: "text-blue-500" },
  { id: 4, icon: Diamond, color: "text-purple-500" },
  { id: 5, icon: Droplet, color: "text-green-500" },
]

// Game board size
const BOARD_SIZE = 8

export default function Match3Game() {
  const [board, setBoard] = useState<number[][]>([])
  const [score, setScore] = useState(0)
  const [selectedTile, setSelectedTile] = useState<{ row: number; col: number } | null>(null)
  const [isSwapping, setIsSwapping] = useState(false)
  const [matches, setMatches] = useState<{ row: number; col: number }[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [draggedTile, setDraggedTile] = useState<{ row: number; col: number } | null>(null)
  const [dragPosition, setDragPosition] = useState<{ x: number; y: number } | null>(null)

  // Initialize the board
  useEffect(() => {
    initializeBoard()
  }, [])

  // Check for matches after board changes
  useEffect(() => {
    if (board.length > 0 && !isSwapping) {
      const foundMatches = findMatches()
      if (foundMatches.length > 0) {
        setMatches(foundMatches)
        setTimeout(() => {
          removeMatches(foundMatches)
        }, 500)
      }
    }
  }, [board, isSwapping])

  // Initialize the board with random tiles
  const initializeBoard = () => {
    const newBoard = Array(BOARD_SIZE)
      .fill(0)
      .map(() =>
        Array(BOARD_SIZE)
          .fill(0)
          .map(() => Math.floor(Math.random() * TILE_TYPES.length)),
      )
    setBoard(newBoard)
    setScore(0)
    setSelectedTile(null)
    setMatches([])
  }

  // Find matches of 3 or more tiles
  const findMatches = () => {
    const matches: { row: number; col: number }[] = []

    // Check horizontal matches
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE - 2; col++) {
        const tileType = board[row][col]
        if (tileType !== -1 && tileType === board[row][col + 1] && tileType === board[row][col + 2]) {
          matches.push({ row, col })
          matches.push({ row, col: col + 1 })
          matches.push({ row, col: col + 2 })
        }
      }
    }

    // Check vertical matches
    for (let row = 0; row < BOARD_SIZE - 2; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        const tileType = board[row][col]
        if (tileType !== -1 && tileType === board[row + 1][col] && tileType === board[row + 2][col]) {
          matches.push({ row, col })
          matches.push({ row: row + 1, col })
          matches.push({ row: row + 2, col })
        }
      }
    }

    // Remove duplicates
    return matches.filter(
      (match, index, self) => index === self.findIndex((m) => m.row === match.row && m.col === match.col),
    )
  }

  // Remove matches and update score
  const removeMatches = (matches: { row: number; col: number }[]) => {
    const newBoard = [...board]

    // Mark matched tiles for removal
    matches.forEach(({ row, col }) => {
      newBoard[row][col] = -1
    })

    setScore((prevScore) => prevScore + matches.length * 10)
    setMatches([])

    // Drop tiles down
    setTimeout(() => {
      dropTiles(newBoard)
    }, 300)
  }

  // Drop tiles down to fill empty spaces
  const dropTiles = (currentBoard: number[][]) => {
    const newBoard = [...currentBoard]

    // Move tiles down
    for (let col = 0; col < BOARD_SIZE; col++) {
      let emptySpaces = 0

      for (let row = BOARD_SIZE - 1; row >= 0; row--) {
        if (newBoard[row][col] === -1) {
          emptySpaces++
        } else if (emptySpaces > 0) {
          newBoard[row + emptySpaces][col] = newBoard[row][col]
          newBoard[row][col] = -1
        }
      }

      // Fill top with new tiles
      for (let row = 0; row < BOARD_SIZE; row++) {
        if (newBoard[row][col] === -1) {
          newBoard[row][col] = Math.floor(Math.random() * TILE_TYPES.length)
        }
      }
    }

    setBoard(newBoard)
  }

  // Handle tile click
  const handleTileClick = (row: number, col: number) => {
    if (isSwapping || matches.length > 0) return

    if (selectedTile === null) {
      setSelectedTile({ row, col })
    } else {
      // Check if tiles are adjacent
      const isAdjacent =
        (Math.abs(selectedTile.row - row) === 1 && selectedTile.col === col) ||
        (Math.abs(selectedTile.col - col) === 1 && selectedTile.row === row)

      if (isAdjacent) {
        swapTiles(selectedTile.row, selectedTile.col, row, col)
      }

      setSelectedTile(null)
    }
  }

  // Swap two tiles
  const swapTiles = (row1: number, col1: number, row2: number, col2: number) => {
    setIsSwapping(true)

    const newBoard = [...board]
    const temp = newBoard[row1][col1]
    newBoard[row1][col1] = newBoard[row2][col2]
    newBoard[row2][col2] = temp

    setBoard(newBoard)

    // Check if the swap created a match
    setTimeout(() => {
      const matches = findMatches()

      if (matches.length === 0) {
        // Swap back if no matches
        const revertBoard = [...newBoard]
        const temp = revertBoard[row1][col1]
        revertBoard[row1][col1] = revertBoard[row2][col2]
        revertBoard[row2][col2] = temp

        setBoard(revertBoard)
      }

      setIsSwapping(false)
    }, 300)
  }

  // Начало перетаскивания
  const handleDragStart = (row: number, col: number, e: React.MouseEvent | React.TouchEvent) => {
    if (isSwapping || matches.length > 0) return

    setIsDragging(true)
    setDraggedTile({ row, col })

    // Получаем начальные координаты
    let clientX, clientY
    if ("touches" in e) {
      clientX = e.touches[0].clientX
      clientY = e.touches[0].clientY
    } else {
      clientX = e.clientX
      clientY = e.clientY
    }

    setDragPosition({ x: clientX, y: clientY })

    // Предотвращаем стандартное поведение браузера
    e.preventDefault()
  }

  // Обработка перемещения при перетаскивании
  const handleDragMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging || !draggedTile) return

    // Получаем текущие координаты
    let clientX, clientY
    if ("touches" in e) {
      clientX = e.touches[0].clientX
      clientY = e.touches[0].clientY
    } else {
      clientX = e.clientX
      clientY = e.clientY
    }

    setDragPosition({ x: clientX, y: clientY })
    e.preventDefault()
  }

  // Завершение перетаскивания
  const handleDragEnd = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging || !draggedTile || !dragPosition) {
      setIsDragging(false)
      setDraggedTile(null)
      setDragPosition(null)
      return
    }

    // Находим элемент под курсором/пальцем
    let clientX, clientY
    if ("changedTouches" in e) {
      clientX = e.changedTouches[0].clientX
      clientY = e.changedTouches[0].clientY
    } else {
      clientX = e.clientX
      clientY = e.clientY
    }

    // Получаем элемент под курсором
    const elemBelow = document.elementFromPoint(clientX, clientY)
    const tileElement = elemBelow?.closest("[data-tile]")

    if (tileElement) {
      const targetRow = Number.parseInt(tileElement.getAttribute("data-row") || "-1")
      const targetCol = Number.parseInt(tileElement.getAttribute("data-col") || "-1")

      // Проверяем, что это соседняя ячейка
      const isAdjacent =
        (Math.abs(draggedTile.row - targetRow) === 1 && draggedTile.col === targetCol) ||
        (Math.abs(draggedTile.col - targetCol) === 1 && draggedTile.row === targetRow)

      if (isAdjacent && targetRow >= 0 && targetCol >= 0) {
        swapTiles(draggedTile.row, draggedTile.col, targetRow, targetCol)
      }
    }

    // Сбрасываем состояние перетаскивания
    setIsDragging(false)
    setDraggedTile(null)
    setDragPosition(null)
    e.preventDefault()
  }

  // Render a tile
  const renderTile = (tileType: number, row: number, col: number) => {
    if (tileType === -1) return null

    const tile = TILE_TYPES[tileType]
    const Icon = tile.icon
    const isSelected = selectedTile?.row === row && selectedTile?.col === col
    const isMatched = matches.some((match) => match.row === row && match.col === col)
    const isDraggingThis = isDragging && draggedTile?.row === row && draggedTile?.col === col

    return (
      <div
        data-tile="true"
        data-row={row}
        data-col={col}
        className={cn(
          "w-12 h-12 md:w-14 md:h-14 flex items-center justify-center rounded-lg transition-all duration-200 cursor-pointer",
          isSelected ? "bg-indigo-200 scale-110" : "bg-white hover:bg-gray-100",
          isMatched ? "animate-pulse bg-yellow-100" : "",
          isDraggingThis ? "opacity-50" : "",
        )}
        onClick={() => handleTileClick(row, col)}
        onMouseDown={(e) => handleDragStart(row, col, e)}
        onTouchStart={(e) => handleDragStart(row, col, e)}
        style={
          isDraggingThis && dragPosition
            ? {
                position: "relative",
                zIndex: 10,
              }
            : {}
        }
      >
        <Icon className={cn("w-8 h-8", tile.color)} />
      </div>
    )
  }

  return (
    <Card className="p-4 md:p-6 bg-white shadow-xl rounded-xl max-w-md w-full">
      <div className="flex justify-between items-center mb-4">
        <div className="text-2xl font-bold">Score: {score}</div>
        <Button onClick={initializeBoard}>New Game</Button>
      </div>

      <div
        className="grid grid-cols-8 gap-1 md:gap-2 mb-4 relative"
        onMouseMove={handleDragMove}
        onTouchMove={handleDragMove}
        onMouseUp={handleDragEnd}
        onTouchEnd={handleDragEnd}
        onMouseLeave={handleDragEnd}
      >
        {board.map((row, rowIndex) =>
          row.map((tile, colIndex) => (
            <div key={`${rowIndex}-${colIndex}`}>{renderTile(tile, rowIndex, colIndex)}</div>
          )),
        )}
      </div>
      {isDragging && draggedTile && dragPosition && board[draggedTile.row][draggedTile.col] !== -1 && (
        <div
          className="fixed pointer-events-none z-50"
          style={{
            left: `${dragPosition.x - 30}px`,
            top: `${dragPosition.y - 30}px`,
          }}
        >
          <div className="w-14 h-14 flex items-center justify-center bg-white rounded-lg shadow-lg">
            {(() => {
              const tileType = board[draggedTile.row][draggedTile.col]
              const tile = TILE_TYPES[tileType]
              const Icon = tile.icon
              return <Icon className={cn("w-8 h-8", tile.color)} />
            })()}
          </div>
        </div>
      )}

      <div className="text-sm text-gray-500 text-center">
        Select two adjacent tiles to swap them and create matches of 3 or more.
      </div>
    </Card>
  )
}

