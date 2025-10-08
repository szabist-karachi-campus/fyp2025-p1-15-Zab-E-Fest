import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:logger/logger.dart';
import 'api_config.dart';

final String baseAuthUrl = '${ApiConfig.baseUrl}/api/auth';
final Logger _logger = Logger();

Future<Map<String, dynamic>> requestPasswordReset(String email) async {
  try {
    final response = await http.post(
      Uri.parse('$baseAuthUrl/forgot-password'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'email': email.trim()}),
    );
    _logger.d('Forgot status: ${response.statusCode} body: ${response.body}');
    return {
      'ok': response.statusCode == 200,
      'body': response.body,
      'status': response.statusCode,
    };
  } catch (e) {
    _logger.e('Forgot error: $e');
    rethrow;
  }
}

Future<Map<String, dynamic>> resetPassword({required String token, required String newPassword}) async {
  try {
    final response = await http.post(
      Uri.parse('$baseAuthUrl/reset-password/$token'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'password': newPassword.trim()}),
    );
    _logger.d('Reset status: ${response.statusCode} body: ${response.body}');
    return {
      'ok': response.statusCode == 200,
      'body': response.body,
      'status': response.statusCode,
    };
  } catch (e) {
    _logger.e('Reset error: $e');
    rethrow;
  }
}

Future<Map<String, dynamic>> resetPasswordWithCode(String email, String code, String newPassword) async {
  try {
    final response = await http.post(
      Uri.parse('$baseAuthUrl/reset-password-code'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'email': email.trim(),
        'code': code.trim(),
        'password': newPassword.trim(),
      }),
    );
    _logger.d('Reset with code status: ${response.statusCode} body: ${response.body}');
    return {
      'ok': response.statusCode == 200,
      'body': response.body,
      'status': response.statusCode,
    };
  } catch (e) {
    _logger.e('Reset with code error: $e');
    rethrow;
  }
}
