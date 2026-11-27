import 'package:flutter/material.dart';
import '../constants/app_colors.dart';

enum YummyButtonVariant { primary, secondary, outline, danger, text }
enum YummyButtonSize { sm, md, lg }

class YummyButton extends StatelessWidget {
  final String text;
  final VoidCallback? onPressed;
  final bool isLoading;
  final YummyButtonVariant variant;
  final YummyButtonSize size;
  final IconData? leadingIcon;
  final IconData? trailingIcon;
  final double? width;
  final bool isFullWidth;
  final double borderRadius;

  const YummyButton({
    super.key,
    required this.text,
    this.onPressed,
    this.isLoading = false,
    this.variant = YummyButtonVariant.primary,
    this.size = YummyButtonSize.md,
    this.leadingIcon,
    this.trailingIcon,
    this.width,
    this.isFullWidth = false,
    this.borderRadius = 14,
  });

  @override
  Widget build(BuildContext context) {
    final double height;
    final EdgeInsets padding;
    final double fontSize;
    final double iconSize;

    switch (size) {
      case YummyButtonSize.sm:
        height = 38;
        padding = const EdgeInsets.symmetric(horizontal: 14);
        fontSize = 13;
        iconSize = 16;
        break;
      case YummyButtonSize.lg:
        height = 54;
        padding = const EdgeInsets.symmetric(horizontal: 24);
        fontSize = 16;
        iconSize = 20;
        break;
      case YummyButtonSize.md:
        height = 48;
        padding = const EdgeInsets.symmetric(horizontal: 20);
        fontSize = 14.5;
        iconSize = 18;
        break;
    }

    Color bgColor;
    Color fgColor;
    BorderSide borderSide = BorderSide.none;

    switch (variant) {
      case YummyButtonVariant.primary:
        bgColor = AppColors.primary;
        fgColor = Colors.white;
        break;
      case YummyButtonVariant.secondary:
        bgColor = AppColors.primaryLight;
        fgColor = AppColors.primary;
        break;
      case YummyButtonVariant.outline:
        bgColor = Colors.transparent;
        fgColor = AppColors.primary;
        borderSide = const BorderSide(color: AppColors.primary, width: 1.5);
        break;
      case YummyButtonVariant.danger:
        bgColor = AppColors.danger;
        fgColor = Colors.white;
        break;
      case YummyButtonVariant.text:
        bgColor = Colors.transparent;
        fgColor = AppColors.primary;
        break;
    }

    final effectiveOnPressed = isLoading ? null : onPressed;

    Widget content = Row(
      mainAxisSize: isFullWidth ? MainAxisSize.max : MainAxisSize.min,
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        if (isLoading)
          SizedBox(
            width: iconSize,
            height: iconSize,
            child: CircularProgressIndicator(
              strokeWidth: 2.2,
              valueColor: AlwaysStoppedAnimation<Color>(fgColor),
            ),
          )
        else ...[
          if (leadingIcon != null) ...[
            Icon(leadingIcon, size: iconSize, color: fgColor),
            const SizedBox(width: 8),
          ],
          Flexible(
            child: Text(
              text,
              style: TextStyle(
                color: fgColor,
                fontSize: fontSize,
                fontWeight: FontWeight.w700,
                letterSpacing: 0.1,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
          if (trailingIcon != null) ...[
            const SizedBox(width: 8),
            Icon(trailingIcon, size: iconSize, color: fgColor),
          ],
        ],
      ],
    );

    return SizedBox(
      width: isFullWidth ? double.infinity : width,
      height: height,
      child: ElevatedButton(
        onPressed: effectiveOnPressed,
        style: ElevatedButton.styleFrom(
          backgroundColor: bgColor,
          foregroundColor: fgColor,
          elevation: variant == YummyButtonVariant.primary ? 1.5 : 0,
          shadowColor: AppColors.primary.withValues(alpha: 0.25),
          padding: padding,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(borderRadius),
            side: borderSide,
          ),
        ),
        child: content,
      ),
    );
  }
}
