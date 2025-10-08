import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

import 'api_config.dart';

final String baseUrl = ApiConfig.baseUrl;

// Fetch all modules
Future<List<dynamic>> fetchAllModules() async {
  try {
    final response = await http.get(
      Uri.parse('$baseUrl/api/events'),
    ).timeout(
      const Duration(seconds: 30),
      onTimeout: () => throw Exception('Connection timeout. Please check your internet connection.'),
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed to load modules: ${response.statusCode} - ${response.body}');
    }
  } catch (e) {
    print('Error fetching modules: $e');
    rethrow;
  }
}

// Apply for a module
Future<Map<String, dynamic>> applyForModule(String moduleId) async {
  final prefs = await SharedPreferences.getInstance();
  final token = prefs.getString('token');

  final response = await http.post(
    Uri.parse('$baseUrl/api/participants/apply'),
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer $token',
    },
    body: jsonEncode({'moduleId': moduleId}),
  );

  // Handle non-JSON or error responses
  if (response.statusCode == 200) {
    try {
      return jsonDecode(response.body);
    } catch (e) {
      throw Exception('Invalid JSON response from server');
    }
  } else {
    throw Exception('Server returned error: ${response.statusCode}\n${response.body}');
  }
}

