class AddressModel {
  final String id;
  final String customerId;
  final String label; // 'Home', 'Work', 'Other'
  final String recipientName;
  final String phoneNumber;
  final String streetAddress;
  final String city;
  final String? district; // Holds State / Province / Region / District
  final String? countryCode; // ISO 3166-1 alpha-2 (e.g. 'US', 'GB', 'AE', 'SG', 'LK')
  final String? postalCode;
  final double? latitude;
  final double? longitude;
  final String? deliveryInstructions;
  final bool isDefault;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  const AddressModel({
    required this.id,
    required this.customerId,
    this.label = 'Home',
    required this.recipientName,
    required this.phoneNumber,
    required this.streetAddress,
    required this.city,
    this.district,
    this.countryCode = 'US',
    this.postalCode,
    this.latitude,
    this.longitude,
    this.deliveryInstructions,
    this.isDefault = false,
    this.createdAt,
    this.updatedAt,
  });

  /// Formatted international address string for display
  String get fullAddressText {
    final parts = <String>[
      if (streetAddress.isNotEmpty) streetAddress,
      if (city.isNotEmpty) city,
      if (district != null && district!.isNotEmpty) district!,
      if (postalCode != null && postalCode!.isNotEmpty) postalCode!,
      if (countryCode != null && countryCode!.isNotEmpty && countryCode != 'US') countryCode!,
    ];
    return parts.isEmpty ? '$streetAddress, $city' : parts.join(', ');
  }

  factory AddressModel.fromJson(Map<String, dynamic> json) {
    return AddressModel(
      id: json['id'] as String,
      customerId: json['customer_id'] as String,
      label: json['label'] as String? ?? 'Home',
      recipientName: json['recipient_name'] as String? ?? 'Customer',
      phoneNumber: json['phone_number'] as String? ?? '',
      streetAddress: json['street_address'] as String? ?? '',
      city: json['city'] as String? ?? '',
      district: json['district'] as String?,
      countryCode: json['country_code'] as String? ?? 'US',
      postalCode: json['postal_code'] as String?,
      latitude: (json['latitude'] as num?)?.toDouble(),
      longitude: (json['longitude'] as num?)?.toDouble(),
      deliveryInstructions: json['delivery_instructions'] as String?,
      isDefault: (json['is_default'] as bool?) ?? false,
      createdAt: json['created_at'] != null ? DateTime.tryParse(json['created_at'].toString()) : null,
      updatedAt: json['updated_at'] != null ? DateTime.tryParse(json['updated_at'].toString()) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'customer_id': customerId,
      'label': label,
      'recipient_name': recipientName,
      'phone_number': phoneNumber,
      'street_address': streetAddress,
      'city': city,
      'district': district,
      'latitude': latitude,
      'longitude': longitude,
      'delivery_instructions': deliveryInstructions,
      'is_default': isDefault,
    };
  }

  AddressModel copyWith({
    String? label,
    String? recipientName,
    String? phoneNumber,
    String? streetAddress,
    String? city,
    String? district,
    String? countryCode,
    String? postalCode,
    double? latitude,
    double? longitude,
    String? deliveryInstructions,
    bool? isDefault,
  }) {
    return AddressModel(
      id: id,
      customerId: customerId,
      label: label ?? this.label,
      recipientName: recipientName ?? this.recipientName,
      phoneNumber: phoneNumber ?? this.phoneNumber,
      streetAddress: streetAddress ?? this.streetAddress,
      city: city ?? this.city,
      district: district ?? this.district,
      countryCode: countryCode ?? this.countryCode,
      postalCode: postalCode ?? this.postalCode,
      latitude: latitude ?? this.latitude,
      longitude: longitude ?? this.longitude,
      deliveryInstructions: deliveryInstructions ?? this.deliveryInstructions,
      isDefault: isDefault ?? this.isDefault,
      createdAt: createdAt,
      updatedAt: DateTime.now(),
    );
  }
}
