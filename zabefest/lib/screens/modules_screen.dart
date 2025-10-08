// 📁 File: modules_screen.dart
import 'package:flutter/material.dart';
import '/services/module_api.dart';
import 'module_detail.dart';
import '../utils/url_utils.dart';

class ModulesScreen extends StatefulWidget {
  const ModulesScreen({super.key});

  @override
  State<ModulesScreen> createState() => _ModulesScreenState();
}

class _ModulesScreenState extends State<ModulesScreen> with SingleTickerProviderStateMixin {
  List<Map<String, dynamic>> allModules = [];
  List<Map<String, dynamic>> filteredModules = [];
  TextEditingController searchController = TextEditingController();
  bool isLoading = true;

  late AnimationController _animationController;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 600),
    );
    _loadModules();
  }

  Future<void> _loadModules() async {
    try {
      print('DEBUG: Starting to load modules...');
      final List<dynamic> modulesRaw = await fetchAllModules();
      final List<Map<String, dynamic>> modules = modulesRaw.cast<Map<String, dynamic>>();

      print('DEBUG: Loaded ${modules.length} modules');
      
      // Debug: Print first module to see image field
      if (modules.isNotEmpty) {
        print('DEBUG: First module data: ${modules.first}');
        print('DEBUG: Image field: ${modules.first['image']}');
      }

      // Check if widget is still mounted before calling setState
      if (mounted) {
        setState(() {
          allModules = modules;
          filteredModules = modules;
          isLoading = false;
        });
        _animationController.forward();
      }
    } catch (e) {
      // Handle error and check if widget is still mounted
      print('ERROR: Failed to load modules: $e');
      if (mounted) {
        setState(() {
          isLoading = false;
        });
        // Show error message to user
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to load modules: ${e.toString()}'),
            backgroundColor: Colors.red,
            duration: const Duration(seconds: 5),
          ),
        );
      }
    }
  }

  void _filterModules(String query) {
    if (mounted) {
      setState(() {
        filteredModules = allModules
            .where((mod) => mod['title'].toLowerCase().contains(query.toLowerCase()))
            .toList();
      });
    }
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Modules')),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: TextField(
              controller: searchController,
              onChanged: _filterModules,
              decoration: InputDecoration(
                hintText: 'Search Modules...',
                prefixIcon: const Icon(Icons.search),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
          ),
          Expanded(
            child: isLoading
                ? const Center(child: CircularProgressIndicator())
                : ListView.builder(
              itemCount: filteredModules.length,
              itemBuilder: (_, index) {
                final module = filteredModules[index];
                return FadeTransition(
                  opacity: _animationController,
                  child: GestureDetector(
                    onTap: () => Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => ModuleDetailScreen(module: module),
                      ),
                    ),
                    child: Container(
                      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(16),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.deepPurple.withAlpha((0.1 * 255).toInt()),
                            blurRadius: 10,
                            offset: const Offset(0, 4),
                          )
                        ],
                      ),
                      child: Row(
                        children: [
                          ClipRRect(
                            borderRadius: BorderRadius.circular(12),
                            child: Image.network(
                              resolveImageUrl(module['image'] ?? ''),
                              width: 80,
                              height: 80,
                              fit: BoxFit.cover,
                              loadingBuilder: (context, child, loadingProgress) {
                                if (loadingProgress == null) return child;
                                return Container(
                                  width: 80,
                                  height: 80,
                                  color: Colors.grey[200],
                                  child: const Center(child: CircularProgressIndicator()),
                                );
                              },
                              errorBuilder: (context, error, stackTrace) {
                                print('DEBUG: Image load error: $error');
                                print('DEBUG: Image URL: ${resolveImageUrl(module['image'] ?? '')}');
                                print('DEBUG: Stack trace: $stackTrace');
                                return Container(
                                  width: 80,
                                  height: 80,
                                  color: Colors.grey[300],
                                  child: const Column(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      Icon(Icons.broken_image, size: 24),
                                      Text('No Image', style: TextStyle(fontSize: 10)),
                                    ],
                                  ),
                                );
                              },
                            ),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  module['title'] ?? 'Untitled',
                                  style: const TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                const SizedBox(height: 6),
                                Text('Capacity: ${module['cap'] ?? 'N/A'}'),
                                Text('Module Head: ${module['moduleHead'] ?? 'N/A'}'),

                              ],
                            ),
                          ),
                          const Icon(Icons.arrow_forward_ios, size: 18, color: Colors.deepPurple)
                        ],
                      ),
                    ),
                  ),
                );
              },
            ),
          )
        ],
      ),
    );
  }
}
