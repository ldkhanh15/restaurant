import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../domain/models/blog.dart';
import '../../widgets/leading_back_button.dart';

class BlogDetailScreen extends StatelessWidget {
  final Blog? blog;
  final String? id;
  const BlogDetailScreen({super.key, this.blog, this.id});

  @override
  Widget build(BuildContext context) {
    final b = blog;
    return Scaffold(
      appBar: AppBar(
        leading: const LeadingBackButton(),
        title: Text(b?.title ?? 'Bài viết'),
      ),
      body: b == null
          ? const Center(child: Text('Không tìm thấy bài viết'))
          : SingleChildScrollView(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (b.imageUrl.isNotEmpty)
                    Hero(
                      tag: 'blog-image-${b.id}',
                      child: Image.network(
                        b.imageUrl,
                        width: double.infinity,
                        height: 220,
                        fit: BoxFit.cover,
                        errorBuilder: (_, __, ___) => Container(height: 220, color: Colors.grey.shade200, child: const Icon(Icons.photo, size: 56)),
                      ),
                    ),
                  Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(b.title, style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w700)),
                        const SizedBox(height: 8),
                        Text(
                          b.publishedAt != null ? '${b.publishedAt!.day}/${b.publishedAt!.month}/${b.publishedAt!.year}' : '',
                          style: Theme.of(context).textTheme.bodySmall?.copyWith(color: Colors.grey.shade600),
                        ),
                        const SizedBox(height: 12),
                        Text(b.summary, style: Theme.of(context).textTheme.bodyLarge),
                        const SizedBox(height: 20),
                        if (b.url != null && b.url!.isNotEmpty)
                          Row(
                            children: [
                              ElevatedButton.icon(
                                onPressed: () async {
                                  final uri = Uri.tryParse(b.url!);
                                  if (uri != null && await canLaunchUrl(uri)) {
                                    await launchUrl(uri, mode: LaunchMode.externalApplication);
                                  }
                                },
                                icon: const Icon(Icons.open_in_browser),
                                label: const Text('Mở trên web'),
                              ),
                              const SizedBox(width: 12),
                            ],
                          ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
    );
  }
}
