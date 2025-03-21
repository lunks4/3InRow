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

// Анимационные константы
const ANIMATION_DURATION = 300 // ms

export default function Match3Game() {
  const [board, setBoard] = useState<number[][]>([])
  const [score, setScore] = useState(0)
  const [selectedTile, setSelectedTile] = useState<{ row: number; col: number } | null>(null)
  const [isSwapping, setIsSwapping] = useState(false)
  const [matches, setMatches] = useState<{ row: number; col: number }[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [draggedTile, setDraggedTile] = useState<{ row: number; col: number } | null>(null)
  const [dragStartPosition, setDragStartPosition] = useState<{ x: number; y: number } | null>(null)

  // Состояние для анимации
  const [animatedTiles, setAnimatedTiles] = useState<{
    [key: string]: { transform: string; transition: string; zIndex: number }
  }>({})

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
        }, 200)
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
    setAnimatedTiles({})
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

  // Swap two tiles with animation
  const swapTiles = (row1: number, col1: number, row2: number, col2: number) => {
    if (isSwapping) return

    setIsSwapping(true)

    // Создаем анимацию для обеих плиток
    const newAnimatedTiles = { ...animatedTiles }

    // Анимация для первой плитки
    newAnimatedTiles[`${row1}-${col1}`] = {
      transform: `translate(${(col2 - col1) * 100}%, ${(row2 - row1) * 100}%)`,
      transition: `transform ${ANIMATION_DURATION}ms ease-in-out`,
      zIndex: 10,
    }

    // Анимация для второй плитки
    newAnimatedTiles[`${row2}-${col2}`] = {
      transform: `translate(${(col1 - col2) * 100}%, ${(row1 - row2) * 100}%)`,
      transition: `transform ${ANIMATION_DURATION}ms ease-in-out`,
      zIndex: 5,
    }

    setAnimatedTiles(newAnimatedTiles)

    // После завершения анимации
    setTimeout(() => {
      // Создаем временную копию доски для проверки совпадений
      const tempBoard = [...board.map((row) => [...row])]
      const temp = tempBoard[row1][col1]
      tempBoard[row1][col1] = tempBoard[row2][col2]
      tempBoard[row2][col2] = temp

      // Проверяем, создал ли обмен совпадение
      const matches = findMatchesInBoard(tempBoard)

      if (matches.length === 0) {
        // Если совпадений нет, анимируем возврат плиток

        // Создаем анимацию возврата
        const revertAnimatedTiles = { ...newAnimatedTiles }

        // Инвертируем трансформации для возврата
        revertAnimatedTiles[`${row1}-${col1}`] = {
          transform: `translate(0, 0)`,
          transition: `transform ${ANIMATION_DURATION}ms ease-in-out`,
          zIndex: 10,
        }

        revertAnimatedTiles[`${row2}-${col2}`] = {
          transform: `translate(0, 0)`,
          transition: `transform ${ANIMATION_DURATION}ms ease-in-out`,
          zIndex: 5,
        }

        setAnimatedTiles(revertAnimatedTiles)

        // После завершения анимации возврата
        setTimeout(() => {
          // Сбрасываем анимацию и состояние свапа
          setAnimatedTiles({})
          setIsSwapping(false)
        }, ANIMATION_DURATION)
      } else {
        // Если есть совпадения, применяем изменения
        setBoard(tempBoard)
        setAnimatedTiles({})
        setIsSwapping(false)
      }
    }, ANIMATION_DURATION)
  }

  // Находит совпадения в переданной доске (не меняя состояние)
  const findMatchesInBoard = (boardToCheck: number[][]) => {
    const matches: { row: number; col: number }[] = []

    // Check horizontal matches
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE - 2; col++) {
        const tileType = boardToCheck[row][col]
        if (tileType !== -1 && tileType === boardToCheck[row][col + 1] && tileType === boardToCheck[row][col + 2]) {
          matches.push({ row, col })
          matches.push({ row, col: col + 1 })
          matches.push({ row, col: col + 2 })
        }
      }
    }

    // Check vertical matches
    for (let row = 0; row < BOARD_SIZE - 2; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        const tileType = boardToCheck[row][col]
        if (tileType !== -1 && tileType === boardToCheck[row + 1][col] && tileType === boardToCheck[row + 2][col]) {
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

  const determineSwipeDirection = (startX: number, startY: number, endX: number, endY: number) => {
    const deltaX = endX - startX
    const deltaY = endY - startY

    // Определяем, в каком направлении был более значительный свайп
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // Горизонтальный свайп
      return deltaX > 0 ? "right" : "left"
    } else {
      // Вертикальный свайп
      return deltaY > 0 ? "down" : "up"
    }
  }

  // Обработчики событий для перетаскивания
  const handlePointerDown = (row: number, col: number, e: React.PointerEvent) => {
    if (isSwapping || matches.length > 0) return

    // Захватываем указатель для отслеживания движений
    e.currentTarget.setPointerCapture(e.pointerId)

    setIsDragging(true)
    setDraggedTile({ row, col })
    setDragStartPosition({ x: e.clientX, y: e.clientY })
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handlePointerMove = (e: React.PointerEvent) => {
    // Ничего не делаем, если не в режиме перетаскивания
    if (!isDragging || !draggedTile || !dragStartPosition) return
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging || !draggedTile || !dragStartPosition) {
      setIsDragging(false)
      setDraggedTile(null)
      setDragStartPosition(null)
      return
    }

    // Освобождаем захваченный указатель
    if (e.pointerId) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId)
      } catch (err) {
        console.error("Error releasing pointer capture:", err)
      }
    }

    const endX = e.clientX
    const endY = e.clientY

    // Минимальное расстояние для свайпа
    const minSwipeDistance = 10
    const deltaX = Math.abs(endX - dragStartPosition.x)
    const deltaY = Math.abs(endY - dragStartPosition.y)

    if (Math.max(deltaX, deltaY) < minSwipeDistance) {
      // Если перемещение слишком маленькое, считаем это кликом
      setIsDragging(false)
      setDraggedTile(null)
      setDragStartPosition(null)
      return
    }

    // Определяем направление свайпа
    const direction = determineSwipeDirection(dragStartPosition.x, dragStartPosition.y, endX, endY)

    // Определяем координаты соседней плитки на основе направления
    let targetRow = draggedTile.row
    let targetCol = draggedTile.col

    switch (direction) {
      case "up":
        targetRow = Math.max(0, draggedTile.row - 1)
        break
      case "down":
        targetRow = Math.min(BOARD_SIZE - 1, draggedTile.row + 1)
        break
      case "left":
        targetCol = Math.max(0, draggedTile.col - 1)
        break
      case "right":
        targetCol = Math.min(BOARD_SIZE - 1, draggedTile.col + 1)
        break
    }

    // Если координаты изменились, меняем плитки местами
    if (targetRow !== draggedTile.row || targetCol !== draggedTile.col) {
      swapTiles(draggedTile.row, draggedTile.col, targetRow, targetCol)
    }

    setIsDragging(false)
    setDraggedTile(null)
    setDragStartPosition(null)
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handlePointerCancel = (e: React.PointerEvent) => {
    // Сбрасываем состояние перетаскивания при отмене
    setIsDragging(false)
    setDraggedTile(null)
    setDragStartPosition(null)
  }

  // Render a tile
  const renderTile = (tileType: number, row: number, col: number) => {
    if (tileType === -1) return null

    const tile = TILE_TYPES[tileType]
    const Icon = tile.icon
    const isSelected = selectedTile?.row === row && selectedTile?.col === col
    const isMatched = matches.some((match) => match.row === row && match.col === col)
    const isDraggingThis = isDragging && draggedTile?.row === row && draggedTile?.col === col

    // Получаем стили анимации для этой плитки
    const animationStyle = animatedTiles[`${row}-${col}`] || {}

    return (
      <div
        data-tile="true"
        data-row={row}
        data-col={col}
        className={cn(
          "w-10 h-10 md:w-14 md:h-14 flex items-center justify-center rounded-lg cursor-pointer",
          isSelected ? "bg-indigo-200 scale-110" : "hover:bg-gray-100",
          isMatched ? "animate-pulse bg-yellow-100" : "",
          isDraggingThis ? "opacity-50" : "",
        )}
        style={animationStyle}
        onPointerDown={(e) => handlePointerDown(row, col, e)}
      >
        <Icon className={cn("w-8 h-8", tile.color)} />
      </div>
    )
  }

  return (
    <Card className="p-4 md:p-6 bg-white shadow-xl rounded-xl max-w-md w-full" style={{ touchAction: "none" }}>
      <div className="flex justify-between items-center mb-4">
        <div className="text-2xl font-bold">Score: {score}</div>
        <Button onClick={initializeBoard}>New Game</Button>
      </div>

      <div
        className="grid grid-cols-8 gap-1 md:gap-2 mb-4 relative"
        style={{ touchAction: "none" }}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
      >
        {board.map((row, rowIndex) =>
          row.map((tile, colIndex) => (
            <div key={`${rowIndex}-${colIndex}`} className="relative">
              {renderTile(tile, rowIndex, colIndex)}
            </div>
          )),
        )}
      </div>

      <div className="text-sm text-gray-500 text-center">
        Перетащите фигуры, чтобы создать ряд из 3 или более одинаковых фигур
      </div>
    </Card>
  )
}

