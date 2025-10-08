import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../providers/profile_provider.dart';
import '../../utils/url_utils.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> with TickerProviderStateMixin {
  late final AnimationController _controller;
  late final Animation<Offset> _slideAnimation;
  String email = "Loading...";
  String? profileImage;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 600),
      vsync: this,
    );
    _slideAnimation = Tween<Offset>(
      begin: const Offset(1, 0),
      end: Offset.zero,
    ).animate(CurvedAnimation(parent: _controller, curve: Curves.easeOut));
    _controller.forward();
    _loadEmail();
  }

  Future<void> _loadEmail() async {
    final prefs = await SharedPreferences.getInstance();
    email = prefs.getString('userEmail') ?? 'Unknown';
    try {
      final profile = await Provider.of<ProfileProvider>(context, listen: false).getCurrentUser();
      profileImage = resolveImageUrl(profile.profileImage);
    } catch (_) {}
    if (!mounted) return;
    setState(() {});
  }

  Future<void> _logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.clear();
    if (!mounted) return;
    Navigator.pushNamedAndRemoveUntil(context, '/auth', (route) => false);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('My Profile'),
        backgroundColor: Colors.deepPurple,
      ),
      body: SlideTransition(
        position: _slideAnimation,
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            CircleAvatar(
              radius: 50,
              backgroundImage: (profileImage != null && profileImage!.isNotEmpty)
                  ? NetworkImage(profileImage!)
                  : const AssetImage('assets/images/profile_placeholder.png') as ImageProvider,
            ),
            const SizedBox(height: 20),
            Text(
              email,
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w500),
            ),
            const SizedBox(height: 30),

            ListTile(
              leading: const Icon(Icons.person, color: Colors.deepPurple),
              title: const Text('View / Edit Profile'),
              onTap: () => Navigator.pushNamed(context, '/profile/edit'),
            ),

            ListTile(
              leading: const Icon(Icons.brightness_6, color: Colors.deepPurple),
              title: const Text('Theme Mode'),
              onTap: () => Navigator.pushNamed(context, '/theme'),
            ),

            ListTile(
              leading: const Icon(Icons.help_outline, color: Colors.deepPurple),
              title: const Text('Help & Support'),
              onTap: () => Navigator.pushNamed(context, '/help'),
            ),

            ListTile(
              leading: const Icon(Icons.logout, color: Colors.deepPurple),
              title: const Text('Logout'),
              onTap: _logout,
            ),
          ],
        ),
      ),
    );
  }
}
