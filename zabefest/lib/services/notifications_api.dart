import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:logger/logger.dart';
import 'api_config.dart';

final logger = Logger();
final String baseUrl = ApiConfig.baseUrl;

/// Fetch all notifications for the current user
Future<List<Map<String, dynamic>>> fetchNotifications() async {
  final prefs = await SharedPreferences.getInstance();
  final token = prefs.getString('token');
  
  if (token == null) {
    logger.w('No authentication token found');
    return [];
  }

  try {
    final response = await http.get(
      Uri.parse('$baseUrl/api/notifications/participant'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
    );

    if (response.statusCode == 200) {
      try {
        final data = jsonDecode(response.body);
        logger.d('Received notification data: ${data.toString()}');

        if (data == null || !data.containsKey('notifications')) {
          logger.e('Invalid response format - missing notifications array');
          return [];
        }

        final List<dynamic> notifications = data['notifications'] ?? [];
        final transformedNotifications = <Map<String, dynamic>>[];
        
        for (final notification in notifications) {
          try {
            if (notification == null) {
              logger.w('Received null notification object');
              continue;
            }

            final Map<String, dynamic> sender = 
              notification['sender'] is Map ? notification['sender'] as Map<String, dynamic> : {};
            
            transformedNotifications.add({
              'id': notification['_id']?.toString() ?? '',
              'title': notification['title']?.toString() ?? 'Notification',
              'message': notification['message']?.toString() ?? '',
              'type': notification['type']?.toString() ?? 'announcement',
              'priority': notification['priority']?.toString() ?? 'medium',
              'isRead': notification['isRead'] == true,
              'timestamp': notification['date']?.toString() ?? DateTime.now().toIso8601String(),
              'adminName': sender['name']?.toString() ?? 'Admin',
              'adminRole': sender['role']?.toString() ?? 'Staff',
              'module': notification['module']?.toString() ?? '',
              'actionUrl': notification['actionUrl']?.toString() ?? '',
              'image': notification['image']?.toString() ?? '',
            });
          } catch (error) {
            logger.e('Error transforming notification: ${error.toString()}');
            continue;
          }
        }
        
        return transformedNotifications;
      } catch (error) {
        logger.e('Error parsing notification response: ${error.toString()}');
        return [];
      }
    }
    
    logger.e('Failed to fetch notifications: ${response.statusCode} - ${response.body}');
    return [];
  } catch (error) {
    logger.e('Error fetching notifications: ${error.toString()}');
    return [];
  }
}

/// Mark a notification as read
Future<bool> markNotificationAsRead(String notificationId) async {
  final prefs = await SharedPreferences.getInstance();
  final token = prefs.getString('token');
  
  if (token == null) {
    logger.w('No authentication token found');
    return false;
  }

  try {
    final response = await http.put(
      Uri.parse('$baseUrl/api/notifications/participant/$notificationId/read'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
    );

    return response.statusCode == 200;
  } catch (error) {
    logger.e('Error marking notification as read: ${error.toString()}');
    return false;
  }
}

/// Mark all notifications as read
Future<bool> markAllNotificationsAsRead() async {
  final prefs = await SharedPreferences.getInstance();
  final token = prefs.getString('token');
  
  if (token == null) {
    logger.w('No authentication token found');
    return false;
  }

  try {
    final response = await http.put(
      Uri.parse('$baseUrl/api/notifications/participant/mark-all-read'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
    );

    return response.statusCode == 200;
  } catch (error) {
    logger.e('Error marking all notifications as read: ${error.toString()}');
    return false;
  }
}

/// Get unread notification count
Future<int> getUnreadNotificationCount() async {
  final prefs = await SharedPreferences.getInstance();
  final token = prefs.getString('token');
  
  if (token == null) {
    logger.w('No authentication token found');
    return 0;
  }

  try {
    final response = await http.get(
      Uri.parse('$baseUrl/api/notifications/participant/unread-count'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return data['count'] ?? 0;
    }
    
    logger.e('Failed to fetch unread count: ${response.statusCode}');
    return 0;
  } catch (error) {
    logger.e('Error fetching unread count: ${error.toString()}');
    return 0;
  }
}