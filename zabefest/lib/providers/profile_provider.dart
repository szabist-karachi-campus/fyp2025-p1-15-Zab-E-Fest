import 'package:flutter/foundation.dart';
import 'package:dio/dio.dart';
import 'dart:io';
import '../models/user_model.dart';
import '../services/api_service.dart';

class ProfileProvider extends ChangeNotifier {
  final ApiService _apiService;
  UserModel? _currentUser;
  bool _isLoading = false;

  ProfileProvider(this._apiService);

  UserModel? get user => _currentUser;
  bool get isLoading => _isLoading;

  Future<UserModel> getCurrentUser() async {
    if (_currentUser != null) return _currentUser!;

    try {
      _isLoading = true;
      notifyListeners();

      final response = await _apiService.get('/auth/profile');
      final userJson = _extractUserJson(response.data);
      _currentUser = UserModel.fromJson(userJson);
      
      return _currentUser!;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> updateProfile(
    Map<String, dynamic> updateData, {
    File? imageFile,
    String? userId,
  }) async {
    try {
      _isLoading = true;
      notifyListeners();

      FormData formData = FormData.fromMap(updateData);
      
      if (imageFile != null) {
        formData.files.add(
          MapEntry(
            'profileImage',
            await MultipartFile.fromFile(
              imageFile.path,
              filename: 'profile_image.jpg',
            ),
          ),
        );
      }

      final String path = userId != null ? '/auth/profile/$userId' : '/auth/profile';
      final response = await _apiService.put(path, data: formData);

      final userJson = _extractUserJson(response.data);
      _currentUser = UserModel.fromJson(userJson);
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> changePassword(String currentPassword, String newPassword) async {
    try {
      _isLoading = true;
      notifyListeners();

      await _apiService.put(
        '/auth/change-password',
        data: {
          'currentPassword': currentPassword,
          'newPassword': newPassword,
        },
      );
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // Safely extract a user JSON map from various API response shapes
  Map<String, dynamic> _extractUserJson(dynamic data) {
    if (data is Map<String, dynamic>) {
      if (data['user'] is Map<String, dynamic>) {
        return data['user'] as Map<String, dynamic>;
      }
      return data; // assume already the user object
    }
    if (data is List && data.isNotEmpty && data.first is Map<String, dynamic>) {
      return data.first as Map<String, dynamic>;
    }
    throw Exception('Invalid profile response shape');
  }
}
