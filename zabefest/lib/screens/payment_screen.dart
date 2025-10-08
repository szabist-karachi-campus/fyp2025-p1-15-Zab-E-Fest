import 'package:flutter/material.dart';
import 'package:animate_do/animate_do.dart';
import 'package:flutter/services.dart';
import 'dart:io';
import 'dart:async';
import 'dart:typed_data';
import 'package:image_picker/image_picker.dart';
import 'package:http/http.dart' as http;
import 'package:path/path.dart' show basename;
import 'dart:convert';
import 'package:flutter/foundation.dart' show kIsWeb;
import '../config/api_config.dart';

class PaymentScreen extends StatefulWidget {
  final String participationType;
  final Map<String, dynamic> module;
  final List<Map<String, String>> participants;

  const PaymentScreen({
    super.key,
    required this.participationType,
    required this.module,
    required this.participants,
  });

  @override
  State<PaymentScreen> createState() => _PaymentScreenState();
}

class _PaymentScreenState extends State<PaymentScreen> {
  File? paymentImage;
  Uint8List? paymentImageWeb; // Used for web to store image as byte data
  final picker = ImagePicker();
  bool isSubmitting = false;
  String? registrationToken; // Store registration token after successful submission
  bool applicationSubmitted = false;

  final String accountNumber = "0301-1234567";

  // Total fee calculation based on participation type
  int get totalFee {
    final type = widget.participationType.toLowerCase();
    if (type.contains("2")) return (widget.module['fee'] ?? 0) * 2;
    if (type.contains("3")) return (widget.module['fee'] ?? 0) * 3;
    if (type.contains("4")) return (widget.module['fee'] ?? 0) * 4;
    return widget.module['fee'] ?? 0;
  }

  // Method for picking the payment receipt image
  Future<void> pickScreenshot() async {
    try {
      // Show options: Camera (preferred) or Gallery
      final source = await showDialog<ImageSource>(
        context: context,
        builder: (context) => AlertDialog(
          title: const Text('Select Payment Receipt'),
          content: const Text('Please capture or select a screenshot/photo of your payment receipt or transaction confirmation.\n\nNote: Only payment receipts will be accepted.'),
          actions: [
            TextButton.icon(
              onPressed: () => Navigator.pop(context, ImageSource.camera),
              icon: const Icon(Icons.camera_alt),
              label: const Text('Camera'),
            ),
            TextButton.icon(
              onPressed: () => Navigator.pop(context, ImageSource.gallery),
              icon: const Icon(Icons.photo_library),
              label: const Text('Gallery'),
            ),
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Cancel'),
            ),
          ],
        ),
      );

      if (source == null) return;

      if (kIsWeb) {
        final picked = await picker.pickImage(source: source);
        if (picked != null) {
          final bytes = await picked.readAsBytes();
          setState(() => paymentImageWeb = bytes);
        }
      } else {
        final picked = await picker.pickImage(
          source: source,
          imageQuality: 85,
          maxWidth: 1200,
          maxHeight: 1200,
        );
        if (picked != null) {
          setState(() => paymentImage = File(picked.path));
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text("Error picking image: $e")),
        );
      }
    }
  }

  // Submit the application and upload to the backend
  Future<void> submitApplication() async {
    if (paymentImage == null && paymentImageWeb == null) return;

    setState(() => isSubmitting = true);

    final uri = Uri.parse("${ApiConfig.baseUrl}/api/apply-module");
    final request = http.MultipartRequest("POST", uri);

    // Send module name (title) and total fee to the backend
    request.fields['moduleTitle'] = widget.module['title'] ?? '';
    request.fields['totalFee'] = totalFee.toString();

    // Pass the module ID and participation type
    request.fields['moduleId'] = widget.module['_id'];
    request.fields['participationType'] = widget.participationType;

    // Send participants as JSON only to avoid multipart key parsing issues
    try {
      request.fields['participants'] = json.encode(widget.participants);
    } catch (_) {}

    // Add the payment screenshot to the request
    if (paymentImage != null) {
      request.files.add(await http.MultipartFile.fromPath(
        'paymentScreenshot',
        paymentImage!.path,
        filename: basename(paymentImage!.path),
      ));
    } else if (paymentImageWeb != null) {
      // For web, send the image as a byte array
      request.files.add(http.MultipartFile.fromBytes(
        'paymentScreenshot',
        paymentImageWeb!,
        filename: 'payment_screenshot.png', // Or use a different name if required
      ));
    }

    // Send the request with timeout and robust error handling
    try {
      final response = await request.send().timeout(const Duration(seconds: 60));

      if (!mounted) return;
      if (response.statusCode == 200) {
        final responseBody = await response.stream.bytesToString();
        final jsonResponse = json.decode(responseBody);
        final token = jsonResponse['registrationToken'] ??
            (jsonResponse['application'] != null ? jsonResponse['application']['registrationToken'] : null);

        setState(() {
          isSubmitting = false;
          applicationSubmitted = true;
          registrationToken = token?.toString();
        });

        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text("Application submitted successfully"),
            duration: Duration(seconds: 5),
          ),
        );
      } else {
        final body = await response.stream.bytesToString();
        String message = 'Submission failed';
        try {
          final error = json.decode(body);
          message = (error['message'] ?? message).toString();
        } catch (_) {
          if (body.isNotEmpty) message = body;
        }
        if (!mounted) return;
        setState(() => isSubmitting = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text("Error: $message")),
        );
      }
    } on TimeoutException {
      if (!mounted) return;
      setState(() => isSubmitting = false);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Network timeout. Please try again.")),
      );
    } catch (e) {
      if (!mounted) return;
      setState(() => isSubmitting = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text("Error: $e")),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;

    // If application is submitted successfully, show confirmation screen with registration token
    if (applicationSubmitted && registrationToken != null) {
      return Scaffold(
        appBar: AppBar(
          title: const Text("Application Submitted"),
          backgroundColor: Colors.deepPurple,
        ),
        body: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              const Icon(
                Icons.check_circle_outline,
                color: Colors.green,
                size: 100,
              ),
              const SizedBox(height: 24),
              Text(
                "Application Submitted Successfully!",
                style: textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: Colors.deepPurple,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 40),
              FadeInDown(
                child: Container(
                  padding: const EdgeInsets.all(16),
                  width: double.infinity,
                  decoration: BoxDecoration(
                    color: Colors.deepPurple.shade50,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.deepPurple),
                  ),
                  child: Column(
                    children: [
                      Text(
                        "Your Registration Token",
                        style: textTheme.titleMedium,
                      ),
                      const SizedBox(height: 8),
                      Text(
                        registrationToken!,
                        style: textTheme.headlineMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                          color: Colors.deepPurple,
                        ),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 16),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(Icons.info_outline, size: 16),
                          const SizedBox(width: 8),
                          Flexible(
                            child: Text(
                              "Keep this token for your reference. You'll need it to track your application.",
                              textAlign: TextAlign.center,
                              style: textTheme.bodyMedium,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 24),
              ElevatedButton.icon(
                onPressed: () {
                  Clipboard.setData(ClipboardData(text: registrationToken!));
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text("Registration token copied to clipboard")),
                  );
                },
                icon: const Icon(Icons.copy),
                label: const Text("Copy Token"),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.deepPurple,
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                ),
              ),
              const SizedBox(height: 16),
              TextButton(
                onPressed: () {
                  Navigator.popUntil(context, (route) => route.isFirst);
                },
                child: const Text("Return to Home"),
              ),
            ],
          ),
        ),
      );
    }

    // Regular payment screen
    return Scaffold(
      appBar: AppBar(
        title: const Text("Payment Instructions"),
        backgroundColor: Colors.deepPurple,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Display account number and option to copy
            FadeInDown(
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.deepPurple.shade50,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.account_balance_wallet, color: Colors.deepPurple),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text("Send fee to: $accountNumber", style: textTheme.bodyLarge),
                    ),
                    IconButton(
                      icon: const Icon(Icons.copy),
                      onPressed: () {
                        Clipboard.setData(ClipboardData(text: accountNumber));
                        ScaffoldMessenger.of(context)
                            .showSnackBar(const SnackBar(content: Text("Account copied")));
                      },
                    )
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),
            // Participation type and fee details
            FadeInLeft(
              delay: const Duration(milliseconds: 200),
              child: Text("Participation: ${widget.participationType}", style: textTheme.titleMedium),
            ),
            const SizedBox(height: 10),
            FadeInLeft(
              delay: const Duration(milliseconds: 300),
              child: Text("Total Fee: Rs. $totalFee",
                  style: textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold)),
            ),
            const SizedBox(height: 30),
            // Upload payment screenshot
            FadeInUp(
              delay: const Duration(milliseconds: 400),
              child: GestureDetector(
                onTap: pickScreenshot,
                child: DottedBorderBox(
                imageFile: paymentImage, 
                imageWebFile: paymentImageWeb,
                isReceiptUpload: true,
              ),
              ),
            ),
            const SizedBox(height: 30),
            // Submit application button
            FadeInUp(
              delay: const Duration(milliseconds: 500),
              child: SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: isSubmitting || (paymentImage == null && paymentImageWeb == null) ? null : submitApplication,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.deepPurple,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  icon: isSubmitting
                      ? const CircularProgressIndicator(color: Colors.white)
                      : const Icon(Icons.upload_file),
                  label: Text(isSubmitting ? "Submitting..." : "Submit Application"),
                ),
              ),
            )
          ],
        ),
      ),
    );
  }
}

class DottedBorderBox extends StatelessWidget {
  final File? imageFile;
  final Uint8List? imageWebFile;
  final bool isReceiptUpload;
  const DottedBorderBox({
    super.key, 
    required this.imageFile, 
    required this.imageWebFile,
    this.isReceiptUpload = false,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 200,
      decoration: BoxDecoration(
        border: Border.all(color: Colors.deepPurple, width: 2),
        borderRadius: BorderRadius.circular(12),
        color: Colors.deepPurple.shade50,
      ),
      alignment: Alignment.center,
      child: imageFile == null && imageWebFile == null
          ? Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            isReceiptUpload ? Icons.receipt_long : Icons.upload, 
            size: 50, 
            color: Colors.deepPurple
          ),
          const SizedBox(height: 8),
          Text(
            isReceiptUpload 
              ? "Tap to upload payment receipt" 
              : "Tap to upload payment screenshot",
            textAlign: TextAlign.center,
          ),
          if (isReceiptUpload) ...[
            const SizedBox(height: 4),
            const Text(
              "Bank receipt, mobile banking screenshot,\nor transaction confirmation",
              style: TextStyle(fontSize: 12, color: Colors.grey),
              textAlign: TextAlign.center,
            ),
          ],
        ],
      )
          : (imageFile != null
          ? ClipRRect(
        borderRadius: BorderRadius.circular(10),
        child: Image.file(imageFile!, height: 200, width: double.infinity, fit: BoxFit.cover),
      )
          : ClipRRect(
        borderRadius: BorderRadius.circular(10),
        child: Image.memory(imageWebFile!, height: 200, width: double.infinity, fit: BoxFit.cover),
      )),
    );
  }
}
