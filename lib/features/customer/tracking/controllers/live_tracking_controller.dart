import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:latlong2/latlong.dart';
import 'package:buylanka/core/location/map_utils.dart';
import 'package:buylanka/models/delivery_model.dart';
import 'package:buylanka/models/order_model.dart';
import 'package:buylanka/models/rider_location_model.dart';
import 'package:buylanka/repositories/customer_order_repository.dart';
import 'package:buylanka/features/customer/orders/controllers/customer_orders_controller.dart';

class LiveTrackingState {
  final OrderModel? order;
  final DeliveryModel? delivery;
  final RiderLocationModel? riderLocation;
  final LatLng shopLocation;
  final LatLng customerLocation;
  final LatLng? liveRiderPosition;
  final List<LatLng> routePoints;
  final double distanceKm;
  final int estimatedMinutes;
  final bool isLoading;

  const LiveTrackingState({
    this.order,
    this.delivery,
    this.riderLocation,
    required this.shopLocation,
    required this.customerLocation,
    this.liveRiderPosition,
    this.routePoints = const [],
    this.distanceKm = 0.0,
    this.estimatedMinutes = 20,
    this.isLoading = false,
  });

  bool get isRiderAssigned => delivery != null && delivery!.isAssigned;
  bool get isPickedUp => delivery != null && delivery!.isAfterPickup;
  bool get isDelivered => order?.orderStatus == 'delivered' || (delivery != null && delivery!.isDelivered);

  LiveTrackingState copyWith({
    OrderModel? order,
    DeliveryModel? delivery,
    RiderLocationModel? riderLocation,
    LatLng? shopLocation,
    LatLng? customerLocation,
    LatLng? liveRiderPosition,
    List<LatLng>? routePoints,
    double? distanceKm,
    int? estimatedMinutes,
    bool? isLoading,
  }) {
    return LiveTrackingState(
      order: order ?? this.order,
      delivery: delivery ?? this.delivery,
      riderLocation: riderLocation ?? this.riderLocation,
      shopLocation: shopLocation ?? this.shopLocation,
      customerLocation: customerLocation ?? this.customerLocation,
      liveRiderPosition: liveRiderPosition ?? this.liveRiderPosition,
      routePoints: routePoints ?? this.routePoints,
      distanceKm: distanceKm ?? this.distanceKm,
      estimatedMinutes: estimatedMinutes ?? this.estimatedMinutes,
      isLoading: isLoading ?? this.isLoading,
    );
  }
}

class LiveTrackingController extends StateNotifier<LiveTrackingState> {
  final String orderId;
  final CustomerOrderRepository orderRepo;
  StreamSubscription? _orderSub;
  StreamSubscription? _deliverySub;
  StreamSubscription? _riderLocSub;

  LiveTrackingController({
    required this.orderId,
    required this.orderRepo,
  })  : super(const LiveTrackingState(
          shopLocation: LatLng(37.7749, -122.4194), // Dynamic fallback
          customerLocation: LatLng(37.7833, -122.4167),
          isLoading: true,
        )) {
    _initTracking();
  }

  Future<void> _initTracking() async {
    final order = await orderRepo.getOrderById(orderId);
    if (order != null) {
      _updateWithOrder(order);
    }

    // 1. Subscribe to order status changes
    _orderSub = orderRepo.streamOrder(orderId).listen((records) {
      if (records.isNotEmpty) {
        final updated = OrderModel.fromJson(records.first);
        _updateWithOrder(updated);
        // Automatically terminate tracking if delivered
        if (updated.orderStatus == 'delivered' || updated.orderStatus == 'cancelled') {
          _stopTrackingSubscriptions();
        }
      }
    });

    // 2. Subscribe to delivery record
    _deliverySub = orderRepo.streamDelivery(orderId).listen((deliveries) {
      if (deliveries.isNotEmpty) {
        final delivery = DeliveryModel.fromJson(deliveries.first);
        _updateWithDelivery(delivery);
      }
    });
  }

  void _updateWithOrder(OrderModel order) {
    state = state.copyWith(order: order, isLoading: false);
  }

  void _updateWithDelivery(DeliveryModel delivery) {
    final shopLat = delivery.pickupLatitude ?? state.shopLocation.latitude;
    final shopLng = delivery.pickupLongitude ?? state.shopLocation.longitude;
    final custLat = delivery.dropoffLatitude ?? state.customerLocation.latitude;
    final custLng = delivery.dropoffLongitude ?? state.customerLocation.longitude;

    final shopLoc = LatLng(shopLat, shopLng);
    final custLoc = LatLng(custLat, custLng);

    state = state.copyWith(
      delivery: delivery,
      shopLocation: shopLoc,
      customerLocation: custLoc,
    );

    // Stop tracking if delivery has finished
    if (delivery.isDelivered || delivery.isCancelled) {
      _stopTrackingSubscriptions();
      return;
    }

    // Subscribe to live GPS breadcrumbs for rider
    if (delivery.id.isNotEmpty && !delivery.isDelivered) {
      _riderLocSub?.cancel();
      _riderLocSub = orderRepo.streamRiderLocation(delivery.id).listen((locations) {
        if (locations.isNotEmpty) {
          final loc = RiderLocationModel.fromJson(locations.first);
          final riderPos = LatLng(loc.latitude, loc.longitude);
          final target = delivery.isAfterPickup ? custLoc : shopLoc;
          final dist = MapUtils.calculateDistanceKm(loc.latitude, loc.longitude, target.latitude, target.longitude);
          final eta = MapUtils.calculateEstimatedMinutes(dist);

          state = state.copyWith(
            riderLocation: loc,
            liveRiderPosition: riderPos,
            distanceKm: dist,
            estimatedMinutes: eta,
            routePoints: [riderPos, target],
          );
        }
      });
    }

    // Default route polyline before rider position is received
    if (state.liveRiderPosition == null) {
      final dist = MapUtils.calculateDistanceKm(shopLat, shopLng, custLat, custLng);
      state = state.copyWith(
        distanceKm: dist,
        estimatedMinutes: MapUtils.calculateEstimatedMinutes(dist),
        routePoints: [shopLoc, custLoc],
      );
    }
  }

  void _stopTrackingSubscriptions() {
    _riderLocSub?.cancel();
    _riderLocSub = null;
  }

  @override
  void dispose() {
    _orderSub?.cancel();
    _deliverySub?.cancel();
    _stopTrackingSubscriptions();
    super.dispose();
  }
}

final liveTrackingControllerProvider = StateNotifierProvider.family<LiveTrackingController, LiveTrackingState, String>((ref, orderId) {
  final repo = ref.watch(customerOrderRepositoryProvider);
  return LiveTrackingController(orderId: orderId, orderRepo: repo);
});
