import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../application/providers.dart';
import '../../../domain/models/review.dart';

class ReviewsComplaintsScreen extends ConsumerStatefulWidget {
  const ReviewsComplaintsScreen({super.key});

  @override
  ConsumerState<ReviewsComplaintsScreen> createState() =>
      _ReviewsComplaintsScreenState();
}

class _ReviewsComplaintsScreenState
    extends ConsumerState<ReviewsComplaintsScreen> {
  String sortBy = 'newest';
  bool _isLoading = false;

  @override
  Widget build(BuildContext context) {
    final reviews = ref.watch(reviewsProvider);

    // show loading indicator when fetching
    if (_isLoading && reviews.isEmpty) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    // Sort reviews
    final sortedReviews = [...reviews];
    sortedReviews.sort((a, b) {
      switch (sortBy) {
        case 'newest':
          return (b.createdAt ?? DateTime(0))
              .compareTo(a.createdAt ?? DateTime(0));
        case 'oldest':
          return (a.createdAt ?? DateTime(0))
              .compareTo(b.createdAt ?? DateTime(0));
        case 'rating':
          return b.rating.compareTo(a.rating);
        default:
          return 0;
      }
    });

    return Scaffold(
      appBar: AppBar(
        title: const Text('Đánh giá của khách hàng'),
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
            // Sort dropdown
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  const Text('Sắp xếp: '),
                  DropdownButton<String>(
                    value: sortBy,
                    items: const [
                      DropdownMenuItem(value: 'newest', child: Text('Mới nhất')),
                      DropdownMenuItem(value: 'oldest', child: Text('Cũ nhất')),
                      DropdownMenuItem(
                          value: 'rating', child: Text('Điểm cao')),
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
            ),
            const Divider(height: 1),
            // Reviews list
            Expanded(
              child: ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: sortedReviews.length,
                itemBuilder: (context, index) {
                  final review = sortedReviews[index];
                  return _buildReviewCard(review);
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  void initState() {
    super.initState();
    // load reviews from server on first build
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadReviews();
    });
  }

  Future<void> _loadReviews() async {
    setState(() {
      _isLoading = true;
    });
    try {
      final list = await ref.read(reviewRepositoryProvider).getReviews();
      ref.read(reviewsProvider.notifier).setReviews(list);
    } catch (e) {
      // show a non-blocking error
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Không tải được đánh giá: ${e.toString()}')),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  Widget _buildReviewCard(Review review) {
    final userName = review.user?.name ?? 'Anonymous';
    final userAvatar = review.user?.avatar;

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
                  backgroundImage: userAvatar != null ? NetworkImage(userAvatar) : null,
                  child: userAvatar == null ? Text(userName[0]) : null,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        userName,
                        style: Theme.of(context).textTheme.titleSmall,
                      ),
                      Row(
                        children: [
                          // Stars
                          Row(
                            children: List.generate(5, (index) {
                              return Icon(
                                index < review.rating
                                    ? Icons.star
                                    : Icons.star_border,
                                size: 16,
                                color: Colors.amber,
                              );
                            }),
                          ),
                          const SizedBox(width: 8),
                          if (review.createdAt != null)
                            Text(
                              '${review.createdAt!.day}/${review.createdAt!.month}/${review.createdAt!.year}',
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
            if (review.comment != null && review.comment!.isNotEmpty)
              Text(review.comment!),
          ],
        ),
      ),
    );
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
  final _commentController = TextEditingController();
  int _rating = 5;
  bool _isSubmitting = false;

  @override
  void dispose() {
    _commentController.dispose();
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
            const Text('Bình luận:'),
            const SizedBox(height: 8),
            TextField(
              controller: _commentController,
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
          onPressed: _isSubmitting ? null : _submitReview,
          child: _isSubmitting
              ? const SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(strokeWidth: 2),
                )
              : const Text('Gửi đánh giá'),
        ),
      ],
    );
  }

  void _submitReview() async {
    if (_commentController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Vui lòng nhập bình luận của bạn.'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    setState(() {
      _isSubmitting = true;
    });

    try {
      final payload = {
        'rating': _rating,
        'comment': _commentController.text.trim(),
        // optionally: 'type': 'review'
      };

      final createdReview = await ref.read(reviewRepositoryProvider).createReview(payload);

      // Add server returned review to provider
      ref.read(reviewsProvider.notifier).addReview(createdReview);

      Navigator.pop(context);

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Cảm ơn bạn! Đánh giá của bạn đã được gửi và đang chờ duyệt.'),
        ),
      );
    } catch (e) {
      // Show error (attempt to use message if present)
      final message = e is Exception ? e.toString() : 'Gửi đánh giá thất bại';
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Lỗi: $message'),
          backgroundColor: Colors.red,
        ),
      );
    } finally {
      if (mounted) {
        setState(() {
          _isSubmitting = false;
        });
      }
    }
  }
}
