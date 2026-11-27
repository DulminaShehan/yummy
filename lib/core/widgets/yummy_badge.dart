import 'package:flutter/material.dart';
import '../constants/app_colors.dart';

enum YummyBadgeType { success, warning, danger, info, neutral }

class YummyBadge extends StatelessWidget {
  final String label;
  final YummyBadgeType type;
  final IconData? icon;

  const YummyBadge({
    super.key,
    required this.label,
    this.type = YummyBadgeType.neutral,
    this.icon,
  });

  @override
  Widget build(BuildContext context) {
    Color bg;
    Color fg;
    BorderSide border = BorderSide.none;

    switch (type) {
      case YummyBadgeType.success:
        bg = AppColors.successBg;
        fg = AppColors.successText;
        border = const BorderSide(color: AppColors.successBorder);
        break;
      case YummyBadgeType.warning:
        bg = AppColors.warningBg;
        fg = AppColors.warning;
        break;
      case YummyBadgeType.danger:
        bg = AppColors.dangerBg;
        fg = AppColors.danger;
        border = const BorderSide(color: AppColors.errorBorder);
        break;
      case YummyBadgeType.info:
        bg = AppColors.infoBg;
        fg = AppColors.infoText;
        border = const BorderSide(color: AppColors.infoBorder);
        break;
      case YummyBadgeType.neutral:
        bg = AppColors.surfaceVariant;
        fg = AppColors.textSecondary;
        break;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3.5),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(8),
        border: border != BorderSide.none ? Border.all(color: border.color) : null,
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(icon, size: 12, color: fg),
            const SizedBox(width: 4),
          ],
          Text(
            label,
            style: TextStyle(
              color: fg,
              fontSize: 11,
              fontWeight: FontWeight.w700,
              letterSpacing: 0.2,
            ),
          ),
        ],
      ),
    );
  }
}
