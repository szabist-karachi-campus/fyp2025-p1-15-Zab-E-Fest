import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '/services/api.dart'; // For fetchUserNameFromBackend()
import '/services/user_applications_api.dart'; // For fetching user applications
import '/services/notifications_api.dart'; // For notification count
import 'modules_screen.dart';
import 'results_screen.dart';
import 'notifications_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _currentIndex = 0;
  int _announcementIndex = 0;
  late final PageController _pageController;
  late final PageController _announcementController;

  String userName = "User";
  List<Map<String, dynamic>> userApplications = [];
  bool isLoadingApplications = true;
  int unreadNotificationCount = 0;

  final List<String> announcements = [
    "🎉 Welcome to Zab E-Fest 2025!",
    "📢 Submission deadline extended!",
    "🚀 New modules launched!",
    "🏆 Winners to be announced soon!"
  ];

  @override
  void initState() {
    super.initState();
    _pageController = PageController(initialPage: _currentIndex);
    _announcementController = PageController(initialPage: 0);
    _loadCurrentIndex();
    _loadUserName();
    _loadUserApplications();
    _loadNotificationCount();
  }

  Future<void> _loadUserApplications() async {
    if (mounted) {
      setState(() {
        isLoadingApplications = true;
      });
    }

    try {
      final applications = await fetchUserApplications();
      if (mounted) {
        setState(() {
          userApplications = applications;
        });
      }
    } catch (e) {
      // Handle error
      print('Error loading applications: $e');
    } finally {
      if (mounted) {
        setState(() {
          isLoadingApplications = false;
        });
      }
    }
  }

  Future<void> _loadCurrentIndex() async {
    final prefs = await SharedPreferences.getInstance();
    if (mounted) {
      setState(() {
        _currentIndex = prefs.getInt('homePageIndex') ?? 0;
      });
      _pageController.jumpToPage(_currentIndex);
    }
  }

  Future<void> _saveCurrentIndex(int index) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setInt('homePageIndex', index);
  }

  Future<void> _loadUserName() async {
    final prefs = await SharedPreferences.getInstance();

    try {
      final backendName = await fetchUserNameFromBackend();
      if (backendName != null && backendName.isNotEmpty) {
        if (mounted) {
          setState(() => userName = backendName);
        }
        prefs.setString('userName', backendName);
        return;
      }
    } catch (_) {}

    if (mounted) {
      setState(() => userName = prefs.getString('userName') ?? "User");
    }
  }

  Future<void> _loadNotificationCount() async {
    try {
      final count = await getUnreadNotificationCount();
      if (mounted) {
        setState(() {
          unreadNotificationCount = count;
        });
      }
    } catch (e) {
      // Handle error silently
      print('Error loading notification count: $e');
    }
  }

  void _onNavBarTap(int index) {
    setState(() => _currentIndex = index);
    _saveCurrentIndex(index);
    _pageController.animateToPage(
      index,
      duration: const Duration(milliseconds: 300),
      curve: Curves.easeInOut,
    );
  }

  @override
  void dispose() {
    _pageController.dispose();
    _announcementController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final pages = [
      _buildHomeScreen(),
      const ModulesScreen(),
      const ResultsScreen(),
      const NotificationsScreen(),
    ];

    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.deepPurple.shade50,
        elevation: 0,
        title: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              "👋 Hello, $userName",
              style: const TextStyle(
                fontWeight: FontWeight.w600,
                fontSize: 18,
                color: Colors.deepPurple,
              ),
            ),
            InkWell(
              onTap: () {
                Navigator.pushNamed(context, '/profile');
              },
              child: const CircleAvatar(
                radius: 20,
                backgroundImage: NetworkImage(
                  "https://images.unsplash.com/photo-1609010697446-11f2155278f0?auto=format&fit=crop&w=500&q=60",
                ),
              ),
            ),
          ],
        ),
        actions: [
          // Add refresh button
          IconButton(
            icon: const Icon(Icons.refresh, color: Colors.deepPurple),
            onPressed: () {
              _loadUserApplications();
              _loadNotificationCount();
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text("Refreshing data..."),
                  duration: Duration(seconds: 1),
                ),
              );
            },
          ),
        ],
      ),
      body: PageView(
        controller: _pageController,
        onPageChanged: (index) {
          setState(() => _currentIndex = index);
          _saveCurrentIndex(index);
        },
        children: pages,
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: _onNavBarTap,
        type: BottomNavigationBarType.fixed,
        selectedItemColor: Colors.deepPurple,
        unselectedItemColor: Colors.grey,
        showUnselectedLabels: true,
        items: [
          const BottomNavigationBarItem(icon: Icon(Icons.home, size: 30), label: 'Home'),
          const BottomNavigationBarItem(icon: Icon(Icons.dashboard_customize), label: 'Modules'),
          const BottomNavigationBarItem(icon: Icon(Icons.bar_chart_rounded), label: 'Results'),
          BottomNavigationBarItem(
            icon: Stack(
              children: [
                const Icon(Icons.notifications_none),
                if (unreadNotificationCount > 0)
                  Positioned(
                    right: 0,
                    top: 0,
                    child: Container(
                      padding: const EdgeInsets.all(2),
                      decoration: BoxDecoration(
                        color: Colors.red,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      constraints: const BoxConstraints(
                        minWidth: 16,
                        minHeight: 16,
                      ),
                      child: Text(
                        unreadNotificationCount > 99 ? '99+' : '$unreadNotificationCount',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                        ),
                        textAlign: TextAlign.center,
                      ),
                    ),
                  ),
              ],
            ),
            label: 'Notify',
          ),
        ],
      ),
    );
  }

  Widget _buildHomeScreen() {
    return SingleChildScrollView(
      child: Column(
      children: [
        const SizedBox(height: 20),
        SizedBox(
          height: 150,
          child: PageView.builder(
            controller: _announcementController,
            onPageChanged: (index) => setState(() => _announcementIndex = index),
            itemCount: announcements.length,
            itemBuilder: (context, index) => Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Container(
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Colors.deepPurpleAccent, Colors.purpleAccent],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(20),
                ),
                alignment: Alignment.center,
                child: Text(
                  announcements[index],
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
              ),
            ),
          ),
        ),
        const SizedBox(height: 10),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: List.generate(
            announcements.length,
                (index) => AnimatedContainer(
              duration: const Duration(milliseconds: 300),
              margin: const EdgeInsets.symmetric(horizontal: 4),
              width: _announcementIndex == index ? 12 : 6,
              height: 6,
              decoration: BoxDecoration(
                color: _announcementIndex == index ? Colors.deepPurple : Colors.grey,
                borderRadius: BorderRadius.circular(12),
              ),
            ),
          ),
        ),
        const SizedBox(height: 30),
        Container(
          margin: const EdgeInsets.symmetric(horizontal: 20),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.deepPurple.shade50,
            borderRadius: BorderRadius.circular(16),
            boxShadow: [
              BoxShadow(
                color: Colors.deepPurple.shade100,
                blurRadius: 10,
                offset: const Offset(0, 4),
              )
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  "🎯 Your Modules Summary",
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 12),
                isLoadingApplications
                    ? const Center(
                        child: Padding(
                          padding: EdgeInsets.all(20.0),
                          child: CircularProgressIndicator(),
                        ),
                      )
                    : userApplications.isEmpty
                        ? Center(
                            child: Padding(
                              padding: const EdgeInsets.all(20.0),
                              child: Column(
                                children: [
                                  const Text(
                                    "You haven't applied to any modules yet",
                                    style: TextStyle(
                                      fontSize: 16,
                                      color: Colors.grey,
                                    ),
                                  ),
                                  const SizedBox(height: 16),
                                  ElevatedButton.icon(
                                    onPressed: () {
                                      // Force refresh applications data
                                      _loadUserApplications();
                                      ScaffoldMessenger.of(context).showSnackBar(
                                        const SnackBar(
                                          content: Text("Refreshing applications..."),
                                          duration: Duration(seconds: 1),
                                        ),
                                      );
                                    },
                                    icon: const Icon(Icons.refresh),
                                    label: const Text("Refresh"),
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: Colors.deepPurple,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          )
                        : _buildApplicationsList(),
              ],
            ),
          ),
          const SizedBox(height: 20),
        ],
      ),
    );
  }


  Widget _buildApplicationsList() {
    return Column(
      children: userApplications.map((application) {
        // Get status information
        final status = application['status'] ?? 'Pending';
        final statusInfo = getPaymentStatus(status);
        
        return Column(
          children: [
              ListTile(
                leading: Icon(Icons.book, color: Colors.deepPurple),
              title: Text(
                "Module: ${application['moduleTitle'] ?? 'Unknown Module'}",
                style: const TextStyle(fontWeight: FontWeight.bold),
              ),
              subtitle: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SizedBox(height: 4),
                  _buildTrackIdRow(application['registrationToken'] ?? 'N/A'),
                  const SizedBox(height: 2),
                  Row(
                    children: [
                      Text("Payment: ${statusInfo['text']}"),
                      const SizedBox(width: 4),
                      Icon(
                        statusInfo['icon'] ?? Icons.info_outline,
                        size: 16,
                        color: statusInfo['color'] ?? Colors.grey,
                      ),
                    ],
                  ),
                ],
              ),
              trailing: Icon(
                Icons.chevron_right,
                color: Colors.deepPurple.shade300,
              ),
              onTap: () {
                // Show application details
                _showApplicationDetails(application);
              },
            ),
            const Divider(),
          ],
        );
      }).toList(),
    );
  }

  Widget _buildTrackIdRow(String trackId) {
    return Row(
      children: [
        const Text(
          "Track ID: ",
          style: TextStyle(fontWeight: FontWeight.w500),
        ),
        Flexible(
          child: Text(
            trackId,
            style: TextStyle(
              color: Colors.deepPurple.shade700,
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
        IconButton(
          icon: const Icon(Icons.copy, size: 16),
          padding: EdgeInsets.zero,
          constraints: const BoxConstraints(),
          onPressed: () {
            Clipboard.setData(ClipboardData(text: trackId));
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text("Track ID copied to clipboard"),
                duration: Duration(seconds: 1),
              ),
            );
          },
        ),
      ],
    );
  }

  void _showApplicationDetails(Map<String, dynamic> application) {
    final status = application['status'] ?? 'Pending';
    final statusInfo = getPaymentStatus(status);

    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: Text('${application['moduleTitle']} Details'),
          content: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.deepPurple.shade50,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: Colors.deepPurple.shade200),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Track ID:',
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              application['registrationToken'] ?? 'N/A',
                              style: TextStyle(
                                color: Colors.deepPurple.shade700,
                                fontWeight: FontWeight.bold,
                                fontSize: 16,
                              ),
                            ),
                          ),
                          IconButton(
                            icon: const Icon(Icons.copy),
                            onPressed: () {
                              Clipboard.setData(ClipboardData(
                                  text: application['registrationToken'] ?? ''));
                              Navigator.pop(context);
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                  content: Text("Track ID copied to clipboard"),
                                ),
                              );
                            },
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    const Text('Status: ', style: TextStyle(fontWeight: FontWeight.bold)),
                    Text(
                      statusInfo['text'],
                      style: TextStyle(
                        color: statusInfo['color'],
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(width: 4),
                    Icon(
                      statusInfo['icon'],
                      size: 18,
                      color: statusInfo['color'],
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    const Text('Fee: ', style: TextStyle(fontWeight: FontWeight.bold)),
                    Text('₨ ${application['totalFee']}'),
                  ],
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    const Text('Participation: ', style: TextStyle(fontWeight: FontWeight.bold)),
                    Text(application['participationType'] ?? 'Individual'),
                  ],
                ),
                const SizedBox(height: 16),
                const Text('Participants:', style: TextStyle(fontWeight: FontWeight.bold)),
                const SizedBox(height: 8),
                ...((application['participants'] as List<dynamic>?) ?? []).map((participant) {
                  final Map<String, dynamic> p = participant as Map<String, dynamic>;
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 8.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('${p['name']}'),
                        Text('${p['rollNumber']} | ${p['department']}'),
                      ],
                    ),
                  );
                }).toList(),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Close'),
            ),
          ],
        );
      },
    );
  }
}

// Helper function for payment status
Map<String, dynamic> getPaymentStatus(String status) {
  switch (status.toLowerCase()) {
    case 'paid':
      return {
        'text': 'Paid',
        'color': Colors.green,
        'icon': Icons.check_circle,
      };
    case 'pending':
      return {
        'text': 'Pending',
        'color': Colors.orange,
        'icon': Icons.pending,
      };
    case 'failed':
      return {
        'text': 'Failed',
        'color': Colors.red,
        'icon': Icons.error,
      };
    case 'rejected':
      return {
        'text': 'Rejected',
        'color': Colors.red,
        'icon': Icons.cancel,
      };
    default:
      return {
        'text': status,
        'color': Colors.grey,
        'icon': Icons.info_outline,
      };
  }
}