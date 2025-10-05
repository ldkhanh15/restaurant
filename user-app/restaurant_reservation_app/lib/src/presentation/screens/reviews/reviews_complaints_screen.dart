import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../application/providers.dart';
import '../../../domain/models/review.dart';

class ReviewsComplaintsScreen extends ConsumerStatefulWidget {
  const ReviewsComplaintsScreen({super.key});

  @override
  ConsumerState<ReviewsComplaintsScreen> createState() => _ReviewsComplaintsScreenState();
}

class _ReviewsComplaintsScreenState extends ConsumerState<ReviewsComplaintsScreen> {
  ReviewType? filterType;
  String sortBy = 'newest';
  
  @override
  Widget build(BuildContext context) {
    final reviews = ref.watch(reviewsProvider);
    
    // Filter and sort reviews
    var filteredReviews = reviews.where((review) {
      if (filterType == null) return true;
      return review.type == filterType;
    }).toList();
    
    filteredReviews.sort((a, b) {
      switch (sortBy) {
        case 'newest':
          return b.createdAt.compareTo(a.createdAt);
        case 'oldest':
          return a.createdAt.compareTo(b.createdAt);
        case 'rating':
          return b.rating.compareTo(a.rating);
        default:
          return 0;
      }
    });

    return Scaffold(
      appBar: AppBar(
        title: const Text('Đánh giá & Phản hồi'),
        actions: [
          IconButton(
            onPressed: () => _showWriteReviewDialog(),
            icon: const Icon(Icons.add),
          ),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
          // Filters
          Container(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                // Filter buttons
                Row(
                  children: [
                    Expanded(
                      child: Wrap(
                        spacing: 8,
                        children: [
                          FilterChip(
                            label: const Text('Tất cả'),
                            selected: filterType == null,
                            onSelected: (selected) {
                              setState(() {
                                filterType = selected ? null : filterType;
                              });
                            },
                          ),
                          FilterChip(
                            label: const Text('Đánh giá'),
                            selected: filterType == ReviewType.review,
                            onSelected: (selected) {
                              setState(() {
                                filterType = selected ? ReviewType.review : null;
                              });
                            },
                          ),
                          FilterChip(
                            label: const Text('Khiếu nại'),
                            selected: filterType == ReviewType.complaint,
                            onSelected: (selected) {
                              setState(() {
                                filterType = selected ? ReviewType.complaint : null;
                              });
                            },
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                // Sort dropdown
                Row(
                  children: [
                    const Text('Sắp xếp: '),
                    DropdownButton<String>(
                      value: sortBy,
                      items: const [
                        DropdownMenuItem(value: 'newest', child: Text('Mới nhất')),
                        DropdownMenuItem(value: 'oldest', child: Text('Cũ nhất')),
                        DropdownMenuItem(value: 'rating', child: Text('Điểm cao')),
                      ],
                      onChanged: (value) {
                        if (value != null) {
                          setState(() {
                            sortBy = value;
                          });
                        }
                      },
                    ),
                  ],
                ),
              ],
            ),
          ),
          const Divider(height: 1),
          // Reviews list
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: filteredReviews.length,
              itemBuilder: (context, index) {
                final review = filteredReviews[index];
                return _buildReviewCard(review);
              },
            ),
          ),
          ],
        ),
      ),
    );
  }

  Widget _buildReviewCard(Review review) {
    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Row(
              children: [
                CircleAvatar(
                  backgroundImage: review.customerAvatar != null 
                    ? NetworkImage(review.customerAvatar!)
                    : null,
                  child: review.customerAvatar == null 
                    ? Text(review.customerName[0])
                    : null,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Text(
                            review.customerName,
                            style: Theme.of(context).textTheme.titleSmall,
                          ),
                          const SizedBox(width: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                            decoration: BoxDecoration(
                              color: review.type == ReviewType.complaint 
                                ? Colors.red.withOpacity(0.1)
                                : Colors.blue.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(
                                  review.type == ReviewType.complaint 
                                    ? Icons.warning_amber_rounded
                                    : Icons.chat_bubble_outline,
                                  size: 12,
                                  color: review.type == ReviewType.complaint 
                                    ? Colors.red
                                    : Colors.blue,
                                ),
                                const SizedBox(width: 4),
                                Text(
                                  review.type == ReviewType.complaint ? 'Khiếu nại' : 'Đánh giá',
                                  style: TextStyle(
                                    fontSize: 10,
                                    color: review.type == ReviewType.complaint 
                                      ? Colors.red
                                      : Colors.blue,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      Row(
                        children: [
                          // Stars
                          Row(
                            children: List.generate(5, (index) {
                              return Icon(
                                index < review.rating ? Icons.star : Icons.star_border,
                                size: 16,
                                color: Colors.amber,
                              );
                            }),
                          ),
                          const SizedBox(width: 8),
                          Text(
                            '${review.createdAt.day}/${review.createdAt.month}/${review.createdAt.year}',
                            style: Theme.of(context).textTheme.bodySmall,
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            // Content
            Text(review.content),
            
            // Restaurant response
            if (review.restaurantResponse != null) ...[
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Theme.of(context).colorScheme.surfaceVariant,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Phản hồi từ nhà hàng:',
                      style: Theme.of(context).textTheme.titleSmall?.copyWith(
                        color: Theme.of(context).colorScheme.primary,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(review.restaurantResponse!),
                  ],
                ),
              ),
            ],
            
            const SizedBox(height: 12),
            // Actions
            Row(
              children: [
                TextButton.icon(
                  onPressed: () => _markHelpful(review.id),
                  icon: const Icon(Icons.thumb_up_outlined, size: 16),
                  label: Text('Hữu ích (${review.helpfulCount})'),
                ),
                TextButton.icon(
                  onPressed: () {},
                  icon: const Icon(Icons.thumb_down_outlined, size: 16),
                  label: const Text('Không hữu ích'),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  void _markHelpful(String reviewId) {
    ref.read(reviewsProvider.notifier).markHelpful(reviewId);
  }

  void _showWriteReviewDialog() {
    showDialog(
      context: context,
      builder: (context) => const WriteReviewDialog(),
    );
  }
}

class WriteReviewDialog extends ConsumerStatefulWidget {
  const WriteReviewDialog({super.key});

  @override
  ConsumerState<WriteReviewDialog> createState() => _WriteReviewDialogState();
}

class _WriteReviewDialogState extends ConsumerState<WriteReviewDialog> {
  final _contentController = TextEditingController();
  ReviewType _type = ReviewType.review;
  int _rating = 5;

  @override
  void dispose() {
    _contentController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Viết đánh giá mới'),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Type selection
            const Text('Loại phản hồi:'),
            const SizedBox(height: 8),
            SegmentedButton<ReviewType>(
              segments: const [
                ButtonSegment(
                  value: ReviewType.review,
                  label: Text('Đánh giá'),
                  icon: Icon(Icons.star_outline),
                ),
                ButtonSegment(
                  value: ReviewType.complaint,
                  label: Text('Khiếu nại'),
                  icon: Icon(Icons.warning_amber_outlined),
                ),
              ],
              selected: {_type},
              onSelectionChanged: (Set<ReviewType> selection) {
                setState(() {
                  _type = selection.first;
                });
              },
            ),
            const SizedBox(height: 16),
            
            // Rating
            const Text('Đánh giá sao:'),
            const SizedBox(height: 8),
            Row(
              children: List.generate(5, (index) {
                return IconButton(
                  onPressed: () {
                    setState(() {
                      _rating = index + 1;
                    });
                  },
                  icon: Icon(
                    index < _rating ? Icons.star : Icons.star_border,
                    color: Colors.amber,
                  ),
                );
              }),
            ),
            const SizedBox(height: 16),
            
            // Content
            const Text('Nội dung:'),
            const SizedBox(height: 8),
            TextField(
              controller: _contentController,
              maxLines: 4,
              decoration: const InputDecoration(
                hintText: 'Chia sẻ trải nghiệm của bạn...',
                border: OutlineInputBorder(),
              ),
            ),
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text('Hủy'),
        ),
        ElevatedButton(
          onPressed: _submitReview,
          child: const Text('Gửi đánh giá'),
        ),
      ],
    );
  }

  void _submitReview() {
    if (_contentController.text.trim().isEmpty) return;

    final review = Review(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      customerId: 'current_user',
      customerName: 'Bạn',
      rating: _rating,
      content: _contentController.text.trim(),
      type: _type,
      status: ReviewStatus.pending,
      createdAt: DateTime.now(),
    );

    ref.read(reviewsProvider.notifier).addReview(review);
    Navigator.pop(context);

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Đánh giá của bạn đã được gửi và đang chờ duyệt'),
      ),
    );
  }
}

