import 'dart:convert';
import '../../data/datasources/api_config.dart';

// Clean, tolerant Blog model used by the app UI.
class Blog {
  final String id;
  final String title;
  final String summary;
  final String imageUrl;
  final DateTime? publishedAt;
  final String? url;

  Blog({
    required this.id,
    required this.title,
    required this.summary,
    required this.imageUrl,
    this.publishedAt,
    this.url,
  });

  factory Blog.fromJson(Map<String, dynamic> json) {
    final id = _stringify(json['id']);
    final title = _stringify(_firstNonNull(json, ['title', 'name', 'headline']));
    final summary = _stringify(_firstNonNull(json, ['summary', 'excerpt', 'content', 'description']));
    final imageUrl = _extractImageUrl(json);
    final publishedAt = _parseDate(_firstNonNull(json, ['publishedAt', 'published_at', 'created_at', 'createdAt']));
    final url = _stringifyOrNull(_firstNonNull(json, ['url', 'link'])) ??
        (_stringify(json['slug']).isNotEmpty ? _stringify(json['slug']) : null);

    return Blog(
      id: id,
      title: title,
      summary: summary,
      imageUrl: imageUrl,
      publishedAt: publishedAt,
      url: url,
    );
  }

  static String _stringify(dynamic v) => v == null ? '' : v.toString();
  static String? _stringifyOrNull(dynamic v) => v == null ? null : v.toString();

  static dynamic _firstNonNull(Map<String, dynamic> json, List<String> keys) {
    for (var k in keys) {
      if (json.containsKey(k) && json[k] != null) return json[k];
    }
    return null;
  }

  static DateTime? _parseDate(dynamic v) {
    if (v == null) return null;
    return DateTime.tryParse(v.toString());
  }

  static String _extractImageUrl(Map<String, dynamic> json) {
    final candidates = [
      'cover_image_url',
      'coverImage',
      'coverImageUrl',
      'thumbnail_url',
      'thumbnailUrl',
      'image',
      'imageUrl',
      'img',
      'picture'
    ];

    for (var k in candidates) {
      if (json.containsKey(k) && json[k] != null && json[k].toString().isNotEmpty) {
        return _normalizeUrl(json[k].toString());
      }
    }

    final images = json['images'] ?? json['image_urls'] ?? json['imageUrls'];
    if (images is List && images.isNotEmpty) return _normalizeUrl(images.first.toString());
    if (images is String && images.isNotEmpty) {
      try {
        final parsed = jsonDecode(images);
        if (parsed is List && parsed.isNotEmpty) return _normalizeUrl(parsed.first.toString());
      } catch (_) {
        return _normalizeUrl(images);
      }
    }

    return '';
  }

  static String _normalizeUrl(String raw) {
    raw = raw.trim();
    if (raw.isEmpty) return '';

    // If already absolute http/https, return as-is
    if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;

    // Protocol-relative //example.com/path
    if (raw.startsWith('//')) return 'https:$raw';

    // file:// URIs or bare filenames -> convert to server URL if ApiConfig.baseUrl is set
    if (raw.startsWith('file://')) {
      raw = raw.replaceFirst('file://', '');
    }

    // If raw is an absolute path starting with '/', append to baseUrl
    if (raw.startsWith('/')) {
      if (ApiConfig.baseUrl.isNotEmpty) return ApiConfig.baseUrl.replaceFirst(RegExp(r'\/$'), '') + raw;
      return raw;
    }

    // If contains a scheme but not http/https (e.g., content://) just return raw
    if (raw.contains('://')) return raw;

    // Otherwise treat as relative path and join with baseUrl
    if (ApiConfig.baseUrl.isNotEmpty) {
      final base = ApiConfig.baseUrl.replaceFirst(RegExp(r'\/$'), '');
      return '$base/${raw.startsWith('/') ? raw.substring(1) : raw}';
    }

    return raw;
  }
}

