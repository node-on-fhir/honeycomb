// imports/accounts/client/pages/LoginPage.jsx

import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Box } from '@mui/material';
import { LoginForm } from '../components/LoginForm';
import WorkflowNavigation from '/imports/lib/WorkflowNavigation.js';
const { sanitizeReturnPath, appendReturnTo } = WorkflowNavigation;

// Card placement over the router area. ?align=left|center|right centers the card
// horizontally (⅙ / ½ / ⅚ of the width). ?valign=top|center|bottom sets the
// card's TOP EDGE on a fixed line and lets it grow DOWNWARD, so the tabs and
// inputs hold their position when the form gets taller (inline error, alert box,
// changed button) — only the area below expands. That's what keeps the inputs
// from jumping between steps.
//
// The line is a fixed % — never a height-dependent transform, which is what was
// redrawing the inputs. `bottom` sits at 50%: the card floats in the lower half
// with roughly the bottom ~20% of the window left open beneath a typical card,
// then grows down into that space (raise the % to hug lower, lower it to float
// higher). top/center sit near the top of their regions.
//
// Absolute, not grid: a 1fr grid row balloons to fit a tall card and reflows the
// page. Vertical is a fixed top edge (no Y translate); horizontal is centered.
const ALIGN_X = { left: '16.67%', center: '50%', right: '83.34%' };
const VALIGN_Y = { top: '0%', center: '33.34%', bottom: '50%' };

function resolvePlacement(value, map) {
  const key = String(value || '').toLowerCase();
  return map[key] || map.center;
}

export function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Route preservation: AuthGuard/NoAuthorizationPage thread the blocked
  // route here as ?returnTo=<encoded internal path>. searchParams.get()
  // already decoded once — sanitize the decoded value (internal paths only;
  // invalid/absent falls back to the home route).
  const returnTo = sanitizeReturnPath(searchParams.get('returnTo'));

  // Placement anchor points (default to dead-center when absent/invalid).
  const leftPct = resolvePlacement(searchParams.get('align'), ALIGN_X);
  const topPct = resolvePlacement(searchParams.get('valign'), VALIGN_Y);

  const handleSuccess = function() {
    // Redirect to the originally requested page after successful login,
    // or home when none was preserved
    navigate(returnTo || '/');
  };

  const handleSignupClick = function() {
    // Forward returnTo so the route survives a signin <-> signup bounce
    navigate(appendReturnTo('/register', returnTo));
  };

  const handleForgotPasswordClick = function() {
    // returnTo intentionally NOT forwarded: the reset flow round-trips
    // through email -> /reset-password/:token, so the param is lost anyway
    navigate('/forgot-password');
  };

  return (
    // No page-level bgcolor here: StyledMainRouter paints background.default and
    // (with the ambiance axis) any background image. height:100% claims the
    // router's bounded height (rules/ui/layout-patterns.md); the card is
    // absolutely placed and centered on the (leftPct, topPct) anchor so its
    // position is independent of its own height — no grid-row reflow, and
    // symmetric growth when the form gets taller.
    <Box sx={{ position: 'relative', height: '100%', overflow: 'auto', p: 2 }}>
      {/* Top-anchored vertically (top edge at topPct → grows downward),
          center-anchored horizontally (translateX -50%). On narrow screens force
          horizontal center so the card never runs off-edge; desktop uses the
          requested third. Width caps at 440px (or the viewport minus padding). */}
      <Box
        sx={{
          position: 'absolute',
          top: topPct,
          left: { xs: '50%', sm: leftPct },
          transform: 'translateX(-50%)',
          width: 'min(440px, calc(100vw - 32px))'
        }}
      >
        <LoginForm
          onSuccess={handleSuccess}
          onSignupClick={handleSignupClick}
          onForgotPasswordClick={handleForgotPasswordClick}
        />
      </Box>
    </Box>
  );
}
