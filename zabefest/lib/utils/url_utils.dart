import '../config/api_config.dart';

String resolveImageUrl(String? path) {
  if (path == null || path.isEmpty) {
    print('DEBUG: Empty image path');
    return '';
  }
  final trimmed = path.trim();
  print('DEBUG: Original image path: $trimmed');

  // If it's an absolute URL, rewrite localhost-like hosts to the current base URL
  final parsed = Uri.tryParse(trimmed);
  if (parsed != null && parsed.hasScheme && parsed.host.isNotEmpty) {
    final host = parsed.host.toLowerCase();
    if (host == 'localhost' || host == '127.0.0.1' || host == '0.0.0.0') {
      final base = Uri.parse(ApiConfig.baseUrl);
      final rebuilt = Uri(
        scheme: base.scheme,
        host: base.host,
        port: base.hasPort ? base.port : null,
        path: parsed.path,
        query: parsed.query.isEmpty ? null : parsed.query,
      );
      final result = rebuilt.toString();
      print('DEBUG: Resolved localhost URL: $trimmed -> $result');
      return result;
    }
    print('DEBUG: Using original absolute URL: $trimmed');
    return trimmed;
  }

  // Relative path -> prefix with base URL
  String result;
  if (trimmed.startsWith('/')) {
    result = '${ApiConfig.baseUrl}$trimmed';
  } else {
    result = '${ApiConfig.baseUrl}/$trimmed';
  }
  print('DEBUG: Resolved relative path: $trimmed -> $result');
  return result;
}


