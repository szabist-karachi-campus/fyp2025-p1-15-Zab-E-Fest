

import 'package:animate_do/animate_do.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'payment_screen.dart';

class ModuleApplyScreen extends StatefulWidget {
  final Map<String, dynamic> module;
  const ModuleApplyScreen({super.key, required this.module});

  @override
  State<ModuleApplyScreen> createState() => _ModuleApplyScreenState();
}

class _ModuleApplyScreenState extends State<ModuleApplyScreen> {
  final _formKey = GlobalKey<FormState>();
  final List<Map<String, TextEditingController>> participantControllers = [];
  String selectedParticipation = "Solo";

  @override
  void initState() {
    super.initState();
    _initializeControllers(1);  // Start with solo as default
  }

  // This method initializes the controllers based on the selected participation type
  void _initializeControllers(int count) {
    participantControllers.clear();
    for (int i = 0; i < count; i++) {
      participantControllers.add({
        'name': TextEditingController(),
        'roll': TextEditingController(),
        'email': TextEditingController(),
        'contact': TextEditingController(),
        'department': TextEditingController(),
        'university': TextEditingController(),
      });
    }
    setState(() {});
  }

  // Method to collect participant data and proceed to payment screen
  Future<void> _proceedToPayment() async {
    if (!_formKey.currentState!.validate()) return;

    final participantData = participantControllers.map((p) => {
      "name": p['name']!.text.trim(),
      "rollNumber": p['roll']!.text.trim(),
      "email": p['email']?.text ?? "",
      "contactNumber": p['contact']?.text ?? "",
      "department": p['department']?.text ?? "",
      "university": p['university']?.text ?? "",
    }).toList();

    // Debugging: Check if data is correctly collected
    if (kDebugMode) {
      print("Participant Data: $participantData");
    }

    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => PaymentScreen(
          participationType: selectedParticipation,
          module: widget.module,
          participants: participantData,
        ),
      ),
    );
  }


  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    return Scaffold(
      appBar: AppBar(
        title: Text("Apply to ${widget.module['title'] ?? 'Module'}"),
        backgroundColor: Colors.deepPurple,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: FadeInUp(
          duration: const Duration(milliseconds: 400),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Dropdown to select participation type
                DropdownButtonFormField<String>(
                  value: selectedParticipation,
                  decoration: const InputDecoration(
                    labelText: "Participation Type",
                    border: OutlineInputBorder(),
                  ),
                  items: ["Solo", "Partner 2", "Partner 3", "Partner 4"]
                      .map((e) => DropdownMenuItem(value: e, child: Text(e)))
                      .toList(),
                  onChanged: (value) {
                    selectedParticipation = value ?? "Solo";
                    int count = 1;
                    if (selectedParticipation.contains("2")) count = 2;
                    if (selectedParticipation.contains("3")) count = 3;
                    if (selectedParticipation.contains("4")) count = 4;
                    _initializeControllers(count);
                  },
                ),
                const SizedBox(height: 20),

                // Dynamically generate participant fields based on selected participation type
                for (int i = 0; i < participantControllers.length; i++) ...[
                  const Divider(thickness: 1, height: 32),
                  FadeInUp(
                    delay: Duration(milliseconds: 100 * i),
                    child: Text(
                      i == 0 ? "Main Participant" : "Partner ${i + 1}",
                      style: textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
                    ),
                  ),
                  const SizedBox(height: 10),

                  // Build the participant fields (Name, Roll Number, etc.)
                  _buildTextField("Name", participantControllers[i]['name']!),
                  _buildTextField("Roll Number", participantControllers[i]['roll']!),
                  _buildTextField("Email", participantControllers[i]['email']!),
                  _buildTextField("Contact Number", participantControllers[i]['contact']!),
                  _buildTextField("Department", participantControllers[i]['department']!),
                  _buildTextField("University", participantControllers[i]['university']!),
                ],

                const SizedBox(height: 20),
                Center(
                  child: ElevatedButton.icon(
                    onPressed: _proceedToPayment,
                    icon: const Icon(Icons.payment),
                    label: const Text("Proceed to Payment"),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.black,
                      padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 16),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  // Helper function to build text fields for each participant
  Widget _buildTextField(String label, TextEditingController controller) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: TextFormField(
        controller: controller,
        decoration: InputDecoration(
          labelText: label,
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
        ),
        validator: (value) => value == null || value.isEmpty ? "Required" : null,
      ),
    );
  }
}
