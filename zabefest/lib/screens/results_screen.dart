import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '/services/api.dart';

class ResultsScreen extends StatefulWidget {
  const ResultsScreen({super.key});

  @override
  State<ResultsScreen> createState() => _ResultsScreenState();
}

class _ResultsScreenState extends State<ResultsScreen> {
  bool _isRefreshing = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: FutureBuilder<Map<String, dynamic>?>(
        future: fetchMyResult(),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  CircularProgressIndicator(),
                  SizedBox(height: 16),
                  Text('Loading your results...'),
                ],
              ),
            );
          }
          
          if (!snapshot.hasData || snapshot.data == null) {
            return _buildNoResultsWidget();
          }
          
          final data = snapshot.data!;
          if (data['error'] == true) {
            return _buildErrorWidget(data['message'] ?? 'Result unavailable');
          }
          
          return _buildResultsContent(data);
        },
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _refreshResults,
        backgroundColor: Colors.deepPurple,
        child: _isRefreshing 
          ? const SizedBox(
              width: 20,
              height: 20,
              child: CircularProgressIndicator(
                strokeWidth: 2,
                valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
              ),
            )
          : const Icon(Icons.refresh, color: Colors.white),
      ),
    );
  }

  Widget _buildNoResultsWidget() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.assessment_outlined,
              size: 80,
              color: Colors.grey.shade400,
            ),
            const SizedBox(height: 24),
            Text(
              'No Results Available',
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: Colors.grey.shade600,
              ),
            ),
            const SizedBox(height: 12),
            Text(
              'Your results will appear here once they are published by the admin.',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 16,
                color: Colors.grey.shade500,
              ),
            ),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: _refreshResults,
              icon: const Icon(Icons.refresh),
              label: const Text('Refresh'),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.deepPurple,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildErrorWidget(String message) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.error_outline,
              size: 80,
              color: Colors.red.shade400,
            ),
            const SizedBox(height: 24),
            Text(
              'Error Loading Results',
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: Colors.red.shade600,
              ),
            ),
            const SizedBox(height: 12),
            Text(
              message,
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 16,
                color: Colors.grey.shade600,
              ),
            ),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: _refreshResults,
              icon: const Icon(Icons.refresh),
              label: const Text('Try Again'),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.red,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildResultsContent(Map<String, dynamic> data) {
    final stage = (data['stage'] ?? 'Pre-Qualifier') as String;
    final token = (data['registrationToken'] ?? 'N/A') as String;
    final module = (data['module'] ?? 'Unknown Module') as String;
    final marks = data['marks'];
    final remark = (data['remark'] ?? '') as String;

    Color stageColor = Colors.orange;
    IconData stageIcon = Icons.flag_outlined;
    if (stage == 'Final Round') { 
      stageColor = Colors.blue; 
      stageIcon = Icons.emoji_events_outlined; 
    }
    if (stage == 'Winner') { 
      stageColor = Colors.green; 
      stageIcon = Icons.emoji_events; 
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header Card
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [Colors.deepPurple.shade50, Colors.deepPurple.shade100],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(16),
              boxShadow: [
                BoxShadow(
                  color: Colors.deepPurple.shade100,
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(Icons.assessment, color: Colors.deepPurple.shade700, size: 28),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        'Your Results',
                        style: TextStyle(
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                          color: Colors.deepPurple.shade700,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Text(
                  'Module: $module',
                  style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
                ),
                const SizedBox(height: 8),
                _buildTrackIdRow(token),
              ],
            ),
          ),
          
          const SizedBox(height: 20),
          
          // Marks Section
          if (marks != null) ...[
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.green.shade50,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.green.shade200),
              ),
              child: Row(
                children: [
                  Icon(Icons.assessment_outlined, color: Colors.green.shade700, size: 24),
                  const SizedBox(width: 12),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Marks',
                        style: TextStyle(
                          fontSize: 14,
                          color: Colors.green.shade600,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      Text(
                        '$marks',
                        style: TextStyle(
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                          color: Colors.green.shade700,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
          ],
          
          // Current Stage Card
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: stageColor.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: stageColor.withOpacity(0.3)),
            ),
            child: Row(
              children: [
                Icon(stageIcon, color: stageColor, size: 24),
                const SizedBox(width: 12),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Current Stage',
                      style: TextStyle(
                        fontSize: 14,
                        color: stageColor.withOpacity(0.8),
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    Text(
                      stage,
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        color: stageColor,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          
          const SizedBox(height: 20),
          
          // Progress Flow
          Text(
            'Progress Flow',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: Colors.grey.shade700,
            ),
          ),
          const SizedBox(height: 12),
          
          _buildFlowStep(
            'Pre-Qualifier',
            'Initial assessment round',
            Icons.flag_outlined,
            stage == 'Pre-Qualifier' || stage == 'Final Round' || stage == 'Winner',
            stage == 'Pre-Qualifier',
          ),
          _buildFlowConnector(),
          _buildFlowStep(
            'Final Round',
            'Advanced competition phase',
            Icons.emoji_events_outlined,
            stage == 'Final Round' || stage == 'Winner',
            stage == 'Final Round',
          ),
          _buildFlowConnector(),
          _buildFlowStep(
            'Winner',
            'Champion achievement',
            Icons.emoji_events,
            stage == 'Winner',
            stage == 'Winner',
          ),
          
          const SizedBox(height: 20),
          
          // Remark Section
          if (remark.isNotEmpty) ...[
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.blueGrey.shade50,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.blueGrey.shade200),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(Icons.message_outlined, color: Colors.blueGrey.shade700, size: 20),
                      const SizedBox(width: 8),
                      Text(
                        'Remarks',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                          color: Colors.blueGrey.shade700,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: Colors.blueGrey.shade100),
                    ),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          '"',
                          style: TextStyle(
                            fontSize: 24,
                            color: Colors.blueGrey.shade400,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(width: 4),
                        Expanded(
                          child: Text(
                            remark,
                            style: TextStyle(
                              fontSize: 16,
                              fontStyle: FontStyle.italic,
                              color: Colors.blueGrey.shade700,
                              height: 1.4,
                            ),
                          ),
                        ),
                        const SizedBox(width: 4),
                        Text(
                          '"',
                          style: TextStyle(
                            fontSize: 24,
                            color: Colors.blueGrey.shade400,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
          ],
          
          // Motivational Message
          if (stage == 'Pre-Qualifier' && marks is num && marks < 50)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.orange.shade50,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.orange.shade200),
              ),
              child: Row(
                children: [
                  const Text('😔', style: TextStyle(fontSize: 32)),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Keep Pushing!',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            color: Colors.orange.shade700,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Great things take time. Use this as motivation to improve!',
                          style: TextStyle(
                            fontSize: 14,
                            color: Colors.orange.shade600,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildTrackIdRow(String trackId) {
    return Row(
      children: [
        Text(
          'Track ID: ',
          style: TextStyle(
            fontWeight: FontWeight.w600,
            color: Colors.grey.shade700,
          ),
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
        const SizedBox(width: 8),
        IconButton(
          icon: Icon(Icons.copy, size: 18, color: Colors.deepPurple.shade600),
          onPressed: () {
            Clipboard.setData(ClipboardData(text: trackId));
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: const Text("Track ID copied to clipboard"),
                backgroundColor: Colors.deepPurple,
                behavior: SnackBarBehavior.floating,
              ),
            );
          },
        ),
      ],
    );
  }

  Widget _buildFlowStep(String title, String subtitle, IconData icon, bool achieved, bool isCurrent) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isCurrent 
          ? Colors.deepPurple.shade50 
          : achieved 
            ? Colors.green.shade50 
            : Colors.grey.shade50,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isCurrent 
            ? Colors.deepPurple.shade300 
            : achieved 
              ? Colors.green.shade300 
              : Colors.grey.shade300,
          width: isCurrent ? 2 : 1,
        ),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: isCurrent 
                ? Colors.deepPurple 
                : achieved 
                  ? Colors.green 
                  : Colors.grey,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(
              isCurrent ? icon : (achieved ? Icons.check : icon),
              color: Colors.white,
              size: 20,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: isCurrent 
                      ? Colors.deepPurple.shade700 
                      : achieved 
                        ? Colors.green.shade700 
                        : Colors.grey.shade600,
                  ),
                ),
                Text(
                  subtitle,
                  style: TextStyle(
                    fontSize: 12,
                    color: isCurrent 
                      ? Colors.deepPurple.shade500 
                      : achieved 
                        ? Colors.green.shade500 
                        : Colors.grey.shade500,
                  ),
                ),
              ],
            ),
          ),
          if (isCurrent)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: Colors.deepPurple,
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Text(
                'Current',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildFlowConnector() {
    return Container(
      margin: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          const SizedBox(width: 28),
          Container(
            width: 2,
            height: 20,
            color: Colors.grey.shade300,
          ),
        ],
      ),
    );
  }

  Future<void> _refreshResults() async {
    if (mounted) {
      setState(() {
        _isRefreshing = true;
      });
    }
    
    // Add a small delay to show the loading state
    await Future.delayed(const Duration(milliseconds: 500));
    
    if (mounted) {
      setState(() {
        _isRefreshing = false;
      });
      
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text("Results refreshed"),
          backgroundColor: Colors.deepPurple,
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }
}

// Helper function for payment status (moved from home_screen.dart)
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
