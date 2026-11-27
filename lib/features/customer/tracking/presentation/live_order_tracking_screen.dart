import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:buylanka/core/constants/app_colors.dart';
import 'package:buylanka/core/location/map_utils.dart';
import 'package:buylanka/core/utils/currency_formatter.dart';
import 'package:buylanka/features/customer/reviews/presentation/add_review_dialog.dart';
import 'package:buylanka/features/customer/tracking/controllers/live_tracking_controller.dart';
import 'package:buylanka/models/order_model.dart';

class LiveOrderTrackingScreen extends ConsumerStatefulWidget {
  final String orderId;

  const LiveOrderTrackingScreen({super.key, required this.orderId});

  @override
  ConsumerState<LiveOrderTrackingScreen> createState() => _LiveOrderTrackingScreenState();
}

class _LiveOrderTrackingScreenState extends ConsumerState<LiveOrderTrackingScreen> {
  final MapController _mapController = MapController();

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(liveTrackingControllerProvider(widget.orderId));

    if (state.isLoading && state.order == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Live Order Tracking')),
        body: const Center(child: CircularProgressIndicator(color: AppColors.primary)),
      );
    }

    final order = state.order;
    if (order == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Live Order Tracking')),
        body: const Center(child: Text('Order record not found')),
      );
    }

    final delivery = state.delivery;
    final riderPos = state.liveRiderPosition;
    final shop = order.shop;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text('Order #${order.orderNumber}', style: const TextStyle(fontWeight: FontWeight.bold)),
        actions: [
          if (shop?.contactPhone?.isNotEmpty == true)
            IconButton(
              icon: const Icon(Icons.support_agent_rounded, color: AppColors.primary),
              tooltip: 'Contact Restaurant Support',
              onPressed: () => MapUtils.makePhoneCall(shop!.contactPhone!),
            ),
        ],
      ),
      body: Column(
        children: [
          // 1. Live OpenStreetMap Preview
          Expanded(
            flex: 5,
            child: Stack(
              children: [
                FlutterMap(
                  mapController: _mapController,
                  options: MapOptions(
                    initialCenter: riderPos ?? state.shopLocation,
                    initialZoom: 14.0,
                    minZoom: 6.0,
                    maxZoom: 18.0,
                  ),
                  children: [
                    TileLayer(
                      urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                      userAgentPackageName: 'com.yummy.app',
                    ),
                    if (state.routePoints.isNotEmpty)
                      PolylineLayer(
                        polylines: [
                          Polyline(
                            points: state.routePoints,
                            strokeWidth: 4.5,
                            color: AppColors.primary,
                            borderColor: Colors.white,
                            borderStrokeWidth: 1.5,
                          ),
                        ],
                      ),
                    MarkerLayer(
                      markers: [
                        // Restaurant Marker
                        Marker(
                          point: state.shopLocation,
                          width: 38,
                          height: 38,
                          child: Container(
                            decoration: BoxDecoration(
                              color: AppColors.primary,
                              shape: BoxShape.circle,
                              border: Border.all(color: Colors.white, width: 2),
                              boxShadow: const [BoxShadow(color: Colors.black26, blurRadius: 4)],
                            ),
                            child: const Icon(Icons.storefront_rounded, color: Colors.white, size: 20),
                          ),
                        ),

                        // Customer Destination Marker
                        Marker(
                          point: state.customerLocation,
                          width: 38,
                          height: 38,
                          child: Container(
                            decoration: BoxDecoration(
                              color: AppColors.secondary,
                              shape: BoxShape.circle,
                              border: Border.all(color: Colors.white, width: 2),
                              boxShadow: const [BoxShadow(color: Colors.black26, blurRadius: 4)],
                            ),
                            child: const Icon(Icons.location_on_rounded, color: Colors.white, size: 20),
                          ),
                        ),

                        // Rider Live Position Marker (if active)
                        if (riderPos != null)
                          Marker(
                            point: riderPos,
                            width: 48,
                            height: 48,
                            child: Container(
                              decoration: BoxDecoration(
                                color: AppColors.info,
                                shape: BoxShape.circle,
                                border: Border.all(color: Colors.white, width: 3),
                                boxShadow: [
                                  BoxShadow(
                                    color: AppColors.info.withValues(alpha: 0.45),
                                    blurRadius: 10,
                                    spreadRadius: 2,
                                  ),
                                ],
                              ),
                              child: const Icon(Icons.two_wheeler_rounded, color: Colors.white, size: 26),
                            ),
                          ),
                      ],
                    ),
                  ],
                ),

                // ETA & Distance Pill Overlay
                Positioned(
                  top: 14,
                  left: 16,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                    decoration: BoxDecoration(
                      color: Colors.black.withValues(alpha: 0.85),
                      borderRadius: BorderRadius.circular(20),
                      boxShadow: const [BoxShadow(color: Colors.black26, blurRadius: 8)],
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.timer_outlined, color: AppColors.secondary, size: 16),
                        const SizedBox(width: 6),
                        Text(
                          order.orderStatus == 'delivered'
                              ? 'Delivered'
                              : '~${state.estimatedMinutes} mins • ${state.distanceKm.toStringAsFixed(1)} km',
                          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12.5),
                        ),
                      ],
                    ),
                  ),
                ),

                // Recenter Button
                Positioned(
                  bottom: 14,
                  right: 16,
                  child: FloatingActionButton.small(
                    heroTag: 'customer_recenter',
                    backgroundColor: Colors.white,
                    foregroundColor: AppColors.primary,
                    onPressed: () {
                      _mapController.move(riderPos ?? state.shopLocation, 14.5);
                    },
                    child: const Icon(Icons.my_location_rounded),
                  ),
                ),
              ],
            ),
          ),

          // 2. Order Status Stepper & Rider Card
          Expanded(
            flex: 6,
            child: Container(
              color: Colors.white,
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(18),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Restaurant info header
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              shop?.name ?? 'Restaurant',
                              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              '${order.items.length} items • ${CurrencyFormatter.format(order.totalAmount)}',
                              style: const TextStyle(fontSize: 13, color: AppColors.textLight),
                            ),
                          ],
                        ),
                        if (order.orderStatus == 'delivered')
                          ElevatedButton.icon(
                            onPressed: () {
                              AddReviewDialog.show(context, orderId: order.id, shopId: order.shopId);
                            },
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.amber.shade700,
                              foregroundColor: Colors.white,
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                            ),
                            icon: const Icon(Icons.star_rounded, size: 16),
                            label: const Text('Review', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                          ),
                      ],
                    ),

                    const Divider(height: 24),

                    // Professional Rider Card (when assigned)
                    if (delivery != null && (delivery.rider != null || delivery.isAssigned || delivery.isActive)) ...[
                      _buildRiderCard(delivery),
                      const SizedBox(height: 18),
                    ],

                    // Order Progress Stepper
                    _buildProgressTimeline(order, delivery),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRiderCard(dynamic delivery) {
    final rider = delivery.rider;
    final profile = rider?.profile;
    final riderName = profile?.fullName ?? 'Delivery Partner';
    final riderPhone = profile?.phoneNumber ?? delivery.customerContactPhone ?? '';
    final vehicle = rider != null
        ? '${rider.vehicleType.toUpperCase()} • ${rider.vehicleModel ?? ''} (${rider.vehicleNumber})'
        : 'Assigned Driver';

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          // Rider Avatar / Photo
          ClipRRect(
            borderRadius: BorderRadius.circular(14),
            child: Container(
              width: 48,
              height: 48,
              color: AppColors.primaryLight,
              child: profile?.avatarUrl?.isNotEmpty == true
                  ? Image.network(
                      profile!.avatarUrl!,
                      fit: BoxFit.cover,
                      errorBuilder: (context, error, stackTrace) => const Icon(Icons.two_wheeler_rounded, color: AppColors.primary, size: 24),
                    )
                  : const Icon(Icons.two_wheeler_rounded, color: AppColors.primary, size: 24),
            ),
          ),
          const SizedBox(width: 12),
          // Rider & Vehicle Information
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Flexible(
                      child: Text(
                        riderName,
                        style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 14, color: AppColors.textPrimary),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    const SizedBox(width: 4),
                    const Icon(Icons.verified_rounded, size: 16, color: AppColors.primary),
                  ],
                ),
                const SizedBox(height: 3),
                Text(
                  vehicle,
                  style: const TextStyle(fontSize: 11.5, color: AppColors.textSecondary, fontWeight: FontWeight.w500),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
          // Call Rider Button
          if (riderPhone.isNotEmpty)
            Material(
              color: AppColors.successBg,
              borderRadius: BorderRadius.circular(12),
              child: InkWell(
                borderRadius: BorderRadius.circular(12),
                onTap: () => MapUtils.makePhoneCall(riderPhone),
                child: const Padding(
                  padding: EdgeInsets.all(10),
                  child: Icon(Icons.call_rounded, color: AppColors.success, size: 20),
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildProgressTimeline(OrderModel order, dynamic delivery) {
    final status = order.orderStatus.toLowerCase();
    final isDelivered = status == 'delivered';
    final isOnTheWay = delivery != null && delivery.isAfterPickup;
    final isReadyOrPicked = status == 'ready_for_pickup' || status == 'picked_up' || isOnTheWay || isDelivered;
    final isPreparing = status == 'preparing' || status == 'accepted' || isReadyOrPicked;
    final isPlaced = true;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Delivery Milestones',
          style: GoogleFonts.plusJakartaSans(fontSize: 14.5, fontWeight: FontWeight.w800, color: AppColors.textPrimary),
        ),
        const SizedBox(height: 14),
        _buildTimelineStep(
          title: 'Order Placed & Sent',
          subtitle: 'Restaurant has received your order',
          isDone: isPlaced,
          isActive: status == 'pending',
        ),
        _buildTimelineStep(
          title: 'Food in Preparation 👨‍🍳',
          subtitle: 'Kitchen is cooking and packing your meal',
          isDone: isPreparing,
          isActive: status == 'preparing' || status == 'accepted',
        ),
        _buildTimelineStep(
          title: 'Rider Heading to Destination 🚴',
          subtitle: isOnTheWay ? 'Food picked up • On the way to you' : 'Rider assigned • Heading to restaurant',
          isDone: isReadyOrPicked,
          isActive: isOnTheWay || status == 'going_to_pickup',
        ),
        _buildTimelineStep(
          title: 'Order Delivered 🎉',
          subtitle: 'Enjoy your delicious food!',
          isDone: isDelivered,
          isActive: isDelivered,
          isLast: true,
        ),
      ],
    );
  }

  Widget _buildTimelineStep({
    required String title,
    required String subtitle,
    required bool isDone,
    required bool isActive,
    bool isLast = false,
  }) {
    final iconColor = isDone ? AppColors.success : (isActive ? AppColors.primary : AppColors.textLight);

    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Column(
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: iconColor.withValues(alpha: 0.15),
                shape: BoxShape.circle,
              ),
              child: Icon(
                isDone ? Icons.check_circle_rounded : (isActive ? Icons.radio_button_checked : Icons.radio_button_unchecked),
                color: iconColor,
                size: 16,
              ),
            ),
            if (!isLast)
              Container(
                width: 2,
                height: 28,
                color: isDone ? AppColors.success.withValues(alpha: 0.5) : AppColors.border,
              ),
          ],
        ),
        const SizedBox(width: 14),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.bold,
                  color: isDone || isActive ? AppColors.textPrimary : AppColors.textLight,
                ),
              ),
              const SizedBox(height: 2),
              Text(subtitle, style: const TextStyle(fontSize: 11, color: AppColors.textLight)),
              const SizedBox(height: 10),
            ],
          ),
        ),
      ],
    );
  }
}
