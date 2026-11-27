import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:buylanka/core/constants/supabase_constants.dart';
import 'package:buylanka/models/shop_model.dart';
import 'package:buylanka/services/supabase_service.dart';

class ShopRepository {
  final SupabaseClient _client;

  ShopRepository([SupabaseClient? client]) : _client = client ?? SupabaseService.client;

  /// Fetch the seller's active shop
  Future<ShopModel?> getShopBySellerId(String sellerId) async {
    try {
      final data = await _client
          .from(SupabaseConstants.shopsTable)
          .select()
          .eq('seller_id', sellerId)
          .maybeSingle();

      if (data == null) return null;
      return ShopModel.fromJson(data);
    } catch (e) {
      rethrow;
    }
  }

  /// Create default shop if seller does not have one yet
  Future<ShopModel> createDefaultShop(String sellerId, String businessName) async {
    var slugPart = businessName
        .toLowerCase()
        .replaceAll(RegExp(r'[^a-z0-9]+'), '-')
        .replaceAll(RegExp(r'^-|-$'), '');
    if (slugPart.isEmpty) {
      slugPart = 'shop';
    }

    final payload = <String, dynamic>{
      'seller_id': sellerId,
      'name': businessName,
      'slug': '$slugPart-${DateTime.now().millisecondsSinceEpoch % 10000}',
      'description': 'Welcome to $businessName on YUMMY!',
      'status': 'approved',
      'rating': 5.0,
      'total_reviews': 0,
    };

    final data = await _client
        .from(SupabaseConstants.shopsTable)
        .insert(payload)
        .select()
        .single();

    return ShopModel.fromJson(data);
  }

  /// Update shop profile & settings
  Future<ShopModel> updateShop(ShopModel shop) async {
    final payload = <String, dynamic>{
      'name': shop.name,
      'description': shop.description,
      'logo_url': shop.logoUrl,
      'banner_url': shop.bannerUrl,
      'address': shop.address,
      'city': shop.city,
      'district': shop.district,
      'contact_phone': shop.contactPhone,
      'updated_at': DateTime.now().toIso8601String(),
    };

    final data = await _client
        .from(SupabaseConstants.shopsTable)
        .update(payload)
        .eq('id', shop.id)
        .select()
        .single();

    return ShopModel.fromJson(data);
  }

  /// Quick toggle for shop Open / Closed status
  Future<void> toggleShopOpenStatus(String shopId, bool isOpen) async {
    try {
      await _client
          .from(SupabaseConstants.shopsTable)
          .update({
            'is_open': isOpen,
            'updated_at': DateTime.now().toIso8601String(),
          })
          .eq('id', shopId);
    } catch (_) {
      // If is_open column doesn't exist on shops table, ignore gracefully
    }
  }
}
