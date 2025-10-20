import '../datasources/remote/remote_app_user_data_source.dart';
import '../../domain/models/blog.dart';

class BlogAppUserService {
  final RemoteAppUserDataSource _ds;

  BlogAppUserService(String baseUrl) : _ds = RemoteAppUserDataSource(baseUrl);

  /// GET /api/app_user/blog
  Future<List<Blog>> fetchBlogs() async {
    final res = await _ds.getBlogs_app_user();
    if (res.isEmpty) return [];
    try {
      return res.map((e) => Blog.fromJson(e as Map<String, dynamic>)).toList();
    } catch (_) {
      return [];
    }
  }
}
