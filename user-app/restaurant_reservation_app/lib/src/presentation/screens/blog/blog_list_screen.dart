import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../application/providers.dart';
import '../../../domain/models/blog.dart';

class BlogListScreen extends ConsumerWidget {
  const BlogListScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final blogsAsync = ref.watch(blogsProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Bài viết')),
      body: blogsAsync.when(
        data: (blogs) {
          if (blogs.isEmpty) return const Center(child: Text('Chưa có bài viết'));
          return ListView.separated(
            padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 12),
            itemCount: blogs.length,
            separatorBuilder: (_, __) => const SizedBox(height: 12),
            itemBuilder: (context, index) {
              final b = blogs[index];
              return Card(
                elevation: 2,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                clipBehavior: Clip.hardEdge,
                child: InkWell(
                  onTap: () => context.push('/blog/${b.id}', extra: b),
                  child: SizedBox(
                    height: 110,
                    child: Row(
                      children: [
                        // Image
                        Hero(
                          tag: 'blog-image-${b.id}',
                          child: b.imageUrl.isNotEmpty
                              ? Image.network(
                                  b.imageUrl,
                                  width: 140,
                                  height: double.infinity,
                                  fit: BoxFit.cover,
                                  errorBuilder: (_, __, ___) => Container(color: Colors.grey.shade200, width: 140, child: const Icon(Icons.photo, size: 40)),
                                )
                              : Container(color: Colors.grey.shade200, width: 140, height: double.infinity, child: const Icon(Icons.photo, size: 40)),
                        ),
                        // Text
                        Expanded(
                          child: Padding(
                            padding: const EdgeInsets.all(12.0),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Text(
                                  b.title,
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis,
                                  style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600),
                                ),
                                const SizedBox(height: 6),
                                Text(
                                  b.summary,
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis,
                                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: Colors.grey.shade700),
                                ),
                                const SizedBox(height: 8),
                                Align(
                                  alignment: Alignment.bottomLeft,
                                  child: Text(
                                    b.publishedAt != null ? '${b.publishedAt!.day}/${b.publishedAt!.month}/${b.publishedAt!.year}' : '',
                                    style: Theme.of(context).textTheme.bodySmall?.copyWith(color: Colors.grey.shade600),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                        const Padding(
                          padding: EdgeInsets.only(right: 8.0),
                          child: Icon(Icons.chevron_right, color: Colors.grey),
                        )
                      ],
                    ),
                  ),
                ),
              );
            },
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (_, __) => Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text('Không thể tải bài viết'),
              const SizedBox(height: 8),
              ElevatedButton(onPressed: () => ref.invalidate(blogsProvider), child: const Text('Thử lại')),
            ],
          ),
        ),
      ),
    );
  }
}
