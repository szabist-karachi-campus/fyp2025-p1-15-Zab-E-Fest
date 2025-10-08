import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';

import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:http/http.dart' as http;

import '../config/api_config.dart';

class ProfileApi {
  static Uri _url(String path) => Uri.parse('${ApiConfig.baseUrl}$path');

  static Map<String, String> _authHeaders(String token) => {
        'Authorization': 'Bearer $token',
      };

  static Future<Map<String, dynamic>> getProfile({required String token}) async {
    final response = await http.get(_url('/api/auth/profile'), headers: _authHeaders(token));
    if (response.statusCode == 200) {
      return json.decode(response.body) as Map<String, dynamic>;
    }
    throw HttpException('Failed to fetch profile: ${response.statusCode} ${response.body}');
  }

  static Future<Map<String, dynamic>> updateProfile({
    required String token,
    String? name,
    String? mobile,
    File? imageFile,
    Uint8List? imageBytes,
    String imageFilename = 'profile.jpg',
  }) async {
    final request = http.MultipartRequest('PUT', _url('/api/auth/profile'))
      ..headers.addAll(_authHeaders(token));

    if (name != null) request.fields['name'] = name;
    if (mobile != null) request.fields['mobile'] = mobile;

    if (imageFile != null && !kIsWeb) {
      request.files.add(await http.MultipartFile.fromPath('profileImage', imageFile.path));
    } else if (imageBytes != null) {
      request.files.add(http.MultipartFile.fromBytes('profileImage', imageBytes, filename: imageFilename));
    }

    final streamed = await request.send();
    final body = await streamed.stream.bytesToString();
    if (streamed.statusCode == 200) {
      return json.decode(body) as Map<String, dynamic>;
    }
    throw HttpException('Failed to update profile: ${streamed.statusCode} $body');
  }
}


