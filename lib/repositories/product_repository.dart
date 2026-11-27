import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:buylanka/core/constants/supabase_constants.dart';
import 'package:buylanka/models/category_model.dart';
import 'package:buylanka/models/product_model.dart';
import 'package:buylanka/services/supabase_service.dart';

class ProductRepository {
  final SupabaseClient _client;

  ProductRepository([SupabaseClient? client]) : _client = client ?? SupabaseService.client;

  /// Fetch all products for a specific shop
  Future<List<ProductModel>> getProductsByShop(String shopId, {String? categoryId, String? search}) async {
    try {
      var query = _client
          .from(SupabaseConstants.productsTable)
          .select('*, category:${SupabaseConstants.categoriesTable}(*)')
          .eq('shop_id', shopId);

      if (categoryId != null && categoryId.isNotEmpty && categoryId != 'all') {
        query = query.eq('category_id', categoryId);
      }

      if (search != null && search.trim().isNotEmpty) {
        query = query.ilike('title', '%${search.trim()}%');
      }

      final data = await query.order('created_at', ascending: false);
      return (data as List).map((p) => ProductModel.fromJson(p as Map<String, dynamic>)).toList();
    } catch (e) {
      rethrow;
    }
  }

  /// Fetch active platform categories
  Future<List<CategoryModel>> getCategories() async {
    try {
      final data = await _client
          .from(SupabaseConstants.categoriesTable)
          .select()
          .eq('is_active', true)
          .order('display_order', ascending: true);

      return (data as List).map((c) => CategoryModel.fromJson(c as Map<String, dynamic>)).toList();
    } catch (e) {
      return [];
    }
  }

  /// Create a new product / food menu item
  Future<ProductModel> createProduct(ProductModel product) async {
    var cleanSlug = product.title
        .toLowerCase()
        .replaceAll(RegExp(r'[^a-z0-9]+'), '-')
        .replaceAll(RegExp(r'^-|-$'), '');
    if (cleanSlug.isEmpty) {
      cleanSlug = 'dish';
    }
    final uniqueSlug = '$cleanSlug-${DateTime.now().millisecondsSinceEpoch}';

    final payload = <String, dynamic>{
      'shop_id': product.shopId,
      'title': product.title.trim(),
      'slug': uniqueSlug,
      'price': product.price,
      'stock_quantity': product.stockQuantity,
      'images': product.images,
      'status': product.isAvailable ? 'published' : 'draft',
      'is_featured': product.isFeatured,
    };

    if (product.categoryId != null && product.categoryId!.trim().isNotEmpty) {
      payload['category_id'] = product.categoryId!.trim();
    }
    if (product.description != null && product.description!.trim().isNotEmpty) {
      payload['description'] = product.description!.trim();
    }
    if (product.originalPrice != null && product.originalPrice! > 0) {
      payload['original_price'] = product.originalPrice;
    }
    if (product.sku != null && product.sku!.trim().isNotEmpty) {
      payload['sku'] = product.sku!.trim();
    }

    try {
      final data = await _client
          .from(SupabaseConstants.productsTable)
          .insert(payload)
          .select('*, category:${SupabaseConstants.categoriesTable}(*)')
          .single();

      return ProductModel.fromJson(data);
    } on PostgrestException catch (e) {
      debugPrint('[BuyLanka ProductRepo] createProduct error: code=${e.code}, message=${e.message}, details=${e.details}, hint=${e.hint}');
      // If category relation join failed, retry with plain select
      if (e.code == 'PGRST200' || e.message.contains('categories')) {
        final data = await _client
            .from(SupabaseConstants.productsTable)
            .insert(payload)
            .select()
            .single();
        return ProductModel.fromJson(data);
      }
      rethrow;
    }
  }

  /// Update an existing product
  Future<ProductModel> updateProduct(ProductModel product) async {
    final payload = <String, dynamic>{
      'title': product.title.trim(),
      'price': product.price,
      'stock_quantity': product.stockQuantity,
      'images': product.images,
      'status': product.isAvailable ? 'published' : 'draft',
      'is_featured': product.isFeatured,
      'updated_at': DateTime.now().toIso8601String(),
    };

    if (product.categoryId != null && product.categoryId!.trim().isNotEmpty) {
      payload['category_id'] = product.categoryId!.trim();
    } else {
      payload['category_id'] = null;
    }
    if (product.description != null && product.description!.trim().isNotEmpty) {
      payload['description'] = product.description!.trim();
    } else {
      payload['description'] = null;
    }
    if (product.originalPrice != null && product.originalPrice! > 0) {
      payload['original_price'] = product.originalPrice;
    } else {
      payload['original_price'] = null;
    }
    if (product.sku != null && product.sku!.trim().isNotEmpty) {
      payload['sku'] = product.sku!.trim();
    } else {
      payload['sku'] = null;
    }

    try {
      final data = await _client
          .from(SupabaseConstants.productsTable)
          .update(payload)
          .eq('id', product.id)
          .select('*, category:${SupabaseConstants.categoriesTable}(*)')
          .single();

      return ProductModel.fromJson(data);
    } on PostgrestException catch (e) {
      debugPrint('[BuyLanka ProductRepo] updateProduct error: code=${e.code}, message=${e.message}, details=${e.details}, hint=${e.hint}');
      if (e.code == 'PGRST200' || e.message.contains('categories')) {
        final data = await _client
            .from(SupabaseConstants.productsTable)
            .update(payload)
            .eq('id', product.id)
            .select()
            .single();
        return ProductModel.fromJson(data);
      }
      rethrow;
    }
  }

  /// Quick toggle for product availability
  Future<void> toggleProductAvailability(String productId, bool isAvailable) async {
    final status = isAvailable ? 'published' : 'draft';
    await _client
        .from(SupabaseConstants.productsTable)
        .update({
          'status': status,
          'updated_at': DateTime.now().toIso8601String(),
        })
        .eq('id', productId);
  }

  /// Delete a product
  Future<void> deleteProduct(String productId) async {
    await _client
        .from(SupabaseConstants.productsTable)
        .delete()
        .eq('id', productId);
  }
}
