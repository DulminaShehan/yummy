import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:image_picker/image_picker.dart';
import 'package:buylanka/core/constants/app_colors.dart';
import 'package:buylanka/models/category_model.dart';
import 'package:buylanka/models/product_model.dart';
import 'package:buylanka/models/profile_model.dart';
import 'package:buylanka/models/seller_model.dart';
import 'package:buylanka/models/shop_model.dart';
import 'package:buylanka/repositories/product_repository.dart';
import 'package:buylanka/repositories/storage_repository.dart';
import 'package:buylanka/repositories/shop_repository.dart';
import 'package:buylanka/features/auth/controllers/auth_controller.dart';
import 'package:buylanka/features/seller/products/controllers/products_controller.dart';
import 'package:buylanka/features/seller/products/presentation/add_edit_product_screen.dart';
import 'package:buylanka/features/seller/shop/controllers/shop_controller.dart';

class MockProductRepository implements ProductRepository {
  List<ProductModel> mockProducts = [];
  bool shouldThrow = false;
  String errorMessage = 'DB Error';

  @override
  Future<List<CategoryModel>> getCategories() async {
    return [
      const CategoryModel(id: 'cat-1', name: 'Rice & Curry', slug: 'rice-curry'),
      const CategoryModel(id: 'cat-2', name: 'Kottu Roti', slug: 'kottu-roti'),
      const CategoryModel(id: 'cat-3', name: 'Beverages', slug: 'beverages'),
    ];
  }

  @override
  Future<List<ProductModel>> getProductsByShop(String shopId, {String? categoryId, String? search}) async {
    return mockProducts;
  }

  @override
  Future<ProductModel> createProduct(ProductModel product) async {
    if (shouldThrow) {
      throw Exception(errorMessage);
    }
    final created = ProductModel(
      id: 'prod-new-123',
      shopId: product.shopId,
      categoryId: product.categoryId,
      title: product.title,
      slug: 'dish-${DateTime.now().millisecondsSinceEpoch}',
      description: product.description,
      price: product.price,
      originalPrice: product.originalPrice,
      stockQuantity: product.stockQuantity,
      sku: product.sku,
      images: product.images,
      status: product.isAvailable ? 'published' : 'draft',
      isFeatured: product.isFeatured,
      isAvailable: product.isAvailable,
      preparationTimeMinutes: product.preparationTimeMinutes,
    );
    mockProducts.add(created);
    return created;
  }

  @override
  Future<ProductModel> updateProduct(ProductModel product) async {
    if (shouldThrow) {
      throw Exception(errorMessage);
    }
    return product;
  }

  @override
  Future<void> toggleProductAvailability(String productId, bool isAvailable) async {}

  @override
  Future<void> deleteProduct(String productId) async {}
}

class MockStorageRepository implements StorageRepository {
  List<String> uploadedPaths = [];
  List<String> deletedPaths = [];
  bool shouldThrow = false;
  String errorMessage = 'Storage upload failed. Please check your internet connection.';

  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);

  @override
  Future<String?> uploadProductImage({
    required XFile file,
    required String shopId,
  }) async {
    if (shouldThrow) {
      throw Exception(errorMessage);
    }
    final url = 'https://storage.buylanka.lk/product-images/shops/$shopId/products/${file.name}';
    uploadedPaths.add(url);
    return url;
  }

  @override
  Future<void> deleteProductImage(String publicUrlOrPath) async {
    deletedPaths.add(publicUrlOrPath);
  }

  @override
  Future<String?> uploadImage({
    required String bucket,
    required XFile file,
    String? folder,
  }) async {
    return 'https://storage.buylanka.lk/product-images/dish.jpg';
  }
}

class FakeShopRepository implements ShopRepository {
  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

class FakeAuthController extends StateNotifier<AuthStateData> implements AuthController {
  FakeAuthController(super.state);

  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

void main() {
  const testProfile = ProfileModel(
    id: 'seller-test-uuid',
    fullName: 'Chef Kamal Silva',
    email: 'kamal@restaurant.lk',
    role: 'seller',
    status: 'active',
  );

  const testSeller = SellerModel(
    id: 'seller-test-uuid',
    businessName: 'Colombo Spice Kitchen',
    verificationStatus: 'verified',
    commissionRate: 10.0,
  );

  const testShop = ShopModel(
    id: 'shop-test-uuid',
    sellerId: 'seller-test-uuid',
    name: 'Colombo Spice Kitchen',
    slug: 'colombo-spice-kitchen',
    description: 'Authentic Sri Lankan Cuisine',
    status: 'approved',
    rating: 4.8,
    totalReviews: 24,
  );

  Widget createTestWidget({
    ProductModel? product,
    required MockProductRepository mockRepo,
    MockStorageRepository? mockStorage,
  }) {
    final storage = mockStorage ?? MockStorageRepository();
    return ProviderScope(
      overrides: [
        authControllerProvider.overrideWith((ref) {
          return FakeAuthController(
            const AuthStateData(
              isLoading: false,
              profile: testProfile,
              seller: testSeller,
            ),
          );
        }),
        productRepositoryProvider.overrideWithValue(mockRepo),
        storageRepositoryProvider.overrideWithValue(storage),
        shopRepositoryProvider.overrideWithValue(FakeShopRepository()),
        shopControllerProvider.overrideWith((ref) {
          return ShopController(
            ref.read(shopRepositoryProvider),
            ref.read(storageRepositoryProvider),
            ref,
          )..state = const ShopStateData(shop: testShop, isLoading: false);
        }),
      ],
      child: MaterialApp(
        theme: ThemeData(
          primaryColor: AppColors.primary,
          scaffoldBackgroundColor: AppColors.background,
        ),
        home: AddEditProductScreen(product: product),
      ),
    );
  }

  testWidgets('AddEditProductScreen renders form fields for adding a food menu item', (tester) async {
    tester.view.physicalSize = const Size(1080, 2400);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(() {
      tester.view.resetPhysicalSize();
      tester.view.resetDevicePixelRatio();
    });

    final mockRepo = MockProductRepository();

    await tester.pumpWidget(createTestWidget(mockRepo: mockRepo));
    await tester.pumpAndSettle();

    expect(find.text('Add Food / Menu Item'), findsOneWidget);
    expect(find.text('Dish / Item Title'), findsOneWidget);
    expect(find.text('Menu Category'), findsOneWidget);
    expect(find.text('Price (\$)'), findsOneWidget);
    expect(find.text('Original Price (\$)'), findsOneWidget);
    expect(find.text('Daily Stock / Portions'), findsOneWidget);
    expect(find.text('Prep Time (Mins)'), findsOneWidget);
    expect(find.text('Ingredients / Description'), findsOneWidget);
    expect(find.text('Available for Ordering'), findsOneWidget);
    expect(find.text('Add to Restaurant Menu'), findsOneWidget);
  });

  testWidgets('Validates required title and price before submission', (tester) async {
    tester.view.physicalSize = const Size(1080, 2400);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(() {
      tester.view.resetPhysicalSize();
      tester.view.resetDevicePixelRatio();
    });

    final mockRepo = MockProductRepository();

    await tester.pumpWidget(createTestWidget(mockRepo: mockRepo));
    await tester.pumpAndSettle();

    final submitBtn = find.text('Add to Restaurant Menu');
    await tester.ensureVisible(submitBtn);
    await tester.tap(submitBtn);
    await tester.pumpAndSettle();

    expect(find.text('Please enter item title'), findsOneWidget);
    expect(find.text('Enter price'), findsOneWidget);
    expect(mockRepo.mockProducts.length, 0);
  });

  testWidgets('Successfully adds a food item to menu and displays success snackbar', (tester) async {
    tester.view.physicalSize = const Size(1080, 2400);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(() {
      tester.view.resetPhysicalSize();
      tester.view.resetDevicePixelRatio();
    });

    final mockRepo = MockProductRepository();

    await tester.pumpWidget(createTestWidget(mockRepo: mockRepo));
    await tester.pumpAndSettle();

    // Fill title
    await tester.enterText(find.widgetWithText(TextFormField, 'Dish / Item Title'), 'Special Seafood Kottu');
    // Fill price
    await tester.enterText(find.widgetWithText(TextFormField, 'Price (\$)'), '1250');
    // Fill description
    await tester.enterText(find.widgetWithText(TextFormField, 'Ingredients / Description'), 'Fresh prawns, calamari and spicy rotti');

    await tester.pump();

    // Tap Add to Restaurant Menu
    final submitBtn = find.text('Add to Restaurant Menu');
    await tester.ensureVisible(submitBtn);
    await tester.tap(submitBtn);
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 300));

    expect(find.text('Food item added to menu!'), findsOneWidget);
    expect(mockRepo.mockProducts.length, 1);
    expect(mockRepo.mockProducts.first.title, 'Special Seafood Kottu');
    expect(mockRepo.mockProducts.first.price, 1250.0);
    expect(mockRepo.mockProducts.first.shopId, testShop.id);
  });

  testWidgets('Successfully saves menu item with prompt example values: Price 850, Original 1000, Stock 50, Prep 15', (tester) async {
    tester.view.physicalSize = const Size(1080, 2400);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(() {
      tester.view.resetPhysicalSize();
      tester.view.resetDevicePixelRatio();
    });

    final mockRepo = MockProductRepository();

    await tester.pumpWidget(createTestWidget(mockRepo: mockRepo));
    await tester.pumpAndSettle();

    // Fill title
    await tester.enterText(find.widgetWithText(TextFormField, 'Dish / Item Title'), 'Chicken Kottu Roti');
    // Price: 850
    await tester.enterText(find.widgetWithText(TextFormField, 'Price (\$)'), '850');
    // Original Price: 1000
    await tester.enterText(find.widgetWithText(TextFormField, 'Original Price (\$)'), '1000');
    // Daily Stock: 50
    await tester.enterText(find.widgetWithText(TextFormField, 'Daily Stock / Portions'), '50');
    // Preparation Time: 15 minutes
    await tester.enterText(find.widgetWithText(TextFormField, 'Prep Time (Mins)'), '15');
    // Ingredients / Description: Chicken, Rotti
    await tester.enterText(find.widgetWithText(TextFormField, 'Ingredients / Description'), 'Chicken, Rotti');

    await tester.pump();

    final submitBtn = find.text('Add to Restaurant Menu');
    await tester.ensureVisible(submitBtn);
    await tester.tap(submitBtn);
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 300));

    expect(find.text('Food item added to menu!'), findsOneWidget);
    expect(mockRepo.mockProducts.length, 1);
    final saved = mockRepo.mockProducts.first;
    expect(saved.title, 'Chicken Kottu Roti');
    expect(saved.price, 850.0);
    expect(saved.originalPrice, 1000.0);
    expect(saved.stockQuantity, 50);
    expect(saved.preparationTimeMinutes, 15);
    expect(saved.description, 'Chicken, Rotti');
    expect(saved.isAvailable, true);
    expect(saved.status, 'published');
  });

  testWidgets('Correctly handles disabled Available for Ordering and saves as draft', (tester) async {
    tester.view.physicalSize = const Size(1080, 2400);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(() {
      tester.view.resetPhysicalSize();
      tester.view.resetDevicePixelRatio();
    });

    final mockRepo = MockProductRepository();

    await tester.pumpWidget(createTestWidget(mockRepo: mockRepo));
    await tester.pumpAndSettle();

    await tester.enterText(find.widgetWithText(TextFormField, 'Dish / Item Title'), 'Egg Kottu');
    await tester.enterText(find.widgetWithText(TextFormField, 'Price (\$)'), '650');

    // Toggle switch off
    final switchFinder = find.byType(Switch);
    await tester.ensureVisible(switchFinder);
    await tester.tap(switchFinder);
    await tester.pump();

    final submitBtn = find.text('Add to Restaurant Menu');
    await tester.ensureVisible(submitBtn);
    await tester.tap(submitBtn);
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 300));

    expect(mockRepo.mockProducts.length, 1);
    final saved = mockRepo.mockProducts.first;
    expect(saved.isAvailable, false);
    expect(saved.status, 'draft');
  });

  testWidgets('Captures and displays error message when save fails', (tester) async {
    tester.view.physicalSize = const Size(1080, 2400);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(() {
      tester.view.resetPhysicalSize();
      tester.view.resetDevicePixelRatio();
    });

    final mockRepo = MockProductRepository();
    mockRepo.shouldThrow = true;
    mockRepo.errorMessage = 'Permission denied on products table';

    await tester.pumpWidget(createTestWidget(mockRepo: mockRepo));
    await tester.pumpAndSettle();

    await tester.enterText(find.widgetWithText(TextFormField, 'Dish / Item Title'), 'Test Dish');
    await tester.enterText(find.widgetWithText(TextFormField, 'Price (\$)'), '500');

    final submitBtn = find.text('Add to Restaurant Menu');
    await tester.ensureVisible(submitBtn);
    await tester.tap(submitBtn);
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 300));

    expect(find.text('Permission denied on products table'), findsOneWidget);
  });

  testWidgets('Tapping Add Photo opens modal bottom sheet with Camera and Gallery options', (tester) async {
    tester.view.physicalSize = const Size(1080, 2400);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(() {
      tester.view.resetPhysicalSize();
      tester.view.resetDevicePixelRatio();
    });

    final mockRepo = MockProductRepository();

    await tester.pumpWidget(createTestWidget(mockRepo: mockRepo));
    await tester.pumpAndSettle();

    final addPhotoFinder = find.text('Add Photo');
    expect(addPhotoFinder, findsOneWidget);

    await tester.tap(addPhotoFinder);
    await tester.pumpAndSettle();

    expect(find.text('Select Food Photo'), findsOneWidget);
    expect(find.text('Take Photo with Camera'), findsOneWidget);
    expect(find.text('Choose from Gallery'), findsOneWidget);
  });

  testWidgets('Storage error is caught and shown to the seller with friendly message', (tester) async {
    tester.view.physicalSize = const Size(1080, 2400);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(() {
      tester.view.resetPhysicalSize();
      tester.view.resetDevicePixelRatio();
    });

    final mockRepo = MockProductRepository();
    final mockStorage = MockStorageRepository();
    mockStorage.shouldThrow = true;
    mockStorage.errorMessage = 'Image upload failed. Please check your internet connection.';

    final container = ProviderContainer(
      overrides: [
        authControllerProvider.overrideWith((ref) => FakeAuthController(
          const AuthStateData(isLoading: false, profile: testProfile, seller: testSeller),
        )),
        productRepositoryProvider.overrideWithValue(mockRepo),
        storageRepositoryProvider.overrideWithValue(mockStorage),
        shopRepositoryProvider.overrideWithValue(FakeShopRepository()),
        shopControllerProvider.overrideWith((ref) => ShopController(
          ref.read(shopRepositoryProvider),
          ref.read(storageRepositoryProvider),
          ref,
        )..state = const ShopStateData(shop: testShop, isLoading: false)),
      ],
    );
    addTearDown(container.dispose);

    final controller = container.read(productsControllerProvider.notifier);
    final success = await controller.createProduct(
      ProductModel(
        id: '',
        shopId: testShop.id,
        title: 'Crispy Samosa',
        slug: '',
        price: 150,
      ),
      newImages: [XFile('test_photo.jpg')],
    );

    expect(success, false);
    final errorMsg = container.read(productsControllerProvider).errorMessage;
    expect(errorMsg, contains('Image upload failed'));
  });

  testWidgets('Uploads food image to restaurant folder and rolls back if database save fails', (tester) async {
    final mockRepo = MockProductRepository();
    mockRepo.shouldThrow = true;
    mockRepo.errorMessage = 'Database constraint error';

    final mockStorage = MockStorageRepository();

    final container = ProviderContainer(
      overrides: [
        authControllerProvider.overrideWith((ref) => FakeAuthController(
          const AuthStateData(isLoading: false, profile: testProfile, seller: testSeller),
        )),
        productRepositoryProvider.overrideWithValue(mockRepo),
        storageRepositoryProvider.overrideWithValue(mockStorage),
        shopRepositoryProvider.overrideWithValue(FakeShopRepository()),
        shopControllerProvider.overrideWith((ref) => ShopController(
          ref.read(shopRepositoryProvider),
          ref.read(storageRepositoryProvider),
          ref,
        )..state = const ShopStateData(shop: testShop, isLoading: false)),
      ],
    );
    addTearDown(container.dispose);

    final controller = container.read(productsControllerProvider.notifier);
    final success = await controller.createProduct(
      ProductModel(
        id: '',
        shopId: testShop.id,
        title: 'Lamb Biryani',
        slug: '',
        price: 1850,
      ),
      newImages: [XFile('lamb_biryani.jpg')],
    );

    expect(success, false);
    // Image was uploaded to restaurant folder
    expect(mockStorage.uploadedPaths.length, 1);
    expect(mockStorage.uploadedPaths.first, contains('shops/${testShop.id}/products/lamb_biryani.jpg'));
    // Rolled back because database save threw an error
    expect(mockStorage.deletedPaths.length, 1);
    expect(mockStorage.deletedPaths.first, mockStorage.uploadedPaths.first);
  });
}
