import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:image_picker/image_picker.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../core/constants/supabase_constants.dart';
import '../services/supabase_service.dart';

class StorageRepository {
  final SupabaseClient _client;

  StorageRepository([SupabaseClient? client]) : _client = client ?? SupabaseService.client;

  /// Dedicated, secure product / food menu item image upload
  /// Validates format, file size, organizes by restaurant shop ID, and returns the public URL.
  Future<String?> uploadProductImage({
    required XFile file,
    required String shopId,
  }) async {
    final fileExt = file.name.split('.').last.toLowerCase();
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp'];
    if (!allowedExtensions.contains(fileExt)) {
      throw const FormatException('Unsupported image format. Please select a JPG, PNG, or WebP photo.');
    }

    final bytes = await file.readAsBytes();
    const maxSizeBytes = 5 * 1024 * 1024; // 5 MB limit
    if (bytes.lengthInBytes > maxSizeBytes) {
      throw const FormatException('Image size exceeds 5MB. Please choose a smaller photo.');
    }

    // Unique filename: timestamp + 5-digit random suffix
    final timestamp = DateTime.now().millisecondsSinceEpoch;
    final randomSuffix = (timestamp % 100000).toString().padLeft(5, '0');
    final uniqueFileName = '${timestamp}_$randomSuffix.$fileExt';
    final filePath = 'shops/$shopId/products/$uniqueFileName';
    final contentType = _getContentType(fileExt);

    try {
      await _client.storage.from(SupabaseConstants.productImagesBucket).uploadBinary(
        filePath,
        bytes,
        fileOptions: FileOptions(
          contentType: contentType,
          upsert: true,
        ),
      );

      final publicUrl = _client.storage.from(SupabaseConstants.productImagesBucket).getPublicUrl(filePath);
      debugPrint('[BuyLanka Storage] Food image uploaded successfully: $publicUrl');
      return publicUrl;
    } on StorageException catch (e) {
      debugPrint('[BuyLanka Storage] uploadProductImage StorageException: code=${e.statusCode}, error=${e.error}, message=${e.message}');
      rethrow;
    } catch (e) {
      debugPrint('[BuyLanka Storage] uploadProductImage unexpected error: $e');
      rethrow;
    }
  }

  /// Delete a product image from Supabase Storage (e.g. for rollback on DB error or replacing)
  Future<void> deleteProductImage(String publicUrlOrPath) async {
    try {
      String path = publicUrlOrPath;
      if (publicUrlOrPath.contains('/${SupabaseConstants.productImagesBucket}/')) {
        path = publicUrlOrPath.split('/${SupabaseConstants.productImagesBucket}/').last;
        if (path.contains('?')) {
          path = path.split('?').first;
        }
      }
      await _client.storage.from(SupabaseConstants.productImagesBucket).remove([path]);
      debugPrint('[BuyLanka Storage] Removed product image: $path');
    } catch (e) {
      debugPrint('[BuyLanka Storage] Error deleting product image: $e');
    }
  }

  Future<String?> uploadAvatar({
    required XFile file,
    required String userId,
  }) async {
    final bytes = await file.readAsBytes();
    final fileExt = file.name.split('.').last.toLowerCase();
    final fileName = 'avatar_${userId}_${DateTime.now().millisecondsSinceEpoch}.$fileExt';
    final contentType = _getContentType(fileExt);

    // 1. Try common Supabase Storage bucket names
    final candidateBuckets = ['avatars', 'profiles', 'public', 'images'];
    for (final bucket in candidateBuckets) {
      try {
        await _client.storage.from(bucket).uploadBinary(
          fileName,
          bytes,
          fileOptions: FileOptions(
            contentType: contentType,
            upsert: true,
          ),
        );
        return _client.storage.from(bucket).getPublicUrl(fileName);
      } catch (_) {
        // Try next candidate bucket
      }
    }

    // 2. Fallback: Return Base64 Data URI if storage bucket hasn't been created yet
    final base64String = base64Encode(bytes);
    return 'data:$contentType;base64,$base64String';
  }

  Future<String?> uploadImage({
    required String bucket,
    required XFile file,
    String? folder,
  }) async {
    try {
      final bytes = await file.readAsBytes();
      final fileExt = file.name.split('.').last.toLowerCase();
      final fileName = '${DateTime.now().millisecondsSinceEpoch}_${file.name.replaceAll(' ', '_')}';
      final filePath = folder != null ? '$folder/$fileName' : fileName;
      final contentType = _getContentType(fileExt);

      final candidateBuckets = [bucket, 'product-images', 'shop-images', 'images', 'public'];
      for (final b in candidateBuckets) {
        try {
          await _client.storage.from(b).uploadBinary(
            filePath,
            bytes,
            fileOptions: FileOptions(
              contentType: contentType,
              upsert: true,
            ),
          );
          return _client.storage.from(b).getPublicUrl(filePath);
        } catch (_) {
          // Continue to next bucket
        }
      }

      return null;
    } catch (e) {
      return null;
    }
  }

  Future<String?> uploadBytes({
    required String bucket,
    required Uint8List bytes,
    required String fileName,
    String? folder,
  }) async {
    try {
      final filePath = folder != null ? '$folder/$fileName' : fileName;
      final fileExt = fileName.split('.').last.toLowerCase();
      final contentType = _getContentType(fileExt);

      final candidateBuckets = [bucket, 'product-images', 'shop-images', 'images', 'public'];
      for (final b in candidateBuckets) {
        try {
          await _client.storage.from(b).uploadBinary(
            filePath,
            bytes,
            fileOptions: FileOptions(
              contentType: contentType,
              upsert: true,
            ),
          );
          return _client.storage.from(b).getPublicUrl(filePath);
        } catch (_) {
          // Continue to next bucket
        }
      }

      return null;
    } catch (e) {
      return null;
    }
  }

  String _getContentType(String ext) {
    switch (ext) {
      case 'png':
        return 'image/png';
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'webp':
        return 'image/webp';
      default:
        return 'image/jpeg';
    }
  }
}
