import '../services/user_app_user_service.dart';
import '../../domain/models/user.dart';

abstract class IUserRepository {
  Future<AppUser> getUserProfile();
  Future<AppUser> updateUserProfile(Map<String, dynamic> payload);
}

class UserRepository implements IUserRepository {
  @override
  Future<AppUser> getUserProfile() async {
    final rawData = await UserAppUserService.fetchUserProfile();
    return AppUser.fromJson(rawData as Map<String, dynamic>);
  }

  @override
  Future<AppUser> updateUserProfile(Map<String, dynamic> payload) async {
    final rawData = await UserAppUserService.updateUserProfile(payload);
    return AppUser.fromJson(rawData as Map<String, dynamic>);
  }
}