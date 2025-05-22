"use client"

import { useRef, useEffect, useState } from "react"
import type { Course, GraphData } from "@/lib/types"
import { createGraphData } from "@/lib/course-layout"

interface CourseDiagramProps {
  courses: Course[]
}

export function CourseDiagram({ courses }: CourseDiagramProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], edges: [] })
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 })
  const [startPanPos, setStartPanPos] = useState({ x: 0, y: 0 })
  const [scale, setScale] = useState(1)

  // Calculate graph data when courses change
  useEffect(() => {
    if (courses.length > 0) {
      const data = createGraphData(courses)
      setGraphData(data)
    }
  }, [courses])

  // Draw the diagram
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas size
    const container = canvas.parentElement
    if (container) {
      canvas.width = container.clientWidth
      canvas.height = container.clientHeight
    }

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Apply transformations for pan and zoom
    ctx.save()
    ctx.translate(panOffset.x, panOffset.y)
    ctx.scale(scale, scale)

    // Draw semester dividers and labels
    const maxSemester = Math.max(...graphData.nodes.map((node) => node.semester), 0)
    for (let semester = 0; semester <= maxSemester; semester++) {
      const x = semester * 200

      // Draw vertical line
      ctx.beginPath()
      ctx.moveTo(x + 100, 0)
      ctx.lineTo(x + 100, canvas.height)
      ctx.strokeStyle = "rgba(0, 0, 0, 0.2)"
      ctx.setLineDash([5, 5])
      ctx.stroke()
      ctx.setLineDash([])

      // Draw semester label
      if (semester > 0) {
        ctx.font = "14px Arial"
        ctx.fillStyle = "black"
        ctx.textAlign = "center"
        ctx.fillText(`Semester ${semester}`, x, 30)
      }
    }

    // Draw edges with curved lines
    graphData.edges.forEach((edge) => {
      const sourceNode = graphData.nodes.find((n) => n.id === edge.source)
      const targetNode = graphData.nodes.find((n) => n.id === edge.target)

      if (sourceNode && targetNode) {
        const startX = sourceNode.x + 40 // Node radius
        const startY = sourceNode.y
        const endX = targetNode.x - 40 // Node radius
        const endY = targetNode.y

        // Calculate control points for curve
        const dx = endX - startX
        const controlX = startX + dx * 0.5

        ctx.beginPath()
        ctx.moveTo(startX, startY)
        ctx.quadraticCurveTo(controlX, startY, controlX, startY + (endY - startY) / 2)
        ctx.quadraticCurveTo(controlX, endY, endX, endY)

        // Color based on source semester
        const semesterColors = [
          "#e6194B",
          "#3cb44b",
          "#ffe119",
          "#4363d8",
          "#f58231",
          "#911eb4",
          "#42d4f4",
          "#f032e6",
          "#bfef45",
          "#fabed4",
          "#469990",
          "#dcbeff",
        ]
        const colorIndex = (sourceNode.semester - 1) % semesterColors.length

        ctx.strokeStyle = semesterColors[colorIndex]
        ctx.lineWidth = 2
        ctx.stroke()

        // Draw arrow at the end
        const angle = Math.atan2(endY - (startY + (endY - startY) / 2), endX - controlX)
        ctx.beginPath()
        ctx.moveTo(endX, endY)
        ctx.lineTo(endX - 10 * Math.cos(angle - Math.PI / 6), endY - 10 * Math.sin(angle - Math.PI / 6))
        ctx.lineTo(endX - 10 * Math.cos(angle + Math.PI / 6), endY - 10 * Math.sin(angle + Math.PI / 6))
        ctx.closePath()
        ctx.fillStyle = semesterColors[colorIndex]
        ctx.fill()
      }
    })

    // Draw nodes
    graphData.nodes.forEach((node) => {
      ctx.beginPath()
      ctx.arc(node.x, node.y, 40, 0, Math.PI * 2)
      ctx.fillStyle = node.completed ? "lightgray" : "lightblue"
      ctx.fill()
      ctx.strokeStyle = hoveredNode === node.id ? "#0066cc" : "#666"
      ctx.lineWidth = hoveredNode === node.id ? 3 : 1
      ctx.stroke()

      // Draw course ID
      ctx.font = "bold 12px Arial"
      ctx.fillStyle = "black"
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      ctx.fillText(node.id, node.x, node.y)
    })

    ctx.restore()
  }, [graphData, hoveredNode, panOffset, scale])

  // Handle mouse interactions
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      const x = (e.clientX - rect.left - panOffset.x) / scale
      const y = (e.clientY - rect.top - panOffset.y) / scale

      // Check if mouse is over a node
      let isOverNode = false
      for (const node of graphData.nodes) {
        const dx = node.x - x
        const dy = node.y - y
        const distance = Math.sqrt(dx * dx + dy * dy)

        if (distance <= 40) {
          // Node radius
          setHoveredNode(node.id)
          setTooltipPos({ x: e.clientX, y: e.clientY })
          isOverNode = true
          break
        }
      }

      if (!isOverNode && hoveredNode !== null) {
        setHoveredNode(null)
      }

      // Handle panning
      if (isPanning) {
        setPanOffset({
          x: e.clientX - startPanPos.x,
          y: e.clientY - startPanPos.y,
        })
      }
    }

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0) {
        // Left click
        setIsPanning(true)
        setStartPanPos({
          x: e.clientX - panOffset.x,
          y: e.clientY - panOffset.y,
        })
        canvas.style.cursor = "grabbing"
      }
    }

    const handleMouseUp = () => {
      setIsPanning(false)
      canvas.style.cursor = "default"
    }

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()

      // Calculate new scale
      const delta = -e.deltaY / 500
      const newScale = Math.max(0.5, Math.min(2, scale + delta))

      // Get mouse position relative to canvas
      const rect = canvas.getBoundingClientRect()
      const mouseX = e.clientX - rect.left
      const mouseY = e.clientY - rect.top

      // Calculate new pan offset to zoom toward mouse position
      const newPanOffset = {
        x: mouseX - (mouseX - panOffset.x) * (newScale / scale),
        y: mouseY - (mouseY - panOffset.y) * (newScale / scale),
      }

      setScale(newScale)
      setPanOffset(newPanOffset)
    }

    canvas.addEventListener("mousemove", handleMouseMove)
    canvas.addEventListener("mousedown", handleMouseDown)
    canvas.addEventListener("mouseup", handleMouseUp)
    canvas.addEventListener("mouseleave", handleMouseUp)
    canvas.addEventListener("wheel", handleWheel)

    return () => {
      canvas.removeEventListener("mousemove", handleMouseMove)
      canvas.removeEventListener("mousedown", handleMouseDown)
      canvas.removeEventListener("mouseup", handleMouseUp)
      canvas.removeEventListener("mouseleave", handleMouseUp)
      canvas.removeEventListener("wheel", handleWheel)
    }
  }, [graphData, hoveredNode, isPanning, panOffset, scale, startPanPos])

  // Find the hovered course
  const hoveredCourse = hoveredNode ? courses.find((course) => course.id === hoveredNode) : null

  return (
    <div className="relative w-full h-[600px] border border-gray-200 rounded-lg overflow-hidden">
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-grab"
        style={{ cursor: isPanning ? "grabbing" : "grab" }}
      />

      {hoveredCourse && (
        <div
          className="absolute z-10 bg-white p-3 rounded-lg shadow-lg border border-gray-200 max-w-xs"
          style={{
            left: tooltipPos.x + 10,
            top: tooltipPos.y + 10,
            pointerEvents: "none",
          }}
        >
          <h3 className="font-bold text-sm">{hoveredCourse.id}</h3>
          <p className="text-xs text-gray-600">Semester: {hoveredCourse.semester}</p>
          <p className="text-xs text-gray-600">Credits: {hoveredCourse.credits}</p>
          {hoveredCourse.prerequisites.length > 0 && (
            <p className="text-xs text-gray-600">Prerequisites: {hoveredCourse.prerequisites.join(", ")}</p>
          )}
          <p className="text-xs mt-1">{hoveredCourse.description}</p>
        </div>
      )}

      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-white px-3 py-1 rounded-full shadow-md border border-gray-200 text-sm">
        Use left click to pan, scroll to zoom
      </div>
    </div>
  )
}
