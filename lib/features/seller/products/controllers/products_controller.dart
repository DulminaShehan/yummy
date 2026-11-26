import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:buylanka/models/category_model.dart';
import 'package:buylanka/models/product_model.dart';
import 'package:buylanka/models/shop_model.dart';
import 'package:buylanka/repositories/product_repository.dart';
import 'package:buylanka/repositories/storage_repository.dart';
import 'package:buylanka/features/auth/controllers/auth_controller.dart';
import 'package:buylanka/features/seller/shop/controllers/shop_controller.dart';

final productRepositoryProvider = Provider<ProductRepository>((ref) {
  return ProductRepository();
});

class ProductsStateData {
  final List<ProductModel> products;
  final List<CategoryModel> categories;
  final String selectedCategoryId;
  final String searchQuery;
  final bool isLoading;
  final bool isSaving;
  final String? errorMessage;

  const ProductsStateData({
    this.products = const [],
    this.categories = const [],
    this.selectedCategoryId = 'all',
    this.searchQuery = '',
    this.isLoading = false,
    this.isSaving = false,
    this.errorMessage,
  });

  List<ProductModel> get filteredProducts {
    var list = products;
    if (selectedCategoryId != 'all') {
      list = list.where((p) => p.categoryId == selectedCategoryId).toList();
    }
    if (searchQuery.trim().isNotEmpty) {
      final q = searchQuery.trim().toLowerCase();
      list = list.where((p) => p.title.toLowerCase().contains(q) || (p.description?.toLowerCase().contains(q) ?? false)).toList();
    }
    return list;
  }

  ProductsStateData copyWith({
    List<ProductModel>? products,
    List<CategoryModel>? categories,
    String? selectedCategoryId,
    String? searchQuery,
    bool? isLoading,
    bool? isSaving,
    String? errorMessage,
    bool clearError = false,
  }) {
    return ProductsStateData(
      products: products ?? this.products,
      categories: categories ?? this.categories,
      selectedCategoryId: selectedCategoryId ?? this.selectedCategoryId,
      searchQuery: searchQuery ?? this.searchQuery,
      isLoading: isLoading ?? this.isLoading,
      isSaving: isSaving ?? this.isSaving,
      errorMessage: clearError ? null : (errorMessage ?? this.errorMessage),
    );
  }
}

class ProductsController extends StateNotifier<ProductsStateData> {
  final ProductRepository _productRepository;
  final StorageRepository _storageRepository;
  final Ref _ref;

  ProductsController(this._productRepository, this._storageRepository, this._ref)
      : super(const ProductsStateData(isLoading: true)) {
    loadCategoriesAndProducts();
  }

  Future<ShopModel?> _ensureShop() async {
    var shop = _ref.read(shopControllerProvider).shop;
    if (shop != null) return shop;

    // 1. Try loading via ShopController
    await _ref.read(shopControllerProvider.notifier).loadShop();
    shop = _ref.read(shopControllerProvider).shop;
    if (shop != null) return shop;

    // 2. Try fetching or creating default shop directly for authenticated seller
    final authState = _ref.read(authControllerProvider);
    final userId = authState.profile?.id ?? authState.seller?.id;
    if (userId != null) {
      try {
        final shopRepo = _ref.read(shopRepositoryProvider);
        shop = await shopRepo.getShopBySellerId(userId);
        if (shop == null) {
          final businessName = authState.seller?.businessName ?? authState.profile?.fullName ?? 'My Restaurant';
          shop = await shopRepo.createDefaultShop(userId, businessName);
        }
      } catch (_) {}
    }

    return shop;
  }

  String _formatError(Object e) {
    if (e is StorageException) {
      if (e.statusCode == '404' || e.message.contains('Bucket not found') || (e.error?.contains('Bucket not found') ?? false)) {
        return 'Food image storage bucket not found. Please ensure migration 006 is executed in Supabase.';
      }
      if (e.statusCode == '403' || e.message.contains('AccessDenied') || e.message.contains('policy')) {
        return 'You do not have permission to upload this image to the restaurant folder.';
      }
      return 'Image upload failed: ${e.message}';
    }

    if (e is FormatException) {
      return e.message;
    }

    if (e is SocketException) {
      return 'Image upload failed. Please check your internet connection.';
    }

    if (e is PostgrestException) {
      if (e.code == '42501' || e.message.contains('row-level security') || e.message.contains('permission denied')) {
        return 'Access restricted: Please ensure your restaurant account is approved.';
      }
      if (e.code == '23505' || e.message.contains('unique constraint')) {
        return 'A menu item with a similar title already exists. Please choose a slightly different name.';
      }
      return e.message;
    }

    final str = e.toString().replaceFirst('Exception: ', '');
    if (str.toLowerCase().contains('socket') || str.toLowerCase().contains('network') || str.toLowerCase().contains('connection')) {
      return 'Image upload failed. Please check your internet connection.';
    }
    return str;
  }

  Future<void> loadCategoriesAndProducts() async {
    state = state.copyWith(isLoading: true, clearError: true);

    try {
      final categories = await _productRepository.getCategories();
      final shop = await _ensureShop();

      if (shop != null) {
        final products = await _productRepository.getProductsByShop(shop.id);
        state = state.copyWith(
          categories: categories,
          products: products,
          isLoading: false,
        );
      } else {
        state = state.copyWith(categories: categories, isLoading: false);
      }
    } catch (e, stackTrace) {
      debugPrint('[BuyLanka Food Menu] loadCategoriesAndProducts failed: $e');
      debugPrint('[BuyLanka Food Menu Stack] $stackTrace');
      state = state.copyWith(isLoading: false, errorMessage: _formatError(e));
    }
  }

  void setCategoryFilter(String categoryId) {
    state = state.copyWith(selectedCategoryId: categoryId);
  }

  void setSearchQuery(String query) {
    state = state.copyWith(searchQuery: query);
  }

  Future<bool> createProduct(ProductModel product, {List<XFile>? newImages}) async {
    final shop = await _ensureShop();
    if (shop == null) {
      state = state.copyWith(
        isSaving: false,
        errorMessage: 'Restaurant / Shop profile not found. Please ensure you are signed in as a restaurant partner.',
      );
      return false;
    }

    state = state.copyWith(isSaving: true, clearError: true);
    final List<String> newlyUploadedUrls = [];

    try {
      List<String> uploadedUrls = List.from(product.images);

      // 1. Upload new food images to Supabase Storage
      if (newImages != null && newImages.isNotEmpty) {
        for (final file in newImages) {
          final url = await _storageRepository.uploadProductImage(
            file: file,
            shopId: shop.id,
          );
          if (url != null && url.isNotEmpty) {
            uploadedUrls.add(url);
            newlyUploadedUrls.add(url);
          }
        }
      }

      // 2. Prepare product record
      final productToCreate = ProductModel(
        id: '',
        shopId: shop.id,
        categoryId: product.categoryId,
        title: product.title,
        slug: '',
        description: product.description,
        price: product.price,
        originalPrice: product.originalPrice,
        stockQuantity: product.stockQuantity,
        sku: product.sku,
        images: uploadedUrls,
        isFeatured: product.isFeatured,
        isAvailable: product.isAvailable,
        preparationTimeMinutes: product.preparationTimeMinutes,
      );

      // 3. Save to database
      final created = await _productRepository.createProduct(productToCreate);

      state = state.copyWith(
        products: [created, ...state.products],
        isSaving: false,
      );
      return true;
    } catch (e, stackTrace) {
      debugPrint('[BuyLanka Food Menu] createProduct failed: $e');
      debugPrint('[BuyLanka Food Menu Stack] $stackTrace');

      // Rollback: Clean up any newly uploaded images to avoid orphaned files in Storage
      for (final url in newlyUploadedUrls) {
        await _storageRepository.deleteProductImage(url);
      }

      state = state.copyWith(isSaving: false, errorMessage: _formatError(e));
      return false;
    }
  }

  Future<bool> updateProduct(ProductModel product, {List<XFile>? newImages}) async {
    final shop = await _ensureShop();
    if (shop == null) {
      state = state.copyWith(
        isSaving: false,
        errorMessage: 'Restaurant profile not found.',
      );
      return false;
    }

    state = state.copyWith(isSaving: true, clearError: true);
    final List<String> newlyUploadedUrls = [];

    try {
      List<String> uploadedUrls = List.from(product.images);

      if (newImages != null && newImages.isNotEmpty) {
        for (final file in newImages) {
          final url = await _storageRepository.uploadProductImage(
            file: file,
            shopId: shop.id,
          );
          if (url != null && url.isNotEmpty) {
            uploadedUrls.add(url);
            newlyUploadedUrls.add(url);
          }
        }
      }

      final productToUpdate = product.copyWith(images: uploadedUrls);
      final updated = await _productRepository.updateProduct(productToUpdate);

      final updatedList = state.products.map((p) => p.id == updated.id ? updated : p).toList();
      state = state.copyWith(products: updatedList, isSaving: false);
      return true;
    } catch (e, stackTrace) {
      debugPrint('[BuyLanka Food Menu] updateProduct failed: $e');
      debugPrint('[BuyLanka Food Menu Stack] $stackTrace');

      // Clean up newly uploaded files on failure
      for (final url in newlyUploadedUrls) {
        await _storageRepository.deleteProductImage(url);
      }

      state = state.copyWith(isSaving: false, errorMessage: _formatError(e));
      return false;
    }
  }

  Future<void> toggleAvailability(String productId, bool isAvailable) async {
    final currentList = state.products;
    final updatedList = currentList.map((p) {
      if (p.id == productId) {
        return p.copyWith(isAvailable: isAvailable);
      }
      return p;
    }).toList();

    state = state.copyWith(products: updatedList);

    try {
      await _productRepository.toggleProductAvailability(productId, isAvailable);
    } catch (e) {
      // Revert if failed
      state = state.copyWith(products: currentList);
    }
  }

  Future<bool> deleteProduct(String productId) async {
    final currentList = state.products;
    final productToDelete = currentList.firstWhere(
      (p) => p.id == productId,
      orElse: () => const ProductModel(id: '', shopId: '', title: '', slug: '', price: 0),
    );

    final updatedList = currentList.where((p) => p.id != productId).toList();
    state = state.copyWith(products: updatedList);

    try {
      await _productRepository.deleteProduct(productId);

      // Clean up images from Storage
      for (final imageUrl in productToDelete.images) {
        await _storageRepository.deleteProductImage(imageUrl);
      }

      return true;
    } catch (e) {
      state = state.copyWith(products: currentList, errorMessage: _formatError(e));
      return false;
    }
  }
}

final productsControllerProvider = StateNotifierProvider<ProductsController, ProductsStateData>((ref) {
  final productRepo = ref.watch(productRepositoryProvider);
  final storageRepo = ref.watch(storageRepositoryProvider);
  return ProductsController(productRepo, storageRepo, ref);
});
