/**
 * Utility functions to calculate canvas dimensions based on restaurant area
 */

interface AreaDimensions {
  width: number
  height: number
  radius?: number
}

/**
 * Tính toán kích thước canvas dựa trên diện tích và hình dạng
 * @param areaSizeM2 - Diện tích tính bằng m²
 * @param shapeType - Loại hình dạng (square, rectangle, circle, polygon)
 * @param pixelsPerMeter - Tỷ lệ pixel trên mét (mặc định 2 px/m)
 * @returns Kích thước canvas (width, height, radius nếu là hình tròn)
 */
export function calculateCanvasDimensions(
  areaSizeM2: number,
  shapeType: "square" | "rectangle" | "circle" | "polygon" | "rhombus" | "parallelogram",
  pixelsPerMeter = 2,
): AreaDimensions {
  // Tính toán kích thước thực tế dựa trên diện tích
  let width: number
  let height: number
  let radius: number | undefined

  switch (shapeType) {
    case "circle": {
      // Diện tích hình tròn: A = π * r²
      // r = √(A / π)
      radius = Math.sqrt(areaSizeM2 / Math.PI)
      const diameterM = radius * 2
      width = diameterM * pixelsPerMeter
      height = diameterM * pixelsPerMeter
      break
    }

    case "square": {
      // Diện tích hình vuông: A = a²
      // a = √A
      const sideM = Math.sqrt(areaSizeM2)
      width = sideM * pixelsPerMeter
      height = sideM * pixelsPerMeter
      break
    }

    case "rectangle": {
      // Giả sử tỷ lệ chiều dài:chiều rộng là 1.5:1
      // A = length * width
      // length = 1.5 * width
      // A = 1.5 * width²
      // width = √(A / 1.5)
      const widthM = Math.sqrt(areaSizeM2 / 1.5)
      const lengthM = widthM * 1.5
      width = lengthM * pixelsPerMeter
      height = widthM * pixelsPerMeter
      break
    }

    case "rhombus": {
      // Diện tích hình thoi: A = (d1 * d2) / 2
      // Giả sử tỷ lệ hai đường chéo là 1.2:1
      // d2 = d1 / 1.2
      // A = (d1 * d1 / 1.2) / 2 = d1² / 2.4
      // d1 = √(A * 2.4)
      const d1M = Math.sqrt(areaSizeM2 * 2.4)
      const d2M = d1M / 1.2
      width = d1M * pixelsPerMeter
      height = d2M * pixelsPerMeter
      break
    }

    case "parallelogram": {
      // Diện tích hình bình hành: A = base * height
      // Giả sử tỷ lệ base:height là 1.5:1
      // A = base * (base / 1.5)
      // base = √(A * 1.5)
      const baseM = Math.sqrt(areaSizeM2 * 1.5)
      const heightM = baseM / 1.5
      width = baseM * pixelsPerMeter
      height = heightM * pixelsPerMeter
      break
    }

    case "polygon":
    default: {
      // Với đa giác, giả sử là hình lục giác đều
      // Diện tích hình lục giác: A = (3√3 / 2) * a²
      // a = √(2A / (3√3))
      const sideM = Math.sqrt((2 * areaSizeM2) / (3 * Math.sqrt(3)))
      const diameterM = sideM * 2
      width = diameterM * pixelsPerMeter
      height = diameterM * pixelsPerMeter
      break
    }
  }

  return { width, height, radius }
}

/**
 * Tính toán kích thước bàn dựa trên kích thước canvas
 * @param canvasWidth - Chiều rộng canvas (px)
 * @param canvasHeight - Chiều cao canvas (px)
 * @param numberOfTables - Số lượng bàn
 * @returns Kích thước bàn được đề xuất (px)
 */
export function calculateTableSize(canvasWidth: number, canvasHeight: number, numberOfTables: number): number {
  // Tính toán kích thước bàn dựa trên diện tích canvas và số lượng bàn
  const canvasArea = canvasWidth * canvasHeight
  const areaPerTable = canvasArea / numberOfTables
  const tableSize = Math.sqrt(areaPerTable) * 0.6 // 60% của kích thước lý tưởng

  // Giới hạn kích thước bàn từ 40px đến 100px
  return Math.max(40, Math.min(100, tableSize))
}

/**
 * Tạo CSS class cho hình dạng canvas
 * @param shapeType - Loại hình dạng
 * @returns CSS class string
 */
export function getShapeClass(shapeType: "square" | "rectangle" | "circle" | "polygon" | "rhombus" | "parallelogram"): string {
  switch (shapeType) {
    case "circle":
      return "rounded-full"
    case "square":
      return "rounded-lg"
    case "rectangle":
      return "rounded-md"
    case "polygon":
      return "rounded-lg"
    case "rhombus":
    case "parallelogram":
      return "rounded-md"
    default:
      return "rounded-md"
  }
}

/**
 * Tạo SVG clip path cho hình dạng
 * @param shapeType - Loại hình dạng
 * @param width - Chiều rộng
 * @param height - Chiều cao
 * @returns SVG clip path ID
 */
export function createShapeClipPath(
  shapeType: "square" | "rectangle" | "circle" | "polygon" | "rhombus" | "parallelogram",
  width: number,
  height: number,
): string {
  const clipPathId = `clip-${shapeType}-${Date.now()}`

  // Tạo SVG clip path dựa trên hình dạng
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg")
  svg.setAttribute("width", "0")
  svg.setAttribute("height", "0")

  const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs")
  const clipPath = document.createElementNS("http://www.w3.org/2000/svg", "clipPath")
  clipPath.setAttribute("id", clipPathId)

  let shape: SVGElement

  switch (shapeType) {
    case "circle": {
      shape = document.createElementNS("http://www.w3.org/2000/svg", "circle")
      shape.setAttribute("cx", String(width / 2))
      shape.setAttribute("cy", String(height / 2))
      shape.setAttribute("r", String(Math.min(width, height) / 2))
      break
    }

    case "polygon": {
      // Hình lục giác
      const centerX = width / 2
      const centerY = height / 2
      const radius = Math.min(width, height) / 2
      const points = []

      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI) / 3
        const x = centerX + radius * Math.cos(angle)
        const y = centerY + radius * Math.sin(angle)
        points.push(`${x},${y}`)
      }

      shape = document.createElementNS("http://www.w3.org/2000/svg", "polygon")
      shape.setAttribute("points", points.join(" "))
      break
    }

    case "rhombus": {
      // Hình thoi - 4 điểm xoay 45 độ
      const centerX = width / 2
      const centerY = height / 2
      const halfWidth = width / 2
      const halfHeight = height / 2
      const points = [
        `${centerX},${centerY - halfHeight}`, // Top
        `${centerX + halfWidth},${centerY}`, // Right
        `${centerX},${centerY + halfHeight}`, // Bottom
        `${centerX - halfWidth},${centerY}`, // Left
      ]

      shape = document.createElementNS("http://www.w3.org/2000/svg", "polygon")
      shape.setAttribute("points", points.join(" "))
      break
    }

    case "parallelogram": {
      // Hình bình hành - có góc nghiêng
      const skew = width * 0.1 // Độ nghiêng 10%
      const points = [
        `${skew},0`, // Top-left
        `${width},0`, // Top-right
        `${width - skew},${height}`, // Bottom-right
        `0,${height}`, // Bottom-left
      ]

      shape = document.createElementNS("http://www.w3.org/2000/svg", "polygon")
      shape.setAttribute("points", points.join(" "))
      break
    }

    case "rectangle":
    case "square":
    default: {
      shape = document.createElementNS("http://www.w3.org/2000/svg", "rect")
      shape.setAttribute("x", "0")
      shape.setAttribute("y", "0")
      shape.setAttribute("width", String(width))
      shape.setAttribute("height", String(height))
      break
    }
  }

  clipPath.appendChild(shape)
  defs.appendChild(clipPath)
  svg.appendChild(defs)
  document.body.appendChild(svg)

  return clipPathId
}
