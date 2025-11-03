import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class LeadingBackButton extends StatelessWidget {
  final Color? color;
  const LeadingBackButton({super.key, this.color});

  @override
  Widget build(BuildContext context) {
    return IconButton(
      icon: Icon(Icons.arrow_back, color: color ?? Theme.of(context).iconTheme.color),
      onPressed: () async {
            // Capture what we need from the context before any async gaps
            final navigator = Navigator.of(context);
            final goRouter = GoRouter.of(context);

            // Try a normal Navigator pop first (works for pushed routes)
            final didPop = await navigator.maybePop();
            if (didPop) return;

            // If Navigator couldn't pop, try GoRouter's pop (covers some routing cases)
            try {
              goRouter.pop();
              return;
            } catch (_) {
              // ignore and fallback to home
            }

            // As a last resort, navigate to the home route
            goRouter.go('/home');
      },
    );
  }
}
