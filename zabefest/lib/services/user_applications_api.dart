import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:logger/logger.dart';
import 'api_config.dart';

final logger = Logger();
final String baseUrl = ApiConfig.baseUrl;

/// Fetch all applications submitted by the current user
Future<List<Map<String, dynamic>>> fetchUserApplications() async {
  final prefs = await SharedPreferences.getInstance();
  final token = prefs.getString('token');
  
  if (token == null) {
    logger.w('No token available, user might not be logged in');
    return [];
  }

  try {
    logger.d('Fetching user applications with token: $token');
    
    final response = await http.get(
      Uri.parse('$baseUrl/api/apply-module/user-applications'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
    );
    
    logger.d('API Response status: ${response.statusCode}');
    logger.d('API Response body: ${response.body}');

    if (response.statusCode == 200) {
      final List<dynamic> data = jsonDecode(response.body);
      return data.map((item) => item as Map<String, dynamic>).toList();
    } else {
      logger.e('Error fetching user applications: ${response.body}');
      return [];
    }
  } catch (e) {
    logger.e('Exception while fetching user applications: $e');
    return [];
  }
}

/// Helper method to determine payment status text and color
Map<String, dynamic> getPaymentStatus(String status) {
  switch (status.toLowerCase()) {
    case 'accepted':
      return {
        'text': 'Paid',
        'color': const Color(0xFF4CAF50), // Green
        'icon': Icons.check_circle,
      };
    case 'pending':
      return {
        'text': 'Pending',
        'color': const Color(0xFFFFA726), // Orange
        'icon': Icons.pending_actions,
      };
    case 'rejected':
      return {
        'text': 'Failed',
        'color': const Color(0xFFF44336), // Red
        'icon': Icons.cancel,
      };
    default:
      return {
        'text': 'Unknown',
        'color': const Color(0xFF9E9E9E), // Gray
        'icon': Icons.help_outline,
      };
  }
}
