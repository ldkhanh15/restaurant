import 'package:flutter/material.dart';
import '../../domain/models/table.dart';
import '../../domain/models/booking.dart';

class BookingDialog extends StatefulWidget {
  final DiningTable table;
  final Function(Booking) onBook;
  final VoidCallback onCancel;
  final Booking? editingBooking;
  final Function(Booking)? onUpdate;

  const BookingDialog({
    super.key,
    required this.table,
    required this.onBook,
    required this.onCancel,
    this.editingBooking,
    this.onUpdate,
  });

  @override
  State<BookingDialog> createState() => _BookingDialogState();
}

class _BookingDialogState extends State<BookingDialog> {
  final _formKey = GlobalKey<FormState>();
  DateTime? _selectedDate;
  String _selectedTime = '';
  int _guests = 1;
  String _notes = '';

  @override
  void initState() {
    super.initState();
    if (widget.editingBooking != null) {
      _selectedDate = widget.editingBooking!.date;
      _selectedTime = widget.editingBooking!.time;
      _guests = widget.editingBooking!.guests;
      _notes = widget.editingBooking!.notes ?? '';
    }
  }

  final List<String> _availableTimes = [
    '11:00',
    '12:00',
    '13:00',
    '18:00',
    '19:00',
    '20:00',
    '21:00',
  ];

  String _formatPrice(double price) {
    return '${price.toStringAsFixed(0).replaceAllMapped(
      RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
      (Match m) => '${m[1]}.',
    )}đ';
  }

  void _handleBook() {
    if (_formKey.currentState!.validate() && _selectedDate != null && _selectedTime.isNotEmpty) {
      final booking = Booking(
        id: widget.editingBooking?.id ?? DateTime.now().millisecondsSinceEpoch.toString(),
        tableId: widget.table.id,
        tableName: widget.table.name,
        date: _selectedDate!,
        time: _selectedTime,
        guests: _guests,
        notes: _notes.isEmpty ? null : _notes,
        status: widget.editingBooking?.status ?? BookingStatus.pending,
        location: widget.table.location,
        price: widget.table.price,
        createdAt: widget.editingBooking?.createdAt ?? DateTime.now(),
      );

      if (widget.editingBooking != null && widget.onUpdate != null) {
        widget.onUpdate!(booking);
      } else {
        widget.onBook(booking);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 10,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: Form(
        key: _formKey,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Row(
              children: [
                Container(
                  width: 50,
                  height: 50,
                  decoration: BoxDecoration(
                    color: Theme.of(context).colorScheme.primary.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(
                    Icons.table_restaurant,
                    color: Theme.of(context).colorScheme.primary,
                    size: 24,
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Đặt ${widget.table.name}',
                        style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Text(
                        widget.table.location,
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: Theme.of(context).colorScheme.onSurfaceVariant,
                        ),
                      ),
                    ],
                  ),
                ),
                IconButton(
                  onPressed: widget.onCancel,
                  icon: const Icon(Icons.close),
                ),
              ],
            ),
            const SizedBox(height: 24),
            
            // Table info
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.surfaceVariant.withOpacity(0.5),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      children: [
                        Icon(
                          Icons.people,
                          color: Theme.of(context).colorScheme.primary,
                        ),
                        const SizedBox(height: 4),
                        Text(
                          '${widget.table.capacity} người',
                          style: Theme.of(context).textTheme.bodySmall,
                        ),
                      ],
                    ),
                  ),
                  Expanded(
                    child: Column(
                      children: [
                        Icon(
                          Icons.attach_money,
                          color: Theme.of(context).colorScheme.primary,
                        ),
                        const SizedBox(height: 4),
                        Text(
                          _formatPrice(widget.table.price),
                          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Date picker
            Text(
              'Chọn ngày',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            InkWell(
              onTap: () async {
                final date = await showDatePicker(
                  context: context,
                  initialDate: DateTime.now(),
                  firstDate: DateTime.now(),
                  lastDate: DateTime.now().add(const Duration(days: 30)),
                );
                if (date != null) {
                  setState(() {
                    _selectedDate = date;
                  });
                }
              },
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  border: Border.all(color: Theme.of(context).colorScheme.outline),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  children: [
                    Icon(
                      Icons.calendar_today,
                      color: Theme.of(context).colorScheme.primary,
                    ),
                    const SizedBox(width: 12),
                    Text(
                      _selectedDate != null
                          ? '${_selectedDate!.day}/${_selectedDate!.month}/${_selectedDate!.year}'
                          : 'Chọn ngày',
                      style: Theme.of(context).textTheme.bodyLarge,
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Time picker
            Text(
              'Chọn giờ',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            DropdownButtonFormField<String>(
              decoration: InputDecoration(
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
                prefixIcon: Icon(
                  Icons.access_time,
                  color: Theme.of(context).colorScheme.primary,
                ),
              ),
              value: _selectedTime.isEmpty ? null : _selectedTime,
              hint: const Text('Chọn giờ'),
              items: _availableTimes.map((time) {
                return DropdownMenuItem(
                  value: time,
                  child: Text(time),
                );
              }).toList(),
              onChanged: (value) {
                setState(() {
                  _selectedTime = value ?? '';
                });
              },
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return 'Vui lòng chọn giờ';
                }
                return null;
              },
            ),
            const SizedBox(height: 16),

            // Guests
            Text(
              'Số người',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                IconButton(
                  onPressed: _guests > 1 ? () => setState(() => _guests--) : null,
                  icon: const Icon(Icons.remove),
                ),
                Container(
                  width: 60,
                  padding: const EdgeInsets.symmetric(vertical: 8),
                  decoration: BoxDecoration(
                    border: Border.all(color: Theme.of(context).colorScheme.outline),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    _guests.toString(),
                    textAlign: TextAlign.center,
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                ),
                IconButton(
                  onPressed: _guests < widget.table.capacity ? () => setState(() => _guests++) : null,
                  icon: const Icon(Icons.add),
                ),
                const SizedBox(width: 8),
                Text(
                  'người (tối đa ${widget.table.capacity})',
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
              ],
            ),
            const SizedBox(height: 16),

            // Notes
            Text(
              'Ghi chú (tùy chọn)',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            TextFormField(
              decoration: InputDecoration(
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
                hintText: 'Nhập ghi chú đặc biệt...',
              ),
              maxLines: 2,
              onChanged: (value) {
                _notes = value;
              },
            ),
            const SizedBox(height: 24),

            // Buttons
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: widget.onCancel,
                    child: const Text('Hủy'),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: ElevatedButton(
                    onPressed: _handleBook,
                    child: const Text('Xác nhận đặt bàn'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
