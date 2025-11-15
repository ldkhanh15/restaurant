"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Package, Eye, Edit, Trash2, Camera, Barcode, Badge, Download } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { supplierService } from "@/services/supplierService"
import { ingredientService } from "@/services/ingredientService"
import { inventoryImportService } from "@/services/inventoryImportService"
import { toast } from "react-toastify"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from "@/components/ui/pagination"
import employeeApi from "@/services/employeeService"
import { v4 as uuidv4 } from "uuid"
import { BrowserMultiFormatReader, NotFoundException } from "@zxing/library"
import ExcelJS from "exceljs"
import { saveAs } from "file-saver"

interface Employee {
  id: string
  user: {
    full_name: string
  }
}

interface IngredientAttributes {
  id: string
  name: string
  unit: string
  barcode?: string
  rfid?: string
  min_stock_level: number
  current_stock: number
  created_at?: Date
  updated_at?: Date
  deleted_at?: Date | null
}

interface ImportIngredient {
  ingredient: {
    id: string
    name: string
    unit: string
  }
  quantity: number
  total_price: number
}

interface InventoryImportAttributes {
  id: string
  reason?: string
  total_price: number
  employee_id?: string
  employee?: Employee | null
  supplier_id?: string
  supplier?: Supplier
  timestamp?: Date
  ingredients?: ImportIngredient[]
}

interface InventoryImportIngredientAttributes {
  id: string
  ingredient_id?: string
  quantity: number
  total_price: number
  inventory_imports_id?: string
  ingredient?: {
    id: string
    name: string
    unit: string
  }
}

interface Supplier {
  id: string
  name: string
  email?: string
  contact?: string
  address?: string
}

interface PaginationResult<T> {
  items: T[]
  total: number
  page: number
  totalPages: number
  hasNext: boolean
  hasPrevious: boolean
}

export function ImportManagement() {
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isLoadingDetail, setIsLoadingDetail] = useState(false)
  const [isLoading, setIsLoading] = useState(false) // Loading cho bảng

  // === BARCODE SCANNER MODAL ===
  const [isBarcodeScannerOpen, setIsBarcodeScannerOpen] = useState(false)
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null)
  const quantityInputRef = useRef<HTMLInputElement>(null)
  const audioContextRef = useRef<AudioContext | null>(null)

  // === TRẠNG THÁI QUÉT BARCODE ===
  const [scannedIngredient, setScannedIngredient] = useState<IngredientAttributes | null>(null)
  const [scanQuantity, setScanQuantity] = useState<string>("0")
  const [scanTotalPrice, setScanTotalPrice] = useState<string>("")
  const [scannedItems, setScannedItems] = useState<InventoryImportIngredientAttributes[]>([])
  const [totalScannedPrice, setTotalScannedPrice] = useState(0)

  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [ingredients, setIngredients] = useState<IngredientAttributes[]>([])
  const [imports, setImports] = useState<PaginationResult<InventoryImportAttributes>>()
  const [selectedImport, setSelectedImport] = useState<InventoryImportAttributes | undefined>()
  const [currentPage, setCurrentPage] = useState(1)

  // Form state
  const [selectedIngredients, setSelectedIngredients] = useState<InventoryImportIngredientAttributes[]>([])
  const [totalImportPrice, setTotalImportPrice] = useState(0)
  const [selectedSupplier, setSelectedSupplier] = useState("")
  const [selectedEmployee, setSelectedEmployee] = useState("")
  const [reason, setReason] = useState("")

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [ingredientErrors, setIngredientErrors] = useState<Record<number, Record<string, string>>>({})

  // === LỌC THEO THỜI GIAN ===
  const [filterType, setFilterType] = useState<'all' | 'day' | 'week' | 'month' | 'year'>('all')
  const [filterDate, setFilterDate] = useState<Date>(new Date())

  // === TÌM INGREDIENT THEO BARCODE ===
  const findIngredientByBarcode = (barcode: string): IngredientAttributes | null => {
    return ingredients.find(ing => ing.barcode?.trim() === barcode.trim()) || null
  }

  // === PHÁT ÂM THANH BEEP ===
  const playBeep = async () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
    try {
      const response = await fetch("/sounds/beep.mp3")
      const arrayBuffer = await response.arrayBuffer()
      const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer)
      const source = audioContextRef.current.createBufferSource()
      source.buffer = audioBuffer
      source.connect(audioContextRef.current.destination)
      source.start(0)
    } catch (err) {
      console.warn("Không thể phát âm thanh beep:", err)
      const audio = new Audio("/sounds/beep.mp3")
      audio.play().catch(() => {})
    }
  }

  // === TẢI DỮ LIỆU BAN ĐẦU ===
  useEffect(() => {
    loadSuppliers()
    loadIngredients()
    loadEmployees()
    loadImports(1)
    codeReaderRef.current = new BrowserMultiFormatReader()
    return () => {
      if (codeReaderRef.current) codeReaderRef.current.reset()
      if (audioContextRef.current) audioContextRef.current.close()
    }
  }, [])

  // === TỰ ĐỘNG FOCUS KHI CÓ INGREDIENT ===
  useEffect(() => {
    if (scannedIngredient && quantityInputRef.current) {
      quantityInputRef.current.focus()
      quantityInputRef.current.select()
    }
  }, [scannedIngredient])

  // === KHỞI ĐỘNG CAMERA ===
  useEffect(() => {
    if (isCameraActive && videoRef.current && codeReaderRef.current) {
      navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } }
      })
        .then(stream => {
          setCameraStream(stream)
          if (videoRef.current) {
            videoRef.current.srcObject = stream
            videoRef.current.play()
            startContinuousBarcodeScanning()
          }
        })
        .catch(err => {
          console.error("Lỗi camera:", err)
          toast.error("Không thể truy cập camera. Vui lòng kiểm tra quyền.")
          setIsCameraActive(false)
        })
    }
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop())
      }
      if (codeReaderRef.current) {
        codeReaderRef.current.reset()
      }
    }
  }, [isCameraActive])

  // === QUÉT BARCODE LIÊN TỤC ===
  const startContinuousBarcodeScanning = () => {
    if (!videoRef.current || !codeReaderRef.current || !isCameraActive) return
    const codeReader = codeReaderRef.current
    let lastScannedCode = ""
    let lastScannedTime = 0
    const DEBOUNCE_TIME = 1000
    const scan = () => {
      if (!isCameraActive || !videoRef.current) return
      codeReader.decodeFromVideoDevice(null, videoRef.current, (result, err) => {
        if (result) {
          const barcode = result.getText()
          const now = Date.now()
          if (barcode !== lastScannedCode || now - lastScannedTime > DEBOUNCE_TIME) {
            lastScannedCode = barcode
            lastScannedTime = now
            handleBarcodeScanned(barcode)
            playBeep()
          }
        }
        if (err && !(err instanceof NotFoundException)) {
          console.warn("Lỗi quét:", err)
        }
      })
    }
    scan()
  }

  // === XỬ LÝ KHI QUÉT ĐƯỢC BARCODE ===
  const handleBarcodeScanned = (barcode: string) => {
    if (!barcode) return
    const ingredient = findIngredientByBarcode(barcode)
    if (ingredient) {
      setScannedIngredient(ingredient)
      setScanQuantity("0")
      setScanTotalPrice("")
      toast.success(`Đã quét: ${ingredient.name}`)
    } else {
      toast.error(`Không tìm thấy nguyên liệu với mã: ${barcode}`)
    }
  }

  // === THÊM NGUYÊN LIỆU TỪ QUÉT ===
  const handleAddScannedItem = () => {
    if (!scannedIngredient) return
    const quantity = parseFloat(scanQuantity) || 0
    const totalPrice = parseFloat(scanTotalPrice) || 0
    if (quantity <= 0) return toast.error("Số lượng phải > 0")
    if (totalPrice <= 0) return toast.error("Thành tiền phải > 0")

    const newItem: InventoryImportIngredientAttributes = {
      id: uuidv4(),
      ingredient_id: scannedIngredient.id,
      quantity,
      total_price: totalPrice,
      ingredient: { id: scannedIngredient.id, name: scannedIngredient.name, unit: scannedIngredient.unit }
    }
    const updatedItems = [...scannedItems, newItem]
    setScannedItems(updatedItems)
    setTotalScannedPrice(prev => prev + totalPrice)
    toast.success("Đã thêm nguyên liệu")
    setScannedIngredient(null)
    setScanQuantity("0")
    setScanTotalPrice("")
  }

  // === XÓA ITEM ĐÃ QUÉT ===
  const handleRemoveScannedItem = (index: number) => {
    const item = scannedItems[index]
    const updated = scannedItems.filter((_, i) => i !== index)
    setScannedItems(updated)
    setTotalScannedPrice(prev => prev - (item.total_price || 0))
  }

  // === CHUYỂN DỮ LIỆU SANG MODAL NHẬP HÀNG ===
  const handleTransferToImport = () => {
    if (scannedItems.length === 0) return toast.warn("Chưa có nguyên liệu nào để chuyển")
    setSelectedIngredients(prev => [...prev, ...scannedItems])
    setTotalImportPrice(prev => prev + totalScannedPrice)
    handleCloseBarcodeScanner()
    setIsImportDialogOpen(true)
  }

  const loadEmployees = async () => {
    try {
      const response = await employeeApi.getAllNoPaging()
      setEmployees(response as any || [])
    } catch (error) {
      toast.error("Không thể tải danh sách nhân viên")
    }
  }

  const loadSuppliers = async () => {
    try {
      const response = await supplierService.getAllNoPaging()
      setSuppliers(response as any || [])
    } catch (error) {
      toast.error("Không thể tải danh sách nhà cung cấp")
    }
  }

  const loadIngredients = async () => {
    try {
      const response = await ingredientService.getAllNoPaging()
      setIngredients(response as any || [])
    } catch (error) {
      toast.error("Không thể tải danh sách nguyên liệu")
    }
  }

  // === LOAD IMPORTS VỚI LỌC CHÍNH XÁC ===
  const loadImports = async (page: number) => {
    setIsLoading(true)
    try {
      const params: any = {
        page,
        limit: 1000,
        sortBy: 'timestamp',
        sortOrder: 'DESC'
      }

      // Chỉ thêm filter ngày nếu không phải "Tất cả"
      if (filterType !== 'all') {
        let startDate = new Date()
        let endDate = new Date()

        if (filterType === 'day') {
          startDate = new Date(filterDate.getFullYear(), filterDate.getMonth(), filterDate.getDate(), 0, 0, 0, 0)
          endDate = new Date(filterDate.getFullYear(), filterDate.getMonth(), filterDate.getDate(), 23, 59, 59, 999)
        } 
        else if (filterType === 'week') {
          // Tuần: từ 7 ngày trước đến hôm nay
          endDate = new Date()
          endDate.setHours(23, 59, 59, 999)
          startDate = new Date(endDate)
          startDate.setDate(endDate.getDate() - 6)
          startDate.setHours(0, 0, 0, 0)
        } 
        else if (filterType === 'month') {
          startDate = new Date(filterDate.getFullYear(), filterDate.getMonth(), 1, 0, 0, 0, 0)
          endDate = new Date(filterDate.getFullYear(), filterDate.getMonth() + 1, 0, 23, 59, 59, 999)
        } 
        else if (filterType === 'year') {
          startDate = new Date(filterDate.getFullYear(), 0, 1, 0, 0, 0, 0)
          endDate = new Date(filterDate.getFullYear(), 11, 31, 23, 59, 59, 999)
        }

        params.start_date = startDate.toISOString()
        params.end_date = endDate.toISOString()

        console.log("Filtering with:", { filterType, filterDate, startDate: startDate.toISOString(), endDate: endDate.toISOString() })
      } else {
        console.log("Loading all imports without date filter")
      }

      const response = await inventoryImportService.getAll(params)
      const responseData = response as any || {}
      // Backend trả về { status: "success", data: { items, total, page, totalPages, ... } }
      const data = responseData.data || responseData.items || []
      const paginationData = responseData.data || responseData

      setImports({
        items: Array.isArray(data) ? data : (paginationData.items || []),
        total: paginationData.total || (Array.isArray(data) ? data.length : 0),
        page: paginationData.page || 1,
        totalPages: paginationData.totalPages || 1,
        hasNext: paginationData.hasNext || false,
        hasPrevious: paginationData.hasPrevious || false
      })
      setCurrentPage(1) // Reset trang khi lọc
    } catch (error: any) {
      toast.error(error?.message || "Không thể tải lịch sử nhập hàng")
    } finally {
      setIsLoading(false)
    }
  }

  // === ÁP DỤNG LỌC KHI NHẤN NÚT ===
  const handleApplyFilter = () => {
    loadImports(1)
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    if (!selectedSupplier) newErrors.supplier = "Vui lòng chọn nhà cung cấp"
    if (selectedIngredients.length === 0) newErrors.ingredients = "Phải có ít nhất 1 nguyên liệu"

    const newIngErrors: Record<number, Record<string, string>> = {}
    selectedIngredients.forEach((ing, index) => {
      const err: Record<string, string> = {}
      if (!ing.ingredient_id) err.ingredient = "Vui lòng chọn nguyên liệu"
      if (!ing.quantity || ing.quantity <= 0) err.quantity = "Số lượng phải > 0"
      if (!ing.total_price || ing.total_price <= 0) err.total_price = "Thành tiền phải > 0"
      if (Object.keys(err).length > 0) newIngErrors[index] = err
    })

    setErrors(newErrors)
    setIngredientErrors(newIngErrors)
    if (Object.keys(newErrors).length > 0 || Object.keys(newIngErrors).length > 0) {
      toast.error(Object.values(newErrors)[0] || "Vui lòng kiểm tra lại các trường")
      return false
    }
    return true
  }

  const resetForm = () => {
    setSelectedIngredients([])
    setTotalImportPrice(0)
    setSelectedSupplier("")
    setSelectedEmployee("")
    setReason("")
    setSelectedImport(undefined)
    setErrors({})
    setIngredientErrors({})
  }

  const handleCreateImport = async () => {
    if (!validateForm()) return
    const id = uuidv4()
    try {
      const importData = {
        id,
        reason: reason.trim() || "Nhập hàng",
        supplier_id: selectedSupplier,
        employee_id: selectedEmployee === "none" ? null : selectedEmployee,
        total_price: totalImportPrice,
        ingredients: selectedIngredients.map(ing => ({
          id: uuidv4(),
          ingredient_id: ing.ingredient_id!,
          quantity: ing.quantity,
          total_price: ing.total_price
        }))
      }
      await inventoryImportService.create(importData)
      await inventoryImportService.addIngredients({
        inventory_imports_id: id,
        ingredients: importData.ingredients
      })
      toast.success("Tạo phiếu nhập hàng thành công")
      setIsImportDialogOpen(false)
      loadImports(currentPage)
      resetForm()
    } catch (error: any) {
      toast.error(error?.message || "Không thể tạo phiếu nhập hàng")
    }
  }

  const handleUpdateImport = async () => {
    if (!selectedImport || !validateForm()) return
    try {
      const calculatedTotal = selectedIngredients.reduce((sum, ing) => sum + ing.total_price, 0)
      const importData = {
        reason: reason.trim() || "Nhập hàng",
        supplier_id: selectedSupplier,
        employee_id: selectedEmployee === "none" ? null : selectedEmployee,
        total_price: calculatedTotal
      }
      await inventoryImportService.update(selectedImport.id, importData)
      const ingredients = selectedIngredients.map(ing => ({
        id: ing.id,
        ingredient_id: ing.ingredient_id!,
        quantity: ing.quantity,
        total_price: ing.total_price
      }))
      await inventoryImportService.updateInventoryIngredients(selectedImport.id, ingredients)
      toast.success("Cập nhật phiếu nhập hàng thành công")
      setIsEditDialogOpen(false)
      loadImports(currentPage)
      resetForm()
    } catch (error: any) {
      toast.error(error?.message || "Không thể cập nhật phiếu nhập hàng")
    }
  }

  const handleDeleteImport = async () => {
    if (!selectedImport) return
    try {
      await inventoryImportService.remove(selectedImport.id)
      toast.success("Xóa phiếu nhập hàng thành công")
      setIsDeleteDialogOpen(false)
      loadImports(currentPage)
      setSelectedImport(undefined)
    } catch (error) {
      toast.error("Không thể xóa phiếu nhập hàng")
    }
  }

  const handleEdit = async (importRecord: InventoryImportAttributes) => {
    try {
      const resp = await inventoryImportService.getById(importRecord.id)
      const data = resp as any
      setSelectedImport(data)
      setReason(data.reason || "")
      setSelectedSupplier(data.supplier_id || data.supplier?.id || "")
      setSelectedEmployee(data.employee_id || data.employee?.id || "none")
      setTotalImportPrice(data.total_price || 0)
      if (data.ingredients) {
        setSelectedIngredients(
          data.ingredients.map((ing: any) => ({
            id: ing.id || uuidv4(),
            ingredient_id: ing.ingredient?.id || ing.ingredient_id || "",
            quantity: Number(ing.quantity) || 0,
            total_price: Number(ing.total_price) || 0
          }))
        )
      }
      setErrors({})
      setIngredientErrors({})
      setIsEditDialogOpen(true)
    } catch (error) {
      toast.error("Không thể tải chi tiết phiếu nhập")
    }
  }

  const loadImportDetail = async (id: string) => {
    try {
      setIsLoadingDetail(true)
      const resp = await inventoryImportService.getById(id)
      setSelectedImport(resp as any)
      setIsDetailDialogOpen(true)
    } catch (error) {
      toast.error("Không thể tải chi tiết phiếu nhập")
    } finally {
      setIsLoadingDetail(false)
    }
  }

  const getPageNumbers = () => {
    if (!imports) return []
    const totalPages = imports.totalPages
    const maxPagesToShow = 5
    const pages: (number | string)[] = []
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2))
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1)
    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1)
    }
    for (let i = startPage; i <= endPage; i++) pages.push(i)
    if (startPage > 1) { pages.unshift('...'); pages.unshift(1) }
    if (endPage < totalPages) { pages.push('...'); pages.push(totalPages) }
    return pages
  }

  const handleOpenImportDialog = () => { resetForm(); setIsImportDialogOpen(true) }
  const handleOpenBarcodeScanner = () => {
    setScannedItems([])
    setTotalScannedPrice(0)
    setIsCameraActive(false)
    setIsBarcodeScannerOpen(true)
  }
  const handleCloseBarcodeScanner = () => {
    setIsBarcodeScannerOpen(false)
    setIsCameraActive(false)
    setScannedItems([])
    setTotalScannedPrice(0)
    setScannedIngredient(null)
    setScanQuantity("0")
    setScanTotalPrice("")
    if (cameraStream) cameraStream.getTracks().forEach(track => track.stop())
    if (codeReaderRef.current) codeReaderRef.current.reset()
  }

  const updateIngredient = (index: number, field: keyof InventoryImportIngredientAttributes, value: any) => {
    const newIngredients = [...selectedIngredients]
    newIngredients[index] = { ...newIngredients[index], [field]: value }
    if (field === "total_price") {
      const total = newIngredients.reduce((sum, ing) => sum + (Number(ing.total_price) || 0), 0)
      setTotalImportPrice(total)
    }
    setSelectedIngredients(newIngredients)
    const newIngErrors = { ...ingredientErrors }
    if (newIngErrors[index]) {
      delete newIngErrors[index][field]
      if (Object.keys(newIngErrors[index]).length === 0) delete newIngErrors[index]
    }
    setIngredientErrors(newIngErrors)
  }

  // === EXPORT EXCEL ===
  const handleExportExcel = async () => {
    if (!imports || imports.items.length === 0) return toast.warn("Không có dữ liệu để xuất")
    const fullImports = await Promise.all(
      imports.items.map(async (imp) => {
        if (!imp.ingredients || imp.ingredients.length === 0) {
          const fullData = await inventoryImportService.getById(imp.id)
          return fullData as any
        }
        return imp
      })
    )
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet("Phiếu Nhập Hàng", { pageSetup: { paperSize: 9, orientation: 'landscape' } })

    const title = `BÁO CÁO NHẬP HÀNG - ${formatFilterLabel()}`
    worksheet.mergeCells('A1:I1')
    const titleCell = worksheet.getCell('A1')
    titleCell.value = title
    titleCell.font = { size: 16, bold: true, color: { argb: 'FFFFFFFF' } }
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1f4e79' } }
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' }
    worksheet.getRow(1).height = 36

    const headerRow = worksheet.addRow(['STT', 'Mã phiếu', 'Lý do', 'Ngày nhập', 'Nhà cung cấp', 'Nhân viên', 'Tổng tiền (đ)', 'Nguyên liệu', 'SL × Đơn vị | Thành tiền'])
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } }
    headerRow.eachCell(cell => {
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
    })

    let totalAll = 0
    let stt = 1
    fullImports.forEach(imp => {
      const totalPrice = Number(imp.total_price) || 0
      totalAll += totalPrice
      const ingredients = imp.ingredients || []
      const mainRow = worksheet.addRow([
        stt++,
        `#${imp.id}`,
        imp.reason || 'Nhập hàng',
        imp.timestamp ? new Date(imp.timestamp).toLocaleDateString('vi-VN') : '-',
        imp.supplier?.name || '-',
        imp.employee?.user?.full_name || '-',
        totalPrice,
        '',
        ''
      ])
      mainRow.eachCell((cell, colNumber) => {
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
        if (colNumber === 7) { 
          cell.numFmt = '#,##0" đ"'
          cell.alignment = { horizontal: 'right' } 
        }
      })
      if (ingredients.length > 0) {
        const first = ingredients[0]
        const firstPrice = Number(first.total_price) || 0
        mainRow.getCell(8).value = first.ingredient?.name || ''
        mainRow.getCell(9).value = `${first.quantity} ${first.ingredient?.unit} | ${firstPrice.toLocaleString('vi-VN')} đ`
        mainRow.getCell(9).alignment = { horizontal: 'left' }
      }
      ingredients.slice(1).forEach((ing:any) => {
        const ingPrice = Number(ing.total_price) || 0
        const subRow = worksheet.addRow(['', '', '', '', '', '', '', ing.ingredient?.name || '', `${ing.quantity} ${ing.ingredient?.unit} | ${ingPrice.toLocaleString('vi-VN')} đ`])
        subRow.eachCell((cell, colNumber) => {
          cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
          if (colNumber === 9) {
            cell.alignment = { horizontal: 'left' }
          }
        })
      })
    })

    const totalRow = worksheet.addRow(['', '', '', '', '', 'TỔNG CỘNG:', totalAll, '', ''])
    totalRow.font = { bold: true, size: 13 }
    totalRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFCE4D6' } }
    totalRow.getCell(6).alignment = { horizontal: 'right' }
    totalRow.getCell(7).numFmt = '#,##0" đ"'
    totalRow.getCell(7).alignment = { horizontal: 'right' }
    totalRow.eachCell(cell => cell.border = { top: { style: 'medium' }, left: { style: 'thin' }, bottom: { style: 'medium' }, right: { style: 'thin' } })

    worksheet.columns = [
      { width: 6 }, { width: 16 }, { width: 20 }, { width: 14 }, { width: 22 }, { width: 18 }, { width: 16 }, { width: 24 }, { width: 32 }
    ]

    const buffer = await workbook.xlsx.writeBuffer()
    const fileName = `BaoCao_NhapHang_${formatFilterLabel().replace(/[^a-z0-9]/gi, '_')}.xlsx`
    saveAs(new Blob([buffer]), fileName)
    toast.success("Xuất Excel thành công!")
  }

  const formatFilterLabel = () => {
    if (filterType === 'all') return 'Tất cả'
    if (filterType === 'day') return filterDate.toLocaleDateString('vi-VN')
    if (filterType === 'week') {
      // Tuần: từ 7 ngày trước đến hôm nay
      const endDate = new Date()
      const startDate = new Date(endDate)
      startDate.setDate(endDate.getDate() - 6)
      return `${startDate.toLocaleDateString('vi-VN')} - ${endDate.toLocaleDateString('vi-VN')}`
    }
    if (filterType === 'month') return `${filterDate.getMonth() + 1}/${filterDate.getFullYear()}`
    if (filterType === 'year') return filterDate.getFullYear().toString()
    return 'Tất cả'
  }

  return (
    <div className="space-y-6">
      {/* === NÚT QUÉT MÃ + NHẬP HÀNG === */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={handleOpenBarcodeScanner}>
          <Camera className="h-4 w-4 mr-2" />
          Quét mã
        </Button>
        <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" onClick={handleOpenImportDialog}>
              <Package className="h-4 w-4 mr-2" />
              Nhập hàng
            </Button>
          </DialogTrigger>
          {/* === MODAL NHẬP HÀNG === */}
          <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nhập hàng mới</DialogTitle>
              <DialogDescription>Tạo phiếu nhập hàng mới</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-1">
                  <Label htmlFor="import-reason">Lý do nhập</Label>
                  <Input
                    id="import-reason"
                    placeholder="Nhập hàng định kỳ"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                </div>
                <div className="grid gap-1">
                  <Label htmlFor="supplier">Nhà cung cấp *</Label>
                  <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn nhà cung cấp" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.supplier && <p className="text-sm text-red-500">{errors.supplier}</p>}
                </div>
                <div className="grid gap-1">
                  <Label htmlFor="employee">Nhân viên</Label>
                  <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn nhân viên" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Không chọn</SelectItem>
                      {employees.map((employee) => (
                        <SelectItem key={employee.id} value={employee.id}>
                          {employee.user.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Nguyên liệu nhập *</Label>
                {errors.ingredients && <p className="text-sm text-red-500 -mt-2">{errors.ingredients}</p>}
                <div className="border rounded-lg p-4 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-[2fr_1fr_1fr_50px] gap-2 text-sm font-medium">
                    <span>Nguyên liệu</span>
                    <span>Số lượng</span>
                    <span>Thành tiền</span>
                    <span></span>
                  </div>
                  {selectedIngredients.map((item, index) => {
                    const ingredient = ingredients.find(ing => ing.id === item.ingredient_id)
                    return (
                      <div key={item.id} className="grid grid-cols-1 sm:grid-cols-[2fr_1fr_1fr_50px] gap-2 items-start">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            {ingredient?.barcode && (
                              <Badge className="text-xs">
                                {ingredient.barcode}
                              </Badge>
                            )}
                            <Select
                              value={item.ingredient_id || ""}
                              onValueChange={(value) => updateIngredient(index, "ingredient_id", value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Chọn nguyên liệu" />
                              </SelectTrigger>
                              <SelectContent>
                                {ingredients.map((ingredient) => (
                                  <SelectItem key={ingredient.id} value={ingredient.id}>
                                    {ingredient.name} ({ingredient.unit})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          {ingredient && (
                            <p className="text-xs text-muted-foreground">
                              {ingredient.unit} • Tồn kho: {ingredient.current_stock}
                            </p>
                          )}
                          {ingredientErrors[index]?.ingredient && (
                            <p className="text-sm text-red-500">{ingredientErrors[index].ingredient}</p>
                          )}
                        </div>
                        <div className="space-y-1">
                          <Input
                            type="text"
                            placeholder="Số lượng"
                            value={item.quantity}
                            onChange={(e) => {
                              const val = e.target.value
                              if (/^[\d]*\.?[\d]*$/.test(val) || val === "") {
                                updateIngredient(index, "quantity", e.target.value as any)
                              } else {
                                toast.warn("Vui lòng chỉ nhập số hoặc dấu chấm (.)")
                              }
                            }}
                            className="w-28"
                          />
                          {ingredientErrors[index]?.quantity && (
                            <p className="text-sm text-red-500">{ingredientErrors[index].quantity}</p>
                          )}
                        </div>
                        <div className="space-y-1">
                          <Input
                            type="number"
                            min="1"
                            placeholder="Tiền"
                            value={item.total_price || ""}
                            onChange={(e) => updateIngredient(index, "total_price", Number(e.target.value) || 0)}
                          />
                          {ingredientErrors[index]?.total_price && (
                            <p className="text-sm text-red-500">{ingredientErrors[index].total_price}</p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            const newIngredients = selectedIngredients.filter((_, i) => i !== index)
                            setSelectedIngredients(newIngredients)
                            setTotalImportPrice(newIngredients.reduce((sum, i) => sum + (i.total_price || 0), 0))
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )
                  })}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedIngredients([
                        ...selectedIngredients,
                        { id: uuidv4(), quantity: 0, total_price: 0, ingredient_id: "" }
                      ])
                    }}
                  >
                    + Thêm nguyên liệu
                  </Button>
                </div>
                <div className="text-right font-bold text-lg">
                  Tổng cộng: {totalImportPrice.toLocaleString('vi-VN')}đ
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreateImport}>Tạo phiếu nhập</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* === BỘ LỌC & EXPORT === */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
            {/* Filter Section */}
            <div className="flex flex-col gap-3 flex-1">
              <Label className="text-sm font-semibold">Lọc theo thời gian</Label>
              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end flex-wrap">
                <div className="w-full sm:w-auto">
                  <Label htmlFor="filter-type" className="text-xs text-muted-foreground mb-1 block">Loại</Label>
                  <Select value={filterType} onValueChange={(v) => setFilterType(v as any)}>
                    <SelectTrigger className="w-full sm:w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả</SelectItem>
                      <SelectItem value="day">Ngày</SelectItem>
                      <SelectItem value="week">Tuần (7 ngày gần nhất)</SelectItem>
                      <SelectItem value="month">Tháng</SelectItem>
                      <SelectItem value="year">Năm</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {filterType === 'day' && (
                  <div className="w-full sm:w-auto">
                    <Label htmlFor="filter-day" className="text-xs text-muted-foreground mb-1 block">Chọn ngày</Label>
                    <Input
                      id="filter-day"
                      type="date"
                      value={filterDate.toISOString().split('T')[0]}
                      onChange={(e) => {
                        const newDate = new Date(e.target.value)
                        if (!isNaN(newDate.getTime())) setFilterDate(newDate)
                      }}
                      className="w-full sm:w-40"
                    />
                  </div>
                )}

                {filterType === 'week' && (
                  <div className="w-full sm:w-auto">
                    <Label htmlFor="filter-week" className="text-xs text-muted-foreground mb-1 block">Hiển thị 7 ngày gần nhất</Label>
                    <div className="text-xs text-muted-foreground p-2 border rounded bg-gray-50 w-full sm:w-40">
                      Từ {(() => {
                        const endDate = new Date()
                        const startDate = new Date(endDate)
                        startDate.setDate(endDate.getDate() - 6)
                        return `${startDate.toLocaleDateString('vi-VN')} - ${endDate.toLocaleDateString('vi-VN')}`
                      })()}
                    </div>
                  </div>
                )}

                {filterType === 'month' && (
                  <div className="w-full sm:w-auto">
                    <Label htmlFor="filter-month" className="text-xs text-muted-foreground mb-1 block">Chọn tháng</Label>
                    <Input
                      id="filter-month"
                      type="month"
                      value={filterDate.toISOString().slice(0, 7)}
                      onChange={(e) => {
                        const [year, month] = e.target.value.split('-')
                        const newDate = new Date(Number(year), Number(month) - 1, 1)
                        if (!isNaN(newDate.getTime())) setFilterDate(newDate)
                      }}
                      className="w-full sm:w-50"
                    />
                  </div>
                )}

                {filterType === 'year' && (
                  <div className="w-full sm:w-auto">
                    <Label htmlFor="filter-year" className="text-xs text-muted-foreground mb-1 block">Chọn năm</Label>
                    <Input
                      id="filter-year"
                      type="number"
                      min="2000"
                      max="2100"
                      value={filterDate.getFullYear()}
                      onChange={(e) => {
                        const year = Number(e.target.value)
                        if (year >= 2000 && year <= 2100) setFilterDate(new Date(year, 0, 1))
                      }}
                      className="w-full sm:w-40"
                      placeholder="Năm"
                    />
                  </div>
                )}

                <Button
                  variant="default"
                  size="sm"
                  onClick={handleApplyFilter}
                  disabled={isLoading}
                  className="w-full sm:w-auto"
                >
                  <Badge className="h-3.5 w-3.5 mr-2" />
                  Áp dụng lọc
                </Button>
              </div>

              {/* Filter Info */}
              <div className="text-xs text-muted-foreground mt-2">
                Hiển thị: <span className="font-semibold text-foreground">{formatFilterLabel()}</span>
                {imports && imports.total > 0 && (
                  <span className="ml-2">• {imports.total} phiếu nhập</span>
                )}
              </div>
            </div>

            {/* Export Section */}
            <div className="flex flex-col items-start sm:items-end gap-2 w-full sm:w-auto">
              <Button
                variant="default"
                onClick={handleExportExcel}
                className="w-full sm:w-auto bg-green-600 hover:bg-green-700"
                disabled={!imports || imports.items.length === 0 || isLoading}
              >
                <Download className="h-4 w-4 mr-2" />
                Xuất Excel
              </Button>
              <p className="text-xs text-muted-foreground">
                Tổng: <span className="font-semibold text-foreground">
                  {(imports?.items || []).reduce((sum, imp) => sum + (Number(imp.total_price) || 0), 0).toLocaleString('vi-VN')}đ
                </span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* === BẢNG LỊCH SỬ NHẬP HÀNG === */}
      <Card>
        <CardHeader>
          <CardTitle>Lịch sử nhập hàng</CardTitle>
          <CardDescription>Theo dõi các lần nhập hàng vào kho</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : !imports || imports.items.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Không có dữ liệu nhập hàng</p>
              <p className="text-sm mt-1">Thử thay đổi bộ lọc hoặc tạo phiếu nhập mới.</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mã phiếu</TableHead>
                    <TableHead>Lý do</TableHead>
                    <TableHead>Ngày nhập</TableHead>
                    <TableHead>Tổng tiền</TableHead>
                    <TableHead>Nhân viên</TableHead>
                    <TableHead>Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {imports.items.map((imp) => (
                    <TableRow key={imp.id}>
                      <TableCell className="font-medium">#{imp.id}</TableCell>
                      <TableCell>{imp.reason || "Nhập hàng"}</TableCell>
                      <TableCell>{imp.timestamp ? new Date(imp.timestamp).toLocaleDateString("vi-VN") : "-"}</TableCell>
                      <TableCell className="font-medium text-right">{(Number(imp.total_price) || 0).toLocaleString("vi-VN")}đ</TableCell>
                      <TableCell>{imp.employee?.user?.full_name || "—"}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => loadImportDetail(imp.id)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(imp)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedImport(imp)
                              setIsDeleteDialogOpen(true)
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {imports.totalPages > 1 && (
                <div className="mt-6">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => imports.hasPrevious && loadImports(currentPage - 1)}
                          className={!imports.hasPrevious ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                      {getPageNumbers().map((page, i) => (
                        <PaginationItem key={i}>
                          {page === '...' ? (
                            <PaginationEllipsis />
                          ) : (
                            <PaginationLink
                              isActive={currentPage === page}
                              onClick={() => typeof page === 'number' && loadImports(page)}
                              className="cursor-pointer"
                            >
                              {page}
                            </PaginationLink>
                          )}
                        </PaginationItem>
                      ))}
                      <PaginationItem>
                        <PaginationNext
                          onClick={() => imports.hasNext && loadImports(currentPage + 1)}
                          className={!imports.hasNext ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* === MODAL QUÉT BARCODE === */}
      <Dialog open={isBarcodeScannerOpen} onOpenChange={handleCloseBarcodeScanner}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Barcode className="h-5 w-5" />
              Quét mã barcode
            </DialogTitle>
            <DialogDescription>
              Bấm "Bắt đầu quét" để kích hoạt camera. Hướng vào mã vạch.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Camera View */}
            <div className="relative">
              <div className={`relative w-full aspect-video rounded-lg overflow-hidden border-2 ${
                isCameraActive ? 'border-green-500' : 'border-gray-300'
              }`}>
                {isCameraActive ? (
                  <>
                    <video
                      ref={videoRef}
                      className="w-full h-full object-cover"
                      playsInline
                      muted
                    />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="border-2 border-green-500 rounded-lg w-64 h-32 opacity-50"></div>
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100">
                    <Camera className="h-12 w-12 text-gray-400" />
                    <p className="absolute bottom-4 text-sm text-gray-500">Camera tắt</p>
                  </div>
                )}
              </div>
            </div>

            {/* Form nhập khi quét thành công */}
            {scannedIngredient && (
              <div className="p-4 border rounded-lg bg-green-50 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{scannedIngredient.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Tồn: {scannedIngredient.current_stock}
                    </p>
                  </div>
                  <Badge>{scannedIngredient.barcode}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>Số lượng</Label>
                    <div className="flex items-center gap-1">
                      <Input
                        ref={quantityInputRef}
                        type="text"
                        value={scanQuantity}
                        onChange={(e) => {
                          const val = e.target.value
                          if (/^[\d]*\.?[\d]*$/.test(val) || val === "") {
                            setScanQuantity(val)
                          }
                        }}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddScannedItem()}
                        placeholder="0"
                        className="w-full"
                      />
                      <span className="text-sm text-muted-foreground whitespace-nowrap">
                        {scannedIngredient.unit}
                      </span>
                    </div>
                  </div>
                  <div>
                    <Label>Thành tiền (đ)</Label>
                    <Input
                      type="number"
                      value={scanTotalPrice}
                      onChange={(e) => setScanTotalPrice(e.target.value)}
                      placeholder="0"
                    />
                  </div>
                </div>
                <Button className="w-full" onClick={handleAddScannedItem}>
                  Thêm vào danh sách
                </Button>
              </div>
            )}

            {/* Danh sách đã quét */}
            {scannedItems.length > 0 && (
              <div className="border rounded-lg p-3 space-y-2">
                <Label>Danh sách đã quét ({scannedItems.length})</Label>
                {scannedItems.map((item, index) => {
                  const ing = ingredients.find(i => i.id === item.ingredient_id)
                  return (
                    <div key={item.id} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded">
                      <div>
                        <span className="font-medium">{ing?.name}</span> × {item.quantity} {ing?.unit}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{item.total_price.toLocaleString('vi-VN')}đ</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveScannedItem(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
                <div className="text-right font-bold pt-2 border-t">
                  Tổng: {totalScannedPrice.toLocaleString('vi-VN')}đ
                </div>
              </div>
            )}

            {/* Nút điều khiển */}
            <div className="flex gap-2">
              <Button
                variant={isCameraActive ? "outline" : "default"}
                className="flex-1"
                onClick={() => setIsCameraActive(!isCameraActive)}
              >
                {isCameraActive ? "Dừng quét" : "Bắt đầu quét"}
              </Button>
              <Button
                variant="default"
                className="flex-1"
                onClick={handleTransferToImport}
                disabled={scannedItems.length === 0}
              >
                Chuyển ({scannedItems.length})
              </Button>
              <Button
                variant="secondary"
                className="flex-1"
                onClick={handleCloseBarcodeScanner}
              >
                Đóng
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* === DETAIL DIALOG === */}
      <Dialog open={isDetailDialogOpen && !isLoadingDetail} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          {isLoadingDetail ? (
            <div className="py-8 text-center">Đang tải...</div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Chi tiết phiếu nhập</DialogTitle>
                <DialogDescription>
                  Phiếu #{selectedImport?.id} - {selectedImport?.reason || "Không có lý do"}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Ngày nhập</Label>
                    <div>{selectedImport?.timestamp ? new Date(selectedImport.timestamp).toLocaleDateString("vi-VN") : "-"}</div>
                  </div>
                  <div>
                    <Label>Tổng tiền</Label>
                    <div className="font-bold text-lg">
                      {(Number(selectedImport?.total_price) || 0).toLocaleString("vi-VN")}đ
                    </div>
                  </div>
                </div>
                {selectedImport?.supplier && (
                  <div>
                    <Label>Nhà cung cấp</Label>
                    <div className="text-sm space-y-1">
                      <div><strong>{selectedImport.supplier.name}</strong></div>
                      {selectedImport.supplier.contact && <div>SĐT: {selectedImport.supplier.contact}</div>}
                    </div>
                  </div>
                )}
                <div>
                  <Label>Nhân viên</Label>
                  <div>{selectedImport?.employee?.user.full_name || "Không có"}</div>
                </div>
                <div>
                  <Label>Danh sách nguyên liệu</Label>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tên</TableHead>
                        <TableHead>SL</TableHead>
                        <TableHead>Đơn vị</TableHead>
                        <TableHead className="text-right">Thành tiền</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedImport?.ingredients?.length ? (
                        selectedImport.ingredients.map((ing: any) => (
                          <TableRow key={ing.id}>
                            <TableCell>{ing.ingredient?.name || "-"}</TableCell>
                            <TableCell>{Number(ing.quantity) || 0}</TableCell>
                            <TableCell>{ing.ingredient?.unit || "-"}</TableCell>
                            <TableCell className="text-right">{(Number(ing.total_price) || 0).toLocaleString("vi-VN")}đ</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground">
                            Không có nguyên liệu
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* === DELETE DIALOG === */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa phiếu nhập #{selectedImport?.id}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteImport}>Xóa</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* === EDIT DIALOG === */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa phiếu nhập</DialogTitle>
            <DialogDescription>Phiếu #{selectedImport?.id}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-1">
                <Label>Lý do nhập</Label>
                <Input
                  placeholder="Nhập hàng định kỳ"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>
              <div className="grid gap-1">
                <Label>Nhà cung cấp *</Label>
                <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn nhà cung cấp" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.supplier && <p className="text-sm text-red-500">{errors.supplier}</p>}
              </div>
              <div className="grid gap-1">
                <Label>Nhân viên</Label>
                <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn nhân viên" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Không chọn</SelectItem>
                    {employees.map((e) => (
                      <SelectItem key={e.id} value={e.id}>{e.user.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Nguyên liệu nhập *</Label>
              {errors.ingredients && <p className="text-sm text-red-500 -mt-2">{errors.ingredients}</p>}
              <div className="border rounded-lg p-4 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-[2fr_1fr_1fr_50px] gap-2 text-sm font-medium">
                  <span>Nguyên liệu</span>
                  <span>Số lượng</span>
                  <span>Thành tiền</span>
                  <span></span>
                </div>
                {selectedIngredients.map((item, index) => {
                  const ingredient = ingredients.find(ing => ing.id === item.ingredient_id)
                  return (
                    <div key={item.id} className="grid grid-cols-1 sm:grid-cols-[2fr_1fr_1fr_50px] gap-2 items-start">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {ingredient?.barcode && (
                            <Badge className="text-xs">
                              {ingredient.barcode}
                            </Badge>
                          )}
                          <Select
                            value={item.ingredient_id || ""}
                            onValueChange={(v) => updateIngredient(index, "ingredient_id", v)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Chọn" />
                            </SelectTrigger>
                            <SelectContent>
                              {ingredients.map((ing) => (
                                <SelectItem key={ing.id} value={ing.id}>{ing.name} ({ing.unit})</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        {ingredient && (
                          <p className="text-xs text-muted-foreground">
                            {ingredient.unit} • Tồn kho: {ingredient.current_stock}
                          </p>
                        )}
                        {ingredientErrors[index]?.ingredient && (
                          <p className="text-sm text-red-500">{ingredientErrors[index].ingredient}</p>
                        )}
                      </div>

                      <div className="space-y-1">
                        <Input
                          type="text"
                          placeholder="Số lượng"
                          value={item.quantity}
                          onChange={(e) => {
                            const val = e.target.value
                            if (/^[\d]*\.?[\d]*$/.test(val) || val === "") {
                              updateIngredient(index, "quantity", e.target.value as any)
                            } else {
                              toast.warn("Vui lòng chỉ nhập số hoặc dấu chấm (.)")
                            }
                          }}
                          className="w-28"
                        />
                        {ingredientErrors[index]?.quantity && (
                          <p className="text-sm text-red-500">{ingredientErrors[index].quantity}</p>
                        )}
                      </div>

                      <div className="space-y-1">
                        <Input
                          type="number"
                          min="1"
                          value={item.total_price || ""}
                          onChange={(e) => updateIngredient(index, "total_price", Number(e.target.value) || 0)}
                        />
                        {ingredientErrors[index]?.total_price && (
                          <p className="text-sm text-red-500">{ingredientErrors[index].total_price}</p>
                        )}
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          const filtered = selectedIngredients.filter((_, i) => i !== index)
                          setSelectedIngredients(filtered)
                          setTotalImportPrice(filtered.reduce((s, i) => s + (i.total_price || 0), 0))
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )
                })}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedIngredients([
                      ...selectedIngredients,
                      { id: uuidv4(), quantity: 0, total_price: 0, ingredient_id: "" }
                    ])
                  }}
                >
                  + Thêm nguyên liệu
                </Button>
              </div>
              <div className="text-right font-bold text-lg">
                Tổng: {totalImportPrice.toLocaleString('vi-VN')}đ
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleUpdateImport}>Cập nhật</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  )
}