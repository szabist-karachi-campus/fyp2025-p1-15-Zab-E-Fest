import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'api_config.dart';

class ApiService {
  late final Dio _dio;
  final FlutterSecureStorage _storage;
  static final String baseUrl = '${ApiConfig.baseUrl}/api';

  ApiService({FlutterSecureStorage? storage})
      : _storage = storage ?? const FlutterSecureStorage() {
    _dio = Dio(
      BaseOptions(
        baseUrl: baseUrl,
        headers: {'Content-Type': 'application/json'},
      ),
    );

    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await _storage.read(key: 'auth_token');
          if (token != null) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          return handler.next(options);
        },
        onError: (DioException error, handler) async {
          if (error.response?.statusCode == 401) {
            // Handle token expiration
            await _storage.delete(key: 'auth_token');
            // You might want to navigate to login screen here
          }
          return handler.next(error);
        },
      ),
    );
  }

  Future<Response> get(String path, {Map<String, dynamic>? queryParameters}) async {
    try {
      return await _dio.get(path, queryParameters: queryParameters);
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<Response> post(String path, {dynamic data}) async {
    try {
      return await _dio.post(path, data: data);
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<Response> put(String path, {dynamic data}) async {
    try {
      // If sending FormData, let Dio set proper multipart headers
      if (data is FormData) {
        return await _dio.put(path, data: data, options: Options(headers: {'Content-Type': 'multipart/form-data'}));
      }
      return await _dio.put(path, data: data);
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<Response> delete(String path) async {
    try {
      return await _dio.delete(path);
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Exception _handleError(DioException error) {
    if (error.type == DioExceptionType.connectionTimeout ||
        error.type == DioExceptionType.receiveTimeout ||
        error.type == DioExceptionType.sendTimeout) {
      return Exception('Connection timeout. Please check your internet connection.');
    }

    if (error.response != null) {
      final res = error.response!;
      final data = res.data;
      // Robustly extract error message from various response shapes
      if (data is Map<String, dynamic>) {
        final msg = data['message'] ?? data['error'] ?? data['msg'] ?? res.statusMessage ?? 'An error occurred';
        return Exception(msg.toString());
      }
      if (data is String) {
        return Exception(data);
      }
      if (data is List) {
        if (data.isNotEmpty) {
          final first = data.first;
          if (first is Map && first['message'] != null) {
            return Exception(first['message'].toString());
          }
          return Exception(first.toString());
        }
      }
      return Exception(res.statusMessage ?? 'Request failed with status ${res.statusCode}');
    }

    return Exception('An unexpected error occurred');
  }
}
