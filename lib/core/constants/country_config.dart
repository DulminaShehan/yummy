/// Represents an international country configuration supported by YUMMY.
class CountryConfig {
  final String code; // ISO 3166-1 alpha-2 (e.g. 'US', 'GB', 'AE', 'SG', 'LK')
  final String name;
  final String dialCode;
  final String currencyCode;
  final String currencySymbol;
  final double defaultLat;
  final double defaultLng;
  final List<String> regions;
  final List<String> supportedIdDocuments;

  const CountryConfig({
    required this.code,
    required this.name,
    required this.dialCode,
    required this.currencyCode,
    required this.currencySymbol,
    required this.defaultLat,
    required this.defaultLng,
    required this.regions,
    this.supportedIdDocuments = const [
      'National ID / Identity Card',
      'Passport',
      "Driver's License",
      'Residence / Work Permit',
    ],
  });

  @override
  bool operator ==(Object other) =>
      identical(this, other) || (other is CountryConfig && other.code == code);

  @override
  int get hashCode => code.hashCode;

  /// Comprehensive registry of supported global countries
  static const List<CountryConfig> supportedCountries = [
    CountryConfig(
      code: 'US',
      name: 'United States',
      dialCode: '+1',
      currencyCode: 'USD',
      currencySymbol: r'$',
      defaultLat: 40.7128,
      defaultLng: -74.0060,
      regions: [
        'California',
        'New York',
        'Texas',
        'Florida',
        'Illinois',
        'Washington',
        'Georgia',
        'North Carolina',
        'Colorado',
        'Massachusetts',
      ],
      supportedIdDocuments: [
        'State Driver\'s License',
        'US Passport',
        'State ID Card',
        'Permanent Resident Card (Green Card)',
      ],
    ),
    CountryConfig(
      code: 'GB',
      name: 'United Kingdom',
      dialCode: '+44',
      currencyCode: 'GBP',
      currencySymbol: '£',
      defaultLat: 51.5074,
      defaultLng: -0.1278,
      regions: [
        'Greater London',
        'West Midlands',
        'Greater Manchester',
        'West Yorkshire',
        'Scotland',
        'Wales',
      ],
      supportedIdDocuments: [
        'UK Driving Licence',
        'British Passport',
        'Biometric Residence Permit (BRP)',
      ],
    ),
    CountryConfig(
      code: 'AE',
      name: 'United Arab Emirates',
      dialCode: '+971',
      currencyCode: 'AED',
      currencySymbol: 'AED',
      defaultLat: 25.2048,
      defaultLng: 55.2708,
      regions: [
        'Dubai',
        'Abu Dhabi',
        'Sharjah',
        'Ajman',
        'Ras Al Khaimah',
        'Fujairah',
        'Umm Al Quwain',
      ],
      supportedIdDocuments: [
        'Emirates ID',
        'UAE Driving License',
        'Passport & Visa',
      ],
    ),
    CountryConfig(
      code: 'SG',
      name: 'Singapore',
      dialCode: '+65',
      currencyCode: 'SGD',
      currencySymbol: r'S$',
      defaultLat: 1.3521,
      defaultLng: 103.8198,
      regions: [
        'Central Region',
        'East Region',
        'North Region',
        'North-East Region',
        'West Region',
      ],
      supportedIdDocuments: [
        'NRIC (Singapore Citizen/PR)',
        'Employment Pass (EP)',
        'S Pass / Work Permit',
        'Singapore Driving Licence',
      ],
    ),
    CountryConfig(
      code: 'AU',
      name: 'Australia',
      dialCode: '+61',
      currencyCode: 'AUD',
      currencySymbol: r'A$',
      defaultLat: -33.8688,
      defaultLng: 151.2093,
      regions: [
        'New South Wales',
        'Victoria',
        'Queensland',
        'Western Australia',
        'South Australia',
        'Tasmania',
      ],
      supportedIdDocuments: [
        'Australian Driver Licence',
        'Australian Passport',
        'Proof of Age Card',
      ],
    ),
    CountryConfig(
      code: 'CA',
      name: 'Canada',
      dialCode: '+1',
      currencyCode: 'CAD',
      currencySymbol: r'C$',
      defaultLat: 43.6532,
      defaultLng: -79.3832,
      regions: [
        'Ontario',
        'Quebec',
        'British Columbia',
        'Alberta',
        'Manitoba',
        'Nova Scotia',
      ],
      supportedIdDocuments: [
        'Provincial Driver\'s Licence',
        'Canadian Passport',
        'Provincial Photo Card',
      ],
    ),
    CountryConfig(
      code: 'LK',
      name: 'Sri Lanka',
      dialCode: '+94',
      currencyCode: 'LKR',
      currencySymbol: 'Rs.',
      defaultLat: 6.9271,
      defaultLng: 79.8612,
      regions: [
        'Colombo',
        'Gampaha',
        'Kalutara',
        'Kandy',
        'Matale',
        'Nuwara Eliya',
        'Galle',
        'Matara',
        'Hambantota',
        'Jaffna',
        'Kilinochchi',
        'Mannar',
        'Vavuniya',
        'Mullaitivu',
        'Batticaloa',
        'Ampara',
        'Trincomalee',
        'Kurunegala',
        'Puttalam',
        'Anuradhapura',
        'Polonnaruwa',
        'Badulla',
        'Monaragala',
        'Ratnapura',
        'Kegalle',
      ],
      supportedIdDocuments: [
        'National Identity Card (NIC)',
        'Sri Lankan Passport',
        'Driving License',
      ],
    ),
  ];

  /// International baseline default (United States)
  static const CountryConfig defaultCountry = CountryConfig(
    code: 'US',
    name: 'United States',
    dialCode: '+1',
    currencyCode: 'USD',
    currencySymbol: r'$',
    defaultLat: 40.7128,
    defaultLng: -74.0060,
    regions: [
      'California',
      'New York',
      'Texas',
      'Florida',
      'Illinois',
      'Washington',
      'Georgia',
    ],
  );

  /// Find country configuration by ISO code
  static CountryConfig findByCode(String? code) {
    if (code == null || code.isEmpty) return defaultCountry;
    return supportedCountries.firstWhere(
      (c) => c.code.toUpperCase() == code.toUpperCase(),
      orElse: () => defaultCountry,
    );
  }

  /// Find country configuration by phone dial code
  static CountryConfig findByDialCode(String phone) {
    for (final country in supportedCountries) {
      if (phone.startsWith(country.dialCode)) {
        return country;
      }
    }
    return defaultCountry;
  }
}
