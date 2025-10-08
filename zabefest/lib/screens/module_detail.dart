  import 'package:flutter/material.dart';
  import 'package:animate_do/animate_do.dart'; // ✅ correct

  import 'module_apply.dart';
  import '../utils/url_utils.dart';

  class ModuleDetailScreen extends StatelessWidget {
    final Map<String, dynamic> module;
    const ModuleDetailScreen({super.key, required this.module});

    @override
    Widget build(BuildContext context) {
      return Scaffold(
        appBar: AppBar(
          title: Text(module['title'] ?? 'Module Detail'),
          backgroundColor: Colors.deepPurple,
        ),
        body: SingleChildScrollView(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              FadeInDown(
                duration: const Duration(milliseconds: 500),
                child: ClipRRect(

                  
                  child: Image.network(
                    resolveImageUrl(module['image'] ?? ''),
                    height: 220,
                    width: double.infinity,
                    fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) => Container(
                      height: 220,
                      width: double.infinity,
                      color: Colors.grey[300],
                      child: const Icon(Icons.broken_image, size: 50),
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 20),

              FadeInLeft(
                delay: const Duration(milliseconds: 200),
                child: Text(
                  module['description'] ?? 'No description provided.',
                  style: const TextStyle(fontSize: 16, height: 1.5),
                ),
              ),

              const SizedBox(height: 24),
              FadeInUp(
                delay: const Duration(milliseconds: 300),
                child: Row(
                  children: [
                    const Icon(Icons.group, color: Colors.deepPurple),
                    const SizedBox(width: 8),
                    Text("Capacity: ${module['cap'] ?? 'N/A'}",
                        style: const TextStyle(fontSize: 16)),
                  ],
                ),
              ),
              const SizedBox(height: 12),
              FadeInUp(
                delay: const Duration(milliseconds: 400),
                child: Row(
                  children: [
                    const Icon(Icons.person_pin_circle, color: Colors.deepPurple),
                    const SizedBox(width: 8),
                    Text("Module Head: ${module['moduleHead'] ?? 'N/A'}",
                        style: const TextStyle(fontSize: 16)),
                  ],
                ),
              ),
              const SizedBox(height: 12),
              FadeInUp(
                delay: const Duration(milliseconds: 500),
                child: Row(
                  children: [
                    const Icon(Icons.location_on, color: Colors.deepPurple),
                    const SizedBox(width: 8),
                    Text("Location: ${module['location'] ?? 'N/A'}",
                        style: const TextStyle(fontSize: 16)),
                  ],
                ),
              ),

              const SizedBox(height: 12),
              FadeInUp(
                delay: const Duration(milliseconds: 550),
                child: Row(
                  children: [
                    const Icon(Icons.attach_money, color: Colors.deepPurple),
                    const SizedBox(width: 8),
                    Text(
                      "Fee: Rs. ${module['fee'] ?? '0'}",
                      style: const TextStyle(fontSize: 16),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 40),
              const SizedBox(height: 40),
              FadeInUp(
                delay: const Duration(milliseconds: 600),
                child: SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    onPressed: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => ModuleApplyScreen(module: module),
                        ),
                      );
                    },
                    icon: const Icon(Icons.send),
                    label: const Text("Apply Now", style: TextStyle(fontSize: 18)),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.black12,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      elevation: 6,
                    ),
                  ),
                ),
              )
            ],
          ),
        ),
      );
    }
  }
